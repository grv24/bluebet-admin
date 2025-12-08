import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const InstantWorliComponent = ({
  casinoData,
  remainingTime,
  results,
  gameCode,
  gameName,
}: {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}) => {
  const navigate = useNavigate();

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameCode for API calls (e.g., "WORLI2")
  const apiGameType = React.useMemo(() => {
    return gameCode || "WORLI2";
  }, [gameCode]);

  // Handle result click to open modal
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
    
    if (matchId && apiGameType) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
  };

  // Get odds data from sub array
  // Handle both new API format (data.sub) and legacy format (data.data.data.sub)
  const dataSource =
    casinoData?.data?.sub ||
    casinoData?.data?.current?.sub ||
    casinoData?.data?.data?.data?.sub ||
    casinoData?.data?.current?.data?.sub ||
    [];

  // Get odds data for a specific sid
  const getOddsData = (sid: number) => {
    if (!dataSource || !Array.isArray(dataSource)) return null;
    return (
      dataSource.find(
        (item: any) => item.sid === sid || String(item.sid) === String(sid)
      ) || null
    );
  };

  // Single status check for all betting options - check first item in sub array
  const isGameSuspended = React.useMemo(() => {
    const firstItem =
      dataSource && dataSource.length > 0 ? dataSource[0] : null;
    if (!firstItem) return true;

    const status = firstItem.gstatus;
    const isStatusSuspended =
      status === "SUSPENDED" ||
      status === "CLOSED" ||
      Number(status) === 0 ||
      status === "0" ||
      String(status) === "0";

    const isTimeSuspended = remainingTime <= 3;

    return isStatusSuspended || isTimeSuspended;
  }, [dataSource, remainingTime]);

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Get b1 value for singles (default to 9 when open)
  const getSinglesB1 = (sid: number) => {
    if (isGameSuspended) return "0";
    const oddsData = getOddsData(sid);
    if (!oddsData) return "9";
    return oddsData.b1 ? formatOdds(oddsData.b1) : "9";
  };

  // Get b1 value for fancy (default to 9 when open)
  const getFancyB1 = (sid: number) => {
    if (isGameSuspended) return "0";
    const oddsData = getOddsData(sid);
    if (!oddsData) return "9";
    return oddsData.b1 ? formatOdds(oddsData.b1) : "9";
  };

  // Fancy mapping: Line 1, Odd, Line 2, Even
  const FANCY_MAP: {
    [key: number]: { sid: number; label: string; number: string };
  } = {
    0: { sid: 11, label: "Line 1", number: "1 | 2 | 3 | 4 | 5" },
    1: { sid: 13, label: "Odd", number: "1 | 3 | 5 | 7 | 9" },
    2: { sid: 12, label: "Line 2", number: "6 | 7 | 8 | 9 | 0" },
    3: { sid: 14, label: "Even", number: "2 | 4 | 6 | 8 | 0" },
  };

  // Handle different result formats
  const processedResults = React.useMemo(() => {
    if (!results) return [];
    return Array.isArray(results) ? results : [];
  }, [results]);

  // Singles array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
  const singles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  return (
    <div className="flex flex-col gap-1.5 ">
      {/* odds */}
      <div className="grid grid-cols-12 gap-1 my-1 relative">
        {isGameSuspended && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 pointer-events-auto">
            <RiLockFill className="text-white text-xl" />
          </div>
        )}
        {/* singles */}
        <div className="col-span-8 w-full">
          {/* b1 */}
          <h2 className="flex justify-center items-center w-full font-semibold">
            {getSinglesB1(1)}
          </h2>
          <div className="grid grid-cols-5 gap-1 w-full">
            {singles.map((item: number, index: number) => {
              const sid = item === 0 ? 0 : item;

              return (
                <div
                  key={index}
                  className={`bg-[var(--bg-back)] flex justify-center items-center w-full relative ${
                    isGameSuspended
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <h2 className="lg:text-4xl text-xl py-4 font-normal casino-text">
                    {item}
                  </h2>
                </div>
              );
            })}
          </div>
        </div>
        {/* lines,odd,even (fancy) */}
        <div className="col-span-4 w-full">
          {/* b1 */}
          <h2 className="flex justify-center items-center w-full font-semibold">
            {getFancyB1(11)}
          </h2>
          <div className="grid grid-cols-2 gap-1 w-full">
            {Object.values(FANCY_MAP).map((fancy, index) => {
              return (
                <div
                  key={index}
                  className={`bg-[var(--bg-back)] flex flex-col py-2 justify-center items-center w-full relative ${
                    isGameSuspended
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <h2 className="lg:text-4xl text-xl  font-normal casino-text">
                    {fancy.label}
                  </h2>
                  <span className="md:text-xs text-[10px] text-black">{fancy.number}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${apiGameType}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(processedResults) &&
            processedResults.slice(0, 10).map((item: any, index: number) => {
              // Handle different result formats - worli results might have 'result' or 'win' field
              const resultValue = item?.result || item?.win || "";
              const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;

              return (
                <div
                  key={item?.mid || index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold text-yellow-400 ${
                    matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                  }`}
                  title={`R${matchId ? " - Click to view details" : ""}`}
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
                  {"R"}
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
        title={`${gameName || "Instant Worli"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const InstantWorli = memoizeCasinoComponent(InstantWorliComponent);
InstantWorli.displayName = "InstantWorli";

export default InstantWorli;
