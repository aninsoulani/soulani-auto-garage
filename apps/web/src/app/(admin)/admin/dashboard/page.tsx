'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { DashboardMetrics } from '@/types/api.types';
import { formatIDR } from '@/lib/utils';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import {
  IconCar,
  IconCalendarClock,
  IconUsers,
  IconActivity,
  IconTrendingUp,
  IconCoin,
  IconReceipt,
  IconShoppingBag
} from '@tabler/icons-react';

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
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Dashboard Metrics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name || 'Admin'}!</h1>
          <p className="text-slate-500 mt-1">Soulani Auto Garage Hybrid Operations Overview.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/inventory/add" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition">
            + Add Vehicle
          </Link>
        </div>
      </div>

      {/* --- SALES OPERATIONS SECTION --- */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <IconShoppingBag className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">Used Car Sales Operations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Available Cars (Sale)</CardTitle>
              <IconCar className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.sales.availableCars}</div>
              <p className="text-xs text-slate-500 mt-1">Ready for sale</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Sold Cars</CardTitle>
              <IconCheck className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.sales.soldCars}</div>
              <p className="text-xs text-slate-500 mt-1">Total fleet sold</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Sales Revenue</CardTitle>
              <IconCoin className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{formatIDR(metrics.sales.totalRevenue)}</div>
              <p className="text-xs text-slate-500 mt-1">Gross estimate</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Buyer Prospects (Leads)</CardTitle>
              <IconUsers className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.sales.newLeads}</div>
              <p className="text-xs text-slate-500 mt-1">New unprocessed leads</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- RENTAL OPERATIONS SECTION --- */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <IconCalendarClock className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-slate-800">Car Rental Operations</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
            <Card className="border-orange-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Active Fleet</CardTitle>
                <IconActivity className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{metrics.rentals.activeRentals}</div>
                <p className="text-xs text-slate-500 mt-1">Currently rented out</p>
              </CardContent>
            </Card>

            <Card className="border-orange-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Pending Payments</CardTitle>
                <IconReceipt className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{metrics.rentals.pendingPayments}</div>
                <p className="text-xs text-slate-500 mt-1">Awaiting payment confirmation</p>
              </CardContent>
            </Card>

            <Card className="border-orange-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Utilization Rate</CardTitle>
                <IconTrendingUp className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{metrics.rentals.utilizationRate}%</div>
                <p className="text-xs text-slate-500 mt-1">Of total rental fleet</p>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 lg:col-span-8">
            <Card className="h-full border-orange-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrendingUp className="h-5 w-5 text-blue-600" /> Rental Revenue Trend (30 Days)
                </CardTitle>
                <CardDescription>Revenue from confirmed/completed bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  {metrics.rentals.revenueTrend && metrics.rentals.revenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.rentals.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
                        />
                        <RechartsTooltip
                          formatter={(value: unknown) => formatIDR(Number(value) || 0)}
                          cursor={{ fill: '#f1f5f9' }}
                        />
                        <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* --- UNIFIED RECENT ACTIVITIES --- */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Incoming rental bookings & latest sales leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Type</TableHead>
                  <TableHead>Code / Ref</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Transaction Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentActivities && metrics.recentActivities.length > 0 ? (
                  metrics.recentActivities.map((act) => (
                    <TableRow key={act.id}>
                      <TableCell>
                        {act.type === 'RENTAL' ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Rental</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Sales Lead</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{act.referenceCode}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{format(new Date(act.date), 'dd MMM yyyy, HH:mm')}</TableCell>
                      <TableCell className="text-slate-900">{act.customerName}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{act.vehicleName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          ['ACTIVE', 'WON', 'COMPLETED'].includes(act.status) ? 'text-green-600 bg-green-50 border-green-200' :
                            ['PENDING_PAYMENT', 'NEW'].includes(act.status) ? 'text-amber-600 bg-amber-50 border-amber-200' :
                              'text-slate-600 bg-slate-50 border-slate-200'
                        }>
                          {act.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {act.amount ? formatIDR(act.amount) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-500">No recent activities.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Need to define IconCheck since it's used
const IconCheck = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
    <path d="M5 12l5 5l10 -10"></path>
  </svg>
);
