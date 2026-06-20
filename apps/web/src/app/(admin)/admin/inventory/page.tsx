'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { IconEdit, IconTrash, IconPlus, IconSearch } from '@tabler/icons-react';
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
    } catch (error: unknown) {
      Swal.fire('Error', error instanceof Error ? error.message : 'Failed to delete vehicle', 'error');
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'ACTIVE': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>;
      case 'SOLD': return <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">Sold</Badge>;
      case 'RENTED': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Rented</Badge>;
      case 'MAINTENANCE': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Maintenance</Badge>;
      case 'DRAFT': return <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">Draft</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage vehicles available for sale or rent.</p>
        </div>
        <Link href="/admin/inventory/add" className={buttonVariants({ variant: 'default' }) + " flex items-center gap-2"}>
          <IconPlus size={16} />
          Add Vehicle
        </Link>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
        <form onSubmit={handleSearch} className="flex-1 w-full">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Search Vehicle</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search make, model, or plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white pl-9"
            />
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <button type="submit" className="hidden">Submit</button>
          </div>
        </form>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Listing Type</label>
          <Select value={listingType || 'ALL'} onValueChange={(v) => { setListingType(v === 'ALL' ? '' : (v || '')); setPage(1); }}>
            <SelectTrigger className="bg-white text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="SALE">Sale</SelectItem>
              <SelectItem value="RENTAL">Rental</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Car Type</label>
          <Select value={carType || 'ALL'} onValueChange={(v) => { setCarType(v === 'ALL' ? '' : (v || '')); setPage(1); }}>
            <SelectTrigger className="bg-white text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
              <SelectItem value="MPV">MPV</SelectItem>
              <SelectItem value="HATCHBACK">Hatchback</SelectItem>
              <SelectItem value="SEDAN">Sedan</SelectItem>
              <SelectItem value="COUPE">Coupe</SelectItem>
              <SelectItem value="WAGON">Wagon</SelectItem>
              <SelectItem value="PICKUP">Pickup</SelectItem>
              <SelectItem value="VAN">Van</SelectItem>
              <SelectItem value="CROSSOVER">Crossover</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
          <Select value={status || 'ALL'} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : (v || '')); setPage(1); }}>
            <SelectTrigger className="bg-white text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
              <SelectItem value="RENTED">Rented</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-40 flex flex-col justify-end">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Sort By</label>
          <Select value={sort} onValueChange={(v) => { setSort(v || ''); setPage(1); }}>
            <SelectTrigger className="bg-white text-sm">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-800">Vehicle</TableHead>
                <TableHead className="font-semibold text-slate-800">Plate Number</TableHead>
                <TableHead className="font-semibold text-slate-800">Type</TableHead>
                <TableHead className="font-semibold text-slate-800">Status</TableHead>
                <TableHead className="font-semibold text-slate-800 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500 animate-pulse">Loading vehicles...</TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">No vehicles found matching your criteria.</TableCell>
                </TableRow>
              ) : (
                vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{v.year} {v.make} {v.model}</div>
                      <div className="flex gap-1 mt-1">
                        {v.isFeatured && <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0.5 font-bold uppercase">Featured</Badge>}
                        {v.isNewArrival && <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] px-1.5 py-0.5 font-bold uppercase">New</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{v.plateNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium">
                        {v.listingType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(v.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/inventory/edit/${v.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon' }) + " text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-8 h-8"} title="Edit Vehicle">
                          <IconEdit size={14} />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteVehicle(v.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 w-8 h-8"
                          title="Delete Vehicle"
                        >
                          <IconTrash size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-sm font-medium text-slate-600">Total: {total} vehicles</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="bg-white"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={vehicles.length < 10}
                onClick={() => setPage(p => p + 1)}
                className="bg-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
