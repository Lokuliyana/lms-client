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
