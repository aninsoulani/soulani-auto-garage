import Link from 'next/link';
import Image from 'next/image';
import type { Vehicle } from '@/types/api.types';
import { formatIDR, formatMileage, getTransmissionLabel, getFuelLabel } from '@/lib/utils';
import { getPrimaryImageUrl } from '@/lib/images';
import VehicleBadge from './VehicleBadge';
import { Gauge, Cog } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  /** Controls which price to display and which CTA link to use */
  variant?: 'sale' | 'rental';
}

export default function VehicleCard({ vehicle, variant = 'sale' }: VehicleCardProps) {
  const primaryImage = getPrimaryImageUrl(vehicle.images);
  const href = variant === 'sale' ? `/sales/${vehicle.slug}` : `/rental/${vehicle.slug}`;

  const price =
    variant === 'sale'
      ? vehicle.salesListing?.price
      : vehicle.rentalListing?.dailyRate;

  const priceLabel =
    variant === 'sale' ? formatIDR(price ?? 0) : `${formatIDR(price ?? 0)} / hari`;

  const isUnavailable = vehicle.status === 'SOLD' || vehicle.status === 'MAINTENANCE';

  return (
    <Link
      href={href}
      className={`group bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-200 flex flex-col ${isUnavailable
        ? 'opacity-65 grayscale-[40%]'
        : 'hover:shadow-md hover:-translate-y-1'
        }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <Image
          src={primaryImage}
          alt={`${vehicle.make} ${vehicle.model} ${vehicle.year}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-row gap-1.5 z-20">
          {vehicle.isFeatured && <VehicleBadge type="featured" />}
          {vehicle.isNewArrival && <VehicleBadge type="new-arrival" />}
          {vehicle.rentalListing?.isLongTermEligible && variant === 'rental' && (
            <VehicleBadge type="long-term" />
          )}
        </div>
        {/* Status overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
            {vehicle.status === 'SOLD' && (
              <span className="text-white font-black uppercase tracking-widest text-lg border-2 border-white px-4 py-1.5 rounded-sm">
                TERJUAL
              </span>
            )}
            {vehicle.status === 'MAINTENANCE' && (
              <span className="text-amber-400 font-black uppercase tracking-widest text-sm text-center border-2 border-amber-400 px-3 py-1.5 rounded-sm">
                DALAM PERAWATAN
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
          {vehicle.make} {vehicle.model}
        </h3>
        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
          <span>{vehicle.year}</span>
          {vehicle.mileage != null && (
            <>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <Gauge size={11} />
                {formatMileage(vehicle.mileage)}
              </span>
            </>
          )}
          {vehicle.transmission && (
            <>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <Cog size={11} />
                {getTransmissionLabel(vehicle.transmission)}
              </span>
            </>
          )}
          {vehicle.fuelType && (
            <>
              <span className="text-slate-300">•</span>
              <span>{getFuelLabel(vehicle.fuelType)}</span>
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="mt-3 pt-3 border-t border-slate-50">
          <p className="text-blue-600 font-bold text-lg leading-none">{priceLabel}</p>
        </div>
      </div>
    </Link>
  );
}