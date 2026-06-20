import { getPublicBookingByCode } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { IconCircleCheck } from '@tabler/icons-react';
import Link from 'next/link';

export default async function BookingSuccessPage({ params }: { params: Promise<{ bookingCode: string }> }) {
  const resolvedParams = await params;
  let booking;

  try {
    booking = await getPublicBookingByCode(resolvedParams.bookingCode);
  } catch {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Booking Tidak Ditemukan</h2>
          <p className="text-slate-500 mb-6">Referensi booking {resolvedParams.bookingCode} tidak valid atau tidak ditemukan.</p>
          <Link href="/sewa-mobil" className="inline-flex items-center justify-center h-10 px-6 font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden text-center">
          <div className="bg-blue-600 p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <IconCircleCheck size={120} />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg text-blue-600">
                <IconCircleCheck size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-2 tracking-tight">
                {booking.status === 'CONFIRMED' ? 'Pembayaran Dikonfirmasi' : 
                 booking.status === 'ACTIVE' ? 'Sewa Aktif' : 
                 booking.status === 'COMPLETED' ? 'Sewa Selesai' : 
                 'Menunggu Konfirmasi'}
              </h2>
              <p className="text-blue-100 font-medium text-lg">Referensi Booking: {booking.bookingCode}</p>
            </div>
          </div>

          <div className="p-8 lg:p-12 text-left space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4">Detail Pelanggan</h3>
                <div className="space-y-2 text-slate-800">
                  <p className="font-medium text-lg">{booking.customerName}</p>
                  <p>{booking.customerPhone}</p>
                  <p className="text-slate-500">{booking.customerEmail}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4">Detail Kendaraan</h3>
                <div className="space-y-2 text-slate-800">
                  <p className="font-bold text-lg text-slate-900">{booking.vehicle.make} {booking.vehicle.model}</p>
                  <p className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm font-mono mt-1">{booking.vehicle.plateNumber || 'N/A'}</p>
                  <div className="mt-3 text-sm">
                    <p><span className="text-slate-500">Mulai:</span> <span className="font-semibold">{format(new Date(booking.startDate), 'dd MMM yyyy HH:mm', { locale: idLocale })}</span></p>
                    <p><span className="text-slate-500">Selesai:</span> <span className="font-semibold">{format(new Date(booking.endDate), 'dd MMM yyyy HH:mm', { locale: idLocale })}</span></p>
                    <p className="mt-1 text-slate-500">({days} Hari)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-left">
              <div className="flex justify-between items-center border-b border-amber-200 pb-4 mb-4">
                <span className="text-amber-800 font-medium">Total Tagihan</span>
                <span className="font-bold text-amber-900 text-2xl">{formatIDR(Number(booking.totalPrice))}</span>
              </div>
              <div>
                {booking.status === 'PENDING_PAYMENT' ? (
                  <p className="text-sm text-amber-700">Bukti transfer Anda telah kami terima dan pesanan Anda berstatus <strong className="uppercase">Menunggu Konfirmasi</strong>. Tim kami akan memverifikasi dan menghubungi Anda via WhatsApp.</p>
                ) : (
                  <p className="text-sm text-emerald-700">Pesanan Anda saat ini berstatus <strong className="uppercase">{booking.status}</strong>. Terima kasih telah mempercayakan perjalanan Anda bersama Soulani Auto Garage.</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-4 border-t border-slate-100">
              <Link href="/sewa-mobil" className="inline-flex items-center justify-center w-full sm:w-auto px-8 h-12 font-medium bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors">
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
