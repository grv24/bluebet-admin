import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { getCardByCode } from "@/utils/card";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";

interface Teenpatti2cardProps {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}

const Teenpatti2cardComponent: React.FC<Teenpatti2cardProps> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameCode,
}) => {
  const navigate = useNavigate();

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameCode for API calls (e.g., "PATTI_2")
  const apiGameType = React.useMemo(() => {
    return gameCode || "PATTI_2";
  }, [gameCode]);
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

  // Get odds data for each row
  const playerA = getOddsData(1);
  const playerB = getOddsData(2);
  const totalA = getOddsData(3);
  const totalB = getOddsData(4);
  const miniBaccaratA = getOddsData(5);
  const miniBaccaratB = getOddsData(6);
  const colorPlus = getOddsData(7);

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

  // Function to parse Patti2 description and extract details
  const parsePatti2Description = (desc: string, newdesc: string) => {
    // Use desc if newdesc is not available
    const descriptionToParse = newdesc || desc;

    if (!descriptionToParse)
      return {
        miniBaccarat: "N/A",
        totalA: "N/A",
        totalB: "N/A",
        colorPlus: "N/A",
      };

    // Parse the description field which has the format:
    // Example: "Player B#Mini Baccarat Player A (A : 7  |  B : 0)#Total A: 17 | B: 24#Color Plus No"
    const sections = descriptionToParse.split("#");

    // Extract Total A and B from section 2
    let totalAValue = "N/A";
    let totalBValue = "N/A";
    if (sections[2]) {
      const totalMatch = sections[2].match(/Total A:\s*(\d+)\s*\|\s*B:\s*(\d+)/i);
      if (totalMatch) {
        totalAValue = totalMatch[1];
        totalBValue = totalMatch[2];
      } else {
        // Fallback: try to split by |
        const parts = sections[2].split("|");
        totalAValue = parts[0]?.replace("Total A:", "").trim() || "N/A";
        totalBValue = parts[1]?.replace("B:", "").trim() || "N/A";
      }
    }

    return {
      miniBaccarat: sections[1] || "N/A",
      totalA: totalAValue,
      totalB: totalBValue,
      colorPlus: sections[3] || "N/A",
    };
  };

  // Handle result click to open modal
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
    
    if (matchId && apiGameType) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
        <table className="w-full border-collapse">
          <thead></thead>
          <tbody>
            {/* Player A Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                Player A
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() => !isSuspended(playerA) && onBetClick("1", "back")}
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
                onClick={() => !isSuspended(playerA) && onBetClick("1", "lay")}
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

            {/* Mini Baccarat A Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 border-gray-300 py-2 text-sm font-semibold">
                Mini Baccarat A
              </td>
              <td
                colSpan={2}
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(miniBaccaratA) && onBetClick("5", "back")
                }
              >
                {isSuspended(miniBaccaratA) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(miniBaccaratA?.b)}</span>
                </div>
              </td>
            </tr>
            {/* Total A Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 border-gray-300 py-2 text-sm font-semibold">
                Total A
              </td>
              <td
                className="border border-gray-300 px-2 py-2 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() => !isSuspended(totalA) && onBetClick("3", "lay")}
              >
                {isSuspended(totalA) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px]">{formatOdds(totalA?.l)}</span>
                  <span className="font-semibold text-sm">
                    {formatOdds(totalA?.lbhav)}
                  </span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() => !isSuspended(totalA) && onBetClick("3", "back")}
              >
                {isSuspended(totalA) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px]">{formatOdds(totalA?.b)}</span>
                  <span className="font-semibold text-sm">
                    {formatOdds(totalA?.bbhav)}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <table className="w-full border-collapse">
          <thead></thead>
          <tbody>
            {/* Player B Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                Player B
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() => !isSuspended(playerB) && onBetClick("2", "back")}
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
                onClick={() => !isSuspended(playerB) && onBetClick("2", "lay")}
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

            {/* Mini Baccarat B Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 border-gray-300 py-2 text-sm font-semibold">
                Mini Baccarat B
              </td>
              <td
                colSpan={2}
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(miniBaccaratB) && onBetClick("6", "back")
                }
              >
                {isSuspended(miniBaccaratB) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(miniBaccaratB?.b)}</span>
                </div>
              </td>
            </tr>
            {/* Total B Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 border-gray-300 py-2 text-sm font-semibold">
                Total B
              </td>
              <td
                className="border border-gray-300 px-2 py-2 text-center cursor-pointer bg-[var(--bg-lay)] relative"
                onClick={() => !isSuspended(totalB) && onBetClick("4", "lay")}
              >
                {isSuspended(totalB) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px]">{formatOdds(totalB?.l)}</span>
                  <span className="font-semibold text-sm">
                    {formatOdds(totalB?.lbhav)}
                  </span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center cursor-pointer bg-[var(--bg-back)] relative"
                onClick={() => !isSuspended(totalB) && onBetClick("4", "back")}
              >
                {isSuspended(totalB) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px]">{formatOdds(totalB?.b)}</span>
                  <span className="font-semibold text-sm">
                    {formatOdds(totalB?.bbhav)}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Color Plus Section */}
      <div
        className="w-full border flex justify-center items-center bg-[var(--bg-back)] border-gray-300 cursor-pointer relative px-4 py-2"
        onClick={() => !isSuspended(colorPlus) && onBetClick("7", "back")}
      >
        {isSuspended(colorPlus) && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <RiLockFill className="text-white text-xl" />
          </div>
        )}
        <span className="text-sm font-semibold">Color Plus</span>
      </div>
      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${apiGameType}`)}
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
              const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
              return (
                <div
                  key={item.mid || `result-${item.win}-${Math.random()}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${
                    isPlayerA ? "text-red-500" : "text-yellow-500"
                  } ${
                    matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                  }`}
                  title={`Round ID: ${item.mid || "N/A"}${matchId ? " - Click to view details" : ""}`}
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
                  {isPlayerA ? "A" : "B"}
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-sm py-2">No results available</div>
          )}
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
        title="2 Cards Teenpatti Result Details"
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Teenpatti2card = memoizeCasinoComponent(Teenpatti2cardComponent);
Teenpatti2card.displayName = "Teenpatti2card";

export default Teenpatti2card;
