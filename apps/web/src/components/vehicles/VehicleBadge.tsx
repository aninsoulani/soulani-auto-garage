type BadgeType = 'featured' | 'new-arrival' | 'long-term' | 'inspected' | 'hot-deal';

interface VehicleBadgeProps {
  type: BadgeType;
}

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; className: string }
> = {
  featured: {
    label: '⭐ Pilihan Terbaik',
    className: 'bg-blue-600 text-white',
  },
  'new-arrival': {
    label: '🆕 Baru Masuk',
    className: 'bg-emerald-500 text-white',
  },
  'long-term': {
    label: '📅 Sewa Jangka Panjang',
    className: 'bg-violet-600 text-white',
  },
  inspected: {
    label: '✓ 150-Titik Inspeksi',
    className: 'bg-emerald-500 text-white',
  },
  'hot-deal': {
    label: '🔥 Harga Terbaik',
    className: 'bg-amber-500 text-white',
  },
};

export default function VehicleBadge({ type }: VehicleBadgeProps) {
  const { label, className } = BADGE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold leading-none shadow-sm ${className}`}
    >
      {label}
    </span>
  );
}
