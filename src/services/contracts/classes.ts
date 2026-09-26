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
