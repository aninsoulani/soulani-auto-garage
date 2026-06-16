type BadgeType = 'featured' | 'new-arrival' | 'long-term' | 'inspected' | 'hot-deal';

interface VehicleBadgeProps {
  type: BadgeType;
}

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; className: string }
> = {
  featured: {
    label: 'Pilihan Terbaik',
    className:
      'bg-gradient-to-r from-amber-400 to-yellow-300 text-neutral-950 text-[10px] font-semibold px-3 py-1 rounded-full shadow-lg',
  },
  'new-arrival': {
    label: 'Unit Terbaru',
    className:
      'bg-sky-500/90 text-white text-[10px] font-semibold px-3 py-1 rounded-full',
  },
  inspected: {
    label: '150-Titik Inspeksi',
    className:
      'bg-emerald-500/90 text-white text-[10px] font-semibold px-3 py-1 rounded-full',
  },
  'long-term': {
    label: 'Sewa Jangka Panjang',
    className:
      'bg-violet-100 text-violet-700 border border-violet-200 text-[10px] font-semibold px-3 py-1 rounded-full',
  },
  'hot-deal': {
    label: 'Harga Terbaik',
    className:
      'bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-lg',
  },
};

export default function VehicleBadge({ type }: VehicleBadgeProps) {
  const { label, className } = BADGE_CONFIG[type];
  return (
    <span className={className}>
      {label}
    </span>
  );
}
