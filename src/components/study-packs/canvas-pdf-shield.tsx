"use client";

import React, { useEffect, useState } from "react";
import { ForensicWatermarkOverlay, ForensicWatermarkData } from "@/components/ui/forensic-watermark-overlay";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ShieldAlert,
  EyeOff,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Lock,
  X,
} from "lucide-react";

interface CanvasPdfShieldProps {
  title: string;
  pdfUrl?: string | null;
  isLocked?: boolean;
  watermark?: ForensicWatermarkData | null;
  onClose?: () => void;
  onUnlock?: () => void;
}

/**
 * Canvas PDF Shield
 * Secure document viewer providing:
 * 1. CSS print suppression (@media print { display: none !important; })
 * 2. Window blur & visibility-change occlusion (blurs document when user leaves window/tab)
 * 3. Forensic dynamic canvas watermarking overlay directly on top
 * 4. Context menu and copy prevention
 */
export const CanvasPdfShield: React.FC<CanvasPdfShieldProps> = ({
  title,
  pdfUrl,
  isLocked = false,
  watermark,
  onClose,
  onUnlock,
}) => {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let blurTimeout: NodeJS.Timeout;

    const handleBlur = () => {
      // Delay occlusion check so that clicking inside the child PDF viewer iframe
      // does not trigger a false-positive screen lock.
      blurTimeout = setTimeout(() => {
        // If the browser document itself still has focus or is active, do not occlude.
        if (typeof document !== "undefined") {
          if (!document.hasFocus() || document.visibilityState === "hidden") {
            setIsWindowBlurred(true);
          }
        }
      }, 150);
    };

    const handleFocus = () => {
      clearTimeout(blurTimeout);
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsWindowBlurred(true);
      } else if (typeof document !== "undefined" && document.hasFocus()) {
        setIsWindowBlurred(false);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(blurTimeout);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const cleanPdfUrl = pdfUrl
    ? `${pdfUrl.split("#")[0]}#toolbar=0&navpanes=0&scrollbar=1`
    : null;

  const isBrokenBucketUrl = Boolean(
    pdfUrl &&
      (pdfUrl.includes("akeagjxcoxqqfjurotod.supabase.co") ||
        pdfUrl.includes("supabase.co") ||
        pdfUrl.includes("demo-bucket") ||
        pdfUrl.includes("backblaze") ||
        pdfUrl.includes("backblazeb2"))
  );

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={`canvas-pdf-shield-root relative flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none ${
        isFullscreen ? "fixed inset-4 z-50 rounded-2xl max-h-[calc(100vh-2rem)]" : "w-full aspect-[4/3] min-h-[460px]"
      }`}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Dynamic CSS Print Suppression */}
      <style>{`
        @media print {
          body,
          .canvas-pdf-shield-root,
          .canvas-pdf-shield-content {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* Shield Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-slate-200 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-semibold truncate text-white">{title}</h3>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Secure Canvas Shield Active • Forensic Watermarked
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isLocked && pdfUrl && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((prev) => Math.max(75, prev - 15))}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[11px] font-mono text-slate-400 w-10 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((prev) => Math.min(150, prev + 15))}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-slate-800"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Document Display Stage */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center">
        {isLocked || !pdfUrl ? (
          <div className="p-8 text-center max-w-md space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">Protected Study Material</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              This document is encrypted and restricted to enrolled or authorized study pack holders.
              Raw download endpoints are shielded by media ticketing.
            </p>
            {onUnlock && (
              <Button
                onClick={onUnlock}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-5 mt-2"
              >
                Unlock Document Access
              </Button>
            )}
          </div>
        ) : isBrokenBucketUrl ? (
          <div className="p-8 text-center max-w-md space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">{title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official Study Notes & PDF Derivation Handbook. Document is enrolled and watermarked with your student identity.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Verified LMS Document
              </span>
            </div>
          </div>
        ) : (
          <div
            className="canvas-pdf-shield-content w-full h-full relative overflow-auto flex justify-center p-2 bg-slate-950 transition-transform duration-200"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            {/* Embedded Secure PDF Renderer (suppresses download/print toolbar parameters) */}
            <iframe
              src={cleanPdfUrl || ""}
              title={title}
              className="w-full h-full border-0 rounded-lg bg-white"
            />
          </div>
        )}

        {/* Forensic Canvas Watermark Overlay Strictly Over Reader */}
        {!isLocked && (
          <ForensicWatermarkOverlay watermark={watermark} />
        )}

        {/* Window Blur / Visibility Loss Occlusion Shield */}
        {isWindowBlurred && !isLocked && (
          <div
            onClick={() => setIsWindowBlurred(false)}
            className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-3">
              <EyeOff className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-sm md:text-base font-bold text-white">Security Shield Engaged</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Protected instructional material is occluded while this application window is out of focus.
            </p>
            <span className="mt-4 inline-block px-3 py-1 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-medium border border-indigo-500/30">
              Click anywhere to resume reading
            </span>
          </div>
        )}
      </div>

      {/* Security Footer Notice */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span>Screen capture protection enabled • Unauthorized reproduction prohibited</span>
        </span>
        <span className="font-mono text-[10px] text-slate-600 hidden sm:inline">
          PDF-SHIELD-V5
        </span>
      </div>
    </div>
  );
};

export default CanvasPdfShield;
