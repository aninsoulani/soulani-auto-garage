'use client';
import { useEffect } from 'react';
import { IconX } from '@tabler/icons-react';
import type { LeadType } from '@/types/api.types';
import InquiryForm from './InquiryForm';

interface InquirySheetProps {
  vehicleId: number;
  vehicleName: string;
  listingType?: 'SALE' | 'RENTAL' | 'BOTH';
  defaultType?: LeadType;
  onClose: () => void;
}

export default function InquirySheet({
  vehicleId,
  vehicleName,
  listingType,
  defaultType,
  onClose,
}: InquirySheetProps) {
  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col animate-[slideUp_0.25s_ease-out]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Kirim Pertanyaan</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            aria-label="Tutup"
          >
            <IconX size={16} className="text-slate-600" />
          </button>
        </div>

        {/* Scrollable form area */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <InquiryForm
            vehicleId={vehicleId}
            vehicleName={vehicleName}
            listingType={listingType}
            defaultType={defaultType}
          />
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
