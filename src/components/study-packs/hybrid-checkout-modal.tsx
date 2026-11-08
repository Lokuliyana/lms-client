"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/dev/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/dev/label";
import { studyPackService, IStudyPack } from "@/services/studyPackService";
import { uploadMedia } from "@/services/mediaService";
import { useAuth } from "@/hooks/useAuth";
import {
  Sparkles,
  BookOpen,
  CheckCircle,
  ShieldCheck,
  UploadCloud,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Video,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";

interface HybridCheckoutModalProps {
  pack: IStudyPack;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (purchaseData: any) => void;
}

export const HybridCheckoutModal: React.FC<HybridCheckoutModalProps> = ({
  pack,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Attachment Proof State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const price = pack.price || 0;
  const isFree = price === 0;

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setFile(null);
      setPreviewUrl(null);
      setUploadedUrl(null);
      setUploading(false);
      setUploadPct(0);
      setNotes("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit. Please choose a smaller image or PDF.");
      return;
    }

    const isValidType =
      selected.type.startsWith("image/") || selected.type === "application/pdf";
    if (!isValidType) {
      setError("Only image files (JPG, PNG, WEBP) or PDF documents are supported.");
      return;
    }

    setError(null);
    setFile(selected);

    const localPreview = selected.type.startsWith("image/")
      ? URL.createObjectURL(selected)
      : null;
    setPreviewUrl(localPreview);

    try {
      setUploading(true);
      setUploadPct(0);
      const res = await uploadMedia(
        selected,
        "enrollment",
        pack._id,
        (pct) => setUploadPct(pct)
      );

      if (res.publicUrl) {
        setUploadedUrl(res.publicUrl);
        toast.success("Payment proof uploaded successfully");
      }
    } catch (err: any) {
      console.error("Proof upload failed:", err);
      const msg = err.message || "Failed to upload payment proof document";
      setError(msg);
      setUploadedUrl(null);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setUploadPct(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to unlock this study pack.");
      return;
    }

    if (uploading) {
      toast.error("Please wait for your payment proof to finish uploading.");
      return;
    }

    if (!isFree && !uploadedUrl) {
      if (file) {
        setError("Payment proof upload did not complete. Please re-select or re-upload your file.");
        toast.error("Payment proof has not finished uploading successfully.");
      } else {
        setError("Payment slip attachment is required to unlock this study pack.");
        toast.error("Please attach your bank deposit slip or payment proof before submitting.");
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await studyPackService.purchaseStudyPack(pack._id, {
        payment_method: "manual",
        payment_proof: uploadedUrl || undefined,
        payment_slip_name: file?.name || undefined,
        notes: notes.trim() || undefined,
        include_physical_delivery: false,
      });

      if (res.success) {
        toast.success(
          isFree
            ? "Free study pack unlocked successfully!"
            : "Payment proof submitted! Study pack access unlocked."
        );
        onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.message || "Failed to complete purchase");
      }
    } catch (err: any) {
      console.error("Purchase failed:", err);
      const msg =
        err.response?.data?.message || err.message || "Checkout failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent size="md" className="p-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-lg">
        {/* Clean, Non-bloated Modal Header */}
        <DialogHeader className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 border-b border-indigo-900/40">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-300">
              Study Pack Access
            </span>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-white leading-snug">
            {pack.title}
          </DialogTitle>
          <DialogDescription className="text-indigo-200/80 text-xs mt-1">
            Unlock complete video lectures, recorded sessions, and digital course resources.
          </DialogDescription>
        </DialogHeader>

        {/* Not Logged In Banner */}
        {!user && (
          <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-300">
            <div>
              <p className="font-bold">Account Sign-in Required</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Sign in to link this study pack to your student account.
              </p>
            </div>
            <Link href={`/login?redirect=/study-packs/${pack._id}`}>
              <Button
                size="sm"
                type="button"
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs shrink-0"
              >
                Sign In
              </Button>
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Study Pack Summary & Price As Stated */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Study Pack Access Fee</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                {pack.title}
              </h4>
              <p className="text-[11px] text-slate-500">
                Instant streaming & watermarked digital reader
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">
                Total Price
              </span>
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {isFree ? "FREE" : `LKR ${price.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Attachment Proof (Required for paid packs, optional for free) */}
          {!isFree && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Attachment Proof (Bank Slip / Payment Receipt) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Max 10MB (JPG, PNG, PDF)</span>
                </Label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Attach a photo or scan of your bank deposit slip or transfer confirmation.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2.5">
                    Click to select payment slip or proof
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports bank deposit receipts, transfer screenshots, and PDF statements
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {previewUrl ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        <Image
                          src={previewUrl}
                          alt="Slip preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                        {uploading ? (
                          <span className="text-indigo-600 font-semibold">
                            Uploading ({uploadPct}%)...
                          </span>
                        ) : uploadedUrl ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Proof Uploaded
                          </span>
                        ) : (
                          "Ready"
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={uploading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>
              )}

              {/* Reference / Notes input */}
              <div className="pt-1">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Reference Note / Transaction ID (Optional)
                </Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ref #12345 or Bank Branch"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || uploading}
              className="rounded-xl text-xs font-medium h-10 px-4 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading || (!isFree && !uploadedUrl && !file)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-10 px-6 shadow-md flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Proof...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isFree ? "Unlock Free Study Pack" : "Submit Proof & Unlock"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HybridCheckoutModal;
