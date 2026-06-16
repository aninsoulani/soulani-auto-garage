import type { TransmissionType, FuelType, InspectionStatus } from '@/types/api.types';

// ─── IDR Currency Formatting ───────────────────────────────────────────────────

/**
 * Format a number or Prisma Decimal string to full IDR display.
 * e.g. 850000000 → "Rp 850.000.000"
 */
export function formatIDR(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rp -';
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num)}`;
}

/**
 * Abbreviated IDR for compact display in cards.
 * e.g. 850000000 → "Rp 850 Juta"
 *      1500000000 → "Rp 1,5 M"
 *      1200000    → "Rp 1,2 Juta"
 */
export function formatIDRShort(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rp -';

  if (num >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return `Rp ${val % 1 === 0 ? val : val.toFixed(1).replace('.', ',')} M`;
  }
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return `Rp ${val % 1 === 0 ? val : val.toFixed(0)} Juta`;
  }
  return formatIDR(num);
}

// ─── Mileage Formatting ────────────────────────────────────────────────────────

/**
 * Format mileage with Indonesian thousand separator.
 * e.g. 12500 → "12.500 km"
 */
export function formatMileage(km: number | null | undefined): string {
  if (km === null || km === undefined) return '-';
  return `${new Intl.NumberFormat('id-ID').format(km)} km`;
}

// ─── Vehicle Spec Labels (Bahasa Indonesia) ────────────────────────────────────

const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  MANUAL: 'Manual',
  AUTOMATIC: 'Otomatis',
  CVT: 'CVT',
};

export function getTransmissionLabel(t: TransmissionType | null | undefined): string {
  if (!t) return '-';
  return TRANSMISSION_LABELS[t] ?? t;
}

const FUEL_LABELS: Record<FuelType, string> = {
  GASOLINE: 'Bensin',
  DIESEL: 'Diesel',
  HYBRID: 'Hybrid',
  ELECTRIC: 'Listrik',
};

export function getFuelLabel(f: FuelType | null | undefined): string {
  if (!f) return '-';
  return FUEL_LABELS[f] ?? f;
}

// ─── Inspection Status ─────────────────────────────────────────────────────────

export function getInspectionStatusMeta(s: InspectionStatus): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  const map: Record<InspectionStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    PASS: { label: 'Baik', color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: '✓' },
    FAIL: { label: 'Perlu Perbaikan', color: 'text-rose-700', bgColor: 'bg-rose-50', icon: '✗' },
    NEEDS_ATTENTION: { label: 'Perhatikan', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: '⚠' },
  };
  return map[s] ?? { label: s, color: 'text-gray-700', bgColor: 'bg-gray-50', icon: '?' };
}

// ─── Lead Type Labels ─────────────────────────────────────────────────────────

export const LEAD_TYPE_LABELS: Record<string, string> = {
  SALES_INQUIRY: 'Pertanyaan Pembelian',
  TEST_DRIVE_REQUEST: 'Jadwalkan Test Drive',
  MAKE_OFFER: 'Ajukan Penawaran',
  RENTAL_INQUIRY: 'Pertanyaan Sewa',
  LONG_TERM_QUOTE: 'Penawaran Sewa Jangka Panjang',
};

// ─── Vehicle Status Labels ────────────────────────────────────────────────────

export function getStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Tersedia', color: 'text-emerald-600' },
    SOLD: { label: 'Terjual', color: 'text-gray-500' },
    RENTED: { label: 'Disewa', color: 'text-blue-600' },
    MAINTENANCE: { label: 'Servis', color: 'text-amber-600' },
  };
  return map[status] ?? { label: status, color: 'text-gray-600' };
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Format a date string to Indonesian locale.
 * e.g. "2026-06-15T..." → "15 Juni 2026"
 */
export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Slug Helper ──────────────────────────────────────────────────────────────

export function vehicleDisplayName(vehicle: {
  make: string;
  model: string;
  year: number;
}): string {
  return `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
}

// ─── Avatar Initials ──────────────────────────────────────────────────────────

/**
 * Get initials from a full name (up to 2 chars).
 * e.g. "Budi Santoso" → "BS"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Deterministic background color for avatar based on name.
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
