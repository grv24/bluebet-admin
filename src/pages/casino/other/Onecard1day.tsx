import React, { useState, useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface Onecard1dayProps {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

const Onecard1dayComponent: React.FC<Onecard1dayProps> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
  gameName,
}) => {
  const navigate = useNavigate();

  // Get game slug from gameCode for navigation
  const gameSlug = gameCode || "";

  // Normalize gameCode to lowercase format (e.g., "TEEN_1" -> "teen1" or "ONECARD_1DAY" -> "onecard1day")
  const normalizedGameType = useMemo(() => {
    if (!gameCode) return undefined;
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

  // Profit/Loss calculation function


  // Get odds data for Player and Dealer
  const playerRow = getOddsData(1); // Player
  const dealerRow = getOddsData(2); // Dealer
  
  // Get odds data for 7 Up/Down betting options
  const playerUpRow = getOddsData(3); // 7 Up Player
  const playerDownRow = getOddsData(4); // 7 Down Player
  const dealerUpRow = getOddsData(5); // 7 Up Dealer
  const dealerDownRow = getOddsData(6); // 7 Down Dealer

  // Map win value to display info
  const getResultDisplay = (win: string) => {
    switch (win) {
      case "1":
        return { label: "P", color: "text-red-500", title: "Player" };
      case "2":
        return { label: "D", color: "text-yellow-500", title: "Dealer" };
      default:
        return { label: "N", color: "text-gray-400", title: "Unknown" };
    }
  };


  // Handle clicking on individual result to show details


  // Close the result details modal
  const closeModal = () => {
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
        {/* Player Table */}
        <table className="w-full border-collapse">
          <thead></thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                <div className="flex flex-col">
                  <span>Player</span>
                  <h2
                    className={`text-xs font-semibold ${
                        ? "text-green-600"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                  </h2>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center bg-[var(--bg-back)] relative"
                onClick={() =>
                }
              >
                {isSuspended(playerRow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerRow?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center bg-[var(--bg-lay)] relative"
                onClick={() =>
                }
              >
                {isSuspended(playerRow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(playerRow?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Dealer Table */}
        <table className="w-full border-collapse">
          <thead></thead>
          <tbody>
            {/* Main Row */}
            <tr className="hover:bg-gray-50">
              <td className="border px-2 py-2 border-gray-300 text-sm font-semibold">
                <div className="flex flex-col">
                  <span>Dealer</span>
                  <h2
                    className={`text-xs font-semibold ${
                        ? "text-green-600"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                  </h2>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center bg-[var(--bg-back)] relative"
                onClick={() =>
                }
              >
                {isSuspended(dealerRow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(dealerRow?.b)}</span>
                </div>
              </td>
              <td
                className="border px-2 py-2 border-gray-300 text-center bg-[var(--bg-lay)] relative"
                onClick={() =>
                }
              >
                {isSuspended(dealerRow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span>{formatOdds(dealerRow?.l)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="grid md:grid-cols-2 grid-cols-1 gap-1.5">
        {/* Player Up/Down Section */}
        <div className="border-2 border-[var(--bg-primary)] w-full flex justify-center gap-14 items-center relative">
          {/* 7 Down Player Button */}
          <div 
            className={`flex flex-col items-end justify-center w-full relative ${isSuspended(playerDownRow) ? 'opacity-50' : ''}`}
          >
            {isSuspended(playerDownRow) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 ">
                <RiLockFill className="text-white text-xl" />
              </div>
            )}
            <h2 className="text-xs font-semibold leading-4">{formatOdds(playerDownRow?.b)}</h2>
            <h2 className="text-sm uppercase">down</h2>
          </div>
          {/* 7 Icon */}
          <img 
            src="https://versionobj.ecoassetsservice.com/v80/static/front/img/trape-seven.png" 
            className="absolute -top-.5 md:left-50 left-42 md:w-12 w-10" 
            alt="7" 
          />
          {/* 7 Up Player Button */}
          <div 
            className={`flex flex-col items-start justify-center w-full relative ${isSuspended(playerUpRow) ? 'opacity-50' : ''}`}
          >
            {isSuspended(playerUpRow) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 ">
                <RiLockFill className="text-white text-xl" />
              </div>
            )}
            <h2 className="text-xs font-semibold leading-4">{formatOdds(playerUpRow?.b)}</h2>
            <h2 className="text-sm uppercase">Up</h2>
          </div>
        </div>
        
        {/* Dealer Up/Down Section */}
        <div className="border-2 border-[var(--bg-primary)] w-full flex justify-center gap-14 items-center relative">
          {/* 7 Down Dealer Button */}
          <div 
            className={`flex flex-col items-end justify-center w-full relative ${isSuspended(dealerDownRow) ? 'opacity-50' : ''}`}
          >
            {isSuspended(dealerDownRow) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 ">
                <RiLockFill className="text-white text-xl" />
              </div>
            )}
            <h2 className="text-xs font-semibold leading-4">{formatOdds(dealerDownRow?.b)}</h2>
            <h2 className="text-sm uppercase">down</h2>
          </div>
          {/* 7 Icon */}
          <img 
            src="https://versionobj.ecoassetsservice.com/v80/static/front/img/trape-seven.png" 
            className="absolute -top-.5 md:left-50 left-42 md:w-12 w-10" 
            alt="7" 
          />
          {/* 7 Up Dealer Button */}
          <div 
            className={`flex flex-col items-start justify-center w-full relative ${isSuspended(dealerUpRow) ? 'opacity-50' : ''}`}
          >
            {isSuspended(dealerUpRow) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                <RiLockFill className="text-white text-xl" />
              </div>
            )}
            <h2 className="text-xs font-semibold leading-4">{formatOdds(dealerUpRow?.b)}</h2>
            <h2 className="text-sm uppercase">Up</h2>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=${gameSlug}`)}
            className="text-sm font-normal leading-8 text-white hover:underline"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2">
          {Array.isArray(results) && results.length > 0 ? (
            results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${resultDisplay.color} `}
                  title={`Round ID: ${item.mid || "N/A"} - Winner: ${resultDisplay.title} - Click to view details`}
                >
                  {resultDisplay.label}
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

      {/* Result Details Modal */}</div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Onecard1day = memoizeCasinoComponent(Onecard1dayComponent);
Onecard1day.displayName = "Onecard1day";

export default Onecard1day;
