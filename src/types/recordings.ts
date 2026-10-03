export interface RecordedClassProps {
  title: string;
  video_url: string;
  uploaded_at: Date;
}

export interface RecordingItem {
  _id: string;
  class_id: string;
  title: string;
  driveFileId: string;
  provider: 'drive' | 'youtube' | 'b2';
  session_date: string;
  month_key: string;
  is_expired: boolean;
}

export interface PreviewTicketResponse {
  ticket: string;
  iframeSrc: string;
}

