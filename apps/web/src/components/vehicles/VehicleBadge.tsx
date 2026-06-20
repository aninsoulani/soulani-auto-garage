import { cn } from '@/lib/utils';

type BadgeType = 'featured' | 'new-arrival' | 'long-term' | 'inspected' | 'hot-deal' | 'lepas-kunci' | 'with-driver';

interface VehicleBadgeProps {
  type: BadgeType;
  className?: string;
}

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; className: string }
> = {
  featured: {
    label: 'Pilihan Terbaik',
    className:
      'bg-red-500 text-white text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full shadow-sm'
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
  'lepas-kunci': {
    label: 'Lepas Kunci',
    className:
      'bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-3 py-1 rounded-full',
  },
  'with-driver': {
    label: 'Bisa +Supir',
    className:
      'bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold px-3 py-1 rounded-full',
  },
};

export default function VehicleBadge({ type, className }: VehicleBadgeProps) {
  const { label, className: baseClassName } = BADGE_CONFIG[type];
  return (
    <span className={cn(baseClassName, className)}>
      {label}
    </span>
  );
}

