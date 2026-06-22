'use client';
import Image from 'next/image';
import { useEffect, useState, useRef, useCallback } from 'react';
import { IconShieldCheck, IconBolt, IconHeart, IconAward, IconMapPin, IconClock, IconMessageCircle } from '@tabler/icons-react';
import WhatsAppLink from '@/components/shared/WhatsAppLink';
import { apiFetch } from '@/lib/api';
import { resolveImageUrl } from '@/lib/images';
import { Testimonial } from '@/types/api.types';
import { useCmsStore } from '@/store/cms.store';

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

export default function AboutPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    aboutHeroTitle,
    aboutStory,
    trustInspectionPoints,
    fetchSettings
  } = useCmsStore();

  useEffect(() => {
    document.title = 'Tentang Kami — Soulani Auto Garage';
    loadTestimonials();
    fetchSettings();
  }, [fetchSettings]);

  const stats = [
    { value: '500+', label: 'Kendaraan Terjual' },
    { value: '1.000+', label: 'Pelanggan Puas' },
    { value: '5 Tahun', label: 'Pengalaman' },
    { value: `${trustInspectionPoints || '150'} Titik`, label: 'Standar Inspeksi' },
  ];

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Testimonial[]>('/testimonials/public');
      setTestimonials(res);
    } catch (err) {
      console.error('Failed to load testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = useCallback(() => {
    if (testimonials.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const handlePrev = useCallback(() => {
    if (testimonials.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const resetAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
    }
    autoplayTimer.current = setInterval(() => {
      handleNext();
    }, 5000);
  }, [handleNext]);

  useEffect(() => {
    if (testimonials.length > 0) {
      resetAutoplay();
    }
    return () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
    };
  }, [testimonials, resetAutoplay]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            {aboutHeroTitle || 'Tentang Soulani Auto Garage'}
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
          {stats.map(({ value, label }) => (
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
              {aboutStory || 'Soulani Auto Garage didirikan dengan satu tujuan sederhana: membuat proses membeli dan menyewa mobil menjadi pengalaman yang menyenangkan, mudah, dan dapat dipercaya.'}
            </p>
            <p className="text-slate-600 leading-relaxed">
              Kami percaya bahwa setiap orang berhak mendapatkan kendaraan berkualitas dengan harga
              yang jujur dan proses yang transparan. Tidak ada biaya tersembunyi, tidak ada tekanan,
              hanya pelayanan yang tulus dari sesama pecinta otomotif.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 text-center">
            <p className="text-6xl font-extrabold text-blue-600 mb-2">{trustInspectionPoints || '150'}</p>
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

      {/* Dynamic Testimonial Carousel */}
      <section className="py-16 px-4 bg-white border-y border-slate-100 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Testimoni Pelanggan</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Apa Kata Mereka Tentang Kami</h2>
            <p className="text-slate-500 mt-2">Ulasan jujur dari para pelanggan setia Soulani Auto Garage</p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 animate-pulse font-medium">Memuat testimoni...</div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic">Belum ada testimoni yang diterbitkan.</div>
          ) : (
            <div className="relative bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm">
              {/* Carousel Content */}
              <div className="min-h-[160px] flex flex-col justify-between">
                <div>
                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                      <span key={i} className="text-amber-400 text-lg">★</span>
                    ))}
                    {Array.from({ length: 5 - testimonials[activeIndex].rating }).map((_, i) => (
                      <span key={i} className="text-slate-200 text-lg">★</span>
                    ))}
                  </div>

                  {/* Quote Message */}
                  <p className="text-slate-700 text-base sm:text-lg italic leading-relaxed mb-6 font-sans">
                    &quot;{testimonials[activeIndex].quoteText}&quot;
                  </p>
                </div>

                {/* Customer Details */}
                <div className="flex items-center gap-4 mt-4 border-t border-slate-200/60 pt-4">
                  {testimonials[activeIndex].avatarUrl ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white ring-2 ring-slate-100 shadow-sm">
                      <Image
                        src={resolveImageUrl(testimonials[activeIndex].avatarUrl)}
                        alt={testimonials[activeIndex].authorName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center border border-blue-200 shadow-sm">
                      {testimonials[activeIndex].authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">{testimonials[activeIndex].authorName}</h4>
                    {testimonials[activeIndex].authorTitle && (
                      <p className="text-xs text-slate-500 font-medium">{testimonials[activeIndex].authorTitle}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="absolute right-8 bottom-8 flex gap-2">
                <button
                  onClick={() => {
                    handlePrev();
                    resetAutoplay();
                  }}
                  className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                  aria-label="Previous testimonial"
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    handleNext();
                    resetAutoplay();
                  }}
                  className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                  aria-label="Next testimonial"
                >
                  →
                </button>
              </div>

              {/* Dot Indicators */}
              <div className="absolute left-8 bottom-8 flex gap-1.5">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveIndex(index);
                      resetAutoplay();
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
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
              <WhatsAppLink className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-8 py-4 rounded-xl transition-all active:scale-95 text-lg shadow-lg shadow-green-100">
                <IconMessageCircle size={24} />
                Hubungi via WhatsApp
              </WhatsAppLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
