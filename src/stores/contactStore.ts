import { create } from 'zustand';
import type { VisitingCard, Industry } from '../types';
import {
  getContacts,
  getContactCount,
  getCompanyCount,
  getIndustryCount,
  getIndustryStats,
  getRecentContacts,
} from '../db/repositories/contactRepository';

interface ContactState {
  contacts: VisitingCard[];
  totalCards: number;
  totalCompanies: number;
  totalIndustries: number;
  industryStats: Record<Industry, number>;
  recentContacts: VisitingCard[];
  loading: boolean;
  error: string | null;
  loadContacts: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useContactStore = create<ContactState>((set) => ({
  contacts: [],
  totalCards: 0,
  totalCompanies: 0,
  totalIndustries: 0,
  industryStats: {
    Technology: 0,
    Finance: 0,
    Automotive: 0,
    Healthcare: 0,
    'Real Estate': 0,
    Other: 0,
  },
  recentContacts: [],
  loading: false,
  error: null,

  loadContacts: async () => {
    set({ loading: true, error: null });
    try {
      const [contacts, totalCards, totalCompanies, totalIndustries, industryStats, recentContacts] =
        await Promise.all([
          getContacts(),
          getContactCount(),
          getCompanyCount(),
          getIndustryCount(),
          getIndustryStats(),
          getRecentContacts(5),
        ]);

      set({
        contacts,
        totalCards,
        totalCompanies,
        totalIndustries,
        industryStats,
        recentContacts,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load contacts:', error);
      set({ error: 'Failed to load contacts', loading: false });
    }
  },

  refreshStats: async () => {
    try {
      const [totalCards, totalCompanies, totalIndustries, industryStats, recentContacts] =
        await Promise.all([
          getContactCount(),
          getCompanyCount(),
          getIndustryCount(),
          getIndustryStats(),
          getRecentContacts(5),
        ]);

      set({
        totalCards,
        totalCompanies,
        totalIndustries,
        industryStats,
        recentContacts,
      });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  },
}));
