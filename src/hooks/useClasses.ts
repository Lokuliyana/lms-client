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
