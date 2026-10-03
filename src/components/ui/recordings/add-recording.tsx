"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dev/card";
import { Label } from "@/components/dev/label";
import { Input } from "@/components/dev/input";
import { Button } from "@/components/dev/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dev/select";
import {
  HiAcademicCap,
  HiVideoCamera,
  HiCheckCircle,
  HiLink,
  HiPencil,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

interface ClassData {
  id: string;
  name: string;
}

interface BatchData {
  id: string;
  time: string;
  name?: string;
}

interface BatchesMap {
  [classId: string]: BatchData[];
}

export interface AddRecordingFormData {
  selectedClassId: string;
  selectedBatchId: string;
  selectedDate: string;
  title: string;
  driveUrl: string;
  recordingType?: "drive" | "youtube";
}

interface AddRecordingFormProps {
  classes: ClassData[];
  batches: BatchesMap;
  onSubmit: (data: AddRecordingFormData) => Promise<void> | void;
  isSubmitting?: boolean;
  submitMessage?: string | null;

  /** For edit mode: prefill form */
  initialValues?: Partial<AddRecordingFormData>;
  /** For edit mode: button label override (e.g. "Save Changes") */
  submitLabel?: string;
}

export function AddRecordingForm({
  classes,
  batches,
  onSubmit,
  isSubmitting = false,
  submitMessage = null,
  initialValues,
  submitLabel = "Save Recording",
}: AddRecordingFormProps) {
  const [selectedClass, setSelectedClass] = useState<string>(
    initialValues?.selectedClassId ?? ""
  );
  const [selectedBatch, setSelectedBatch] = useState<string>(
    initialValues?.selectedBatchId ?? ""
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    initialValues?.selectedDate ?? ""
  );
  const [title, setTitle] = useState<string>(
    initialValues?.title ?? ""
  );
  const [driveUrl, setDriveUrl] = useState<string>(
    initialValues?.driveUrl ?? ""
  );
  const [recordingType, setRecordingType] = useState<"drive" | "youtube">(
    initialValues?.recordingType ?? (initialValues?.driveUrl?.includes("youtube.com") || initialValues?.driveUrl?.includes("youtu.be") ? "youtube" : "drive")
  );

  // Sync when initialValues change (edit page after async load)
  useEffect(() => {
    if (!initialValues) return;
    if (initialValues.selectedClassId !== undefined) {
      setSelectedClass(initialValues.selectedClassId);
    }
    if (initialValues.selectedBatchId !== undefined) {
      setSelectedBatch(initialValues.selectedBatchId);
    }
    if (initialValues.selectedDate !== undefined) {
      setSelectedDate(initialValues.selectedDate);
    }
    if (initialValues.title !== undefined) {
      setTitle(initialValues.title);
    }
    if (initialValues.driveUrl !== undefined) {
      setDriveUrl(initialValues.driveUrl);
      // Auto-detect type if editing
      if (initialValues.driveUrl.includes("youtube.com") || initialValues.driveUrl.includes("youtu.be")) {
          setRecordingType("youtube");
      } else {
          setRecordingType("drive");
      }
    }
  }, [initialValues]);

  const availableBatches = useMemo(() => {
    return selectedClass ? batches[selectedClass] || [] : [];
  }, [selectedClass, batches]);

  // Auto-generate title if empty and we have enough info
  useEffect(() => {
    if (!title && selectedBatch && selectedDate && selectedClass) {
        const batchList = batches[selectedClass] || [];
        const batch = batchList.find(b => b.id === selectedBatch);
        if (batch) {
             const batchName = batch.name || "Recording";
             setTitle(`${batchName} - ${selectedDate}`);
        }
    }
  }, [selectedBatch, selectedDate, selectedClass, batches, title]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: AddRecordingFormData = {
      selectedClassId: selectedClass,
      selectedBatchId: selectedBatch,
      selectedDate,
      title,
      driveUrl: driveUrl.trim(),
      recordingType,
    };

    await onSubmit(formData);
  };

  const handleClear = () => {
    if (initialValues) {
      setSelectedClass(initialValues.selectedClassId ?? "");
      setSelectedBatch(initialValues.selectedBatchId ?? "");
      setSelectedDate(initialValues.selectedDate ?? "");
      setTitle(initialValues.title ?? "");
      setDriveUrl(initialValues.driveUrl ?? "");
      return;
    }

    setSelectedClass("");
    setSelectedBatch("");
    setSelectedDate("");
    setTitle("");
    setDriveUrl("");
  };

  const commonInputClasses =
    "bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all";
  const commonCardClasses =
    "bg-white rounded-xl shadow-lg border border-gray-100/80";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Class Details */}
      <Card className={commonCardClasses}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiAcademicCap className="w-5 h-5 text-indigo-600" />
            Class Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label
              htmlFor="class-select"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Select Class
            </Label>
            <Select
              onValueChange={(val) => {
                setSelectedClass(val);
                setSelectedBatch(""); // reset batch when class changes
              }}
              value={selectedClass}
            >
              <SelectTrigger id="class-select" className={commonInputClasses}>
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              htmlFor="batch-select"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Select Batch / Time Slot
            </Label>
            <Select
              onValueChange={setSelectedBatch}
              value={selectedBatch}
              disabled={!selectedClass}
            >
              <SelectTrigger id="batch-select" className={commonInputClasses}>
                <SelectValue placeholder="Choose a batch" />
              </SelectTrigger>
              <SelectContent>
                {availableBatches.length > 0 ? (
                  availableBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.time}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-batches" disabled>
                    No batches available for this class
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              htmlFor="recording-date"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Recording Date
            </Label>
            <Input
              id="recording-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={commonInputClasses}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Recording Source Selection */}
      <Card className={commonCardClasses}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiVideoCamera className="w-5 h-5 text-indigo-600" />
            Recording Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setRecordingType("drive")}
              className={cn(
                "flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                recordingType === "drive"
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700"
                  : "border-gray-100 bg-gray-50/50 text-gray-500 hover:border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                recordingType === "drive" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"
              )}>
                <HiVideoCamera className="w-5 h-5" />
              </div>
              <span className="font-medium">Google Drive</span>
            </button>

            <button
              type="button"
              onClick={() => setRecordingType("youtube")}
              className={cn(
                "flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                recordingType === "youtube"
                  ? "border-red-600 bg-red-50/50 text-red-700"
                  : "border-gray-100 bg-gray-50/50 text-gray-500 hover:border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                recordingType === "youtube" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-400"
              )}>
                <HiLink className="w-5 h-5" />
              </div>
              <span className="font-medium">YouTube</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recording Details */}
      <Card className={commonCardClasses}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
             <HiPencil className="w-5 h-5 text-indigo-600" />
             Recording Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
            <Label
              htmlFor="recording-title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Title
            </Label>
            <Input
              id="recording-title"
              type="text"
              placeholder="e.g. 2024 Revision - Week 05"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={commonInputClasses}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
                This will be displayed on the recording card.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Link Section */}
      <Card className={commonCardClasses}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiLink className="w-5 h-5 text-indigo-600" />
            {recordingType === "drive" ? "Google Drive Link" : "YouTube Link"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label
            htmlFor="drive-url"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {recordingType === "drive" ? "Google Drive URL" : "YouTube URL"}
          </Label>
          <div className="relative">
            <HiLink className={cn(
                "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
                recordingType === "drive" ? "text-indigo-400" : "text-red-400"
            )} />
            <Input
              id="drive-url"
              type="url"
              placeholder={recordingType === "drive" ? "https://drive.google.com/file/d/FILE_ID/view" : "https://www.youtube.com/watch?v=VIDEO_ID"}
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              className={cn(commonInputClasses, "pl-9")}
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            {recordingType === "drive" ? (
                <>
                    Paste any Google Drive file link (e.g., <code>/file/d/&lt;id&gt;/view</code>). Make sure your sharing settings allow students to view it.
                </>
            ) : (
                <>
                    Paste any YouTube video link (e.g., <code>youtube.com/watch?v=...</code> or <code>youtu.be/...</code>). Unlisted or Public videos are supported.
                </>
            )}
          </p>

          {submitMessage && (
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg",
                submitMessage.includes("✅") || submitMessage.includes("Success")
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              <HiCheckCircle className="w-4 h-4" />
              {submitMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="px-6 py-2.5 bg-transparent border-gray-300 hover:bg-gray-100 active:scale-98"
          onClick={handleClear}
        >
          Clear
        </Button>
        <Button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-98"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
