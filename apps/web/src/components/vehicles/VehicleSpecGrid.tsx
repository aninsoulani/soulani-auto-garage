import type { Vehicle } from '@/types/api.types';
import { getTransmissionLabel, getFuelLabel, formatMileage } from '@/lib/utils';
import { Calendar, Gauge, Cog, Fuel, Palette, Users, Car } from 'lucide-react';

interface VehicleSpecGridProps {
  vehicle: Vehicle;
}

export default function VehicleSpecGrid({ vehicle }: VehicleSpecGridProps) {
  const specs = [
    { icon: Calendar, label: 'Tahun', value: String(vehicle.year) },
    { icon: Car, label: 'Tipe Mobil', value: vehicle.carType || '-' },
    { icon: Gauge, label: 'Kilometer', value: formatMileage(vehicle.mileage) },
    { icon: Cog, label: 'Transmisi', value: getTransmissionLabel(vehicle.transmission) },
    { icon: Fuel, label: 'Bahan Bakar', value: getFuelLabel(vehicle.fuelType) },
    { icon: Palette, label: 'Warna', value: vehicle.color || '-' },
    {
      icon: Users,
      label: 'Pemilik Sebelumnya',
      value: vehicle.salesListing ? `${vehicle.salesListing.previousOwners}x` : '-',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {specs.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100"
        >
          <div className="flex items-center gap-1.5 text-slate-400">
            <Icon size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
          </div>
          <span className="text-slate-900 font-semibold text-sm leading-snug">{value}</span>
        </div>
      ))}
    </div>
  );
}
