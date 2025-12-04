import { useQuery } from "@tanstack/react-query";
import { fetchCasinoGamesByType, CasinoGamesResponse } from "@/helper/casino";

interface UseCasinoGamesByTypeOptions {
  staleTime?: number;
  retry?: boolean | number;
  enabled?: boolean;
}

const useCasinoGamesByType = (gameType: string | null, options?: UseCasinoGamesByTypeOptions) => {
  return useQuery<CasinoGamesResponse, Error>({
    queryKey: ["casinoGamesByType", gameType],
    queryFn: () => fetchCasinoGamesByType(gameType === null ? "other" : gameType),
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always enabled
    ...options,
  });
};

export default useCasinoGamesByType;

