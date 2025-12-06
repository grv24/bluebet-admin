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
export interface BetData {
  mid: number;
  sid: number;
  loss: number;
  name: string;
  stake: number;
  oddsId: number;
  profit: number;
  betName: string;
  betRate: number;
  betType: string;
  cardNat?: string;
  oddType: string;
  boxColor?: string;
  gameDate: string;
  gameName: string;
  gameSlug: string;
  gameType: string;
  matchOdd: number;
  maxStake: number;
  minStake: number;
  placedAt: string;
  otherInfo?: any;
  sportType: string;
  betOutcome?: string;
  isFancyBet: boolean;
  oddSubType?: string;
  stakeLimit: number;
  oddCategory: string;
  fancyMultiplier?: number;
  matchOddVariant?: string;
}

export interface UserMatchBet {
  betId: string;
  matchId: string;
  userId: string;
  userName: string;
  loginId: string;
  userType: string;
  betStatus: string;
  betAmount: number;
  betProfit: number;
  betLoss: number;
  commission: number;
  partnership: number;
  exposure: number;
  createdAt: string;
  updatedAt: string;
  gameSlug: string;
  gameName: string;
  gameDate: string;
  sid: number;
  name: string;
  betRate: number;
  matchOdd: number;
  oddType: string;
  oddCategory: string;
  sportType: string;
  isFancyBet: boolean;
  betData: BetData;
}

export interface TargetUser {
  userId: string;
  userName: string;
  loginId: string;
}

export interface UserMatchBetsResponse {
  success: boolean;
  matchId: string;
  targetUserIds: string[];
  targetUsers: TargetUser[];
  userType: string;
  totalBets: number;
  bets: UserMatchBet[];
  isAdminAccess: boolean;
  requestedBy: string;
  requestedByType: string;
  downlineUserCount: number;
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

