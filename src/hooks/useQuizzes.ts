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
