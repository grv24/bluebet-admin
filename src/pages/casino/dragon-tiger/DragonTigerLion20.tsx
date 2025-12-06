import { getNumberCard } from "@/utils/card";
import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";

type TabType = "Dragon" | "Tiger" | "Lion";

const DragonTigerLion20Component: React.FC<{
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: string) => void;
  results: any[];
  gameName: string;
  gameSlug: string;
  currentBet: any;
}> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameName,
  gameSlug,
  currentBet,
}) => {
  const navigate = useNavigate();
  const resultModal = useIndividualResultModal();
  const [selectedTab, setSelectedTab] = useState<TabType>("Dragon");

  // Convert gameSlug to actual game slug format if needed
  const actualGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "dtl20"; // Default fallback
  }, [gameSlug]);

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
    const resultId =
      result?.mid || result?.roundId || result?.id || result?.matchId;

    if (!resultId) {
      console.error(
        "🎰 DragonTigerLion20: No result ID found in result",
        result
      );
      return;
    }

    if (!actualGameSlug) {
      console.error("🎰 DragonTigerLion20: No gameSlug available", {
        gameSlug,
        actualGameSlug,
      });
      return;
    }

    resultModal.openModal(String(resultId), result);
  };

  // Handle both new API format (casinoData?.data?.sub) and legacy format
  const t2: any[] =
    casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];

  const getByNat = (name: string) => {
    return t2.find(
      (x) =>
        String(x?.nat || x?.nation || "").toLowerCase() === name.toLowerCase()
    );
  };

  const isSuspended = (odds: any) => {
    const status = odds?.gstatus as string | number | undefined;
    const isStatusSuspended =
      status === "SUSPENDED" || status === "1" || status === 1;
    return isStatusSuspended || remainingTime <= 3;
  };

  // Map win values to display labels
  const getWinLabel = (win: string) => {
    const winMap: Record<string, string> = {
      "1": "D",
      "21": "T",
      "41": "L",
    };
    return winMap[win] || win;
  };

  // First table rows: Winner, Black, Red, Odd, Even, A, 2, 3, 4
  const firstTableRows = [
    {
      label: "Winner",
      dragon: "Winner D",
      tiger: "Winner T",
      lion: "Winner L",
    },
    { label: "Black", dragon: "Black D", tiger: "Black T", lion: "Black L" },
    { label: "Red", dragon: "Red D", tiger: "Red T", lion: "Red L" },
    { label: "Odd", dragon: "Odd D", tiger: "Odd T", lion: "Odd L" },
    { label: "Even", dragon: "Even D", tiger: "Even T", lion: "Even L" },
    {
      label: "A",
      dragon: "Dragon A",
      tiger: "Tiger A",
      lion: "Lion A",
      isCard: true,
    },
    {
      label: "2",
      dragon: "Dragon 2",
      tiger: "Tiger 2",
      lion: "Lion 2",
      isCard: true,
    },
    {
      label: "3",
      dragon: "Dragon 3",
      tiger: "Tiger 3",
      lion: "Lion 3",
      isCard: true,
    },
    {
      label: "4",
      dragon: "Dragon 4",
      tiger: "Tiger 4",
      lion: "Lion 4",
      isCard: true,
    },
  ];

  // Second table rows: 5, 6, 7, 8, 9, 10, J, Q, K
  const secondTableRows = [
    {
      label: "5",
      dragon: "Dragon 5",
      tiger: "Tiger 5",
      lion: "Lion 5",
      isCard: true,
    },
    {
      label: "6",
      dragon: "Dragon 6",
      tiger: "Tiger 6",
      lion: "Lion 6",
      isCard: true,
    },
    {
      label: "7",
      dragon: "Dragon 7",
      tiger: "Tiger 7",
      lion: "Lion 7",
      isCard: true,
    },
    {
      label: "8",
      dragon: "Dragon 8",
      tiger: "Tiger 8",
      lion: "Lion 8",
      isCard: true,
    },
    {
      label: "9",
      dragon: "Dragon 9",
      tiger: "Tiger 9",
      lion: "Lion 9",
      isCard: true,
    },
    {
      label: "10",
      dragon: "Dragon 10",
      tiger: "Tiger 10",
      lion: "Lion 10",
      isCard: true,
    },
    {
      label: "J",
      dragon: "Dragon J",
      tiger: "Tiger J",
      lion: "Lion J",
      isCard: true,
    },
    {
      label: "Q",
      dragon: "Dragon Q",
      tiger: "Tiger Q",
      lion: "Lion Q",
      isCard: true,
    },
    {
      label: "K",
      dragon: "Dragon K",
      tiger: "Tiger K",
      lion: "Lion K",
      isCard: true,
    },
  ];

  // Helper function to get the selected column to display based on selected tab
  const getMobileColumn = (): { name: string; key: "dragon" | "tiger" | "lion" } => {
    switch (selectedTab) {
      case "Dragon":
        return { name: "Dragon", key: "dragon" };
      case "Tiger":
        return { name: "Tiger", key: "tiger" };
      case "Lion":
        return { name: "Lion", key: "lion" };
      default:
        return { name: "Dragon", key: "dragon" };
    }
  };

  // Render a table row for mobile with single selected column
  const renderMobileTableRow = (row: any, idx: number) => {
    const selectedColumn = getMobileColumn();

    // Get the API name for the selected column
    const apiName = row[selectedColumn.key] as string;
    const odds = getByNat(apiName);
    const isLocked = isSuspended(odds);

    return (
      <tr key={idx}>
        <td className="border border-gray-300">
          {row.isCard ? (
            <img
              src={getNumberCard(row.label)}
              className="md:w-7 w-6 py-1 object-cover ms-2"
              alt={row.label}
            />
          ) : (
            <div className="px-2 py-2 leading-8">{row.label}</div>
          )}
        </td>
        <td
          className="relative border px-2 py-2 bg-[var(--bg-back)] min-h-6 border-gray-100 cursor-pointer"
          onClick={() =>
            !isLocked &&
            odds?.sid &&
            onBetClick(String(odds.sid), "back")
          }
        >
          {isLocked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <RiLockFill className="text-white text-xl" />
            </div>
          )}
          <h2 className="px-1 leading-6 flex items-center justify-center text-xs">
            {odds?.b || 0}
          </h2>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-1 py-1">
      {/* Tab Switcher */}
      <div className="lg:hidden flex justify-start items-start bg-gray-100 w-full border-b border-gray-300">
        <button
          onClick={() => setSelectedTab("Dragon")}
          className={`border-r border-gray-300 px-4 py-2 text-sm font-semibold transition-colors ${
            selectedTab === "Dragon"
              ? "bg-[var(--bg-secondary85)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Dragon
        </button>
        <button
          onClick={() => setSelectedTab("Tiger")}
          className={`border-r border-gray-300 px-4 py-2 text-sm font-semibold transition-colors ${
            selectedTab === "Tiger"
              ? "bg-[var(--bg-secondary85)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tiger
        </button>
        <button
          onClick={() => setSelectedTab("Lion")}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            selectedTab === "Lion"
              ? "bg-[var(--bg-secondary85)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Lion
        </button>
      </div>

      {/* Desktop View - Show all columns */}
      <div className="lg:grid grid-cols-2 hidden gap-1">
        {/* First Table */}
        <div className="col-span-1">
          <table className="bg-[var(--bg-table-row)] w-full">
            <thead>
              <tr>
                <th className="w-1/2 border border-gray-300"></th>
                <th className="bg-[var(--bg-back)] px-4 border border-gray-100">
                  <span className="px-2 leading-6">Dragon</span>
                </th>
                <th className="bg-[var(--bg-back)] px-4 border border-gray-100">
                  <span className="px-2 leading-6">Tiger</span>
                </th>
                <th className="bg-[var(--bg-back)] px-4 border border-gray-100">
                  <span className="px-2 leading-6">Lion</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {firstTableRows.map((row, idx) => {
                const dragonOdds = getByNat(row.dragon);
                const tigerOdds = getByNat(row.tiger);
                const lionOdds = getByNat(row.lion);

                const dragonLocked = isSuspended(dragonOdds);
                const tigerLocked = isSuspended(tigerOdds);
                const lionLocked = isSuspended(lionOdds);

                return (
                  <tr key={idx}>
                    <td className="border border-gray-300">
                      {row.isCard ? (
                        <img
                          src={getNumberCard(row.label)}
                          className="md:w-7 w-6 py-1 object-cover ms-2"
                          alt={row.label}
                        />
                      ) : (
                        <div className="px-2 py-2 leading-8">{row.label}</div>
                      )}
                    </td>
                    <td
                      className="relative border px-4 py-2 bg-[var(--bg-back)] min-h-6 border-gray-100 cursor-pointer"
                      onClick={() =>
                        !dragonLocked &&
                        dragonOdds?.sid &&
                        onBetClick(String(dragonOdds.sid), "back")
                      }
                    >
                      {dragonLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <h2 className="px-2 leading-6 flex items-center justify-center">
                        {dragonOdds?.b || 0}
                      </h2>
                    </td>
                    <td
                      className="relative border px-4 py-2 bg-[var(--bg-back)] border-gray-100 cursor-pointer"
                      onClick={() =>
                        !tigerLocked &&
                        tigerOdds?.sid &&
                        onBetClick(String(tigerOdds.sid), "back")
                      }
                    >
                      {tigerLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <h2 className="px-2 leading-6 flex items-center justify-center">
                        {tigerOdds?.b || 0}
                      </h2>
                    </td>
                    <td
                      className="relative border px-4 py-2 bg-[var(--bg-back)] border-gray-100 cursor-pointer"
                      onClick={() =>
                        !lionLocked &&
                        lionOdds?.sid &&
                        onBetClick(String(lionOdds.sid), "back")
                      }
                    >
                      {lionLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <h2 className="px-2 leading-6 flex items-center justify-center">
                        {lionOdds?.b || 0}
                      </h2>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Second Table */}
        <div className="col-span-1">
          <table className="bg-[var(--bg-table-row)] w-full">
            <thead>
              <tr>
                <th className="w-1/2 border border-gray-300"></th>
                <th className="bg-[var(--bg-back)] px-4 border border-gray-100">
                  <span className="px-2 leading-6">Dragon</span>
                </th>
                <th className="bg-[var(--bg-back)] px-4 border border-gray-100">
                  <span className="px-2 leading-6">Tiger</span>
                </th>
                <th className="bg-[var(--bg-back)] px-4 border border-gray-100">
                  <span className="px-2 leading-6">Lion</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {secondTableRows.map((row, idx) => {
                const dragonOdds = getByNat(row.dragon);
                const tigerOdds = getByNat(row.tiger);
                const lionOdds = getByNat(row.lion);

                const dragonLocked = isSuspended(dragonOdds);
                const tigerLocked = isSuspended(tigerOdds);
                const lionLocked = isSuspended(lionOdds);

                return (
                  <tr key={idx}>
                    <td className="border border-gray-300">
                      <img
                        src={getNumberCard(row.label)}
                        className="md:w-7 w-6 py-1 object-cover ms-2"
                        alt={row.label}
                      />
                    </td>
                    <td
                      className="relative border px-4 py-2 bg-[var(--bg-back)] min-h-6 border-gray-100 cursor-pointer"
                      onClick={() =>
                        !dragonLocked &&
                        dragonOdds?.sid &&
                        onBetClick(String(dragonOdds.sid), "back")
                      }
                    >
                      {dragonLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <h2 className="px-2 leading-6 flex items-center justify-center">
                        {dragonOdds?.b || 0}
                      </h2>
                    </td>
                    <td
                      className="relative border px-4 py-2 bg-[var(--bg-back)] border-gray-100 cursor-pointer"
                      onClick={() =>
                        !tigerLocked &&
                        tigerOdds?.sid &&
                        onBetClick(String(tigerOdds.sid), "back")
                      }
                    >
                      {tigerLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <h2 className="px-2 leading-6 flex items-center justify-center">
                        {tigerOdds?.b || 0}
                      </h2>
                    </td>
                    <td
                      className="relative border px-4 py-2 bg-[var(--bg-back)] border-gray-100 cursor-pointer"
                      onClick={() =>
                        !lionLocked &&
                        lionOdds?.sid &&
                        onBetClick(String(lionOdds.sid), "back")
                      }
                    >
                      {lionLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <RiLockFill className="text-white text-xl" />
                        </div>
                      )}
                      <h2 className="px-2 leading-6 flex items-center justify-center">
                        {lionOdds?.b || 0}
                      </h2>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Mobile View - Show selected column only */}
      <div className="lg:hidden grid grid-cols-2 gap-1">
        {/* First Table - Mobile */}
        <div className="col-span-1">
          <table className="bg-[var(--bg-table-row)] w-full">
            <thead>
              <tr>
                <th className="w-1/2 border border-gray-300"></th>
                <th className="bg-[var(--bg-back)] px-2 border border-gray-100">
                  <span className="px-1 leading-6 text-xs whitespace-nowrap">{getMobileColumn().name}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {firstTableRows.map((row, idx) => renderMobileTableRow(row, idx))}
            </tbody>
          </table>
        </div>

        {/* Second Table - Mobile */}
        <div className="col-span-1">
          <table className="bg-[var(--bg-table-row)] w-full">
            <thead>
              <tr>
                <th className="w-1/2 border border-gray-300"></th>
                <th className="bg-[var(--bg-back)] px-2 border border-gray-100">
                  <span className="px-1 leading-6 text-xs whitespace-nowrap">{getMobileColumn().name}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {secondTableRows.map((row, idx) => renderMobileTableRow(row, idx))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=DRAGON_TIGER_LION_20`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {results?.slice(0, 10).map((item: any, index: number) => (
            <h2
              key={index}
              className={`h-7 w-7  bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.win == "1" ? "text-red-500" : item.win == "21" ? "text-yellow-500" : "text-green-500"} cursor-pointer hover:scale-110 transition-transform`}
              onClick={() => handleResultClick(item)}
              title="Click to view details"
            >
              {getWinLabel(String(item.win || ""))}
            </h2>
          ))}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={actualGameSlug}
        title={`${gameName || "Dragon Tiger Lion 20"} Result Details`}
        customGetFilteredBets={getFilteredBets}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const DragonTigerLion20 = memoizeCasinoComponent(DragonTigerLion20Component);
DragonTigerLion20.displayName = "DragonTigerLion20";

export default DragonTigerLion20;
