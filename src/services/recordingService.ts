import API from "@/lib/axios";

// ---------- Types ----------
export type RecordingCreatePayload = {
  class_id: string;
  title: string;
  driveUrl: string;         // Any Google Drive link; server extracts fileId
  session_date?: string;    // YYYY-MM-DD
  batch_name?: string;
};

export type RecordingUpdatePayload = {
  title?: string;
  driveUrl?: string;
  session_date?: string | null; // null clears
  batch_name?: string | null;   // null clears
  is_expired?: boolean;
};

export type Recording = {
  _id: string;
  class_id: string;
  title: string;
  // New fields (may be absent on legacy docs until normalized)
  driveUrl?: string;
  driveFileId?: string;
  // Legacy field (often contains the Drive fileId)
  video_url?: string;
  uploaded_at: string;
  is_expired?: boolean;
  session_date?: string | null;
  batch_name?: string | null;
};

export type CreateTicketResponse = {
  ticket: string;     // short-lived JWT ticket
  iframeSrc: string;  // e.g. "/api/recordings/ticket/<ticket>"
};

// ---------- CRUD ----------
export const createRecording = async (payload: RecordingCreatePayload) => {
  try {
    const { data } = await API.post("/recordings", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return data as { message: string; recording: Recording };
  } catch (error) {
    console.error("Error creating recording:", error);
    throw new Error("Failed to create recording");
  }
};

export const updateRecording = async (
  recordingId: string,
  updates: RecordingUpdatePayload
) => {
  try {
    const { data } = await API.put(`/recordings/${encodeURIComponent(recordingId)}`, updates, {
      headers: { "Content-Type": "application/json" },
    });
    return data as { message: string; recording: Recording };
  } catch (error) {
    console.error("Error updating recording:", error);
    throw new Error("Failed to update recording");
  }
};

export const deleteRecording = async (recordingId: string) => {
  try {
    const { data } = await API.delete(`/recordings/${encodeURIComponent(recordingId)}`);
    return data as { message: string };
  } catch (error) {
    console.error("Error deleting recording:", error);
    throw new Error("Failed to delete recording");
  }
};

export const expireRecording = async (recordingId: string) => {
  try {
    const { data } = await API.put(`/recordings/${encodeURIComponent(recordingId)}/expire`);
    return data as { message: string };
  } catch (error) {
    console.error("Error expiring recording:", error);
    throw new Error("Failed to expire recording");
  }
};

// ---------- Normalizers & URLs ----------
export const getDrivePreviewIframeSrc = (fileId: string) =>
  `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;

/** Only needed if you still use the direct stream (JWT-protected). */
export const getRecordingStreamUrl = (fileId: string) => {
  const origin = process.env.NEXT_PUBLIC_API_ORIGIN
    ? process.env.NEXT_PUBLIC_API_ORIGIN.replace(/\/$/, "")
    : ""; // fallback so Next.js rewrite proxies /api → backend
  return `${origin}/api/recordings/stream/${encodeURIComponent(fileId)}`;
};

// ---------- Queries ----------
export const getRecordingById = async (recordingId: string): Promise<Recording> => {
  try {
    const { data } = await API.get(`/recordings/${encodeURIComponent(recordingId)}`);
    const raw: any = data;
    const rec: any = raw?.recording ?? raw?.data ?? raw;

    // Normalize legacy docs to have driveFileId/driveUrl on the client
    if (!rec.driveFileId && rec.video_url) {
      rec.driveFileId = rec.video_url;
      rec.driveUrl = rec.video_url.startsWith('http') || rec.video_url.startsWith('/uploads')
        ? rec.video_url
        : `https://drive.google.com/file/d/${rec.video_url}/view`;
    }
    if (!rec.uploaded_at && rec.created_at) {
      rec.uploaded_at = rec.created_at;
    }

    return rec as Recording;
  } catch (e) {
    console.error("Error fetching recording:", e);
    throw new Error("Failed to fetch recording");
  }
};

export const getRecordingsByClass = async (classId: string): Promise<Recording[]> => {
  try {
    const { data } = await API.get(`/classes/${encodeURIComponent(classId)}/recordings`);
    const items = Array.isArray(data) ? data : data?.recordings || data?.data || [];
    return items as Recording[];
  } catch (error) {
    try {
      const { data } = await API.get(`/recordings/class/${encodeURIComponent(classId)}`);
      const items = Array.isArray(data) ? data : data?.recordings || data?.data || [];
      return items as Recording[];
    } catch (e2) {
      console.error("Error fetching class recordings:", error);
      throw new Error("Failed to fetch recordings");
    }
  }
};

export const getRecordingsByClassId = getRecordingsByClass;


// ---------- JWT ticket flow ----------
/**
 * Authenticated POST that creates a short-lived JWT ticket bound to the current user.
 * The returned iframeSrc is PUBLIC and can be used directly in <iframe src=...>.
 */
export const createRecordingTicket = async (
  fileId: string
): Promise<CreateTicketResponse> => {
  if (!fileId || fileId.length < 10) {
    throw new Error("Invalid fileId");
  }
  try {
    const { data } = await API.post<CreateTicketResponse>(
      "/recordings/ticket",
      { fileId },
      { headers: { "Content-Type": "application/json" } }
    );
    if (!data?.ticket || !data?.iframeSrc) {
      throw new Error("Malformed ticket response");
    }
    return data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create preview ticket";
    throw new Error(msg);
  }
};

export const recordingService = {
  createRecording,
  updateRecording,
  deleteRecording,
  expireRecording,
  getRecordingById,
  getRecordingsByClass,
  getRecordingsByClassId,
  createRecordingTicket,
};

export default recordingService;



