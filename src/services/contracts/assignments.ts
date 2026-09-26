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
