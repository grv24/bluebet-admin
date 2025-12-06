import React from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const InstantWorliComponent = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameCode,
  gameName,
  currentBet,
}: {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameCode?: string;
  gameName?: string;
  currentBet?: any;
}) => {
  // const resultModal = useIndividualResultModal();
  const navigate = useNavigate();

  // Convert gameCode to gameSlug if gameCode is provided
  // gameCode format: "WORLI2" -> gameSlug format: "worli2"
  const actualGameSlug = React.useMemo(() => {
    if (gameCode) {
      return gameCode.toLowerCase();
    }
    return "worli2"; // Default fallback
  }, [gameCode]);

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

  // Handle bet click
  const handleBetClick = (sid: string, type: "back" | "lay") => {
    if (isGameSuspended) return;
    onBetClick(sid, type);
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

  // Handle clicking on individual result to show details
  const handleResultClick = (result: any) => {
    console.log("🎰 InstantWorli: handleResultClick called", {
      result,
      mid: result?.mid,
      roundId: result?.roundId,
      id: result?.id,
      allKeys: Object.keys(result || {}),
      gameSlug: actualGameSlug,
    });

    // Try to get result ID from different possible fields
    const resultId =
      result?.mid || result?.roundId || result?.id || result?.matchId;

    if (!resultId) {
      console.error("🎰 InstantWorli: No result ID found in result", result);
      alert("Unable to open result details: Missing result ID");
      return;
    }

    if (!actualGameSlug) {
      console.error("🎰 InstantWorli: No gameSlug available", {
        gameCode,
        actualGameSlug,
      });
      alert("Unable to open result details: Missing game type");
      return;
    }

    console.log("🎰 InstantWorli: Opening modal with", {
      resultId: String(resultId),
      gameSlug: actualGameSlug,
    });
    // resultModal.openModal(String(resultId), result);
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
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:opacity-80 transition-opacity"
                  }`}
                  onClick={() => handleBetClick(String(sid), "back")}
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
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:opacity-80 transition-opacity"
                  }`}
                  onClick={() => handleBetClick(String(fancy.sid), "back")}
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
            onClick={() =>
              navigate(`/casino-result?game=${gameCode || "WORLI2"}`)
            }
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

              return (
                <h2
                  key={index}
                  className="h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold text-yellow-400 cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleResultClick(item)}
                  title="Click to view details"
                >
                  {"R"}
                </h2>
              );
            })}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={actualGameSlug}
        title="Instant Worli Result"
        enableBetFiltering={true}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const InstantWorli = memoizeCasinoComponent(InstantWorliComponent);
InstantWorli.displayName = "InstantWorli";

export default InstantWorli;
