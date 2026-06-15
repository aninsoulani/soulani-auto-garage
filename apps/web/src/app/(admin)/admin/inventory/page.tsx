'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Edit, Trash2, Plus } from 'lucide-react';
import Swal from 'sweetalert2';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  type: string;
  status: string;
  plateNumber: string;
}

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    fetchVehicles(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchVehicles = async (currentPage: number) => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await apiFetch<any>(`/vehicles?page=${currentPage}&limit=10`, {
        token: accessToken || undefined
      });
      setVehicles(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
                  </td>
                  <td className="px-6 py-4 text-gray-600">{v.plateNumber || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {v.type}
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
