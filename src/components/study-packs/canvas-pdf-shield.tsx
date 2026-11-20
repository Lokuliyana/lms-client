"use client";

import React, { useEffect, useState, useRef } from "react";
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
  Loader2,
} from "lucide-react";

const PDFJS_SCRIPT_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

interface PdfCanvasPageProps {
  pdfDoc: any;
  pageNumber: number;
  zoom: number;
}

function PdfCanvasPage({ pdfDoc, pageNumber, zoom }: PdfCanvasPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(0.707); // Default A4 ratio (1 / 1.414)
  const [rendered, setRendered] = useState(false);

  // Lazy render using IntersectionObserver with bidirectional visibility tracking
  // to prevent iOS Safari memory exhaustion from retaining 50+ canvas buffers.
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!isVisible) {
      // Free canvas buffer memory when scrolled far off-screen
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
      }
      setRendered(false);
      return;
    }

    const render = async () => {
      try {
        // If a previous render task was running on this canvas, cancel it and wait
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
            await renderTaskRef.current.promise;
          } catch {
            // Cancelled exception expected
          }
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Cap DPR to 2 on mobile retina screens to avoid iOS Safari canvas memory limit crashes
        const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        const baseScale = (zoom / 100) * 1.35;
        const viewport = page.getViewport({ scale: baseScale });

        if (viewport.width && viewport.height) {
          setAspectRatio(viewport.width / viewport.height);
        }

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = "100%";
        canvas.style.height = "auto";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (!isCancelled) {
          setRendered(true);
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn(`Render page ${pageNumber} error:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, zoom, isVisible]);

  // Scaled max width based on zoom level:
  // At zoom 100%, fits container nicely (e.g. max-w-2xl or 100%).
  // At zoom > 100%, allows expanding up to (zoom / 100) * 780px so zooming is visually effective!
  const containerStyle: React.CSSProperties = {
    aspectRatio: `${aspectRatio}`,
    width: zoom > 100 ? `${zoom}%` : "100%",
    maxWidth: zoom > 100 ? `${Math.floor((zoom / 100) * 780)}px` : "780px",
  };

  return (
    <div
      ref={containerRef}
      className="relative shadow-2xl rounded-lg overflow-hidden bg-white my-3 shrink-0 flex flex-col items-center transition-all duration-150"
      style={containerStyle}
    >
      <canvas
        ref={canvasRef}
        className={`block w-full !h-auto transition-opacity duration-200 ${
          rendered ? "opacity-100" : "opacity-0"
        }`}
      />
      {!rendered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-xs font-mono">Page {pageNumber}</span>
        </div>
      )}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white/90 text-[10px] font-mono pointer-events-none select-none backdrop-blur-xs">
        Page {pageNumber}
      </div>
    </div>
  );
}

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
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [useFallback, setUseFallback] = useState<boolean>(false);



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

  // Dynamically load PDF.js in the browser for high-DPI crisp vector canvas rendering & iOS touch scrolling
  useEffect(() => {
    if (typeof window === "undefined" || !pdfUrl || isLocked || isBrokenBucketUrl) return;

    let isMounted = true;

    const initPdf = async () => {
      try {
        setPdfLoading(true);

        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${PDFJS_SCRIPT_SRC}"]`);
            if (existingScript) {
              existingScript.addEventListener("load", () => resolve());
              existingScript.addEventListener("error", () => reject(new Error("PDF.js load error")));
              if ((window as any).pdfjsLib) resolve();
              return;
            }
            const script = document.createElement("script");
            script.src = PDFJS_SCRIPT_SRC;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load PDF.js library"));
            document.head.appendChild(script);
          });
        }

        const pdfjs = (window as any).pdfjsLib;
        if (!pdfjs) throw new Error("pdfjsLib not available");
        try {
          // In WebKit/Safari, creating a Worker directly from a cross-origin URL can throw SecurityError.
          // Using a blob wrapper ensures WebKit accepts the worker instantiation.
          const blobCode = `importScripts("${PDFJS_WORKER_SRC}");`;
          const workerBlob = new Blob([blobCode], { type: "application/javascript" });
          pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
        } catch {
          pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
        }

        const rawUrl = pdfUrl.split("#")[0];
        const loadingTask = pdfjs.getDocument({
          url: rawUrl,
          withCredentials: false,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setUseFallback(false);
      } catch (err: any) {
        console.warn("Canvas PDF load notice: fallback mode active", err?.message || err);
        if (isMounted) {
          setUseFallback(true);
        }
      } finally {
        if (isMounted) {
          setPdfLoading(false);
        }
      }
    };

    initPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl, isLocked, isBrokenBucketUrl]);

  useEffect(() => {
    let blurTimeout: NodeJS.Timeout;

    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || (navigator && navigator.maxTouchPoints > 0));

    const handleBlur = () => {
      // On mobile / touch devices (iOS Safari, Android Chrome), window.blur fires falsely during
      // virtual keyboard toggles, address bar collapses/resizes, and momentum scrolling.
      // On mobile / touch devices, rely strictly on document.visibilityState.
      if (
        isTouchDevice ||
        (typeof document !== "undefined" &&
          (document.activeElement?.tagName === "INPUT" ||
            document.activeElement?.tagName === "TEXTAREA"))
      ) {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
          setIsWindowBlurred(true);
        }
        return;
      }

      // Delay occlusion check for desktop window focus switching
      blurTimeout = setTimeout(() => {
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
      } else if (typeof document !== "undefined" && (isTouchDevice || document.hasFocus())) {
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



  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={`canvas-pdf-shield-root relative flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none ${
        isFullscreen ? "fixed inset-4 z-50 rounded-2xl max-h-[calc(100vh-2rem)]" : "w-full aspect-[4/3] min-h-[460px]"
      }`}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* Dynamic CSS Print & iOS Callout Suppression */}
      <style>{`
        .canvas-pdf-shield-root,
        .canvas-pdf-shield-content,
        canvas {
          -webkit-touch-callout: none !important;
        }
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
              {numPages > 0 && !useFallback && (
                <span className="ml-1 text-slate-400 font-mono">({numPages} {numPages === 1 ? "page" : "pages"})</span>
              )}
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
        ) : !useFallback && pdfDoc && numPages > 0 ? (
          <div
            className="canvas-pdf-shield-content w-full h-full relative overflow-y-auto overflow-x-auto flex flex-col items-center p-2 sm:p-6 bg-slate-950 overscroll-contain"
            style={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <PdfCanvasPage
                key={pageNum}
                pdfDoc={pdfDoc}
                pageNumber={pageNum}
                zoom={zoom}
              />
            ))}
          </div>
        ) : pdfLoading ? (
          <div className="p-8 text-center max-w-md space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
            <p className="text-xs text-slate-400">Loading vector canvas document...</p>
          </div>
        ) : (
          <div
            className="canvas-pdf-shield-content w-full h-full relative overflow-auto flex justify-center p-2 bg-slate-950"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Embedded Secure PDF Renderer (suppresses download/print toolbar parameters) */}
            <iframe
              src={cleanPdfUrl || ""}
              title={title}
              className="w-full h-full border-0 rounded-lg bg-white min-h-[460px]"
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
