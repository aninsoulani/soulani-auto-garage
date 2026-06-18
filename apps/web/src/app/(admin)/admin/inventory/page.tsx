'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Edit, Trash2, Plus } from 'lucide-react';
import { PaginatedResponse } from '@/types/api.types';
import Swal from 'sweetalert2';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
        <Link href="/admin/inventory/add" className={buttonVariants({ variant: 'default' }) + " flex items-center gap-2"}>
          <Plus size={18} />
          Add Vehicle
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-end">
        <form onSubmit={handleSearch} className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search make, model, or plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white"
            />
            <Button type="submit" variant="secondary">Search</Button>
          </div>
        </form>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Listing Type</label>
          <Select value={listingType || 'ALL'} onValueChange={(v) => { setListingType(v === 'ALL' ? '' : (v || '')); setPage(1); }}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="SALE">Sale</SelectItem>
              <SelectItem value="RENTAL">Rental</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Car Type</label>
          <Select value={carType || 'ALL'} onValueChange={(v) => { setCarType(v === 'ALL' ? '' : (v || '')); setPage(1); }}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
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

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <Select value={status || 'ALL'} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : (v || '')); setPage(1); }}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
              <SelectItem value="RENTED">Rented</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-40 flex flex-col justify-end">
          <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
          <Select value={sort} onValueChange={(v) => { setSort(v || ''); setPage(1); }}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="price:desc">Highest Price</SelectItem>
              <SelectItem value="price:asc">Lowest Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-none">
          <Button 
            variant="outline"
            onClick={handleClear} 
            className="w-full md:w-auto"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Plate Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-gray-500">Loading...</TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-gray-500">No vehicles found.</TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{v.year} {v.make} {v.model}</div>
                    <div className="flex gap-1 mt-1">
                      {v.isFeatured && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 font-bold uppercase">Featured</Badge>}
                      {v.isNewArrival && <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 font-bold uppercase">New</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{v.plateNumber || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {v.listingType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/inventory/edit/${v.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon' }) + " text-blue-600 hover:text-blue-800 hover:bg-blue-50"} title="Edit Vehicle">
                        <Edit size={16} />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteVehicle(v.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="Delete Vehicle"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <span className="text-sm font-medium">Total: {total} vehicles</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={vehicles.length < 10}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
