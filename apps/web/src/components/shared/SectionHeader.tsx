import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  centered?: boolean;
}

export default function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'Lihat Semua',
  centered = false,
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end gap-3 mb-6 ${
        centered ? 'text-center sm:text-left' : ''
      }`}
    >
      <div className="flex-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-500 text-sm sm:text-base">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold whitespace-nowrap transition-colors group"
        >
          {viewAllLabel}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
