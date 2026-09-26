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
