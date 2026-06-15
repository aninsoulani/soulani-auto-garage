import { formatIDR } from '@/lib/utils';

interface PriceDisplayProps {
  price: string | number | null | undefined;
  /** If set, adds "/hari" suffix */
  perDay?: boolean;
  className?: string;
}

export default function PriceDisplay({ price, perDay = false, className = '' }: PriceDisplayProps) {
  if (!price) return null;
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
        {formatIDR(price)}
      </span>
      {perDay && (
        <span className="text-sm font-medium text-slate-500">/ hari</span>
      )}
    </div>
  );
}
