import type { Vehicle } from '@/types/api.types';
import VehicleCard from './VehicleCard';
import SkeletonCard from '@/components/shared/SkeletonCard';

interface VehicleGridProps {
  vehicles?: Vehicle[];
  loading?: boolean;
  skeletonCount?: number;
  variant?: 'sale' | 'rental';
}

export default function VehicleGrid({
  vehicles = [],
  loading = false,
  skeletonCount = 9,
  variant = 'sale',
}: VehicleGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} variant={variant} />
      ))}
    </div>
  );
}
