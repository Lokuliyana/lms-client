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
