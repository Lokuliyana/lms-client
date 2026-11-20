// src/components/ui/side-navbar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  HelpCircle,
  BarChart3,
  Info,
  Sparkles,
  Users,
  Settings,
  Plus,
  Video,
  LayoutDashboard,
  ChevronDown,
  Edit2,
  Eye,
  LogOut,
  UserCheck,
  FolderDown,
  Layers,
  GraduationCap,
  FlaskConical,
  CheckSquare,
  Award,
  Package,
  User as UserIcon,
  X,
  Globe,
  Search,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { openCommandSearch } from "@/components/ui/command-search";
import { useEditMode } from "@/context/EditModeContext";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/context/BrandingContext";
import { useCustomization } from "@/context/CustomizationContext";
import { formatSubjectName } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SideNavbarProps {
  onCloseMobile?: () => void;
}

export default function Sidebar({ onCloseMobile }: SideNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isTeacher, isStudent, isModerator, hasPermission, logout } = useAuth();
  const { branding } = useBranding();
  const { isEditMode, toggleEditMode } = useEditMode();

  const isAdmin = user?.role === "admin";
  const isTeacherRole = user?.role === "teacher" || isTeacher;
  const isModeratorRole = user?.role === "moderator" || isModerator;
  const isStaff = isTeacherRole || isModeratorRole || isAdmin;

  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const quickActionRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Accordion state: For staff/teachers, primary core sections stay open, others collapse by default
  const [academicOpen, setAcademicOpen] = useState(true);
  const [assessmentsOpen, setAssessmentsOpen] = useState(!isStaff);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [commerceOpen, setCommerceOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);

  // Click outside handlers
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        quickActionRef.current &&
        !quickActionRef.current.contains(e.target as Node)
      ) {
        setQuickActionOpen(false);
      }
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Display Name & Initials
  const displayName = useMemo(() => {
    if (!user) return "Guest Student";
    return (
      user.full_name ||
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email?.split("@")[0] ||
      "User"
    );
  }, [user]);

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    return (
      (parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || "U")
    ).toUpperCase();
  }, [displayName]);

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await logout();
  };

  const searchParams = useSearchParams();
  const { grades, subjects } = useCustomization();
  const isLinkActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }
    if (href === "/dashboard?view=student") {
      return (
        pathname === "/dashboard" &&
        (!searchParams?.get("view") || searchParams?.get("view") === "student")
      );
    }
    if (href === "/dashboard?view=guest") {
      return (
        pathname === "/dashboard" && searchParams?.get("view") === "guest"
      );
    }
    if (href === "/dashboard") {
      return pathname === href;
    }
    if (href === "/classes") {
      return pathname === "/classes";
    }
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  // 1. Group 1: Academy
  const academicItems = useMemo(() => {
    if (isStaff) {
      return [
        { label: "Classes Directory", icon: BookOpen, href: "/classes" },
        { label: "Class Applications", icon: UserCheck, href: "/admin/classes/applications" },
        { label: "Digital Study Packs", icon: Package, href: "/study-packs" },
        { label: "Study Packs Studio", icon: Sparkles, href: "/admin/study-packs" },
        { label: "Recordings Studio", icon: Video, href: "/admin/recording/add" },
      ];
    }
    if (user) {
      return [
        { label: "My Enrolled Classes", icon: BookOpen, href: "/classes" },
        { label: "Digital Study Packs", icon: Package, href: "/study-packs" },
        { label: "Live Sessions & Tickets", icon: Video, href: "/dashboard/sessions" },
        { label: "Recordings Library", icon: Layers, href: "/recordings" },
      ];
    }
    return [
      { label: "Browse Classes", icon: BookOpen, href: "/classes" },
      { label: "Digital Study Packs", icon: Package, href: "/study-packs" },
    ];
  }, [isStaff, user]);

  // 2. Group 2: Operations & Records
  const operationsItems = useMemo(() => {
    if (isStaff) {
      return [
        { label: "Attendance Roster", icon: CheckSquare, href: "/admin/attendance" },
      ];
    }
    if (user) {
      return [
        { label: "My Attendance Stats", icon: CheckSquare, href: "/dashboard/attendance" },
      ];
    }
    return [];
  }, [isStaff, user]);

  // 3. Group 3: Store
  const commerceItems = useMemo(() => {
    if (isStaff) {
      return [
        { label: "Store Orders & Deliveries", icon: FolderDown, href: "/admin/deliveries" },
        { label: "Store Products & Stock", icon: CheckSquare, href: "/admin/store" },
      ];
    }
    const list = [
      { label: "Physical Bookstore", icon: Package, href: "/store" },
    ];
    if (user) {
      list.push({ label: "Store Orders & Deliveries", icon: FolderDown, href: "/dashboard/deliveries" });
    }
    return list;
  }, [isStaff, user]);

  // 4. Group 4: Exams & Reports
  const assessmentItems = useMemo(() => {
    if (isStaff) {
      return [
        { label: "Paper Exams & Grading", icon: Award, href: "/admin/exams" },
      ];
    }
    if (user) {
      return [
        { label: "Paper Exams & Grading", icon: Award, href: "/dashboard/grades" },
      ];
    }
    return [];
  }, [isStaff, user]);

  // 5. Group 5: Platform Administration (Staff Only, with Branding & RBAC restricted to Admin)
  const adminItems = useMemo(() => {
    if (!isStaff) return [];
    const items = [
      { label: "User Management", icon: Users, href: "/admin/user" },
    ];
    if (isAdmin) {
      items.push(
        { label: "Branding & Customization", icon: Sparkles, href: "/admin/settings/branding" },
        { label: "System Roles & RBAC", icon: Settings, href: "/admin/permissions" },
      );
    }
    return items;
  }, [isStaff, isAdmin]);

  const quickActions = [
    { label: "Create Class", icon: BookOpen, href: "/admin/classes/add" },
    { label: "Create Recording", icon: Video, href: "/admin/recording/add" },
    { label: "Enroll Students", icon: UserCheck, href: "/admin/classes/applications" },
  ];

  return (
    <aside className="flex flex-col w-full h-full text-sm select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" style={{ background: '#FAF9F5', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
      {/* Mobile Drawer Header with Close Button and Search Trigger */}
      {onCloseMobile && (
        <div className="flex items-center justify-between px-4 py-3 sm:hidden shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(246,245,240,0.9)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Navigation Menu</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                openCommandSearch();
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/60 transition-colors"
              aria-label="Search platform"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Quick Search Bar */}
      {onCloseMobile && (
        <div className="px-3.5 pt-3 sm:hidden">
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              openCommandSearch();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-500 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:text-slate-800 hover:border-slate-300 transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search platform...</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Find</span>
          </button>
        </div>
      )}

      {/* Primary Action Button: "+ New" Quick Action (Staff) */}
      {isStaff && (
        <div className="px-3.5 pt-3.5 pb-1 relative" ref={quickActionRef}>
          <Button
            type="button"
            variant="primary"
            onClick={() => setQuickActionOpen((o) => !o)}
            className="w-full justify-between shadow-xs font-semibold text-xs h-9 px-3"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Action</span>
            </div>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-indigo-200 transition-transform duration-200",
                quickActionOpen && "rotate-180"
              )}
            />
          </Button>

          {/* "+ New" Dropdown Menu */}
          {quickActionOpen && (
            <div className="absolute top-14 left-3.5 right-3.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                Quick Actions
              </div>
              {quickActions.map((qa) => {
                const QIcon = qa.icon;
                return (
                  <Link
                    key={qa.href}
                    href={qa.href}
                    onClick={() => {
                      setQuickActionOpen(false);
                      onCloseMobile?.();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <div className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                      <QIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium">{qa.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* UNIVERSAL TOP SECTION: DASHBOARD & ABOUT PLATFORM */}
        <div className="space-y-1 pb-1">
          <ul className="space-y-0.5">
            {isStaff ? (
              <>
                <li>
                  <Link
                    href="/admin/dashboard"
                    onClick={() => onCloseMobile?.()}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group",
                      pathname === "/admin/dashboard"
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/60 shadow-xs [box-shadow:0_2px_8px_rgba(79,70,229,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                    )}
                  >
                    <LayoutDashboard
                      className={cn(
                        "w-4 h-4 transition-colors",
                        pathname === "/admin/dashboard"
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span className="flex-1 truncate">
                      {isTeacherRole ? "Teacher Dashboard" : "Admin Dashboard"}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard?view=guest"
                    onClick={() => onCloseMobile?.()}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group",
                      pathname === "/dashboard" && searchParams?.get("view") === "guest"
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/60 shadow-xs [box-shadow:0_2px_8px_rgba(79,70,229,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                    )}
                  >
                    <Globe
                      className={cn(
                        "w-4 h-4 transition-colors",
                        pathname === "/dashboard" && searchParams?.get("view") === "guest"
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span className="flex-1 truncate">Guest Dashboard</span>
                  </Link>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/dashboard"
                  onClick={() => onCloseMobile?.()}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group",
                    pathname === "/dashboard"
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/60 shadow-xs [box-shadow:0_2px_8px_rgba(79,70,229,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                  )}
                >
                  <LayoutDashboard
                    className={cn(
                      "w-4 h-4 transition-colors",
                      pathname === "/dashboard"
                        ? "text-indigo-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span className="flex-1 truncate">Dashboard</span>
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/about"
                onClick={() => onCloseMobile?.()}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group",
                  pathname === "/about"
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/60 shadow-xs [box-shadow:0_2px_8px_rgba(79,70,229,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                )}
              >
                <Info
                  className={cn(
                    "w-4 h-4 transition-colors",
                    pathname === "/about"
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span className="flex-1 truncate">About Academy</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* GROUP 1: ACADEMY */}
        <div className="space-y-1 pt-1 border-t border-black/5">
          <button
            type="button"
            onClick={() => setAcademicOpen((o) => !o)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/60 tracking-wider uppercase transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Academy</span>
            </div>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                academicOpen && "rotate-180"
              )}
            />
          </button>

          {academicOpen && (
            <ul className="space-y-0.5 pl-1">
              {academicItems.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => onCloseMobile?.()}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group",
                        active
                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-xs [box-shadow:0_2px_8px_rgba(79,70,229,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          active
                            ? "text-indigo-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}

            </ul>
          )}
        </div>

        {/* GROUP 2: OPERATIONS & RECORDS */}
        {operationsItems.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOperationsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/60 tracking-wider uppercase transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Operations & Records</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                  operationsOpen && "rotate-180"
                )}
              />
            </button>

            {operationsOpen && (
              <ul className="space-y-0.5 pl-1">
                {operationsItems.map((item) => {
                  const active = isLinkActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => onCloseMobile?.()}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group",
                          active
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-xs [box-shadow:0_2px_8px_rgba(79,70,229,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-colors",
                            active
                              ? "text-indigo-600"
                              : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* GROUP 3: STORE */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCommerceOpen((o) => !o)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/60 tracking-wider uppercase transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>Store</span>
            </div>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                commerceOpen && "rotate-180"
              )}
            />
          </button>

          {commerceOpen && (
            <ul className="space-y-0.5 pl-1">
              {commerceItems.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => onCloseMobile?.()}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group",
                        active
                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-xs [box-shadow:0_2px_8px_rgba(79,70,229,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          active
                            ? "text-indigo-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* GROUP 4: EXAMS & REPORTS */}
        {assessmentItems.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssessmentsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/60 tracking-wider uppercase transition-colors"
            >
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>Exams & Reports</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                  assessmentsOpen && "rotate-180"
                )}
              />
            </button>

            {assessmentsOpen && (
              <ul className="space-y-0.5 pl-1">
                {assessmentItems.map((item) => {
                  const active = isLinkActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => onCloseMobile?.()}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group",
                          active
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-xs [box-shadow:0_2px_8px_rgba(79,70,229,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-colors",
                            active
                              ? "text-indigo-600"
                              : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* GROUP 5: PLATFORM ADMINISTRATION (STAFF ONLY) */}
        {isStaff && adminItems.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdminOpen((o) => !o)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/60 tracking-wider uppercase transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
                <span>Administration</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                  adminOpen && "rotate-180"
                )}
              />
            </button>

            {adminOpen && (
              <ul className="space-y-0.5 pl-1">
                {adminItems.map((item) => {
                  const active = isLinkActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => onCloseMobile?.()}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group",
                          active
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-bold border border-indigo-200/60 shadow-xs [box-shadow:0_2px_8px_rgba(79,70,229,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-colors",
                            active
                              ? "text-indigo-600"
                              : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* UNIVERSAL BOTTOM SECTION (ALL ROLES) */}
      <div className="p-3 space-y-2 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: 'rgba(246,245,240,0.6)' }} ref={accountRef}>
        {/* Universal Links: About Platform & Profile */}
        {/* <div className="space-y-0.5 mb-1">
          <Link
            href="/about"
            onClick={() => onCloseMobile?.()}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              pathname === "/about"
                ? "bg-indigo-50 text-indigo-700 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            )}
          >
            <Info className="w-4 h-4 text-slate-400" />
            <span>About Platform</span>
          </Link>

          {user && (
            <Link
              href="/dashboard/profile"
              onClick={() => onCloseMobile?.()}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                pathname === "/dashboard/profile"
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              )}
            >
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>My Profile</span>
            </Link>
          )}

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all text-left"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Log Out</span>
            </button>
          )}
        </div> */}

        {/* Support Hotline */}
        <a
          href="https://wa.me/94779391220"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onCloseMobile?.()}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-emerald-50/90 border border-emerald-200/70 text-emerald-800 hover:bg-emerald-100/80 transition-all group shadow-xs"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FaWhatsapp className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 leading-none">
              Support Hotline
            </p>
            <p className="text-xs font-bold text-slate-800 tracking-tight">
              077 939 1220
            </p>
          </div>
        </a>

        {/* Edit Mode Toggle for Staff & Instructors */}
        {(isTeacher || isStaff) && (
          <button
            type="button"
            onClick={toggleEditMode}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all text-left",
              isEditMode
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            {isEditMode ? (
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="flex-1">
              {isEditMode ? "Live Edit Mode Active" : "Enable Edit Mode"}
            </span>
          </button>
        )}

        {/* User Card */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((o) => !o)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-white shadow-xs transition-all text-left"
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                unoptimized
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400 truncate capitalize">
                {user ? `${user.role || "student"}` : "Guest Account"}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 transition-transform",
                accountMenuOpen && "rotate-180"
              )}
            />
          </button>

          {/* Account Menu Popover */}
          {accountMenuOpen && (
            <div className="absolute bottom-12 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in duration-150">
              {user ? (
                <>
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-700 truncate">
                      {user.email || "No email"}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onCloseMobile?.();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    My Profile
                  </Link>
                  <Link
                    href={user._id ? `/user/${user._id}` : "/user"}
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onCloseMobile?.();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Account Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/settings/branding"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onCloseMobile?.();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-indigo-700 font-medium hover:bg-indigo-50 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Customization Engine
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium border-t border-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Log Out
                  </button>
                </>
              ) : (
                <div className="p-2 space-y-1">
                  <Button variant="primary" size="sm" className="w-full text-xs" asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
