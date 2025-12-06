import React, { useState, useEffect } from "react";
import { memoizeCasinoComponent } from "@/utils/casinoMemo";
import {
  cardImage,
  getBlackShapes,
  getCardByCode,
  getNumberCard,
  getRedShapes,
  getShapeColor,
} from "@/utils/card";
import { RiLockFill } from "react-icons/ri";
import { getCasinoIndividualResult } from "@/helper/casino";
import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
import CasinoModal from "@/components/common/CasinoModal";
import { useNavigate } from "react-router-dom";

const AndarBahar2Component = ({
  casinoData,
  remainingTime,
  onBetClick,
  results,
  gameSlug,
  gameName,
  currentBet,
}: any) => {
  const formatDateTime = (
    value: string | number | null | undefined
  ): string => {
    if (value === undefined || value === null) return "N/A";

    if (typeof value === "string") {
      const trimmedValue = value.trim();
      if (!trimmedValue) return "N/A";

      const dateFromString = new Date(trimmedValue);
      if (!Number.isNaN(dateFromString.getTime())) {
        return dateFromString.toLocaleString();
      }

      const numericValue = Number(trimmedValue);
      if (!Number.isNaN(numericValue)) {
        const dateFromNumeric = new Date(numericValue);
        if (!Number.isNaN(dateFromNumeric.getTime())) {
          return dateFromNumeric.toLocaleString();
        }
      }

      return trimmedValue;
    }

    const dateFromNumber = new Date(value);
    if (!Number.isNaN(dateFromNumber.getTime())) {
      return dateFromNumber.toLocaleString();
    }

    return String(value);
  };

  const [cookies] = useCookies(["clientToken"]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [betFilter, setBetFilter] = useState("all");

  const navigate = useNavigate();
  // Handle both new and legacy data structures for ABJ
  const t2: any[] =
    casinoData?.data?.sub || casinoData?.data?.data?.data?.t2 || [];

  // React Query for individual result details
  const {
    data: resultDetails,
    isLoading,
    error,
  } = useQuery<any>({
    queryKey: ["casinoIndividualResult", selectedResult?.mid],
    queryFn: () =>
      getCasinoIndividualResult(selectedResult?.mid, cookies, gameSlug),
    enabled: !!selectedResult?.mid && isModalOpen,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });

  // Function to get winner information
  const getWinnerInfo = (resultData: any) => {
    if (!resultData) return { winner: null, description: "" };

    const win = resultData.win;
    const desc = resultData.desc || resultData.newdesc || "";

    let winner = null;
    if (win === "1") winner = "Andar";
    else if (win === "2") winner = "Bahar";

    // Parse description for additional details
    let parsedDesc = "";
    if (desc) {
      const parts = desc.split("#");
      if (parts.length >= 4) {
        parsedDesc = `${parts[0]} | Suit: ${parts[1]} | Odd/Even: ${parts[2]} | Joker: ${parts[3]}`;
      } else {
        parsedDesc = desc;
      }
    }

    return { winner, description: parsedDesc };
  };

  // Function to get joker card details
  const getJokerDetails = (jokerCard: string, desc: string = "") => {
    if (!jokerCard) return { rank: "", suit: "", isOdd: null };

    // Extract rank and suit from card code
    const rank = jokerCard.slice(0, -1);
    const suit = jokerCard.slice(-1);

    // Determine if rank is odd or even
    const numericRank = parseInt(rank);
    const isOdd = numericRank % 2 === 1;

    // Parse description for additional details if available
    let parsedSuit = suit;
    let parsedOddEven = isOdd ? "Odd" : "Even";
    let parsedJoker = rank;

    if (desc) {
      const parts = desc.split("#");
      if (parts.length >= 4) {
        parsedSuit = parts[1] || suit;
        parsedOddEven = parts[2] || (isOdd ? "Odd" : "Even");
        parsedJoker = parts[3] || rank;
      }
    }

    return { 
      rank: parsedJoker, 
      suit: parsedSuit, 
      isOdd: parsedOddEven === "Odd" 
    };
  };

  // Parse result data
  const resultData = resultDetails?.data?.matchData;
  const jokerCard = resultData?.cards?.split(",")[0];
  const { winner, description } = getWinnerInfo(resultData);
  const jokerDetails = getJokerDetails(jokerCard, resultData?.desc);
  const matchTimeDisplay = formatDateTime(
    resultData?.winAt || resultData?.mtime || resultData?.matchTime
  );

  // Debug: Log result details when available
  useEffect(() => {
    if (resultDetails?.data?.matchData) {
      console.log("🎰 ABJ Individual Result Details:", {
        mid: resultDetails.data.matchData.mid,
        win: resultDetails.data.matchData.win,
        cards: resultDetails.data.matchData.cards,
        desc: resultDetails.data.matchData.desc,
        winAt: resultDetails.data.matchData.winAt,
        mtime: resultDetails.data.matchData.mtime,
        parsedDesc: resultDetails.data.matchData.desc?.split("#") || [],
        winner,
        jokerDetails,
        description
      });
    }
  }, [resultDetails, winner, jokerDetails, description]);

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
    if (!result?.mid) return;

    setSelectedResult(result);
    setIsModalOpen(true);
    setBetFilter("all"); // Reset filter when opening modal
  };

  /**
   * Close the result details modal
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  const isLocked = (row: any) => {
    const s = row?.gstatus as string | number | undefined;
    return (
      s === "SUSPENDED" ||
      s === "CLOSED" ||
      s === 0 ||
      s === "0" ||
      (remainingTime ?? 0) <= 3
    );
  };

  // Updated function to find by nation/nat field
  const getByNat = (name: string) => {
    if (!t2 || !Array.isArray(t2)) return null;
    const found = t2.find(
      (x) =>
        String(x?.nat || x?.nation || "").toLowerCase() === name.toLowerCase()
    );
    console.log(`🎰 ABJ getByNat(${name}):`, found);
    return found;
  };

  // Updated function to get nth occurrence by nation/nat field
  const getNthByNat = (name: string, nth: number) => {
    if (!t2 || !Array.isArray(t2)) return null;
    const filtered = t2.filter(
      (x) =>
        String(x?.nat || x?.nation || "").toLowerCase() === name.toLowerCase()
    );
    const found = filtered[nth - 1] || null;
    console.log(
      `🎰 ABJ getNthByNat(${name}, ${nth}):`,
      found,
      `(found ${filtered.length} total)`
    );
    return found;
  };

  // Helper function to get bet by sid
  const getBySid = (sid: string) => {
    if (!t2 || !Array.isArray(t2)) return null;
    const found = t2.find((x) => String(x?.sid) === String(sid));
    console.log(`🎰 ABJ getBySid(${sid}):`, found);
    return found;
  };

  /**
   * Calculate profit/loss for main player bets (SA, SB) using book calculation
   */
  const getPlayerBetProfitLoss = (playerName: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let book: Record<string, number> = {
      "SA": 0,
      "SB": 0
    };

    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    bets.forEach((bet: any) => {
      const { betName, stake, betRate, oddCategory } = bet.betData;

      if (betName === "SA" || betName === "SB") {
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

  /**
   * Calculate profit/loss for specific betting types with separate book calculation
   */
  const getBetProfitLoss = (betType: string): number => {
    if (!currentBet?.data || !casinoData?.data?.mid) return 0;

    const currentMatchId = casinoData.data.mid;
    let profitLoss = 0;

    const bets = currentBet.data.filter(
      (bet: any) => String(bet.matchId) === String(currentMatchId)
    );

    // Create separate books for different betting categories
    const oddEvenBook: Record<string, number> = { "Odd": 0, "Even": 0 };
    const colorBook: Record<string, number> = { "Heart": 0, "Diamond": 0, "Club": 0, "Spade": 0 };
    const jokerCardBook: Record<string, number> = {};

    bets.forEach((bet: any) => {
      const { betName, stake, betRate, oddCategory } = bet.betData;
      const normalizedBetName = betName?.toLowerCase() || "";

      // Handle Odd/Even bets (separate book)
      if (normalizedBetName.includes("joker") && normalizedBetName.includes("odd")) {
        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          oddEvenBook["Odd"] += profit;
          oddEvenBook["Even"] -= stake; // Loss if Even wins
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          oddEvenBook["Odd"] -= loss;
          oddEvenBook["Even"] += stake; // Profit if Even wins
        }
      } else if (normalizedBetName.includes("joker") && normalizedBetName.includes("even")) {
        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          oddEvenBook["Even"] += profit;
          oddEvenBook["Odd"] -= stake; // Loss if Odd wins
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          oddEvenBook["Even"] -= loss;
          oddEvenBook["Odd"] += stake; // Profit if Odd wins
        }
      }
      // Handle Color/Suit bets (separate book)
      else if (normalizedBetName.includes("joker") && normalizedBetName.includes("heart")) {
        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          colorBook["Heart"] += profit;
          Object.keys(colorBook).forEach(color => {
            if (color !== "Heart") colorBook[color] -= stake;
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          colorBook["Heart"] -= loss;
          Object.keys(colorBook).forEach(color => {
            if (color !== "Heart") colorBook[color] += stake;
          });
        }
      } else if (normalizedBetName.includes("joker") && normalizedBetName.includes("diamond")) {
        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          colorBook["Diamond"] += profit;
          Object.keys(colorBook).forEach(color => {
            if (color !== "Diamond") colorBook[color] -= stake;
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          colorBook["Diamond"] -= loss;
          Object.keys(colorBook).forEach(color => {
            if (color !== "Diamond") colorBook[color] += stake;
          });
        }
      } else if (normalizedBetName.includes("joker") && normalizedBetName.includes("club")) {
        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          colorBook["Club"] += profit;
          Object.keys(colorBook).forEach(color => {
            if (color !== "Club") colorBook[color] -= stake;
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          colorBook["Club"] -= loss;
          Object.keys(colorBook).forEach(color => {
            if (color !== "Club") colorBook[color] += stake;
          });
        }
      } else if (normalizedBetName.includes("joker") && normalizedBetName.includes("spade")) {
        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          colorBook["Spade"] += profit;
          Object.keys(colorBook).forEach(color => {
            if (color !== "Spade") colorBook[color] -= stake;
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          colorBook["Spade"] -= loss;
          Object.keys(colorBook).forEach(color => {
            if (color !== "Spade") colorBook[color] += stake;
          });
        }
      }
      // Handle Joker Card bets (separate book)
      else if (normalizedBetName.includes("joker") && !normalizedBetName.includes("odd") && !normalizedBetName.includes("even") && !normalizedBetName.includes("heart") && !normalizedBetName.includes("diamond") && !normalizedBetName.includes("club") && !normalizedBetName.includes("spade")) {
        // Extract card value from bet name
        const cardValue = betName.split(" ").pop() || "";
        if (!jokerCardBook[cardValue]) jokerCardBook[cardValue] = 0;

        if (oddCategory.toLowerCase() === "back") {
          const profit = stake * (betRate - 1);
          jokerCardBook[cardValue] += profit;
          Object.keys(jokerCardBook).forEach(card => {
            if (card !== cardValue) jokerCardBook[card] -= stake;
          });
        } else if (oddCategory.toLowerCase() === "lay") {
          const loss = stake * (betRate - 1);
          jokerCardBook[cardValue] -= loss;
          Object.keys(jokerCardBook).forEach(card => {
            if (card !== cardValue) jokerCardBook[card] += stake;
          });
        }
      }
    });

    // Return the appropriate book value based on bet type
    if (betType === "Joker Odd") {
      return oddEvenBook["Odd"];
    } else if (betType === "Joker Even") {
      return oddEvenBook["Even"];
    } else if (betType === "Joker Heart") {
      return colorBook["Heart"];
    } else if (betType === "Joker Diamond") {
      return colorBook["Diamond"];
    } else if (betType === "Joker Club") {
      return colorBook["Club"];
    } else if (betType === "Joker Spade") {
      return colorBook["Spade"];
    } else if (betType.startsWith("Joker")) {
      const cardValue = betType.split(" ")[1];
      return jokerCardBook[cardValue] || 0;
    }

    return profitLoss;
  };

  const renderBox = (label: string, row: any, extraClasses: string = "") => {
    // Create a default row if none exists
    const defaultRow = {
      sid: null,
      b: 0,
      l: 0,
      gstatus: "OPEN"
    };
    const actualRow = row || defaultRow;
    const locked = isLocked(actualRow);
    const value = actualRow?.b ?? 0;
    const profitLoss = getPlayerBetProfitLoss(label);

    const handleClick = () => {
      if (!locked && actualRow?.sid) {
        console.log("🎰 ABJ Bet Click:", {
          label,
          sid: actualRow.sid,
          value,
          locked,
          row: actualRow,
        });
        onBetClick?.(String(actualRow.sid), "back");
      }
    };

    return (
      <div
        className={`relative flex flex-col min-w-16 px-2 border-2 border-yellow-400 items-center justify-center ${extraClasses}`}
        onClick={handleClick}
      >
        {locked && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <RiLockFill className="text-white text-lg" />
          </div>
        )}
        <h2
          className={`text-sm font-semibold leading-6 ${extraClasses.includes("bg-[var(--bg-back)]") ? "text-white" : ""}`}
        >
          {label}
        </h2>
        <p
          className={`text-sm font-normal leading-4 ${extraClasses.includes("bg-[var(--bg-back)]") ? "text-white" : ""}`}
        >
          {value}
        </p>
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
      </div>
    );
  };

  // Debug: Log the t2 data structure
  console.log("🎰 ABJ t2 data:", t2);
  console.log(
    "🎰 ABJ Available nations:",
    t2 && Array.isArray(t2) ? t2.map((x) => ({
      sid: x.sid,
      nat: x.nat,
      nation: x.nation,
      b: x.b,
      gstatus: x.gstatus,
    })) : []
  );

  // Debug: Test specific sid lookups
  console.log("🎰 ABJ Test lookups:", {
    sid1: getBySid("1"), // SA
    sid2: getBySid("2"), // 1st Bet
    sid3: getBySid("3"), // 2nd Bet A
    sid4: getBySid("4"), // SB
    sid5: getBySid("5"), // 1st Bet B
    sid6: getBySid("6"), // 2nd Bet B
    sid24: getBySid("24"), // Joker Odd
    sid25: getBySid("25"), // Joker Even
    sid7: getBySid("7"), // Joker A
    sid20: getBySid("20"), // Joker Spade
  });

  return (
    <div className="flex flex-col gap-1 mt-1">
      {/* first row */}
      <div className=" bg-[var(--bg-table-row)] border py-4 border-gray-300">
        <div className="grid lg:grid-cols-2 gap-1 grid-cols-1">
          {/* Side A */}
          <div className="col-span-1 flex gap-2 items-center justify-center">
            <h2 className="text-base font-semibold">A</h2>
            {renderBox("SA", getBySid("1"), "bg-white")}
            {renderBox("First Bet", getBySid("2"), "bg-[var(--bg-back)]")}
            {renderBox("Second Bet", getBySid("3"), "bg-[var(--bg-back)]")}
            <h2 className="text-base font-semibold">A</h2>
          </div>
          {/* Side B */}
          <div className="col-span-1 flex gap-2 items-center justify-center">
            <h2 className="text-base font-semibold">B</h2>
            {renderBox("SB", getBySid("4"), "bg-white")}
            {renderBox("First Bet", getBySid("5"), "bg-[var(--bg-back)]")}
            {renderBox("Second Bet", getBySid("6"), "bg-[var(--bg-back)]")}
            <h2 className="text-base font-semibold">B</h2>
          </div>
        </div>
      </div>
      {/* second row */}
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-1 ">
        {/* first column */}
        <div className="border py-4 bg-[var(--bg-table-row)] flex gap-2 items-center justify-center p-1 border-gray-300">
          {[
            { name: "Joker Odd", sid: "24" },
            { name: "Joker Even", sid: "25" },
          ].map(({ name, sid }) => {
            const row = getBySid(sid);
            if (!row) return null; // Add null check
            const locked = isLocked(row);
            const profitLoss = getBetProfitLoss(name);
            return (
              <div key={name} className="flex flex-col gap-2 w-full">
                <h2 className="text-base font-semibold text-center">
                  {name.replace("Joker ", "").toUpperCase()}
                </h2>
                <div
                  className="relative bg-[var(--bg-back)] w-full cursor-pointer"
                  onClick={() => {
                    if (!locked && row?.sid) {
                      console.log("🎰 ABJ Joker Bet Click:", {
                        name,
                        sid: row.sid,
                        value: row?.b,
                        locked,
                        row,
                      });
                      onBetClick?.(String(row.sid), "back");
                    }
                  }}
                >
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                  <h2 className="text-base font-semibold leading-10 text-center">
                    {row?.b ?? 0}
                  </h2>
                </div>
                <h2 
                  className={`text-xs font-medium text-center ${
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
              </div>
            );
          })}
        </div>
        {/* second column */}
        <div className="border py-4 bg-[var(--bg-table-row)] flex gap-2 items-center justify-center p-1 border-gray-300">
          {[
            { name: "Joker Heart", label: "Hearts", sid: "22" },
            { name: "Joker Club", label: "Clubs", sid: "21" },
            { name: "Joker Diamond", label: "Diamonds", sid: "23" },
            { name: "Joker Spade", label: "Spades", sid: "20" },
          ].map(({ name, label, sid }) => {
            const row = getBySid(sid);
            if (!row) return null; // Add null check
            const locked = isLocked(row);
            const profitLoss = getBetProfitLoss(name);

            let suitImage: string = "";
            switch (label) {
              case "Hearts":
                suitImage = getRedShapes().Heart;
                break;
              case "Diamonds":
                suitImage = getRedShapes().Diamond;
                break;
              case "Spades":
                suitImage = getBlackShapes().Spade;
                break;
              case "Clubs":
                suitImage = getBlackShapes().Club;
                break;
              default:
                suitImage = ""; // fallback
            }

            return (
              <div key={name} className="flex flex-col gap-2 w-full">
                {suitImage && (
                  <img src={suitImage} className="w-6 h-6 mx-auto" />
                )}
                <div
                  className="relative bg-[var(--bg-back)] w-full cursor-pointer"
                  onClick={() => {
                    if (!locked && row?.sid) {
                      console.log("🎰 ABJ Joker Suit Bet Click:", {
                        name,
                        label,
                        sid: row.sid,
                        value: row?.b,
                        locked,
                        row,
                      });
                      onBetClick?.(String(row.sid), "back");
                    }
                  }}
                >
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                  <h2 className="text-base font-semibold leading-10 text-center">
                    {row?.b ?? 0}
                  </h2>
                </div>
                <h2 
                  className={`text-xs font-medium text-center ${
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
              </div>
            );
          })}
        </div>
      </div>
      {/* third row - Joker A..K selection (desktop 13, mobile 10 + 3) */}
      <div className="w-full bg-[var(--bg-table-row)] border border-gray-300 flex flex-col gap-2 py-4">
        <div className="w-8/12 mx-auto hidden lg:grid lg:grid-cols-[repeat(13,minmax(0,1fr))] gap-1 place-items-center place-content-center">
          {[
            { name: "Joker A", sid: "7" },
            { name: "Joker 2", sid: "8" },
            { name: "Joker 3", sid: "9" },
            { name: "Joker 4", sid: "10" },
            { name: "Joker 5", sid: "11" },
            { name: "Joker 6", sid: "12" },
            { name: "Joker 7", sid: "13" },
            { name: "Joker 8", sid: "14" },
            { name: "Joker 9", sid: "15" },
            { name: "Joker 10", sid: "16" },
            { name: "Joker J", sid: "17" },
            { name: "Joker Q", sid: "18" },
            { name: "Joker K", sid: "19" },
          ].map(({ name, sid }, idx) => {
            const row = getBySid(sid);
            if (!row) return null; // Add null check
            const locked = isLocked(row);
            const profitLoss = getBetProfitLoss(name);
            return (
              <div
                key={idx}
                className="w-full aspect-square text-center text-base font-semibold text-[var(--bg-secondary)] flex flex-col items-center justify-center"
              >
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
                <button
                  className="relative w-full h-fit flex items-center justify-center"
                  disabled={locked}
                  onClick={() => {
                    if (!locked && row?.sid) {
                      console.log("🎰 ABJ Joker Card Bet Click (Desktop):", {
                        name,
                        sid: row.sid,
                        locked,
                        row,
                      });
                      onBetClick?.(String(row.sid), "back");
                    }
                  }}
                >
                  {locked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RiLockFill className="text-white text-lg" />
                    </div>
                  )}
                  <img src={getNumberCard(name?.split(" ").pop() || "")} alt="" className="w-8" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="w-11/12 mx-auto grid lg:hidden gap-2">
          <div className="grid grid-cols-10 gap-1 place-items-center">
            {[
              { name: "Joker A", sid: "7" },
              { name: "Joker 2", sid: "8" },
              { name: "Joker 3", sid: "9" },
              { name: "Joker 4", sid: "10" },
              { name: "Joker 5", sid: "11" },
              { name: "Joker 6", sid: "12" },
              { name: "Joker 7", sid: "13" },
              { name: "Joker 8", sid: "14" },
              { name: "Joker 9", sid: "15" },
              { name: "Joker 10", sid: "16" },
            ].map(({ name, sid }, idx) => {
              const row = getBySid(sid);
              if (!row) return null; // Add null check
              const locked = isLocked(row);
              const profitLoss = getBetProfitLoss(name);
              return (
                <div
                  key={idx}
                  className="w-full aspect-square text-center text-base font-semibold text-[var(--bg-secondary)] flex gap-2 flex-col items-center justify-center"
                >
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
                  <button
                    className="relative w-full h-full flex items-center justify-center"
                    disabled={locked}
                    onClick={() => {
                      if (!locked && row?.sid) {
                        console.log(
                          "🎰 ABJ Joker Card Bet Click (Mobile Row 1):",
                          {
                            name,
                            sid: row.sid,
                            locked,
                            row,
                          }
                        );
                        onBetClick?.(String(row.sid), "back");
                      }
                    }}
                  >
                    {locked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RiLockFill className="text-white text-lg" />
                      </div>
                    )}
                    <img src={getNumberCard(name?.split(" ").pop() || "")} alt="" className="w-6" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="w-full mt-4 flex justify-center">
            <div className="grid grid-cols-3 gap-1 place-items-center">
              {[
                { name: "Joker J", sid: "17" },
                { name: "Joker Q", sid: "18" },
                { name: "Joker K", sid: "19" },
              ].map(({ name, sid }, idx) => {
                const row = getBySid(sid);
                if (!row) return null; // Add null check
                const locked = isLocked(row);
                const profitLoss = getBetProfitLoss(name);
                return (
                  <div
                    key={idx}
                    className="w-full aspect-square text-center text-base font-semibold text-[var(--bg-secondary)] flex flex-col items-center justify-center"
                  >
                    <h2 
                      className={`text-xs mb-2 font-medium ${
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
                    <button
                      className="relative w-full h-full flex items-center justify-center"
                      disabled={locked}
                      onClick={() => {
                        if (!locked && row?.sid) {
                          console.log(
                            "🎰 ABJ Joker Card Bet Click (Mobile Row 2):",
                            {
                              name,
                              sid: row.sid,
                              locked,
                              row,
                            }
                          );
                          onBetClick?.(String(row.sid), "back");
                        }
                      }}
                    >
                      {locked && (
                        <div className="absolute inset-0  bg-black/60 h-7 flex items-center justify-center">
                          <RiLockFill className="text-white text-lg" />
                        </div>
                      )}
                      <img src={getNumberCard(name?.split(" ").pop() || "")} alt="" className="w-6 " />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
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
            className="text-sm font-normal leading-8 text-white"
          >
            View All
          </h2>
        </div>
        <div className="flex justify-end items-center mb-2 gap-1 mx-2">
          {Array.isArray(results) && results.length > 0
            ? results.slice(0, 10).map((item: any, index: number) => (
                <h2
                  key={index}
                  className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.win === "2" ? "text-red-500" : "text-yellow-400"} cursor-pointer hover:scale-110 transition-transform`}
                  onClick={() => handleResultClick(item)}
                  title="Click to view details"
                >
                  {item.win === "1" ? "A" : "B"}
                </h2>
              ))
            : // Fallback to old data structure if results prop is not available
              (casinoData as any)?.data?.data?.result
                ?.slice(0, 10)
                .map((item: any, index: number) => (
                  <h2
                    key={index}
                    className={`h-7 w-7 bg-[var(--bg-casino-result)] rounded-full border border-gray-300 flex justify-center items-center text-sm font-semibold ${item.win === "1" ? "text-red-500" : "text-yellow-400"} cursor-pointer hover:scale-110 transition-transform`}
                    onClick={() => handleResultClick(item)}
                    title="Click to view details"
                  >
                    {item.win === "1" ? "A" : "B"}
                  </h2>
                ))}
        </div>
      </div>

      {/* Individual Result Details Modal */}
      <CasinoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Result Details"
        size="xl"
        resultDetails={true}
      >
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--bg-primary)]"></div>
          </div>
        ) : (
          <div className="flex flex-col px-2">
            {/* top */}
            <div className="flex justify-between items-center">
              <h2 className="text-xs md:text-sm font-semibold leading-8 text-black">
                Round Id:
                <span className="text-black font-normal pl-1">
                  {resultDetails?.data?.matchData?.mid}
                </span>
              </h2>
              <h2 className="text-xs md:text-sm font-semibold leading-8 text-black capitalize">
                Match Time:{" "}
                <span className="text-black font-normal pl-1">
                  {matchTimeDisplay}
                </span>
              </h2>
            </div>
            {/* result data  */}
            <div className="flex flex-col gap-1 justify-center items-center py-2">
              <div className="flex md:flex-row flex-col  w-full py-4 justify-between items-center">
                <div className="grid grid-cols-5 justify-between gap-2 w-fit mx-auto">
                  <div className="col-span-1 w-full flex items-center justify-between">
                    <div className="flex-col items-center justify-center">
                      <h2 className="text-base font-semibold leading-8 text-black">
                        A
                      </h2>
                      <h2 className="text-base font-semibold leading-8 text-black">
                        B
                      </h2>
                    </div>
                    <div className="flex items-center justify-center">
                      <img
                        src={getCardByCode(
                          resultDetails?.data?.matchData?.cards?.split(
                            ","
                          )[0]
                        )}
                        alt=""
                        className="w-8"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 w-full flex flex-col items-center justify-center gap-2">
                    <div>
                      {" "}
                      <img
                        src={getCardByCode(
                          resultDetails?.data?.matchData?.cards?.split(
                            ","
                          )[2]
                        )}
                        alt=""
                        className="w-8"
                      />
                    </div>
                    <div>
                      {" "}
                      <img
                        src={getCardByCode(
                          resultDetails?.data?.matchData?.cards?.split(
                            ","
                          )[1]
                        )}
                        alt=""
                        className="w-8"
                      />
                    </div>
                  </div>
                  <div className="col-span-3 w-full  ">
                    {(() => {
                      const cards =
                        resultDetails?.data?.matchData?.cards
                          ?.split(",")
                          .slice(3) || [];

                      // distribute cards: first to B, then A, alternate
                      const playerA: string[] = [];
                      const playerB: string[] = [];

                      cards.forEach((card: string, index: number) => {
                        if (card === "1") return; // skip placeholder 1s
                        if (index % 2 === 0) {
                          // even index → Player B
                          playerB.push(card);
                        } else {
                          // odd index → Player A
                          playerA.push(card);
                        }
                      });

                      return (
                        <div className="flex flex-col gap-4">
                          <div>
                            <div className="flex gap-2 flex-nowrap overflow-x-auto">
                              {playerA.map((card, i) => (
                                <img
                                  src={getCardByCode(card)}
                                  alt=""
                                  className="w-8"
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="flex gap-2 flex-nowrap overflow-x-auto">
                              {playerB.map((card, i) => (
                                <img
                                  src={getCardByCode(card)}
                                  alt=""
                                  className="w-8"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            {/* bottom  description*/}
            <div
              className="max-w-lg  mx-auto w-full mb-4 box-shadow-lg border border-gray-100 bg-gray-50"
              style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5);" }}
            >
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Winner:{" "}
                  <span className="text-black font-normal pl-1">
                    {winner || "N/A"}
                  </span>
                </h2>
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Suit:{" "}
                  <span className="text-black font-normal pl-1">
                    {jokerDetails.suit
                      ? jokerDetails.suit.toUpperCase()
                      : "N/A"}
                  </span>
                </h2>
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Odd/Even:{" "}
                  <span className="text-black font-normal pl-1">
                    {jokerDetails.isOdd !== null
                      ? jokerDetails.isOdd
                        ? "Odd"
                        : "Even"
                      : "N/A"}
                  </span>
                </h2>
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Joker:{" "}
                  <span className="text-black font-normal pl-1">
                    {jokerDetails.rank || "N/A"}
                  </span>
                </h2>
              
              </div>
            </div>

            {/* User Bets Table */}
            {resultDetails?.data?.userBets &&
              resultDetails.data.userBets.length > 0 && (
                <div className="max-w-4xl mx-auto w-full mb-4">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">
                      User Bets
                    </h3>
                  </div>

                  {/* Filter Options */}
                  <div className="bg-white px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="betFilter"
                          value="all"
                          checked={betFilter === "all"}
                          onChange={(e) => setBetFilter(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm">All</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="betFilter"
                          value="back"
                          checked={betFilter === "back"}
                          onChange={(e) => setBetFilter(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm">Back</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="betFilter"
                          value="lay"
                          checked={betFilter === "lay"}
                          onChange={(e) => setBetFilter(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm">Lay</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="betFilter"
                          value="deleted"
                          checked={betFilter === "deleted"}
                          onChange={(e) => setBetFilter(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm">Deleted</span>
                      </label>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-white px-4 py-2 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Total Bets:{" "}
                        {
                          getFilteredBets(
                            resultDetails.data.userBets,
                            betFilter
                          ).length
                        }
                      </span>
                      <span className="text-sm font-medium">
                        Total Amount:{" "}
                        {(() => {
                          const totalAmount = getFilteredBets(
                            resultDetails.data.userBets,
                            betFilter
                          ).reduce((sum: number, bet: any) => {
                            const result = bet.betData?.result;

                            if (!result || !result.settled) return sum;

                            let profitLoss = 0;

                            if (
                              result.status === "won" ||
                              result.status === "profit"
                            ) {
                              profitLoss = Number(result.profitLoss) || 0;
                            } else if (result.status === "lost") {
                              profitLoss = (Number(result.profitLoss) || 0);
                            }

                            return sum + profitLoss;
                          }, 0);

                          return (
                            <span
                              className={
                                totalAmount >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {totalAmount.toFixed(2)}
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700">
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                            Nation
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                            Rate
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                            Amount
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                            Profit/Loss
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                            Date
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium text-nowrap">
                            IP Address
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium text-nowrap">
                            Browser Details
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-center font-medium">
                            <input type="checkbox" className="text-blue-600" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredBets(
                          resultDetails.data.userBets,
                          betFilter
                        ).map((bet: any, index: number) => (
                          <tr
                            key={bet.id}
                            className={`hover:bg-gray-50 ${
                              bet.betData?.oddCategory?.toLowerCase() === "back"
                                ? "bg-[var(--bg-back)]"
                                : bet.betData?.oddCategory?.toLowerCase() ===
                                    "lay"
                                  ? "bg-[var(--bg-lay)]"
                                  : "bg-white"
                            }`}
                          >
                            <td className="border text-nowrap border-gray-300 px-3 py-2">
                              {bet.betData?.name ||
                                bet.betData?.betName ||
                                "N/A"}
                            </td>
                            <td className="border text-nowrap border-gray-300 px-3 py-2">
                              {bet.betData?.betRate ||
                                bet.betData?.matchOdd ||
                                "N/A"}
                            </td>
                            <td className="border text-nowrap border-gray-300 px-3 py-2">
                              {bet.betData?.stake || "N/A"}
                            </td>
                            <td
                              className={`border text-nowrap border-gray-300 px-3 py-2 ${
                                bet.betData?.result?.status === "won"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {bet.betData?.result?.status === "won"
                                ? "+"
                                : ""}{" "}
                              {bet.betData?.result?.profitLoss?.toFixed(2) ||
                                "N/A"}
                            </td>
                            <td className="border text-nowrap border-gray-300 px-3 py-2">
                              {new Date(bet.createdAt).toLocaleString()}
                            </td>
                            <td className="border text-nowrap border-gray-300 px-3 py-2 text-xs">
                              {/* IP address would come from bet data if available */}
                              N/A
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                Detail
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                className="text-blue-600"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Error State */}
            {error && (
              <div className="flex justify-center items-center py-8">
                <div className="text-red-500 text-center">
                  <p>Failed to load result details</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Please try again later
                  </p>
                </div>
              </div>
            )}

            {/* No Data State */}
            {!isLoading &&
              !error &&
              !resultDetails?.data?.matchData && (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500 text-center">
                    <p>No result data available</p>
                  </div>
                </div>
              )}
          </div>
        )}
      </CasinoModal>
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component with deep comparison for casinoData
const AndarBahar2 = memoizeCasinoComponent(AndarBahar2Component);
AndarBahar2.displayName = "AndarBahar2";

export default AndarBahar2;
