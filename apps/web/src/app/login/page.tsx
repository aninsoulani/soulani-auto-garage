'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import type { User } from '@/types/api.types';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ accessToken: string; user: User }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(values) }
      );
      setAuth(res.accessToken, res.user);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid email or password. Please try again.');
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Soulani Auto Garage</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to the Admin Portal</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-sm text-red-400 text-center animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-slate-300 ml-1">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="username@gmail.com"
                        disabled={isLoading}
                        className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus-visible:border-blue-500 focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-400 ml-1" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-slate-300 ml-1">Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={isLoading}
                          className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 transition-all focus-visible:border-blue-500 focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-50"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        tabIndex={-1}
                      >
                        {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                      </button>
                    </div>
                    <FormMessage className="text-xs text-red-400 ml-1" />
                  </FormItem>
                )}
              />

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
          </Form>
        </div>

        <p className="mt-8 text-center text-xs font-medium text-slate-500">
          &copy; {new Date().getFullYear()} Soulani Auto Garage
        </p>
      </div>
    </main>
  );
}
