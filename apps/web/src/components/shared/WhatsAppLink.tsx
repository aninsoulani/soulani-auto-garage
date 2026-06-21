'use client';
import { useEffect, useState } from 'react';
import { useCmsStore } from '@/store/cms.store';

interface WhatsAppLinkProps {
  className?: string;
  children: React.ReactNode;
  message?: string;
}

export default function WhatsAppLink({ className, children, message }: WhatsAppLinkProps) {
  const { whatsappNumber, fetchSettings } = useCmsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, [fetchSettings]);

  const waNumber = whatsappNumber || '';
  const defaultMsg = 'Halo Admin Soulani Auto Garage, saya ingin bertanya tentang layanan Anda.';
  const href = `https://wa.me/${waNumber}?text=${encodeURIComponent(message || defaultMsg)}`;

  // To prevent hydration mismatch, we render the same tag with the fallback initially,
  // then hydrate. Next.js handles href hydration fine as long as we don't drastically change the DOM.
  return (
    <a
      href={mounted ? href : `https://wa.me/?text=${encodeURIComponent(message || defaultMsg)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
