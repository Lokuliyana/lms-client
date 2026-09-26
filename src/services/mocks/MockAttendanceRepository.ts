import { ClassMeeting, IAttendanceRepository } from '../contracts/attendance';

let mockMeetings: ClassMeeting[] = [
  {
    id: 'meet-1',
    classId: 'class-101',
    batchId: 'batch-1',
    startTime: new Date().toISOString(),
    status: 'LIVE',
    records: [
      { studentId: 'student-1', status: 'ABSENT', minutesAttended: 0 },
      { studentId: 'student-2', status: 'LATE', minutesAttended: 10 },
    ]
  }
];

export class MockAttendanceRepository implements IAttendanceRepository {
  async getMeetings(): Promise<ClassMeeting[]> { return [...mockMeetings]; }
  async updateRecordStatus(meetingId: string, studentId: string, status: 'PRESENT'|'ABSENT'|'LATE'): Promise<void> {
    const meet = mockMeetings.find(m => m.id === meetingId);
    if (!meet) return;
    const rec = meet.records.find(r => r.studentId === studentId);
    if (rec) rec.status = status;
  }
  async simulateWebhook(meetingId: string, payload: { studentId: string, minutes: number }[]): Promise<void> {
    const meet = mockMeetings.find(m => m.id === meetingId);
    if (!meet) return;
    for (const p of payload) {
      const rec = meet.records.find(r => r.studentId === p.studentId);
      if (rec) {
        rec.minutesAttended = p.minutes;
        if (p.minutes > 30) rec.status = 'PRESENT';
        else if (p.minutes > 10) rec.status = 'LATE';
        else rec.status = 'ABSENT';
      }
    }
  }
}
