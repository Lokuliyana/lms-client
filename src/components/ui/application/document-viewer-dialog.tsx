"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/dev/dialog";
import { Button } from "@/components/dev/button";
import { Textarea } from "@/components/dev/textarea";
import { Badge } from "@/components/dev/badge";
import { X, CheckCircle, XCircle, ExternalLink, Link as LinkIcon, Download, FileText, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type DocType = "image" | "pdf";

interface Document {
  id: string;
  name: string;
  type: DocType;
  url: string;
  size: string;
  uploadedAt: string;
}

interface DocumentViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  studentName: string;
  className: string;
  onApprove: (message?: string) => void;
  onReject: (reason: string) => void;
}

export function DocumentViewerDialog({
  isOpen,
  onClose,
  document,
  studentName,
  className,
  onApprove,
  onReject,
}: DocumentViewerDialogProps) {
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setShowRejectBox(false);
    setRejectReason("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key.toLowerCase() === "a" && !showRejectBox) handleApprove();
      if (e.key.toLowerCase() === "r" && !showRejectBox) setShowRejectBox(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showRejectBox]);

  const handleApprove = () => {
    onApprove?.("Approved");
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject?.(rejectReason.trim());
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(document.url);
    } catch {}
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-slate-50/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              {document.type === "image" ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">
                Review Document
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 flex items-center gap-2">
                <span className="font-medium text-slate-700">{studentName}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{className}</span>
              </DialogDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200/50">
            <X className="w-5 h-5 text-slate-500" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 bg-slate-100/50 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 overflow-auto">
              {document.type === "image" ? (
                <div className="relative w-full h-full max-w-4xl max-h-full shadow-lg rounded-lg overflow-hidden bg-white border border-slate-200">
                  <Image
                    src={document.url || "/placeholder.jpg"}
                    alt={document.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 80vw"
                  />
                </div>
              ) : (
                <object
                  data={document.url}
                  type="application/pdf"
                  className="w-full h-full max-w-4xl bg-white rounded-lg shadow-lg border border-slate-200"
                >
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                    <p>Preview not available</p>
                    <Button onClick={() => window.open(document.url, "_blank")}>
                      Open PDF
                    </Button>
                  </div>
                </object>
              )}
            </div>
          </div>

          {/* Sidebar / Actions Panel */}
          <div className="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* File Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">File Details</h4>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs text-slate-500 font-medium">Name</span>
                    <span className="text-xs text-slate-700 text-right break-all font-mono">{document.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Type</span>
                    <Badge variant="secondary" className="text-[10px] uppercase">{document.type}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Uploaded</span>
                    <span className="text-xs text-slate-700">{new Date(document.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 h-10 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                  onClick={() => window.open(document.url, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 h-10 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                  onClick={copyLink}
                >
                  <LinkIcon className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Approval Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              {!showRejectBox ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleApprove}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02]"
                    size="lg"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectBox(true)}
                    className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-800"
                    size="lg"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject Application
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Rejection Reason</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowRejectBox(false)}
                      className="h-6 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </Button>
                  </div>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please explain why..."
                    rows={3}
                    className="resize-none bg-white border-slate-200 focus:border-rose-300 focus:ring-rose-100"
                    autoFocus
                  />
                  <Button
                    variant="destructive"
                    disabled={!rejectReason.trim()}
                    onClick={handleReject}
                    className="w-full bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
