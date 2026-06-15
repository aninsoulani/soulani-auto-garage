'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<{ data: { accessToken: string; user: any } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      );
      setAuth(res.data.accessToken, res.data.user);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Admin Login</h1>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="mb-4 w-full rounded border p-2 text-sm" required />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="mb-6 w-full rounded border p-2 text-sm" required />
        <button type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white font-medium hover:bg-blue-700">
          Log In
        </button>
      </form>
    </main>
  );
}
