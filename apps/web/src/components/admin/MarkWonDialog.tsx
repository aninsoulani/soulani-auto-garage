'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, areIntervalsOverlapping } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { IconCalendar } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { getVehicleAvailability } from '@/lib/api';
import Swal from 'sweetalert2';
import { Lead } from '@/types/api.types';

interface MarkWonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onConfirm: (payload: { startDate: string; endDate: string; notes: string }) => void;
  onCancel: () => void;
}

export function MarkWonDialog({ open, onOpenChange, lead, onConfirm, onCancel }: MarkWonDialogProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [unavailableIntervals, setUnavailableIntervals] = useState<Array<{ start: Date; end: Date }>>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Is it a rental? We only enforce dates for LONG_TERM_QUOTE and RENTAL_INQUIRY
  const isRental = lead?.type === 'LONG_TERM_QUOTE' || lead?.type === 'RENTAL_INQUIRY';

  // Initialize dates from lead message if available
  useEffect(() => {
    if (open && lead && isRental && lead.message) {
      const match = lead.message.match(/dari (.*?) sampai (.*?) \((.*?) hari\)/) || lead.message.match(/from (.*?) to (.*?) \((.*?) days\)/);
      if (match) {
        const dtStart = new Date(match[1]);
        const dtEnd = new Date(match[2]);
        const from = !isNaN(dtStart.getTime()) ? dtStart : undefined;
        const to = !isNaN(dtEnd.getTime()) ? dtEnd : undefined;
        setDateRange({ from, to });
        if (from) setStartTime(`${String(from.getHours()).padStart(2, '0')}:00`);
        if (to) setEndTime(`${String(to.getHours()).padStart(2, '0')}:00`);
      } else {
        setDateRange({ from: undefined, to: undefined });
        setStartTime('09:00');
        setEndTime('09:00');
      }
      setNotes('');
    }
  }, [open, lead, isRental]);

  useEffect(() => {
    async function fetchAvailability() {
      if (!open || !lead?.vehicleId || !isRental) {
        setUnavailableIntervals([]);
        return;
      }
      setAvailabilityLoading(true);
      try {
        const res = await getVehicleAvailability(lead.vehicleId);
        const parsedIntervals = res.unavailableIntervals.map((i: { start: string, end: string }) => ({
          start: new Date(i.start),
          end: new Date(i.end)
        }));
        setUnavailableIntervals(parsedIntervals);
      } catch (err: unknown) {
        console.error('Failed to fetch availability', err);
      } finally {
        setAvailabilityLoading(false);
      }
    }
    fetchAvailability();
  }, [open, lead, isRental]);

  const timeOptions = Array.from({ length: 24 }).map((_, i) => `${String(i).padStart(2, '0')}:00`);

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

  const getExactDateTimes = () => {
    if (!dateRange.from || !dateRange.to) return null;
    const startStr = format(dateRange.from, 'yyyy-MM-dd');
    const endStr = format(dateRange.to, 'yyyy-MM-dd');
    
    const exactStart = new Date(`${startStr}T${startTime}:00`);
    const exactEnd = new Date(`${endStr}T${endTime}:00`);
    
    return { exactStart, exactEnd };
  };

  const checkOverlap = () => {
    const dates = getExactDateTimes();
    if (!dates) return false;
    
    const { exactStart, exactEnd } = dates;

    for (const u of unavailableIntervals) {
      if (areIntervalsOverlapping(
        { start: u.start, end: u.end },
        { start: exactStart, end: exactEnd },
        { inclusive: false }
      )) {
        return true;
      }
    }
    return false;
  };

  const handleConfirm = () => {
    if (isRental) {
      if (!dateRange.from || !dateRange.to) return;
      if (checkOverlap()) {
        Swal.fire('Not Available', 'The selected time conflicts with another rental or maintenance period.', 'error');
        return;
      }
      const dates = getExactDateTimes();
      if (!dates) return;
      onConfirm({ startDate: dates.exactStart.toISOString(), endDate: dates.exactEnd.toISOString(), notes });
    } else {
      // For sales leads, just pass the notes
      onConfirm({ startDate: '', endDate: '', notes });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) onCancel();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Lead as Won</DialogTitle>
          <DialogDescription>
            {isRental 
              ? "Confirm the booking dates and add any administrative notes. This will lock the vehicle and create a rental booking."
              : "Confirm winning this lead. You can add any final administrative notes."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          
          {isRental && (
            <>
              <div className="space-y-2">
                <Label>Rental Period</Label>
                <Popover>
                  <PopoverTrigger 
                    className={cn(
                      'flex h-10 w-full items-center justify-start rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-normal transition-colors hover:bg-slate-100 hover:text-slate-900',
                      !dateRange.from && 'text-slate-500'
                    )}
                  >
                    <IconCalendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} {startTime} - {format(dateRange.to, 'LLL dd, y')} {endTime}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Select date range</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(val) => setDateRange(val || { from: undefined, to: undefined })}
                      disabled={isDateDisabled}
                      modifiers={{ partiallyBooked: isDatePartiallyBooked }}
                      modifiersClassNames={{ partiallyBooked: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-orange-500 after:rounded-full relative" }}
                      locale={idLocale}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Pickup Time</Label>
                  <Select value={startTime} onValueChange={setStartTime} disabled={!dateRange.from}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTimeOptions(dateRange.from, false).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Return Time</Label>
                  <Select value={endTime} onValueChange={setEndTime} disabled={!dateRange.to}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTimeOptions(dateRange.to, true).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Internal Notes (Optional)</Label>
            <Textarea placeholder="Booking details, pricing agreements, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            disabled={(isRental && (!dateRange.from || !dateRange.to)) || availabilityLoading}
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
