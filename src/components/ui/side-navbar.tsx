// src/components/ui/side-navbar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
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
  const [commerceOpen, setCommerceOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [gradesOpen, setGradesOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);

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
  const currentGradeParam = searchParams?.get("grade")?.toLowerCase() || "";
  const currentSubjectParam = searchParams?.get("subject")?.toLowerCase() || "";

  useEffect(() => {
    if (pathname === "/classes") {
      if (currentGradeParam) setGradesOpen(true);
      if (currentSubjectParam) setSubjectsOpen(true);
    }
  }, [pathname, currentGradeParam, currentSubjectParam]);

  const isGradeActive = (val: string) => {
    if (pathname !== "/classes" || !currentGradeParam) return false;
    const cleanCurrent = currentGradeParam.replace(/^grade\s*/, "").trim();
    const cleanItem = val.replace(/^grade\s*/i, "").trim().toLowerCase();
    return cleanCurrent === cleanItem || currentGradeParam === cleanItem;
  };

  const isSubjectActive = (val: string) => {
    if (pathname !== "/classes" || !currentSubjectParam) return false;
    const low = val.toLowerCase();
    return (
      currentSubjectParam === low ||
      currentSubjectParam.includes(low) ||
      low.includes(currentSubjectParam)
    );
  };

  const gradeNavList = useMemo(() => {
    const defaultGrades = ["6", "7", "8", "9", "10", "11", "12"];
    const set = new Set<string>(defaultGrades);
    grades.forEach((g: any) => {
      const clean = (g.name || "").replace(/^grade\s*/i, "").trim();
      if (clean) set.add(clean);
    });
    return Array.from(set)
      .sort(
        (a, b) =>
          (parseInt(a.replace(/\D/g, ""), 10) || 0) -
          (parseInt(b.replace(/\D/g, ""), 10) || 0)
      )
      .map((num) => ({
        label: `Grade ${num}`,
        value: num,
        href: `/classes?grade=${num}`,
      }));
  }, [grades]);

  const subjectNavList = useMemo(() => {
    const map = new Map<string, string>();
    map.set("mathematics", "Mathematics");
    map.set("science", "Science");
    subjects.forEach((s: any) => {
      if (s.name) {
        map.set(s.name.toLowerCase(), formatSubjectName(s.name));
      }
    });
    return Array.from(map.entries()).map(([val, label]) => ({
      label,
      value: val,
      href: `/classes?subject=${encodeURIComponent(val)}`,
    }));
  }, [subjects]);

  const isLinkActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin/dashboard") {
      return pathname === href;
    }
    if (href === "/classes") {
      return pathname === "/classes" && !currentGradeParam && !currentSubjectParam;
    }
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  // 1. Group 1: Academic Hub
  const academicItems = useMemo(() => {
    if (isStaff) {
      return [
        { label: "Classes Directory", icon: BookOpen, href: "/classes" },
        { label: "Recordings Studio", icon: Video, href: "/admin/recording/add" },
      ];
    }
    if (user) {
      return [
        { label: "My Enrolled Classes", icon: BookOpen, href: "/classes" },
        { label: "Live Sessions & Tickets", icon: Video, href: "/dashboard/sessions" },
        { label: "Recordings Library", icon: Layers, href: "/recordings" },
      ];
    }
    return [
      { label: "Browse Classes", icon: BookOpen, href: "/classes" },
    ];
  }, [isStaff, user]);

  // 2. Group 2: Assessments & Exams
  const assessmentItems = useMemo(() => {
    if (isStaff) {
      return [
        { label: "Quizzes Directory", icon: HelpCircle, href: "/quizzes" },
        { label: "Paper Exams & Grading", icon: Award, href: "/admin/exams" },
        { label: "Quiz Results Analytics", icon: BarChart3, href: "/admin/quizzes/performances" },
      ];
    }
    if (user) {
      return [
        { label: "Available Quizzes", icon: HelpCircle, href: "/quizzes" },
        { label: "My Performance & Review", icon: BarChart3, href: "/quizzes/performance" },
        { label: "My Exam Report Cards", icon: Award, href: "/dashboard/grades" },
      ];
    }
    return [
      { label: "Available Quizzes", icon: HelpCircle, href: "/quizzes" },
    ];
  }, [isStaff, user]);

  // 3. Group 3: Operations & Records
  const operationsItems = useMemo(() => {
    if (isStaff) {
      return [
        { label: "Daily Attendance Roster", icon: CheckSquare, href: "/admin/attendance" },
        { label: "Physical Dispatch Studio", icon: FolderDown, href: "/admin/deliveries" },
        { label: "Admissions & Applications", icon: UserCheck, href: "/admin/classes/applications" },
      ];
    }
    if (user) {
      return [
        { label: "My Attendance Stats", icon: CheckSquare, href: "/dashboard/attendance" },
        { label: "My Study Pack Orders", icon: FolderDown, href: "/dashboard/deliveries" },
      ];
    }
    return [];
  }, [isStaff, user]);

  // 4. Group 4: Storefront & Commerce
  const commerceItems = useMemo(() => {
    const list = [
      { label: "Browse Store / Packs", icon: Package, href: "/store" },
    ];
    if (isStaff) {
      list.push({ label: "Store Inventory Management", icon: Layers, href: "/admin/store" });
    }
    return list;
  }, [isStaff]);

  // 5. Group 5: Platform Administration (Staff Only)
  const adminItems = useMemo(() => {
    if (!isStaff) return [];
    return [
      { label: "User Management", icon: Users, href: "/admin/user" },
      { label: "Branding & Customization", icon: Sparkles, href: "/admin/settings/branding" },
      { label: "System Roles & RBAC", icon: Settings, href: "/admin/permissions" },
    ];
  }, [isStaff]);

  const quickActions = [
    { label: "Create Class", icon: BookOpen, href: "/admin/classes/add" },
    { label: "Create Quiz", icon: HelpCircle, href: "/admin/quizzes/add" },
    { label: "Create Recording", icon: Video, href: "/admin/recording/add" },
    { label: "Enroll Students", icon: UserCheck, href: "/admin/classes/applications" },
  ];

  return (
    <aside className="flex flex-col w-full h-full text-sm select-none" style={{ background: '#FAF9F5', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
      {/* Mobile Drawer Header with Close Button */}
      {onCloseMobile && (
        <div className="flex items-center justify-between px-4 py-3 sm:hidden shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(246,245,240,0.9)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Navigation Menu</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
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
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        {/* UNIVERSAL TOP SECTION: DASHBOARD & ABOUT PLATFORM */}
        <div className="space-y-1 pb-1">
          <ul className="space-y-0.5">
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

        {/* GROUP 1: ACADEMIC HUB */}
        <div className="space-y-1 pt-1 border-t border-black/5">
          <button
            type="button"
            onClick={() => setAcademicOpen((o) => !o)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/60 tracking-wider uppercase transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Academic Hub</span>
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

              {/* Taxonomy quick filters (Grades & Subjects) */}
              <div className="pt-1.5 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradesOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-semibold text-slate-400 hover:text-slate-700 tracking-wider uppercase"
                >
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3 h-3 text-slate-400" />
                    <span>Filter by Grade</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      gradesOpen && "rotate-180"
                    )}
                  />
                </button>
                {gradesOpen && (
                  <ul className="mt-1 space-y-0.5 pl-2 border-l border-slate-200/70 ml-2">
                    {gradeNavList.map((g) => {
                      const active = isGradeActive(g.value);
                      return (
                        <li key={g.href}>
                          <Link
                            href={g.href}
                            onClick={() => onCloseMobile?.()}
                            className={cn(
                              "flex items-center gap-1.5 px-1.5 py-1 rounded text-xs transition-colors",
                              active
                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            )}
                          >
                            <span
                              className={cn(
                                "w-1 h-1 rounded-full",
                                active ? "bg-indigo-600" : "bg-slate-300"
                              )}
                            />
                            <span>{g.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => setSubjectsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-2 py-1 mt-1 rounded text-[10px] font-semibold text-slate-400 hover:text-slate-700 tracking-wider uppercase"
                >
                  <div className="flex items-center gap-1.5">
                    <FlaskConical className="w-3 h-3 text-slate-400" />
                    <span>Filter by Subject</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      subjectsOpen && "rotate-180"
                    )}
                  />
                </button>
                {subjectsOpen && (
                  <ul className="mt-1 space-y-0.5 pl-2 border-l border-slate-200/70 ml-2">
                    {subjectNavList.map((s) => {
                      const active = isSubjectActive(s.value);
                      return (
                        <li key={s.href}>
                          <Link
                            href={s.href}
                            onClick={() => onCloseMobile?.()}
                            className={cn(
                              "flex items-center gap-1.5 px-1.5 py-1 rounded text-xs transition-colors",
                              active
                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            )}
                          >
                            <span
                              className={cn(
                                "w-1 h-1 rounded-full",
                                active ? "bg-indigo-600" : "bg-slate-300"
                              )}
                            />
                            <span>{s.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </ul>
          )}
        </div>

        {/* GROUP 2: ASSESSMENTS & EXAMS */}
        {assessmentItems.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssessmentsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/60 tracking-wider uppercase transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assessments & Exams</span>
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

        {/* GROUP 3: OPERATIONS & RECORDS */}
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

        {/* GROUP 4: STOREFRONT & COMMERCE */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCommerceOpen((o) => !o)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/60 tracking-wider uppercase transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>Storefront & Commerce</span>
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

        {/* Edit Mode Toggle for Instructors */}
        {isTeacher && (
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
              <img
                src={user.avatarUrl}
                alt={displayName}
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
                  {isStaff && (
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
