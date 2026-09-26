"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { features } from "@/config/features";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Video, 
  FileEdit, 
  Gamepad2, 
  LineChart 
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Permissions", href: "/permissions", icon: Users },
  { name: "Classes", href: "/classes", icon: BookOpen },
  { name: "Attendance", href: "/attendance", icon: Video },
  { name: "Assignments", href: "/assignments", icon: FileEdit },
  { name: "Quizzes", href: "/quizzes", icon: Gamepad2, featureFlag: "NEXT_PUBLIC_FEATURE_QUIZZES" },
  { name: "Analytics", href: "/analytics", icon: LineChart },
];

export function Sidebar() {
  const pathname = usePathname();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.featureFlag === "NEXT_PUBLIC_FEATURE_QUIZZES") {
      return features.NEXT_PUBLIC_FEATURE_QUIZZES;
    }
    return true;
  });

  return (
    <aside className="fixed top-4 left-4 bottom-4 w-64 bg-white border border-slate-200/70 rounded-2xl shadow-soft flex flex-col z-20 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          AG
        </div>
        <span className="font-semibold text-slate-800 tracking-tight">LMS Engine</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ease-out font-medium text-sm",
                isActive
                  ? "bg-blue-50/80 text-blue-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] ring-1 ring-blue-500/10"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-semibold">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900">John Doe</span>
            <span className="text-xs text-slate-500">Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  
  return (
    <header className="sticky top-0 z-10 h-16 bg-[#F8FAFC]/80 backdrop-blur-md border-b border-slate-200/50 flex items-center px-8">
      <div className="flex items-center text-sm font-medium text-slate-500 space-x-2">
        <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
        {pathSegments.map((segment, idx) => (
          <React.Fragment key={segment}>
            <span className="text-slate-300">/</span>
            <span className={idx === pathSegments.length - 1 ? "text-slate-900 capitalize" : "hover:text-slate-800 transition-colors capitalize"}>
              {segment}
            </span>
          </React.Fragment>
        ))}
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="pl-72 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
