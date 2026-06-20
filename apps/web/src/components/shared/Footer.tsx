import Link from 'next/link';
import { IconCar, IconBrandWhatsappFilled, IconBrandInstagram, IconMapPin, IconPhone, IconMail, IconBrandFacebook } from '@tabler/icons-react';
import { buildGenericWhatsAppUrl } from '@/lib/whatsapp';

const QUICK_LINKS = [
  { href: '/sales', label: 'Mobil Dijual' },
  { href: '/rental', label: 'Sewa Mobil' },
  { href: '/tentang-kami', label: 'Tentang Kami' },
  { href: '/kontak', label: 'Kontak Kami' },
];

const SOCIAL_LINKS = [
  { href: 'https://instagram.com/', icon: IconBrandInstagram, label: 'Instagram' },
  { href: 'https://facebook.com/', icon: IconBrandFacebook, label: 'Facebook' },
  {
    href: buildGenericWhatsAppUrl(),
    icon: IconBrandWhatsappFilled,
    label: 'WhatsApp',
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <IconCar size={18} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg">Soulani Auto Garage</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Platform jual beli dan sewa mobil terpercaya. Setiap mobil diinspeksi secara menyeluruh
              untuk memastikan kualitas terbaik.
            </p>
            <div className="flex gap-3 mt-5">
              {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-150"
                >
                  <Icon size={16} className="text-slate-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wide">
              Navigasi
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wide">
              Hubungi Kami
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-2 items-start">
                <IconMapPin size={15} className="shrink-0 mt-0.5 text-blue-400" />
                <span>Jakarta, Indonesia</span>
              </li>
              <li className="flex gap-2 items-center">
                <IconPhone size={15} className="shrink-0 text-blue-400" />
                <a href="tel:+6281210663530" className="hover:text-white transition-colors">
                  +62 812-1066-3530
                </a>
              </li>
              <li className="flex gap-2 items-center">
                <IconMail size={15} className="shrink-0 text-blue-400" />
                <a
                  href="mailto:info@soulanigarage.com"
                  className="hover:text-white transition-colors"
                >
                  info@soulanigarage.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {currentYear} Soulani Auto Garage. Semua hak dilindungi.</span>
          <div className="flex gap-4">
            <Link href="/privasi" className="hover:text-slate-300 transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/syarat" className="hover:text-slate-300 transition-colors">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
