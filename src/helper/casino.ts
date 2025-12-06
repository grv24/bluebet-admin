export interface CasinoGame {
  id: string;
  casinoGameCode: string;
  casinoGameName: string;
  casinoGameIcon: string;
  casinoGameTvLink: string | null;
  isActive: boolean;
  gameType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CasinoGamesResponse {
  status: boolean;
  data: CasinoGame[];
}

const CASINO_GAMES_API_URL = "https://api.2xbat.com/api/v1/casino-games";

export const fetchCasinoGames = async (): Promise<CasinoGamesResponse> => {
  try {
    const response = await fetch(CASINO_GAMES_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CasinoGamesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch casino games:", error);
    throw error;
  }
};

export const fetchCasinoGamesByType = async (gameType: string): Promise<CasinoGamesResponse> => {
  try {
    // Handle "other" type (null gameType)
    const typeParam = gameType === "other" ? "null" : gameType;
    const response = await fetch(`${CASINO_GAMES_API_URL}/type/${typeParam}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CasinoGamesResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch casino games by type ${gameType}:`, error);
    throw error;
  }
};

// Fetch odds for a casino game
import { apiRequest } from "@/utils/api";

export const getCasinoGameOdds = async (
  slugName: string | undefined,
  cookie: any
) => {
  return apiRequest(
    `/api/v1/casinos/odds?casinoType=${slugName}`,
    cookie,
    {
      method: "GET",
    }
  );
};

// Fetch top ten results for a casino game
export const getCasinoTopTenResult = async (
  slugName: string | undefined,
  cookie: any
) => {
  return apiRequest(
    `/api/v1/casinos/getCasinoTopTenResult?casinoType=${slugName}`,
    cookie,
    {
      method: "GET",
    }
  );
};

// Fetch user match bets for a specific round
export interface UserMatchBet {
  id: string;
  userName: string;
  nation: string;
  rate: number;
  amount: number;
  placeDate: string;
  gameType: string;
  betType?: string;
  marketName?: string;
}

export interface UserMatchBetsResponse {
  status: boolean;
  data: UserMatchBet[];
  message?: string;
}

export const getCasinoUserMatchBets = async (
  roundId: string | number,
  cookie: any
): Promise<UserMatchBetsResponse> => {
  return apiRequest(
    `/api/v1/casino/user-match-bets/${roundId}`,
    cookie,
    {
      method: "GET",
    }
  );
};

