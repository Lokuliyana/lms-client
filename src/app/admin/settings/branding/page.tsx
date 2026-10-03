'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CLAY_ASSETS } from '@/constants/clayAssets';
import API from '@/lib/axios';
import { useBranding } from '@/context/BrandingContext';
import { useCustomization } from '@/context/CustomizationContext';
import AccessGate from '@/components/auth/AccessGate';
import { SectionHeader } from '@/components/reusable/section-header';
import { CardSection } from '@/components/reusable/card-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/dev/input';
import { Label } from '@/components/dev/label';
import { StatCard } from '@/components/ui/stat-card';
import { applyThemeTokensToDOM } from '@/lib/colorUtils';
import { cn } from '@/lib/utils';
import {
  Paintbrush,
  Save,
  Image as ImageIcon,
  Phone,
  Mail,
  MessageSquare,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  BookOpen,
  GraduationCap,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  Undo2,
  Palette,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

const PRESET_PALETTES = [
  { name: 'Indigo Classic', primary: '#4F46E5', accent: '#06B6D4' },
  { name: 'Ocean Blue', primary: '#2563EB', accent: '#0EA5E9' },
  { name: 'Emerald Forest', primary: '#059669', accent: '#10B981' },
  { name: 'Royal Violet', primary: '#7C3AED', accent: '#C084FC' },
  { name: 'Crimson Rose', primary: '#E11D48', accent: '#F43F5E' },
  { name: 'Sunset Amber', primary: '#D97706', accent: '#F59E0B' },
  { name: 'Midnight Slate', primary: '#334155', accent: '#64748B' },
];

export default function BrandingSettingsPage() {
  const { branding, updateBranding, loading, refreshBranding } = useBranding();
  const {
    siteSettings,
    pagesSettings,
    subjects,
    grades,
    refreshCustomization,
  } = useCustomization();

  const [activeTab, setActiveTab] = useState<'branding' | 'content' | 'curriculum' | 'preview'>('branding');

  // --- Branding State ---
  const [platformName, setPlatformName] = useState(branding.platformName);
  const [instructorName, setInstructorName] = useState(branding.instructorName);
  const [slogan, setSlogan] = useState(branding.slogan);
  const [contactPhone, setContactPhone] = useState(branding.contactPhone);
  const [contactEmail, setContactEmail] = useState(branding.contactEmail);
  const [supportWhatsApp, setSupportWhatsApp] = useState(branding.supportWhatsApp);
  const [primaryColor, setPrimaryColor] = useState(branding.themeTokens?.primaryColor || '#4F46E5');
  const [accentColor, setAccentColor] = useState(branding.themeTokens?.accentColor || '#06B6D4');
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  // --- Page Content State ---
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroBullet1, setHeroBullet1] = useState('');
  const [heroBullet2, setHeroBullet2] = useState('');
  const [heroBadge1, setHeroBadge1] = useState('');
  const [heroBadge2, setHeroBadge2] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const [contentSuccess, setContentSuccess] = useState(false);

  // --- Curriculum State ---
  const [newSubject, setNewSubject] = useState('');
  const [newGrade, setNewGrade] = useState('');

  useEffect(() => {
    setPlatformName(branding.platformName);
    setInstructorName(branding.instructorName);
    setSlogan(branding.slogan);
    setContactPhone(branding.contactPhone);
    setContactEmail(branding.contactEmail);
    setSupportWhatsApp(branding.supportWhatsApp);
    setPrimaryColor(branding.themeTokens?.primaryColor || '#4F46E5');
    setAccentColor(branding.themeTokens?.accentColor || '#06B6D4');
  }, [branding]);

  useEffect(() => {
    if (pagesSettings?.about?.hero) {
      setHeroTitle(pagesSettings.about.hero.title || 'Mr. Maths Science');
      setHeroSubtitle(pagesSettings.about.hero.subtitle || '');
      setHeroBullet1(pagesSettings.about.hero.bullet1 || '');
      setHeroBullet2(pagesSettings.about.hero.bullet2 || '');
      setHeroBadge1(pagesSettings.about.hero.badge1 || '');
      setHeroBadge2(pagesSettings.about.hero.badge2 || '');
    }
  }, [pagesSettings]);

  const handlePrimaryChange = (val: string) => {
    setPrimaryColor(val);
    applyThemeTokensToDOM(val, accentColor);
  };

  const handleAccentChange = (val: string) => {
    setAccentColor(val);
    applyThemeTokensToDOM(primaryColor, val);
  };

  const handlePaletteSelect = (pColor: string, aColor: string) => {
    setPrimaryColor(pColor);
    setAccentColor(aColor);
    applyThemeTokensToDOM(pColor, aColor);
  };

  const handleResetColors = () => {
    const defaultPrimary = '#4F46E5';
    const defaultAccent = '#06B6D4';
    setPrimaryColor(defaultPrimary);
    setAccentColor(defaultAccent);
    applyThemeTokensToDOM(defaultPrimary, defaultAccent);
  };

  const handleFileChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBranding(true);
      await updateBranding(
        {
          platformName,
          instructorName,
          slogan,
          contactPhone,
          contactEmail,
          supportWhatsApp,
          themeTokens: {
            primaryColor,
            accentColor,
          },
        },
        files
      );
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save branding:', err);
      alert('Failed to save branding settings');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingContent(true);
      const updatedPages = {
        ...pagesSettings,
        about: {
          ...pagesSettings?.about,
          hero: {
            ...pagesSettings?.about?.hero,
            title: heroTitle,
            subtitle: heroSubtitle,
            bullet1: heroBullet1,
            bullet2: heroBullet2,
            badge1: heroBadge1,
            badge2: heroBadge2,
          },
        },
      };

      await API.put('/customization/settings', {
        site: siteSettings,
        pages: updatedPages,
      });

      refreshCustomization();
      setContentSuccess(true);
      setTimeout(() => setContentSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save content:', err);
      alert('Failed to save page content settings');
    } finally {
      setSavingContent(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      await API.post('/customization/subjects', { name: newSubject });
      setNewSubject('');
      refreshCustomization();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await API.delete(`/customization/subjects/${id}`);
      refreshCustomization();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddGrade = async () => {
    if (!newGrade.trim()) return;
    try {
      await API.post('/customization/grades', { name: newGrade });
      setNewGrade('');
      refreshCustomization();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGrade = async (id: string) => {
    try {
      await API.delete(`/customization/grades/${id}`);
      refreshCustomization();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AccessGate requiredPermission="branding.manage" fallbackTitle="Teacher Access Only">
      <div className="space-y-6 sm:space-y-7">
        {/* Sleek Compact Header with 3D Illustration */}
        <SectionHeader
          title="Platform Identity & Live Themes"
          breadcrumbs={[
            { label: "Home", href: "/admin/dashboard" },
            { label: "Settings" },
            { label: "Branding" },
          ]}
          description="Customize white-label brand tokens, instructor wordmark, dynamic color engine, and live page content."
          illustration={CLAY_ASSETS.brandingPaintPalette}
          variant="purple"
          icon={Paintbrush}
          badge="Live Customization Engine"
          actions={
            <Button
              variant="outline"
              onClick={() => {
                refreshBranding();
                refreshCustomization();
              }}
              disabled={loading}
              className="flex items-center gap-2 text-xs h-9 bg-white shadow-2xs hover:bg-slate-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Sync Server
            </Button>
          }
        />

        {/* Upgraded Modern Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === 'branding'
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            White-Label & Theme Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === 'content'
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Page Copy & Hero Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === 'curriculum'
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Subjects & Grades
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === 'preview'
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Component Preview
          </button>
        </div>

        {/* TAB 1: White-Label & Theme Tokens */}
        {activeTab === 'branding' && (
          <form onSubmit={handleSaveBranding} className="space-y-6 animate-in fade-in duration-200">
            {/* 🎨 THEME COLOR ENGINE SECTION */}
            <CardSection
              title="Dynamic Theme Engine & Live Palettes"
              description="Changes to Primary and Accent colors immediately reflect live across the application, buttons, class badges, and navigation."
              icon={Palette}
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetColors}
                  className="text-xs h-8 flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Reset to Default
                </Button>
              }
            >
              <div className="space-y-6">
                {/* One-Click Curated Presets */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                    One-Click Quick Palettes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {PRESET_PALETTES.map((p) => {
                      const isSelected =
                        primaryColor.toLowerCase() === p.primary.toLowerCase();
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handlePaletteSelect(p.primary, p.accent)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all group",
                            isSelected
                              ? "bg-slate-50 border-slate-900 ring-2 ring-slate-900/10 shadow-xs"
                              : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          <div className="flex items-center -space-x-1.5">
                            <span
                              className="w-5 h-5 rounded-full shadow-2xs border border-white"
                              style={{ backgroundColor: p.primary }}
                            />
                            <span
                              className="w-5 h-5 rounded-full shadow-2xs border border-white"
                              style={{ backgroundColor: p.accent }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-800 truncate w-full">
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                  {/* Primary Color Picker */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="primaryColor" className="text-xs font-bold text-slate-800">
                        Primary Brand Color (Buttons & CTA)
                      </Label>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        {primaryColor.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => handlePrimaryChange(e.target.value)}
                          className="h-11 w-14 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shadow-2xs"
                        />
                      </div>
                      <Input
                        id="primaryColor"
                        value={primaryColor}
                        onChange={(e) => handlePrimaryChange(e.target.value)}
                        placeholder="#4F46E5"
                        className="font-mono text-xs uppercase h-11 bg-white"
                      />
                      <div
                        className="h-11 px-4 rounded-xl shadow-xs border border-black/10 shrink-0 flex items-center justify-center text-xs font-bold text-white transition-colors"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Active
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Applied to class cards &apos;Join Class&apos; button, primary action buttons, active navigation, and brand markers.
                    </p>
                  </div>

                  {/* Accent Color Picker */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accentColor" className="text-xs font-bold text-slate-800">
                        Accent Color (Badges & Highlights)
                      </Label>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        {accentColor.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => handleAccentChange(e.target.value)}
                          className="h-11 w-14 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shadow-2xs"
                        />
                      </div>
                      <Input
                        id="accentColor"
                        value={accentColor}
                        onChange={(e) => handleAccentChange(e.target.value)}
                        placeholder="#06B6D4"
                        className="font-mono text-xs uppercase h-11 bg-white"
                      />
                      <div
                        className="h-11 px-4 rounded-xl shadow-xs border border-black/10 shrink-0 flex items-center justify-center text-xs font-bold text-white transition-colors"
                        style={{ backgroundColor: accentColor }}
                      >
                        Accent
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Applied to status indicators, subtle glow accents, and secondary highlights.
                    </p>
                  </div>
                </div>

                {/* Instant Live Component Verification Strip */}
                <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-slate-800">
                      Live Preview on Current Screen:
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2.5">
                    <Button variant="primary" size="sm" className="h-8 text-xs">
                      Primary Button
                    </Button>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Class CTA
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      Accent Badge
                    </span>
                  </div>
                </div>
              </div>
            </CardSection>

            {/* General Brand Details */}
            <CardSection
              title="General Identity & Wordmark"
              description="Configure platform display title, teacher/instructor identity, and global marketing slogan."
              icon={ShieldCheck}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="platformName" className="text-xs font-bold text-slate-700">
                    Platform / Academy Name
                  </Label>
                  <Input
                    id="platformName"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    placeholder="NexvoLearn"
                    className="bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructorName" className="text-xs font-bold text-slate-700">
                    Lead Instructor / Tutor Name
                  </Label>
                  <Input
                    id="instructorName"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="Danidu"
                    className="bg-white"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="slogan" className="text-xs font-bold text-slate-700">
                    Platform Tagline / Slogan
                  </Label>
                  <Input
                    id="slogan"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="Empowering Minds Through Modern Education"
                    className="bg-white"
                  />
                </div>
              </div>
            </CardSection>

            {/* Support & Contact Channels */}
            <CardSection
              title="Support & Student Contact Channels"
              description="Official helpline, support email, and instant WhatsApp direct contact."
              icon={Phone}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Contact Phone
                  </Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Support Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="support@nexvolearn.com"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportWhatsApp" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp Direct
                  </Label>
                  <Input
                    id="supportWhatsApp"
                    value={supportWhatsApp}
                    onChange={(e) => setSupportWhatsApp(e.target.value)}
                    placeholder="+94771234567"
                    className="bg-white"
                  />
                </div>
              </div>
            </CardSection>

            {/* Brand Assets */}
            <CardSection
              title="Brand Media & Vector Assets"
              description="Custom brand logos, browser favicons, and student portal hero illustrations."
              icon={ImageIcon}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    Site Logo (Vector / SVG preferred)
                  </Label>
                  <Input
                    type="file"
                    accept="image/*,.svg"
                    onChange={(e) => handleFileChange('logo', e)}
                    className="bg-white"
                  />
                  <p className="text-[11px] text-slate-400 truncate">Current: {branding.assets.logoUrl}</p>
                </div>
                <div className="space-y-2 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    Browser Favicon (.ico or .png)
                  </Label>
                  <Input
                    type="file"
                    accept="image/*,.ico"
                    onChange={(e) => handleFileChange('favicon', e)}
                    className="bg-white"
                  />
                  <p className="text-[11px] text-slate-400 truncate">Current: {branding.assets.faviconUrl}</p>
                </div>
                <div className="space-y-2 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    Hero Banner Image
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('heroBanner', e)}
                    className="bg-white"
                  />
                  <p className="text-[11px] text-slate-400 truncate">Current: {branding.assets.heroBannerUrl}</p>
                </div>
                <div className="space-y-2 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    Login Portal Illustration
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('loginIllustration', e)}
                    className="bg-white"
                  />
                  <p className="text-[11px] text-slate-400 truncate">Current: {branding.assets.loginIllustrationUrl}</p>
                </div>
              </div>
            </CardSection>

            {/* Save Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {brandingSuccess && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Branding settings saved and synced!
                </span>
              )}
              <Button
                type="submit"
                disabled={savingBranding}
                variant="primary"
                className="flex items-center gap-2 px-6 h-10 shadow-sm"
              >
                <Save className="w-4 h-4" />
                {savingBranding ? 'Saving Changes...' : 'Save Branding Changes'}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: Page Copy & Hero Engine */}
        {activeTab === 'content' && (
          <form onSubmit={handleSaveContent} className="space-y-6 animate-in fade-in duration-200">
            <CardSection
              title="Homepage Hero Copy & Announcements"
              description="Customize the main headline, subtitle, announcement bullet points, and trust badges."
              icon={Layers}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle" className="text-xs font-bold text-slate-700">
                    Hero Main Headline
                  </Label>
                  <Input
                    id="heroTitle"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="Empowering Minds Through Modern Education"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle" className="text-xs font-bold text-slate-700">
                    Hero Subtitle / Description
                  </Label>
                  <textarea
                    id="heroSubtitle"
                    rows={2}
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    placeholder="Platform description..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="heroBullet1" className="text-xs font-bold text-slate-700">
                      Announcement / Bullet 1
                    </Label>
                    <textarea
                      id="heroBullet1"
                      rows={2}
                      value={heroBullet1}
                      onChange={(e) => setHeroBullet1(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroBullet2" className="text-xs font-bold text-slate-700">
                      Announcement / Bullet 2
                    </Label>
                    <textarea
                      id="heroBullet2"
                      rows={2}
                      value={heroBullet2}
                      onChange={(e) => setHeroBullet2(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroBadge1" className="text-xs font-bold text-slate-700">
                      Trust Badge 1
                    </Label>
                    <Input
                      id="heroBadge1"
                      value={heroBadge1}
                      onChange={(e) => setHeroBadge1(e.target.value)}
                      placeholder="Verified Live Stream Classes"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroBadge2" className="text-xs font-bold text-slate-700">
                      Trust Badge 2
                    </Label>
                    <Input
                      id="heroBadge2"
                      value={heroBadge2}
                      onChange={(e) => setHeroBadge2(e.target.value)}
                      placeholder="Interactive Online Quizzes"
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            </CardSection>

            <div className="flex items-center justify-end gap-3 pt-2">
              {contentSuccess && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hero content saved successfully!
                </span>
              )}
              <Button type="submit" disabled={savingContent} variant="primary" className="flex items-center gap-2 px-6 h-10 shadow-sm">
                <Save className="w-4 h-4" />
                {savingContent ? 'Saving...' : 'Save Content Changes'}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 3: Subjects & Grades */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Subjects */}
            <CardSection
              title="Academic Subjects"
              description="Curriculum subjects available for class classification and tagging."
              icon={BookOpen}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New subject name (e.g. Physics, Chemistry)..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="bg-white"
                  />
                  <Button onClick={handleAddSubject} variant="primary" className="shrink-0 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Subject
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                  {subjects?.map((sub: any) => (
                    <div
                      key={sub._id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <span className="capitalize">{sub.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(sub._id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardSection>

            {/* Grades */}
            <CardSection
              title="Grade Levels"
              description="Academic grades and levels available across the platform."
              icon={GraduationCap}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New grade name (e.g. Grade 12, Grade 13 A/L)..."
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="bg-white"
                  />
                  <Button onClick={handleAddGrade} variant="primary" className="shrink-0 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Grade
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                  {grades?.map((gr: any) => (
                    <div
                      key={gr._id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <span>{gr.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteGrade(gr._id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete Grade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardSection>
          </div>
        )}

        {/* TAB 4: Live Component Preview */}
        {activeTab === 'preview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CardSection
              title="Live Theme & System Component Verification"
              description={`Inspect how your configured Primary (${primaryColor.toUpperCase()}) and Accent (${accentColor.toUpperCase()}) tokens behave across system buttons, class cards, and analytics cards.`}
              icon={Eye}
            >
              <div className="space-y-6">
                {/* Button Hierarchy */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Button Hierarchy & Hover Tokens
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="destructive">Destructive Action</Button>
                  </div>
                </div>

                {/* Class Card Mock CTA */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Class Card CTA Integration
                  </h4>
                  <div className="max-w-xs rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-xs">
                    <div className="w-full aspect-[16/9] rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-semibold">
                      Course Banner Preview
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">Grade 12 Physics Theory</h5>
                      <p className="text-xs text-slate-500">Live Mechanics & Thermodynamics</p>
                    </div>
                    <button
                      type="button"
                      className="relative w-full py-2.5 px-4 rounded-xl text-xs font-semibold shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.98] bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1.5"
                    >
                      <span>Join Class</span>
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Standardized Stat Cards */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Standardized Analytics & Stat Cards
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      label="Enrolled Students"
                      value="1,248"
                      status="emerald"
                      icon={BookOpen}
                      trend={{ value: "+12%", isPositive: true, label: "vs last month" }}
                    />
                    <StatCard
                      label="Pending Applications"
                      value="18"
                      status="amber"
                      icon={Sparkles}
                      badge="Review"
                    />
                    <StatCard
                      label="Overdue Assignments"
                      value="3"
                      status="rose"
                      icon={Trash2}
                    />
                    <StatCard
                      label="Active Classes"
                      value="24"
                      status="neutral"
                      icon={Layers}
                      description="Active curriculum"
                    />
                  </div>
                </div>
              </div>
            </CardSection>
          </div>
        )}
      </div>
    </AccessGate>
  );
}
