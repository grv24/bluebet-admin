import React, { useState } from "react";
import { RiLockFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
// import IndividualResultModal from "@/components/casino/IndividualResultModal";
// import { useIndividualResultModal } from "@/hooks/useIndividualResultModal";
import { memoizeCasinoComponent } from "../../../utils/casinoMemo";

const ThirtyTwoCardBComponent: React.FC<{
  casinoData: any;
  remainingTime: number;
  results: any[];
  gameName: string;
  gameSlug: string;
}> = ({
  casinoData,
  remainingTime,
  results,
  gameName,
  gameSlug,
}) => {
  const navigate = useNavigate();

  // Convert gameSlug to actual game slug format if needed
  const actualGameSlug = React.useMemo(() => {
    if (gameSlug) {
      return gameSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    return "card32"; // Default fallback
  }, [gameSlug]);

  // Handle both new API format (casinoData?.data?.sub) and legacy format (casinoData?.data?.data?.data?.t2)
  const t2: any[] = casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];


  const isSuspended = (odds: any) => {
    const status = odds?.gstatus as string | number | undefined;
    const isStatusSuspended =
      status === "SUSPENDED" || status === "1" || status === 1;
    return isStatusSuspended || remainingTime <= 3;
  };

  const getByNation = (name: string) =>
    t2.find(
      (x) =>
        String(x?.nation || x?.nat || "").toLowerCase() === name.toLowerCase()
    );

  const getByNationAny = (names: string[]) => {
    const lower = names.map((n) => n.toLowerCase());
    return t2.find((x) =>
      lower.includes(String(x?.nation || x?.nat || "").toLowerCase())
    );
  };




  const getProfitLoss = () => {
    if (!currentBet?.data || !casinoData?.data?.mid)
      return { 
        "Player 8": 0, 
        "Player 9": 0, 
        "Player 10": 0, 
        "Player 11": 0,
        "Any Three Card Black": 0,
        "Any Three Card Red": 0,
        "Two Black Two Red": 0,
        "8 & 9 Total": 0,
        "10 & 11 Total": 0
      };

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = { 
      "Player 8": 0, 
      "Player 9": 0, 
      "Player 10": 0, 
      "Player 11": 0,
      "Any Three Card Black": 0,
      "Any Three Card Red": 0,
      "Two Black Two Red": 0,
      "8 & 9 Total": 0,
      "10 & 11 Total": 0
    };

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, oddCategory, stake, betRate } = bet.betData;

      // Debug: Log all bet names to see what we're actually getting
      console.log("🔍 Bet name:", betName, "Category:", oddCategory, "Stake:", stake);

      // Handle main players
      if (betName === "Player 8" || betName === "Player 9" || betName === "Player 10" || betName === "Player 11") {
        const playerName = betName;

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          book[playerName] += profit;
          // Add loss to other players
          Object.keys(book).forEach(key => {
            if (key !== playerName) {
              book[key] += loss;
            }
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          book[playerName] -= loss;
          // Add profit to other players
          Object.keys(book).forEach(key => {
            if (key !== playerName) {
              book[key] += profit;
            }
          });
        }
      }
      // Handle Any Three Card, Two Black Two Red bets
      else if (betName === "Any Three Card Black" || betName === "Any Three Card Red" || betName === "Two Black Two Red") {
        const betType = betName;

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          book[betType] += profit;
          // Add loss to other bets
          Object.keys(book).forEach(key => {
            if (key !== betType) {
              book[key] += loss;
            }
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          book[betType] -= loss;
          // Add profit to other bets
          Object.keys(book).forEach(key => {
            if (key !== betType) {
              book[key] += profit;
            }
          });
        }
      }
      // Handle 8 & 9 Total separately (with variations)
      else if (betName === "8 & 9 Total" || betName === "8&9 Total" || betName === "8 and 9 Total" || betName?.includes("8") && betName?.includes("9") && betName?.includes("Total")) {
        console.log("✅ Found 8 & 9 Total bet:", { betName, oddCategory, stake, betRate });
        const betType = "8 & 9 Total"; // Normalize to our book key

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          book[betType] += profit;
          // Add loss to other bets
          Object.keys(book).forEach(key => {
            if (key !== betType) {
              book[key] += loss;
            }
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          book[betType] -= loss;
          // Add profit to other bets
          Object.keys(book).forEach(key => {
            if (key !== betType) {
              book[key] += profit;
            }
          });
        }
      }
      // Handle 10 & 11 Total separately (with variations)
      else if (betName === "10 & 11 Total" || betName === "10&11 Total" || betName === "10 and 11 Total" || betName?.includes("10") && betName?.includes("11") && betName?.includes("Total")) {
        console.log("✅ Found 10 & 11 Total bet:", { betName, oddCategory, stake, betRate });
        const betType = "10 & 11 Total"; // Normalize to our book key

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          book[betType] += profit;
          // Add loss to other bets
          Object.keys(book).forEach(key => {
            if (key !== betType) {
              book[key] += loss;
            }
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          book[betType] -= loss;
          // Add profit to other bets
          Object.keys(book).forEach(key => {
            if (key !== betType) {
              book[key] += profit;
            }
          });
        }
      }
    });

    console.log(book, "📘 book (32card players + special bets)");
    return book;
  };

  /**
   * Calculate profit/loss for Odd/Even and Single bets (loss-only display)
   * @param betType - The type of bet to calculate profit/loss for
   * @returns The profit/loss amount (loss-only display)
   */
  const getBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    console.log("🔍 getBetProfitLoss called with betType:", betType);

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    // Only bets for this match
    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake, betRate, oddCategory } = bet.betData;

      // Normalize bet name for comparison
      const normalizedBetName = betName?.toLowerCase() || "";
      const normalizedBetType = betType.toLowerCase();

      // More precise matching for 32card game
      let isMatch = false;

      // Handle Player Odd/Even with exact Player prefix
      if (betType.includes("Odd") && normalizedBetName.includes("odd")) {
        const playerPrefix = betType.split(" ")[0].toLowerCase(); // "player 8", "player 9", etc.
        const playerNumber = betType.split(" ")[1]; // "8", "9", etc.
        isMatch = normalizedBetName.startsWith(playerPrefix) && normalizedBetName.includes(playerNumber);
      }
      else if (betType.includes("Even") && normalizedBetName.includes("even")) {
        const playerPrefix = betType.split(" ")[0].toLowerCase(); // "player 8", "player 9", etc.
        const playerNumber = betType.split(" ")[1]; // "8", "9", etc.
        isMatch = normalizedBetName.startsWith(playerPrefix) && normalizedBetName.includes(playerNumber);
      }
      // Handle Single number bets
      else if (betType.includes("Single") && normalizedBetName.includes("single")) {
        const singleNumber = betType.split(" ")[1]; // Extract the number
        isMatch = normalizedBetName.includes(singleNumber);
      }

      if (isMatch) {
        // Match DT6's approach: loss-only display (just show -stake)
        console.log("🎯 Odd/Even bet match:", { betType, betName, stake, profitLoss: -stake });
        profitLoss = -stake;
      }
    });

    return profitLoss;
  };


  /**
   * Calculate profit/loss for Any Three Card, Two Black Two Red, and Total bets (Back/Lay)
   * @param betType - The type of bet to calculate profit/loss for
   * @returns The profit/loss amount using book calculation
   */
  const getAnyThreeCardBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = {
      "Any Three Card Black": 0,
      "Any Three Card Red": 0,
      "Two Black Two Red": 0
    };

    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake, betRate, oddCategory } = bet.betData;

      if (betName === "Any Three Card Black" || betName === "Any Three Card Red" || betName === "Two Black Two Red") {
        const currentBetType = betName;

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          book[currentBetType] += profit;
          Object.keys(book).forEach(key => {
            if (key !== currentBetType) {
              book[key] += loss;
            }
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          book[currentBetType] -= loss;
          Object.keys(book).forEach(key => {
            if (key !== currentBetType) {
              book[key] += profit;
            }
          });
        }
      }
    });

    return book[betType] || 0;
  };

  const getTotalBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = {
      "8 & 9 Total": 0,
      "10 & 11 Total": 0
    };

    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake, betRate, oddCategory } = bet.betData;

      // Handle variations of Total bet names
      const normalizedBetName = betName?.toLowerCase() || "";
      let currentBetType = "";

      if (normalizedBetName.includes("8") && normalizedBetName.includes("9") && normalizedBetName.includes("total")) {
        currentBetType = "8 & 9 Total";
      } else if (normalizedBetName.includes("10") && normalizedBetName.includes("11") && normalizedBetName.includes("total")) {
        currentBetType = "10 & 11 Total";
      }

      if (currentBetType && book.hasOwnProperty(currentBetType)) {
        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          book[currentBetType] += profit;
          Object.keys(book).forEach(key => {
            if (key !== currentBetType) {
              book[key] += loss;
            }
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          book[currentBetType] -= loss;
          Object.keys(book).forEach(key => {
            if (key !== currentBetType) {
              book[key] += profit;
            }
          });
        }
      }
    });

    return book[betType] || 0;
  };

  const getPlayerBetProfitLoss = (playerName: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = {
      "Player 8": 0,
      "Player 9": 0,
      "Player 10": 0,
      "Player 11": 0
    };

    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake, betRate, oddCategory } = bet.betData;

      if (betName === "Player 8" || betName === "Player 9" || betName === "Player 10" || betName === "Player 11") {
        const currentPlayer = betName;

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          const loss = -stake;

          book[currentPlayer] += profit;
          Object.keys(book).forEach(key => {
            if (key !== currentPlayer) {
              book[key] += loss;
            }
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          const profit = stake;

          book[currentPlayer] -= loss;
          Object.keys(book).forEach(key => {
            if (key !== currentPlayer) {
              book[key] += profit;
            }
          });
        }
      }
    });

    return book[playerName] || 0;
  };
  return (
    <div className="flex flex-col gap-1">
      {/* first row */}
      <div className="w-full grid lg:grid-cols-2 grid-cols-1 gap-1 mt-1">
        <table className="bg-[var(--bg-table-row)]">
          <thead>
            <tr className="w-full border border-gray-300">
              <th className="w-1/2 border border-gray-300">
                <div className="w-full h-full bg-[var(--bg-back)]"></div>
              </th>
              <th className="bg-[var(--bg-back)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300">
                Back
              </th>
              <th className="bg-[var(--bg-lay)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300">
                Lay
              </th>
            </tr>
          </thead>
          <tbody>
            {["Player 8", "Player 9", "Player 10", "Player 11"].map((label) => {
              const row = getByNation(label) || {};
              const backLocked = isSuspended(row);
              const layLocked = isSuspended(row);
              return (
                <tr key={label} className="w-full border border-gray-300">
                  <td className="text-base font-semibold px-2 text-[var(--bg-secondary)]">
                    {label}
                    <h2 
                      className={`text-xs font-medium ${
                        profitLoss > 0
                          ? "text-green-600"
                          : profitLoss < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {profitLoss > 0 ? "+" : ""}
                      {profitLoss.toFixed(0)}
                    </h2>
                  </td>
                  <td
                    className="relative text-base border border-gray-300 text-center leading-10 font-semibold bg-[var(--bg-back)] text-[var(--bg-secondary)]"
                  >
                    {backLocked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RiLockFill className="text-white text-xl" />
                      </div>
                    )}
                    {row?.b || 0}
                  </td>
                  <td
                    className="relative text-base border border-gray-300 text-center leading-10 font-semibold bg-[var(--bg-lay)] text-[var(--bg-secondary)]"
                  >
                    {layLocked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RiLockFill className="text-white text-xl" />
                      </div>
                    )}
                    {row?.l || 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <table className="bg-[var(--bg-table-row)]">
          <thead>
            <tr className="w-full border border-gray-300">
              <th className="w-1/2 border border-gray-300">
                <div className="w-full h-full bg-[var(--bg-back)]"></div>
              </th>
              <th className="bg-[var(--bg-back)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300">
                Even
              </th>
              <th className="bg-[var(--bg-back)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300">
                Odd
              </th>
            </tr>
          </thead>
          <tbody>
            {["Player 8", "Player 9", "Player 10", "Player 11"].map((label) => {
              const odd = getByNation(`${label} Odd`) || {};
              const even = getByNation(`${label} Even`) || {};
              const oddLocked = isSuspended(odd);
              const evenLocked = isSuspended(even);
              return (
                <tr
                  key={`oe-${label}`}
                  className="w-full border border-gray-300"
                >
                  <td className="text-base font-semibold px-2 text-[var(--bg-secondary)]">
                    {label}
                  </td>
                  <td
                    className="relative text-base text-center border border-gray-300 leading-10 font-semibold bg-[var(--bg-back)] text-[var(--bg-secondary)]"
                  >
                    {evenLocked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <h2 className="text-white">
                          <RiLockFill className="text-xl" />
                        </h2>
                        <h2 
                          className={`text-xs font-semibold leading-5 ${
                            evenProfitLoss > 0
                              ? "text-green-600"
                              : evenProfitLoss < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {evenProfitLoss > 0 ? "+" : ""}
                          {evenProfitLoss.toFixed(0)}
                        </h2>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {even?.b || 0}
                      </span>
                      <h2 
                        className={`text-xs font-semibold leading-5 ${
                          evenProfitLoss > 0
                            ? "text-green-600"
                            : evenProfitLoss < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {evenProfitLoss > 0 ? "+" : ""}
                        {evenProfitLoss.toFixed(0)}
                      </h2>
                    </div>
                  </td>
                  <td
                    className="relative text-base text-center border border-gray-300 leading-10 font-semibold bg-[var(--bg-back)] text-[var(--bg-secondary)]"
                  >
                    {oddLocked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <h2 className="text-white">
                          <RiLockFill className="text-xl" />
                        </h2>
                        <h2 
                          className={`text-xs font-semibold leading-5 ${
                            oddProfitLoss > 0
                              ? "text-green-600"
                              : oddProfitLoss < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {oddProfitLoss > 0 ? "+" : ""}
                          {oddProfitLoss.toFixed(0)}
                        </h2>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {odd?.b || 0}
                      </span>
                      <h2 
                        className={`text-xs font-semibold leading-5 ${
                          oddProfitLoss > 0
                            ? "text-green-600"
                            : oddProfitLoss < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {oddProfitLoss > 0 ? "+" : ""}
                        {oddProfitLoss.toFixed(0)}
                      </h2>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* second row */}
      <div className="w-full grid lg:grid-cols-2 grid-cols-1 gap-1 mt-1">
        <table className="bg-[var(--bg-table-row)]">
          <thead>
            <tr className="w-full border border-gray-300">
              <th className="w-1/2 border border-gray-300">
                <div className="w-full h-full bg-[var(--bg-back)]"></div>
              </th>
              <th className="bg-[var(--bg-back)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300">
                Back
              </th>
              <th className="bg-[var(--bg-lay)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300">
                Lay
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Any Three Card Black", "Any 3 Card Black"],
              ["Any Three Card Red", "Any 3 Card Red"],
              ["Two Black Two Red"],
            ].map((names) => {
              const row = getByNationAny(names as string[]) || {};
              const backLocked = isSuspended(row);
              const layLocked = isSuspended(row);
              return (
                <tr
                  key={String(names[0])}
                  className="w-full border border-gray-300"
                >
                  <td className="text-base font-semibold px-2 text-[var(--bg-secondary)]">
                    {String(names[0])}
                     <h2 
                          className={`text-xs font-semibold leading-5 ${
                            profitLoss > 0
                              ? "text-green-600"
                              : profitLoss < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {profitLoss > 0 ? "+" : ""}
                          {profitLoss.toFixed(0)}
                        </h2>
                  </td>
                  <td
                    className="relative text-base border border-gray-300 text-center leading-10 font-semibold bg-[var(--bg-back)] text-[var(--bg-secondary)]"
                  >
                    {backLocked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <h2 className="text-white">
                          <RiLockFill className="text-xl" />
                        </h2>
                       
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                    {row?.b ?? 0}
                      </span>
                      
                    </div>
                  </td>
                  <td
                    className="relative text-base border border-gray-300 text-center leading-10 font-semibold bg-[var(--bg-lay)] text-[var(--bg-secondary)]"
                  >
                    {layLocked && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col w-full h-full justify-center items-center font-bold uppercase z-20">
                        <h2 className="text-white">
                          <RiLockFill className="text-xl" />
                        </h2>
                       
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                    {row?.l ?? 0}
                      </span>
                     
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <table className="bg-[var(--bg-table-row)]">
          <thead>
            <tr className="w-full border border-gray-300">
              <th className="w-1/2 border border-gray-300">
                <div className="w-full h-full bg-[var(--bg-back)]"></div>
              </th>
              <th className="bg-[var(--bg-back)] leading-8 border text-base font-semibold text-[var(--bg-secondary)] border-gray-300">
                Back
              </th>
            </tr>
          </thead>
          <tbody>
            {["8 & 9 Total", "10 & 11 Total"].map((label) => {
              const row = getByNation(label) || {};
              const backLocked = isSuspended(row);
              return (
                <tr key={label} className="w-full border border-gray-300">
                  <td className="text-base font-semibold px-2 text-[var(--bg-secondary)]">
                    {label}
                    <h2 
                      className={`text-xs font-medium ${
                        profitLoss > 0
                          ? "text-green-600"
                          : profitLoss < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {profitLoss > 0 ? "+" : ""}
                      {profitLoss.toFixed(0)}
                    </h2>
                  </td>
                  <td
                    className="relative text-base text-center border border-gray-300 leading-10 font-semibold bg-[var(--bg-back)] text-[var(--bg-secondary)] cursor-pointer"
                    onClick={() =>
                      !backLocked && onBetClick(String(row?.sid), "back")
                    }
                  >
                    {backLocked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RiLockFill className="text-white text-xl" />
                      </div>
                    )}
                    {row?.b ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* third row */}
      <div className="w-full border flex flex-col border-gray-300">
        <div className="text-center text-lg leading-8 font-semibold text-[var(--bg-secondary)]">
          {getByNation("Single 1")?.b || 0}
        </div>
        <div className="grid grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => {
            const label = `Single ${num}`;
            const row = getByNation(label) || {};
            const locked = isSuspended(row);
            return (
              <div
                key={`single-${num}`}
                className="relative w-full col-span-1 border bg-[var(--bg-back)] text-center text-lg leading-14 font-semibold text-[var(--bg-secondary)] border-gray-300"
              >
                {locked && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RiLockFill className="text-white text-xl" />
                  </div>
                )}
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{num}</span>
                  <span 
                    className={`text-xs font-medium ${
                      profitLoss > 0
                        ? "text-green-600"
                        : profitLoss < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {profitLoss > 0 ? "+" : ""}
                    {profitLoss.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="mt-1 flex flex-col gap-1">
        <div className="bg-[var(--bg-secondary85)] border border-gray-300 flex justify-between px-2 py-.5 items-center">
          <h2 className="text-sm font-normal leading-8 text-white">
            Last Result
          </h2>
          <h2
            onClick={() => navigate(`/casino-result?game=${gameSlug}`)}
            className="text-sm font-normal leading-8 text-white cursor-pointer hover:text-gray-200"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {results?.slice(0, 10).map((item: any, index: number) => (
            <h2
              key={index}
              className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.win === "1" ? "text-red-500" : "text-yellow-400"}`}
              title="View details"
            >
              {item.win == "1"
                ? "8"
                : item.win == "2"
                  ? "9"
                  : item.win == "3"
                    ? "10"
                    : item.win == "4"
                      ? "11"
                      : "NA"}
            </h2>
          ))}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      {/* <IndividualResultModal
        isOpen={resultModal.isOpen}
        onClose={resultModal.closeModal}
        resultId={resultModal.selectedResultId || undefined}
        gameType={actualGameSlug}
        title={`${gameName || "32 Card B"} Result Details`}
        customGetFilteredBets={getFilteredBets}
      /> */}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const ThirtyTwoCardB = memoizeCasinoComponent(ThirtyTwoCardBComponent);
ThirtyTwoCardB.displayName = "ThirtyTwoCardB";

export default ThirtyTwoCardB;
