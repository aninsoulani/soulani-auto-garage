'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch } from '@tabler/icons-react';

export default function HeroSearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    router.push(`/sales?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-xl max-w-xl mx-auto"
      role="search"
    >
      <IconSearch size={18} className="text-slate-400 ml-2 shrink-0" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari merek, model... (Alphard, Innova, Brio)"
        className="flex-1 text-slate-900 text-sm bg-transparent outline-none placeholder-slate-400 py-1"
        aria-label="Cari mobil"
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors active:scale-95 shrink-0"
      >
        Cari
      </button>
    </form>
  );
}
