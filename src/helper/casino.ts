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

