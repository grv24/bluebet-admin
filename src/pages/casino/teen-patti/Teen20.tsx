import { cardType } from "../../../utils/card";
import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const Teen20Component = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug,
  gameCode,
  gameName,
  currentBet,
}: {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: string) => void;
  results: any[];
  gameSlug?: string;
  gameCode?: string;
  gameName: string;
  currentBet: any;
}) => {
  const [cookies] = useCookies(["clientToken"]);
  const navigate = useNavigate();
  
  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Convert gameCode to gameSlug if gameSlug is not provided (for display)
  // gameCode format: "TEEN_20" -> gameSlug format: "teen20"
  const actualGameSlug = React.useMemo(() => {
    if (gameSlug) return gameSlug;
    if (gameCode) {
      // Convert "TEEN_20" to "teen20"
      return gameCode.toLowerCase().replace(/_/g, "");
    }
    return "teen20"; // Default fallback
  }, [gameSlug, gameCode]);

  // Keep original gameCode for API calls (e.g., "TEEN_20")
  const apiGameType = React.useMemo(() => {
    if (gameCode) {
      return gameCode; // Use original gameCode for API
    }
    return "TEEN_20"; // Default fallback
  }, [gameCode]);

  // Check if this is teen20c format (has 'sub' array) or teen20 format (has 't2' array)
  // Handle both new API format (data.sub) and legacy format (data.data.data.sub)
  const isTeen20C = casinoData?.data?.sub || casinoData?.data?.data?.data?.sub;
  const dataSource = isTeen20C
    ? (casinoData?.data?.sub || casinoData?.data?.data?.data?.sub)
    : casinoData?.data?.data?.data?.t2;

  // Function to filter user bets based on selected filter
  const getFilteredBets = (bets: any[], filter: string) => {
    if (filter === "all") return bets;

    return bets.filter((bet: any) => {
      const oddCategory = bet.betData?.oddCategory?.toLowerCase();
      const status = bet.status?.toLowerCase();

      switch (filter) {
        case "back":
          return oddCategory === "back";
        case "lay":
          return oddCategory === "lay";
        case "deleted":
          return status === "deleted" || status === "cancelled";
        default:
          return true;
      }
    });
  };

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    // Extract matchId from result item
    const matchId = result?.mid || result?.result?.mid || result?.roundId || result?.id || null;
    
    if (matchId) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
  };

  // Custom bet handling for teen20/teen20c
  const handleBetClick = (sid: string, type: string) => {
    if (!dataSource) return;

    const market = dataSource.find(
      (m: any) => m.sid === sid || m.sid === parseInt(sid)
    );
    if (!market) return;

    // Check if suspended - gstatus "1" = unlocked, "0" = locked
    const status = market.gstatus as string | number | undefined;
    const isSuspended =
      status === "SUSPENDED" ||
      status === 0 ||
      status === "0" ||
      remainingTime <= 3;

    if (isSuspended) return;

    // Call the parent onBetClick with the correct data
    onBetClick(sid, type);
  };

  // odds helpers
  const getMarket = (nation: string) => {
    if (!dataSource) return null;
    return (
      dataSource.find((m: any) => m.nation === nation || m.nat === nation) ||
      null
    );
  };

  const getRate = (nation: string) => {
    const market = getMarket(nation);
    if (!market) return 0;

    // Handle different rate field names
    if (isTeen20C) {
      return market.b || 0;
    } else {
      return market.rate ? parseFloat(market.rate) : 0;
    }
  };

  const isSuspended = (nation: string) => {
    const market = getMarket(nation);
    if (!market) return true;

    // Get game state from casinoData (ft: finished flag, lt: lock time)
    const ft = casinoData?.data?.ft || casinoData?.data?.data?.data?.ft;
    const lt = casinoData?.data?.lt || casinoData?.data?.data?.data?.lt;
    
    // If game is finished (ft === 1), suspend betting
    if (ft === 1 || ft === "1") {
      return true;
    }
    
    // If lock time is 0 and there's no remaining time, suspend
    if ((lt === 0 || lt === "0") && remainingTime <= 0) {
      return true;
    }

    // If there's remaining time > 3, allow betting regardless of gstatus
    // (this handles cases where API returns SUSPENDED but game is actually active)
    if (remainingTime > 3) {
      return false;
    }

    // If remaining time is low (<= 3), suspend regardless of gstatus
    if (remainingTime <= 3) {
      return true;
    }

    // Otherwise, check gstatus
    const status = market.gstatus as string | number | undefined;
    return (
      status === "SUSPENDED" ||
      status === 0 ||
      status === "0"
    );
  };

  const Lock = ({ profitLoss }: { profitLoss: number }) => (
    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
      <RiLockFill className="text-white text-xl" />
      <div
        className={`text-xs font-semibold leading-3 text-center mt-1 ${
          profitLoss > 0
            ? "text-green-400"
            : profitLoss < 0
              ? "text-red-400"
              : "text-gray-400"
        }`}
      >
        {profitLoss > 0 ? "+" : ""}
        {profitLoss.toFixed(0)}
      </div>
    </div>
  );

  // Profit/Loss calculation functions
  const getBetProfitLoss = (nation: string) => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    
    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    let totalProfitLoss = 0;

    bets.forEach((bet: any) => {
      const { sid, betName: currentBetName, name, nation: betNation, oddCategory, stake, betRate } = bet.betData;
      const result = bet.betData?.result;

      // Use either betName, name, or nation field
      const actualBetName = currentBetName || name || betNation;
      
      if (actualBetName && typeof actualBetName === 'string') {
        const actualBetNameLower = actualBetName.toLowerCase();
        const requestedNationLower = nation.toLowerCase();
        
        // Match by bet name - more flexible matching
        const isMatch = 
          actualBetNameLower === requestedNationLower ||
          actualBetNameLower.includes(requestedNationLower) ||
          requestedNationLower.includes(actualBetNameLower) ||
          // Match by teen20 specific terms
          (requestedNationLower.includes('player a') && actualBetNameLower.includes('player a')) ||
          (requestedNationLower.includes('player b') && actualBetNameLower.includes('player b')) ||
          (requestedNationLower.includes('3 baccarat a') && actualBetNameLower.includes('3 baccarat a')) ||
          (requestedNationLower.includes('3 baccarat b') && actualBetNameLower.includes('3 baccarat b')) ||
          (requestedNationLower.includes('black a') && actualBetNameLower.includes('black a')) ||
          (requestedNationLower.includes('black b') && actualBetNameLower.includes('black b')) ||
          (requestedNationLower.includes('red a') && actualBetNameLower.includes('red a')) ||
          (requestedNationLower.includes('red b') && actualBetNameLower.includes('red b')) ||
          (requestedNationLower.includes('total a') && actualBetNameLower.includes('total a')) ||
          (requestedNationLower.includes('total b') && actualBetNameLower.includes('total b')) ||
          (requestedNationLower.includes('pair plus a') && actualBetNameLower.includes('pair plus a')) ||
          (requestedNationLower.includes('pair plus b') && actualBetNameLower.includes('pair plus b'));
        
        if (isMatch) {
          // If bet is settled, use the actual profit/loss from the result
          if (result && result.settled) {
            let profitLoss = 0;

            if (result.status === "won" || result.status === "profit") {
              profitLoss = Number(result.profitLoss) || 0;
            } else if (result.status === "lost") {
              profitLoss = Number(result.profitLoss) || 0;
            }

            totalProfitLoss += profitLoss;
          } else {
            // For unsettled bets, show the stake as potential loss
            totalProfitLoss -= Number(stake) || 0;
          }
        }
      }
    });

    return totalProfitLoss;
  };

  // Handle different result formats
  const processedResults = React.useMemo(() => {
    if (!results) return [];
    return Array.isArray(results) ? results : [];
  }, [results]);

  // Debug logging for teen20 results
  React.useEffect(() => {
    if (results && Array.isArray(results) && results.length > 0) {
      console.log("🎰 Teen20 component: Processing results:", {
        resultsCount: results.length,
        firstResult: results[0],
        hasWinField: results.some((r: any) => r.win !== undefined),
        sampleResults: results
          .slice(0, 3)
          .map((r: any) => ({ result: r.result, win: r.win })),
      });
    }
  }, [results]);

  // Removed - now handled by IndividualResultModal component

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5 md:pt-1 p-1">
        {/* Player A */}
        <div className="flex flex-col w-full">
          <h2 className="text-sm font-semibold border border-gray-300 leading-6 px-2">
            Player A
          </h2>
          <div className="grid grid-cols-2 w-full">
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 w-full">
                {/* Player A */}
                <div
                  className={`flex flex-col ${isSuspended("Player A") ? "" : "cursor-pointer"}`}
                  onClick={() => handleBetClick("1", "back")}
                >
                  <h2 className="border border-gray-300 leading-10 font-semibold text-sm flex justify-center items-center">
                    Player A
                  </h2>
                  <h2
                    className={`relative border border-gray-300 leading-10 font-semibold text-sm flex flex-col justify-center items-center bg-[var(--bg-back)]`}
                  >
                    {isSuspended("Player A") && <Lock profitLoss={getBetProfitLoss("Player A")} />}
                    <div className="text-sm font-semibold">
                      {getRate("Player A")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Player A") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Player A") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Player A") > 0 ? "+" : ""}
                      {getBetProfitLoss("Player A").toFixed(0)}
                    </div>
                  </h2>
                </div>

                {/* 3 Baccarat A */}
                <div
                  className={`flex flex-col ${isSuspended("3 Baccarat A") ? "" : "cursor-pointer"}`}
                  onClick={() => handleBetClick("5", "back")}
                >
                  <h2 className="border border-gray-300 leading-10 font-semibold text-sm flex justify-center items-center">
                    3 Baccarat A
                  </h2>
                  <h2
                    className={`relative border border-gray-300 leading-10 font-semibold text-sm flex flex-col justify-center items-center bg-[var(--bg-back)]`}
                  >
                    {isSuspended("3 Baccarat A") && <Lock profitLoss={getBetProfitLoss("3 Baccarat A")} />}
                    <div className="text-sm font-semibold">
                      {getRate("3 Baccarat A")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("3 Baccarat A") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("3 Baccarat A") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("3 Baccarat A") > 0 ? "+" : ""}
                      {getBetProfitLoss("3 Baccarat A").toFixed(0)}
                    </div>
                  </h2>
                </div>
              </div>

              {/* Black A */}
              <div
                className={`relative flex gap-1.5 items-center justify-between ${isSuspended("Black A") ? "" : "cursor-pointer"} bg-[var(--bg-back)]`}
                onClick={() => handleBetClick("7", "back")}
              >
                {isSuspended("Black A") && <Lock profitLoss={getBetProfitLoss("Black A")} />}
                <div className="flex gap-1.5 px-4 py-2 items-center justify-center">
                  <img src={cardType.Heart} className="h-4 w-4" alt="" />
                  <img src={cardType.Club} className="h-4 w-4" alt="" />
                </div>
                {!isSuspended("Black A") && (
                  <div className="flex flex-col gap-1 px-4 items-center justify-center">
                    <div className="text-sm font-semibold">
                      {getRate("Black A")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Black A") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Black A") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Black A") > 0 ? "+" : ""}
                      {getBetProfitLoss("Black A").toFixed(0)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 w-full">
                {/* Total A */}
                <div
                  className={`flex flex-col ${isSuspended("Total A") ? "" : "cursor-pointer"}`}
                  onClick={() => handleBetClick("11", "back")}
                >
                  <h2 className="border border-gray-300 leading-10 font-semibold text-sm flex justify-center items-center">
                    Total A
                  </h2>
                  <h2
                    className={`relative border border-gray-300 leading-10 font-semibold text-sm flex flex-col justify-center items-center bg-[var(--bg-back)]`}
                  >
                    {isSuspended("Total A") && <Lock profitLoss={getBetProfitLoss("Total A")} />}
                    <div className="text-sm font-semibold">
                      {getRate("Total A")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Total A") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Total A") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Total A") > 0 ? "+" : ""}
                      {getBetProfitLoss("Total A").toFixed(0)}
                    </div>
                  </h2>
                </div>

                {/* Pair Plus A */}
                <div
                  className={`flex flex-col ${isSuspended("Pair Plus A") ? "" : "cursor-pointer"}`}
                  onClick={() => handleBetClick("3", "back")}
                >
                  <h2 className="border border-gray-300 leading-10 font-semibold text-sm flex justify-center items-center">
                    Pair Plus A
                  </h2>
                  <h2
                    className={`relative border border-gray-300 leading-10 font-semibold text-sm flex flex-col justify-center items-center bg-[var(--bg-back)]`}
                  >
                    {isSuspended("Pair Plus A") && <Lock profitLoss={getBetProfitLoss("Pair Plus A")} />}
                    <div className="text-sm font-semibold">
                      {getRate("Pair Plus A")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Pair Plus A") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Pair Plus A") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Pair Plus A") > 0 ? "+" : ""}
                      {getBetProfitLoss("Pair Plus A").toFixed(0)}
                    </div>
                  </h2>
                </div>
              </div>

              {/* Red A */}
              <div
                className={`relative ms-1.5 flex gap-1.5 items-center justify-between ${isSuspended("Red A") ? "" : "cursor-pointer"} bg-[var(--bg-back)]`}
                onClick={() => handleBetClick("8", "back")}
              >
                {isSuspended("Red A") && <Lock profitLoss={getBetProfitLoss("Red A")} />}
                <div className="flex gap-1.5 px-4 py-2 items-center justify-center">
                  <img src={cardType.Spade} className="h-4 w-4" alt="" />
                  <img src={cardType.Diamond} className="h-4 w-4" alt="" />
                </div>
                {!isSuspended("Red A") && (
                  <div className="flex flex-col gap-1 px-4 items-center justify-center">
                    <div className="text-sm font-semibold">
                      {getRate("Red A")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Red A") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Red A") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Red A") > 0 ? "+" : ""}
                      {getBetProfitLoss("Red A").toFixed(0)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player B */}
        <div className="flex flex-col w-full">
          <h2 className="text-sm font-semibold border border-gray-300 leading-6 px-2">
            Player B
          </h2>
          <div className="grid grid-cols-2 w-full">
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 w-full">
                {/* Player B */}
                <div
                  className={`flex flex-col ${isSuspended("Player B") ? "" : "cursor-pointer"}`}
                  onClick={() => handleBetClick("2", "back")}
                >
                  <h2 className="border border-gray-300 leading-10 font-semibold text-sm flex justify-center items-center">
                    Player B
                  </h2>
                  <h2
                    className={`relative border border-gray-300 leading-10 font-semibold text-sm flex flex-col justify-center items-center bg-[var(--bg-back)]`}
                  >
                    {isSuspended("Player B") && <Lock profitLoss={getBetProfitLoss("Player B")} />}
                    <div className="text-sm font-semibold">
                      {getRate("Player B")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Player B") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Player B") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Player B") > 0 ? "+" : ""}
                      {getBetProfitLoss("Player B").toFixed(0)}
                    </div>
                  </h2>
                </div>

                {/* 3 Baccarat B */}
                <div
                  className={`flex flex-col ${isSuspended("3 Baccarat B") ? "" : "cursor-pointer"}`}
                  onClick={() => handleBetClick("6", "back")}
                >
                  <h2 className="border border-gray-300 leading-10 font-semibold text-sm flex justify-center items-center">
                    3 Baccarat B
                  </h2>
                  <h2
                    className={`relative border border-gray-300 leading-10 font-semibold text-sm flex flex-col justify-center items-center bg-[var(--bg-back)]`}
                  >
                    {isSuspended("3 Baccarat B") && <Lock profitLoss={getBetProfitLoss("3 Baccarat B")} />}
                    <div className="text-sm font-semibold">
                      {getRate("3 Baccarat B")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("3 Baccarat B") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("3 Baccarat B") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("3 Baccarat B") > 0 ? "+" : ""}
                      {getBetProfitLoss("3 Baccarat B").toFixed(0)}
                    </div>
                  </h2>
                </div>
              </div>

              {/* Black B */}
              <div
                className={`relative flex gap-1.5 items-center justify-between ${isSuspended("Black B") ? "" : "cursor-pointer"} bg-[var(--bg-back)]`}
                onClick={() => handleBetClick("9", "back")}
              >
                {isSuspended("Black B") && <Lock profitLoss={getBetProfitLoss("Black B")} />}
                <div className="flex gap-1.5 px-4 py-2 items-center justify-center">
                  <img src={cardType.Heart} className="h-4 w-4" alt="" />
                  <img src={cardType.Club} className="h-4 w-4" alt="" />
                </div>
                {!isSuspended("Black B") && (
                  <div className="flex flex-col gap-1 px-4 items-center justify-center">
                    <div className="text-sm font-semibold">
                      {getRate("Black B")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Black B") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Black B") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Black B") > 0 ? "+" : ""}
                      {getBetProfitLoss("Black B").toFixed(0)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 w-full">
                {/* Total B */}
                <div
                  className={`flex flex-col ${isSuspended("Total B") ? "" : "cursor-pointer"}`}
                  onClick={() => handleBetClick("12", "back")}
                >
                  <h2 className="border border-gray-300 leading-10 font-semibold text-sm flex justify-center items-center">
                    Total B
                  </h2>
                  <h2
                    className={`relative border border-gray-300 leading-10 font-semibold text-sm flex flex-col justify-center items-center bg-[var(--bg-back)]`}
                  >
                    {isSuspended("Total B") && <Lock profitLoss={getBetProfitLoss("Total B")} />}
                    <div className="text-sm font-semibold">
                      {getRate("Total B")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Total B") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Total B") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Total B") > 0 ? "+" : ""}
                      {getBetProfitLoss("Total B").toFixed(0)}
                    </div>
                  </h2>
                </div>

                {/* Pair Plus B */}
                <div
                  className={`flex flex-col ${isSuspended("Pair Plus B") ? "" : "cursor-pointer"}`}
                  onClick={() => handleBetClick("4", "back")}
                >
                  <h2 className="border border-gray-300 leading-10 font-semibold text-sm flex justify-center items-center">
                    Pair Plus B
                  </h2>
                  <h2
                    className={`relative border border-gray-300 leading-10 font-semibold text-sm flex flex-col justify-center items-center bg-[var(--bg-back)]`}
                  >
                    {isSuspended("Pair Plus B") && <Lock profitLoss={getBetProfitLoss("Pair Plus B")} />}
                    <div className="text-sm font-semibold">
                      {getRate("Pair Plus B")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Pair Plus B") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Pair Plus B") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Pair Plus B") > 0 ? "+" : ""}
                      {getBetProfitLoss("Pair Plus B").toFixed(0)}
                    </div>
                  </h2>
                </div>
              </div>

              {/* Red B */}
              <div
                className={`relative ms-1.5 flex gap-1.5 items-center justify-between ${isSuspended("Red B") ? "" : "cursor-pointer"} bg-[var(--bg-back)]`}
                onClick={() => handleBetClick("10", "back")}
              >
                {isSuspended("Red B") && <Lock profitLoss={getBetProfitLoss("Red B")} />}
                <div className="flex gap-1.5 px-4 py-2 items-center justify-center">
                  <img src={cardType.Spade} className="h-4 w-4" alt="" />
                  <img src={cardType.Diamond} className="h-4 w-4" alt="" />
                </div>
                {!isSuspended("Red B") && (
                  <div className="flex flex-col gap-1 px-4 items-center justify-center">
                    <div className="text-sm font-semibold">
                      {getRate("Red B")}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-3 text-center ${
                        getBetProfitLoss("Red B") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Red B") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Red B") > 0 ? "+" : ""}
                      {getBetProfitLoss("Red B").toFixed(0)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Results */}
      <div className="flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${gameCode || "TEEN_20"}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(processedResults) &&
            processedResults.slice(0, 10).map((item: any, index: number) => {
              // Handle different result formats
              let resultValue;
              if (isTeen20C) {
                resultValue = item?.win; // For teen20c, use 'win' field
              } else {
                resultValue = item?.result; // For teen20, use 'result' field
              }

              const isA = String(resultValue) === "1"; // 1 => A, 2 => B
              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${isA ? "text-red-500" : "text-yellow-500"} cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title="Click to view details"
                >
                  {isA ? "A" : "B"}
                </h2>
              );
            })}
        </div>
      </div>

      {/* Individual Result Details Modal - Using centralized component */}
      <IndividualResultModal
        isOpen={isResultModalOpen}
        onClose={() => {
          setIsResultModalOpen(false);
          setSelectedResultId(null);
        }}
        resultId={selectedResultId}
        gameType={apiGameType}
        title="Result Details"
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Teen20 = memoizeCasinoComponent(Teen20Component);
Teen20.displayName = "Teen20";

export default Teen20;
