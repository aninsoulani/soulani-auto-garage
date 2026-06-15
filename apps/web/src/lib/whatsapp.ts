/**
 * WhatsApp URL builders for Soulani Auto Garage.
 *
 * The NEXT_PUBLIC_WHATSAPP_NUMBER env var holds the temporary number.
 * In Phase 6 this will be read from the HomepageContent CMS table
 * (key: 'whatsapp_number') so it can be updated from the admin dashboard
 * without env var changes or redeployment.
 */

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281210663530';

/**
 * Build a wa.me URL with a custom pre-filled message.
 */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
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
