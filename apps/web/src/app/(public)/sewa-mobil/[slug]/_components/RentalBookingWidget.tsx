'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { getVehicleAvailability, submitLead } from '@/lib/api';
import type { Vehicle } from '@/types/api.types';
import { useRouter } from 'next/navigation';
import { IconBrandWhatsapp, IconCalendarEvent, IconCircleCheck } from '@tabler/icons-react';
import Swal from 'sweetalert2';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { areIntervalsOverlapping } from 'date-fns';

const quoteSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Nomor WhatsApp tidak valid (contoh: 0812...)"),
});
type QuoteFormValues = z.infer<typeof quoteSchema>;

export default function RentalBookingWidget({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [date, setDate] = useState<{ from: Date | undefined; to?: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [unavailableIntervals, setUnavailableIntervals] = useState<Array<{ start: Date; end: Date }>>([]);
  const [loading, setLoading] = useState(true);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { name: '', phone: '' }
  });

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

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await getVehicleAvailability(vehicle.id);
        const parsedIntervals = res.unavailableIntervals.map((i: { start: string, end: string }) => ({
          start: new Date(i.start),
          end: new Date(i.end)
        }));
        setUnavailableIntervals(parsedIntervals);
      } catch (err: unknown) {
        console.error('Failed to fetch availability', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, [vehicle.id]);

  const isDateDisabled = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDay = new Date(day);
    checkDay.setHours(0, 0, 0, 0);
    
    if (checkDay < today) return true;

    // Check if the union of unavailable intervals covers the entire 24h
    const startOptions = getAvailableTimeOptions(day, false);
    const endOptions = getAvailableTimeOptions(day, true);
    
    // If there are absolutely no start and end options available, the day is fully disabled.
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
    if (!date.from || !date.to) return null;
    const startStr = format(date.from, 'yyyy-MM-dd');
    const endStr = format(date.to, 'yyyy-MM-dd');
    
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

  const handleContinue = () => {
    const dates = getExactDateTimes();
    if (!dates) return;
    
    const durationMs = dates.exactEnd.getTime() - dates.exactStart.getTime();
    if (durationMs < 24 * 60 * 60 * 1000) {
      Swal.fire('Gagal', 'Minimal durasi sewa adalah 24 jam.', 'error');
      return;
    }

    if (checkOverlap()) {
      Swal.fire('Tidak Tersedia', 'Waktu yang dipilih bertabrakan dengan jadwal penyewaan lain atau periode pemeliharaan.', 'error');
      return;
    }
    setIsNavigating(true);
    router.push(`/sewa-mobil/${vehicle.slug}/checkout?start=${dates.exactStart.toISOString()}&end=${dates.exactEnd.toISOString()}`);
  };

  const onQuoteSubmit = async (values: QuoteFormValues) => {
    const dates = getExactDateTimes();
    if (!dates) return;

    const durationMs = dates.exactEnd.getTime() - dates.exactStart.getTime();
    if (durationMs < 24 * 60 * 60 * 1000) {
      Swal.fire('Gagal', 'Minimal durasi sewa adalah 24 jam.', 'error');
      return;
    }

    if (checkOverlap()) {
      Swal.fire('Tidak Tersedia', 'Waktu yang dipilih bertabrakan dengan jadwal penyewaan lain.', 'error');
      return;
    }

    setSubmittingLead(true);
    try {
      const durationHours = durationMs / (1000 * 60 * 60);
      const durationDays = Math.ceil(durationHours / 24);
      const res = await submitLead({
        vehicleId: vehicle.id,
        type: 'LONG_TERM_QUOTE',
        customerName: values.name,
        customerPhone: values.phone,
        message: `Want to rent from ${format(dates.exactStart, 'dd MMM yyyy HH:mm')} to ${format(dates.exactEnd, 'dd MMM yyyy HH:mm')} (${durationDays} days).`
      });
      setIsQuoteModalOpen(false);
      window.open(res.whatsappRedirectUrl, '_blank');
    } catch (err: unknown) {
      console.error(err);
      Swal.fire('Error', 'Gagal mengirim permintaan. Silakan coba lagi.', 'error');
    } finally {
      setSubmittingLead(false);
    }
  };

  const durationDays = () => {
    const dates = getExactDateTimes();
    if (!dates) return 0;
    const ms = dates.exactEnd.getTime() - dates.exactStart.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  };
  const isLongTerm = durationDays() > 7;

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-24">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <IconCalendarEvent size={20} className="text-blue-600" />
          Pilih Tanggal Sewa
        </h3>
        
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400 animate-pulse">
            Memuat ketersediaan...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center border rounded-lg p-2 bg-slate-50">
              <Calendar
                mode="range"
                selected={date}
                onSelect={(range: import('react-day-picker').DateRange | undefined) => setDate({ from: range?.from, to: range?.to })}
                disabled={isDateDisabled}
                modifiers={{ partiallyBooked: isDatePartiallyBooked }}
                modifiersClassNames={{ partiallyBooked: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-orange-500 after:rounded-full relative" }}
                locale={idLocale}
                className="bg-white rounded-md shadow-sm"
                numberOfMonths={1}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Jam Pengambilan</label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeOptions(date.from, false).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Jam Pengembalian</label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeOptions(date.to, true).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          {date.from && date.to ? (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border text-center">
                Durasi sewa dihitung per 24 jam. Kami menyediakan waktu 1 jam untuk persiapan kendaraan antar penyewa.
              </div>
              <div className="flex justify-between items-center text-sm p-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-100">
                <span className="font-medium">Durasi Sewa:</span>
                <span className="font-bold">{durationDays()} Hari</span>
              </div>

              {isLongTerm && vehicle.rentalListing?.isLongTermEligible ? (
                <div className="space-y-3">
                  <div className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                    <IconCircleCheck size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <span>Sewa lebih dari 7 hari berhak mendapatkan <strong>Penawaran Harga Khusus</strong>. Hubungi kami via WhatsApp.</span>
                  </div>
                  <Button 
                    onClick={() => {
                      const dates = getExactDateTimes();
                      if (!dates) return;
                      if (dates.exactEnd.getTime() - dates.exactStart.getTime() < 24 * 60 * 60 * 1000) {
                        Swal.fire('Gagal', 'Minimal durasi sewa adalah 24 jam.', 'error');
                        return;
                      }
                      if (checkOverlap()) {
                        Swal.fire('Tidak Tersedia', 'Waktu yang dipilih bertabrakan dengan jadwal penyewaan lain.', 'error');
                        return;
                      }
                      setIsQuoteModalOpen(true);
                    }} 
                    className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold h-12 flex items-center gap-2 shadow-sm shadow-[#25D366]/20"
                  >
                    <IconBrandWhatsapp size={20} />
                    Minta Penawaran Khusus (WA)
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">Atau</span></div>
                  </div>
                  <Button disabled={isNavigating} onClick={handleContinue} variant="outline" className="w-full h-11 border-blue-200 text-blue-700 hover:bg-blue-50">
                    {isNavigating ? 'Memproses...' : 'Lanjutkan Sewa Harga Normal'}
                  </Button>
                </div>
              ) : (
                <Button disabled={isNavigating} onClick={handleContinue} className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700">
                  {isNavigating ? 'Memproses...' : 'Pesan Sekarang'}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center p-4 bg-slate-50 rounded-lg text-sm text-slate-500 border border-dashed border-slate-200">
              Pilih tanggal mulai dan tanggal selesai untuk melanjutkan
            </div>
          )}
        </div>
      </div>

      <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Penawaran Sewa Jangka Panjang</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onQuoteSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama Anda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. WhatsApp</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Contoh: 08123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={submittingLead}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold flex items-center gap-2 mt-4"
                >
                  <IconBrandWhatsapp size={20} />
                  {submittingLead ? 'Memproses...' : 'Kirim & Lanjut ke WhatsApp'}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
