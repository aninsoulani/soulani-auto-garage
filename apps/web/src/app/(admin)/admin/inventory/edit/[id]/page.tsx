'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import VehicleForm from '@/components/admin/VehicleForm';
import type { Vehicle } from '@/types/api.types';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditVehiclePage() {
  const { id } = useParams();
  const [data, setData] = useState<Partial<Vehicle> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Vehicle>(`/vehicles/${id}`).then((res) => {
      setData(res);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading vehicle details...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Vehicle not found</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/inventory" className="text-gray-500 hover:text-black font-medium transition">&larr; Back to Inventory</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Vehicle: {data.make} {data.model}</h1>
      <VehicleForm initialData={data} vehicleId={id as string} />
    </div>
  );
}
