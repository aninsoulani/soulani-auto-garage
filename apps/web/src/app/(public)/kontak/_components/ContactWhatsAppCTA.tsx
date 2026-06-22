'use client';

import { useEffect } from 'react';
import { IconMessageCircle } from '@tabler/icons-react';
import { useCmsStore } from '@/store/cms.store';

export default function ContactWhatsAppCTA({ whatsappNumber }: { whatsappNumber?: string }) {
  const { whatsappNumber: storeWhatsappNumber, fetchSettings } = useCmsStore();

  useEffect(() => {
    if (!whatsappNumber) {
      fetchSettings();
    }
  }, [whatsappNumber, fetchSettings]);

  const waNumber = whatsappNumber || storeWhatsappNumber || '';
  const msg = 'Halo Admin Soulani Auto Garage, saya ingin bertanya tentang layanan Anda.';
  const href = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold py-4 rounded-2xl transition-all active:scale-95 text-base shadow-md shadow-green-100"
    >
      <IconMessageCircle size={22} />
      Chat Langsung via WhatsApp
    </a>
  );
}
