'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { LeadType, LeadSource } from '@/types/api.types';
import { LEAD_TYPE_LABELS } from '@/lib/utils';
import { submitLead } from '@/lib/api';
import LeadSuccessState from './LeadSuccessState';
import { Loader2 } from 'lucide-react';

// ─── Zod Schema ──────────────────────────────────────────────────────────────

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
    offeredPrice: z.string().optional(),
    message: z.string().max(500).optional(),
    source: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'MAKE_OFFER') {
        const val = parseFloat(data.offeredPrice ?? '');
        return !isNaN(val) && val > 0;
      }
      return true;
    },
    {
      message: 'Harga penawaran wajib diisi dan harus lebih dari 0',
      path: ['offeredPrice'],
    },
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { type: actualDefaultType as LeadType, source },
  });

  const watchedType = watch('type');
  const showOfferedPrice = watchedType === 'MAKE_OFFER';

  const onSubmit = async (data: InquiryFormData) => {
    setServerError('');
    try {
      const result = await submitLead({
        vehicleId,
        type: data.type as LeadType,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        offeredPrice: showOfferedPrice && data.offeredPrice
          ? parseFloat(data.offeredPrice)
          : undefined,
        message: data.message || undefined,
        source: (data.source as LeadSource) || source,
      });

      setRefId(result.leadReferenceId);
      setWaUrl(result.whatsappRedirectUrl);
      setSubmitted(true);
      onSuccess?.(result.leadReferenceId, result.whatsappRedirectUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err?.message || 'Terjadi kesalahan. Silakan coba lagi.';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Vehicle context header */}
      <div className="text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
        <span className="font-medium text-slate-800">{vehicleName}</span>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="inquiry-name" className="block text-sm font-medium text-slate-700 mb-1">
          Nama Lengkap <span className="text-rose-500">*</span>
        </label>
        <input
          id="inquiry-name"
          type="text"
          placeholder="Contoh: Budi Santoso"
          autoComplete="name"
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
            errors.customerName
              ? 'border-rose-400 focus:ring-2 focus:ring-rose-300'
              : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          }`}
          {...register('customerName')}
        />
        {errors.customerName && (
          <p className="mt-1 text-xs text-rose-600">{errors.customerName.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="inquiry-phone" className="block text-sm font-medium text-slate-700 mb-1">
          No. WhatsApp <span className="text-rose-500">*</span>
        </label>
        <input
          id="inquiry-phone"
          type="tel"
          placeholder="08123456789"
          autoComplete="tel"
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
            errors.customerPhone
              ? 'border-rose-400 focus:ring-2 focus:ring-rose-300'
              : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          }`}
          {...register('customerPhone')}
        />
        {errors.customerPhone && (
          <p className="mt-1 text-xs text-rose-600">{errors.customerPhone.message}</p>
        )}
      </div>

      {/* Email (optional) */}
      <div>
        <label htmlFor="inquiry-email" className="block text-sm font-medium text-slate-700 mb-1">
          Email <span className="text-slate-400 font-normal text-xs">(opsional)</span>
        </label>
        <input
          id="inquiry-email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          {...register('customerEmail')}
        />
        {errors.customerEmail && (
          <p className="mt-1 text-xs text-rose-600">{errors.customerEmail.message}</p>
        )}
      </div>

      {/* Inquiry Type */}
      <div>
        <label htmlFor="inquiry-type" className="block text-sm font-medium text-slate-700 mb-1">
          Jenis Pertanyaan <span className="text-rose-500">*</span>
        </label>
        <select
          id="inquiry-type"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
          {...register('type')}
        >
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Offered Price (conditional: MAKE_OFFER only) */}
      <div
        className={`transition-all duration-200 overflow-hidden ${
          showOfferedPrice ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <label htmlFor="inquiry-price" className="block text-sm font-medium text-slate-700 mb-1">
          Harga Penawaran (IDR) <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
            Rp
          </span>
          <input
            id="inquiry-price"
            type="number"
            min="0"
            step="1000000"
            placeholder="850000000"
            className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
              errors.offeredPrice
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-300'
                : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
            {...register('offeredPrice')}
          />
        </div>
        {errors.offeredPrice && (
          <p className="mt-1 text-xs text-rose-600">{errors.offeredPrice.message}</p>
        )}
      </div>

      {/* Message (optional) */}
      <div>
        <label htmlFor="inquiry-message" className="block text-sm font-medium text-slate-700 mb-1">
          Pesan <span className="text-slate-400 font-normal text-xs">(opsional)</span>
        </label>
        <textarea
          id="inquiry-message"
          rows={3}
          placeholder="Tulis pertanyaan atau keterangan tambahan..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          {...register('message')}
        />
      </div>

      {/* Server error */}
      {serverError && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-xl">
          {serverError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-150 active:scale-95 text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Mengirim...
          </>
        ) : (
          '📲 Kirim & Chat via WhatsApp'
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Dengan mengirim, Anda setuju dengan{' '}
        <a href="/syarat" className="underline hover:text-slate-600">
          Syarat & Ketentuan
        </a>{' '}
        kami.
      </p>
    </form>
  );
}
