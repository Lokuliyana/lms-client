"use client";
import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MeetingsPage() {
  const { meetings, updateStatus, simulateWebhook } = useAttendance();

  const handleWebhook = (meetingId: string) => {
    simulateWebhook({
      meetingId,
      payload: [
        { studentId: 'student-1', minutes: 45 },
        { studentId: 'student-2', minutes: 5 }
      ]
    });
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Live Meetings & Attendance</h1>
      <div className="space-y-6">
        {meetings.map(meet => (
          <Card key={meet.id} className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold">Meeting {meet.id} ({meet.status})</h3>
                  <p className="text-sm text-slate-500">Class: {meet.classId} | Batch: {meet.batchId}</p>
                </div>
                <Button onClick={() => handleWebhook(meet.id)}>Trigger Zoom Webhook</Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {meet.records.map(rec => (
                  <div key={rec.studentId} className="p-4 border rounded bg-white flex items-center justify-between">
                    <div>
                      <div className="font-medium">{rec.studentId}</div>
                      <div className="text-xs text-slate-500">{rec.minutesAttended} mins</div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={rec.status === 'PRESENT' ? 'default' : rec.status === 'LATE' ? 'outline' : 'destructive'}>
                        {rec.status}
                      </Badge>
                      <div className="flex gap-1">
                        <button className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded" onClick={() => updateStatus({ meetingId: meet.id, studentId: rec.studentId, status: 'PRESENT' })}>P</button>
                        <button className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded" onClick={() => updateStatus({ meetingId: meet.id, studentId: rec.studentId, status: 'LATE' })}>L</button>
                        <button className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded" onClick={() => updateStatus({ meetingId: meet.id, studentId: rec.studentId, status: 'ABSENT' })}>A</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
