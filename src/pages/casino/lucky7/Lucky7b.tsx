import {
  cardImage,
  getBlackShapes,
  getNumberCard,
  getRedShapes,
  getCardByCode,
} from "@/utils/card";
import React from "react";
import { RiLockFill } from "react-icons/ri";
import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";

const Lucky7bComponent = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug,
  name,
  currentBet,
}: any) => {
  const resultModal = useIndividualResultModal();
  const navigate = useNavigate();

  // Normalize game slug
  const normalizedGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "lucky7eu"; // Default fallback
  }, [gameSlug]);

  const t2: any[] =
    casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];

  /**
   * Universal profit/loss calculation function for all Lucky7EU betting types
   * @param betType - The type of bet to calculate profit/loss for
   * @returns The profit/loss amount (negative for loss-only display)
   */
  const getBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake } = bet.betData;

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      // More precise matching to avoid cross-contamination
      let isMatch = false;

      // Exact match first
      if (normalizedBetName === normalizedBetType) {
        isMatch = true;
      }
      // Handle Low Card specifically
      else if (
        betType === "Low Card" &&
        (normalizedBetName === "low card" || normalizedBetName === "low")
      ) {
        isMatch = true;
      }
      // Handle High Card specifically
      else if (
        betType === "High Card" &&
        (normalizedBetName === "high card" || normalizedBetName === "high")
      ) {
        isMatch = true;
      }
      // Handle Even specifically
      else if (betType === "Even" && normalizedBetName === "even") {
        isMatch = true;
      }
      // Handle Odd specifically
      else if (betType === "Odd" && normalizedBetName === "odd") {
        isMatch = true;
      }
      // Handle Red specifically
      else if (betType === "Red" && normalizedBetName === "red") {
        isMatch = true;
      }
      // Handle Black specifically
      else if (betType === "Black" && normalizedBetName === "black") {
        isMatch = true;
      }
      // Handle Card bets (Card A, Card 2, etc.)
      else if (
        betType.startsWith("Card") &&
        normalizedBetName.startsWith("card")
      ) {
        // Extract card number from both
        const betTypeCardNum = betType.replace("Card ", "").trim();
        const betNameCardNum = normalizedBetName.replace("card ", "").trim();
        isMatch = betTypeCardNum === betNameCardNum;
      }
      // Handle Line bets (Line 1, Line 2, Line 3, Line 4)
      else if (
        betType.startsWith("Line") &&
        normalizedBetName.startsWith("line")
      ) {
        // Extract line number from both
        const betTypeLineNum = betType.replace("Line", "").trim();
        const betNameLineNum = normalizedBetName.replace("line", "").trim();
        isMatch = betTypeLineNum === betNameLineNum;
      }

      if (isMatch) {
        profitLoss += -stake; // Accumulate loss-only display for multiple bets
      }
    });

    return profitLoss;
  };


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

  // Debug logging for Lucky7EU component
  console.log("🎰 Lucky7EU component debug:", {
    casinoData,
    casinoDataStructure: {
      hasData: !!casinoData?.data,
      hasSub: !!casinoData?.data?.sub,
      hasDataData: !!casinoData?.data?.data,
      hasDataDataData: !!casinoData?.data?.data?.data,
      hasT2: !!casinoData?.data?.data?.data?.t2,
      subLength: casinoData?.data?.sub?.length || 0,
      t2Length: casinoData?.data?.data?.data?.t2?.length || 0,
    },
    t2,
    t2Length: t2.length,
    results,
    resultsLength: results?.length || 0,
    firstResult: results?.[0],
    sampleT2Item: t2[0],
  });

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    
    if (!resultId) {
      console.error("🎰 Lucky7b: No result ID found in result", result);
      return;
    }
    
    if (!normalizedGameSlug) {
      console.error("🎰 Lucky7b: No gameSlug available", { gameSlug, normalizedGameSlug });
      return;
    }
    
    resultModal.openModal(String(resultId), result);
  };

  const getByNat = (name: string) =>
    t2.find(
      (x) =>
        String(x?.nat || x?.nation || "").toLowerCase() === name.toLowerCase()
    );

  const isLocked = (row: any) => {
    const s = row?.gstatus as string | number | undefined;
    return s !== "OPEN" || (remainingTime ?? 0) <= 3;
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* top row */}
      <div className="flex bg-[var(--bg-table-row)] p-4 items-center justify-center gap-2">
        <div className="flex flex-col w-full">
          {(() => {
            const row = getByNat("Low Card") || {};
            const locked = isLocked(row);
            const value = row?.b ?? "0";
            return (
              <>
                <h2 className="text-black text-md font-bold text-center">
                  {value}
                </h2>
                <button
                  className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2"
                  disabled={locked}
                  onClick={() =>
                    !locked && row?.sid && onBetClick?.(String(row.sid), "back")
                  }
                >
                  {locked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <RiLockFill className="text-white" />
                    </span>
                  )}
                  Low Card
                </button>
                <h2 
                  className={`text-xs font-semibold leading-5 text-center ${
                    getBetProfitLoss("Low Card") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Low Card") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Low Card") > 0 ? "+" : ""}
                  {getBetProfitLoss("Low Card").toFixed(0)}
                </h2>
              </>
            );
          })()}
        </div>
        <div className="flex items-center justify-center w-26">
          <img src={getNumberCard("7")} className="w-full" />
        </div>
        <div className="flex flex-col w-full">
          {(() => {
            const row = getByNat("High Card") || {};
            const locked = isLocked(row);
            const value = row?.b ?? "0";
            return (
              <>
                <h2 className="text-black text-md font-bold text-center">
                  {value}
                </h2>
                <button
                  className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2"
                  disabled={locked}
                  onClick={() =>
                    !locked && row?.sid && onBetClick?.(String(row.sid), "back")
                  }
                >
                  {locked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <RiLockFill className="text-white" />
                    </span>
                  )}
                  High Card
                </button>
                <h2 
                  className={`text-xs font-semibold leading-5 text-center ${
                    getBetProfitLoss("High Card") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("High Card") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("High Card") > 0 ? "+" : ""}
                  {getBetProfitLoss("High Card").toFixed(0)}
                </h2>
              </>
            );
          })()}
        </div>
      </div>
      {/* second row */}
      <div className=" place-items-center gap-2  grid md:grid-cols-2 grid-cols-1">
        <div className="flex items-center py-4 bg-[var(--bg-table-row)] w-full gap-2 px-4">
          <div className="flex flex-col w-full">
            {(() => {
              const row = getByNat("Even") || {};
              const locked = isLocked(row);
              const value = row?.b ?? "0";
              return (
                <>
                  <h2 className="text-black text-md font-bold text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2.5"
                    disabled={locked}
                    onClick={() =>
                      !locked &&
                      row?.sid &&
                      onBetClick?.(String(row.sid), "back")
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Even
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-5 text-center ${
                      getBetProfitLoss("Even") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Even") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Even") > 0 ? "+" : ""}
                    {getBetProfitLoss("Even").toFixed(0)}
                  </h2>
                </>
              );
            })()}
          </div>
          <div className="flex flex-col w-full">
            {(() => {
              const row = getByNat("Odd") || {};
              const locked = isLocked(row);
              const value = row?.b ?? "0";
              return (
                <>
                  <h2 className="text-black text-md font-bold text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2.5"
                    disabled={locked}
                    onClick={() =>
                      !locked &&
                      row?.sid &&
                      onBetClick?.(String(row.sid), "back")
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Odd
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-5 text-center ${
                      getBetProfitLoss("Odd") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Odd") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Odd") > 0 ? "+" : ""}
                    {getBetProfitLoss("Odd").toFixed(0)}
                  </h2>
                </>
              );
            })()}
          </div>
        </div>
        <div className="flex items-center py-4  bg-[var(--bg-table-row)] w-full gap-2 px-4">
          <div className="flex flex-col w-full">
            {(() => {
              const row = getByNat("Red") || {};
              const locked = isLocked(row);
              const value = row?.b ?? "0";
              return (
                <>
                  <h2 className="text-black text-md font-bold text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2.5"
                    disabled={locked}
                    onClick={() =>
                      !locked &&
                      row?.sid &&
                      onBetClick?.(String(row.sid), "back")
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    <div className="flex gap-1  justify-center items-center">
                      <img
                        src={getRedShapes().Diamond}
                        alt=""
                        className="w-5"
                      />

                      <img
                        src={getBlackShapes().Spade}
                        alt=""
                        className="w-5"
                      />
                    </div>
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-5 text-center ${
                      getBetProfitLoss("Red") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Red") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Red") > 0 ? "+" : ""}
                    {getBetProfitLoss("Red").toFixed(0)}
                  </h2>
                </>
              );
            })()}
          </div>
          <div className="flex flex-col w-full">
            {(() => {
              const row = getByNat("Black") || {};
              const locked = isLocked(row);
              const value = row?.b ?? "0";
              return (
                <>
                  <h2 className="text-black text-md font-bold text-center">
                    {value}
                  </h2>
                  <button
                    className="relative bg-gradient-to-r from-[var(--bg-primary)] text-white font-semibold to-[var(--bg-secondary)] w-full py-2.5"
                    disabled={locked}
                    onClick={() =>
                      !locked &&
                      row?.sid &&
                      onBetClick?.(String(row.sid), "back")
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    <div className="flex gap-1  justify-center items-center">
                      <img src={getRedShapes().Heart} alt="" className="w-5" />
                      <img src={getBlackShapes().Club} alt="" className="w-5" />
                    </div>
                  </button>
                  <h2 
                    className={`text-xs font-semibold leading-5 text-center ${
                      getBetProfitLoss("Black") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Black") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Black") > 0 ? "+" : ""}
                    {getBetProfitLoss("Black").toFixed(0)}
                  </h2>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      {/* third row */}
      <div className="grid md:grid-cols-4 grid-cols-2 gap-2">
        {/* Line 1: Cards 1, 2, 3 */}
        <div className="flex flex-col items-center justify-center gap-2 bg-[var(--bg-table-row)] p-2">
          <h2 className="text-black text-md font-bold text-center">
            {getByNat("Line 1")?.b ?? "0"}
          </h2>
          <div className="flex gap-2 bg-[var(--bg-table-row)] p-2 justify-center items-center">
            {["1", "2", "3"].map((item, index) => {
              const lineRow = getByNat("Line 1") || {};
              const locked = isLocked(lineRow);
              return (
                <div key={item} className="flex flex-col items-center gap-1">
                  <button
                    className="relative"
                    disabled={locked}
                    onClick={() =>
                      !locked &&
                      lineRow?.sid &&
                      onBetClick?.(String(lineRow.sid), "back")
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <RiLockFill className="text-white text-xs" />
                      </span>
                    )}
                    <img
                      src={getNumberCard(item === "1" ? "A" : item)}
                      alt=""
                      className="lg:w-8 w-6"
                    />
                  </button>
                </div>
              );
            })}
          </div>
                  <h2 
                    className={`text-xs font-semibold leading-3 ${
                      getBetProfitLoss("Line 1") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Line 1") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Line 1") > 0 ? "+" : ""}
                    {getBetProfitLoss("Line 1").toFixed(0)}
                  </h2>
        </div>
        {/* Line 2: Cards 4, 5, 6 */}
        <div className="flex flex-col items-center justify-center gap-2 bg-[var(--bg-table-row)] p-2">
          <h2 className="text-black text-md font-bold text-center">
            {getByNat("Line 2")?.b ?? "0"}
          </h2>
          <div className="flex gap-2 bg-[var(--bg-table-row)] p-2 justify-center items-center">
            {["4", "5", "6"].map((item, index) => {
              const lineRow = getByNat("Line 2") || {};
              const locked = isLocked(lineRow);
              return (
                <div key={item} className="flex flex-col items-center gap-1">
                  <button
                    className="relative"
                    disabled={locked}
                    onClick={() =>
                      !locked &&
                      lineRow?.sid &&
                      onBetClick?.(String(lineRow.sid), "back")
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <RiLockFill className="text-white text-xs" />
                      </span>
                    )}
                    <img
                      src={getNumberCard(item)}
                      alt=""
                      className="lg:w-8 w-6"
                    />
                  </button>
                </div>
              );
            })}
          </div>
                  <h2 
                    className={`text-xs font-semibold leading-3 ${
                      getBetProfitLoss("Line 2") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Line 2") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Line 2") > 0 ? "+" : ""}
                    {getBetProfitLoss("Line 2").toFixed(0)}
                  </h2>
        </div>
        {/* Line 3: Cards 7, 8, 9 */}
        <div className="flex flex-col items-center justify-center gap-2 bg-[var(--bg-table-row)] p-2">
          <h2 className="text-black text-md font-bold text-center">
            {getByNat("Line 3")?.b ?? "0"}
          </h2>
          <div className="flex gap-2 bg-[var(--bg-table-row)] p-2 justify-center items-center">
            {["8", "9", "10"].map((item, index) => {
              const lineRow = getByNat("Line 3") || {};
              const locked = isLocked(lineRow);
              return (
                <div key={item} className="flex flex-col items-center gap-1">
                  <button
                    className="relative"
                    disabled={locked}
                    onClick={() =>
                      !locked &&
                      lineRow?.sid &&
                      onBetClick?.(String(lineRow.sid), "back")
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <RiLockFill className="text-white text-xs" />
                      </span>
                    )}
                    <img
                      src={getNumberCard(item)}
                      alt=""
                      className="lg:w-8 w-6"
                    />
                  </button>
                </div>
              );
            })}
          </div>
                  <h2 
                    className={`text-xs font-semibold leading-3 ${
                      getBetProfitLoss("Line 3") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Line 3") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Line 3") > 0 ? "+" : ""}
                    {getBetProfitLoss("Line 3").toFixed(0)}
                  </h2>
        </div>
        {/* Line 4: Cards 10, J, Q, K (or 10, J, Q if only 3) */}
        <div className="flex flex-col items-center justify-center gap-2 bg-[var(--bg-table-row)] p-2">
          <h2 className="text-black text-md font-bold text-center">
            {getByNat("Line 4")?.b ?? "0"}
          </h2>
          <div className="flex gap-2 bg-[var(--bg-table-row)] p-2 justify-center items-center">
            {["J", "Q", "K"].slice(0, 3).map((item, index) => {
              const lineRow = getByNat("Line 4") || {};
              const locked = isLocked(lineRow);
              return (
                <div key={item} className="flex flex-col items-center gap-1">
                  <button
                    className="relative"
                    disabled={locked}
                    onClick={() =>
                      !locked &&
                      lineRow?.sid &&
                      onBetClick?.(String(lineRow.sid), "back")
                    }
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <RiLockFill className="text-white text-xs" />
                      </span>
                    )}
                    <img
                      src={getNumberCard(item)}
                      alt=""
                      className="lg:w-8 w-6"
                    />
                  </button>
                </div>
              );
            })}
          </div>
                  <h2 
                    className={`text-xs font-semibold leading-3 ${
                      getBetProfitLoss("Line 4") > 0
                        ? "text-green-600"
                        : getBetProfitLoss("Line 4") < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {getBetProfitLoss("Line 4") > 0 ? "+" : ""}
                    {getBetProfitLoss("Line 4").toFixed(0)}
                  </h2>
        </div>
      </div>
      {/* fourth row - All Cards (Card 1 to Card K) */}
      <div className="flex flex-col gap-2 py-4 bg-[var(--bg-table-row)]">
        <h2 className="text-black text-md font-bold text-center">
          {getByNat("Card 1")?.b ?? "0"}
        </h2>
        <div className="flex items-center justify-center gap-2">
          {[
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "J",
            "Q",
            "K",
          ].map((item, index) => {
            const row = getByNat(`Card ${item}`) || {};
            const locked = isLocked(row);
            return (
              <div key={item} className="flex flex-col items-center gap-1">
                <button
                  className="relative"
                  disabled={locked}
                  onClick={() =>
                    !locked && row?.sid && onBetClick?.(String(row.sid), "back")
                  }
                >
                  {locked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                      <RiLockFill className="text-white text-xs" />
                    </span>
                  )}
                  <img
                    src={getNumberCard(item === "1" ? "A" : item)}
                    alt=""
                    className="lg:w-8 w-6"
                  />
                </button>
                <h2 
                  className={`text-xs font-semibold leading-3 ${
                    getBetProfitLoss(`Card ${item}`) > 0
                      ? "text-green-600"
                      : getBetProfitLoss(`Card ${item}`) < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss(`Card ${item}`) > 0 ? "+" : ""}
                  {getBetProfitLoss(`Card ${item}`).toFixed(0)}
                </h2>
              </div>
            );
          })}
        </div>
      </div>
      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=${normalizedGameSlug.toUpperCase()}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {results?.slice(0, 10).map((item: any, index: number) => {
            let displayText = "";
            let textColor = "";

            if (item.win === "1") {
              displayText = "L";
              textColor = "text-red-500";
            } else if (item.win === "0") {
              displayText = "T";
              textColor = "text-white";
            } else if (item.win === "2") {
              displayText = "H";
              textColor = "text-yellow-400";
            } else {
              displayText = "?";
              textColor = "text-gray-400";
            }

            return (
              <h2
                key={index}
                className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${textColor} cursor-pointer hover:scale-110 transition-transform`}
                onClick={() => handleResultClick(item)}
                title="Click to view details"
              >
                {displayText}
              </h2>
            );
          })}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={normalizedGameSlug}
        title={`${name || "Lucky7EU"} Result Details`}
        customGetFilteredBets={getFilteredBets}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Lucky7b = memoizeCasinoComponent(Lucky7bComponent);
Lucky7b.displayName = "Lucky7b";

export default Lucky7b;
