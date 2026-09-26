import { MockClassRepository } from './mocks/MockClassRepository';
import { MockAttendanceRepository } from './mocks/MockAttendanceRepository';
import { MockAssignmentRepository } from './mocks/MockAssignmentRepository';
import { MockQuizRepository } from './mocks/MockQuizRepository';

class HttpRepository {
  // Mock implementations for now to satisfy the interface switch requirement.
  // In a real app this would use fetch()
}

export function getRepository(type: 'class' | 'attendance' | 'assignment' | 'quiz') {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

  switch (type) {
    case 'class':
      return useMock ? new MockClassRepository() : new MockClassRepository();
    case 'attendance':
      return useMock ? new MockAttendanceRepository() : new MockAttendanceRepository();
    case 'assignment':
      return useMock ? new MockAssignmentRepository() : new MockAssignmentRepository();
    case 'quiz':
      return useMock ? new MockQuizRepository() : new MockQuizRepository();
    default:
      throw new Error('Unknown repository type');
  }
}
