'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await apiFetch<{ accessToken: string; user: any }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      );
      setAuth(res.accessToken, res.user);
      router.push('/admin/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/SoulaniAG_Banner.png')] bg-cover bg-center relative overflow-hidden">
      {/* Background overlay with dark tint and blur */}
      <div className="absolute inset-0 z-0 bg-slate-950/80 backdrop-blur-[6px] pointer-events-none" />

      {/* Decorative glows on top of background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl transition-all">
          <div className="mb-8 text-center">
            {/* <div className="flex justify-center mb-4">
              <img
                src="/SoulaniAG_Logo.png"
                alt="Soulani Auto Garage Logo"
                className="h-16 w-auto object-contain rounded"
              />
            </div> */}
            <h1 className="text-2xl font-bold tracking-tight text-white">Soulani Auto Garage</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to the Admin Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-sm text-red-400 text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="username@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-xs font-medium text-slate-500">
          &copy; {new Date().getFullYear()} Soulani Auto Garage
        </p>
      </div>
    </main>
  );
}
