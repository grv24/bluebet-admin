import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { getCasinoIndividualResult } from "@/helper/casino";
import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
import CasinoModal from "@/components/common/CasinoModal";
import { getCardByCode } from "@/utils/card";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";

interface Instant3OProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const Instant3OComponent: React.FC<Instant3OProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
}) => {
  const [cookies] = useCookies(["clientToken"]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Get game slug from gameCode
  const gameSlug = gameCode?.toLowerCase() || "teen33";
  // Get odds data from sub array
  // Handle both API format (data.sub) and socket format (data.current.sub)
  const getOddsData = (sid: number) => {
    // Try different possible data structures
    const subArray =
      casinoData?.data?.sub ||
      casinoData?.data?.current?.sub ||
      casinoData?.data?.data?.data?.sub ||
      casinoData?.data?.current?.data?.sub ||
      [];
    return (
      subArray.find(
        (item: any) => item.sid === sid || String(item.sid) === String(sid)
      ) || null
    );
  };

  // Check if betting is suspended
  const isSuspended = (oddsData: any): boolean => {
    if (!oddsData) return true;

    const status = oddsData.gstatus;
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    const isTimeSuspended = remainingTime <= 3;

    return isStatusSuspended || isTimeSuspended;
  };

  // Get odds data for Player A and Player B
  const playerA = getOddsData(1);
  const playerB = getOddsData(2);

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Function to parse cards from API response
  const parseCards = (cardsString: string) => {
    if (!cardsString) return [];
    const cards = cardsString.split(",").filter((card) => card && card.trim());
    return cards;
  };

  // Function to get winner information
  const getWinnerInfo = (resultData: any) => {
    if (!resultData) return { winner: null, description: "" };

    const win = resultData.win;
    const winnat = resultData.winnat;
    const desc = resultData.desc || resultData.newdesc || "";

    let winner = null;
    // Use winnat as primary source, fallback to win field
    if (winnat === "Player A" || win === "1") winner = "Player A";
    else if (winnat === "Player B" || win === "2") winner = "Player B";

    return { winner, description: desc };
  };

  // Handle clicking on individual result to show details
  const handleResultClick = (result: any) => {
    if (!result?.mid) return;
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  // Close the result details modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  // React Query for individual result details
  const {
    data: resultDetails,
    isLoading: isLoadingResult,
    error: resultError,
  } = useQuery<any>({
    queryKey: ["casinoIndividualResult", selectedResult?.mid, gameSlug],
    queryFn: () =>
      getCasinoIndividualResult(selectedResult?.mid, cookies, gameSlug),
    enabled: !!selectedResult?.mid && isModalOpen,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });

  // Parse cards and winner info from result details
  const resultData = resultDetails?.data?.matchData;
  const cards = parseCards(resultData?.cards || "");
  // For TEEN_33: cards are distributed as Player A (1st, 3rd, 5th) and Player B (2nd, 4th, 6th)
  const playerACards = [cards[0], cards[2], cards[4]].filter((card) => card);
  const playerBCards = [cards[1], cards[3], cards[5]].filter((card) => card);
  const { winner, description } = getWinnerInfo(resultData);

  return (
    <div>
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
        {/* Player A Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border w-[59%] border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
                <div className="flex flex-col">
                  <span>Player A</span>
                </div>
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-back)]">
                BACK
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-lay)]">
                LAY
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                Main
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(playerA) && onBetClick("1", "back")
                }
              >
                {isSuspended(playerA) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerA?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() =>
                  !isSuspended(playerA) && onBetClick("1", "lay")
                }
              >
                {isSuspended(playerA) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerA?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Player B Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border w-[59%] border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
                <div className="flex flex-col">
                  <span>Player B</span>
                </div>
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-back)]">
                BACK
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-[var(--bg-lay)]">
                LAY
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                Main
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(playerB) && onBetClick("2", "back")
                }
              >
                {isSuspended(playerB) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerB?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() =>
                  !isSuspended(playerB) && onBetClick("2", "lay")
                }
              >
                {isSuspended(playerB) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerB?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=${gameSlug}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:underline"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any) => {
              // Handle win field: "1" = Player A, "2" = Player B
              const isPlayerA = item.win === "1" || item.win === "A";
              return (
                <div
                  key={item.mid || `result-${item.win}-${Math.random()}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${
                    isPlayerA ? "text-red-500" : "text-yellow-500"
                  } cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title={`Round ID: ${item.mid || "N/A"} - Click to view details`}
                >
                  {isPlayerA ? "A" : "B"}
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-sm py-2">No results available</div>
          )}
        </div>
      </div>

      {/* Result Details Modal */}
      <CasinoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Instant 3O Teenpatti Result"
        size="xl"
        resultDetails={true}
      >
        <div className="flex flex-col px-2">
          {/* Header Information */}
          <div className="flex justify-between items-center">
            <h2 className="text-xs md:text-sm font-semibold leading-8 text-black">
              Round Id:{" "}
              <span className="text-black font-normal pl-1">
                {resultDetails?.data?.matchData?.mid || selectedResult?.mid}
              </span>
            </h2>
            <h2 className="text-xs md:text-sm font-semibold leading-8 text-black capitalize">
              Match Time:{" "}
              <span className="text-black font-normal pl-1">
                {resultDetails?.data?.matchData?.matchTime
                  ? new Date(
                      resultDetails.data.matchData.matchTime
                    ).toLocaleString()
                  : resultDetails?.data?.matchData?.mtime || "N/A"}
              </span>
            </h2>
          </div>

          {/* Content Display - Only show when not loading and no error */}
          {!isLoadingResult && !resultError && resultData && (
            <>
              <div className="flex flex-col gap-1 justify-center items-center py-2">
                <div className="flex md:flex-row flex-col w-full py-4 md:max-w-lg mx-auto justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-normal text-center leading-8 text-black">
                      Player A
                    </h2>
                    <div className="flex gap-2 items-center">
                      {winner === "Player A" && (
                        <i className="fa-solid fa-trophy text-green-600"></i>
                      )}
                      {playerACards.length > 0 ? (
                        playerACards.map((card: string, index: number) => (
                          <img
                            key={index}
                            src={getCardByCode(card, gameCode || "teen33", "individual")}
                            alt={`Player A card ${index + 1}`}
                            className="w-8"
                          />
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No cards</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 justify-center items-center">
                    <h2 className="text-base font-normal leading-8 text-black">
                      Player B
                    </h2>
                    <div className="flex gap-2 items-center">
                      {playerBCards.length > 0 ? (
                        playerBCards.map((card: string, index: number) => (
                          <img
                            key={index + 3}
                            src={getCardByCode(card, gameCode || "teen33", "individual")}
                            alt={`Player B card ${index + 1}`}
                            className="w-8"
                          />
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No cards</span>
                      )}
                      {winner === "Player B" && (
                        <i className="fa-solid fa-trophy text-green-600"></i>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Winner Information */}
              <div
                className="max-w-lg my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
                style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
              >
                <div className="flex flex-col gap-0 justify-center items-center py-2">
                  <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                    Winner:{" "}
                    <span className="text-black font-normal pl-1">
                      {winner || "N/A"}
                    </span>
                  </h2>
                 
                </div>
              </div>
            </>
          )}

          {/* Loading State */}
          {isLoadingResult && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--bg-primary)]"></div>
            </div>
          )}

          {/* Error State */}
          {resultError && (
            <div className="flex justify-center items-center py-8">
              <p className="text-red-500 text-sm">
                Error loading result details. Please try again.
              </p>
            </div>
          )}
        </div>
      </CasinoModal>
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Instant3O = memoizeCasinoComponent(Instant3OComponent);
Instant3O.displayName = "Instant3O";

export default Instant3O;
