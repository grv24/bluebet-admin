import { useQuery } from "@tanstack/react-query";
import { fetchCasinoGames, CasinoGamesResponse } from "@/helper/casino";

interface UseCasinoGamesOptions {
  staleTime?: number;
  retry?: boolean | number;
  enabled?: boolean;
}

const useCasinoGames = (options?: UseCasinoGamesOptions) => {
  return useQuery<CasinoGamesResponse, Error>({
    queryKey: ["casinoGames"],
    queryFn: fetchCasinoGames,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export default useCasinoGames;


