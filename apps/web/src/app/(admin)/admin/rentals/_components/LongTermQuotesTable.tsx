'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { getAdminLeads, apiFetch, getVehicleAvailability } from '@/lib/api';
import { format, areIntervalsOverlapping } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconMessageCircle, IconFileText, IconEye, IconSearch, IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';
import type { Lead } from '@/types/api.types';

const parseLeadMessage = (message: string | null) => {
  if (!message) return null;
  const match = message.match(/from (.*?) to (.*?) \((.*?) day/) || message.match(/dari (.*?) sampai (.*?) \((.*?) hari/);
  if (match) {
    return {
      startDate: match[1],
      endDate: match[2],
      days: parseInt(match[3], 10) || 0
    };
  }
  return null;
};

export default function LongTermQuotesTable() {
  const { accessToken } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dialog States
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [wonDialogOpen, setWonDialogOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [sheetOpenId, setSheetOpenId] = useState<number | null>(null);
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [unavailableIntervals, setUnavailableIntervals] = useState<Array<{ start: Date; end: Date }>>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  useEffect(() => {
    async function fetchAvailability() {
      if (!wonDialogOpen || !selectedLead?.vehicleId) {
        setUnavailableIntervals([]);
        return;
      }
      setAvailabilityLoading(true);
      try {
        const res = await getVehicleAvailability(selectedLead.vehicleId);
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
  }, [wonDialogOpen, selectedLead]);

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

  const fetchLeads = useCallback(async (overrideSearch?: string, overrideStatus?: string) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { type: 'LONG_TERM_QUOTE', limit: 100 };
      const currentSearch = overrideSearch !== undefined ? overrideSearch : search;
      const currentStatus = overrideStatus !== undefined ? overrideStatus : status;
      if (currentSearch) params.search = currentSearch;
      if (currentStatus) params.status = currentStatus;
      const res = await getAdminLeads(params, accessToken);
      setLeads(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, search, status]);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleClear = () => {
    setSearch('');
    setStatus('');
    setCurrentPage(1);
    fetchLeads('', '');
  };

  const handleStatusChange = async (id: number, newStatus: string, payload: Record<string, unknown> = {}) => {
    if (!accessToken) return;
    try {
      await apiFetch(`/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, ...payload }),
        token: accessToken
      });
      Swal.fire({ title: 'Status Updated', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      fetchLeads();
      setWonDialogOpen(false);
      setLostDialogOpen(false);
      setSheetOpenId(null);
      setDateRange({ from: undefined, to: undefined });
      setNotes('');
      setSelectedLeadId(null);
    } catch (err: unknown) {
      Swal.fire('Failed', (err as Error).message || 'Failed to update status', 'error');
    }
  };

  const getWhatsAppLink = (lead: Lead) => {
    const phone = lead.customerPhone.replace(/[^0-9]/g, '');
    const formattedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    const vehicleName = lead.vehicle ? `${lead.vehicle.make} ${lead.vehicle.model}` : 'kendaraan';
    
    // Parse the message format: "Ingin sewa dari 12 Jun 2026 09:00 sampai 15 Jun 2026 09:00 (3 hari)."
    let parsedMessage = '';
    const match = lead.message?.match(/dari (.*?) sampai (.*?) \((.*?) hari\)/) || lead.message?.match(/from (.*?) to (.*?) \((.*?) days\)/);
    if (match) {
      const startDateFormatted = match[1];
      const endDateFormatted = match[2];
      const totalDays = match[3];
      parsedMessage = ` untuk ${totalDays} hari (dari tanggal ${startDateFormatted} hingga ${endDateFormatted})`;
    } else {
      parsedMessage = lead.message ? ` (${lead.message})` : '';
    }

    const message = `Halo ${lead.customerName}, terkait pengajuan penawaran sewa ${vehicleName}${parsedMessage}, berikut adalah informasi lebih lanjut dari Soulani Auto Garage...`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return <div className="py-8 text-center text-slate-500 animate-pulse">Loading quote data...</div>;
  }

  const totalPages = Math.ceil(leads.length / pageSize);
  const paginatedLeads = leads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">New</Badge>;
      case 'CONTACTED': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Contacted</Badge>;
      case 'NEGOTIATING': return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Negotiating</Badge>;
      case 'WON': return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Won</Badge>;
      case 'LOST': return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Lost</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <form onSubmit={handleSearch} className="flex-1 w-full">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Search Quote</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white pl-9"
            />
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <button type="submit" className="hidden">Submit</button>
          </div>
        </form>

        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
          <Select value={status || 'ALL'} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setCurrentPage(1); }}>
            <SelectTrigger className="bg-white text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
              <SelectItem value="WON">Won</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-none">
          <Button type="button" variant="outline" onClick={handleClear} className="w-full md:w-auto">
            Clear
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-800">Quote Ref</TableHead>
                <TableHead className="font-semibold text-slate-800">Request Date</TableHead>
                <TableHead className="font-semibold text-slate-800">Customer</TableHead>
                <TableHead className="font-semibold text-slate-800">Vehicle</TableHead>
                <TableHead className="font-semibold text-slate-800">Proposed Period</TableHead>
                <TableHead className="font-semibold text-slate-800">Status</TableHead>
                <TableHead className="font-semibold text-slate-800 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 bg-white font-medium">
                    No long-term quote requests at this time.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLeads.map((lead) => {
                  const parsed = parseLeadMessage(lead.message);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium text-slate-900">
                        {lead.leadReferenceId || `#${lead.id}`}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-slate-600">
                        {format(new Date(lead.createdAt), 'dd MMM yyyy, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-slate-900">{lead.customerName}</div>
                        <div className="text-xs text-slate-500">{lead.customerPhone}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.vehicle ? `${lead.vehicle.make} ${lead.vehicle.model}` : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {parsed ? (
                          <>
                            <div className="whitespace-nowrap">{parsed.startDate}</div>
                            <div className="text-xs text-slate-400">to {parsed.endDate} ({parsed.days} days)</div>
                          </>
                        ) : (
                          <div className="text-slate-400 italic">No period specified</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(lead.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Sheet
                          open={sheetOpenId === lead.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setSheetOpenId(lead.id);
                            } else {
                              if (wonDialogOpen || lostDialogOpen) return;
                              setSheetOpenId(null);
                            }
                          }}
                        >
                          <SheetTrigger render={<Button variant="outline" size="sm" className="gap-2 text-xs h-8" />}>
                            <IconEye size={14} /> Details
                          </SheetTrigger>
                          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6">
                            <SheetHeader className="mb-6">
                              <SheetTitle>Quote Details {lead.leadReferenceId || `#${lead.id}`}</SheetTitle>
                              <SheetDescription>Long-term rental lead management and customer information.</SheetDescription>
                            </SheetHeader>

                            <div className="space-y-6">
                              {/* Current Status */}
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Lead Status</p>
                                {getStatusBadge(lead.status)}
                              </div>

                              {/* Customer Information */}
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                  <IconFileText size={16} className="text-slate-500" /> Customer Data
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-slate-500">Full Name</p>
                                    <p className="font-medium text-slate-900">{lead.customerName}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">WhatsApp Number</p>
                                    <p className="font-medium text-slate-900">{lead.customerPhone}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-slate-500">Email Address</p>
                                    <p className="font-medium text-slate-900">{lead.customerEmail || '-'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Proposed Rental Details */}
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                  <IconFileText size={16} className="text-slate-500" /> Proposed Rental Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="col-span-2">
                                    <p className="text-slate-500">Vehicle Interested</p>
                                    <p className="font-medium text-slate-900">
                                      {lead.vehicle ? `${lead.vehicle.make} ${lead.vehicle.model} (${lead.vehicle.year})` : '-'}
                                    </p>
                                  </div>
                                  {parsed ? (
                                    <>
                                      <div>
                                        <p className="text-slate-500">Proposed Pickup Date</p>
                                        <p className="font-medium text-slate-900">{parsed.startDate}</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500">Proposed Return Date</p>
                                        <p className="font-medium text-slate-900">{parsed.endDate}</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500">Duration</p>
                                        <p className="font-medium text-slate-900">{parsed.days} Days</p>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="col-span-2">
                                      <p className="text-slate-500">Proposed Period</p>
                                      <p className="text-slate-500 italic">No period specified in message.</p>
                                    </div>
                                  )}
                                  {lead.message && (
                                    <div className="col-span-2">
                                      <p className="text-slate-500">Customer Message / Note</p>
                                      <div className="bg-white p-3 rounded border border-slate-200 mt-1 italic text-slate-700">
                                        {lead.message}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Follow-up Actions */}
                              <div>
                                <h4 className="font-medium text-slate-900 mb-3">Follow-up Actions</h4>
                                <a
                                  href={getWhatsAppLink(lead)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white py-2.5 px-4 rounded-lg font-medium transition"
                                >
                                  <IconMessageCircle size={18} />
                                  Follow Up via WhatsApp
                                </a>
                                <p className="text-xs text-slate-500 mt-2 text-center">This link will open WhatsApp Web/App with a pre-filled message template.</p>
                              </div>

                              {/* Quick Pipeline Status Update */}
                              <div className="pt-6 border-t border-slate-200">
                                <h4 className="font-medium text-slate-900 mb-3">Quick Actions (Pipeline Update)</h4>
                                <div className="flex flex-wrap gap-3">
                                  <Button
                                    variant="outline"
                                    className="text-amber-600 border-amber-200 hover:bg-amber-50 px-4 py-2 h-auto text-sm shrink-0"
                                    onClick={() => handleStatusChange(lead.id, 'CONTACTED')}
                                  >
                                    Mark Contacted
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="text-purple-600 border-purple-200 hover:bg-purple-50 px-4 py-2 h-auto text-sm shrink-0"
                                    onClick={() => handleStatusChange(lead.id, 'NEGOTIATING')}
                                  >
                                    Mark Negotiating
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-4 py-2 h-auto text-sm shrink-0"
                                    onClick={() => {
                                      setSelectedLeadId(lead.id);
                                      if (parsed) {
                                        const dtStart = new Date(parsed.startDate);
                                        const dtEnd = new Date(parsed.endDate);
                                        const from = !isNaN(dtStart.getTime()) ? dtStart : undefined;
                                        const to = !isNaN(dtEnd.getTime()) ? dtEnd : undefined;
                                        setDateRange({ from, to });
                                        if (from) {
                                          const h = String(from.getHours()).padStart(2, '0');
                                          setStartTime(`${h}:00`);
                                        } else {
                                          setStartTime('09:00');
                                        }
                                        if (to) {
                                          const h = String(to.getHours()).padStart(2, '0');
                                          setEndTime(`${h}:00`);
                                        } else {
                                          setEndTime('09:00');
                                        }
                                      } else {
                                        setDateRange({ from: undefined, to: undefined });
                                        setStartTime('09:00');
                                        setEndTime('09:00');
                                      }
                                      setWonDialogOpen(true);
                                    }}
                                  >
                                    Mark Won
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 px-4 py-2 h-auto text-sm shrink-0"
                                    onClick={() => {
                                      setSelectedLeadId(lead.id);
                                      setLostDialogOpen(true);
                                    }}
                                  >
                                    Mark Lost
                                  </Button>
                                </div>

                                <div className="mt-4">
                                  <p className="text-xs text-slate-500 mb-2">Custom Status Update:</p>
                                  <Select
                                    defaultValue={lead.status}
                                    onValueChange={(val) => handleStatusChange(lead.id, val)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Update Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NEW">New</SelectItem>
                                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                                      <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                            </div>
                          </SheetContent>
                        </Sheet>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, leads.length)}</span> of <span className="font-medium">{leads.length}</span> results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2"
              >
                <IconChevronLeft size={16} />
              </Button>
              <div className="flex items-center justify-center px-3 text-sm font-medium">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2"
              >
                <IconChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={wonDialogOpen} onOpenChange={(open) => {
        if (!open) return;
        setWonDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Lead as Won</DialogTitle>
            <DialogDescription>Confirm the booking dates and add any administrative notes. This will lock the vehicle and create a rental booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Jam Pengambilan</Label>
                <Select value={startTime} onValueChange={setStartTime} disabled={!dateRange.from}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeOptions(dateRange.from, false).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Jam Pengembalian</Label>
                <Select value={endTime} onValueChange={setEndTime} disabled={!dateRange.to}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeOptions(dateRange.to, true).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Internal Notes (Optional)</Label>
              <Textarea placeholder="Booking details, pricing agreements, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWonDialogOpen(false)}>Cancel</Button>
            <Button 
              disabled={!dateRange.from || !dateRange.to || availabilityLoading}
              onClick={() => {
                if (!selectedLeadId || !dateRange.from || !dateRange.to) return;
                
                if (checkOverlap()) {
                  Swal.fire('Tidak Tersedia', 'Waktu yang dipilih bertabrakan dengan jadwal penyewaan lain atau periode pemeliharaan.', 'error');
                  return;
                }
                
                const dates = getExactDateTimes();
                if (!dates) return;
                
                handleStatusChange(selectedLeadId, 'WON', { 
                  startDate: dates.exactStart.toISOString(), 
                  endDate: dates.exactEnd.toISOString(), 
                  notes 
                });
              }}
            >
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lostDialogOpen} onOpenChange={(open) => {
        if (!open) return;
        setLostDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Lead as Lost</DialogTitle>
            <DialogDescription>Please provide a reason why this lead was lost. This is required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason / Notes</Label>
              <Textarea placeholder="Customer found a better price, vehicle unavailable, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={!notes.trim()} onClick={() => selectedLeadId && handleStatusChange(selectedLeadId, 'LOST', { notes })}>Mark as Lost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
