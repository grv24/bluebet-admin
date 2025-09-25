import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { apiRequest } from "@/utils/api";
import { CricketTreeResponse } from "@/types/cricket";

interface UseCricketTreeOptions {
  staleTime?: number;
  retry?: boolean | number;
  enabled?: boolean;
}

const fetchCricketTree = async (cookies: any): Promise<CricketTreeResponse> => {
  return apiRequest<CricketTreeResponse>("/api/v1/admin/sports/tree", cookies);
};

const useCricketTree = (options?: UseCricketTreeOptions) => {
  const [cookies] = useCookies();

  return useQuery<CricketTreeResponse, Error>({
    queryKey: ["cricketTree"],
    queryFn: () => fetchCricketTree(cookies),
    retry: 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export default useCricketTree;
