import React, { useMemo, useState } from "react";
// import { PlaceBetUseContext } from "@/context/placebet";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { RiLockFill } from "react-icons/ri";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";

interface CasinoMeter1Props {
  casinoData: any;
  remainingTime: number;
  results?: any[];
  gameCode?: string;
  gameName?: string;
}

/**
 * Status values that indicate a betting market is locked/closed
 */
const LOCKED_STATUSES = ["CLOSED", "SUSPENDED", "Starting Soon.", "Ball Running", "INACTIVE"];

/**
 * Check if a status is locked
 */
const isStatusLocked = (status: string): boolean => {
  return LOCKED_STATUSES.includes(status);
};


const CasinoMeter1Component: React.FC<CasinoMeter1Props> = ({
  casinoData,
  remainingTime,
  results = [],
  gameCode,
  gameName,
}) => {
  const navigate = useNavigate();
  // Betting context disabled for admin view
  // const placeBetContext = useContext(PlaceBetUseContext);
  // const { setPlaceBet, setBetData, setLatestBetData } = placeBetContext || {};

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Get odds data from sub array (API format) or current.sub (socket format)
  const oddsData = useMemo(() => {
    return casinoData?.data?.current?.sub || casinoData?.data?.sub || [];
  }, [casinoData]);

  // Get Fighter A and Fighter B from odds data
  const fighterA = useMemo(() => {
    return oddsData.find((item: any) => item.sid === 1 || item.sr === 1) || null;
  }, [oddsData]);

  const fighterB = useMemo(() => {
    return oddsData.find((item: any) => item.sid === 2 || item.sr === 2) || null;
  }, [oddsData]);

  // Get match ID
  const matchId = useMemo(() => {
    return (
      casinoData?.data?.current?.mid ||
      casinoData?.data?.mid ||
      null
    );
  }, [casinoData]);

  // Check if betting is locked
  const isFighterALocked = fighterA
    ? isStatusLocked(fighterA.gstatus || "") || remainingTime <= 3
    : true;
  const isFighterBLocked = fighterB
    ? isStatusLocked(fighterB.gstatus || "") || remainingTime <= 3
    : true;

  // Format odds display
  const formatOdds = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === 0) return "0";
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";
    return num.toFixed(2);
  };

  // Handle bet click - disabled for admin view
  const handleBetClick = (fighter: any, betType: "back" | "lay") => {
    // Betting functionality disabled for admin view
    return;
    // if (!setPlaceBet || !setBetData || !setLatestBetData) {
    //   return;
    // }

    const oddsValue = betType === "back" ? fighter.b : fighter.l || 0;

    const betData = {
      sid: fighter.sid,
      rname: fighter.nat,
      mid: matchId,
      market: "Fancy",
      mname: "Fancy",
      mstatus: fighter.gstatus || "OPEN",
      status: fighter.gstatus,
      gtype: casinoData?.data?.gtype || casinoData?.data?.current?.gtype || "cmeter1",
      isPlay: true,
      odd: parseFloat(String(oddsValue)),
      stake: 0,
      profit: 0,
      loss: 0,
      oddType: "fancy",
      marketType: "fancyOdds",
      betType: betType,
      betName: fighter.nat,
      boxColor: "",
      matchOddVariant: "",
      matchOdd: parseFloat(String(oddsValue)),
      betRate: 0,
      oddCategory: betType === "back" ? "Yes" : "No",
      oddSubType: "cmeter1",
      otherInfo: {},
      name: fighter.nat,
      sportType: "cricket",
    };

    // Betting functionality disabled for admin view
    // setBetData(betData);
    // setLatestBetData(betData);
    // setPlaceBet(true);
  };

  // Keep original gameCode for API calls (e.g., "CASINO_METER_1")
  const apiGameType = React.useMemo(() => {
    return gameCode || "CASINO_METER_1";
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


  // Map win value to display info
  const getResultDisplay = (win: string) => {
    const winMap: {
      [key: string]: { label: string; color: string; title: string };
    } = {
      "1": { label: "A", color: "text-red-600", title: "Fighter A" },
      "2": { label: "B", color: "text-yellow-500", title: "Fighter B" },
    };

    return (
      winMap[win] || { label: win, color: "text-gray-400", title: "Unknown" }
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid md:grid-cols-2 grid-cols-1 gap-2 py-1">
        {/* Fighter A */}
        <div
          onClick={() =>
            !isFighterALocked &&
            fighterA?.b &&
            fighterA.b !== "0.0" &&
            fighterA.b !== 0 &&
            handleBetClick(fighterA, "back")
          }
          className={`bg-[var(--bg-back)] flex border-2 border-red-600 justify-center items-center gap-2 relative ${
            !isFighterALocked && fighterA?.b && fighterA.b !== "0.0" && fighterA.b !== 0
              ? "hover:opacity-90"
              : ""
          }`}
        >
          {isFighterALocked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <RiLockFill className="text-white text-lg" />
            </div>
          )}
          <h2 className="text-lg font-semibold text-black text-center leading-14 uppercase">
            {fighterA?.nat || "Fighter A"}
          </h2>
          <div>
            <img
              src="https://versionobj.ecoassetsservice.com/v81/static/front/img/fight.png"
              alt="Fighter A"
              className="w-10 h-full object-cover md:rotate-90 rotate-180"
            />
          </div>
          {/* Odds Display */}
          {/* {fighterA && (
            <div className="absolute bottom-0 left-0 right-0 flex border-t border-gray-300">
              <div
                className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] ${
                  !isFighterALocked && fighterA.b ? "hover:opacity-90" : ""
                }`}
                onClick={() =>
                  !isFighterALocked &&
                  fighterA.b &&
                  fighterA.b !== "0.0" &&
                  fighterA.b !== 0 &&
                  handleBetClick(fighterA, "back")
                }
              >
                {formatOdds(fighterA.b)}
              </div>
            </div>
          )} */}
        </div>

        {/* Fighter B */}
        <div
          onClick={() =>
            !isFighterBLocked &&
            fighterB?.b &&
            fighterB.b !== "0.0" &&
            fighterB.b !== 0 &&
            handleBetClick(fighterB, "back")
          }
          className={`bg-[var(--bg-back)] border-2 border-yellow-400 flex justify-center items-center gap-2 relative ${
            !isFighterBLocked && fighterB?.b && fighterB.b !== "0.0" && fighterB.b !== 0
              ? "hover:opacity-90"
              : ""
          }`}
        >
          {isFighterBLocked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <RiLockFill className="text-white text-lg" />
            </div>
          )}
          <div>
            <img
              src="https://versionobj.ecoassetsservice.com/v81/static/front/img/fight.png"
              alt="Fighter B"
              className="w-10 h-full object-cover md:-rotate-90 rotate-0"
            />
          </div>
          <h2 className="text-lg font-semibold text-black text-center leading-14 uppercase">
            {fighterB?.nat || "Fighter B"}
          </h2>
          {/* Odds Display */}
          {/* {fighterB && (
            <div className="absolute bottom-0 left-0 right-0 flex border-t border-gray-300">
              <div
                className={`text-sm w-full font-semibold text-black text-center leading-10 bg-[var(--bg-back)] ${
                  !isFighterBLocked && fighterB.b ? "hover:opacity-90" : ""
                }`}
                onClick={() =>
                  !isFighterBLocked &&
                  fighterB.b &&
                  fighterB.b !== "0.0" &&
                  fighterB.b !== 0 &&
                  handleBetClick(fighterB, "back")
                }
              >
                {formatOdds(fighterB.b)}
              </div>
            </div>
          )} */}
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-0.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <button
            onClick={() => navigate(`/reports/casino-result-report?game=${apiGameType}`)}
            className="text-xs text-white hover:underline"
          >
            View All
          </button>
        </div>
        <div className="flex justify-end items-center mb-2 gap-2 mx-2 flex-wrap">
          {results && results.length > 0 ? (
            results.slice(0, 10).map((item: any, index: number) => {
              const resultDisplay = getResultDisplay(item.win || "");
              const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
              return (
                <div
                  key={item.mid || `result-${item.win}-${index}`}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-xs font-semibold ${resultDisplay.color} ${
                    matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                  }`}
                  title={`Round ID: ${item.mid || "N/A"} - ${resultDisplay.title}${matchId ? " - Click to view details" : ""}`}
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
                  {resultDisplay.label}
                </div>
              );
            })
          ) : (
            <div className="text-xs text-gray-400 py-2">No results available</div>
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
        title={`${gameName || "1 Card Meter"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const CasinoMeter1 = memoizeCasinoComponent(CasinoMeter1Component);
CasinoMeter1.displayName = "CasinoMeter1";

export default CasinoMeter1;
