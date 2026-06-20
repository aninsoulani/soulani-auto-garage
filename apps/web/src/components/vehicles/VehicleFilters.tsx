import type { TransmissionType, FuelType, CarType } from '@/types/api.types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export interface FilterState {
  search: string;
  carType: CarType | '';
  transmission: TransmissionType | '';
  fuelType: FuelType | '';
  minPrice: string;
  maxPrice: string;
  sort: string;
  isFeatured: boolean;
  isNewArrival: boolean;
}

interface VehicleFiltersProps {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
}

export default function VehicleFilters({ filters, onChange }: VehicleFiltersProps) {
  return (
    <aside className="space-y-6 text-sm">
      {/* Car Type */}
      <div>
        <p className="font-semibold text-slate-800 mb-2">Tipe Mobil</p>
        <Select 
          value={filters.carType || "all"} 
          onValueChange={(val) => onChange({ carType: val === "all" ? "" : (val as CarType) })}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="SUV">SUV</SelectItem>
            <SelectItem value="MPV">MPV</SelectItem>
            <SelectItem value="HATCHBACK">Hatchback</SelectItem>
            <SelectItem value="SEDAN">Sedan</SelectItem>
            <SelectItem value="COUPE">Coupe</SelectItem>
            <SelectItem value="CONVERTIBLE">Convertible</SelectItem>
            <SelectItem value="WAGON">Wagon</SelectItem>
            <SelectItem value="PICKUP">Pickup</SelectItem>
            <SelectItem value="VAN">Van</SelectItem>
            <SelectItem value="CROSSOVER">Crossover</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transmission */}
      <div>
        <p className="font-semibold text-slate-800 mb-2">Transmisi</p>
        {(['', 'AUTOMATIC', 'MANUAL'] as const).map((t) => (
          <label key={t} className="flex items-center gap-2 py-1 cursor-pointer text-slate-900 hover:text-blue-600 font-medium">
            <input
              type="radio"
              name="transmission"
              value={t}
              checked={filters.transmission === t}
              onChange={() => onChange({ transmission: t })}
              className="accent-blue-600"
            />
            {t === '' ? 'Semua' : t === 'AUTOMATIC' ? 'Otomatis' : 'Manual'}
          </label>
        ))}
      </div>

      {/* Fuel */}
      <div>
        <p className="font-semibold text-slate-800 mb-2">Bahan Bakar</p>
        {(['', 'GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const).map((f) => (
          <label key={f} className="flex items-center gap-2 py-1 cursor-pointer text-slate-900 hover:text-blue-600 font-medium">
            <input
              type="radio"
              name="fuelType"
              value={f}
              checked={filters.fuelType === f}
              onChange={() => onChange({ fuelType: f })}
              className="accent-blue-600"
            />
            {f === '' ? 'Semua' : f === 'GASOLINE' ? 'Bensin' : f === 'DIESEL' ? 'Diesel' : f === 'HYBRID' ? 'Hybrid' : 'Listrik'}
          </label>
        ))}
      </div>

      {/* Price Range */}
      <div>
        <p className="font-semibold text-slate-800 mb-2">Rentang Harga</p>
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              className="pl-8 bg-white"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
            <Input
              type="number"
              placeholder="Maks"
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              className="pl-8 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Quick filters */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-800 mb-2">Lainnya</p>
        <label className="flex items-center gap-2 cursor-pointer text-slate-900 font-medium">
          <Checkbox
            checked={filters.isFeatured}
            onCheckedChange={(c) => onChange({ isFeatured: c === true })}
          />
          Pilihan Terbaik
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-900 font-medium">
          <Checkbox
            checked={filters.isNewArrival}
            onCheckedChange={(c) => onChange({ isNewArrival: c === true })}
          />
          Baru Masuk
        </label>
      </div>
    </aside>
  );
}
