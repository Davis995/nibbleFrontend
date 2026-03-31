import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthContext';

interface UsageData {
  current_usage: number;
  monthly_limit: number;
  usage_percentage: number;
  reset_days: number;
  reset_date: string;
  plan_name: string;
}

export const useUsage = () => {
  const { tokens } = useAuth();

  return useQuery<UsageData>({
    queryKey: ['usage', 'credits'],
    queryFn: async () => {
      if (!tokens?.access) {
        throw new Error('No access token available');
      }

      const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
      // If baseUrl already includes /api/v1, don't add it again
      const baseUrl = rawBaseUrl.includes('/api/v1') ? rawBaseUrl : `${rawBaseUrl}/api/v1`
      const fetchUrl = `${baseUrl}/tools/usage/credits/`

      const response = await fetch(fetchUrl, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please log in again');
        }
        throw new Error('Failed to fetch usage data');
      }

      return response.json();
    },
    enabled: !!tokens?.access, // Only run query if we have a token
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
    retry: (failureCount: number, error: Error) => {
      // Don't retry on auth errors
      if (error.message.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};