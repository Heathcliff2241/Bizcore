'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface Typography {
  titleFont: string;
  textFont: string;
  contentFont: string;
}

export interface Layout {
  headerStyle: 'modern' | 'classic' | 'minimal';
  footerStyle: 'minimal' | 'detailed' | 'social';
  sectionSpacing: 'comfortable' | 'compact' | 'spacious';
}

export interface SEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export interface DashboardSettings {
  brandColors: BrandColors;
  typography: Typography;
  layout: Layout;
  seo: SEO;
}

interface SettingsContextType {
  settings: DashboardSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<DashboardSettings>) => Promise<void>;
  refetchSettings: () => Promise<void>;
}

const defaultSettings: DashboardSettings = {
  brandColors: {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#34d399',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
  },
  typography: {
    titleFont: 'Inter',
    textFont: 'Inter',
    contentFont: 'Inter',
  },
  layout: {
    headerStyle: 'modern',
    footerStyle: 'minimal',
    sectionSpacing: 'comfortable',
  },
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: '',
  },
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        // Handle 403 gracefully - user might not have a tenant yet
        if (response.status === 403) {
          console.warn('User is not associated with a tenant, using default settings');
          setSettings(defaultSettings);
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch settings: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(errorMsg);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (newSettings: Partial<DashboardSettings>) => {
      try {
        setError(null);
        const mergedSettings = { ...settings, ...newSettings };

        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: mergedSettings }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/signin');
            return;
          }
          const errorText = await response.text();
          throw new Error(`Failed to update settings: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update settings';
        setError(errorMsg);
        console.error('Error updating settings:', err);
        throw err;
      }
    },
    [settings, router]
  );

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    updateSettings,
    refetchSettings: fetchSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
