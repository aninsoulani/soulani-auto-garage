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
      value: vehicle.salesListing 
        ? (vehicle.salesListing.previousOwners === 0 ? 'Tangan Pertama' : `${vehicle.salesListing.previousOwners}x`)
        : '-',
      isStrikethrough: vehicle.salesListing ? vehicle.salesListing.previousOwners === 0 : false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {specs.map(({ icon: Icon, label, value, isStrikethrough }) => (
        <div
          key={label}
          className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100"
        >
          <div className="flex items-center gap-1.5 text-slate-400">
            <Icon size={14} />
            <span className={`text-xs font-medium uppercase tracking-wide ${isStrikethrough ? 'line-through opacity-70' : ''}`}>
              {label}
            </span>
          </div>
          <span className={`font-semibold text-sm leading-snug ${isStrikethrough ? 'text-green-600' : 'text-slate-900'}`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
