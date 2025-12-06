import React, { useState, useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Baccarat29Props {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

const Baccarat29Component: React.FC<Baccarat29Props> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
  gameName,
}) => {
  const navigate = useNavigate();

  // Normalize gameCode to lowercase format (e.g., "TEENS_IN" -> "teensin")
  const normalizedGameType = useMemo(() => {
    if (!gameCode) return "teensin"; // Default fallback for Baccarat29
    return gameCode.toLowerCase().replace(/_/g, "");
  }, [gameCode]);

  // Get odds data from sub array
  // Handle both API format (data.sub) and socket format (data.current.sub)
  const getOddsData = (sid: number) => {
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

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Get odds data for all betting options
  const playerAWinner = getOddsData(1); // Player A
  const playerBWinner = getOddsData(2); // Player B
  const playerAHighCard = getOddsData(3); // High Card A
  const playerBHighCard = getOddsData(4); // High Card B
  const playerAPair = getOddsData(5); // Pair A
  const playerBPair = getOddsData(6); // Pair B
  const playerAColorPlus = getOddsData(7); // Color Plus A
  const playerBColorPlus = getOddsData(8); // Color Plus B
  const lucky9 = getOddsData(9); // Lucky 9

  // Helper function to render betting cell (Admin view - read-only)
  const renderBettingCell = (oddsData: any, type: "back" | "lay" = "back") => {
    const suspended = isSuspended(oddsData);
    const oddsValue = type === "back" ? oddsData?.b : oddsData?.l;
    const displayValue = formatOdds(oddsValue);

    return (
      <td className="border border-gray-300 relative">
        <h2
          className="text-sm flex justify-center items-center font-semibold leading-10 bg-[var(--bg-back)] text-black"
        >
          {displayValue}
        </h2>
        {suspended && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <RiLockFill className="text-white text-lg" />
          </div>
        )}
      </td>
    );
  };

  // Get all odds data for result mapping
  const allOddsData =
    casinoData?.data?.sub ||
    casinoData?.data?.current?.sub ||
    casinoData?.data?.data?.data?.sub ||
    casinoData?.data?.current?.data?.sub ||
    [];

  // Map win values to display labels using actual odds data
  const getResultDisplay = (win: string) => {
    // Find the odds data for this win value (win is the sid)
    const odd = allOddsData.find(
      (item: any) => String(item.sid) === String(win)
    );

    if (odd && odd.nat) {
      // Use the nat field from odds data for title
      const nat = odd.nat;
      // Create short label from nat
      let label = "";
      let color = "text-gray-400";

      if (nat.includes("Player A")) {
        label = "A";
        color = "text-red-500";
      } else if (nat.includes("Player B")) {
        label = "B";
        color = "text-yellow-500";
      } else if (nat.includes("High Card A")) {
        label = "HA";
        color = "text-blue-500";
      } else if (nat.includes("High Card B")) {
        label = "HB";
        color = "text-blue-500";
      } else if (nat.includes("Pair A")) {
        label = "PA";
        color = "text-green-500";
      } else if (nat.includes("Pair B")) {
        label = "PB";
        color = "text-green-500";
      } else if (nat.includes("Color Plus A")) {
        label = "CA";
        color = "text-purple-500";
      } else if (nat.includes("Color Plus B")) {
        label = "CB";
        color = "text-purple-500";
      } else if (nat.includes("Lucky 9")) {
        label = "L9";
        color = "text-yellow-500";
      } else {
        label = win;
      }

      return { label, color, title: nat };
    }

    // Fallback mapping
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "1": { label: "A", color: "text-red-500", title: "Player A" },
      "2": { label: "B", color: "text-yellow-500", title: "Player B" },
      "3": { label: "HA", color: "text-blue-500", title: "High Card A" },
      "4": { label: "HB", color: "text-blue-500", title: "High Card B" },
      "5": { label: "PA", color: "text-green-500", title: "Pair A" },
      "6": { label: "PB", color: "text-green-500", title: "Pair B" },
      "7": { label: "CA", color: "text-purple-500", title: "Color Plus A" },
      "8": { label: "CB", color: "text-purple-500", title: "Color Plus B" },
      "9": { label: "L9", color: "text-yellow-500", title: "Lucky 9" },
    };
    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };



  return (
    <div className="flex flex-col gap-1.5">
      {" "}
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
        {/* Player A Table */}
        <div>
          <div className="border border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
            <div className="flex flex-col">
              <span className="font-semibold">Player A</span>
            </div>
          </div>
          <table className="w-full bg-gray-50">
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 py-1">
                  <h2 className="text-sm font-semibold leading-8 text-black">
                    Winner
                  </h2>
                </th>
                <th className="border border-gray-300 px-2 py-1">
                  <h2 className="text-sm font-semibold leading-8 text-black">
                    High Card
                  </h2>
                </th>
                <th className="border border-gray-300 px-2 py-1">
                  <h2 className="text-sm font-semibold leading-8 text-black">
                    Pair
                  </h2>
                </th>
                <th className="border border-gray-300 px-2 py-1">
                  <h2 className="text-sm font-semibold leading-8 text-black">
                    Color Plus
                  </h2>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {renderBettingCell(playerAWinner, "back")}
                {renderBettingCell(playerAHighCard, "back")}
                {renderBettingCell(playerAPair, "back")}
                {renderBettingCell(playerAColorPlus, "back")}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Player B Table */}
        <div>
          <div className="border border-gray-300 px-2 py-1 text-left text-xs bg-gray-100">
            <div className="flex flex-col">
              <span className="font-semibold">Player B</span>
            </div>
          </div>
          <table className="w-full bg-gray-50">
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 py-1">
                  <h2 className="text-sm font-semibold leading-8 text-black">
                    Winner
                  </h2>
                </th>
                <th className="border border-gray-300 px-2 py-1">
                  <h2 className="text-sm font-semibold leading-8 text-black">
                    High Card
                  </h2>
                </th>
                <th className="border border-gray-300 px-2 py-1">
                  <h2 className="text-sm font-semibold leading-8 text-black">
                    Pair
                  </h2>
                </th>
                <th className="border border-gray-300 px-2 py-1">
                  <h2 className="text-sm font-semibold leading-8 text-black">
                    Color Plus
                  </h2>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {renderBettingCell(playerBWinner, "back")}
                {renderBettingCell(playerBHighCard, "back")}
                {renderBettingCell(playerBPair, "back")}
                {renderBettingCell(playerBColorPlus, "back")}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex p-2 border border-gray-300 justify-center items-center bg-gray-50">
        <img
          src="https://versionobj.ecoassetsservice.com/v80/static/front/img/lucky9.png"
          alt="Lucky 9"
          className="h-20"
        />
        <div className="flex items-center relative">
          <h2
            className={`min-w-20 bg-[var(--bg-back)] text-black text-center font-semibold leading-10 cursor-pointer relative `}
            onClick={() =>
              !isSuspended(lucky9) &&
              lucky9?.sid &&
              onBetClick(lucky9.sid.toString(), "back")
            }
          >
            {formatOdds(lucky9?.b)}
          </h2>
          <h2
            className={`min-w-20 bg-[var(--bg-lay)] text-black text-center font-semibold leading-10 cursor-pointer relative `}
            onClick={() =>
              !isSuspended(lucky9) &&
              lucky9?.sid &&
              onBetClick(lucky9.sid.toString(), "lay")
            }
          >
            {formatOdds(lucky9?.l)}
          </h2>
          {isSuspended(lucky9) && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
              <RiLockFill className="text-white text-lg" />
            </div>
          )}
        </div>
      </div>
      {/* Top 10 Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=${gameCode || "TEENS_IN"}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:underline"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any, index: number) => {
              const display = getResultDisplay(item.win);
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${display.color}`}
                  title={`Round ID: ${item.mid || "N/A"} - ${display.title}`}
                >
                  {display.label}
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-sm py-2">
              No results available
            </div>
          )}
        </div>
      </div>
      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={isModalOpen}
        onClose={closeModal}
        resultId={selectedResult?.mid}
        gameType={normalizedGameType}
        title={`${gameName || "Baccarat 29"} Result Details`}
        enableBetFiltering={true}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Baccarat29 = memoizeCasinoComponent(Baccarat29Component);
Baccarat29.displayName = "Baccarat29";

export default Baccarat29;
