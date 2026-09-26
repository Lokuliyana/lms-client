const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath, content) {
  const fullPath = path.join(__dirname, filePath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8');
}

// ----------------------------------------------------
// PHASE 2: Editable Image
// ----------------------------------------------------
writeFile('src/components/cms/EditableImage.tsx', `
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useEditMode } from '@/contexts/EditModeContext';

interface EditableImageProps {
  contentKey: string;
  defaultSrc: string;
  alt?: string;
  aspectRatio?: number;
  className?: string;
}

export function EditableImage({ contentKey, defaultSrc, alt = '', aspectRatio = 16 / 9, className }: EditableImageProps) {
  const { isEditMode, saveContent } = useEditMode();
  const [src, setSrc] = useState(defaultSrc);
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const showCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      // In a real app, do canvas cropping here
      // For mock purposes, just take the raw image base64
      setSrc(imageSrc);
      saveContent(contentKey, imageSrc);
      setIsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isEditMode) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <>
      <div 
        className={\`relative group cursor-pointer border-2 border-dashed border-transparent hover:border-blue-400 \${className}\`}
        onClick={() => setIsOpen(true)}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
          Click to Edit Image
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          {!imageSrc ? (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg">
              <input type="file" accept="image/*" onChange={handleFileChange} className="p-4" />
            </div>
          ) : (
            <div className="relative h-64 w-full">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            {imageSrc && <Button onClick={showCroppedImage}>Save Crop</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
`);

// ----------------------------------------------------
// PHASE 3: Class & Batch Management Module
// ----------------------------------------------------
writeFile('src/services/contracts/classes.ts', `
export interface Batch {
  id: string;
  name: string;
  schedule: string;
  capacity: number;
  enrolled: number;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  price: number;
  batches: Batch[];
}

export interface ClassApplication {
  id: string;
  classId: string;
  batchId: string;
  studentId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface IClassRepository {
  getClasses(): Promise<Class[]>;
  getClass(id: string): Promise<Class | null>;
  createClass(data: Omit<Class, 'id'>): Promise<Class>;
  updateClass(id: string, data: Partial<Class>): Promise<Class>;
  applyForClass(classId: string, batchId: string, studentId: string): Promise<ClassApplication>;
  getApplications(): Promise<ClassApplication[]>;
  approveApplication(applicationId: string): Promise<void>;
}
`);

writeFile('src/services/mocks/MockClassRepository.ts', `
import { Batch, Class, ClassApplication, IClassRepository } from '../contracts/classes';

let mockClasses: Class[] = [
  {
    id: 'class-101',
    name: 'Advanced Mathematics',
    description: 'Calculus and Linear Algebra',
    price: 150,
    batches: [
      { id: 'batch-1', name: 'Sunday Morning Theory', schedule: 'Sun 09:00 AM', capacity: 50, enrolled: 20 },
      { id: 'batch-2', name: 'Thursday Evening Revision', schedule: 'Thu 06:00 PM', capacity: 30, enrolled: 15 }
    ]
  }
];

let mockApplications: ClassApplication[] = [
  { id: 'app-1', classId: 'class-101', batchId: 'batch-1', studentId: 'student-1', status: 'PENDING' }
];

export class MockClassRepository implements IClassRepository {
  async getClasses(): Promise<Class[]> {
    return [...mockClasses];
  }
  async getClass(id: string): Promise<Class | null> {
    return mockClasses.find(c => c.id === id) || null;
  }
  async createClass(data: Omit<Class, 'id'>): Promise<Class> {
    const newClass = { ...data, id: 'class-' + Date.now() };
    mockClasses.push(newClass as Class);
    return newClass as Class;
  }
  async updateClass(id: string, data: Partial<Class>): Promise<Class> {
    const index = mockClasses.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Not found');
    mockClasses[index] = { ...mockClasses[index], ...data };
    return mockClasses[index];
  }
  async applyForClass(classId: string, batchId: string, studentId: string): Promise<ClassApplication> {
    const app = { id: 'app-' + Date.now(), classId, batchId, studentId, status: 'PENDING' as const };
    mockApplications.push(app);
    return app;
  }
  async getApplications(): Promise<ClassApplication[]> {
    return [...mockApplications];
  }
  async approveApplication(applicationId: string): Promise<void> {
    const app = mockApplications.find(a => a.id === applicationId);
    if (app) {
      app.status = 'APPROVED';
      const cls = mockClasses.find(c => c.id === app.classId);
      if (cls) {
        const batch = cls.batches.find(b => b.id === app.batchId);
        if (batch) batch.enrolled++;
      }
    }
  }
}
`);

writeFile('src/hooks/useClasses.ts', `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MockClassRepository } from '../services/mocks/MockClassRepository';

const repo = new MockClassRepository();

export function useClasses() {
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => repo.getClasses()
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => repo.getApplications()
  });

  const createClassMutation = useMutation({
    mutationFn: (data: any) => repo.createClass(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] })
  });

  const applyMutation = useMutation({
    mutationFn: ({ classId, batchId, studentId }: any) => repo.applyForClass(classId, batchId, studentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] })
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => repo.approveApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    }
  });

  return { classes, isLoading, createClass: createClassMutation.mutateAsync, applications, apply: applyMutation.mutateAsync, approve: approveMutation.mutateAsync };
}
`);

writeFile('src/app/classes/page.tsx', `
"use client";
import { useClasses } from '@/hooks/useClasses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

export default function ClassesPage() {
  const { classes, isLoading, applications, approve } = useClasses();
  const { hasPermission } = usePermissions();

  if (isLoading) return <div className="p-8">Loading classes...</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Class Catalog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <Card key={cls.id} className="bg-[#F8FAFC] shadow-soft">
            <CardHeader>
              <CardTitle>{cls.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">{cls.description}</p>
              <p className="font-semibold">Price: $\${cls.price}</p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Batches:</h4>
                {cls.batches.map(b => (
                  <div key={b.id} className="text-sm bg-white p-2 rounded border border-slate-200">
                    <div className="flex justify-between">
                      <span>{b.name}</span>
                      <Badge variant="outline">{b.enrolled}/{b.capacity}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{b.schedule}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasPermission('classes.update') && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Pending Applications (Moderator View)</h2>
          <div className="space-y-4">
            {applications.filter(a => a.status === 'PENDING').map(app => (
              <Card key={app.id} className="p-4 flex items-center justify-between shadow-soft">
                <div>
                  <span className="font-semibold">Student: {app.studentId}</span>
                  <span className="mx-2">|</span>
                  <span className="text-slate-600">Class: {app.classId}</span>
                </div>
                <Button onClick={() => approve(app.id)}>Approve</Button>
              </Card>
            ))}
            {applications.filter(a => a.status === 'PENDING').length === 0 && (
              <p className="text-slate-500">No pending applications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
`);

// ----------------------------------------------------
// PHASE 4: Meetings & Attendance
// ----------------------------------------------------
writeFile('src/services/contracts/attendance.ts', `
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
`);

writeFile('src/services/mocks/MockAttendanceRepository.ts', `
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
`);

writeFile('src/hooks/useAttendance.ts', `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MockAttendanceRepository } from '../services/mocks/MockAttendanceRepository';

const repo = new MockAttendanceRepository();

export function useAttendance() {
  const queryClient = useQueryClient();

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => repo.getMeetings()
  });

  const updateStatus = useMutation({
    mutationFn: ({ meetingId, studentId, status }: any) => repo.updateRecordStatus(meetingId, studentId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] })
  });

  const simulateWebhook = useMutation({
    mutationFn: ({ meetingId, payload }: any) => repo.simulateWebhook(meetingId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] })
  });

  return { meetings, updateStatus: updateStatus.mutateAsync, simulateWebhook: simulateWebhook.mutateAsync };
}
`);

writeFile('src/app/meetings/page.tsx', `
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
`);

// ----------------------------------------------------
// PHASE 5: Assignments
// ----------------------------------------------------
writeFile('src/services/contracts/assignments.ts', `
export interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
}
export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  rubric: RubricCriterion[];
}
export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: 'SUBMITTED' | 'EVALUATED' | 'LATE';
  submittedAt: string;
  fileUrl: string;
  scores?: Record<string, number>;
  feedback?: string;
  totalScore?: number;
}
export interface IAssignmentRepository {
  getAssignments(): Promise<Assignment[]>;
  getSubmissions(): Promise<AssignmentSubmission[]>;
  submitAssignment(data: any): Promise<void>;
  evaluateSubmission(submissionId: string, scores: Record<string, number>, feedback: string): Promise<void>;
}
`);

writeFile('src/services/mocks/MockAssignmentRepository.ts', `
import { Assignment, AssignmentSubmission, IAssignmentRepository } from '../contracts/assignments';

let mockAssignments: Assignment[] = [
  {
    id: 'asg-1',
    title: 'Algebra Worksheet 1',
    dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    rubric: [
      { id: 'content', name: 'Content', maxScore: 50 },
      { id: 'working', name: 'Working', maxScore: 30 },
      { id: 'clarity', name: 'Clarity', maxScore: 20 }
    ]
  }
];

let mockSubmissions: AssignmentSubmission[] = [];

export class MockAssignmentRepository implements IAssignmentRepository {
  async getAssignments() { return [...mockAssignments]; }
  async getSubmissions() { return [...mockSubmissions]; }
  async submitAssignment(data: any) {
    const asg = mockAssignments.find(a => a.id === data.assignmentId);
    if (!asg) return;
    const isLate = new Date() > new Date(asg.dueDate);
    mockSubmissions.push({
      id: 'sub-' + Date.now(),
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      status: isLate ? 'LATE' : 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      fileUrl: data.fileUrl
    });
  }
  async evaluateSubmission(submissionId: string, scores: Record<string, number>, feedback: string) {
    const sub = mockSubmissions.find(s => s.id === submissionId);
    if (sub) {
      sub.scores = scores;
      sub.feedback = feedback;
      sub.totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
      sub.status = 'EVALUATED';
    }
  }
}
`);

writeFile('src/hooks/useAssignments.ts', `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MockAssignmentRepository } from '../services/mocks/MockAssignmentRepository';

const repo = new MockAssignmentRepository();

export function useAssignments() {
  const qc = useQueryClient();
  const { data: assignments = [] } = useQuery({ queryKey: ['assignments'], queryFn: () => repo.getAssignments() });
  const { data: submissions = [] } = useQuery({ queryKey: ['submissions'], queryFn: () => repo.getSubmissions() });
  
  const submit = useMutation({
    mutationFn: (data: any) => repo.submitAssignment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] })
  });

  const evaluate = useMutation({
    mutationFn: ({ id, scores, feedback }: any) => repo.evaluateSubmission(id, scores, feedback),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] })
  });

  return { assignments, submissions, submit: submit.mutateAsync, evaluate: evaluate.mutateAsync };
}
`);

writeFile('src/app/assignments/page.tsx', `
"use client";
import { useAssignments } from '@/hooks/useAssignments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function AssignmentsPage() {
  const { assignments, submissions, submit, evaluate } = useAssignments();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  const handleEvaluate = (subId: string) => {
    evaluate({ id: subId, scores, feedback });
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Assignments</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Student Portal</h2>
          {assignments.map(asg => (
            <Card key={asg.id} className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-bold">{asg.title}</h3>
                <p className="text-sm text-slate-500 mb-4">Due: {new Date(asg.dueDate).toLocaleString()}</p>
                <Button onClick={() => submit({ assignmentId: asg.id, studentId: 'me', fileUrl: 'http://example.com/file.pdf' })}>
                  Submit Homework (Simulate Late)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Evaluator Workspace</h2>
          {submissions.map(sub => (
            <Card key={sub.id} className="mb-4 bg-white shadow-soft">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold">Student: {sub.studentId}</span>
                  <Badge variant={sub.status === 'LATE' ? 'destructive' : 'default'}>{sub.status}</Badge>
                </div>
                {sub.status !== 'EVALUATED' ? (
                  <div className="space-y-4">
                    <p className="text-sm">Rubric Scoring:</p>
                    <div className="flex gap-4">
                      <input type="number" placeholder="Content /50" className="border p-1 w-24" onChange={e => setScores({ ...scores, content: Number(e.target.value) })} />
                      <input type="number" placeholder="Working /30" className="border p-1 w-24" onChange={e => setScores({ ...scores, working: Number(e.target.value) })} />
                      <input type="number" placeholder="Clarity /20" className="border p-1 w-24" onChange={e => setScores({ ...scores, clarity: Number(e.target.value) })} />
                    </div>
                    <textarea placeholder="Feedback" className="border p-2 w-full" onChange={e => setFeedback(e.target.value)}></textarea>
                    <Button onClick={() => handleEvaluate(sub.id)}>Publish Grade</Button>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-green-600">Score: {sub.totalScore}</p>
                    <p className="text-sm text-slate-600 mt-2">Feedback: {sub.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

// ----------------------------------------------------
// PHASE 6: Quiz Engine & 1v1 Arena
// ----------------------------------------------------
writeFile('src/services/contracts/quizzes.ts', `
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}
export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}
export interface ChallengeMatch {
  id: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  p1Score: number;
  p2Score: number;
}
export interface UserQuizStats {
  userId: string;
  elo: number;
}
export interface IQuizRepository {
  getQuiz(id: string): Promise<Quiz>;
  submitQuiz(quizId: string, score: number): Promise<void>;
  createChallenge(p1Id: string, p2Id: string, p1Score: number, p2Score: number): Promise<ChallengeMatch>;
  getStats(): Promise<UserQuizStats[]>;
}
`);

writeFile('src/services/mocks/MockQuizRepository.ts', `
import { IQuizRepository, Quiz, ChallengeMatch, UserQuizStats } from '../contracts/quizzes';

let mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Calculus Speed Run',
  questions: [
    { id: 'q1', text: 'd/dx (x^2) = ?', options: ['x', '2x', 'x^2', '2'], correctIndex: 1 }
  ]
};

let stats: UserQuizStats[] = [
  { userId: 'student-A', elo: 1200 },
  { userId: 'student-B', elo: 1200 }
];

let challenges: ChallengeMatch[] = [];

export class MockQuizRepository implements IQuizRepository {
  async getQuiz(id: string) { return mockQuiz; }
  async submitQuiz() {}
  async createChallenge(p1Id: string, p2Id: string, p1Score: number, p2Score: number) {
    const match: ChallengeMatch = {
      id: 'match-' + Date.now(), player1Id: p1Id, player2Id: p2Id, 
      p1Score, p2Score, winnerId: p1Score > p2Score ? p1Id : p2Id
    };
    challenges.push(match);

    // ELO update logic
    const s1 = stats.find(s => s.userId === p1Id);
    const s2 = stats.find(s => s.userId === p2Id);
    if (s1 && s2) {
      const K = 32;
      const r1 = Math.pow(10, s1.elo / 400);
      const r2 = Math.pow(10, s2.elo / 400);
      const e1 = r1 / (r1 + r2);
      const e2 = r2 / (r1 + r2);
      const s1Actual = match.winnerId === p1Id ? 1 : 0;
      const s2Actual = match.winnerId === p2Id ? 1 : 0;
      s1.elo = Math.round(s1.elo + K * (s1Actual - e1));
      s2.elo = Math.round(s2.elo + K * (s2Actual - e2));
    }

    return match;
  }
  async getStats() { return [...stats]; }
}
`);

writeFile('src/hooks/useQuizzes.ts', `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MockQuizRepository } from '../services/mocks/MockQuizRepository';

const repo = new MockQuizRepository();

export function useQuizzes() {
  const qc = useQueryClient();
  const { data: stats = [] } = useQuery({ queryKey: ['quiz-stats'], queryFn: () => repo.getStats() });
  const { data: quiz } = useQuery({ queryKey: ['quiz'], queryFn: () => repo.getQuiz('quiz-1') });

  const challenge = useMutation({
    mutationFn: ({ p1, p2, s1, s2 }: any) => repo.createChallenge(p1, p2, s1, s2),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz-stats'] })
  });

  return { quiz, stats, challenge: challenge.mutateAsync };
}
`);

writeFile('src/app/quizzes/page.tsx', `
"use client";
import { useQuizzes } from '@/hooks/useQuizzes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function QuizzesPage() {
  const { quiz, stats, challenge } = useQuizzes();
  const [fiftyFifty, setFiftyFifty] = useState(false);

  const simulateMatch = () => {
    challenge({ p1: 'student-A', p2: 'student-B', s1: 10, s2: 5 });
  };

  if (!quiz) return null;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Quiz Engine & 1v1 Arena</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Single Player: {quiz.title}</h2>
            <div className="mb-4">
              <p className="font-medium mb-2">{quiz.questions[0].text}</p>
              <div className="space-y-2">
                {quiz.questions[0].options.map((opt, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className={\`w-full justify-start \${fiftyFifty && i !== 1 && i !== 2 ? 'opacity-0' : ''}\`}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={() => setFiftyFifty(true)} variant="secondary">Powerup: 50/50</Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">1v1 Arena ELO Rankings</h2>
            <div className="space-y-2 mb-6">
              {stats.map(s => (
                <div key={s.userId} className="flex justify-between items-center p-3 border rounded bg-slate-50">
                  <span className="font-semibold">{s.userId}</span>
                  <span className="text-blue-600 font-bold">ELO {s.elo}</span>
                </div>
              ))}
            </div>
            <Button onClick={simulateMatch} className="w-full">Simulate Match (A wins vs B)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`);

// ----------------------------------------------------
// PHASE 7: Analytics
// ----------------------------------------------------
writeFile('src/services/mocks/MockAnalyticsRepository.ts', `
export const getAnalytics = async () => {
  return [
    { studentId: 'student-A', attendance: 85, homework: 90, atRisk: false },
    { studentId: 'student-B', attendance: 50, homework: 40, atRisk: true } // Below 60%
  ];
};
`);

writeFile('src/hooks/useAnalytics.ts', `
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '../services/mocks/MockAnalyticsRepository';

export function useAnalytics() {
  const { data: analytics = [] } = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics });
  return { analytics };
}
`);

writeFile('src/app/analytics/page.tsx', `
"use client";
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  const { analytics } = useAnalytics();

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Performance Analytics</h1>
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Early Intervention Table</h2>
          <div className="space-y-4">
            {analytics.map(a => (
              <div key={a.studentId} className="flex justify-between items-center p-4 border rounded bg-white">
                <div>
                  <div className="font-bold">{a.studentId}</div>
                  <div className="text-sm text-slate-500">Attendance: {a.attendance}% | Homework: {a.homework}%</div>
                </div>
                {a.atRisk && <Badge variant="destructive" className="animate-pulse">At-Risk Warning</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`);

// ----------------------------------------------------
// PHASE 8: Exporter & Config
// ----------------------------------------------------
writeFile('src/app/api/admin/export/route.ts', `
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'src/lib/content-v2.json');
  const file = fs.readFileSync(filePath, 'utf-8');
  return new NextResponse(file, {
    headers: {
      'Content-Disposition': 'attachment; filename="content-config.json"',
      'Content-Type': 'application/json'
    }
  });
}
`);

console.log('Successfully scaffolded Phase 2 to 8 files.');
