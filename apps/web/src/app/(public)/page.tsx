import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, RotateCcw, Award, MessageCircle } from 'lucide-react';
import { getFeaturedVehicles, getNewArrivalVehicles, getTestimonials } from '@/lib/api';
import { buildGenericWhatsAppUrl } from '@/lib/whatsapp';
import VehicleCard from '@/components/vehicles/VehicleCard';
import SectionHeader from '@/components/shared/SectionHeader';
import SkeletonCard from '@/components/shared/SkeletonCard';
import type { Vehicle, Testimonial } from '@/types/api.types';
import { getInitials, getAvatarColor } from '@/lib/utils';
import HeroSearchBar from './_components/HeroSearchBar';

export const metadata: Metadata = {
  title: 'Soulani Auto Garage — Beli & Sewa Mobil Terpercaya',
  description:
    'Platform jual beli dan sewa mobil terpercaya di Indonesia. Setiap mobil diinspeksi 150 titik untuk menjamin kualitas terbaik. Proses cepat, harga transparan.',
  openGraph: {
    title: 'Soulani Auto Garage',
    description: 'Beli atau sewa mobil dengan inspeksi 150 titik. Proses cepat & transparan.',
    type: 'website',
  },
};

// Revalidate homepage data hourly
export const revalidate = 3600;

// ─── Body Types ──────────────────────────────────────────────────────────────

const BODY_TYPES = [
  { label: 'SUV', href: '/sales?carType=SUV' },
  { label: 'MPV', href: '/sales?carType=MPV' },
  { label: 'Hatchback', href: '/sales?carType=HATCHBACK' },
  { label: 'Sedan', href: '/sales?carType=SEDAN' },
  { label: 'Crossover', href: '/sales?carType=CROSSOVER' },
];

// ─── Trust Items ─────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Inspeksi 150 Titik',
    desc: 'Setiap kendaraan diuji menyeluruh sebelum dijual',
  },
  {
    icon: RotateCcw,
    title: '5 Hari Uang Kembali',
    desc: 'Tidak puas? Kembalikan dalam 5 hari',
  },
  {
    icon: Award,
    title: 'Garansi 1 Tahun',
    desc: 'Proteksi mesin & transmisi selama 12 bulan',
  },
];

// ─── Star Rating Component ────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-slate-200'}>
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

function TestimonialCard({ t }: { t: Testimonial }) {
  const initials = getInitials(t.authorName);
  const avatarColor = getAvatarColor(t.authorName);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3 min-w-[280px] sm:min-w-0">
      <StarRating rating={t.rating} />
      <p className="text-sm text-slate-600 leading-relaxed flex-1">&quot;{t.quoteText}&quot;</p>
      <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
        <div
          className={`w-9 h-9 ${avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">{t.authorName}</p>
          {t.authorTitle && (
            <p className="text-xs text-slate-400">{t.authorTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Parallel data fetching
  const [featuredVehicles, newArrivals, testimonials] = await Promise.allSettled([
    getFeaturedVehicles(8),
    getNewArrivalVehicles(4),
    getTestimonials(),
  ]);

  const featured: Vehicle[] =
    featuredVehicles.status === 'fulfilled' ? featuredVehicles.value : [];
  const arrivals: Vehicle[] =
    newArrivals.status === 'fulfilled' ? newArrivals.value : [];
  const reviews: Testimonial[] =
    testimonials.status === 'fulfilled' ? testimonials.value : [];

  return (
    <div className="bg-[#F9FAFB]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3">
            Temukan Mobil <br className="hidden sm:block" />
            <span className="text-blue-200">Impian Anda</span>
          </h1>
          <p className="text-blue-100 text-base sm:text-lg mb-8 max-w-lg mx-auto">
            Beli atau sewa mobil dengan jaminan inspeksi 150 titik. Harga transparan, proses cepat.
          </p>

          {/* Search bar */}
          <HeroSearchBar />

          {/* Quick filter pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <Link
              href="/sales?maxPrice=200000000"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full transition-colors border border-white/30"
            >
              Di bawah 200 Juta
            </Link>
            <Link
              href="/sales?transmission=AUTOMATIC"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full transition-colors border border-white/30"
            >
              Transmisi Otomatis
            </Link>
            <Link
              href="/sales?isNewArrival=true"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full transition-colors border border-white/30"
            >
              Baru Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Badges ──────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        {/* ── Browse by Body Type ──────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Telusuri Berdasarkan Tipe" />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5">
            {BODY_TYPES.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="border border-gray-200 bg-white hover:border-gray-900 transition-all duration-200 text-sm font-medium text-gray-900 tracking-wide px-6 py-3 rounded-full text-center shrink-0 sm:shrink"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Vehicles ──────────────────────────────────────────── */}
        {(featured.length > 0 || true) && (
          <section>
            <SectionHeader
              title="Pilihan Terbaik Kami"
              subtitle="Kendaraan unggulan yang telah diinspeksi menyeluruh"
              viewAllHref="/sales?isFeatured=true"
            />
            {featured.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {featured.slice(0, 8).map((v) => (
                  <VehicleCard key={v.id} vehicle={v} variant="sale" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Fallback skeleton while inventory is being added */}
                {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
              </div>
            )}
          </section>
        )}

        {/* ── New Arrivals ─────────────────────────────────────────────────── */}
        {arrivals.length > 0 && (
          <section>
            <SectionHeader
              title="Baru Masuk"
              subtitle="Kendaraan terbaru yang baru saja tersedia"
              viewAllHref="/sales?isNewArrival=true"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {arrivals.slice(0, 4).map((v) => (
                <VehicleCard key={v.id} vehicle={v} variant="sale" />
              ))}
            </div>
          </section>
        )}

        {/* ── Testimonials ──────────────────────────────────────────────── */}
        {reviews.length > 0 && (
          <section>
            <SectionHeader title="Kata Pelanggan Kami" centered />
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3">
              {reviews.map((t) => (
                <TestimonialCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── WhatsApp CTA Banner ──────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Ada pertanyaan?</h2>
            <p className="text-slate-400 text-sm">
              Chat langsung dengan tim kami. Kami siap membantu Anda menemukan mobil yang tepat.
            </p>
          </div>
          <a
            href={buildGenericWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-8 py-4 rounded-2xl transition-all duration-150 active:scale-95 whitespace-nowrap shrink-0 text-base"
          >
            <MessageCircle size={20} />
            Chat via WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
