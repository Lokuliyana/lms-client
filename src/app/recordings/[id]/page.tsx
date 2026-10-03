"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import RecordedClass from "@/components/ui/recordings/recorded-class";
import { getRecordingById, type Recording } from "@/services/recordingService";
import { DetailLoader } from "@/components/reusable/detail-loader";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [recording, setRecording] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getRecordingById(id);
        const recordingData = (data as any)?.recording || (data as any)?.data || data;
        setRecording(recordingData);
      } catch (err: any) {
        console.error("Error loading recording:", err);
        setError("Recording not found or unavailable.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <DetailLoader />;
  if (error || !recording) return <div className="p-6 text-red-600">{error ?? "Recording not found."}</div>;

  const fileId = recording.playback_url || recording.driveFileId || recording.video_url || recording.driveUrl;
  if (!fileId) {
    return <div className="p-6 text-red-600">Recording video source is missing.</div>;
  }

  const isLocal =
    recording.provider === "local" ||
    fileId.startsWith("http://") ||
    fileId.startsWith("https://") ||
    fileId.startsWith("/uploads/") ||
    fileId.includes("/uploads/");

  if (isLocal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-white border border-slate-200/80 shadow-2xl rounded-2xl overflow-hidden p-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">{recording.title ?? "Class Recording"}</h1>
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
            <video
              src={fileId}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
              controlsList="nodownload"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <RecordedClass
      title={recording.title}
      driveFileId={fileId}
      uploaded_at={recording.uploaded_at ?? new Date().toISOString()}
      useServerGate={true}
    />
  );
}

