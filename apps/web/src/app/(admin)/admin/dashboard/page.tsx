'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import { Car, CheckCircle, Tag, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiFetch('/analytics/dashboard', {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Car size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Total Vehicles</p>
            <h2 className="text-2xl font-bold text-gray-800">{metrics.totalVehicles}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Available (Sale/Rent)</p>
            <h2 className="text-2xl font-bold text-emerald-600">{metrics.availableVehicles}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Sold Vehicles</p>
            <h2 className="text-2xl font-bold text-purple-600">{metrics.soldVehicles}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Rented Vehicles</p>
            <h2 className="text-2xl font-bold text-orange-600">{metrics.rentedVehicles}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory Distribution</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">By Listing Type</p>
              <div className="flex gap-4">
                <div className="bg-slate-50 px-4 py-2 rounded border border-slate-100 text-sm text-slate-800"><span className="text-blue-600 font-bold">{metrics.listingTypeDistribution?.['SALE'] || 0}</span> Sale</div>
                <div className="bg-slate-50 px-4 py-2 rounded border border-slate-100 text-sm text-slate-800"><span className="text-blue-600 font-bold">{metrics.listingTypeDistribution?.['RENTAL'] || 0}</span> Rental</div>
                <div className="bg-slate-50 px-4 py-2 rounded border border-slate-100 text-sm text-slate-800"><span className="text-blue-600 font-bold">{metrics.listingTypeDistribution?.['BOTH'] || 0}</span> Both</div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Top Car Types</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics.carTypeDistribution).map(([type, count]) => (
                  <div key={type} className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600">
                    {type}: <span className="font-bold text-slate-800">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Recent Leads</h3>
            <Link href="/admin/leads" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {metrics.recentLeads.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center border-2 border-dashed rounded-lg">No recent leads found.</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 border border-slate-200">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{lead.customerName}</p>
                      <p className="text-xs text-gray-500">{lead.vehicle?.make} {lead.vehicle?.model} • {lead.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-200 text-slate-700 mb-1">{lead.status}</span>
                    <p className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
