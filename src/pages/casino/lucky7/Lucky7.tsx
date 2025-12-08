import {
  cardImage,
  getBlackShapes,
  getNumberCard,
  getRedShapes,
  getCardByCode,
} from "../../../utils/card";
import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const Lucky7Component = ({
  casinoData,
  remainingTime,
  results,
  gameSlug,
  gameCode,
  name,
}: any) => {
  const navigate = useNavigate();

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameCode/gameSlug for API calls (e.g., "LUCKY7")
  const apiGameType = React.useMemo(() => {
    return gameCode || gameSlug || "LUCKY7";
  }, [gameCode, gameSlug]);

  const t2: any[] =
    casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];

  // Handle result click to open modal
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
    
    if (matchId && apiGameType) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
  };

  /**
   * Universal profit/loss calculation function for all Lucky7EU betting types
   * @param betType - The type of bet to calculate profit/loss for
   * @returns The profit/loss amount (negative for loss-only display)
   */



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
                >
                  {locked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <RiLockFill className="text-white" />
                    </span>
                  )}
                  Low Card
                </button>
                
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
                >
                  {locked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <RiLockFill className="text-white" />
                    </span>
                  )}
                  High Card
                </button>
                
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
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Even
                  </button>
                  
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
                  >
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <RiLockFill className="text-white" />
                      </span>
                    )}
                    Odd
                  </button>
                  
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
                  
        </div>
        {/* Line 3: Cards  8, 9,10 */}
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
      </div>
      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${gameCode || gameSlug || "LUCKY7"}`)}
            className="text-sm font-normal leading-8 text-white hover:text-gray-200"
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

            const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
            return (
              <div
                key={item?.mid || item?.roundId || index}
                className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${textColor} ${
                  matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                }`}
                title={`${displayText}${matchId ? " - Click to view details" : ""}`}
                onClick={(e) => {
                  if (matchId) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResultClick(item);
                  }
                }}
                role="button"
                tabIndex={matchId ? 0 : undefined}
                onKeyDown={(e) => {
                  if (matchId && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleResultClick(item);
                  }
                }}
              >
                {displayText}
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      <IndividualResultModal
        isOpen={isResultModalOpen}
        onClose={() => {
          setIsResultModalOpen(false);
          setSelectedResultId(null);
        }}
        resultId={selectedResultId}
        gameType={apiGameType}
        title={`${name || "Lucky7"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Lucky7 = memoizeCasinoComponent(Lucky7Component);
Lucky7.displayName = "Lucky7";

export default Lucky7;
