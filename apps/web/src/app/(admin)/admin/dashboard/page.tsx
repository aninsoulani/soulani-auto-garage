'use client';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name || 'Admin'}!</h1>
        <p className="text-gray-500 mt-1">Here is the overview of your garage today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Vehicles</p>
          <h2 className="text-3xl font-bold text-gray-800">124</h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Vehicles For Sale</p>
          <h2 className="text-3xl font-bold text-blue-600">82</h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Rental Fleet</p>
          <h2 className="text-3xl font-bold text-emerald-600">42</h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Featured Vehicles</p>
          <h2 className="text-3xl font-bold text-purple-600">12</h2>
        </div>
      </div>
    </div>
  );
}
