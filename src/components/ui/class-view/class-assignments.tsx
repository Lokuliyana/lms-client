// components/class-assignments.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { HiPlus, HiCalendar, HiPaperClip, HiArrowPath } from "react-icons/hi2";
import { format, addDays } from "date-fns";

import { Button } from "@/components/dev/button";
import { Card } from "@/components/dev/card";
import { Input } from "@/components/dev/input";
import { Label } from "@/components/dev/label";
import { Textarea } from "@/components/dev/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dev/dropdown-menu";
import { Separator } from "@/components/dev/separator";

import { useAuth } from "@/hooks/useAuth";
import {
  createAssignment,
  listAssignments,
  updateAssignment,
  deleteAssignment,
  upsertSubmission,
  type AssignmentItem,
  type SubmissionItem,
} from "@/services/assignmentService";
import { uploadMedia } from "@/services/mediaService";

/* ================= Helpers ================= */
const MAX_MB = 10;
const ACCEPT = "image/*,application/pdf";

const isPast = (d: string | Date) => {
  const t = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  return t.getTime() < now.setHours(0, 0, 0, 0);
};

function DueBadge({ due }: { due: string | Date }) {
  const past = isPast(due);
  const dateLabel = format(new Date(due), "MMM d, yyyy");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset
        ${
          past
            ? "bg-rose-50 text-rose-700 ring-rose-200"
            : "bg-emerald-50 text-emerald-700 ring-emerald-200"
        }`}
      title={`Due ${dateLabel}`}
    >
      <HiCalendar className="w-3.5 h-3.5" />
      {past ? "Past due" : `Due ${dateLabel}`}
    </span>
  );
}

/* ============= Shared: InstantUploader ============= */
function InstantUploader({
  ownerType,
  ownerId,
  multiple = true,
  onUploaded,
  disabled,
}: {
  ownerType: "class" | "answer" | "quiz" | "enrollment";
  ownerId?: string | null;
  multiple?: boolean;
  onUploaded?: (url: string, file: File) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<File[]>([]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!ownerId) {
      setError("Missing ownerId: cannot upload yet.");
      return;
    }

    for (const f of files) {
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`"${f.name}" is too large. Max ${MAX_MB}MB.`);
        continue;
      }
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
        setError(`"${f.name}" is not an image or PDF.`);
        continue;
      }

      setPicked((xs) => [...xs, f]);
      try {
        setUploading(true);
        const { publicUrl } = await uploadMedia(
          f,
          ownerType,
          String(ownerId),
          (pp) => setPct(Math.round(pp))
        );
        onUploaded?.(publicUrl, f);
      } catch (err: any) {
        console.error("Upload failed:", err);
        setError(err?.message || "Failed to upload file.");
      } finally {
        setUploading(false);
        setPct(0);
      }
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        disabled={disabled || uploading}
        onChange={onPick}
        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-60"
      />
      {!!picked.length && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {picked.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="rounded-lg border border-gray-200 p-2 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <HiPaperClip className="w-4 h-4 text-gray-500" />
                <span className="truncate">{f.name}</span>
              </div>
              <div className="mt-1 text-[10px] text-gray-500">
                {(f.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          ))}
        </div>
      )}
      {uploading && (
        <div className="mt-1">
          <div className="h-1.5 w-full bg-gray-200 rounded">
            <div
              className="h-1.5 bg-indigo-600 rounded transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-gray-600 text-right">
            {pct}%
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/* ================= Create Assignment (Teacher) ================= */
function CreateAssignmentModal({
  open,
  onClose,
  ownerId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  ownerId?: string | null;
  onCreated: (a: AssignmentItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [busyCreate, setBusyCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dueDate = addDays(new Date(), 7);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDesc("");
      setUploadedUrls([]);
      setBusyCreate(false);
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!title.trim()) return setError("Title is required.");
    if (!ownerId) return setError("Missing ownerId: cannot create assignment.");
    setError(null);
    setBusyCreate(true);
    try {
      const assignment = await createAssignment(String(ownerId), {
        title: title.trim(),
        description: desc,
        due_date: dueDate,
        urls: uploadedUrls,
      });
      onCreated(assignment);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to create assignment.");
    } finally {
      setBusyCreate(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <button
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={() => (!busyCreate ? onClose() : null)}
      />
      <div className="relative z-10 w-[92vw] max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
        <div className="p-5 space-y-4">
          <h3 className="text-lg font-semibold">Create assignment</h3>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 3 Worksheet"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Due date</Label>
              <Input
                type="text"
                value={format(dueDate, "MMM d, yyyy")}
                readOnly
                className="bg-gray-50"
              />
              <p className="text-[11px] text-gray-500">
                Due is automatically set to 7 days from today.
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Short instructions…"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Files — images / PDF (uploaded immediately)</Label>
              <InstantUploader
                ownerType="class"
                ownerId={ownerId}
                onUploaded={(url) => setUploadedUrls((xs) => [...xs, url])}
              />
              {!!uploadedUrls.length && (
                <p className="text-[11px] text-green-600 mt-1">
                  {uploadedUrls.length} file(s) uploaded.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={busyCreate}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={busyCreate || !title}>
              {busyCreate ? (
                <>
                  <HiArrowPath className="w-4 h-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <HiPlus className="w-4 h-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Submit (Student) ================= */
function SubmitModal({
  open,
  onClose,
  assignment,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  assignment: AssignmentItem | null;
  onSaved: (sub: SubmissionItem) => void;
}) {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setUploadedUrls([]);
      setSaving(false);
      setError(null);
    }
  }, [open]);

  const maybeSave = async (urls: string[]) => {
    if (!assignment || !urls.length) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await upsertSubmission(assignment._id, { urls });
      onSaved(saved);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to submit.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !assignment) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <button
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={() => (!saving ? onClose() : null)}
      />
      <div className="relative z-10 w-[92vw] max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
        <div className="p-5 space-y-4">
          <h3 className="text-lg font-semibold">Submit — {assignment.title}</h3>

          <div className="grid gap-1.5">
            <Label>Upload files (images / PDF)</Label>
            <InstantUploader
              ownerType="answer"
              ownerId={assignment._id}
              onUploaded={(url) => {
                setUploadedUrls((xs) => {
                  const next = [...xs, url];
                  void maybeSave(next);
                  return next;
                });
              }}
            />
            <p className="text-[11px] text-gray-500">
              Files are uploaded immediately; the submission is saved right
              after upload.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Main (compact) ================= */
export default function ClassAssignments({
  ownerId,
  classId,
  pageSize = 10,
  compact = false, // <-- NEW: compact mode removes extra headings
}: {
  ownerId?: string | null;
  classId?: string | null;
  pageSize?: number;
  compact?: boolean;
}) {
  const { user, loading } = useAuth();
  const role = (user as any)?.role || "student";
  const isTeacher = (role === "teacher" || role === "admin")  || role === "moderator";

  const resolvedOwnerId = (ownerId ?? classId ?? undefined) as
    | string
    | undefined;

  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openSubmit, setOpenSubmit] = useState(false);
  const [current, setCurrent] = useState<AssignmentItem | null>(null);

  const load = async (p = 1) => {
    if (!resolvedOwnerId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await listAssignments(String(resolvedOwnerId), {
        page: p,
        limit: pageSize,
        sortBy: "due_date",
        sortOrder: "asc",
      });

      // NEW: filter to only assignments for this class
      const filtered = Array.isArray(res.data)
        ? res.data.filter(
            (a: any) => String(a.class_id) === String(resolvedOwnerId)
          )
        : [];

      setItems(filtered);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Failed to load assignments.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (resolvedOwnerId) load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedOwnerId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-16 w-full rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
        <div className="h-16 w-full rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
        <div className="h-16 w-full rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
      </div>
    );
  }

  if (!resolvedOwnerId) {
    return (
      <Card className="rounded-xl border border-rose-200 bg-rose-50 p-3">
        <div className="text-sm font-semibold text-rose-900">
          Missing ownerId
        </div>
        <div className="text-sm text-rose-900/90">
          Pass <code>ownerId</code> (class id) or legacy <code>classId</code>.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tiny action bar (teachers only) */}
      {isTeacher && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setOpenCreate(true)}>
            <HiPlus className="w-4 h-4 mr-1.5" />
            New
          </Button>
        </div>
      )}

      {/* Just the list */}
      <div className="space-y-2">
        {busy ? (
          <div className="space-y-2 py-2">
            <div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ) : err ? (
          <div className="text-sm text-red-600 px-1">{err}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 italic px-1">
            No assignments yet.
          </div>
        ) : (
          items.map((a) => (
            <div
              key={a._id}
              className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 hover:bg-gray-50 transition"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {a.title}
                    </h3>
                    <DueBadge due={a.due_date} />
                  </div>
                  {a.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {a.description}
                    </p>
                  )}

                  {/* attachments visible to whoever sees this component (enrolled/teacher) */}
                  {Array.isArray(a.urls) && a.urls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {a.urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300"
                        >
                          <HiPaperClip className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[140px]">
                            Attachment {idx + 1}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isTeacher ? (
                    <Button
                      className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      onClick={() => {
                        setCurrent(a);
                        setOpenSubmit(true);
                      }}
                    >
                      Submit
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            const y = addDays(new Date(), -1);
                            updateAssignment(a._id, { due_date: y }).then(() =>
                              load(page)
                            );
                          }}
                        >
                          Mark past due (demo)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-700"
                          onClick={async () => {
                            await deleteAssignment(a._id);
                            load(page);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Minimal pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateAssignmentModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        ownerId={resolvedOwnerId}
        onCreated={(a) => setItems((xs) => [a, ...xs])}
      />
      <SubmitModal
        open={openSubmit}
        onClose={() => setOpenSubmit(false)}
        assignment={current}
        onSaved={() => {}}
      />
    </div>
  );
}
