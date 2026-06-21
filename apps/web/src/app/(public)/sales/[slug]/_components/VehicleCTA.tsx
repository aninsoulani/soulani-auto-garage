'use client';
import { useState } from 'react';
import { IconMessageCircle } from '@tabler/icons-react';
import { formatIDR } from '@/lib/utils';
import InquirySheet from '@/components/leads/InquirySheet';
import InquiryForm from '@/components/leads/InquiryForm';
import { Button, buttonVariants } from '@/components/ui/button';
import { ListingType } from '@/types/api.types';

interface VehicleCTAProps {
  vehicleId: number;
  vehicleName: string;
  listingType?: ListingType;
  price: string | null | undefined;
}

export default function VehicleCTA({ vehicleId, vehicleName, listingType = 'BOTH', price }: VehicleCTAProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Desktop: inline form (hidden on mobile) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-24">
        {price && (
          <div className="mb-4 pb-4 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Harga</p>
            <p className="text-3xl font-extrabold text-slate-900">{formatIDR(price)}</p>
          </div>
        )}
        <p className="text-sm font-semibold text-slate-800 mb-3">Kirim Pertanyaan</p>
        <InquiryForm vehicleId={vehicleId} vehicleName={vehicleName} listingType={listingType} />
      </div>

      {/* Mobile: sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3 shadow-lg">
        {price && (
          <div className="flex-1">
            <p className="text-xs text-slate-500">Harga</p>
            <p className="text-lg font-extrabold text-slate-900 leading-tight">{formatIDR(price)}</p>
          </div>
        )}
        <button
          onClick={() => setSheetOpen(true)}
          type="button"
          className={buttonVariants({ variant: 'outline' }) + " flex items-center justify-center w-11 h-11 p-0 bg-[#25D366] hover:bg-[#20b858] border-none shrink-0 rounded-xl"}
          aria-label="Chat via WhatsApp"
        >
          <IconMessageCircle size={20} className="text-white" />
        </button>
        <Button
          onClick={() => setSheetOpen(true)}
          className="flex-1 py-6 rounded-xl font-bold text-sm"
        >
          Kirim Pertanyaan
        </Button>
      </div>

      {sheetOpen && (
        <InquirySheet
          vehicleId={vehicleId}
          vehicleName={vehicleName}
          listingType={listingType}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
}
