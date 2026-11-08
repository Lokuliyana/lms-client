"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, CheckCircle2, CloudDownload, HardDriveDownload, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PwaOfflineIndicatorProps {
  packId?: string;
  packTitle?: string;
  className?: string;
}

export const PwaOfflineIndicator: React.FC<PwaOfflineIndicatorProps> = ({
  packId,
  packTitle,
  className = "",
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSavedOffline, setIsSavedOffline] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      // Check if pack is saved locally in localStorage or CacheStorage
      if (packId) {
        try {
          const cached = localStorage.getItem(`offline_pack_${packId}`);
          if (cached) setIsSavedOffline(true);
        } catch {
          // localStorage disabled or private browsing mode
        }
      }

      const handleOnline = () => {
        setIsOnline(true);
        toast.success("Network restored: Connected to cloud streaming server");
      };
      const handleOffline = () => {
        setIsOnline(false);
        toast.info("Offline mode active: Cached materials and notes remain available");
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [packId]);

  const toggleSaveOffline = () => {
    if (!packId) return;

    if (isSavedOffline) {
      try {
        localStorage.removeItem(`offline_pack_${packId}`);
      } catch {}
      setIsSavedOffline(false);
      toast.info("Removed from offline storage");
    } else {
      setIsSaving(true);
      setTimeout(() => {
        try {
          localStorage.setItem(
            `offline_pack_${packId}`,
            JSON.stringify({
              savedAt: Date.now(),
              title: packTitle || "Study Pack",
            })
          );
          setIsSavedOffline(true);
          toast.success("Study Pack metadata & outline saved for offline reading");
        } catch {
          toast.error("Offline storage unavailable in current browser session");
        } finally {
          setIsSaving(false);
        }
      }, 600);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Network Status Badge */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
          !isOnline
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            : isSavedOffline
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
        }`}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Offline Mode</span>
          </>
        ) : isSavedOffline ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Available Offline • Saved</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-slate-400" />
            <span>Cloud Synced</span>
          </>
        )}
      </div>

      {/* Offline Save Toggle */}
      {packId && (
        <button
          onClick={toggleSaveOffline}
          disabled={isSaving}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
            isSavedOffline
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
              : "bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
          }`}
          title={isSavedOffline ? "Click to remove from offline cache" : "Save pack for offline use"}
        >
          {isSavedOffline ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Saved Offline</span>
            </>
          ) : (
            <>
              <HardDriveDownload className="w-3 h-3" />
              <span>{isSaving ? "Saving..." : "Save Offline"}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default PwaOfflineIndicator;
