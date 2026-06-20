import type { Metadata } from 'next';
import { IconShieldCheck, IconBolt, IconHeart, IconAward, IconMapPin, IconClock } from '@tabler/icons-react';
import { buildGenericWhatsAppUrl } from '@/lib/whatsapp';

/**
 * About Us — Static content for Phase 3.
 *
 * PHASE 6 MIGRATION NOTE:
 * In Phase 6 (CMS & Analytics), this page should be refactored to fetch
 * content from the HomepageContent table using the following keys:
 *   - `about_hero`: { title, subtitle }
 *   - `about_story`: { text }
 *   - `about_pillars`: { items: [{ icon, title, desc }] }
 *   - `about_showroom`: { address, hours, mapUrl }
 * The CMS admin UI will allow the owner to edit this content from the
 * admin dashboard without code changes or redeployment.
 */

export const metadata: Metadata = {
  title: 'Tentang Kami — Soulani Auto Garage',
  description:
    'Kenali Soulani Auto Garage — platform jual beli dan sewa mobil terpercaya di Indonesia dengan standar inspeksi tertinggi.',
};

const PILLARS = [
  {
    icon: IconShieldCheck,
    title: 'Transparansi Penuh',
    desc: 'Setiap kendaraan dilengkapi dengan laporan inspeksi lengkap. Tidak ada yang disembunyikan.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: IconBolt,
    title: 'Proses Cepat',
    desc: 'Dari pertanyaan hingga serah terima, kami memastikan prosesnya semudah dan secepat mungkin.',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: IconHeart,
    title: 'Pelayanan Tulus',
    desc: 'Tim kami adalah para pecinta otomotif yang benar-benar ingin membantu Anda menemukan mobil yang tepat.',
    color: 'text-rose-600 bg-rose-50',
  },
];

const STATS = [
  { value: '500+', label: 'Kendaraan Terjual' },
  { value: '1.000+', label: 'Pelanggan Puas' },
  { value: '5 Tahun', label: 'Pengalaman' },
  { value: '150 Titik', label: 'Standar Inspeksi' },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Tentang Soulani <br />
            <span className="text-blue-400">Auto Garage</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Kami adalah platform otomotif modern yang menggabungkan kehangatan pelayanan lokal
            dengan kecepatan dan transparansi teknologi terkini.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 text-white py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold">{value}</p>
              <p className="text-blue-200 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Kisah Kami</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-4">
              Lahir dari kecintaan terhadap otomotif
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Soulani Auto Garage didirikan dengan satu tujuan sederhana: membuat proses membeli dan
              menyewa mobil menjadi pengalaman yang menyenangkan, mudah, dan dapat dipercaya.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Kami percaya bahwa setiap orang berhak mendapatkan kendaraan berkualitas dengan harga
              yang jujur dan proses yang transparan. Tidak ada biaya tersembunyi, tidak ada tekanan,
              hanya pelayanan yang tulus dari sesama pecinta otomotif.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 text-center">
            <p className="text-6xl font-extrabold text-blue-600 mb-2">150</p>
            <p className="text-lg font-bold text-slate-800">Titik Inspeksi</p>
            <p className="text-slate-500 text-sm mt-2">
              Setiap kendaraan diperiksa secara menyeluruh oleh mekanik berpengalaman sebelum ditawarkan.
            </p>
            <div className="flex items-center justify-center gap-1 mt-4">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className="text-amber-400 text-xl">★</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Tiga Pilar Kami</h2>
            <p className="text-slate-500 mt-2">Nilai-nilai yang menjadi fondasi setiap hal yang kami lakukan</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PILLARS.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showroom Info */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12">
          <div className="flex items-center gap-3 mb-6">
            <IconAward size={28} className="text-blue-400" />
            <h2 className="text-2xl font-bold">Kunjungi Showroom Kami</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <IconMapPin size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Alamat</p>
                  <p className="text-slate-400 text-sm mt-0.5">Jakarta, Indonesia</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <IconClock size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Jam Operasional</p>
                  <p className="text-slate-400 text-sm mt-0.5">Senin – Sabtu: 09.00 – 18.00</p>
                  <p className="text-slate-400 text-sm">Minggu: 10.00 – 15.00</p>
                </div>
              </div>
            </div>
            <div>
              <a
                href={buildGenericWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-6 py-3.5 rounded-xl transition-all active:scale-95 text-sm"
              >
                💬 Hubungi Kami via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
