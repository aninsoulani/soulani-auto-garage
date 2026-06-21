'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { LeadType, LeadSource } from '@/types/api.types';
import { LEAD_TYPE_LABELS } from '@/lib/utils';
import { submitLead } from '@/lib/api';
import LeadSuccessState from './LeadSuccessState';
import { IconLoader2, IconMessageCircle } from '@tabler/icons-react';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const inquirySchema = z
  .object({
    customerName: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    customerPhone: z
      .string()
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor HP tidak valid (contoh: 08123456789)'),
    customerEmail: z.string().email('Email tidak valid').optional().or(z.literal('')),
    type: z.enum([
      'SALES_INQUIRY',
      'TEST_DRIVE_REQUEST',
      'MAKE_OFFER',
      'RENTAL_INQUIRY',
      'LONG_TERM_QUOTE',
    ] as const),
    offeredPrice: z
      .preprocess(
        (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
        z.number({ invalid_type_error: 'Harga penawaran harus berupa angka' }).min(1, 'Harga penawaran harus lebih besar dari 0').optional()
      ),
    message: z.string().max(500).optional(),
    source: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'MAKE_OFFER' && data.offeredPrice === undefined) {
        return false;
      }
      return true;
    },
    {
      message: 'Harga penawaran wajib diisi untuk penawaran harga',
      path: ['offeredPrice'],
    }
  );

type InquiryFormData = z.infer<typeof inquirySchema>;

// ─── Props ───────────────────────────────────────────────────────────────────

interface InquiryFormProps {
  vehicleId: number;
  vehicleName: string;
  listingType?: 'SALE' | 'RENTAL' | 'BOTH';
  /** Optional: override default inquiry type */
  defaultType?: LeadType;
  /** Optional: pre-determined lead source for UTM tracking */
  source?: LeadSource;
  /** Called after successful submission (before WhatsApp redirect) */
  onSuccess?: (refId: string, waUrl: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InquiryForm({
  vehicleId,
  vehicleName,
  listingType = 'BOTH',
  defaultType,
  source = 'ORGANIC',
  onSuccess,
}: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [waUrl, setWaUrl] = useState('');
  const [serverError, setServerError] = useState('');

  // Filter options based on listingType
  const allowedTypes: LeadType[] = [];
  if (['SALE', 'BOTH'].includes(listingType)) {
    allowedTypes.push('SALES_INQUIRY', 'TEST_DRIVE_REQUEST', 'MAKE_OFFER');
  }
  if (['RENTAL', 'BOTH'].includes(listingType)) {
    allowedTypes.push('RENTAL_INQUIRY', 'LONG_TERM_QUOTE');
  }

  const options = Object.entries(LEAD_TYPE_LABELS).filter(([value]) =>
    allowedTypes.includes(value as LeadType)
  );

  const actualDefaultType = defaultType || (listingType === 'RENTAL' ? 'RENTAL_INQUIRY' : 'SALES_INQUIRY');

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      type: actualDefaultType as 'SALES_INQUIRY' | 'TEST_DRIVE_REQUEST' | 'MAKE_OFFER' | 'RENTAL_INQUIRY' | 'LONG_TERM_QUOTE',
      source,
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      offeredPrice: undefined,
      message: ''
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const selectedType = form.watch('type');

  const onSubmit = async (data: InquiryFormData) => {
    setServerError('');
    try {
      const result = await submitLead({
        vehicleId,
        type: data.type as LeadType,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        offeredPrice: data.type === 'MAKE_OFFER' ? Number(data.offeredPrice) : undefined,
        message: data.message || undefined,
        source: (data.source as LeadSource) || source,
      });

      setRefId(result.leadReferenceId);
      setWaUrl(result.whatsappRedirectUrl);
      setSubmitted(true);
      onSuccess?.(result.leadReferenceId, result.whatsappRedirectUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.';
      if (msg.includes('429') || msg.toLowerCase().includes('too many')) {
        setServerError('Terlalu banyak percobaan. Silakan coba lagi dalam 1 jam.');
      } else {
        setServerError(msg);
      }
    }
  };

  if (submitted) {
    return <LeadSuccessState refId={refId} whatsappUrl={waUrl} vehicleName={vehicleName} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Vehicle context header */}
        <div className="text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
          <span className="font-medium text-slate-800">{vehicleName}</span>
        </div>

        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap <span className="text-rose-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Budi Santoso" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>No. WhatsApp <span className="text-rose-500">*</span></FormLabel>
              <FormControl>
                <Input type="tel" placeholder="08123456789" autoComplete="tel" {...field} />
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
              <FormLabel>Email <span className="text-slate-400 font-normal text-xs">(opsional)</span></FormLabel>
              <FormControl>
                <Input type="email" placeholder="nama@email.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Pertanyaan <span className="text-rose-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Pilih Jenis Pertanyaan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType === 'MAKE_OFFER' && (
          <FormField
            control={form.control}
            name="offeredPrice"
            render={({ field }) => (
              <FormItem className="animate-in fade-in slide-in-from-top-2 duration-200">
                <FormLabel>Harga Penawaran (IDR) <span className="text-rose-500">*</span></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Contoh: 150000000"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}



        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pesan <span className="text-slate-400 font-normal text-xs">(opsional)</span></FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Tulis pertanyaan atau keterangan tambahan..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Server error */}
        {serverError && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-xl">
            {serverError}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-6 text-base font-bold"
        >
          {isSubmitting ? (
            <>
              <IconLoader2 size={16} className="animate-spin" />
              Mengirim...
            </>
          ) : (
            <><IconMessageCircle className="w-4 h-4 mr-2" /> Kirim & Chat via WhatsApp</>
          )}
        </Button>

        <p className="text-center text-xs text-slate-400">
          Dengan mengirim, Anda setuju dengan{' '}
          <a href="/syarat" className="underline hover:text-slate-600">
            Syarat & Ketentuan
          </a>{' '}
          kami.
        </p>
      </form>
    </Form>
  );
}
