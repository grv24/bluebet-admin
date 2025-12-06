import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const Teenpatti9Component = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug,
  gameName,
  currentBet,
}: {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: string) => void;
  results: any[];
  gameSlug: string;
  gameName: string;
  currentBet: any;
}) => {
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Normalize game type
  const normalizedGameType = React.useMemo(() => {
    if (gameSlug) {
      // Convert "TEEN_9" -> "teen9"
      return gameSlug.toLowerCase().replace(/_/g, "");
    }
    return "teen9"; // Default fallback
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

  // Handle both new and legacy data structures for Teen9
  const t2: any[] =
    casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];

  /**
   * Calculate profit/loss for individual Teen9 betting types
   * @param betType - The type of bet to calculate profit/loss for (e.g., "Tiger Winner", "Lion Pair", "Dragon Flush", etc.)
   * @param groupType - The group type: "tiger-lion-dragon" or "winner-pair-flush-straight-trio-straight-flush"
   * @returns The profit/loss amount (only profit is displayed)
   */
  const getBetProfitLoss = (
    betType: string,
    groupType:
      | "tiger-lion-dragon"
      | "winner-pair-flush-straight-trio-straight-flush"
  ): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, oddCategory, stake, betRate } = bet.betData;

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      // Check if this bet matches the current bet type
      let isMatch = false;

      if (groupType === "tiger-lion-dragon") {
        // Handle Tiger/Lion/Dragon bets - each animal is independent
        // Extract the bet type (Winner, Pair, Flush, etc.) from betType
        const betTypeParts = normalizedBetType.split(" ");
        const animal = betTypeParts[0]; // tiger, lion, dragon
        const betCategory = betTypeParts.slice(1).join(" "); // winner, pair, flush, etc.

        // Extract the bet type from betName
        const betNameParts = normalizedBetName.split(" ");
        const betNameAnimal = betNameParts[0]; // tiger, lion, dragon
        const betNameCategory = betNameParts.slice(1).join(" "); // winner, pair, flush, etc.

        // Only match exact same animal and same category (no cross-calculation)
        if (animal === betNameAnimal && betCategory === betNameCategory) {
          isMatch = true;
        }
      } else if (
        groupType === "winner-pair-flush-straight-trio-straight-flush"
      ) {
        // Handle Winner/Pair/Flush/Straight/Trio/Straight Flush bets - each is independent
        if (
          normalizedBetType.includes("winner") &&
          normalizedBetName.includes("winner")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("pair") &&
          normalizedBetName.includes("pair")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("flush") &&
          normalizedBetName.includes("flush")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("straight") &&
          normalizedBetName.includes("straight")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("trio") &&
          normalizedBetName.includes("trio")
        ) {
          isMatch = true;
        } else if (
          normalizedBetType.includes("straight flush") &&
          normalizedBetName.includes("straight flush")
        ) {
          isMatch = true;
        }
      }

      if (isMatch) {
        if (groupType === "tiger-lion-dragon") {
          // Tiger/Lion/Dragon bets: each animal is independent (profit-only display)
          if (oddCategory.toLowerCase() === "back") {
            const profit = stake * (betRate - 1);
            profitLoss += profit; // Show profit potential only
          } else if (oddCategory.toLowerCase() === "lay") {
            const loss = stake * (betRate - 1);
            const profit = stake;
            profitLoss += profit - loss; // Show net profit/loss
          }
        } else if (
          groupType === "winner-pair-flush-straight-trio-straight-flush"
        ) {
          // Winner/Pair/Flush/Straight/Trio/Straight Flush bets: independent (profit-only display)
          if (oddCategory.toLowerCase() === "back") {
            const profit = stake * (betRate - 1);
            profitLoss += profit; // Show profit potential only
          } else if (oddCategory.toLowerCase() === "lay") {
            const loss = stake * (betRate - 1);
            const profit = stake;
            profitLoss += profit - loss; // Show net profit/loss
          }
        }
      }
    });

    return profitLoss;
  };

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    if (!result?.mid) return;
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  /**
   * Close the result details modal
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  // Debug: Log the data access path
  console.log("🎰 Teen9 Data access debug:", {
    hasData: !!casinoData,
    hasDataSub: !!casinoData?.data?.sub,
    hasDataDataData: !!casinoData?.data?.data?.data,
    hasT2: !!casinoData?.data?.data?.data?.t2,
    t2Length: t2.length,
    t2Data: t2,
  });

  // normalize nation names and build lookup
  const markets: Record<string, any> = t2.reduce(
    (acc: Record<string, any>, m: any) => {
      const key = String(m.nat || m.nation || "")
        .trim()
        .toLowerCase();
      acc[key] = m;
      return acc;
    },
    {}
  );

  // Debug: Log the raw nation names to see the exact values
  console.log(
    "🎰 Teen9 Raw nation names:",
    t2.map((m) => ({
      nation: m.nation,
      trimmed: String(m.nation || "").trim(),
    }))
  );

  const isCellSuspended = (status: any) => {
    const s = String(status).toLowerCase();
    // For Teen9, "SUSPENDED" means suspended, "OPEN" means active
    return (
      s === "suspended" ||
      s === "closed" ||
      s === "false" ||
      s === "0" ||
      remainingTime <= 3
    );
  };

  const renderCell = (
    rate: string | number,
    sid: string,
    status: any,
    betType: string,
    groupType:
      | "tiger-lion-dragon"
      | "winner-pair-flush-straight-trio-straight-flush"
  ) => {
    const suspended = isCellSuspended(status);
    const profitLoss = getBetProfitLoss(betType, groupType);

    return (
      <td
        className={`border border-gray-300 relative bg-[var(--bg-back)] ${!suspended && sid ? "cursor-pointer" : ""}`}
        onClick={() => {
          console.log("🎰 Teen9 Cell clicked:", {
            sid,
            rate,
            status,
            suspended,
          });

          if (!suspended && sid) {
            console.log("🎰 Teen9 Bet Click:", {
              sid,
              rate,
              status,
              suspended,
              rateValue: rate,
            });
            onBetClick(String(sid), "back");
          } else {
            console.log("🎰 Teen9 Bet Click blocked:", {
              sid,
              rate,
              status,
              suspended,
              reason: suspended ? "suspended" : "no sid",
            });
          }
        }}
      >
        {suspended && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <RiLockFill className="text-white text-xl" />
            <h2
              className={`text-xs font-semibold text-center ${
                profitLoss > 0 ? "text-green-600" : "text-gray-600"
              }`}
            >
              {profitLoss > 0 ? "+" : ""}
              {profitLoss.toFixed(0)}
            </h2>
          </div>
        )}
        <div className="h-10 flex flex-col items-center justify-center text-sm font-semibold">
          <h2 className="text-sm font-semibold">{rate || "0"}</h2>
          <h2
            className={`text-xs font-semibold ${
              profitLoss > 0 ? "text-green-600" : "text-gray-600"
            }`}
          >
            {profitLoss > 0 ? "+" : ""}
            {profitLoss.toFixed(0)}
          </h2>
        </div>
      </td>
    );
  };

  const rows = [
    {
      label: "Winner",
      tigerKey: "tiger winner",
      lionKey: "lion winner",
      dragonKey: "dragon winner",
    },
    {
      label: "Pair",
      tigerKey: "tiger pair",
      lionKey: "lion pair",
      dragonKey: "dragon pair",
    },
    {
      label: "Flush",
      tigerKey: "tiger flush",
      lionKey: "lion flush",
      dragonKey: "dragon flush",
    },
    {
      label: "Straight",
      tigerKey: "tiger straight",
      lionKey: "lion straight",
      dragonKey: "dragon straight",
    },
    {
      label: "Trio",
      tigerKey: "tiger trio",
      lionKey: "lion trio",
      dragonKey: "dragon trio",
    },
    {
      label: "Straight Flush",
      tigerKey: "tiger straight flush",
      lionKey: "lion straight flush",
      dragonKey: "dragon straight flush",
    },
  ];

  const getMarket = (key: string) => markets[key] || {};

  // Debug: Test each row key lookup
  rows.forEach((row) => {
    const tigerFound = getMarket(row.tigerKey);
    const lionFound = getMarket(row.lionKey);
    const dragonFound = getMarket(row.dragonKey);
    console.log(`🎰 Teen9 Row lookup for "${row.label}":`, {
      tiger: tigerFound,
      lion: lionFound,
      dragon: dragonFound,
    });
  });

  // Debug: Log the markets data structure
  console.log("🎰 Teen9 markets data:", markets);
  console.log("🎰 Teen9 t2 data:", t2);
  console.log("🎰 Teen9 casinoData:", casinoData);
  console.log("🎰 Teen9 results data:", results);

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="w-full bg-[var(--bg-table)] border border-gray-100">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 w-5/12"></th>
              <th className="border border-gray-300 bg-[var(--bg-back)]">
                <h2 className="text-sm font-semibold leading-6">Tiger</h2>
              </th>
              <th className="border border-gray-300 bg-[var(--bg-back)]">
                <h2 className="text-sm font-semibold leading-6">Lion</h2>
              </th>
              <th className="border border-gray-300 bg-[var(--bg-back)]">
                <h2 className="text-sm font-semibold leading-6">Dragon</h2>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const tigerMarket = getMarket(r.tigerKey);
              const lionMarket = getMarket(r.lionKey);
              const dragonMarket = getMarket(r.dragonKey);
              return (
                <tr key={r.label}>
                  <td className="border border-gray-300 w-5/12 py-1">
                    <h2 className="text-sm font-semibold leading-6 px-1">
                      {r.label}
                    </h2>
                  </td>
                  {renderCell(
                    tigerMarket?.b || tigerMarket?.rate,
                    tigerMarket?.sid,
                    tigerMarket?.gstatus,
                    `Tiger ${r.label}`,
                    "tiger-lion-dragon"
                  )}
                  {renderCell(
                    lionMarket?.b || lionMarket?.rate,
                    lionMarket?.sid,
                    lionMarket?.gstatus,
                    `Lion ${r.label}`,
                    "tiger-lion-dragon"
                  )}
                  {renderCell(
                    dragonMarket?.b || dragonMarket?.rate,
                    dragonMarket?.sid,
                    dragonMarket?.gstatus,
                    `Dragon ${r.label}`,
                    "tiger-lion-dragon"
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Results */}
      <div className="flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() =>
              navigate(`/casino-result?game=${normalizedGameType}`)
            }
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) &&
            results.slice(0, 10).map((item: any, index: number) => {
              const result = item?.win || item?.result || item?.res;
              let label = "";
              let color = "text-gray-200";
              if (result === "1" || result === "11") {
                label = "T"; // Tiger
                color = "text-red-500";
              } else if (result === "2" || result === "21") {
                label = "L"; // Lion
                color = "text-yellow-500";
              } else if (result === "3" || result === "31") {
                label = "D"; // Dragon
                color = "text-blue-500";
              }
              return (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${color} cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title="Click to view details"
                >
                  {label}
                </h2>
              );
            })}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={isModalOpen}
        onClose={closeModal}
        resultId={selectedResult?.mid}
        gameType={normalizedGameType}
        title={`${gameName || "Teenpatti 9"} Result Details`}
        enableBetFiltering={true}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const Teenpatti9 = memoizeCasinoComponent(Teenpatti9Component);
Teenpatti9.displayName = "Teenpatti9";

export default Teenpatti9;
