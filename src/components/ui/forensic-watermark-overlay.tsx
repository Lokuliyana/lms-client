"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";

export interface ForensicWatermarkData {
  studentName?: string;
  studentId?: string;
  email?: string;
  clientIp?: string;
  timestamp?: number;
  displayText?: string;
}

interface ForensicWatermarkOverlayProps {
  watermark?: ForensicWatermarkData | null;
  className?: string;
  /**
   * Position strategy:
   * "bottom-left" (default): discreetly docked in peripheral bottom-left corner above player controls.
   * "top-right": docked in top-right corner.
   * "top-left": docked in top-left corner.
   * "bottom-right": docked in bottom-right corner.
   */
  position?: "bottom-left" | "top-right" | "top-left" | "bottom-right" | "periodic";
}

/**
 * Professional Sleek Forensic Watermark Overlay
 *
 * Designed to provide anti-piracy deterrence without distracting students:
 * - NO full-screen repeating diagonal grids or floating bouncing boxes across slides/formulas.
 * - Single compact micro-pill badge (height ~22px) placed discreetly in a safe corner.
 * - Subtle low opacity (0.28) that ensures anti-piracy deterrence without distracting students.
 * - 0% CPU consumption: clean DOM element instead of a 60fps canvas redraw loop.
 */
export const ForensicWatermarkOverlay: React.FC<ForensicWatermarkOverlayProps> = ({
  watermark,
  className = "",
  position = "bottom-left",
}) => {
  const { user } = useAuth();

  const studentName =
    watermark?.studentName ||
    user?.name ||
    [user?.first_name || user?.firstName, user?.last_name || user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.email?.split("@")[0] ||
    "Student";

  const rawStudentId =
    watermark?.studentId ||
    user?.studentId ||
    user?.student_id ||
    (user?._id ? String(user._id).slice(-8) : "SECURE");

  const idSnippet =
    rawStudentId.length > 8 ? rawStudentId.slice(-8) : rawStudentId;

  const displayText =
    watermark?.displayText || `${studentName} • ${idSnippet}`;

  // Corner positioning classes
  const positionClasses = (() => {
    switch (position) {
      case "top-left":
        return "top-14 left-4 sm:top-16 sm:left-6";
      case "top-right":
        return "top-14 right-4 sm:top-16 sm:right-6";
      case "bottom-right":
        return "bottom-16 right-4 sm:bottom-20 sm:right-6";
      case "bottom-left":
      case "periodic":
      default:
        // Positioned neatly above the cinema controls bar
        return "bottom-16 left-4 sm:bottom-20 sm:left-6";
    }
  })();

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-20 ${className}`}
    >
      <div
        className={`absolute ${positionClasses} transition-all duration-300 ease-out`}
      >
        <div
          style={{ opacity: 0.32 }}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/60 backdrop-blur-xs border border-white/15 text-white/85 shadow-xs font-mono text-[10px] tracking-tight whitespace-nowrap"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate max-w-[180px] sm:max-w-[260px]">
            {displayText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForensicWatermarkOverlay;
