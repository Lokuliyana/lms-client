"use client";

import { useState, useEffect, useMemo, use } from "react";
import { SectionHeader } from "@/components/reusable/section-header";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { Video } from "lucide-react";
import { AddRecordingForm } from "@/components/ui/recordings/add-recording";
import { getClasses } from "@/services/classService";
import { getRecordingById, updateRecording, type Recording } from "@/services/recordingService";

type UIClass = { id: string; name: string; };
type UIBatch = { id: string; time: string; name: string; };

type EditRecordingPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditRecordingPage({ params }: EditRecordingPageProps) {
  const { id: recordingId } = use(params);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [classes, setClasses] = useState<UIClass[]>([]);
  const [batches, setBatches] = useState<Record<string, UIBatch[]>>({});
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [classData, rec] = await Promise.all([
          getClasses(),
          getRecordingById(recordingId),
        ]);
        setClasses(classData.map((c: any) => ({ id: c._id, name: c.title })));

        const batchMap: Record<string, UIBatch[]> = {};
        classData.forEach((cls: any) => {
          if (Array.isArray(cls.batches)) {
            batchMap[cls._id] = cls.batches.map((b: any) => {
              const batchName = b.batch_name || `${capitalize(b.day)} ${b.start}`;
              const time = b.day && b.start && b.end
                  ? `${capitalize(b.day)} ${b.start} - ${b.end}`
                  : "Unknown time";
              return { id: b._id, name: batchName, time };
            });
          }
        });
        setBatches(batchMap);
        setRecording(rec);
      } catch (err) {
        console.error("Failed to load classes/recording", err);
        setSubmitMessage("Failed to load recording.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [recordingId]);

  const initialValues = useMemo(() => {
    if (!recording) return null;
    const selectedClassId = recording.class_id;
    const classBatches = batches[selectedClassId] || [];
    const batch = classBatches.find((b) => b.name === recording.batch_name);
    const selectedBatchId = batch?.id || (classBatches[0]?.id ?? "");
    const selectedDate = recording.session_date ? new Date(recording.session_date).toISOString().slice(0, 10) : "";

    const isYouTube = recording.driveUrl?.includes("youtube.com") || recording.driveUrl?.includes("youtu.be") || recording.driveFileId?.length === 11 || recording.video_url?.length === 11;
    const driveUrl = recording.driveUrl || (recording.driveFileId ? (isYouTube ? `https://www.youtube.com/watch?v=${recording.driveFileId}` : `https://drive.google.com/file/d/${recording.driveFileId}/view`) : recording.video_url ? (isYouTube ? `https://www.youtube.com/watch?v=${recording.video_url}` : `https://drive.google.com/file/d/${recording.video_url}/view`) : "");

    return {
      selectedClassId,
      selectedBatchId,
      selectedDate,
      title: recording.title,
      driveUrl,
      recordingType: (isYouTube ? "youtube" : "drive") as "youtube" | "drive"
    };
  }, [recording, batches]);

  const handleFormSubmit = async (data: { selectedClassId: string; selectedBatchId: string; selectedDate: string; title: string; driveUrl: string; recordingType?: "drive" | "youtube"; }) => {
    setSubmitMessage(null);
    if (!recording) { setSubmitMessage("Recording not loaded."); return; }
    const isYouTube = data.recordingType === "youtube";
    const sourceLabel = isYouTube ? "YouTube" : "Google Drive";

    if (!data.selectedBatchId || !data.selectedDate || !data.title || !data.driveUrl) {
      setSubmitMessage(`⚠️ Please fill all fields and paste a ${sourceLabel} link.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const batchList = batches[data.selectedClassId] || [];
      const batch = batchList.find((b) => b.id === data.selectedBatchId);
      const updates = {
        session_date: data.selectedDate,
        batch_name: batch?.name || recording.batch_name || "",
        title: data.title,
        driveUrl: data.driveUrl,
      };
      const response = await updateRecording(recordingId, updates);
      setSubmitMessage(`✅ Successfully updated "${response.recording.title}"`);
    } catch (err) {
      console.error(err);
      setSubmitMessage("❌ Failed to update the recording.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !initialValues) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-64 w-full bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <SectionHeader
        title="Edit Class Recording"
        breadcrumbs={[
          { label: "Home", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
          { label: "Edit Recording" },
        ]}
        description="Update the class recording details, batch association, or stream link."
        illustration={CLAY_ASSETS.recordingsCinema}
        variant="rose"
        icon={Video}
      />
      <AddRecordingForm classes={classes} batches={batches} onSubmit={handleFormSubmit} isSubmitting={isSubmitting} submitMessage={submitMessage} initialValues={initialValues} submitLabel="Save Changes" />
    </div>
  );
}

function capitalize(word: string) { return word.charAt(0).toUpperCase() + word.slice(1); }
