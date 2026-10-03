// src/components/layout/layout-wrapper.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/ui/topbar";
import SideNavbar from "@/components/ui/side-navbar";
import Footer from "@/components/ui/footer";
import { Toaster } from "../dev/toaster";
import ReLoginDialog from "@/components/ui/auth/ReLoginDialog";
import { CLAY_ASSETS } from "@/constants/clayAssets";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileSidebarOpen]);

  // Authentication screens and quiz taking focus arena hide standard global shell
  const isAuthScreen = pathname === "/login" || pathname === "/register";
  const isQuizAttempt =
    pathname.startsWith("/quizzes/") &&
    pathname.split("/").length >= 3 &&
    !pathname.includes("/performance") &&
    !pathname.includes("/review");
  const isFocusArena = pathname.includes("/take") || isQuizAttempt;
  const hideNav = isAuthScreen || isFocusArena;

  return (
    <div className="relative min-h-screen bg-[#F6F5F0] text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden">
      <ReLoginDialog />
      <Toaster />

      {/* Subtle Atmospheric Clay Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute -top-12 right-[4%] w-72 h-72 opacity-[0.035] transform rotate-12">
          <Image src={CLAY_ASSETS.thumbScienceStem} alt="" fill className="object-contain" priority={false} />
        </div>
        <div className="absolute top-[30%] -left-16 w-80 h-80 opacity-[0.03] transform -rotate-12">
          <Image src={CLAY_ASSETS.thumbMathematics} alt="" fill className="object-contain" priority={false} />
        </div>
        <div className="absolute top-[62%] -right-16 w-80 h-80 opacity-[0.03] transform rotate-6">
          <Image src={CLAY_ASSETS.thumbTheoryOpenbook} alt="" fill className="object-contain" priority={false} />
        </div>
        <div className="absolute -bottom-16 left-[22%] w-64 h-64 opacity-[0.025] transform -rotate-6">
          <Image src={CLAY_ASSETS.gradeReportTrophy} alt="" fill className="object-contain" priority={false} />
        </div>
      </div>

      {!hideNav && (
        <>
          {/* Topbar: 56px sticky top bar */}
          <Topbar
            onToggleMobileSidebar={() => setMobileSidebarOpen((o) => !o)}
            isMobileSidebarOpen={mobileSidebarOpen}
          />

          {/* Desktop Sidebar: Fixed left beneath Topbar */}
          <div className="hidden sm:block fixed top-14 sm:top-15 left-0 h-[calc(100vh-3.75rem)] w-64 z-20 transition-all duration-200 bg-[#FAF9F5]">
            <SideNavbar />
          </div>

          {/* Mobile Sidebar Drawer */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-[998] sm:hidden">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileSidebarOpen(false)}
                aria-hidden="true"
              />
              {/* Drawer Content */}
              <div className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-[999] animate-in slide-in-from-left duration-200 flex flex-col">
                <SideNavbar onCloseMobile={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 relative z-10 transition-all ${
          !hideNav ? "sm:pl-64 pt-14 sm:pt-15" : ""
        }`}
      >
        <main
          className={`mx-auto ${
            hideNav
              ? "w-full"
              : "px-3 sm:px-6 md:px-8 py-6 max-w-7xl"
          }`}
        >
          {children}
        </main>
        {!hideNav && <Footer />}
      </div>
    </div>
  );
}
