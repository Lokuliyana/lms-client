// components/apply-class.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  HiXMark,
  HiPaperClip,
  HiCheckCircle,
  HiArrowPath,
} from "react-icons/hi2";
import { applyForClass } from "@/services/classService";
import API from "@/lib/axios";
import { uploadMedia } from "@/services/mediaService";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  classId: string;
  classTitle?: string;
  /** YYYY-MM (e.g., "2025-06"); undefined means "this month" */
  requestedMonth?: string;
  /** called only when applyForClass succeeds */
  onSuccess?: (ym?: string) => void;
};

const MAX_MB = 10;
const ACCEPT = "image/*,application/pdf";

function monthShortLabel(ym?: string) {
  if (!ym) return "this month";
  const d = new Date(`${ym}-01T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return ym;
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(d);
}

export function PaymentProofModal({
  open,
  onClose,
  classId,
  classTitle = "Class application",
  requestedMonth,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const monthBadge = requestedMonth
    ? `for ${monthShortLabel(requestedMonth)}`
    : "for this month";

  // reset modal state on close
  useEffect(() => {
    if (!open) {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
      setUploadedUrl(null);
      setError(null);
      setSubmitting(false);
      setUploading(false);
      setUploadPct(0);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC to close (disabled while busy)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !uploading && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, uploading, submitting]);

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large. Max ${MAX_MB}MB.`);
      return;
    }
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      setError("Only images or PDF are allowed.");
      return;
    }

    setError(null);
    setFile(f);
    setUploadedUrl(null);
    setUploadPct(0);

    const localPreview = f.type.startsWith("image/")
      ? URL.createObjectURL(f)
      : null;
    setPreviewUrl(localPreview || null);

    try {
      setUploading(true);
      const { publicUrl } = await uploadMedia(
        f,
        "enrollment",
        classId,
        (pct) => setUploadPct(pct)
      );
      setUploadedUrl(publicUrl);
    } catch (err: any) {
      console.error("Upload failed:", err);
      const msg = err?.message || "Failed to upload proof document.";
      setError(msg);
      setUploadedUrl(null);

      toast({
        title: "Upload failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (localPreview) URL.revokeObjectURL(localPreview);
    }
  };

  const handlePayOnline = async () => {
    try {
      setError(null);
      setSubmitting(true);
      const { data } = await API.post("/payments/checkout", { classId, monthKey: requestedMonth });
      if (data.url) window.location.href = data.url;
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to initiate payment");
      setSubmitting(false);
    }
  };
  const submit = async () => {
    if (!uploadedUrl) {
      const msg = file
        ? "Please wait until the upload completes."
        : "Please attach a payment proof (image or PDF).";
      setError(msg);

      toast({
        title: msg,
        description: "Please try again.",
        variant: "destructive",
      });

      return;
    }

    try {
      setError(null);
      setSubmitting(true);

      await applyForClass(classId, uploadedUrl, requestedMonth);

      // ✅ tell parent so it can show persistent pending banner
      onSuccess?.(requestedMonth);

      onClose();
    } catch (e: any) {
      console.error("Apply failed:", e);
      const msg = e?.message || "Failed to apply for the class.";
      setError(msg);

      toast({
        title: msg,
        description:
          "Please try again or contact the teacher if the issue continues.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const busy = uploading || submitting;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={() => (!busy ? onClose() : null)}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        disabled={busy}
      />

      {/* dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full sm:w-[92vw] sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-xl ring-1 ring-black/10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between p-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Enroll — attach payment proof
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-gray-500">{classTitle}</p>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                {monthBadge}
              </span>
            </div>
          </div>
          <button
            onClick={() => (!busy ? onClose() : null)}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            disabled={busy}
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="px-4 pb-4 space-y-3">
          <label
            htmlFor="proof"
            className="block text-sm font-medium text-gray-700"
          >
            Payment proof (image or PDF, up to {MAX_MB}MB)
          </label>

          <input
            id="proof"
            type="file"
            accept={ACCEPT}
            onChange={pickFile}
            disabled={busy}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-60"
          />

          {file && (
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <HiPaperClip className="h-5 w-5 text-gray-500" />
                  <span className="truncate text-sm text-gray-900">
                    {file.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mt-3 max-h-56 w-full rounded-md object-contain"
                />
              )}

              {uploading && (
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-gray-200 rounded">
                    <div
                      className="h-1.5 bg-indigo-600 rounded transition-all"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-600 text-right">
                    {uploadPct}%
                  </div>
                </div>
              )}

              {uploadedUrl && !uploading && (
                <p className="mt-2 text-xs text-green-600">
                  File uploaded successfully.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="sticky bottom-0 bg-white flex items-center justify-between border-t border-gray-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handlePayOnline}
            disabled={busy}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
          >
            Pay Online (Instant)
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (!busy ? onClose() : null)}
              disabled={busy}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={busy || !uploadedUrl}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              title={
                busy
                  ? "Please wait…"
                  : !uploadedUrl
                  ? "Wait for the file to finish uploading"
                  : undefined
              }
            >
            {uploading ? (
              <>
                <HiArrowPath className="mr-2 h-5 w-5 animate-spin" />
                Uploading… {uploadPct}%
              </>
            ) : submitting ? (
              <>
                <HiArrowPath className="mr-2 h-5 w-5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <HiCheckCircle className="mr-2 h-5 w-5" />
                Send application
              </>
            )}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
