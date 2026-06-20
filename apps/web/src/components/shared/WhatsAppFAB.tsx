'use client';
import { IconMessageCircle } from '@tabler/icons-react';
import { buildGenericWhatsAppUrl } from '@/lib/whatsapp';

export default function WhatsAppFAB() {
  return (
    <a
      href={buildGenericWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat via WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 group"
    >
      {/* Icon always visible */}
      <span className="flex items-center justify-center w-14 h-14 rounded-full shrink-0">
        <IconMessageCircle size={26} />
      </span>
      {/* Label: visible on desktop hover */}
      <span className="hidden sm:block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap pr-0 group-hover:pr-5 text-sm font-semibold">
        Chat Sekarang
      </span>
    </a>
  );
}
