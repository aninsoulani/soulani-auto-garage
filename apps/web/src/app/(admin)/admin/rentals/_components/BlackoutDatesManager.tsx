'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { getVehicles, getVehicleBlackoutDates, addBlackoutDate, removeBlackoutDate, getVehicleAvailability } from '@/lib/api';
import type { Vehicle, BlackoutDate } from '@/types/api.types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { enUS } from 'date-fns/locale';
import { IconTrash } from '@tabler/icons-react';
import Swal from 'sweetalert2';

export default function BlackoutDatesManager() {
  const { accessToken } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [date, setDate] = useState<{ from: Date | undefined; to?: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [unavailableIntervals, setUnavailableIntervals] = useState<Array<{ start: Date; end: Date }>>([]);
  const [reason, setReason] = useState('MAINTENANCE');

  const timeOptions = Array.from({ length: 24 }).map((_, i) => `${String(i).padStart(2, '0')}:00`);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await getVehicles({ limit: 200, listingType: 'RENTAL' });
        setVehicles(res.data);
      } catch (err) {
        console.error('Failed to load vehicles', err);
      }
    }
    fetchVehicles();
  }, []);

  const fetchBlackoutDates = async (vid: number) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const dates = await getVehicleBlackoutDates(vid, accessToken);
      setBlackoutDates(dates || []);
      
      const res = await getVehicleAvailability(vid);
      const parsedIntervals = res.unavailableIntervals.map((i: { start: string, end: string }) => ({
        start: new Date(i.start),
        end: new Date(i.end)
      }));
      setUnavailableIntervals(parsedIntervals);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch availability', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDay = new Date(day);
    checkDay.setHours(0, 0, 0, 0);
    
    if (checkDay < today) return true;
    
    const startOptions = getAvailableTimeOptions(day, false);
    const endOptions = getAvailableTimeOptions(day, true);
    
    return startOptions.length === 0 && endOptions.length === 0;
  };

  const isDatePartiallyBooked = (day: Date) => {
    if (isDateDisabled(day)) return false;
    
    const targetDayStart = new Date(day);
    targetDayStart.setHours(0,0,0,0);
    const targetDayEnd = new Date(day);
    targetDayEnd.setHours(23,59,59,999);
    
    const overlapping = unavailableIntervals.filter(u => 
      u.start <= targetDayEnd && u.end >= targetDayStart
    );
    
    return overlapping.length > 0;
  };

  const getAvailableTimeOptions = (selectedDate: Date | undefined, isEnd: boolean) => {
    if (!selectedDate) return timeOptions;
    
    const targetDayStart = new Date(selectedDate);
    targetDayStart.setHours(0,0,0,0);
    const targetDayEnd = new Date(selectedDate);
    targetDayEnd.setHours(23,59,59,999);
    
    const overlapping = unavailableIntervals.filter(u => 
      u.start <= targetDayEnd && u.end >= targetDayStart
    );
    
    if (overlapping.length === 0) return timeOptions;
  
    return timeOptions.filter(timeStr => {
      const [h, m] = timeStr.split(':').map(Number);
      const exactTime = new Date(selectedDate);
      exactTime.setHours(h, m, 0, 0);
      
      for (const u of overlapping) {
        if (isEnd) {
          if (exactTime > u.start && exactTime <= u.end) return false;
        } else {
          if (exactTime >= u.start && exactTime < u.end) return false;
        }
      }
      return true;
    });
  };

  const handleVehicleSelect = (val: string) => {
    setSelectedVehicleId(val);
    if (val) {
      fetchBlackoutDates(Number(val));
    } else {
      setBlackoutDates([]);
      setUnavailableIntervals([]);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !date.from || !date.to || !accessToken) return;
    
    try {
      const startStr = format(date.from, 'yyyy-MM-dd');
      const endStr = format(date.to, 'yyyy-MM-dd');
      
      const startObj = new Date(`${startStr}T${startTime}:00`);
      const endObj = new Date(`${endStr}T${endTime}:00`);

      await addBlackoutDate(Number(selectedVehicleId), { 
        startDate: startObj.toISOString(), 
        endDate: endObj.toISOString(), 
        reason 
      }, accessToken);
      
      Swal.fire({ title: 'Successfully added', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      setDate({ from: undefined, to: undefined });
      setStartTime('09:00');
      setEndTime('09:00');
      fetchBlackoutDates(Number(selectedVehicleId));
    } catch (err: unknown) {
      Swal.fire('Failed', (err as Error).message || 'Failed to add blackout date', 'error');
    }
  };

  const handleRemove = async (id: number) => {
    if (!selectedVehicleId || !accessToken) return;
    
    const result = await Swal.fire({
      title: 'Delete blackout date?',
      text: 'This date will be available for rental again.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        await removeBlackoutDate(Number(selectedVehicleId), id, accessToken);
        Swal.fire({ title: 'Deleted', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        fetchBlackoutDates(Number(selectedVehicleId));
      } catch (err: unknown) {
        Swal.fire('Failed', (err as Error).message || 'Failed to delete', 'error');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar: Vehicle Selector & Add Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Select Vehicle</h3>
          <Select value={selectedVehicleId} onValueChange={handleVehicleSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Select Vehicle --" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.make} {v.model} ({v.plateNumber || 'No Plate'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVehicleId && (
          <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 mb-2">Add Date Block</h3>
            <div className="flex justify-center border rounded-lg p-2 bg-slate-50 mb-4">
              <Calendar
                mode="range"
                selected={date}
                onSelect={(range: import('react-day-picker').DateRange | undefined) => setDate({ from: range?.from, to: range?.to })}
                disabled={isDateDisabled}
                modifiers={{ partiallyBooked: isDatePartiallyBooked }}
                modifiersClassNames={{ partiallyBooked: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-orange-500 after:rounded-full relative" }}
                locale={enUS}
                className="bg-white rounded-md shadow-sm"
                numberOfMonths={1}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Start Time</label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeOptions(date.from, false).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">End Time</label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeOptions(date.to, true).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">Maintenance / Repair</SelectItem>
                  <SelectItem value="ADMIN_BLOCK">Admin Block</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800">
              Block Date
            </Button>
          </form>
        )}
      </div>

      {/* Main Table */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {selectedVehicleId ? (
            loading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading data...</div>
            ) : blackoutDates.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p>No blackout dates for this vehicle.</p>
                <p className="text-sm mt-2">Vehicle is available for rental.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-800">Start Date</TableHead>
                    <TableHead className="font-semibold text-slate-800">End Date</TableHead>
                    <TableHead className="font-semibold text-slate-800">Reason</TableHead>
                    <TableHead className="font-semibold text-slate-800 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blackoutDates.map((date) => (
                    <TableRow key={date.id}>
                      <TableCell className="font-medium text-slate-900">
                        {format(new Date(date.startDate), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {format(new Date(date.endDate), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {date.reason === 'MAINTENANCE' ? 'Maintenance' : 'Admin Block'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemove(date.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <IconTrash size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="p-12 text-center text-slate-500">
              Please select a vehicle from the left panel first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
