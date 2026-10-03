"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/reusable/section-header";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { Video } from "lucide-react";
import { AddRecordingForm } from "@/components/ui/recordings/add-recording";
import { getClasses } from "@/services/classService";
import { createRecording } from "@/services/recordingService";

type UIClass = {
  id: string;
  name: string;
};

type UIBatch = {
  id: string;
  time: string;
  name: string;
};

export default function AddRecordingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [classes, setClasses] = useState<UIClass[]>([]);
  const [batches, setBatches] = useState<Record<string, UIBatch[]>>({});

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await getClasses();
        setClasses(
          data.map((c: any) => ({
            id: c._id,
            name: c.title,
          }))
        );

        const batchMap: Record<string, UIBatch[]> = {};
        data.forEach((cls: any) => {
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
      } catch (error) {
        console.error("Failed to load classes or batches", error);
      }
    };
    loadClasses();
  }, []);

  const handleFormSubmit = async (data: {
    selectedClassId: string;
    selectedBatchId: string;
    selectedDate: string;
    title: string;
    driveUrl: string;
    recordingType?: "drive" | "youtube";
  }) => {
    setSubmitMessage(null);
    const isYouTube = data.recordingType === "youtube";
    const sourceLabel = isYouTube ? "YouTube" : "Google Drive";

    if (!data.selectedClassId || !data.selectedBatchId || !data.selectedDate || !data.title || !data.driveUrl) {
      setSubmitMessage(`⚠️ Please fill all fields and paste a ${sourceLabel} link.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const batch = batches[data.selectedClassId]?.find((b) => b.id === data.selectedBatchId);
      const payload = {
        class_id: data.selectedClassId,
        session_date: data.selectedDate,
        batch_name: batch?.name || "",
        title: data.title,
        driveUrl: data.driveUrl,
      };

      const response = await createRecording(payload);
      setSubmitMessage(`✅ Successfully added "${response.recording.title}"`);
    } catch (err) {
      console.error(err);
      setSubmitMessage("❌ Failed to add the recording.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      <SectionHeader
        title="Add Class Recording"
        breadcrumbs={[
          { label: "Home", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
          { label: "Add Recording" },
        ]}
        description="Paste a Google Drive or YouTube link to archive and publish a new class recording."
        illustration={CLAY_ASSETS.recordingsCinema}
        variant="rose"
        icon={Video}
      />
      <AddRecordingForm
        classes={classes}
        batches={batches}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        submitMessage={submitMessage}
      />
    </div>
  );
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
