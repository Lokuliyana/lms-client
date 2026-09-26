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
