import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { cardType } from "@/utils/card";
import { useNavigate } from "react-router-dom";
import { getCardByCode } from "@/utils/card";
import IndividualResultModal from "@/components/casino/IndividualResultModal";
import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";

interface DT6Props {
  casinoData: any;
  remainingTime: number;
  onBetClick: (sid: string, type: "back" | "lay") => void;
  results?: any[];
  gameSlug: string;
  gameName: string;
  currentBet: any;
}

// helpers
const getOddsData = (casinoData: any, sid: string) => {
  // Handle both new API format (casinoData?.data?.sub) and legacy format (casinoData?.data?.data?.data?.t2)
  const dataSource = casinoData?.data?.sub || casinoData?.data?.data?.data?.t2;
  if (!dataSource) return null;
  return dataSource.find((item: any) => String(item.sid) === String(sid));
};

const isSuspended = (casinoData: any, sid: string, remainingTime: number) => {
  const oddsData = getOddsData(casinoData, sid) as any;
  if (!oddsData) return true;

  const toNumber = (value: unknown) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return 0;
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const rawStatus = oddsData?.gstatus as unknown as string | number | undefined;
  const statusStr =
    typeof rawStatus === "string"
      ? rawStatus.trim().toUpperCase()
      : rawStatus !== undefined && rawStatus !== null
        ? String(rawStatus).trim().toUpperCase()
        : "";

  const numericStatus =
    typeof rawStatus === "number"
      ? rawStatus
      : typeof rawStatus === "string" && rawStatus.trim() !== ""
        ? Number(rawStatus.trim())
        : null;

  const isStatusSuspended =
    statusStr === "SUSPENDED" ||
    statusStr === "CLOSED" ||
    (numericStatus !== null && !Number.isNaN(numericStatus) && numericStatus === 0);

  const backStakeLimit = toNumber(oddsData?.bs ?? oddsData?.bs1);
  const layStakeLimit = toNumber(oddsData?.ls ?? oddsData?.ls1);

  const shouldLockForZeroStakeLimits =
    backStakeLimit <= 0 && layStakeLimit <= 0;

  const isTimeSuspended = remainingTime <= 3;

  return (
    isStatusSuspended ||
    isTimeSuspended ||
    shouldLockForZeroStakeLimits
  );
};


const OneDayDragonTigerComponent: React.FC<DT6Props> = ({
  casinoData,
  remainingTime,
  onBetClick,
  results = [],
  gameSlug,
  gameName,
  currentBet,
}) => {
  const navigate = useNavigate();
  const resultModal = useIndividualResultModal();

  // Convert gameSlug to actual game slug format if needed
  const actualGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "dt6"; // Default fallback for One Day Dragon Tiger
  }, [gameSlug]);

  // Debug: Log data
  // console.log("🎰 DT6 component debug:", {
  //   casinoData,
  //   remainingTime,
  //   hasSub: !!(casinoData as any)?.data?.sub,
  //   hasLegacyT2: !!(casinoData as any)?.data?.data?.data?.t2,
  //   subLength: (casinoData as any)?.data?.sub?.length,
  //   sampleSubItem: (casinoData as any)?.data?.sub?.[0],
  //   lt: (casinoData as any)?.data?.lt,
  //   ft: (casinoData as any)?.data?.ft,
  // });

  /**
   * Handle clicking on individual result to show details
   */
  const handleResultClick = (result: any) => {
    const resultId = result?.mid || result?.roundId || result?.id || result?.matchId;
    
    if (!resultId) {
      console.error("🎰 OneDayDragonTiger: No result ID found in result", result);
      return;
    }
    
    if (!actualGameSlug) {
      console.error("🎰 OneDayDragonTiger: No gameSlug available", { gameSlug, actualGameSlug });
      return;
    }
    
    resultModal.openModal(String(resultId), result);
  };




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


  const getProfitLoss = () => {
    if (!currentBet?.data || !casinoData?.data?.mid)
      return { Dragon: 0, Tiger: 0 };

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = { Dragon: 0, Tiger: 0 };

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, oddCategory, stake, betRate } = bet.betData;

      if (betName === "Dragon" || betName === "Tiger") {
        const isDragon = betName === "Dragon";

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          if (isDragon) {
            book.Dragon += profit;
            book.Tiger += loss;
          } else {
            book.Tiger += profit;
            book.Dragon += loss;
          }
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          if (isDragon) {
            book.Dragon -= loss;
            book.Tiger += profit;
          } else {
            book.Tiger -= loss;
            book.Dragon += profit;
          }
        }
      }
    });

    console.log(book, "📘 book (combined Dragon & Tiger)");
    return book;
  };

  /**
   * Universal profit/loss calculation function for all betting types
   * @param betType - The type of bet to calculate profit/loss for
   * @returns The profit/loss amount (negative for loss-only display)
   */
  const getBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake } = bet.betData;

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      // More precise matching to avoid cross-contamination between Dragon/Tiger
      let isMatch = false;

      // Exact match first
      if (normalizedBetName === normalizedBetType) {
        isMatch = true;
      }
      // Handle Pair specifically
      else if (betType === "Pair" && normalizedBetName === "pair") {
        isMatch = true;
      }
      // Handle Even/Odd with exact Dragon/Tiger prefix
      else if (betType.includes("Even") && normalizedBetName.includes("even")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      else if (betType.includes("Odd") && normalizedBetName.includes("odd")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      // Handle Red/Black with exact Dragon/Tiger prefix
      else if (betType.includes("Red") && normalizedBetName.includes("red")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      else if (betType.includes("Black") && normalizedBetName.includes("black")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      // Handle Suits with exact Dragon/Tiger prefix
      else if (betType.includes("Heart") && normalizedBetName.includes("heart")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      else if (betType.includes("Diamond") && normalizedBetName.includes("diamond")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      else if (betType.includes("Club") && normalizedBetName.includes("club")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }
      else if (betType.includes("Spade") && normalizedBetName.includes("spade")) {
        const dragonTigerPrefix = betType.split(" ")[0].toLowerCase(); // "dragon" or "tiger"
        isMatch = normalizedBetName.startsWith(dragonTigerPrefix);
      }

      if (isMatch) {
        profitLoss += -stake; // Accumulate loss-only display for multiple bets
      }
    });

    return profitLoss;
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="md:p-0 p-1">
        {/* Dragon Tiger Odds */}
        <div className="w-full flex md:flex-row flex-col gap-1.5">
          {/* left side */}
          <div className="md:w-1/2 bg-[var(--bg-table)] border border-gray-100">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-1 py-1 text-left text-xs">
                    {/* Min: {getOddsData(casinoData, "1")?.min || "100"} Max:{" "}
                  {getOddsData(casinoData, "1")?.max || "150000"} */}
                  </th>
                  <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                    BACK
                  </th>
                  <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-lay)]">
                    LAY
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // ✅ Pass sid into getProfitLoss
                  const book = getProfitLoss();
                  const { Dragon = 0, Tiger = 0 } = book;

                  return (
                    <>
                      {/* Dragon Row */}
                      <tr className="hover:bg-gray-100">
                        <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                          Dragon
                          <h2
                            className={`text-xs font-medium ${
                              Dragon > 0
                                ? "text-green-600"
                                : Dragon < 0
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {Dragon > 0 ? "+" : ""}
                            {Dragon.toFixed(0)}
                          </h2>
                        </td>

                        {/* Back Button */}
                        <td
                          className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                          onClick={() =>
                            !isSuspended(casinoData, "1", remainingTime) &&
                            onBetClick("1", "back")
                          }
                        >
                          {isSuspended(casinoData, "1", remainingTime) && (
                            <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                              <span className="text-white">
                                <RiLockFill className="text-xl" />
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {(getOddsData(casinoData, "1")?.b ||
                                getOddsData(casinoData, "1")?.b1) ??
                                "0"}
                            </span>
                          </div>
                        </td>

                        {/* Lay Button */}
                        <td
                          className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-lay)] relative"
                          onClick={() =>
                            !isSuspended(casinoData, "1", remainingTime) &&
                            onBetClick("1", "lay")
                          }
                        >
                          {isSuspended(casinoData, "1", remainingTime) && (
                            <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                              <span className="text-white">
                                <RiLockFill className="text-xl" />
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {(getOddsData(casinoData, "1")?.l ||
                                getOddsData(casinoData, "1")?.l1) ??
                                "0"}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Tiger Row */}
                      <tr className="hover:bg-gray-100">
                        <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                          Tiger
                          <h2
                            className={`text-xs font-medium ${
                              Tiger > 0
                                ? "text-green-600"
                                : Tiger < 0
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {Tiger > 0 ? "+" : ""}
                            {Tiger.toFixed(0)}
                          </h2>
                        </td>

                        {/* Back Button */}
                        <td
                          className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                          onClick={() =>
                            !isSuspended(casinoData, "2", remainingTime) &&
                            onBetClick("2", "back")
                          }
                        >
                          {isSuspended(casinoData, "2", remainingTime) && (
                            <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                              <span className="text-white">
                                <RiLockFill className="text-xl" />
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {(getOddsData(casinoData, "2")?.b ||
                                getOddsData(casinoData, "2")?.b1) ??
                                "0"}
                            </span>
                          </div>
                        </td>

                        {/* Lay Button */}
                        <td
                          className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-lay)] relative"
                          onClick={() =>
                            !isSuspended(casinoData, "2", remainingTime) &&
                            onBetClick("2", "lay")
                          }
                        >
                          {isSuspended(casinoData, "2", remainingTime) && (
                            <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                              <span className="text-white">
                                <RiLockFill className="text-xl" />
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {(getOddsData(casinoData, "2")?.l ||
                                getOddsData(casinoData, "2")?.l1) ??
                                "0"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
          {/* right side - PAIR */}
          <div className="md:w-1/2 bg-[var(--bg-table)] border border-gray-300 my-2 relative">
            <div className="flex flex-col justify-between items-center h-full px-4 py-2 ">
              <h2 className="text-base font-bold leading-5">
                {(getOddsData(casinoData, "3")?.b ||
                  getOddsData(casinoData, "3")?.b1) ??
                  "0"}
              </h2>
              <div className="relative w-full">
                <button
                  className={`bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] relative leading-5 py-1 w-full text-white text-sm font-semibold ${isSuspended(casinoData, "3", remainingTime) ? "pointer-events-none" : ""}`}
                  onClick={() =>
                    !isSuspended(casinoData, "3", remainingTime) &&
                    onBetClick("3", "back")
                  }
                >
                  {isSuspended(casinoData, "3", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex w-full h-full justify-center items-center font-bold uppercase z-20">
                      <span className="text-white">
                        <RiLockFill className="text-xl" />
                      </span>
                    </div>
                  )}
                  PAIR
                </button>
              </div>
              <h2 
                className={`text-xs font-semibold leading-5 ${
                  getBetProfitLoss("Pair") > 0
                    ? "text-green-600"
                    : getBetProfitLoss("Pair") < 0
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {getBetProfitLoss("Pair") > 0 ? "+" : ""}
                {getBetProfitLoss("Pair").toFixed(0)}
              </h2>
            </div>
            <div className="absolute bottom-1 right-2">
              <h2 className="text-xs font-normal leading-4">
                {/* Min: {getOddsData(casinoData, "3")?.min || "100"} Max:{" "}
              {getOddsData(casinoData, "3")?.max || "50000"} */}
              </h2>
            </div>
          </div>
        </div>
        <div className="w-full flex md:flex-row flex-col gap-1.5">
          {/* Even/Odd Odds */}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-1 py-1 text-left text-xs w-4/12">
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                  Even
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                  Odd
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                  Dragon
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(casinoData, "4", remainingTime) &&
                    onBetClick("4", "back")
                  }
                >
                  {isSuspended(casinoData, "4", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Dragon Even") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Dragon Even") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Dragon Even") > 0 ? "+" : ""}
                      {getBetProfitLoss("Dragon Even").toFixed(0)}
                    </h2>
                    </div>
                  )}
                  {(getOddsData(casinoData, "4")?.b ||
                    getOddsData(casinoData, "4")?.b1) ??
                    "0"}
                    <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Dragon Even") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Dragon Even") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Dragon Even") > 0 ? "+" : ""}
                      {getBetProfitLoss("Dragon Even").toFixed(0)}
                    </h2>
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(casinoData, "5", remainingTime) &&
                    onBetClick("5", "back")
                  }
                >
                  {isSuspended(casinoData, "5", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Dragon Odd") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Dragon Odd") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Dragon Odd") > 0 ? "+" : ""}
                      {getBetProfitLoss("Dragon Odd").toFixed(0)}
                    </h2>
                    </div>
                  )}
                  {(getOddsData(casinoData, "5")?.b ||
                    getOddsData(casinoData, "5")?.b1) ??
                    "0"}
                    <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Dragon Odd") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Dragon Odd") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Dragon Odd") > 0 ? "+" : ""}
                      {getBetProfitLoss("Dragon Odd").toFixed(0)}
                    </h2>
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                  Tiger
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(casinoData, "12", remainingTime) &&
                    onBetClick("12", "back")
                  }
                >
                  {isSuspended(casinoData, "12", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Tiger Even") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Tiger Even") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Tiger Even") > 0 ? "+" : ""}
                      {getBetProfitLoss("Tiger Even").toFixed(0)}
                    </h2>
                    </div>
                  )}
                  {(getOddsData(casinoData, "12")?.b ||
                    getOddsData(casinoData, "12")?.b1) ??
                    "0"}
                    <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Tiger Even") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Tiger Even") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Tiger Even") > 0 ? "+" : ""}
                      {getBetProfitLoss("Tiger Even").toFixed(0)}
                    </h2>
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(casinoData, "13", remainingTime) &&
                    onBetClick("13", "back")
                  }
                >
                  {isSuspended(casinoData, "13", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Tiger Odd") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Tiger Odd") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Tiger Odd") > 0 ? "+" : ""}
                      {getBetProfitLoss("Tiger Odd").toFixed(0)}
                    </h2>
                    </div>
                  )}
                  {(getOddsData(casinoData, "13")?.b ||
                    getOddsData(casinoData, "13")?.b1) ??
                    "0"}
                    <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Tiger Odd") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Tiger Odd") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Tiger Odd") > 0 ? "+" : ""}
                      {getBetProfitLoss("Tiger Odd").toFixed(0)}
                    </h2>
                </td>
              </tr>
            </tbody>
          </table>
          {/* Red/Black Odds */}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-1 py-1 text-left text-xs w-4/12">
                  {/* Min: {getOddsData(casinoData, "6")?.min || "100"} Max:{" "}
                {getOddsData(casinoData, "6")?.max || "150000"} */}
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                  <div className="flex justify-center items-center gap-1">
                    <h2 className="text-xs"> Red</h2>
                    <img
                      src={cardType.Diamond}
                      alt="diamond"
                      className="w-3 h-3"
                    />
                    <img src={cardType.Spade} alt="Spade" className="w-3 h-3" />
                  </div>
                </th>
                <th className="border border-gray-300 px-1 py-1 text-center text-sm bg-[var(--bg-back)]">
                  <div className="flex justify-center items-center gap-1">
                    <h2 className="text-xs"> Black</h2>
                    <img src={cardType.Heart} alt="heart" className="w-3 h-3" />
                    <img src={cardType.Club} alt="club" className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                  Dragon
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(casinoData, "6", remainingTime) &&
                    onBetClick("6", "back")
                  }
                >
                  {isSuspended(casinoData, "6", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Dragon Red") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Dragon Red") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Dragon Red") > 0 ? "+" : ""}
                      {getBetProfitLoss("Dragon Red").toFixed(0)}
                    </h2>
                    </div>
                  )}
                  {(getOddsData(casinoData, "6")?.b ||
                    getOddsData(casinoData, "6")?.b1) ??
                    "0"}
                    <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Dragon Red") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Dragon Red") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Dragon Red") > 0 ? "+" : ""}
                      {getBetProfitLoss("Dragon Red").toFixed(0)}
                    </h2>
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(casinoData, "7", remainingTime) &&
                    onBetClick("7", "back")
                  }
                >
                  {isSuspended(casinoData, "7", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Dragon Black") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Dragon Black") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Dragon Black") > 0 ? "+" : ""}
                      {getBetProfitLoss("Dragon Black").toFixed(0)}
                    </h2>
                    </div>
                  )}
                  {(getOddsData(casinoData, "7")?.b ||
                    getOddsData(casinoData, "7")?.b1) ??
                    "0"}
                    <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Dragon Black") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Dragon Black") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Dragon Black") > 0 ? "+" : ""}
                      {getBetProfitLoss("Dragon Black").toFixed(0)}
                    </h2>
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                  Tiger
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(casinoData, "14", remainingTime) &&
                    onBetClick("14", "back")
                  }
                >
                  {isSuspended(casinoData, "14", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Tiger Red") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Tiger Red") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Tiger Red") > 0 ? "+" : ""}
                      {getBetProfitLoss("Tiger Red").toFixed(0)}
                    </h2>
                    </div>
                  )}
                  {(getOddsData(casinoData, "14")?.b ||
                    getOddsData(casinoData, "14")?.b1) ??
                    "0"}
                    <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Tiger Red") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Tiger Red") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Tiger Red") > 0 ? "+" : ""}
                      {getBetProfitLoss("Tiger Red").toFixed(0)}
                    </h2>
                </td>
                <td
                  className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                  onClick={() =>
                    !isSuspended(casinoData, "15", remainingTime) &&
                    onBetClick("15", "back")
                  }
                >
                  {isSuspended(casinoData, "15", remainingTime) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                      <h2 className="text-white">
                        <RiLockFill className="text-xl" />
                      </h2>
                      <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Tiger Black") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Tiger Black") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Tiger Black") > 0 ? "+" : ""}
                      {getBetProfitLoss("Tiger Black").toFixed(0)}
                    </h2>
                    </div>
                  )}
                  {(getOddsData(casinoData, "15")?.b ||
                    getOddsData(casinoData, "15")?.b1) ??
                    "0"}
                    <h2 
                      className={`text-xs font-semibold leading-5 ${
                        getBetProfitLoss("Tiger Black") > 0
                          ? "text-green-600"
                          : getBetProfitLoss("Tiger Black") < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {getBetProfitLoss("Tiger Black") > 0 ? "+" : ""}
                      {getBetProfitLoss("Tiger Black").toFixed(0)}
                    </h2>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Suits Odds */}
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="border border-gray-300 px-1 py-1 text-left text-xs w-1/5">
                <i className="fa-solid fa-info-circle text-[var(--bg-primary)]"></i>
              </th>
              <th className="border border-gray-300 px-1 py-1 text-center text-sm  w-1/5">
                <div className="flex justify-center items-center">
                  <img src={cardType.Heart} alt="heart" className="w-3 h-3" />
                </div>
              </th>
              <th className="border border-gray-300 px-1 py-1 text-center text-sm  w-1/5">
                <div className="flex justify-center items-center">
                  <img
                    src={cardType.Diamond}
                    alt="diamond"
                    className="w-3 h-3"
                  />
                </div>
              </th>
              <th className="border border-gray-300 px-1 py-1 text-center text-sm  w-1/5">
                <div className="flex justify-center items-center">
                  <img src={cardType.Club} alt="club" className="w-3 h-3" /> 
                </div>
              </th>
              <th className="border border-gray-300 px-1 py-1 text-center text-sm  w-1/5">
                <div className="flex justify-center items-center">
                  <img src={cardType.Spade} alt="spade" className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-100">
              <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                Dragon
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(casinoData, "9", remainingTime) &&
                  onBetClick("9", "back")
                }
              >
                {isSuspended(casinoData, "9", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Dragon Heart") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Dragon Heart") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Dragon Heart") > 0 ? "+" : ""}
                  {getBetProfitLoss("Dragon Heart").toFixed(0)}
                </h2>
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "9")?.b ||
                    getOddsData(casinoData, "9")?.b1) ??
                    "0"}
                </span>
                <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Dragon Heart") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Dragon Heart") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Dragon Heart") > 0 ? "+" : ""}
                  {getBetProfitLoss("Dragon Heart").toFixed(0)}
                </h2>
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(casinoData, "10", remainingTime) &&
                  onBetClick("10", "back")
                }
              >
                {isSuspended(casinoData, "10", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Dragon Diamond") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Dragon Diamond") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Dragon Diamond") > 0 ? "+" : ""}
                  {getBetProfitLoss("Dragon Diamond").toFixed(0)}
                </h2>
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "10")?.b ||
                    getOddsData(casinoData, "10")?.b1) ??
                    "0"}
                </span>
                <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Dragon Diamond") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Dragon Diamond") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Dragon Diamond") > 0 ? "+" : ""}
                  {getBetProfitLoss("Dragon Diamond").toFixed(0)}
                </h2>
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(casinoData, "11", remainingTime) &&
                  onBetClick("11", "back")
                }
              >
                {isSuspended(casinoData, "11", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Dragon Club") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Dragon Club") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Dragon Club") > 0 ? "+" : ""}
                  {getBetProfitLoss("Dragon Club").toFixed(0)}
                </h2>
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "11")?.b ||
                    getOddsData(casinoData, "11")?.b1) ??
                    "0"}
                </span>
                <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Dragon Club") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Dragon Club") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Dragon Club") > 0 ? "+" : ""}
                  {getBetProfitLoss("Dragon Club").toFixed(0)}
                </h2>
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(casinoData, "8", remainingTime) &&
                  onBetClick("8", "back")
                }
              >
                {isSuspended(casinoData, "8", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Dragon Spade") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Dragon Spade") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Dragon Spade") > 0 ? "+" : ""}
                  {getBetProfitLoss("Dragon Spade").toFixed(0)}
                </h2>
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "8")?.b ||
                    getOddsData(casinoData, "8")?.b1) ??
                    "0"}
                </span>
                <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Dragon Spade") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Dragon Spade") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Dragon Spade") > 0 ? "+" : ""}
                  {getBetProfitLoss("Dragon Spade").toFixed(0)}
                </h2>
              </td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="border border-gray-300 px-1 py-1.5 text-sm font-semibold">
                Tiger
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(casinoData, "17", remainingTime) &&
                  onBetClick("17", "back")
                }
              >
                {isSuspended(casinoData, "17", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Tiger Heart") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Tiger Heart") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Tiger Heart") > 0 ? "+" : ""}
                  {getBetProfitLoss("Tiger Heart").toFixed(0)}
                </h2>
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "17")?.b ||
                    getOddsData(casinoData, "17")?.b1) ??
                    "0"}
                </span>
                <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Tiger Heart") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Tiger Heart") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Tiger Heart") > 0 ? "+" : ""}
                  {getBetProfitLoss("Tiger Heart").toFixed(0)}
                </h2>
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(casinoData, "18", remainingTime) &&
                  onBetClick("18", "back")
                }
              >
                {isSuspended(casinoData, "18", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Tiger Diamond") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Tiger Diamond") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Tiger Diamond") > 0 ? "+" : ""}
                  {getBetProfitLoss("Tiger Diamond").toFixed(0)}
                </h2>
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "18")?.b ||
                    getOddsData(casinoData, "18")?.b1) ??
                    "0"}
                </span>
                <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Tiger Diamond") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Tiger Diamond") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Tiger Diamond") > 0 ? "+" : ""}
                  {getBetProfitLoss("Tiger Diamond").toFixed(0)}
                </h2>
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(casinoData, "19", remainingTime) &&
                  onBetClick("19", "back")
                }
              >
                {isSuspended(casinoData, "19", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Tiger Club") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Tiger Club") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Tiger Club") > 0 ? "+" : ""}
                  {getBetProfitLoss("Tiger Club").toFixed(0)}
                </h2>
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "19")?.b ||
                    getOddsData(casinoData, "19")?.b1) ??
                    "0"}
                </span>
                <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Tiger Club") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Tiger Club") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Tiger Club") > 0 ? "+" : ""}
                  {getBetProfitLoss("Tiger Club").toFixed(0)}
                </h2>
              </td>
              <td
                className="border border-gray-300 px-1 py-1.5 text-center text-sm cursor-pointer  bg-[var(--bg-back)] relative"
                onClick={() =>
                  !isSuspended(casinoData, "16", remainingTime) &&
                  onBetClick("16", "back")
                }
              >
                {isSuspended(casinoData, "16", remainingTime) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                    <h2 className="text-white">
                      <RiLockFill className="text-xl" />
                    </h2>
                    <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Tiger Spade") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Tiger Spade") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Tiger Spade") > 0 ? "+" : ""}
                  {getBetProfitLoss("Tiger Spade").toFixed(0)}
                </h2>
                  </div>
                )}
                <span className="block w-full text-center">
                  {(getOddsData(casinoData, "16")?.b ||
                    getOddsData(casinoData, "16")?.b1) ??
                    "0"}
                </span>
                <h2 
                  className={`text-xs font-semibold leading-5 ${
                    getBetProfitLoss("Tiger Spade") > 0
                      ? "text-green-600"
                      : getBetProfitLoss("Tiger Spade") < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getBetProfitLoss("Tiger Spade") > 0 ? "+" : ""}
                  {getBetProfitLoss("Tiger Spade").toFixed(0)}
                </h2>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=DRAGON_TIGER_6`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) && results.length > 0
            ? results.slice(0, 10).map((item: any, index: number) => (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.win === "1" ? "text-red-500" : "text-yellow-400"} cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title="Click to view details"
                >
                  {item.win === "1" ? "D" : "T"}
                </h2>
              ))
            : // Fallback to old data structure if results prop is not available
              (casinoData as any)?.data?.data?.result
                ?.slice(0, 10)
                .map((item: any, index: number) => (
                  <h2
                    key={index}
                    className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.result === "1" ? "text-red-500" : "text-yellow-400"} cursor-pointer hover:scale-110 transition-transform`}
                    onClick={() => handleResultClick(item)}
                    title="Click to view details"
                  >
                    {item.win === "1" ? "D" : "T"}
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
        title={`${gameName || "One Day Dragon Tiger"} Result Details`}
        customGetFilteredBets={getFilteredBets}
      />
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const OneDayDragonTiger = memoizeCasinoComponent(OneDayDragonTigerComponent);
OneDayDragonTiger.displayName = "OneDayDragonTiger";

export default OneDayDragonTiger;
