// src/components/ui/topbar.tsx
"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import {
  Bell,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CommandSearch, CommandSearchTrigger } from "@/components/ui/command-search";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/context/BrandingContext";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export function Topbar({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}: TopbarProps) {
  const router = useRouter();
  const { user, isTeacher, isStudent, hasPermission, logout } = useAuth();
  const { branding } = useBranding();
  const canManageBranding = !isStudent && hasPermission("branding.manage");
  const isStaff = user?.role === "teacher" || user?.role === "admin" || user?.role === "moderator" || Boolean(isTeacher);

  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close profile & notifications on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    user?.full_name ||
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "Guest";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n: string) => n[0]?.toUpperCase())
    .join("") || "U";

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-14 sm:h-15 w-full px-3 sm:px-6 flex items-center justify-between transition-all" style={{ background: 'rgba(246,245,240,0.92)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 20px -4px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}>
        {/* Left Side: Mobile toggle + Our Logo (Just logo, no text) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="sm:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/70 transition-colors"
              aria-label="Toggle Navigation"
            >
              {isMobileSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}

          <BrandLogo size="md" showText={false} />
        </div>

        {/* Center: Client's Branding / Platform Logo */}
        <div suppressHydrationWarning className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 pointer-events-auto">
          {branding.assets?.logoUrl ? (
            <img
              suppressHydrationWarning
              src={branding.assets.logoUrl}
              alt={branding.platformName || "Client Logo"}
              className="h-7 sm:h-8 w-auto object-contain max-h-9"
            />
          ) : (
            <div suppressHydrationWarning className="flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm" style={{ background: 'rgba(255,255,255,0.85)', borderColor: 'rgba(0,0,0,0.07)', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="text-xs font-bold tracking-tight text-slate-800 truncate max-w-[140px] sm:max-w-[220px]">
                {branding.platformName || "Nexvo Learn"}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Search Trigger (Right-aligned) + User Profile Chip */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cmd+K Quick Search Trigger right-aligned */}
          <CommandSearchTrigger onClick={() => setSearchOpen(true)} />

          {/* User Profile Chip & Dropdown */}
          <div className="relative" ref={profileRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-white/70 border border-transparent hover:border-black/5 transition-all text-left"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center shadow-xs">
                    {initials}
                  </div>
                )}
                <div className="hidden md:block leading-tight text-left">
                  <p className="text-xs font-semibold text-slate-800 truncate max-w-[110px]">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {user.role || "student"}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="rounded-full px-3.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white/70"
                >
                  <Link href="/login">Log in</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="rounded-full px-4 text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
                  style={{
                    boxShadow: '0 4px 14px rgba(79,70,229,0.25), inset 0 1px 1px rgba(255,255,255,0.4)',
                  }}
                >
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Profile Dropdown Menu */}
            {profileOpen && user && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150" style={{ background: '#FFFFFF', borderColor: 'rgba(0,0,0,0.07)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.12), 0 4px 12px -2px rgba(0,0,0,0.06)' }}>
                <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {user.email || "No email registered"}
                  </p>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                    {user.role || "student"}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href={user._id ? `/user/${user._id}` : "/user"}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    My Profile
                  </Link>

                  {canManageBranding && (
                    <Link
                      href="/admin/settings/branding"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Customization Engine
                    </Link>
                  )}
                  {isStaff && !isStudent && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Management Studio
                    </Link>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Cmd+K Command Search Dialog */}
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
