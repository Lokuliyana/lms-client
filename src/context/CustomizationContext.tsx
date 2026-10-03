'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '@/lib/axios';
import { siteConfig as defaultSiteConfig, pagesConfig as defaultPagesConfig } from '../lib/site-config';

interface CustomizationContextProps {
  siteSettings: any;
  pagesSettings: any;
  subjects: any[];
  grades: any[];
  loading: boolean;
  refreshCustomization: () => void;
}

const CustomizationContext = createContext<CustomizationContextProps>({
  siteSettings: defaultSiteConfig,
  pagesSettings: defaultPagesConfig,
  subjects: [],
  grades: [],
  loading: true,
  refreshCustomization: () => {},
});

export const CustomizationProvider = ({ children }: { children: React.ReactNode }) => {
  const [siteSettings, setSiteSettings] = useState<any>(defaultSiteConfig);
  const [pagesSettings, setPagesSettings] = useState<any>(defaultPagesConfig);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomization = async () => {
    try {
      setLoading(true);
      const [settingsRes, taxonomyRes] = await Promise.all([
        API.get('/customization/settings').catch(() => ({ data: null })),
        API.get('/customization/public/taxonomy').catch(async () => {
          const [s, g] = await Promise.all([
            API.get('/customization/subjects').catch(() => ({ data: [] })),
            API.get('/customization/grades').catch(() => ({ data: [] })),
          ]);
          return { data: { subjects: s.data || [], grades: g.data || [] } };
        }),
      ]);

      if (settingsRes.data && settingsRes.data.site) {
        setSiteSettings((prev: any) => ({ ...prev, ...settingsRes.data.site }));
      }
      if (settingsRes.data && settingsRes.data.pages) {
        setPagesSettings((prev: any) => ({ ...prev, ...settingsRes.data.pages }));
      }
      if (taxonomyRes.data) {
        setSubjects(taxonomyRes.data.subjects || []);
        setGrades(taxonomyRes.data.grades || []);
      }
    } catch (error) {
      console.error('Failed to fetch customization data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomization();
  }, []);

  return (
    <CustomizationContext.Provider
      value={{
        siteSettings,
        pagesSettings,
        subjects,
        grades,
        loading,
        refreshCustomization: fetchCustomization,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = () => useContext(CustomizationContext);

export const useTaxonomy = () => {
  const { subjects, grades, loading } = useCustomization();
  return { subjects, grades, loading };
};
