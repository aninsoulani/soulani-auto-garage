'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Edit, Trash2, Plus } from 'lucide-react';
import { PaginatedResponse } from '@/types/api.types';
import Swal from 'sweetalert2';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  listingType: string;
  status: string;
  plateNumber: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
}

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { accessToken } = useAuthStore();

  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState('');
  const [carType, setCarType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchVehicles(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, listingType, carType, status, sort]);

  const fetchVehicles = async (currentPage: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
        sort
      });
      if (search) params.set('search', search);
      if (listingType) params.set('listingType', listingType);
      if (carType) params.set('carType', carType);
      if (status) params.set('status', status);

      const res = await apiFetch<PaginatedResponse<Vehicle>>(`/vehicles/admin/list?${params.toString()}`, {
        token: accessToken || undefined
      });
      setVehicles(res.data);
      setTotal(res.meta.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVehicles(1);
  };

  const handleClear = () => {
    setSearch('');
    setListingType('');
    setCarType('');
    setStatus('');
    setSort('newest');
    setPage(1);

    setLoading(true);
    apiFetch<PaginatedResponse<Vehicle>>(`/vehicles/admin/list?page=1&limit=10&sort=newest`, {
      token: accessToken || undefined
    })
      .then((res) => {
        setVehicles(res.data);
        setTotal(res.meta.total);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  const deleteVehicle = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Soft-deleting will remove this vehicle from public view.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      await apiFetch(`/vehicles/${id}`, {
        method: 'DELETE',
        token: accessToken || undefined
      });
      Swal.fire('Deleted!', 'Vehicle has been deleted successfully.', 'success');
      fetchVehicles(page);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to delete vehicle', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <Link
          href="/admin/inventory/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2 font-medium text-sm"
        >
          <Plus size={18} />
          Add Vehicle
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-end">
        <form onSubmit={handleSearch} className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search make, model, or plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <button type="submit" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition">Search</button>
          </div>
        </form>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Listing Type</label>
          <select value={listingType} onChange={(e) => { setListingType(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
            <option value="">All</option>
            <option value="SALE">Sale</option>
            <option value="RENTAL">Rental</option>
            <option value="BOTH">Both</option>
          </select>
        </div>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Car Type</label>
          <select value={carType} onChange={(e) => { setCarType(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
            <option value="">All</option>
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

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="SOLD">Sold</option>
            <option value="RENTED">Rented</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>

        <div className="w-full md:w-40 flex flex-col justify-end">
          <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price:desc">Highest Price</option>
            <option value="price:asc">Lowest Price</option>
          </select>
        </div>
        
        <div className="flex-none">
          <button 
            onClick={handleClear} 
            className="w-full md:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-medium text-gray-500">Vehicle</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500">Plate Number</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500">Type</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No vehicles found.</td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{v.year} {v.make} {v.model}</div>
                    <div className="flex gap-1 mt-1">
                      {v.isFeatured && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Featured</span>}
                      {v.isNewArrival && <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">New</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{v.plateNumber || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {v.listingType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/inventory/edit/${v.id}`}
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-lg inline-flex transition"
                        title="Edit Vehicle"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => deleteVehicle(v.id)}
                        className="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded-lg inline-flex transition"
                        title="Delete Vehicle"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <span className="text-sm text-gray-600 text-black">Total: {total} vehicles</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 text-black"
            >
              Prev
            </button>
            <button
              disabled={vehicles.length < 10}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 text-black"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
