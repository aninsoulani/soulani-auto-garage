import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

interface CmsState {
  whatsappNumber: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  contactEmail: string | null;
  isLoaded: boolean;
  fetchSettings: () => Promise<void>;
}

export const useCmsStore = create<CmsState>((set, get) => ({
  whatsappNumber: null,
  heroHeadline: null,
  heroSubheadline: null,
  contactEmail: null,
  isLoaded: false,
  fetchSettings: async () => {
    if (get().isLoaded) return;
    try {
      const data = await apiFetch<Record<string, string>>('/cms/homepage');
      set({
        whatsappNumber: data.whatsappNumber || '',
        heroHeadline: data.heroHeadline || 'Premium Cars for Sale & Rent',
        heroSubheadline: data.heroSubheadline || 'Your trusted auto garage partner',
        contactEmail: data.contactEmail || 'contact@soulani.com',
        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load CMS settings:', error);
      // Fallbacks
      set({
        whatsappNumber: '',
        isLoaded: true,
      });
    }
  },
}));
