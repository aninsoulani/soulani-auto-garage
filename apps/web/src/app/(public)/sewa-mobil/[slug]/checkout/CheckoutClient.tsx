'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitRentalBooking, getPaymentMethods, uploadLicense, uploadGeneralReceipt } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { getPrimaryImageUrl } from '@/lib/images';
import type { Vehicle, PaymentMethod } from '@/types/api.types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IconInfoCircle, IconEye } from '@tabler/icons-react';
import Swal from 'sweetalert2';

const checkoutSchema = z.object({
  customerName: z.string().min(3, "Nama lengkap minimal 3 karakter."),
  customerPhone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Nomor WhatsApp tidak valid (contoh: 0812...)."),
  customerEmail: z.string().email("Format email salah"),
  identityNumber: z.string().regex(/^\d{16,}$/, 'Nomor KTP harus berupa minimal 16 digit angka'),
  whatsappOptIn: z.boolean().default(false),
  paymentMethodId: z.coerce.number().min(1, 'Silakan pilih metode pembayaran.'),
  licenseImageUrl: z.string().min(1, "Foto KTP/SIM wajib diunggah."),
  proofOfTransferUrl: z.string().min(1, "Bukti transfer wajib diunggah."),
  withDriver: z.boolean().default(false),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutClient({ vehicle, startStr, endStr }: { vehicle: Vehicle; startStr: string; endStr: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      identityNumber: '',
      whatsappOptIn: false,
      paymentMethodId: 0,
      licenseImageUrl: '',
      proofOfTransferUrl: '',
      withDriver: false,
    }
  });

  const watchPaymentMethod = form.watch('paymentMethodId');
  const hasPaymentMethod = Boolean(watchPaymentMethod && watchPaymentMethod > 0);

  useEffect(() => {
    getPaymentMethods().then(setPaymentMethods).catch(console.error);
  }, []);

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  let days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) days = 1;

  const dailyRate = Number(vehicle.rentalListing?.dailyRate || 0);
  const deposit = Number(vehicle.rentalListing?.depositAmount || 0);
  const isDriverAvailable = Boolean(vehicle.rentalListing?.isDriverAvailable);
  const driverFee = Number(vehicle.rentalListing?.driverFeePerDay || 0);
  
  const watchWithDriver = form.watch('withDriver');
  const driverCost = watchWithDriver ? driverFee * days : 0;
  const totalPrice = (dailyRate * days) + driverCost;

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!licenseFile || !receiptFile) return;
    setLoading(true);
    try {
      const [uploadLicenseRes, uploadReceiptRes] = await Promise.all([
        uploadLicense(licenseFile),
        uploadGeneralReceipt(receiptFile)
      ]);

      const res = await submitRentalBooking({
        rentalListingId: vehicle.rentalListing?.id,
        startDate: startStr,
        endDate: endStr,
        ...values,
        licenseImageUrl: uploadLicenseRes.fileUrl,
        proofOfTransferUrl: uploadReceiptRes.fileUrl,
      });

      form.reset();
      router.push(`/sewa-mobil/booking-success/${res.bookingCode}`);
    } catch (err: unknown) {
      Swal.fire('Gagal', (err as Error).message || 'Terjadi kesalahan.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Detail Pemesan</h2>
            <div className="space-y-5">

              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap Sesuai KTP *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama lengkap" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. WhatsApp *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Contoh: 08123456789" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contoh@email.com" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="identityNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor KTP/SIM (16 Digit) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 3201..." {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto KTP/SIM *</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setLicenseFile(file || null);
                            field.onChange(file ? file.name : '');
                          }}
                          className="h-12 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                      </FormControl>
                      {licenseFile && (
                        <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="w-10 h-10 relative rounded border border-slate-200 overflow-hidden bg-white shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={URL.createObjectURL(licenseFile)} alt="Preview KTP" className="object-cover w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{licenseFile.name}</p>
                            <p className="text-[10px] text-slate-500">{(licenseFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <Dialog>
                            <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="gap-1 h-8 px-2 shrink-0" />}>
                              <IconEye size={14} /> Lihat
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Preview KTP/SIM</DialogTitle>
                              </DialogHeader>
                              <div className="mt-2 flex justify-center bg-slate-100 rounded-lg p-2 border border-slate-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={URL.createObjectURL(licenseFile)} alt="Preview" className="max-w-full max-h-[70vh] rounded object-contain" />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isDriverAvailable && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-5">
                  <FormField
                    control={form.control}
                    name="withDriver"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-semibold text-blue-900 cursor-pointer">
                            Tambahkan Supir (+ {formatIDR(driverFee)}/hari)
                          </FormLabel>
                          <p className="text-sm text-blue-700">
                            Nikmati perjalanan tanpa repot dengan supir berpengalaman dari kami.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                     <FormLabel>Metode Pembayaran *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        {paymentMethods.length > 0 ? paymentMethods.map(pm => (
                          <FormItem key={pm.id} className="flex items-center space-x-3 space-y-0 rounded-xl border p-4 hover:border-blue-500 cursor-pointer transition-all">
                            <FormControl>
                              <RadioGroupItem value={String(pm.id)} />
                            </FormControl>
                            <FormLabel className="font-medium cursor-pointer w-full">
                              {pm.name}
                            </FormLabel>
                          </FormItem>
                        )) : (
                          <div className="col-span-1 sm:col-span-2 p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                            Mohon maaf, metode pembayaran belum tersedia. Silakan hubungi admin via WhatsApp untuk bantuan lebih lanjut.
                          </div>
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasPaymentMethod && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium mb-1">Total Pembayaran & Deposit</p>
                    <p className="text-2xl font-bold text-amber-900">{formatIDR(totalPrice + deposit)}</p>

                    {paymentMethods.find(p => p.id === Number(watchPaymentMethod))?.instructions && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <p className="text-sm font-semibold text-amber-800 mb-2">Instruksi Pembayaran:</p>
                        <p className="text-sm text-amber-900 whitespace-pre-wrap">
                          {paymentMethods.find(p => p.id === Number(watchPaymentMethod))?.instructions}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-amber-700 mt-4">Silakan transfer ke rekening bank di atas sebesar nominal berikut, lalu unggah bukti transfer di bawah.</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="proofOfTransferUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unggah Bukti Transfer *</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setReceiptFile(file || null);
                              field.onChange(file ? file.name : '');
                            }}
                            className="h-12 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                          />
                        </FormControl>
                        {receiptFile && (
                          <div className="mt-2 flex items-center gap-3 bg-white/60 p-2 rounded-lg border border-amber-100">
                            <div className="w-10 h-10 relative rounded border border-amber-200 overflow-hidden bg-white shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={URL.createObjectURL(receiptFile)} alt="Preview Bukti" className="object-cover w-full h-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{receiptFile.name}</p>
                              <p className="text-[10px] text-slate-500">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Dialog>
                              <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="gap-1 h-8 px-2 border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0" />}>
                                <IconEye size={14} /> Lihat
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Preview Bukti Transfer</DialogTitle>
                                </DialogHeader>
                                <div className="mt-2 flex justify-center bg-slate-100 rounded-lg p-2 border border-slate-200">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={URL.createObjectURL(receiptFile)} alt="Preview" className="max-w-full max-h-[70vh] rounded object-contain" />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t border-slate-100">
                    <FormField
                      control={form.control}
                      name="whatsappOptIn"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                              Terima notifikasi status pemesanan via WhatsApp.
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} className="h-12 px-6">
                      Kembali
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 h-12 text-base font-bold bg-blue-600 hover:bg-blue-700">
                      {loading ? 'Memproses...' : 'Selesaikan Pemesanan'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>

      {/* Summary wrapped in Dialog */}
      <div className="lg:col-span-1">
        <Dialog>
          <DialogTrigger className="block w-full text-left">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">Ringkasan Sewa</h3>
                <IconInfoCircle size={20} className="text-slate-400 group-hover:text-blue-500" />
              </div>

              <div className="flex gap-4 items-center pb-5 border-b border-slate-100">
                <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  <Image src={getPrimaryImageUrl(vehicle.images)} alt={vehicle.make} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">{vehicle.make} {vehicle.model}</h4>
                  <p className="text-xs text-slate-500 mt-1">{vehicle.year} • {vehicle.transmission}</p>
                </div>
              </div>

              <div className="py-4 space-y-3 border-b border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mulai</span>
                  <span className="font-semibold text-slate-900">{format(startDate, 'dd MMM yyyy HH:mm', { locale: idLocale })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selesai</span>
                  <span className="font-semibold text-slate-900">{format(endDate, 'dd MMM yyyy HH:mm', { locale: idLocale })}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 text-blue-900 px-3 py-2 rounded-md font-medium">
                  <span>Total Durasi</span>
                  <span>{days} Hari</span>
                </div>
              </div>

              <div className="pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarif per Hari</span>
                  <span className="font-medium">{formatIDR(dailyRate)}</span>
                </div>
                {watchWithDriver && (
                  <div className="flex justify-between text-blue-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <span>Supir ({days} Hari):</span>
                    <span className="font-medium">{formatIDR(driverFee * days)}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span>Deposit (Wajib):</span>
                  <span className="font-medium">Rp {deposit.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total Biaya</span>
                  <span className="font-bold text-xl text-blue-600">{formatIDR(totalPrice + deposit)}</span>
                </div>
                <p className="text-xs text-slate-400 text-right mt-1 animate-in fade-in">*Sudah termasuk deposit</p>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Spesifikasi Kendaraan</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <Carousel className="w-full">
                <CarouselContent>
                  {vehicle.images && vehicle.images.length > 0 ? (
                    vehicle.images.map((img) => (
                      <CarouselItem key={img.id}>
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100">
                          <Image src={img.imageUrl} alt={vehicle.make} fill className="object-cover" />
                        </div>
                      </CarouselItem>
                    ))
                  ) : (
                    <CarouselItem>
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100">
                        <Image src={getPrimaryImageUrl(vehicle.images)} alt={vehicle.make} fill className="object-cover" />
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block mb-1">Transmisi</span>
                  <span className="font-semibold">{vehicle.transmission}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block mb-1">Bahan Bakar</span>
                  <span className="font-semibold">{vehicle.fuelType}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block mb-1">Warna</span>
                  <span className="font-semibold">{vehicle.color}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 block mb-1">Tipe Mobil</span>
                  <span className="font-semibold">{vehicle.carType}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
