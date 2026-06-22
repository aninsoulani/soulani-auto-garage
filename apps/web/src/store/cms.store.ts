import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

interface CmsState {
  whatsappNumber: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  contactPhone: string | null;
  contactHoursWeekday: string | null;
  contactHoursWeekend: string | null;
  contactMapsEmbedUrl: string | null;
  trustInspectionPoints: string | null;
  trustReturnDays: string | null;
  trustWarrantyMonths: string | null;
  aboutHeroTitle: string | null;
  aboutStory: string | null;
  isLoaded: boolean;
  fetchSettings: () => Promise<void>;
}

export const useCmsStore = create<CmsState>((set, get) => ({
  whatsappNumber: null,
  heroHeadline: null,
  heroSubheadline: null,
  contactEmail: null,
  contactAddress: null,
  contactPhone: null,
  contactHoursWeekday: null,
  contactHoursWeekend: null,
  contactMapsEmbedUrl: null,
  trustInspectionPoints: null,
  trustReturnDays: null,
  trustWarrantyMonths: null,
  aboutHeroTitle: null,
  aboutStory: null,
  isLoaded: false,
  fetchSettings: async () => {
    if (get().isLoaded) return;
    try {
      const data = await apiFetch<Record<string, string>>('/cms/homepage');
      set({
        whatsappNumber: data.whatsappNumber || '',
        heroHeadline: data.heroHeadline || 'Premium Cars for Sale & Rent',
        heroSubheadline: data.heroSubheadline || 'Your trusted auto garage partner',
        contactEmail: data.contactEmail || 'info@soulanigarage.com',
        contactAddress: data.contactAddress || 'Jakarta, Indonesia',
        contactPhone: data.contactPhone || '+62 800-000-0000',
        contactHoursWeekday: data.contactHoursWeekday || 'Senin – Sabtu: 09.00 – 18.00',
        contactHoursWeekend: data.contactHoursWeekend || 'Minggu: 10.00 – 15.00',
        contactMapsEmbedUrl: data.contactMapsEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8195613!3d-6.2090581!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f4264b7bec93%3A0xdffa24a3d6d7b038!2sJakarta%2C%20Indonesia!5e0!3m2!1sen!2s!4v1718000000000!5m2!1sen!2s',
        trustInspectionPoints: data.trustInspectionPoints || '150',
        trustReturnDays: data.trustReturnDays || '5',
        trustWarrantyMonths: data.trustWarrantyMonths || '12',
        aboutHeroTitle: data.aboutHeroTitle || 'Tentang Soulani Auto Garage',
        aboutStory: data.aboutStory || 'Soulani Auto Garage didirikan dengan satu tujuan sederhana: membuat proses membeli dan menyewa mobil menjadi pengalaman yang menyenangkan, mudah, dan dapat dipercaya.',
        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load CMS settings:', error);
      // Fallbacks
      set({
        whatsappNumber: '',
        heroHeadline: '',
        heroSubheadline: '',
        contactEmail: '',
        contactAddress: '',
        contactPhone: '',
        contactHoursWeekday: '',
        contactHoursWeekend: '',
        contactMapsEmbedUrl: '',
        trustInspectionPoints: '',
        trustReturnDays: '',
        trustWarrantyMonths: '',
        aboutHeroTitle: '',
        aboutStory: '',
        isLoaded: true,
      });
    }
  },
}));
