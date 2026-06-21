import { useCmsStore } from '@/store/cms.store';

/**
 * WhatsApp URL builders for Soulani Auto Garage.
 *
 * In Phase 6 this is read from the client-side Zustand store which
 * fetches from the HomepageContent CMS table.
 */

export function getWhatsAppNumber(): string {
  if (typeof window !== 'undefined') {
    const fromStore = useCmsStore.getState().whatsappNumber;
    if (fromStore) return fromStore;
  }
  return ''; // fallback
}

/**
 * Build a wa.me URL with a custom pre-filled message.
 */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

/**
 * Generic "chat with us" link — no vehicle context.
 */
export function buildGenericWhatsAppUrl(): string {
  const msg = `Halo Admin Soulani Auto Garage, saya ingin bertanya tentang mobil yang tersedia.`;
  return buildWhatsAppUrl(msg);
}

/**
 * Pre-filled vehicle inquiry link.
 * Used on the Vehicle Detail Page for the "Chat Langsung" button
 * BEFORE a lead form is submitted (no Ref ID yet).
 */
export function buildVehicleWhatsAppUrl(vehicle: {
  make: string;
  model: string;
  year: number;
}): string {
  const msg = `Halo Admin Soulani Auto Garage, saya ingin bertanya tentang ${vehicle.make} ${vehicle.model} (${vehicle.year}).`;
  return buildWhatsAppUrl(msg);
}
