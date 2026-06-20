import type { Vehicle } from '@/types/api.types';
import { getTransmissionLabel, getFuelLabel, formatMileage } from '@/lib/utils';
import { IconCalendar, IconGauge, IconSettings, IconGasStation, IconPalette, IconUsers, IconCar } from '@tabler/icons-react';

interface VehicleSpecGridProps {
  vehicle: Vehicle;
  hidePreviousOwners?: boolean;
}

export default function VehicleSpecGrid({ vehicle, hidePreviousOwners }: VehicleSpecGridProps) {
  const specs = [
    { icon: IconCalendar, label: 'Tahun', value: String(vehicle.year) },
    { icon: IconCar, label: 'Tipe Mobil', value: vehicle.carType || '-' },
    { icon: IconGauge, label: 'Kilometer', value: formatMileage(vehicle.mileage) },
    { icon: IconSettings, label: 'Transmisi', value: getTransmissionLabel(vehicle.transmission) },
    { icon: IconGasStation, label: 'Bahan Bakar', value: getFuelLabel(vehicle.fuelType) },
    { icon: IconPalette, label: 'Warna', value: vehicle.color || '-' },
    ...(!hidePreviousOwners ? [{
      icon: IconUsers,
      label: 'Pemilik Sebelumnya',
      value: vehicle.salesListing 
        ? (vehicle.salesListing.previousOwners === 0 ? 'Tangan Pertama' : `${vehicle.salesListing.previousOwners}x`)
        : '-',
      isStrikethrough: vehicle.salesListing ? vehicle.salesListing.previousOwners === 0 : false,
    }] : []),
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
