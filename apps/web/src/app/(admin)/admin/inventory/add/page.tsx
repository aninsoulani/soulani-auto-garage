import VehicleForm from '@/components/admin/VehicleForm';
import Link from 'next/link';

export default function AddVehiclePage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/inventory" className="text-gray-500 hover:text-black font-medium transition">&larr; Back to Inventory</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Vehicle</h1>
      <VehicleForm />
    </div>
  );
}
