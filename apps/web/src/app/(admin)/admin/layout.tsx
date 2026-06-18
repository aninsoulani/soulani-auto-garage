'use client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, LayoutDashboard, Car, Users, LogOut, ChevronDown, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiFetch } from '@/lib/api';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  password: z.string().optional().refine((val) => !val || val.length >= 8, {
    message: "Password must be at least 8 characters",
  }),
  confirmPassword: z.string().optional()
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);

  // Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const fetchProfile = async () => {
    try {
      if (!accessToken) return;
      const res = await apiFetch<any>('/auth/profile', { token: accessToken });
      setDbUser(res);
    } catch (e) {
      console.error('Failed to fetch profile', e);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    } else if (mounted && user) {
      fetchProfile();
    }
  }, [mounted, user, router]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(profileSchema as any),
    defaultValues: { name: '', password: '', confirmPassword: '' }
  });

  const watchPassword = watch('password');

  useEffect(() => {
    if (dbUser) {
      reset({ name: dbUser.name, password: '', confirmPassword: '' });
    }
  }, [dbUser, reset]);

  const onSubmitProfile = async (data: any) => {
    setIsUpdating(true);
    setUpdateError('');
    try {
      const payload: any = { name: data.name };
      if (data.password) {
        payload.password = data.password;
      }
      await apiFetch('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
        token: accessToken || undefined
      });
      await fetchProfile();
      setProfileModalOpen(false);
      // Optional: Show success toast here if you have a toast provider
    } catch (e: any) {
      setUpdateError(e.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

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
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-gray-200 focus:outline-none">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{dbUser?.name || 'Loading...'}</p>
                <p className="text-xs text-gray-500 font-medium">{dbUser?.role?.replace('_', ' ')}</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 text-blue-600 font-bold rounded-full flex items-center justify-center shrink-0 border border-blue-200 shadow-sm">
                {dbUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2 border-b border-gray-100 sm:hidden">
                <p className="text-sm font-semibold text-gray-800">{dbUser?.name}</p>
                <p className="text-xs text-gray-500">{dbUser?.role}</p>
              </div>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setProfileModalOpen(true)}>
                <Settings size={16} className="mr-2" />
                <span>Change Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                onClick={() => { clearAuth(); router.push('/login'); }}
              >
                <LogOut size={16} className="mr-2" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>

      {/* Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
            <DialogDescription>
              Change your profile details and password here.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4 pt-4">
            {updateError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {updateError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={dbUser?.email || ''}
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="Your name"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">New Password <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input
                type="password"
                {...register('password')}
                placeholder="Leave blank to keep current"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message as string}</p>}
            </div>

            {watchPassword ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirm New Password</label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Confirm new password"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message as string}</p>}
              </div>
            ) : null}

            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
