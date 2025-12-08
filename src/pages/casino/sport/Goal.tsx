import React, { useState, useMemo } from "react";
import { RiLockFill } from "react-icons/ri";
import IndividualResultModal from "@/components/modals/IndividualResultModal";
import { useNavigate } from "react-router-dom";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

interface GoalProps {
  casinoData: any;
  remainingTime: number;
  results: any;
  gameSlug?: string;
  gameName?: string;
}

const GoalComponent: React.FC<GoalProps> = ({
  casinoData,
  remainingTime,
  results,
  gameSlug = "goal",
  gameCode,
  gameName = "Goal",
}) => {
  const navigate = useNavigate();

  // Modal state for individual result details
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Keep original gameCode/gameSlug for API calls (e.g., "GOAL")
  const apiGameType = useMemo(() => {
    return gameCode || gameSlug?.toUpperCase() || "GOAL";
  }, [gameCode, gameSlug]);

  // Handle result click to open modal
  const handleResultClick = (item: any) => {
    // Extract matchId from result item
    const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
    
    if (matchId && apiGameType) {
      setSelectedResultId(String(matchId));
      setIsResultModalOpen(true);
    }
  };


  const getOddsData = (sid: string) => {
    // Handle new API response format (goal game)
    if (casinoData?.data?.sub) {
      return casinoData.data.sub.find(
        (item: any) => item.sid === parseInt(sid)
      );
    }
    // Handle legacy format
    if (!casinoData?.data?.data?.data?.sub) return null;
    return casinoData.data.data.data.sub.find(
      (item: any) => item.sid === parseInt(sid)
    );
  };



  const isSuspended = (sid: string) => {
    const oddsData = getOddsData(sid);
    return (
      oddsData?.gstatus === "SUSPENDED" ||
      oddsData?.gstatus === "1" ||
      String(oddsData?.gstatus) === "1" ||
      remainingTime <= 3
    );
  };

  // Get player odds (sid 1-10)
  const getPlayerOdds = () => {
    // Handle new API response format (goal game)
    if (casinoData?.data?.sub) {
      return casinoData.data.sub.filter(
        (item: any) => item.subtype === "player" && item.sid <= 10
      );
    }
    // Handle legacy format
    if (!casinoData?.data?.data?.data?.sub) return [];
    return casinoData.data.data.data.sub.filter(
      (item: any) => item.subtype === "player" && item.sid <= 10
    );
  };

  // Get goal method odds (sid 11-15)
  const getGoalMethodOdds = () => {
    // Handle new API response format (goal game)
    if (casinoData?.data?.sub) {
      return casinoData.data.sub.filter((item: any) => item.subtype === "goal");
    }
    // Handle legacy format
    if (!casinoData?.data?.data?.data?.sub) return [];
    return casinoData.data.data.data.sub.filter(
      (item: any) => item.subtype === "goal"
    );
  };

  const playerOdds = getPlayerOdds();
  const goalMethodOdds = getGoalMethodOdds();
  const remark =
    casinoData?.data?.remark ||
    casinoData?.data?.data?.data?.remark ||
    "Results are based on stream only";

  const getResultDisplay = (win: string) => {
    // Map win values to display names
    const resultMap: { [key: string]: string } = {
      "1": "CR7",
      "2": "Messi",
      "3": "Lewa",
      "4": "Neymar",
      "5": "Kane",
      "6": "Ibra",
      "7": "Lukaku",
      "8": "Mbappe",
      "9": "Haaland",
      "10": "No Goal",
      "11": "Shot",
      "12": "Header",
      "13": "Penalty",
      "14": "Free Kick",
      "15": "No Goal",
    };
    return resultMap[win] || win;
  };

  /**
   * Calculate profit/loss for individual Goal betting types with cross-calculation like Dragon/Tiger
   * @param betType - The type of bet to calculate profit/loss for (e.g., "CR7", "Messi", "Shot", "Header")
   * @param groupType - The group type: "player" or "method"
   * @returns The profit/loss amount with cross-calculation
   */


  console.log(results, "from goal");
  return (
    <div className="w-full flex flex-col gap-1">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-1">
        {/* Who Will Goal Next */}
        <div className="w-full bg-[var(--bg-table-row)]">
          <div className="border bg-[var(--bg-secondary85)] text-start text-white px-2 py-1">
            <h2 className="text-sm font-semibold">Who Will Goal Next?</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-1/2"></th>
                <th className="w-1/4 bg-[var(--bg-back)]">
                  <h2 className="text-xs font-semibold leading-8">Back</h2>
                </th>
                <th className="w-1/4"></th>
              </tr>
            </thead>
            <tbody>
              {playerOdds.map((player: any) => (
                <tr
                  key={player.sid}
                  className="border-b border-t border-gray-300"
                >
                  <td className="w-1/2">
                    <h2 className="text-sm font-semibold px-2">{player.nat}</h2>
                  </td>
                  <td
                    className="bg-[var(--bg-back)] text-sm font-semibold relative"
                  >
                    {isSuspended(player.sid.toString()) && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <span className="text-white">
                          <RiLockFill className="text-xl" />
                        </span>
                       
                      </div>
                    )}
                    <div className="flex flex-col justify-center items-center h-full">
                      <h2 className="text-sm font-semibold">
                        {player.b}
                      </h2>
                    
                    </div>
                  </td>
                  <td className="px-2">
                    <h2 className="text-[var(--bg-primary)] text-xs font-semibold">
                      Min {player.min}
                    </h2>
                    <h2 className="text-[var(--bg-primary)] text-xs font-semibold">
                      Max {player.max}
                    </h2>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Method Of Next Goal */}
        <div className="w-full bg-[var(--bg-table-row)]">
          <div className="border bg-[var(--bg-secondary85)] text-start text-white px-2 py-1">
            <h2 className="text-sm font-semibold">Method Of Next Goal</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-1/2"></th>
                <th className="w-1/4 bg-[var(--bg-back)]">
                  <h2 className="text-xs font-semibold leading-8">Back</h2>
                </th>
                <th className="w-1/4"></th>
              </tr>
            </thead>
            <tbody>
              {goalMethodOdds.map((method: any) => (
                <tr
                  key={method.sid}
                  className="border-b border-t border-gray-300"
                >
                  <td className="w-1/2">
                    <h2 className="text-sm font-semibold px-2">{method.nat}</h2>
                  </td>
                  <td
                    className="bg-[var(--bg-back)] relative hover:bg-blue-100"
                  >
                    {isSuspended(method.sid.toString()) && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <span className="text-white">
                          <RiLockFill className="text-xl" />
                        </span>
                      
                      </div>
                    )}
                    <div className="flex flex-col justify-center items-center h-full">
                      <h2 className="text-sm font-semibold">
                        {method.b}
                      </h2>
                    
                    </div>
                  </td>
                  <td className="px-2">
                    <h2 className="text-[var(--bg-primary)] text-xs font-semibold">
                      Min {method.min}
                    </h2>
                    <h2 className="text-[var(--bg-primary)] text-xs font-semibold">
                      Max {method.max}
                    </h2>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* marquee */}
      <div className="w-full  flex bg-white text-[var(--bg-primary)] overflow-hidden">
        <div className="whitespace-nowrap flex items-center text-xs h-6 font-extrabold uppercase tracking-wide animate-marquee">
          {remark}
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/reports/casino-result-report?game=${apiGameType}`)}
            className="text-sm font-normal leading-8 text-white"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results?.slice(0, 10).map((item: any, index: number) => {
              const matchId = item?.mid || item?.result?.mid || item?.roundId || item?.id || item?.matchId;
              return (
                <div
                  key={item?.mid || item?.roundId || index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold text-yellow-400 ${
                    matchId ? "cursor-pointer hover:scale-110 transition-transform select-none" : ""
                  }`}
                  title={`Round ID: ${item?.mid || "N/A"}${matchId ? " - Click to view details" : ""}`}
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
                  {/* {getResultDisplay(item?.win)} */}R
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
        title={`${gameName || "Goal"} Result Details`}
        enableBetFiltering={true}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Goal = memoizeCasinoComponent(GoalComponent);
Goal.displayName = "Goal";

export default Goal;
