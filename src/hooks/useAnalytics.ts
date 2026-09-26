import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '../services/mocks/MockAnalyticsRepository';

export function useAnalytics() {
  const { data: analytics = [] } = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics });
  return { analytics };
}
