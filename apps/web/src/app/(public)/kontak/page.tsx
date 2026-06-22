import type { Metadata } from 'next';
import { IconMapSearch, IconBrandWhatsapp, IconMailSpark, IconClock } from '@tabler/icons-react';
import { apiFetch } from '@/lib/api';
import ContactWhatsAppCTA from './_components/ContactWhatsAppCTA';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kontak Kami — Soulani Auto Garage',
  description:
    'Hubungi tim Soulani Auto Garage via WhatsApp, telepon, atau kunjungi showroom kami di Jakarta.',
};

export default async function KontakPage() {
  let settings = {
    whatsappNumber: '',
    contactEmail: 'info@soulanigarage.com',
    contactAddress: 'Jakarta, Indonesia',
    contactPhone: '+62 800-000-0000',
    contactHoursWeekday: 'Senin – Sabtu: 09.00 – 18.00',
    contactHoursWeekend: 'Minggu: 10.00 – 15.00',
    contactMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8195613!3d-6.2090581!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f4264b7bec93%3A0xdffa24a3d6d7b038!2sJakarta%2C%20Indonesia!5e0!3m2!1sen!2s!4v1718000000000!5m2!1sen!2s',
  };

  try {
    const cmsRes = await apiFetch<Record<string, string>>('/cms/homepage', { cache: 'no-store' });
    if (cmsRes) {
      settings = { ...settings, ...cmsRes };
    }
  } catch (err) {
    console.error('Failed to load contact settings:', err);
  }

  const contactItems = [
    {
      icon: IconBrandWhatsapp,
      label: 'Telepon / WhatsApp',
      value: settings.contactPhone || settings.whatsappNumber || '+62 800-000-0000',
      href: `tel:${(settings.contactPhone || settings.whatsappNumber || '+6280000000').replace(/[^0-9+]/g, '')}`,
    },
    {
      icon: IconMailSpark,
      label: 'Email',
      value: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    },
    {
      icon: IconMapSearch,
      label: 'Alamat Showroom',
      value: settings.contactAddress,
      href: `https://maps.google.com/?q=${encodeURIComponent(settings.contactAddress)}`,
    },
    {
      icon: IconClock,
      label: 'Jam Operasional',
      value: `${settings.contactHoursWeekday} · ${settings.contactHoursWeekend}`,
      href: null,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Hubungi Kami</h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Ada pertanyaan tentang kendaraan atau ingin berkunjung ke showroom? Kami siap membantu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact cards */}
        <div className="space-y-4">
          {contactItems.map(({ icon: Icon, label, value, href }) => (
            <div
              key={label}
              className="flex items-start gap-4 bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-slate-900 font-semibold hover:text-blue-600 transition-colors"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="text-slate-900 font-semibold">{value}</p>
                )}
              </div>
            </div>
          ))}

          {/* WhatsApp primary CTA */}
          <ContactWhatsAppCTA whatsappNumber={settings.whatsappNumber} />
        </div>

        {/* Google Maps embed */}
        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm h-80 md:h-full min-h-64">
          <iframe
            src={settings.contactMapsEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8195613!3d-6.2090581!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f4264b7bec93%3A0xdffa24a3d6d7b038!2sJakarta%2C%20Indonesia!5e0!3m2!1sen!2s!4v1718000000000!5m2!1sen!2s"}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '256px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Lokasi Soulani Auto Garage"
          />
        </div>
      </div>
    </div>
  );
}
