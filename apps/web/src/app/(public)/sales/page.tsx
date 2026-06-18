'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, ArrowUpDown, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getVehicles } from '@/lib/api';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import VehicleFilters, { FilterState } from '@/components/vehicles/VehicleFilters';
import EmptyState from '@/components/shared/EmptyState';
import Breadcrumb from '@/components/shared/Breadcrumb';
import type { Vehicle, TransmissionType, FuelType } from '@/types/api.types';

// ─── Filter State ─────────────────────────────────────────────────────────────

function paramsToFilters(params: URLSearchParams): FilterState {
  return {
    search: params.get('search') || '',
    carType: params.get('carType') || '',
    transmission: (params.get('transmission') as TransmissionType) || '',
    fuelType: (params.get('fuelType') as FuelType) || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sort: params.get('sort') || 'newest',
    isFeatured: params.get('isFeatured') === 'true',
    isNewArrival: params.get('isNewArrival') === 'true',
  };
}

function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.search) p.set('search', f.search);
  if (f.carType) p.set('carType', f.carType);
  if (f.transmission) p.set('transmission', f.transmission);
  if (f.fuelType) p.set('fuelType', f.fuelType);
  if (f.minPrice) p.set('minPrice', f.minPrice);
  if (f.maxPrice) p.set('maxPrice', f.maxPrice);
  if (f.sort && f.sort !== 'newest') p.set('sort', f.sort);
  if (f.isFeatured) p.set('isFeatured', 'true');
  if (f.isNewArrival) p.set('isNewArrival', 'true');
  return p;
}
// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

function SalesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(() => paramsToFilters(searchParams));
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchVehicles = useCallback(async (f: FilterState, p: number) => {
    setLoading(true);
    try {
      const result = await getVehicles({
        listingType: 'SALE',
        search: f.search || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        carType: (f.carType as any) || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transmission: (f.transmission as any) || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fuelType: (f.fuelType as any) || undefined,
        minPrice: f.minPrice ? Number(f.minPrice) : undefined,
        maxPrice: f.maxPrice ? Number(f.maxPrice) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sort: (f.sort as any) || 'newest',
        isFeatured: f.isFeatured || undefined,
        isNewArrival: f.isNewArrival || undefined,
        page: p,
        limit: PAGE_SIZE,
      });
      const validVehicles = result.data.filter((v: Vehicle) => v.status !== 'DRAFT');
      setVehicles(validVehicles);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles(filters, page);
    // Sync URL
    const params = filtersToParams(filters);
    if (page > 1) params.set('page', String(page));
    router.replace(`/sales?${params.toString()}`, { scroll: false });
  }, [filters, page, fetchVehicles, router]);

  const updateFilters = (update: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...update }));
    setPage(1);
  };

  const activeFilterCount = [
    filters.search,
    filters.carType,
    filters.transmission,
    filters.fuelType,
    filters.minPrice,
    filters.maxPrice,
    filters.isFeatured,
    filters.isNewArrival,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setFilters({
      search: '',
      carType: '',
      transmission: '',
      fuelType: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      isFeatured: false,
      isNewArrival: false,
    });
    setPage(1);
    router.replace('/sales', { scroll: false });
  };

  const availableVehicles = vehicles.filter(v => v.status === 'ACTIVE').sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    if (a.isNewArrival !== b.isNewArrival) return a.isNewArrival ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const archivedVehicles = vehicles.filter(v => v.status === 'SOLD' || v.status === 'MAINTENANCE');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumb items={[{ label: 'Mobil Dijual' }]} />

      <div className="mt-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mobil Dijual</h1>
          {!loading && (
            <p className="text-sm text-slate-500 mt-0.5">
              {total.toLocaleString('id-ID')} kendaraan tersedia
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {/* Mobile filter button */}
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2"
          >
            <SlidersHorizontal size={16} />
            Filter {activeFilterCount > 0 && <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
          </Button>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-slate-400" />
            <Select value={filters.sort} onValueChange={(val) => updateFilters({ sort: val || undefined })}>
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="price:asc">Harga Terendah</SelectItem>
                <SelectItem value="price:desc">Harga Tertinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <Input
            type="search"
            placeholder="Cari merek atau model..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10 bg-white"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.transmission && (
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
              {filters.transmission === 'AUTOMATIC' ? 'Otomatis' : filters.transmission}
              <button onClick={() => updateFilters({ transmission: '' })}><X size={12} /></button>
            </span>
          )}
          {filters.fuelType && (
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
              {filters.fuelType === 'GASOLINE' ? 'Bensin' : filters.fuelType}
              <button onClick={() => updateFilters({ fuelType: '' })}><X size={12} /></button>
            </span>
          )}
          {filters.isFeatured && (
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
              Pilihan Terbaik <button onClick={() => updateFilters({ isFeatured: false })}><X size={12} /></button>
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors duration-200 underline underline-offset-4"
          >
            Hapus Filter
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-56 shrink-0">
          <VehicleFilters filters={filters} onChange={updateFilters} />
        </div>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {!loading && availableVehicles.length === 0 && archivedVehicles.length === 0 ? (
            <EmptyState
              title="Tidak ada mobil ditemukan"
              description="Coba ubah filter atau kata kunci pencarian Anda."
              action={
                <Button onClick={handleClearFilters}>
                  Reset Filter
                </Button>
              }
            />
          ) : (
            <>
              {availableVehicles.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Unit Tersedia</h2>
                  <VehicleGrid
                    vehicles={availableVehicles}
                    loading={loading}
                    variant="sale"
                    skeletonCount={PAGE_SIZE}
                  />
                </div>
              )}

              {!loading && archivedVehicles.length > 0 && (
                <div className="mt-12 mb-6">
                  <div className="relative my-16">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase tracking-widest font-semibold">
                      <span className="bg-white px-4 text-gray-500">Baru Saja Terjual / Dalam Perawatan</span>
                    </div>
                  </div>
                  <VehicleGrid
                    vehicles={archivedVehicles}
                    loading={loading}
                    variant="sale"
                    skeletonCount={0}
                  />
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Sebelumnya
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    onClick={() => setPage(pageNum)}
                    className="w-9 h-9 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Berikutnya →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="relative bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Filter</h2>
              <button onClick={() => setFiltersOpen(false)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <VehicleFilters filters={filters} onChange={(u) => { updateFilters(u); }} />
            <Button
              className="w-full mt-5"
              size="lg"
              onClick={() => setFiltersOpen(false)}
            >
              Tampilkan {total} Hasil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">Memuat kendaraan...</div>}>
      <SalesContent />
    </Suspense>
  );
}
