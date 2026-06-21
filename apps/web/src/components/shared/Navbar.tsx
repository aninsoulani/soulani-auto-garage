'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconMenu2, IconX, IconMessageCircle, IconCar } from '@tabler/icons-react';
import WhatsAppLink from './WhatsAppLink';

const NAV_LINKS = [
  { href: '/sales', label: 'Beli Mobil' },
  { href: '/sewa-mobil', label: 'Sewa Mobil' },
  { href: '/tentang-kami', label: 'Tentang Kami' },
  { href: '/kontak', label: 'Kontak' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100' : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <IconCar size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-slate-900 leading-tight">
                Soulani<br />
                <span className="text-xs font-medium text-slate-500 leading-none">Auto Garage</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    pathname.startsWith(href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Login Admin
              </Link>
              <WhatsAppLink
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 active:scale-95"
              >
                <IconMessageCircle size={16} />
                Chat Sekarang
              </WhatsAppLink>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-white shadow-xl border-t border-slate-100 px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 mt-2">
              <WhatsAppLink
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white text-sm font-semibold px-4 py-3 rounded-xl"
              >
                <IconMessageCircle size={18} />
                Chat via WhatsApp
              </WhatsAppLink>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to push page content below fixed navbar */}
      <div className="h-16" />
    </>
  );
}
