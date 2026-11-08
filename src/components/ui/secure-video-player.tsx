"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ForensicWatermarkOverlay,
  ForensicWatermarkData,
} from "@/components/ui/forensic-watermark-overlay";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Sparkles,
  AlertCircle,
  RotateCcw,
  RotateCw,
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export interface SecureVideoPlayerProps {
  /** Video URL (YouTube, Vimeo, Google Drive preview, or direct video file) or 11-char YouTube ID */
  url?: string | null;
  /** Human-readable title of the lecture or video */
  title?: string;
  /** Optional watermark data; if omitted, automatically resolved from authenticated student */
  watermark?: ForensicWatermarkData | null;
  /** Whether the media is locked behind paywall/enrollment */
  isLocked?: boolean;
  /** Unlock callback when user clicks Unlock button */
  onUnlock?: () => void;
  /** Price in LKR (if 0 or undefined, shows "Free") */
  lockPrice?: number;
  /** Additional custom class names for the outer container */
  className?: string;
  /** Video aspect ratio class (defaults to "aspect-video") */
  aspectRatio?: string;
  /** Autoplay video stream (defaults to false) */
  autoPlay?: boolean;
  /** Subtitle / category badge text (e.g. "Classroom Lecture", "Concept Breakdown") */
  badgeLabel?: string;
  /** Poster thumbnail image for video files */
  poster?: string;
  /** Callback when video ends (direct video only) */
  onEnded?: () => void;
  /** Optional custom action button on the top HUD (e.g., Next lesson) */
  topAction?: React.ReactNode;
}

/**
 * Robustly extracts the 11-character YouTube video ID from various YouTube URL permutations,
 * query parameter orders, short links, embed links, nocookie links, shorts, and live streams.
 */
export function extractYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const str = String(urlOrId).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  try {
    const parsed = new URL(str.startsWith("http") ? str : `https://${str}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    if (
      host === "youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "m.youtube.com"
    ) {
      const v = parsed.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const parts = parsed.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) =>
        ["embed", "v", "shorts", "live"].includes(p.toLowerCase())
      );
      if (idx !== -1 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
        return parts[idx + 1];
      }
    }
  } catch {
    // Fall back to regex
  }

  const match = str.match(
    /(?:youtu\.be\/|(?:youtube\.com|youtube-nocookie\.com)\/(?:embed\/|v\/|watch\?(?:.*&)?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
  );
  return match && match[1] ? match[1] : null;
}

export function isStorageBucketUrl(str?: string | null): boolean {
  return false;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM < 10 ? "0" : ""}${remM}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

/**
 * Secure Video Player (Maximum Anti-Piracy Lockdown)
 *
 * Core Fixes & Security Architecture:
 * 1. Sandboxed iframe without `allow-popups` or `allow-popups-to-escape-sandbox`.
 * 2. Clipboard API strictly blocked (no `clipboard-write`).
 * 3. YouTube Embed Lockdown:
 *    - `controls=0` completely hides native YouTube controls, title bar, Watch Later,
 *      Share button, YouTube logo, and pause recommendation shelf ("More videos").
 * 4. Luxury Custom Cinema Controls Bar:
 *    - Full Play/Pause, 10s Skip Backward/Forward, Scrubber Timeline with progress,
 *      Current Time & Total Duration, Volume & Mute control, Playback Speed (0.75x-2x),
 *      and Fullscreen Cinema toggle.
 * 5. Full-Coverage Glasspane Shield:
 *    - Completely covers the player canvas. Every click cleanly toggles Play/Pause.
 *    - Every right click is intercepted with `e.preventDefault()`, stopping YouTube's
 *      native context menu ("Copy video URL") from ever opening anywhere.
 * 6. Pause Shield & Ended Shield:
 *    - When paused: Frosted overlay covers the screen with "Lecture Paused" and Play button.
 *    - When ended: Frosted overlay shows "Lecture Completed" and "Replay Lecture".
 * 7. Subtle Stationary Forensic Watermark:
 *    - Compact micro-pill badge docked unobtrusively in the bottom-left corner with low opacity.
 * 8. Solid Cinema Footprint Baseline:
 *    - Explicit inline `minHeight: 360px` and `aspectRatio: 16/9` combined with responsive
 *      Tailwind min-height classes ensure the player container NEVER collapses into a thin line.
 */
export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  url,
  title = "Protected Lecture Stream",
  watermark,
  isLocked = false,
  onUnlock,
  lockPrice,
  className = "",
  aspectRatio = "aspect-video",
  autoPlay = false,
  badgeLabel = "Protected Stream",
  poster,
  onEnded,
  topAction,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const hideHudTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();

  // Student credentials resolution
  const resolvedWatermark: ForensicWatermarkData = React.useMemo(() => {
    const studentName =
      watermark?.studentName ||
      user?.name ||
      [user?.first_name || user?.firstName, user?.last_name || user?.lastName]
        .filter(Boolean)
        .join(" ") ||
      user?.email?.split("@")[0] ||
      "Student";

    const studentId =
      watermark?.studentId ||
      user?.studentId ||
      user?.student_id ||
      (user?._id ? String(user._id).slice(-8) : "SECURE");

    const email = watermark?.email || user?.email || "student@lms.local";
    const clientIp = watermark?.clientIp || "127.0.0.1";
    const timestamp = watermark?.timestamp || Date.now();

    return {
      studentName,
      studentId,
      email,
      clientIp,
      timestamp,
      displayText:
        watermark?.displayText ||
        `${studentName} • ${studentId.length > 8 ? studentId.slice(-8) : studentId}`,
    };
  }, [watermark, user]);

  // Anti-tamper shortcut listener: intercept DevTools and source inspection shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isDevTools =
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) &&
          (e.shiftKey || e.altKey) &&
          ["I", "i", "J", "j", "C", "c"].includes(e.key)) ||
        ((e.ctrlKey || e.metaKey) && ["U", "u", "S", "s", "P", "p"].includes(e.key));

      if (isDevTools) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning(
          "Developer tools and inspect shortcuts are restricted on protected lecture streams.",
          { duration: 2500 }
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  // Handle container fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeElement = document.fullscreenElement;
      setIsFullscreen(activeElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // PostMessage dispatcher for YouTube iframe
  const sendYouTubeCommand = useCallback((func: string, args: any = "") => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    } catch {
      // Ignore cross-origin postMessage errors
    }
  }, []);

  // PostMessage listener to intercept YouTube player state and telemetry
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let data: any = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== "object") return;

      // Handle onStateChange notifications
      if (data.event === "onStateChange") {
        const state = Number(data.info);
        if (state === 1) {
          // Playing
          setIsPlaying(true);
          setIsPaused(false);
          setIsEnded(false);
          setIsLoading(false);
        } else if (state === 2) {
          // Paused
          setIsPlaying(false);
          setIsPaused(true);
        } else if (state === 0) {
          // Ended
          setIsPlaying(false);
          setIsPaused(false);
          setIsEnded(true);
          onEnded?.();
        } else if (state === 3) {
          // Buffering
          setIsLoading(false);
        }
      } else if (
        (data.event === "infoDelivery" || data.event === "initialDelivery") &&
        data.info
      ) {
        const info = data.info;
        if (typeof info.currentTime === "number") {
          setCurrentTime(info.currentTime);
        }
        if (typeof info.duration === "number" && info.duration > 0) {
          setDuration(info.duration);
        }
        if (typeof info.volume === "number") {
          setVolume(info.volume);
        }
        if (typeof info.muted === "boolean") {
          setIsMuted(info.muted);
        }
        if (info.playerState !== undefined) {
          const state = Number(info.playerState);
          if (state === 1) {
            setIsPlaying(true);
            setIsPaused(false);
            setIsEnded(false);
            setIsLoading(false);
          } else if (state === 2) {
            setIsPlaying(false);
            setIsPaused(true);
          } else if (state === 0) {
            setIsPlaying(false);
            setIsPaused(false);
            setIsEnded(true);
            onEnded?.();
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onEnded]);

  // Determine media source type and build safe embed URL
  const { sourceType, embedSrc, isDirectVideo } = React.useMemo(() => {
    if (!url) {
      return { sourceType: "empty", embedSrc: "", isDirectVideo: false };
    }

    const raw = String(url).trim();

    // 1. YouTube detection (11-char ID or any YouTube URL format)
    const ytId = extractYouTubeId(raw);
    if (ytId) {
      const params = new URLSearchParams({
        controls: "0",
        rel: "0",
        modestbranding: "1",
        iv_load_policy: "3",
        fs: "0",
        disablekb: "1",
        enablejsapi: "1",
        playsinline: "1",
      });
      if (typeof window !== "undefined" && window.location?.origin) {
        params.set("origin", window.location.origin);
        params.set("widget_referrer", window.location.origin);
      }
      if (autoPlay) params.set("autoplay", "1");

      return {
        sourceType: "youtube" as const,
        embedSrc: `https://www.youtube-nocookie.com/embed/${ytId}?${params.toString()}`,
        isDirectVideo: false,
      };
    }

    // 2. Google Drive preview
    if (raw.includes("drive.google.com")) {
      const driveSrc = raw.includes("/view")
        ? raw.replace(/\/view(\?.*)?$/, "/preview")
        : raw;
      return {
        sourceType: "drive" as const,
        embedSrc: driveSrc,
        isDirectVideo: false,
      };
    }

    // 3. Vimeo
    if (raw.includes("vimeo.com")) {
      const vimeoMatch = raw.match(/vimeo\.com\/(\d+)/);
      const vimeoSrc = vimeoMatch
        ? `https://player.vimeo.com/video/${vimeoMatch[1]}?badge=0&autopause=0&player_id=0&app_id=58479`
        : raw;
      return {
        sourceType: "vimeo" as const,
        embedSrc: vimeoSrc,
        isDirectVideo: false,
      };
    }

    // 4. Generic embed or player iframe
    if (raw.includes("/embed/") || raw.includes("player.")) {
      return {
        sourceType: "embed" as const,
        embedSrc: raw,
        isDirectVideo: false,
      };
    }

    // 5. Direct video URL (.mp4, signed stream, etc.)
    return {
      sourceType: "direct" as const,
      embedSrc: raw,
      isDirectVideo: true,
    };
  }, [url, autoPlay]);

  // Robust recurrent handshake & telemetry ticker for YouTube iframe
  useEffect(() => {
    if (sourceType !== "youtube") return;

    const performHandshake = () => {
      if (!iframeRef.current?.contentWindow) return;
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "listening" }),
          "*"
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "getCurrentTime", args: "" }),
          "*"
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "getDuration", args: "" }),
          "*"
        );
      } catch {}
    };

    // Run immediate handshake then maintain 500ms ticker
    performHandshake();
    pollTimerRef.current = setInterval(performHandshake, 500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [sourceType, embedSrc]);

  // Direct video telemetry listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isDirectVideo) return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setIsEnded(false);
      setIsLoading(false);
    };
    const onPause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };
    const onEndedInternal = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setIsEnded(true);
      onEnded?.();
    };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEndedInternal);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEndedInternal);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [isDirectVideo, onEnded]);

  // HUD auto-hide management
  const triggerHudActivity = useCallback(() => {
    setIsHudVisible(true);
    setHasInteracted(true);
    if (hideHudTimerRef.current) {
      clearTimeout(hideHudTimerRef.current);
    }
    hideHudTimerRef.current = setTimeout(() => {
      setIsHudVisible(false);
      setShowSpeedMenu(false);
    }, 3500);
  }, []);

  const handleTogglePlay = () => {
    if (isDirectVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
        setIsPaused(false);
        setIsEnded(false);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsPaused(true);
      }
      return;
    }

    if (sourceType === "youtube") {
      if (isPlaying) {
        setIsPlaying(false);
        setIsPaused(true);
        sendYouTubeCommand("pauseVideo");
      } else {
        setIsPlaying(true);
        setIsPaused(false);
        setIsEnded(false);
        sendYouTubeCommand("playVideo");
      }
    }
  };

  const handleSkip = (seconds: number) => {
    const nextTime = Math.max(0, Math.min(duration || 0, currentTime + seconds));
    setCurrentTime(nextTime);

    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = nextTime;
    } else if (sourceType === "youtube") {
      sendYouTubeCommand("seekTo", [nextTime, true]);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const nextTime = pos * duration;
    setCurrentTime(nextTime);

    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = nextTime;
    } else if (sourceType === "youtube") {
      sendYouTubeCommand("seekTo", [nextTime, true]);
    }
  };

  const handleToggleMute = () => {
    if (isDirectVideo && videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    } else if (sourceType === "youtube") {
      if (isMuted) {
        sendYouTubeCommand("unMute");
        setIsMuted(false);
      } else {
        sendYouTubeCommand("mute");
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);

    if (isDirectVideo && videoRef.current) {
      videoRef.current.volume = newVol / 100;
      videoRef.current.muted = newVol === 0;
    } else if (sourceType === "youtube") {
      sendYouTubeCommand("setVolume", [newVol]);
      if (newVol > 0 && isMuted) {
        sendYouTubeCommand("unMute");
      }
    }
  };

  const handleSetPlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (isDirectVideo && videoRef.current) {
      videoRef.current.playbackRate = rate;
    } else if (sourceType === "youtube") {
      sendYouTubeCommand("setPlaybackRate", [rate]);
    }
  };

  const handleReplay = () => {
    setIsEnded(false);
    setIsPaused(false);
    setIsPlaying(true);
    setCurrentTime(0);

    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else if (sourceType === "youtube") {
      sendYouTubeCommand("seekTo", [0, true]);
      sendYouTubeCommand("playVideo");
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  // Shield event handler helper blocking mouse and touch clicks
  const blockShieldEvent = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onContextMenu={blockShieldEvent}
      onMouseMove={triggerHudActivity}
      onMouseEnter={() => setIsHudVisible(true)}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      style={{ minHeight: "360px", aspectRatio: "16 / 9" }}
      className={`group relative w-full aspect-video min-h-[320px] sm:min-h-[440px] md:min-h-[500px] overflow-hidden bg-black select-none rounded-2xl md:rounded-3xl border border-slate-800/90 shadow-2xl ${aspectRatio} ${className}`}
    >
      {/* Ambient cinema background */}
      <div className="absolute inset-0 bg-radial from-indigo-950/20 via-black to-black pointer-events-none -z-10" />

      {/* LOCKED STATE CARD */}
      {isLocked ? (
        <div
          style={{ minHeight: "360px", aspectRatio: "16 / 9" }}
          className="w-full h-full min-h-[320px] sm:min-h-[440px] md:min-h-[500px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-950/90 via-slate-900 to-black z-20"
        >
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            </div>
          </div>

          <div className="max-w-md space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{badgeLabel}</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              This lecture stream is secured with forensic watermark protection.
              Enroll in this class or unlock this study pack to stream immediately.
            </p>
          </div>

          {onUnlock && (
            <div className="pt-5">
              <Button
                onClick={onUnlock}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-6 py-2.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Unlock className="w-4 h-4 mr-2" />
                <span>
                  Unlock Stream{" "}
                  {lockPrice && lockPrice > 0
                    ? `(LKR ${lockPrice.toLocaleString()})`
                    : "Free"}
                </span>
              </Button>
            </div>
          )}
        </div>
      ) : sourceType === "empty" ? (
        /* EMPTY STATE */
        <div
          style={{ minHeight: "360px", aspectRatio: "16 / 9" }}
          className="w-full h-full min-h-[320px] sm:min-h-[440px] md:min-h-[500px] flex flex-col items-center justify-center p-8 text-center text-slate-500"
        >
          <Film className="w-12 h-12 mx-auto mb-2 opacity-30 text-indigo-400" />
          <p className="text-sm font-medium text-slate-400">
            No video stream selected
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Choose a lecture or clip from the playlist to start streaming.
          </p>
        </div>
      ) : loadError ? (
        /* PLAYBACK ERROR STATE */
        <div
          style={{ minHeight: "360px", aspectRatio: "16 / 9" }}
          className="w-full h-full min-h-[320px] sm:min-h-[440px] md:min-h-[500px] flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950"
        >
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-white">Playback Error</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{loadError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoadError(null);
              setIsLoading(true);
            }}
            className="mt-4 text-xs rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Retry Playback
          </Button>
        </div>
      ) : (
        /* ACTIVE MEDIA PLAYER (Direct or Sandboxed Iframe) */
        <div
          style={{ minHeight: "360px", aspectRatio: "16 / 9" }}
          className="relative w-full h-full min-h-[320px] sm:min-h-[440px] md:min-h-[500px]"
        >
          {/* SKELETON LOADER while iframe / video connects */}
          {isLoading && (
            <div
              style={{ minHeight: "360px" }}
              className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-3 pointer-events-none"
            >
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-slate-300">
                  Securing Encrypted Stream...
                </p>
                <p className="text-[10px] text-slate-500">
                  Applying forensic anti-piracy shield
                </p>
              </div>
            </div>
          )}

          {isDirectVideo ? (
            /* HTML5 Direct Video Stream */
            <video
              ref={videoRef}
              src={embedSrc}
              playsInline
              poster={poster}
              preload="metadata"
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setLoadError("Unable to load video stream.");
              }}
              style={{ minHeight: "360px" }}
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            /*
             * Sandboxed Iframe (Maximum Anti-Leak YouTube Lockdown):
             * - Strictly OMITS `allow-popups` and `allow-popups-to-escape-sandbox`.
             * - Strictly OMITS `clipboard-write` permissions.
             * - `controls=0` in embedSrc ensures YouTube native controls, title, share button,
             *   and recommendation shelves are completely omitted.
             */
            <iframe
              ref={iframeRef}
              key={embedSrc}
              src={embedSrc}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={() => {
                setIsLoading(false);
                try {
                  iframeRef.current?.contentWindow?.postMessage(
                    JSON.stringify({ event: "listening" }),
                    "*"
                  );
                } catch {}
              }}
              style={{ minHeight: "360px" }}
              className="w-full h-full border-0 block"
            />
          )}

          {/* =========================================================================
           * FULL-SURFACE GLASSPANE CLICK & CONTEXT SHIELD
           * Covers 100% of the video canvas:
           * - Intercepts ALL right-clicks: completely prevents YouTube's context menu.
           * - Click toggles Play / Pause.
           * - Double-click toggles Fullscreen.
           * ========================================================================= */}
          {!isPaused && !isEnded && (
            <div
              onClick={handleTogglePlay}
              onDoubleClick={toggleFullscreen}
              onContextMenu={blockShieldEvent}
              className="absolute inset-0 z-10 pointer-events-auto cursor-pointer"
              title=""
            />
          )}

          {/* =========================================================================
           * TOP HEADER BAR HUD (Cinema badges, lecture title, Fullscreen)
           * ========================================================================= */}
          <div
            onContextMenu={blockShieldEvent}
            className={`absolute top-0 inset-x-0 p-3 sm:p-4 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
              isHudVisible || !hasInteracted || isPaused ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Left: Stream badges & Title */}
            <div className="flex items-center gap-2 max-w-[70%] pointer-events-auto">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline font-semibold">HD Protected</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-slate-300 text-[11px] font-medium shadow-md">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden md:inline">Forensic ID Active</span>
              </div>

              <span className="text-xs font-semibold text-white/90 truncate drop-shadow-md hidden lg:inline-block max-w-[200px]">
                {title}
              </span>
            </div>

            {/* Right: Controls & Top action */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {topAction}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                className="p-1.5 sm:p-2 rounded-xl bg-black/70 hover:bg-black/90 active:scale-95 text-white/90 hover:text-white backdrop-blur-md border border-white/10 shadow-md transition-all cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Cinema"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* =========================================================================
           * LUXURY CUSTOM CINEMA CONTROLS BAR
           * Completely replaces native YouTube controls with 100% leak-proof LMS controls:
           * - Scrubber timeline with progress
           * - Play / Pause, Rewind 10s, Forward 10s
           * - Volume slider & Mute toggle
           * - Time display
           * - Speed selector (0.75x, 1x, 1.25x, 1.5x, 2x)
           * ========================================================================= */}
          {!isEnded && !isLocked && (
            <div
              className={`absolute bottom-0 inset-x-0 z-20 px-3 py-2.5 sm:px-5 sm:py-3.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-auto transition-opacity duration-300 ${
                isHudVisible || isPaused || !isPlaying
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={blockShieldEvent}
            >
              {/* Scrubber Timeline */}
              <div
                className="relative w-full h-2 mb-2 sm:mb-3 bg-white/20 hover:h-2.5 rounded-full cursor-pointer group/scrub flex items-center transition-all"
                onClick={handleSeek}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full pointer-events-none"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md -translate-x-1/2 opacity-0 group-hover/scrub:opacity-100 transition-opacity"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between text-white text-xs">
                {/* Left controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="p-1 sm:p-1.5 hover:text-indigo-400 active:scale-95 transition"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(-10)}
                    className="p-1 sm:p-1.5 hover:text-indigo-400 active:scale-95 transition hidden xs:inline-flex"
                    title="Rewind 10 seconds"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(10)}
                    className="p-1 sm:p-1.5 hover:text-indigo-400 active:scale-95 transition hidden xs:inline-flex"
                    title="Forward 10 seconds"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Volume / Mute */}
                  <div className="flex items-center gap-1.5 group/vol">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="p-1 sm:p-1.5 hover:text-indigo-400 transition"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-12 sm:w-20 h-1 accent-indigo-500 bg-white/20 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Time display */}
                  <span className="font-mono text-[11px] text-slate-300 tracking-tight hidden sm:inline">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="px-2 py-0.5 sm:py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-semibold transition"
                      title="Playback Speed"
                    >
                      {playbackRate}x
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 w-20 z-30">
                        {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => {
                              handleSetPlaybackRate(rate);
                              setShowSpeedMenu(false);
                            }}
                            className={`w-full text-left px-3 py-1 text-[11px] hover:bg-indigo-600/30 flex items-center justify-between ${
                              playbackRate === rate
                                ? "text-indigo-400 font-bold"
                                : "text-slate-300"
                            }`}
                          >
                            <span>{rate}x</span>
                            {playbackRate === rate && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1 sm:p-1.5 hover:text-indigo-400 active:scale-95 transition"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
           * PAUSE SHIELD OVERLAY
           * Completely occludes the video canvas when paused:
           * - 100% blocks and hides YouTube recommendations, links, and shelves.
           * - Click anywhere resumes playback cleanly.
           * ========================================================================= */}
          {isPaused && !isLocked && !isEnded && (
            <div
              onClick={handleTogglePlay}
              onContextMenu={blockShieldEvent}
              className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer transition-all duration-300"
            >
              <div className="relative mb-3 group/resume">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 group-hover/resume:scale-105 group-hover/resume:bg-indigo-500 transition-all">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 text-white fill-current" />
                </div>
              </div>
              <div className="space-y-1.5 max-w-md">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[11px] font-semibold border border-white/15">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Lecture Paused
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                  {title}
                </h4>
                <p className="text-xs text-slate-400">
                  Click anywhere to resume lecture
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
           * ENDED SHIELD OVERLAY
           * Prevents YouTube's 12-card recommendation grid from appearing at the end of the video.
           * ========================================================================= */}
          {isEnded && !isLocked && (
            <div
              onContextMenu={blockShieldEvent}
              className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mb-5">
                <h4 className="text-lg font-bold text-white">Lecture Completed</h4>
                <p className="text-xs text-slate-400 line-clamp-1">{title}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleReplay}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Replay Lecture
                </Button>
                {topAction}
              </div>
            </div>
          )}

          {/* =========================================================================
           * SUBTLE STATIONARY PERIPHERAL FORENSIC WATERMARK OVERLAY
           * Discrete non-intrusive micro-badge docked in peripheral bottom-left corner.
           * ========================================================================= */}
          <ForensicWatermarkOverlay watermark={resolvedWatermark} />
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
