'use client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, LayoutDashboard, Car, Users, LogOut, ChevronDown } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [mounted, user, router]);

  if (!mounted) return null;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-300 z-20 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className={`h-16 flex items-center border-b border-slate-800 ${collapsed ? 'justify-center' : 'justify-between px-6'}`}>
          {!collapsed && <span className="text-lg font-bold tracking-tight">Soulani Auto Garage</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white shrink-0">
            <Menu size={20} />
          </button>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
          <Link href="/admin/dashboard" title="Dashboard" className={`flex items-center py-3 rounded-lg transition ${collapsed ? 'justify-center' : 'justify-start gap-3 px-3'} ${pathname === '/admin/dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard size={20} className="shrink-0" />
            {!collapsed && <span className="font-medium text-sm">Dashboard</span>}
          </Link>
          <Link href="/admin/inventory" title="Inventory" className={`flex items-center py-3 rounded-lg transition ${collapsed ? 'justify-center' : 'justify-start gap-3 px-3'} ${pathname.startsWith('/admin/inventory') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <Car size={20} className="shrink-0" />
            {!collapsed && <span className="font-medium text-sm">Inventory</span>}
          </Link>
          <Link href="/admin/crm" title="CRM Leads" className={`flex items-center py-3 rounded-lg transition ${collapsed ? 'justify-center' : 'justify-start gap-3 px-3'} ${pathname.startsWith('/admin/crm') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <Users size={20} className="shrink-0" />
            {!collapsed && <span className="font-medium text-sm">CRM Leads</span>}
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 px-6 flex justify-end items-center relative z-10">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-gray-200"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500 font-medium">{user.role.replace('_', ' ')}</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 text-blue-600 font-bold rounded-full flex items-center justify-center shrink-0 border border-blue-200 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20">
                  <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <button
                    onClick={() => { clearAuth(); router.push('/login'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium transition"
                  >
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
