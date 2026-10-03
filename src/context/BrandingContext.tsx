'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '@/lib/axios';
import { applyThemeTokensToDOM } from '@/lib/colorUtils';

export interface BrandingConfig {
  platformName: string;
  instructorName: string;
  slogan: string;
  contactPhone: string;
  contactEmail: string;
  supportWhatsApp: string;
  assets: {
    logoUrl: string;
    faviconUrl: string;
    heroBannerUrl: string;
    loginIllustrationUrl: string;
    defaultAvatarUrl: string;
  };
  themeTokens: {
    primaryColor: string;
    accentColor: string;
  };
}

export const DEFAULT_BRANDING: BrandingConfig = {
  platformName: 'NexvoLearn',
  instructorName: 'Danidu',
  slogan: 'Empowering Minds Through Modern Education',
  contactPhone: '+94 77 123 4567',
  contactEmail: 'support@nexvolearn.com',
  supportWhatsApp: '+94771234567',
  assets: {
    logoUrl: '/images/logo.svg',
    faviconUrl: '/favicon.ico',
    heroBannerUrl: '/images/hero.png',
    loginIllustrationUrl: '/images/login.png',
    defaultAvatarUrl: '/images/avatar.png',
  },
  themeTokens: {
    primaryColor: '#4f46e5',
    accentColor: '#06b6d4',
  },
};

interface BrandingContextProps {
  branding: BrandingConfig;
  loading: boolean;
  updateBranding: (data: Partial<BrandingConfig>, files?: Record<string, File>) => Promise<void>;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextProps>({
  branding: DEFAULT_BRANDING,
  loading: true,
  updateBranding: async () => {},
  refreshBranding: async () => {},
});

export const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('lms_branding_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            return {
              ...DEFAULT_BRANDING,
              ...parsed,
              assets: { ...DEFAULT_BRANDING.assets, ...(parsed.assets || {}) },
              themeTokens: { ...DEFAULT_BRANDING.themeTokens, ...(parsed.themeTokens || {}) },
            };
          }
        }
      } catch {
        // Fallback to default
      }
    }
    return DEFAULT_BRANDING;
  });
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/system/config');
      if (res.data?.data) {
        const merged = {
          ...DEFAULT_BRANDING,
          ...res.data.data,
          assets: { ...DEFAULT_BRANDING.assets, ...(res.data.data.assets || {}) },
          themeTokens: { ...DEFAULT_BRANDING.themeTokens, ...(res.data.data.themeTokens || {}) },
        };
        setBranding(merged);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('lms_branding_config', JSON.stringify(merged));
          } catch {
            // Ignore
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch dynamic branding, using defaults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  // Inject CSS variables into :root for dynamic primary and accent themes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      applyThemeTokensToDOM(
        branding.themeTokens?.primaryColor,
        branding.themeTokens?.accentColor
      );

      // Update document title if default
      if (document.title.includes('Mr MathsScience') || document.title.includes('NexvoLearn')) {
        document.title = `${branding.platformName} | ${branding.instructorName}`;
      }
    }
  }, [branding]);

  const updateBranding = async (
    data: Partial<BrandingConfig>,
    files?: Record<string, File>
  ) => {
    // Immediately apply theme changes to DOM and state for zero-latency feedback
    if (data.themeTokens?.primaryColor || data.themeTokens?.accentColor) {
      applyThemeTokensToDOM(
        data.themeTokens.primaryColor || branding.themeTokens.primaryColor,
        data.themeTokens.accentColor || branding.themeTokens.accentColor
      );
    }

    const optimistic: BrandingConfig = {
      ...branding,
      ...data,
      assets: { ...branding.assets, ...(data.assets || {}) },
      themeTokens: { ...branding.themeTokens, ...(data.themeTokens || {}) },
    };
    setBranding(optimistic);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lms_branding_config', JSON.stringify(optimistic));
      } catch {
        // Ignore
      }
    }

    const formData = new FormData();

    if (data.platformName !== undefined) formData.append('platformName', data.platformName);
    if (data.instructorName !== undefined) formData.append('instructorName', data.instructorName);
    if (data.slogan !== undefined) formData.append('slogan', data.slogan);
    if (data.contactPhone !== undefined) formData.append('contactPhone', data.contactPhone);
    if (data.contactEmail !== undefined) formData.append('contactEmail', data.contactEmail);
    if (data.supportWhatsApp !== undefined) formData.append('supportWhatsApp', data.supportWhatsApp);

    if (data.assets) formData.append('assets', JSON.stringify(data.assets));
    if (data.themeTokens) formData.append('themeTokens', JSON.stringify(data.themeTokens));

    if (files) {
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          formData.append(key, file);
        }
      }
    }

    const res = await API.put('/system/config', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data?.data) {
      const updated: BrandingConfig = {
        ...DEFAULT_BRANDING,
        ...res.data.data,
        assets: { ...DEFAULT_BRANDING.assets, ...(res.data.data.assets || {}) },
        themeTokens: { ...DEFAULT_BRANDING.themeTokens, ...(res.data.data.themeTokens || {}) },
      };
      setBranding(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lms_branding_config', JSON.stringify(updated));
        } catch {
          // Ignore
        }
      }
    }
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        updateBranding,
        refreshBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
