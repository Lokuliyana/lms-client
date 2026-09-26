export interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  minutesAttended: number;
}
export interface ClassMeeting {
  id: string;
  classId: string;
  batchId: string;
  startTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  records: AttendanceRecord[];
}
export interface IAttendanceRepository {
  getMeetings(): Promise<ClassMeeting[]>;
  updateRecordStatus(meetingId: string, studentId: string, status: 'PRESENT'|'ABSENT'|'LATE'): Promise<void>;
  simulateWebhook(meetingId: string, payload: { studentId: string, minutes: number }[]): Promise<void>;
}
