import type { TransmissionType, FuelType } from '@/types/api.types';

export interface FilterState {
  search: string;
  carType: string;
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
        <select
          value={filters.carType}
          onChange={(e) => onChange({ carType: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white outline-none focus:border-blue-500"
        >
          <option value="">Semua Tipe</option>
          <option value="SUV">SUV</option>
          <option value="MPV">MPV</option>
          <option value="HATCHBACK">Hatchback</option>
          <option value="SEDAN">Sedan</option>
          <option value="COUPE">Coupe</option>
          <option value="CONVERTIBLE">Convertible</option>
          <option value="WAGON">Wagon</option>
          <option value="PICKUP">Pickup</option>
          <option value="VAN">Van</option>
          <option value="CROSSOVER">Crossover</option>
        </select>
      </div>

      {/* Transmission */}
      <div>
        <p className="font-semibold text-slate-800 mb-2">Transmisi</p>
        {(['', 'AUTOMATIC', 'MANUAL', 'CVT'] as const).map((t) => (
          <label key={t} className="flex items-center gap-2 py-1 cursor-pointer text-slate-900 hover:text-blue-600 font-medium">
            <input
              type="radio"
              name="transmission"
              value={t}
              checked={filters.transmission === t}
              onChange={() => onChange({ transmission: t })}
              className="accent-blue-600"
            />
            {t === '' ? 'Semua' : t === 'AUTOMATIC' ? 'Otomatis' : t === 'MANUAL' ? 'Manual' : 'CVT'}
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
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white outline-none focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
            <input
              type="number"
              placeholder="Maks"
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quick filters */}
      <div>
        <p className="font-semibold text-slate-800 mb-2">Lainnya</p>
        <label className="flex items-center gap-2 py-1 cursor-pointer text-slate-900 font-medium">
          <input
            type="checkbox"
            checked={filters.isFeatured}
            onChange={(e) => onChange({ isFeatured: e.target.checked })}
            className="accent-blue-600"
          />
          Pilihan Terbaik
        </label>
        <label className="flex items-center gap-2 py-1 cursor-pointer text-slate-900 font-medium">
          <input
            type="checkbox"
            checked={filters.isNewArrival}
            onChange={(e) => onChange({ isNewArrival: e.target.checked })}
            className="accent-blue-600"
          />
          Baru Masuk
        </label>
      </div>
    </aside>
  );
}
