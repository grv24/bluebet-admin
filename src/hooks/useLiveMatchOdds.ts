import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { apiRequest } from "@/utils/api";

interface LiveMatchOddsResponse {
  success: boolean;
  message: string;
  data: any; // You can define specific types based on the API response structure
}

interface UseLiveMatchOddsOptions {
  sportId: string;
  eventId: string;
  staleTime?: number;
  retry?: boolean | number;
  enabled?: boolean;
}

const fetchLiveMatchOdds = async (
  sportId: string, 
  eventId: string, 
  cookies: any
): Promise<LiveMatchOddsResponse> => {
  return apiRequest<LiveMatchOddsResponse>(
    `/api/v1/sports/live-match-odds/${sportId}/${eventId}`, 
    cookies
  );
};

const useLiveMatchOdds = (options: UseLiveMatchOddsOptions) => {
  const [cookies] = useCookies();

  return useQuery<LiveMatchOddsResponse, Error>({
    queryKey: ["liveMatchOdds", options.sportId, options.eventId],
    queryFn: () => fetchLiveMatchOdds(options.sportId, options.eventId, cookies),
    retry: 3,
    staleTime: 30 * 1000, // 30 seconds for live data
    enabled: !!(options.sportId && options.eventId),
    ...options,
  });
};

export default useLiveMatchOdds;
