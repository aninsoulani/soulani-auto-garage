'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import { Car, Users, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { DashboardMetrics } from '@/types/api.types';

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiFetch<DashboardMetrics>('/analytics/dashboard', {
          token: accessToken || undefined,
        });
        setMetrics(res);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    if (accessToken) fetchMetrics();
  }, [accessToken]);

  if (loading || !metrics) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Dashboard Metrics...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name || 'Admin'}!</h1>
          <p className="text-gray-500 mt-1">Live overview of your garage operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Car size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Total Available Vehicles</p>
            <h2 className="text-2xl font-bold text-gray-800">{metrics.totalVehicles}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0">
            <CalendarClock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Active Rentals</p>
            <h2 className="text-2xl font-bold text-orange-600">{metrics.activeRentals}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">New Leads</p>
            <h2 className="text-2xl font-bold text-emerald-600">{metrics.newLeads}</h2>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex gap-4">
        <Link href="/admin/inventory" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition">
          Manage Inventory
        </Link>
        <Link href="/admin/leads" className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded hover:bg-blue-50 font-semibold transition">
          View Leads
        </Link>
      </div>
    </div>
  );
}
