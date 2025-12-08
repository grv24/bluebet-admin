import React, { useState } from "react";
import { getCardByCode } from "@/utils/card";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const formatDateTime = (
  value: string | number | Date | null | undefined
): string => {
  if (value === undefined || value === null) return "N/A";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "N/A";
    return value.toLocaleString();
  }

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

const parseTeen8Description = (
  desc: string,
  win: string | undefined | null
) => {
  const segments = (desc || "").split("#").map((segment) => segment.trim());

  // Get winner - just the number(s), not "Player X"
  const rawWinners = segments[0] || "";
  const winnerTokens = rawWinners
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  // Use win field if available, otherwise use description
  const winSet = new Set(
    (win || "")
      .split(/[, ]/)
      .map((token) => token.trim())
      .filter(Boolean)
  );

  // Get winner number(s) - just the number, not "Player X"
  let winnersText = "N/A";
  if (winnerTokens.length > 0) {
    winnersText = winnerTokens.join(", ");
  } else if (winSet.size > 0) {
    const winnerNumbers = Array.from(winSet)
      .filter((token) => token !== "0")
      .map((token) => token);
    winnersText = winnerNumbers.length > 0 ? winnerNumbers.join(", ") : "N/A";
  }

  // Parse Pair Plus - format: "1 : Straight" (player number : type)
  const pairPlusLabel = segments[1] || "";
  const pairPlusText = pairPlusLabel || "N/A";

  // Parse Total - format with line breaks
  const totalSegments = segments[2]
    ? segments[2]
        .split("~")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

  let dealerTotal: string | null = null;
  const playerTotalLines: string[] = [];

  totalSegments.forEach((line) => {
    if (/^Dealer\s*:/i.test(line)) {
      const dealerValue = line.replace(/^Dealer\s*:/i, "").trim();
      dealerTotal = dealerValue || null;
    } else {
      playerTotalLines.push(line);
    }
  });

  return {
    winnersText,
    pairPlusText,
    playerTotalLines,
    dealerTotal,
    winSet,
  };
};

const parsePoker6Cards = (cardsString: string) => {
  if (!cardsString) {
    return {
      boardCards: [] as string[],
      players: Array.from({ length: 6 }, () => [] as string[]),
    };
  }

  const cards = cardsString
    .split(",")
    .map((card) => card.trim())
    .filter((card) => card && card !== "1");

  const players = Array.from({ length: 6 }, (_, index) => {
    const firstCard = cards[index];
    const secondCard = cards[index + 6];
    return [firstCard, secondCard].filter(
      (card): card is string => !!card && card !== "1"
    );
  });

  const boardCards = cards.slice(12);

  return { boardCards, players };
};

const getPoker6WinnerSet = (winValue: any) => {
  const tokens = String(winValue ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const winnerSet = new Set<number>();

  tokens.forEach((token) => {
    const lower = token.toLowerCase();
    if (lower.includes("player")) {
      const playerMatch = lower.match(/player\s*(\d+)/);
      if (playerMatch && playerMatch[1]) {
        const num = Number(playerMatch[1]);
        if (!Number.isNaN(num) && num >= 1 && num <= 6) {
          winnerSet.add(num);
          return;
        }
      }
    }

    const numericMatch = token.match(/(\d+)/);
    if (numericMatch && numericMatch[1]) {
      const numeric = Number(numericMatch[1]);
      if (!Number.isNaN(numeric)) {
        if (numeric >= 11 && numeric <= 16) {
          winnerSet.add(numeric - 10);
        } else if (numeric >= 1 && numeric <= 6) {
          winnerSet.add(numeric);
        }
      }
    }
  });

  return winnerSet;
};

interface CasinoMatchDetailsDisplayProps {
  matchData: any;
  gameType: string;
  betFilter: string;
  setBetFilter: (filter: string) => void;
  getFilteredBets: (bets: any[], filter: string) => any[];
  userBets?: any[];
  showUserName?: boolean;
}

const CasinoMatchDetailsDisplay: React.FC<CasinoMatchDetailsDisplayProps> = ({
  matchData,
  gameType,
  betFilter,
  setBetFilter,
  getFilteredBets,
  userBets = [],
}) => {
  // State for Duskadum card slider
  const [dum10CardIndex, setDum10CardIndex] = useState(0);

  // State for AB20 card sliders
  const [firstRowIndex, setFirstRowIndex] = useState(0);
  const [secondRowIndex, setSecondRowIndex] = useState(0);

  console.log(gameType, "gameType---");

  // Reset card index when matchData changes
  React.useEffect(() => {
    setDum10CardIndex(0);
    setFirstRowIndex(0);
    setSecondRowIndex(0);
  }, [matchData?.mid]);

  // Guard against undefined, null, or empty gameType
  if (!gameType || typeof gameType !== "string" || gameType.trim() === "") {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-red-500 text-center">
          <p>Invalid game type provided</p>
        </div>
      </div>
    );
  }

  // Normalize game type
  let normalizedGameType = gameType.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Handle 32card variations - normalize to "32card" for display
  // API may send "CARD_32" -> normalized to "card32" -> map to "32card"
  if (
    normalizedGameType === "card32" ||
    normalizedGameType === "32card" ||
    normalizedGameType.includes("card32") ||
    normalizedGameType.includes("32card")
  ) {
    normalizedGameType = "32card";
  }

  // Handle Dragon Tiger Lion 20
  if (
    normalizedGameType.includes("dtl20") ||
    normalizedGameType.includes("dragontigerlion20") ||
    normalizedGameType === "dtl20"
  ) {
    normalizedGameType = "dtl20";
  }

  // Handle Dragon Tiger variations - normalize to dt6, dt20, or dt202
  // "DRAGON_TIGER_20_2" -> "dragontiger202" -> "dt202"
  // "DRAGON_TIGER_20" -> "dragontiger20" -> "dt20"
  // "DRAGON_TIGER_6" -> "dragontiger6" -> "dt6"
  if (normalizedGameType.includes("dragontiger") || normalizedGameType.startsWith("dt")) {
    // Check for dt202 first (before dt20) to avoid false matches
    if (
      normalizedGameType.includes("202") ||
      normalizedGameType.includes("20_2") ||
      normalizedGameType === "dragontiger202" ||
      normalizedGameType === "dt202"
    ) {
      normalizedGameType = "dt202";
    } else if (
      (normalizedGameType.includes("20") && !normalizedGameType.includes("202")) ||
      normalizedGameType === "dragontiger20" ||
      normalizedGameType === "dt20"
    ) {
      normalizedGameType = "dt20";
    } else if (
      normalizedGameType.includes("6") ||
      normalizedGameType === "dragontiger6" ||
      normalizedGameType === "dt6"
    ) {
      normalizedGameType = "dt6";
    }
  }

  // Handle Casino War variations - normalize to "war"
  if (
    normalizedGameType === "casinowar" ||
    normalizedGameType === "war" ||
    normalizedGameType.includes("war")
  ) {
    normalizedGameType = "war";
  }

  // Handle Lucky15 variations first (before Lucky7, since "lucky15" contains "lucky7")
  if (
    normalizedGameType.includes("lucky15") ||
    normalizedGameType === "lucky15" ||
    normalizedGameType === "lucky715"
  ) {
    normalizedGameType = "lucky15";
  }

  // Handle Lucky7 variations - normalize all Lucky7 variants to "lucky7eu"
  // "LUCKY7" -> "lucky7" -> "lucky7eu"
  // "LUCKY7EU" -> "lucky7eu" -> "lucky7eu"
  // "LUCKY7EU_2" -> "lucky7eu2" -> "lucky7eu"
  // "LUCKY7B" -> "lucky7b" -> "lucky7eu"
  // "LUCKY7C" -> "lucky7c" -> "lucky7eu"
  else if (normalizedGameType.includes("lucky7")) {
    // All Lucky7 variants map to "lucky7eu"
    normalizedGameType = "lucky7eu";
  }

  // Handle SuperOver variations - normalize all SuperOver variants to "superover"
  // "SUPEROVER" -> "superover" -> "superover"
  // "SUPEROVER_3" -> "superover3" -> "superover"
  // "SUPEROVER3" -> "superover3" -> "superover"
  if (normalizedGameType.includes("superover") || normalizedGameType === "superover3") {
    normalizedGameType = "superover";
  }

  // Handle Cricket variations - normalize all Cricket variants to "cricket_v3"
  // "CRICKET_V3" -> "cricketv3" -> "cricket_v3"
  // "FivefiveCricket" -> "fivefivecricket" -> "cricket_v3"
  if (normalizedGameType.includes("cricket")) {
    normalizedGameType = "cricket_v3";
  }

  // Handle Goal variations - normalize to "goal"
  if (normalizedGameType.includes("goal") || normalizedGameType === "goal") {
    normalizedGameType = "goal";
  }

  // Handle Casino Meter 1 variations - normalize to "cmeter1"
  if (
    normalizedGameType.includes("cmeter") ||
    normalizedGameType.includes("casinometer") ||
    normalizedGameType === "cmeter1" ||
    normalizedGameType === "casinometer1"
  ) {
    normalizedGameType = "cmeter1";
  }

  // Handle poker variations - normalize all poker variants to "poker"
  if (normalizedGameType.includes("poker")) {
    // Check for specific variants first
    if (
      normalizedGameType.includes("poker6") ||
      normalizedGameType.includes("poker9")
    ) {
      // POKER_6 and POKER_9 both use poker6 format (6 players)
      normalizedGameType = "poker6";
    } else if (normalizedGameType.includes("poker20")) {
      normalizedGameType = "poker20";
    } else {
      // All other poker variants (poker1day, pokeroneday, etc.) -> "poker"
      normalizedGameType = "poker";
    }
  }

  // Parse cards from cards string
  const parseCards = (cardsString: string) => {
    if (!cardsString) return [];
    return cardsString
      .split(",")
      .filter((card) => card && card.trim() && card !== "1");
  };

  // Parse description sections
  const parseDescription = (desc: string, newdesc?: string) => {
    const descString = newdesc || desc || "";
    return descString.split("#");
  };

  const getTeenWinnerInfo = (matchData: any) => {
    const defaultInfo = {
      winner: "Tie",
      cards: [] as string[],
      oddEven: [] as string[],
      consecutive: "",
      cardDetails: [] as {
        position: number;
        label: string;
        oddEven?: string;
      }[],
      descriptionSegments: [] as string[],
    };

    if (!matchData) {
      return defaultInfo;
    }

    const win = matchData.win;
    let winner: string | null = null;

    if (win === "1") winner = "Player A";
    else if (win === "2") winner = "Player B";
    else if (win === "0") winner = "Tie";

    let cards: string[] = [];
    let oddEven: string[] = [];
    let consecutive = "";
    let descriptionSegments: string[] = [];

    const safeSplit = (value?: string) =>
      value
        ? value
            .trim()
            .split(/\s+/)
            .map((token) => token.trim())
            .filter(Boolean)
        : [];

    const parseStructuredDescription = (raw: string) => {
      const segments = raw.split("#").map((segment) => segment.trim());
      descriptionSegments = segments.filter((segment) => segment.length > 0);

      if (!winner && segments[0]) {
        winner = segments[0];
      }

      if (segments[1]) {
        cards = safeSplit(segments[1]);
      }

      if (segments[2]) {
        oddEven = safeSplit(segments[2]);
      }

      if (segments[3]) {
        consecutive = segments[3]
          .split("|")
          .map((part) => part.replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .join(" | ");
      }
    };

    if (matchData.newdesc && matchData.newdesc.includes("#")) {
      parseStructuredDescription(matchData.newdesc);
    } else if (matchData.desc && matchData.desc.includes("#")) {
      parseStructuredDescription(matchData.desc);
    } else if (matchData.desc) {
      descriptionSegments = [matchData.desc];
    }

    if (!winner) {
      winner = defaultInfo.winner;
    }

    const cardDetails = cards.map((label, index) => ({
      position: index + 1,
      label,
      oddEven: oddEven[index],
    }));

    return {
      winner,
      cards,
      oddEven,
      consecutive,
      cardDetails,
      descriptionSegments,
    };
  };

  // Render game-specific result display
  const renderGameResult = () => {
    const cardsString = matchData?.cards || "";
    const cards = parseCards(cardsString);
    const descSections = parseDescription(matchData?.desc, matchData?.newdesc);
    const win = matchData?.win || matchData?.winnat;
    switch (normalizedGameType) {
      case "note_num":
      case "note number":
      case "notenum":
      case "note num": {
        const cards = matchData?.cards || "";
        const parsedCards = parseCards(cards);
        return (
          <div className="flex justify-center items-center gap-2 py-4">
            {parsedCards.map((card: string) => (
              <img
                className="w-8 object-cover"
                key={card}
                src={getCardByCode(card, "note_num", "individual")}
                alt={card}
              />
            ))}
          </div>
        );
      }
      case "cricketv3":
      case "cricket_v3":
      case "superover":
      case "fivefivecricket": {
        // Parse innings data from matchData.score array
        const parseInningsData = () => {
          const scoreArray = matchData?.score || [];

          if (!Array.isArray(scoreArray) || scoreArray.length === 0) {
            return {
              firstInning: [],
              secondInning: [],
              firstTeam: "Australia",
              secondTeam: "India",
            };
          }

          // Group score array by inning and over
          const firstInningData: { [over: number]: any[] } = {};
          const secondInningData: { [over: number]: any[] } = {};
          let firstTeam = "Australia";
          let secondTeam = "India";

          scoreArray.forEach((ball: any) => {
            const inning = ball.ing || ball.inning || 1;
            const over = ball.oc || ball.over || 1;
            const teamName = ball.nat || "";

            if (inning === 1) {
              if (!firstInningData[over]) {
                firstInningData[over] = [];
              }
              firstInningData[over].push(ball);
              if (teamName && !firstTeam.includes(teamName)) {
                firstTeam = teamName;
              }
            } else if (inning === 2) {
              if (!secondInningData[over]) {
                secondInningData[over] = [];
              }
              secondInningData[over].push(ball);
              if (teamName && !secondTeam.includes(teamName)) {
                secondTeam = teamName;
              }
            }
          });

          // Convert to array format with calculated values
          const processInning = (inningData: { [over: number]: any[] }) => {
            const overs: any[] = [];
            let totalRuns = 0;
            let totalWickets = 0;

            const sortedOvers = Object.keys(inningData)
              .map(Number)
              .sort((a, b) => a - b);

            sortedOvers.forEach((overNum) => {
              const balls = inningData[overNum];
              const ballRuns: (string | number)[] = [];
              let overRuns = 0;
              let overWickets = 0;

              // Process each ball in the over
              balls.forEach((ball: any) => {
                const run = ball.run || 0;
                const isWicket =
                  ball.wkt === true ||
                  ball.wkt === "true" ||
                  ball.wicket === true;

                if (isWicket) {
                  ballRuns.push("WW");
                  overWickets++;
                  totalWickets++;
                } else {
                  ballRuns.push(run);
                  overRuns += run;
                  totalRuns += run;
                }
              });

              // Ensure 6 balls per over (pad with empty if needed)
              while (ballRuns.length < 6) {
                ballRuns.push("");
              }

              overs.push({
                overNum,
                balls: ballRuns,
                runOver: overRuns,
                score: `${totalRuns}/${totalWickets}`,
              });
            });

            return overs;
          };

          return {
            firstInning: processInning(firstInningData),
            secondInning: processInning(secondInningData),
            firstTeam: firstTeam || "Australia",
            secondTeam: secondTeam || "India",
          };
        };

        const inningsData = parseInningsData();

        // Parse winner and scores from desc
        const desc = matchData?.desc || "";
        const winValue = matchData?.win || "";
        const winner =
          winValue === "1" ? "AUS" : winValue === "2" ? "IND" : "Tie";

        // Helper function to render an inning table
        const renderInningTable = (
          inning: any[],
          teamName: string,
          isFirst: boolean
        ) => {
          if (!inning || inning.length === 0) {
            return null;
          }

          return (
            <div className="mb-4">
              <div className="bg-[var(--bg-primary)] text-white px-2 py-1 font-semibold text-sm">
                {isFirst ? "First Inning" : "Second Inning"}
              </div>
              <div className="border border-gray-300">
                <div className="px-2 py-1 bg-gray-100">
                  <p className="text-sm font-semibold text-black">{teamName}</p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-2 py-1 text-left">
                        Over
                      </th>
                      <th className="border border-gray-300 px-1 py-1 text-center">
                        1
                      </th>
                      <th className="border border-gray-300 px-1 py-1 text-center">
                        2
                      </th>
                      <th className="border border-gray-300 px-1 py-1 text-center">
                        3
                      </th>
                      <th className="border border-gray-300 px-1 py-1 text-center">
                        4
                      </th>
                      <th className="border border-gray-300 px-1 py-1 text-center">
                        5
                      </th>
                      <th className="border border-gray-300 px-1 py-1 text-center">
                        6
                      </th>
                      <th className="border border-gray-300 px-2 py-1 text-center">
                        Run/Over
                      </th>
                      <th className="border border-gray-300 px-2 py-1 text-center">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inning.map((over: any, index: number) => {
                      return (
                        <tr key={index}>
                          <td className="border border-gray-300 px-2 py-1 font-semibold">
                            Over {over.overNum}
                          </td>
                          {[0, 1, 2, 3, 4, 5].map((ballIdx) => {
                            const ball = over.balls[ballIdx];
                            const display =
                              ball === "" || ball === null || ball === undefined
                                ? ""
                                : ball === "WW" || ball === "W"
                                  ? "WW"
                                  : String(ball);
                            return (
                              <td
                                key={ballIdx}
                                className="border border-gray-300 px-1 py-1 text-center"
                              >
                                {display}
                              </td>
                            );
                          })}
                          <td className="border border-gray-300 px-2 py-1 text-center font-semibold">
                            {over.runOver}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center font-semibold">
                            {over.score}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        };

        return (
          <div className="flex flex-col gap-2">
            {/* Winner Header */}
            <div className="flex justify-end bg-[var(--bg-secondary)] px-2 py-1">
              <h2 className="text-white md:text-sm text-xs font-normal">
                Winner :
                <span className="text-yellow-500 md:text-sm text-xs font-normal pl-1">
                  {winner}
                </span>
                {desc && ` | ${desc}`}
              </h2>
            </div>

            {/* Innings Tables */}
            <div className="max-w-4xl mx-auto w-full">
              {renderInningTable(
                inningsData.firstInning,
                inningsData.firstTeam,
                true
              )}
              {renderInningTable(
                inningsData.secondInning,
                inningsData.secondTeam,
                false
              )}
            </div>
          </div>
        );
      }
      case "dt6":
      case "dt20":
      case "dt202": {
        // Dragon Tiger games - 2 cards: Dragon (first) and Tiger (second)
        const dragonCard = cards[0] || "";
        const tigerCard = cards[1] || "";
        const winner =
          win === "1" || win === "Dragon"
            ? "Dragon"
            : win === "2" || win === "Tiger"
              ? "Tiger"
              : "N/A";

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Dragon
                </h2>
                <div className="flex gap-2 items-center">
                  {winner === "Dragon" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {dragonCard && (
                    <img
                      src={getCardByCode(
                        dragonCard,
                        normalizedGameType,
                        "individual"
                      )}
                      alt="Dragon card"
                      className="w-8"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Tiger
                </h2>
                <div className="flex gap-2 items-center">
                  {tigerCard && (
                    <img
                      src={getCardByCode(
                        tigerCard,
                        normalizedGameType,
                        "individual"
                      )}
                      alt="Tiger card"
                      className="w-8"
                    />
                  )}
                  {winner === "Tiger" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "dtl20": {
        // Dragon Tiger Lion 20 - 3 cards: Dragon (first), Tiger (second), Lion (third)
        const dragonCard = cards[0] || "";
        const tigerCard = cards[1] || "";
        const lionCard = cards[2] || "";
        const winner =
          win === "1" || win === "21" || win === "41"
            ? win === "1"
              ? "Dragon"
              : win === "21"
                ? "Tiger"
                : "Lion"
            : "N/A";

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-2xl mx-auto justify-between items-center gap-4">
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Dragon
                </h2>
                <div className="flex gap-2 items-center">
                  {winner === "Dragon" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {dragonCard && (
                    <img
                      src={getCardByCode(
                        dragonCard,
                        normalizedGameType,
                        "individual"
                      )}
                      alt="Dragon card"
                      className="w-8"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Tiger
                </h2>
                <div className="flex gap-2 items-center">
                  {winner === "Tiger" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {tigerCard && (
                    <img
                      src={getCardByCode(
                        tigerCard,
                        normalizedGameType,
                        "individual"
                      )}
                      alt="Tiger card"
                      className="w-8"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Lion
                </h2>
                <div className="flex gap-2 items-center">
                  {lionCard && (
                    <img
                      src={getCardByCode(
                        lionCard,
                        normalizedGameType,
                        "individual"
                      )}
                      alt="Lion card"
                      className="w-8"
                    />
                  )}
                  {winner === "Lion" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "teen1":
      case "onecard1day": {
        // For Onecard1day: first card is Player, second card is Dealer
        const rawCards = matchData?.cards ? matchData.cards.split(",") : [];
        const playerCard =
          rawCards[0] && rawCards[0] !== "1" ? rawCards[0] : null;
        const dealerCard =
          rawCards[1] && rawCards[1] !== "1" ? rawCards[1] : null;
        const winner =
          win === "1" || win === "Player"
            ? "Player"
            : win === "2" || win === "Dealer"
              ? "Dealer"
              : "N/A";

        // Determine card game type for getCardByCode
        const cardGameType = normalizedGameType || "teen1";

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center gap-4">
              {/* Player Card */}
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Player
                </h2>
                <div className="flex gap-2 items-center">
                  {playerCard ? (
                    <>
                      <img
                        src={getCardByCode(
                          playerCard,
                          cardGameType,
                          "individual"
                        )}
                        alt="Player card"
                        className="w-8 h-auto"
                      />
                      {winner === "Player" && (
                        <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400 text-sm">No card</span>
                      {winner === "Player" && (
                        <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dealer Card */}
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Dealer
                </h2>
                <div className="flex gap-2 items-center">
                  {dealerCard ? (
                    <>
                      <img
                        src={getCardByCode(
                          dealerCard,
                          cardGameType,
                          "individual"
                        )}
                        alt="Dealer card"
                        className="w-8 h-auto"
                      />
                      {winner === "Dealer" && (
                        <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400 text-sm">No card</span>
                      {winner === "Dealer" && (
                        <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "teen3":
      case "TEEN_3":
      case "instant": {
        // For TEEN_3 (Instant Teenpatti): Player A gets 1st, 3rd, 5th cards, Player B gets 2nd, 4th, 6th
        const rawCards = matchData?.cards ? matchData.cards.split(",") : [];
        const playerACards = [rawCards[0], rawCards[2], rawCards[4]].filter(
          (card): card is string => !!card && card !== "1" && card.trim() !== ""
        );
        const playerBCards = [rawCards[1], rawCards[3], rawCards[5]].filter(
          (card): card is string => !!card && card !== "1" && card.trim() !== ""
        );
        // Determine card game type for getCardByCode
        const cardGameType = "teen3";

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Player A
                </h2>
                <div className="flex gap-2 items-center">
                  {win === "1" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {playerACards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, cardGameType, "individual")}
                      alt={`Player A card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Player B
                </h2>
                <div className="flex gap-2 items-center">
                  {playerBCards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, cardGameType, "individual")}
                      alt={`Player B card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                  {win === "2" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "teen6":
      case "TEEN_6":
      case "teenpatti2o": {
        // For TEEN_6: Player A gets 1st, 3rd, 5th cards, Player B gets 2nd, 4th, 6th
        const rawCards = matchData?.cards ? matchData.cards.split(",") : [];
        const playerACards = [rawCards[0], rawCards[2], rawCards[4]].filter(
          (card): card is string => !!card && card !== "1"
        );
        const playerBCards = [rawCards[1], rawCards[3], rawCards[5]].filter(
          (card): card is string => !!card && card !== "1"
        );
        console.log(matchData, "rawCards");
        // Determine card game type for getCardByCode
        const cardGameType = "teen6";

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Player A
                </h2>
                <div className="flex gap-2 items-center">
                  {win === "1" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {playerACards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, cardGameType, "individual")}
                      alt={`Player A card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Player B
                </h2>
                <div className="flex gap-2 items-center">
                  {playerBCards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, cardGameType, "individual")}
                      alt={`Player B card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                  {win === "2" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "teen41":
      case "teen42":
      case "teen20b":
      case "teen20":
      case "teensin":
      case "baccarat29": {
        const rawCards = matchData?.cards ? matchData.cards.split(",") : [];
        const playerACards = [rawCards[0], rawCards[2], rawCards[4]].filter(
          (card): card is string => !!card && card !== "1"
        );
        const playerBCards = [rawCards[1], rawCards[3], rawCards[5]].filter(
          (card): card is string => !!card && card !== "1"
        );

        // Determine card game type for getCardByCode
        let cardGameType = "teen20";
        if (normalizedGameType === "teen20b") {
          cardGameType = "baccarat2";
        } else if (normalizedGameType === "teen41") {
          cardGameType = "teen41";
        } else if (normalizedGameType === "teen42") {
          cardGameType = "teen42";
        } else if (
          normalizedGameType === "teensin" ||
          normalizedGameType === "baccarat29"
        ) {
          cardGameType = "teensin";
        }

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Player A
                </h2>
                <div className="flex gap-2 items-center">
                  {win === "1" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {playerACards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, cardGameType, "individual")}
                      alt={`Player A card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Player B
                </h2>
                <div className="flex gap-2 items-center">
                  {playerBCards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, cardGameType, "individual")}
                      alt={`Player B card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                  {win === "2" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "teenmuf": {
        // TeenMuf - alternating card distribution: Player A gets indices 0, 2, 4; Player B gets indices 1, 3, 5
        const rawCards = matchData?.cards ? matchData.cards.split(",") : [];
        const playerACards = [rawCards[0], rawCards[2], rawCards[4]].filter(
          (card: string): card is string =>
            !!card && card !== "1" && card.trim() !== ""
        );
        const playerBCards = [rawCards[1], rawCards[3], rawCards[5]].filter(
          (card: string): card is string =>
            !!card && card !== "1" && card.trim() !== ""
        );

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Player A
                </h2>
                <div className="flex gap-2 items-center">
                  {win === "1" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {playerACards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, "teenmuf", "individual")}
                      alt={`Player A card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Player B
                </h2>
                <div className="flex gap-2 items-center">
                  {playerBCards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, "teenmuf", "individual")}
                      alt={`Player B card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                  {win === "2" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "poker6": {
        const { boardCards, players } = parsePoker6Cards(
          matchData?.cards || ""
        );
        const winnerSet = getPoker6WinnerSet(matchData?.win);

        const renderPlayer = (playerNumber: number) => {
          const cardsForPlayer = players[playerNumber - 1] || [];
          const isWinner = winnerSet.has(playerNumber);

          return (
            <div
              key={`poker6-player-${playerNumber}`}
              className="flex flex-col gap-1 items-center"
            >
              <h2 className="text-base font-normal leading-8 text-black text-center">
                {playerNumber}
              </h2>
              <div className="flex gap-2 items-center justify-center flex-wrap">
                {cardsForPlayer.map((card: string, index: number) => (
                  <img
                    key={`poker6-${playerNumber}-${card}-${index}`}
                    src={getCardByCode(card, "poker6", "individual")}
                    alt={`Player ${playerNumber} card ${index + 1}`}
                    className="w-8"
                  />
                ))}
                {isWinner && (
                  <i className="fa-solid fa-trophy text-green-600"></i>
                )}
              </div>
            </div>
          );
        };

        return (
          <div className="flex flex-col gap-4 justify-center items-center py-2">
            {boardCards.length > 0 && (
              <div className="flex flex-col gap-1 w-full">
                <h2 className="text-base font-normal leading-8 text-black text-center">
                  Board
                </h2>
                <div className="flex gap-2 items-center justify-center flex-wrap">
                  {boardCards.map((card: string, index: number) => (
                    <img
                      key={`poker6-board-${card}-${index}`}
                      src={getCardByCode(card, "poker6", "individual")}
                      alt={`Board card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex md:flex-row flex-col max-w-lg mx-auto w-full justify-between">
              {renderPlayer(1)}
              {renderPlayer(6)}
            </div>
            <div className="flex md:flex-row flex-col max-w-2xl mx-auto w-full justify-between">
              {renderPlayer(2)}
              {renderPlayer(5)}
            </div>
            <div className="flex md:flex-row flex-col max-w-lg mx-auto w-full justify-between">
              {renderPlayer(3)}
              {renderPlayer(4)}
            </div>
          </div>
        );
      }

      case "poker":
      case "poker20": {
        // Poker games - Player A, Player B, and Board cards
        const playerACards = [cards[0], cards[1]].filter(Boolean);
        const playerBCards = [cards[2], cards[3]].filter(Boolean);
        const boardCards = cards.slice(4).filter(Boolean);

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Player A
                </h2>
                <div className="flex gap-2 items-center">
                  {(win === "11" || win === "1") && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {playerACards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, "poker", "individual")}
                      alt={`Player A card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Player B
                </h2>
                <div className="flex gap-2 items-center">
                  {playerBCards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(card, "poker", "individual")}
                      alt={`Player B card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                  {(win === "21" || win === "2") && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
            </div>
            {boardCards.length > 0 && (
              <div className="flex flex-col gap-1 mt-4">
                <h2 className="text-base font-normal leading-8 text-black text-center">
                  Board
                </h2>
                <div className="flex gap-2 items-center justify-center flex-wrap">
                  {boardCards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(
                        card,
                        normalizedGameType,
                        "individual"
                      )}
                      alt={`Board card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "war":
      case "casinowar": {
        // War - Dealer (first card) and 6 Player positions
        const dealerCard = cards[0];
        const playerCards = cards.slice(1, 7);
        const winningPositions: number[] = [];

        // Determine winning positions from win field (format might vary)
        if (win) {
          const winStr = String(win);
          for (let i = 1; i <= 6; i++) {
            if (winStr.includes(String(i))) {
              winningPositions.push(i);
            }
          }
        }

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="justify-center items-center flex flex-col mb-4">
              <h3 className="text-sm font-semibold text-black mb-2">Dealer</h3>
              <div className="flex gap-2 justify-center flex-wrap items-center">
                {dealerCard && (
                  <img
                    src={getCardByCode(dealerCard, "war", "individual")}
                    alt="Dealer Card"
                    className="w-8"
                  />
                )}
                {win === "Dealer" && (
                  <i className="fa-solid fa-trophy text-green-600"></i>
                )}
              </div>
            </div>
            <div className="items-center grid md:grid-cols-6 grid-cols-3 w-full gap-6">
              {[1, 2, 3, 4, 5, 6].map((position) => (
                <div
                  key={position}
                  className="flex col-span-1 flex-col gap-0.5 justify-center items-center"
                >
                  <h2 className="text-sm font-semibold text-black mb-2">
                    {position}
                  </h2>
                  <div className="flex gap-2 items-center">
                    {playerCards[position - 1] && (
                      <img
                        src={getCardByCode(
                          playerCards[position - 1],
                          "war",
                          "individual"
                        )}
                        alt={`Card ${position}`}
                        className="w-8"
                      />
                    )}
                    {winningPositions.includes(position) && (
                      <i className="fa-solid fa-trophy text-green-600"></i>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "cmeter1":
      case "casinometer1": {
        // Casino Meter 1 - Fighter A (first card) and Fighter B (second card)
        const fighterACard = cards[0] || "";
        const fighterBCard = cards[1] || "";
        const winner = win;
        const isFighterAWinner = winner === "1";
        const isFighterBWinner = winner === "2";

        // Get card value for points calculation
        const getCardValue = (cardCode: string): number => {
          if (!cardCode || cardCode === "1") return 0;
          const rank = cardCode.slice(0, -2); // Everything except last 2 characters (suit)
          if (rank === "A") return 1;
          if (rank === "J") return 11;
          if (rank === "Q") return 12;
          if (rank === "K") return 13;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        const fighterAPoints = fighterACard ? getCardValue(fighterACard) : 0;
        const fighterBPoints = fighterBCard ? getCardValue(fighterBCard) : 0;

        return (
          <div className="flex flex-col gap-4 justify-center items-center py-4">
            {/* Fighter A and Fighter B Side by Side */}
            <div className="flex gap-18 items-center justify-between">
              {/* Fighter A */}
              <div className="flex flex-col justify-center items-center gap-2">
                <h3 className="text-sm uppercase font-semibold text-black">
                  Fighter A
                </h3>
                <div className="flex gap-2 items-center">
                  {isFighterAWinner && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {fighterACard && (
                    <img
                      src={getCardByCode(fighterACard, "cmeter1", "individual")}
                      alt="Fighter A Card"
                      className="w-8 h-auto"
                    />
                  )}
                </div>
              </div>

              {/* Fighter B */}
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-sm uppercase font-semibold text-black">
                  Fighter B
                </h3>
                <div className="flex gap-2 items-center">
                  {isFighterBWinner && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {fighterBCard && (
                    <img
                      src={getCardByCode(fighterBCard, "cmeter1", "individual")}
                      alt="Fighter B Card"
                      className="w-8 h-auto"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "abj": {
        // Andar Bahar Joker - Complex layout with A and B positions
        // Handle both formats: joker layout and Player A/B layout
        const jokerCard = cards[0];
        const cardA = cards[2];
        const cardB = cards[1];
        const remainingCards = cards.slice(3);

        // Check if we have enough cards for joker layout (at least 3 cards)
        // If cards format is like teen20/baccarat2 (6 cards: Player A and Player B with 3 each)
        // Joker format: joker at index 0, cardB at index 1, cardA at index 2
        // Player A/B format: 6 cards total, no joker structure
        const hasJokerFormat =
          jokerCard && jokerCard !== "1" && cards.length >= 3;
        const hasPlayerABFormat =
          cards.length >= 6 && (!jokerCard || jokerCard === "1");

        if (hasPlayerABFormat && !hasJokerFormat) {
          // Player A/B format: cards[0,2,4] = Player A, cards[1,3,5] = Player B
          const playerACards = [cards[0], cards[2], cards[4]].filter(Boolean);
          const playerBCards = [cards[1], cards[3], cards[5]].filter(Boolean);

          return (
            <div className="flex flex-col gap-1 justify-center items-center py-2">
              <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-normal text-center leading-8 text-black">
                    Player A
                  </h2>
                  <div className="flex gap-2 items-center">
                    {win === "1" && (
                      <i className="fa-solid fa-trophy text-green-600"></i>
                    )}
                    {playerACards.map((card: string, index: number) => (
                      <img
                        key={index}
                        src={getCardByCode(card, "baccarat2", "individual")}
                        alt={`Player A card ${index + 1}`}
                        className="w-8"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 justify-center items-center">
                  <h2 className="text-base font-normal leading-8 text-black">
                    Player B
                  </h2>
                  <div className="flex gap-2 items-center">
                    {playerBCards.map((card: string, index: number) => (
                      <img
                        key={index}
                        src={getCardByCode(card, "baccarat2", "individual")}
                        alt={`Player B card ${index + 1}`}
                        className="w-8"
                      />
                    ))}
                    {win === "2" && (
                      <i className="fa-solid fa-trophy text-green-600"></i>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Joker format: Joker card, Card A, Card B, and remaining cards
        // Distribute cards: even index → Player B, odd index → Player A
        const playerA: string[] = [];
        const playerB: string[] = [];

        remainingCards.forEach((card: string, index: number) => {
          if (card === "1" || !card) return; // skip placeholder 1s
          if (index % 2 === 0) {
            playerB.push(card);
          } else {
            playerA.push(card);
          }
        });

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 justify-between items-center">
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
                    {jokerCard && jokerCard !== "1" && (
                      <img
                        src={getCardByCode(
                          jokerCard,
                          normalizedGameType,
                          "individual"
                        )}
                        alt="Joker"
                        className="w-8"
                      />
                    )}
                  </div>
                </div>
                <div className="col-span-1 w-full flex flex-col items-center justify-center gap-2">
                  <div>
                    {cardA && cardA !== "1" && (
                      <img
                        src={getCardByCode(
                          cardA,
                          normalizedGameType,
                          "individual"
                        )}
                        alt="Card A"
                        className="w-8"
                      />
                    )}
                  </div>
                  <div>
                    {cardB && cardB !== "1" && (
                      <img
                        src={getCardByCode(
                          cardB,
                          normalizedGameType,
                          "individual"
                        )}
                        alt="Card B"
                        className="w-8"
                      />
                    )}
                  </div>
                </div>
                <div className="col-span-3 w-full">
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex gap-2 flex-nowrap overflow-x-auto">
                        {playerA.map((card, i) => (
                          <img
                            key={i}
                            src={getCardByCode(
                              card,
                              normalizedGameType,
                              "individual"
                            )}
                            alt={`Player A card ${i + 1}`}
                            className="w-8"
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex gap-2 flex-nowrap overflow-x-auto">
                        {playerB.map((card, i) => (
                          <img
                            key={i}
                            src={getCardByCode(
                              card,
                              normalizedGameType,
                              "individual"
                            )}
                            alt={`Player B card ${i + 1}`}
                            className="w-8"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "ab20":
      case "ab_20": {
        // Andar Bahar 4/20 - Joker card and distribution with sliders
        // Card distribution: cards[0] = joker, then cards alternate between Andar and Bahar
        // Andar: indices 1, 3, 5, 7... (positions 2, 4, 6, 8...)
        // Bahar: indices 2, 4, 6, 8... (positions 3, 5, 7, 9...)
        const jokerCard = cards[0];
        const firstRowCards = cards.filter((_, i) => i > 0 && i % 2 === 1); // Andar (odd indices: 1, 3, 5...)
        const secondRowCards = cards.filter((_, i) => i > 0 && i % 2 === 0); // Bahar (even indices: 2, 4, 6...)

        const maxVisible = 10; // Show more cards at once to match the image
        const visibleFirstRow = firstRowCards.slice(
          firstRowIndex,
          firstRowIndex + maxVisible
        );
        const visibleSecondRow = secondRowCards.slice(
          secondRowIndex,
          secondRowIndex + maxVisible
        );

        const nextFirstRow = () => {
          if (firstRowIndex + maxVisible < firstRowCards.length) {
            setFirstRowIndex(firstRowIndex + 1);
          }
        };

        const prevFirstRow = () => {
          if (firstRowIndex > 0) {
            setFirstRowIndex(firstRowIndex - 1);
          }
        };

        const nextSecondRow = () => {
          if (secondRowIndex + maxVisible < secondRowCards.length) {
            setSecondRowIndex(secondRowIndex + 1);
          }
        };

        const prevSecondRow = () => {
          if (secondRowIndex > 0) {
            setSecondRowIndex(secondRowIndex - 1);
          }
        };

        // Calculate positions: Andar positions are 2, 4, 6, 8... (index 1 = position 2, index 3 = position 4)
        // Bahar positions are 3, 5, 7, 9... (index 2 = position 3, index 4 = position 5)
        const getAndarPosition = (cardIndex: number) => {
          const actualIndex = firstRowIndex + cardIndex;
          return actualIndex * 2 + 2; // positions 2, 4, 6, 8...
        };

        const getBaharPosition = (cardIndex: number) => {
          const actualIndex = secondRowIndex + cardIndex;
          return actualIndex * 2 + 3; // positions 3, 5, 7, 9...
        };

        return (
          <div className="flex flex-col gap-4 justify-center items-center py-2">
            {/* Joker Card - Centered at top */}
            {/* <div className="flex flex-col gap-1 items-center">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Joker
                </h2>
                <div className="flex gap-2 items-center justify-center">
                  {jokerCard && (
                    <img
                      src={getCardByCode(
                        jokerCard,
                        normalizedGameType,
                        "individual"
                      )}
                      alt="Joker card"
                    className="w-8 h-12"
                    />
                  )}
                </div>
            </div> */}

            {/* Andar Row - Horizontal with navigation arrows */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2 items-center justify-center flex-wrap">
                {visibleFirstRow.map((card: string, cardIndex: number) => {
                  const originalPosition = getAndarPosition(cardIndex);
                  return (
                    <div
                      key={cardIndex}
                      className="flex flex-col items-center gap-1"
                    >
                      <img
                        src={getCardByCode(
                          card,
                          normalizedGameType,
                          "individual"
                        )}
                        alt={`Card ${originalPosition}`}
                        className="w-8 h-12"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bahar Row - Horizontal with navigation arrows */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2 items-center justify-center flex-wrap">
                {jokerCard && (
                  <img
                    src={getCardByCode(
                      jokerCard,
                      normalizedGameType,
                      "individual"
                    )}
                    alt="Joker card"
                    className="w-8 h-12"
                  />
                )}
                {visibleSecondRow.map((card: string, cardIndex: number) => {
                  const originalPosition = getBaharPosition(cardIndex);
                  return (
                    <div
                      key={cardIndex}
                      className="flex flex-col items-center gap-1"
                    >
                      <img
                        src={getCardByCode(
                          card,
                          normalizedGameType,
                          "individual"
                        )}
                        alt={`Card ${originalPosition}`}
                        className="w-8 h-12"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case "ab4":
      case "ab_4":
      case "AB_4": {
        // Andar Bahar 3 - No joker, cards alternate between Andar and Bahar
        // Even indices (0, 2, 4...) -> Bahar (second row), positions 1, 3, 5, 7...
        // Odd indices (1, 3, 5...) -> Andar (first row), positions 2, 4, 6, 8...
        const firstRowCards = cards.filter((_, i) => i % 2 === 1); // Andar (odd indices: 1, 3, 5...)
        const secondRowCards = cards.filter((_, i) => i % 2 === 0); // Bahar (even indices: 0, 2, 4...)

        // Determine winner from win field
        let winnerText: string | null = null;
        if (win === "1") winnerText = "Andar";
        else if (win === "2") winnerText = "Bahar";
        else if (win === "0") winnerText = "Tie";

        const maxVisible = 5; // Show 5 cards at once
        const visibleFirstRow = firstRowCards.slice(
          firstRowIndex,
          firstRowIndex + maxVisible
        );
        const visibleSecondRow = secondRowCards.slice(
          secondRowIndex,
          secondRowIndex + maxVisible
        );

        const nextFirstRow = () => {
          if (firstRowIndex + maxVisible < firstRowCards.length) {
            setFirstRowIndex(firstRowIndex + 1);
          }
        };

        const prevFirstRow = () => {
          if (firstRowIndex > 0) {
            setFirstRowIndex(firstRowIndex - 1);
          }
        };

        const nextSecondRow = () => {
          if (secondRowIndex + maxVisible < secondRowCards.length) {
            setSecondRowIndex(secondRowIndex + 1);
          }
        };

        const prevSecondRow = () => {
          if (secondRowIndex > 0) {
            setSecondRowIndex(secondRowIndex - 1);
          }
        };

        // Calculate positions: Andar positions are 2, 4, 6, 8... (index 1 = position 2, index 3 = position 4)
        // Bahar positions are 1, 3, 5, 7... (index 0 = position 1, index 2 = position 3)
        const getAndarPosition = (cardIndex: number) => {
          const actualIndex = firstRowIndex + cardIndex;
          return actualIndex * 2 + 2; // positions 2, 4, 6, 8...
        };

        const getBaharPosition = (cardIndex: number) => {
          const actualIndex = secondRowIndex + cardIndex;
          return actualIndex * 2 + 1; // positions 1, 3, 5, 7...
        };

        return (
          <div className="flex flex-col gap-4 justify-center items-center py-2">
            {/* First Row (Andar) */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={prevFirstRow}
                disabled={firstRowIndex === 0}
                className="p-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                <FaChevronLeft className="w-3 h-3" />
              </button>
              <div className="flex flex-col gap-2 items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Andar
                </h2>
                <div className="flex gap-2 items-center justify-center flex-wrap">
                  {visibleFirstRow.map((card: string, cardIndex: number) => {
                    const originalPosition = getAndarPosition(cardIndex);
                    return (
                      <div
                        key={cardIndex}
                        className="flex flex-col items-center gap-1"
                      >
                        <img
                          src={getCardByCode(
                            card,
                            normalizedGameType,
                            "individual"
                          )}
                          alt={`Card ${originalPosition}`}
                          className="w-8 h-12"
                        />
                        <h2 className="text-xs font-normal text-gray-600">
                          {originalPosition}
                        </h2>
                      </div>
                    );
                  })}
                  {winnerText === "Andar" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
              <button
                onClick={nextFirstRow}
                disabled={firstRowIndex + maxVisible >= firstRowCards.length}
                className="p-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                <FaChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Second Row (Bahar) */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={prevSecondRow}
                disabled={secondRowIndex === 0}
                className="p-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                <FaChevronLeft className="w-3 h-3" />
              </button>
              <div className="flex flex-col gap-2 items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Bahar
                </h2>
                <div className="flex gap-2 items-center justify-center flex-wrap">
                  {visibleSecondRow.map((card: string, cardIndex: number) => {
                    const originalPosition = getBaharPosition(cardIndex);
                    return (
                      <div
                        key={cardIndex}
                        className="flex flex-col items-center gap-1"
                      >
                        <img
                          src={getCardByCode(
                            card,
                            normalizedGameType,
                            "individual"
                          )}
                          alt={`Card ${originalPosition}`}
                          className="w-8 h-12"
                        />
                        <h2 className="text-xs font-normal text-gray-600">
                          {originalPosition}
                        </h2>
                      </div>
                    );
                  })}
                  {winnerText === "Bahar" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
              <button
                onClick={nextSecondRow}
                disabled={secondRowIndex + maxVisible >= secondRowCards.length}
                className="p-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                <FaChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      }

      case "aaa":
      case "aaa_2":
      case "aaa2": {
        // Amar Akbar Anthony - Single card display (matches individual modal)
        const card = cardsString
          ? cardsString.includes(",")
            ? cardsString.split(",")[0]
            : cardsString
          : "";

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-center items-center">
              <div className="flex flex-col gap-1">
                <div className="flex gap-2 items-center">
                  {card && card !== "1" && (
                    <img
                      src={getCardByCode(card, "baccarat2", "individual")}
                      alt="Winning card"
                      className="w-8"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "baccarat":
      case "baccarat2": {
        const cardsArray = matchData?.cards ? matchData.cards.split(",") : [];
        const playerBaseIndices = [2, 0];
        const bankerBaseIndices = [1, 3];
        const playerThirdCard = cardsArray[4];
        const bankerThirdCard = cardsArray[5];
        // Use baccarat2 for card images regardless of which variant
        const gameCodeForCards = "baccarat2";

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Player
                </h2>
                <div className="flex gap-2 items-center">
                  {win === "1" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {playerThirdCard && playerThirdCard !== "1" && (
                    <img
                      src={getCardByCode(
                        playerThirdCard,
                        gameCodeForCards,
                        "individual"
                      )}
                      alt="Player card"
                      className="w-8 rotate-270"
                    />
                  )}
                  {playerBaseIndices
                    .map((index) => cardsArray[index])
                    .filter((card): card is string => !!card && card !== "1")
                    .map((card, index) => (
                      <img
                        key={`player-${index}`}
                        src={getCardByCode(
                          card,
                          gameCodeForCards,
                          "individual"
                        )}
                        alt={`Player card ${index + 1}`}
                        className="w-8"
                      />
                    ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Banker
                </h2>
                <div className="flex gap-2 items-center">
                  {bankerBaseIndices
                    .map((index) => cardsArray[index])
                    .filter((card): card is string => !!card && card !== "1")
                    .map((card, index) => (
                      <img
                        key={`banker-${index}`}
                        src={getCardByCode(
                          card,
                          gameCodeForCards,
                          "individual"
                        )}
                        alt={`Banker card ${index + 1}`}
                        className="w-8"
                      />
                    ))}
                  {bankerThirdCard && bankerThirdCard !== "1" && (
                    <img
                      src={getCardByCode(
                        bankerThirdCard,
                        gameCodeForCards,
                        "individual"
                      )}
                      alt="Banker card"
                      className="w-8 rotate-90"
                    />
                  )}
                  {win === "2" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "bollywoodtable":
      case "BOLLYWOOD_TABLE": {
        // BTable2 - Bollywood Casino - Single card display (matches individual modal)
        // Cards format: single card or comma-separated
        const card = cardsString
          ? cardsString.includes(",")
            ? cardsString.split(",")[0]
            : cardsString
          : "";

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            {/* Card display if available - matches individual modal format */}
            {card && card !== "1" && (
              <div className="text-center">
                <div className="flex gap-2 justify-center flex-wrap">
                  <img
                    src={getCardByCode(card, "btable2", "individual")}
                    alt="Result Card"
                    className="w-8"
                  />
                </div>
              </div>
            )}
          </div>
        );
      }

      case "teen": {
        const rawCards = matchData?.cards ? matchData.cards.split(",") : [];
        const teenInfo = getTeenWinnerInfo(matchData);
        const playerACards = [rawCards[0], rawCards[2], rawCards[4]].filter(
          (card): card is string => !!card && card !== "1"
        );
        const playerBCards = [rawCards[1], rawCards[3], rawCards[5]].filter(
          (card): card is string => !!card && card !== "1"
        );

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Player A
                </h2>
                {/* {teenInfo.cards.length >= 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    Cards Pattern:{" "}
                    <span className="font-medium text-black">
                      {teenInfo.cards.slice(0, 3).join(" ")}
                    </span>
                  </p>
                )} */}
                <div className="flex gap-2 items-center">
                  {win === "1" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                  {playerACards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(
                        card,
                        normalizedGameType,
                        "individual"
                      )}
                      alt={`Player A card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Player B
                </h2>
                {/* {teenInfo.cards.length >= 6 && (
                  <p className="text-xs text-gray-500 text-center">
                    Cards Pattern:{" "}
                    <span className="font-medium text-black">
                      {teenInfo.cards.slice(3, 6).join(" ")}
                    </span>
                  </p>
                )} */}
                <div className="flex gap-2 items-center">
                  {playerBCards.map((card: string, index: number) => (
                    <img
                      key={index}
                      src={getCardByCode(
                        card,
                        normalizedGameType,
                        "individual"
                      )}
                      alt={`Player B card ${index + 1}`}
                      className="w-8"
                    />
                  ))}
                  {win === "2" && (
                    <i className="fa-solid fa-trophy text-green-600"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "teen8": {
        const cardsStringForTeen8 = matchData?.cards || "";
        const teen8Details = parseTeen8Description(
          matchData?.desc || matchData?.newdesc || "",
          matchData?.win
        );

        const getParticipantCards = (participantIndex: number) => {
          const cards = cardsStringForTeen8
            .split(",")
            .map((card: string) => card.trim())
            .filter((card: string) => card.length > 0);
          if (!cards.length) return [];

          // For Teen8, first 24 cards are distributed round-robin to 8 players (3 rounds × 8 players)
          // Last 3 cards go to dealer
          if (participantIndex === 8) {
            // Dealer gets the last 3 cards
            return cards
              .slice(24, 27)
              .filter((card: string) => card && card !== "1");
          } else {
            // Players (0-7) get cards in round-robin fashion
            // Player n gets: cards[n], cards[n+8], cards[n+16]
            return [
              cards[participantIndex],
              cards[participantIndex + 8],
              cards[participantIndex + 16],
            ].filter(
              (card: string) => card && card !== "1" && card !== undefined
            );
          }
        };

        const renderPlayerBlock = (playerIndex: number) => {
          const cardsForPlayer = getParticipantCards(playerIndex - 1).filter(
            (card: string) => card && card !== "1"
          );
          if (!cardsForPlayer.length) return null;

          return (
            <div
              key={`teen8-player-${playerIndex}`}
              className="flex flex-col gap-1 items-center"
            >
              <h2 className="text-base font-normal leading-8 text-black">
                {playerIndex}
              </h2>
              <div className="flex gap-2 items-center">
                {teen8Details.winSet.has(String(playerIndex)) && (
                  <i className="fa-solid fa-trophy text-green-600"></i>
                )}
                {cardsForPlayer.map((card: string, index: number) => (
                  <img
                    key={`${playerIndex}-${card}-${index}`}
                    src={getCardByCode(card, "teen8", "individual")}
                    alt={`Player ${playerIndex} card ${index + 1}`}
                    className="w-8"
                  />
                ))}
              </div>
            </div>
          );
        };

        const renderDealerBlock = () => {
          const dealerCards = getParticipantCards(8);
          if (!dealerCards.length) return null;

          const dealerWon =
            teen8Details.winSet.has("0") || teen8Details.winSet.has("Dealer");

          return (
            <div className="flex flex-col gap-1 items-center">
              <h2 className="text-base font-normal leading-8 text-black">
                Dealer
              </h2>
              <div className="flex gap-2 items-center">
                {dealerWon && (
                  <i className="fa-solid fa-trophy text-green-600"></i>
                )}
                {dealerCards.map((card: string, index: number) => (
                  <img
                    key={`dealer-${card}-${index}`}
                    src={getCardByCode(card, "teen8", "individual")}
                    alt={`Dealer card ${index + 1}`}
                    className="w-8"
                  />
                ))}
              </div>
            </div>
          );
        };

        return (
          <div className="flex flex-col gap-4 items-center py-2">
            <div className="flex flex-col md:flex-row w-full max-w-3xl justify-between gap-6">
              <div className="flex flex-col gap-4">
                {renderPlayerBlock(1)}
                {renderPlayerBlock(2)}
                {renderPlayerBlock(3)}
              </div>
              {renderDealerBlock()}
              <div className="flex flex-col gap-4">
                {renderPlayerBlock(8)}
                {renderPlayerBlock(7)}
                {renderPlayerBlock(6)}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 w-full max-w-2xl">
              {renderPlayerBlock(4)}
              {renderPlayerBlock(5)}
            </div>
          </div>
        );
      }

      case "teen9": {
        const cardsString = matchData?.cards || "";
        const cardsList = cardsString
          .split(",")
          .map((card: string) => card.trim())
          .filter(Boolean);

        const winTokens = String(matchData?.win ?? "")
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean);

        const winningCodes: Array<Set<string>> = [
          new Set(["1", "11"]),
          new Set(["2", "21"]),
          new Set(["3", "31"]),
        ];

        const teams: Array<{
          label: "Tiger" | "Lion" | "Dragon";
          index: number;
        }> = [
          { label: "Tiger", index: 0 },
          { label: "Lion", index: 1 },
          { label: "Dragon", index: 2 },
        ];

        const getTeamCards = (teamIndex: number) =>
          cardsList.filter(
            (_card: string, index: number) => index % 3 === teamIndex
          );

        const isTeamWinner = (teamIndex: number) =>
          winTokens.some((token) => {
            if (!token) return false;
            const numeric = token.replace(/\D/g, "");
            if (!numeric) return false;
            return winningCodes[teamIndex].has(numeric);
          });

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center">
              {teams.map(({ label, index }) => {
                const teamCards = getTeamCards(index);
                const winner = isTeamWinner(index);

                return (
                  <div
                    key={label}
                    className="flex flex-col gap-1 justify-center items-center"
                  >
                    <h2 className="text-base font-normal leading-8 text-black">
                      {label}
                    </h2>
                    <div className="flex gap-2 items-center">
                      {teamCards.map((card: string, cardIndex: number) => (
                        <img
                          key={`${label}-${card}-${cardIndex}`}
                          src={getCardByCode(card, "teen9", "individual")}
                          alt={`${label} card ${cardIndex + 1}`}
                          className="w-8"
                        />
                      ))}
                      {winner && (
                        <i className="fa-solid fa-trophy text-green-600"></i>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "lucky7":
      case "lucky7eu": {
        // Lucky7/Lucky7EU - single result card with trophy if applicable
        const resultCard = cardsString
          ? cardsString.includes(",")
            ? cards[0]
            : cardsString
          : "";
        const isLowCardWinner =
          win === "1" ||
          matchData?.winnat?.toLowerCase() === "low card" ||
          matchData?.desc?.toLowerCase().startsWith("low card");
        const isHighCardWinner =
          win === "2" ||
          matchData?.winnat?.toLowerCase() === "high card" ||
          matchData?.desc?.toLowerCase().startsWith("high card");

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex flex-col w-full py-4 max-w-sm mx-auto justify-between items-center gap-2">
              <div className="flex gap-2 items-center justify-center">
                {/* {isLowCardWinner && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <i className="fa-solid fa-trophy" />
                  </span>
                )} */}
                {resultCard && resultCard !== "1" && (
                  <img
                    src={getCardByCode(resultCard, "lucky7eu", "individual")}
                    alt="Result card"
                    className="w-10"
                  />
                )}
                {/* {isHighCardWinner && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                
                    <i className="fa-solid fa-trophy" />
                  </span>
                )} */}
              </div>
            </div>
          </div>
        );
      }

      case "32card":
      case "card32eu": {
        const rawCards = (matchData?.cards || "")
          .split(",")
          .map((card: string) => card.trim());

        const getPlayerCards = (playerNumber: number) => {
          const offset = playerNumber - 8; // players are 8,9,10,11
          const cardsForPlayer: string[] = [];
          const primary = rawCards[offset];
          const secondary = rawCards[offset + 4];

          if (primary && primary !== "1") {
            cardsForPlayer.push(primary);
          }
          if (secondary && secondary !== "1") {
            cardsForPlayer.push(secondary);
          }
          return cardsForPlayer;
        };

        // Calculate score from cards
        const getCardValue = (cardCode: string): number => {
          if (!cardCode || cardCode === "1") return 0;
          const rank = cardCode.slice(0, -2);
          if (rank === "A") return 1;
          if (rank === "J") return 11;
          if (rank === "Q") return 12;
          if (rank === "K") return 13;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        const getPlayerScore = (playerNumber: number): number => {
          const playerCards = getPlayerCards(playerNumber);
          return playerCards.reduce((sum, card) => sum + getCardValue(card), 0);
        };

        const resolveWinningPlayer = () => {
          const winValue = String(
            matchData?.win ?? matchData?.winnat ?? ""
          ).trim();
          if (!winValue) return null;

          const directMap: Record<string, number> = {
            "1": 8,
            "2": 9,
            "3": 10,
            "4": 11,
            "8": 8,
            "9": 9,
            "10": 10,
            "11": 11,
          };

          if (directMap[winValue]) {
            return directMap[winValue];
          }

          const playerMatch = winValue.match(/player\s*(\d+)/i);
          if (playerMatch && playerMatch[1]) {
            const playerNum = Number(playerMatch[1]);
            if (playerNum >= 8 && playerNum <= 11) {
              return playerNum;
            }
          }

          return null;
        };

        const winningPlayer = resolveWinningPlayer();

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex md:flex-row flex-col w-full py-4 max-w-md mx-auto justify-between items-center gap-4">
              {[8, 9, 10, 11].map((playerNumber) => {
                const playerCards = getPlayerCards(playerNumber);
                const playerScore = getPlayerScore(playerNumber);
                return (
                  <div
                    key={playerNumber}
                    className="flex flex-col gap-1 items-center"
                  >
                    <h3 className="text-base font-semibold text-black">
                      Player {playerNumber} -{" "}
                      <span
                        className={` ${winningPlayer === playerNumber ? "text-green-600" : "text-yellow-600"}`}
                      >
                        {playerScore}
                      </span>
                    </h3>
                    <div className="flex gap-2 items-center flex-wrap justify-center">
                      {winningPlayer === playerNumber && (
                        <i className="fa-solid fa-trophy text-green-600"></i>
                      )}
                      {playerCards.map((card, index) => (
                        <img
                          key={`${playerNumber}-${card}-${index}`}
                          src={getCardByCode(card, "card32eu", "individual")}
                          alt={`Player ${playerNumber} card ${index + 1}`}
                          className="w-8"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "worli2":
      case "worli": {
        // Worli game - displays 3 cards, Pana (combination), and Ocada (last card)
        const cardsString = matchData?.cards || matchData?.card || "";
        const allCards = parseCards(cardsString);

        // Get first 3 cards for display
        const displayCards = allCards.slice(0, 3);

        // Helper to get card rank value
        const getCardRank = (cardCode: string): string => {
          if (!cardCode || cardCode === "1") return "";
          return cardCode.slice(0, -2); // Everything except last 2 characters (suit)
        };

        // Helper to get card numeric value for calculations
        const getCardValue = (cardCode: string): number => {
          const rank = getCardRank(cardCode);
          if (rank === "A") return 1;
          if (rank === "J") return 11;
          if (rank === "Q") return 12;
          if (rank === "K") return 13;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        // Calculate Pana - combination of first 3 card values
        const getPana = (): string => {
          if (displayCards.length < 3) return "N/A";
          const values = displayCards.map((card) => {
            const val = getCardValue(card);
            return val === 0 ? "" : val.toString();
          });
          return values.join("");
        };

        // Calculate Ocada - last card value (or last of the 3 cards)
        const getOcada = (): string => {
          if (displayCards.length === 0) return "N/A";
          const lastCard = displayCards[displayCards.length - 1];
          const val = getCardValue(lastCard);
          return val === 0 ? "N/A" : val.toString();
        };

        const pana = getPana();
        const ocada = getOcada();

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            {/* Cards Display */}
            <div className="flex gap-2 justify-center items-center py-4">
              {displayCards.map((card: string, index: number) => (
                <img
                  key={index}
                  src={getCardByCode(card, "worli2", "individual")}
                  alt={`Card ${index + 1}`}
                  className="md:w-10 w-8 h-auto"
                />
              ))}
            </div>

            {/* Pana and Ocada Display */}
            <div className="flex flex-col gap-1 items-center">
              <h2 className="text-base font-normal leading-8 text-black">
                Pana {pana}
              </h2>
              <h2 className="text-base font-normal leading-8 text-black">
                Ocada {ocada}
              </h2>
            </div>
          </div>
        );
      }

      case "dum10":
      case "duskadum": {
        // Duskadum (10 ka dum) - displays all cards except last, then last card separately
        // Shows breakdown: Current Total, Next Total 60 or More, Odd/Even, Red/Black
        const cardsString =
          matchData?.lcard || matchData?.cards || matchData?.card || "";
        const allCards = parseCards(cardsString);

        if (allCards.length === 0) {
          return (
            <div className="flex justify-center items-center py-4">
              <p className="text-gray-500 text-sm">No cards available</p>
            </div>
          );
        }

        // Helper to get card rank value
        const getCardRank = (cardCode: string): string => {
          if (!cardCode || cardCode === "1") return "";
          return cardCode.slice(0, -2); // Everything except last 2 characters (suit)
        };

        // Helper to get card suit
        const getCardSuit = (cardCode: string): string => {
          if (!cardCode || cardCode === "1") return "";
          const suitCode = cardCode.slice(-2); // Last 2 characters
          const suitMap: { [key: string]: string } = {
            HH: "Heart",
            SS: "Spade",
            DD: "Diamond",
            CC: "Club",
          };
          return suitMap[suitCode] || "";
        };

        // Helper to get card numeric value for calculations
        const getCardValue = (cardCode: string): number => {
          const rank = getCardRank(cardCode);
          if (rank === "A") return 1;
          if (rank === "J") return 11;
          if (rank === "Q") return 12;
          if (rank === "K") return 13;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        // Get the last card (the deciding card)
        const lastCard = allCards[allCards.length - 1];
        const cardsBeforeLast = allCards.slice(0, -1);

        // Calculate totals
        const currentTotal = cardsBeforeLast.reduce(
          (sum: number, card: string) => sum + getCardValue(card),
          0
        );
        const lastCardValue = getCardValue(lastCard);
        const newTotal = currentTotal + lastCardValue;

        // Determine threshold (60 or more)
        const threshold = 60;
        const reachedThreshold = newTotal >= threshold;

        // Determine odd/even
        const isOdd = lastCardValue % 2 !== 0;
        const oddEvenText = isOdd ? "Odd" : "Even";

        // Determine red/black
        const suitCode = lastCard.slice(-2);
        const isRed = suitCode === "HH" || suitCode === "DD";
        const redBlackText = isRed ? "Red" : "Black";

        const lastCardSuit = getCardSuit(lastCard);
        const cardNumber = allCards.length;

        // Get visible cards for slider
        const maxVisible = 5;
        const getVisibleCards = (startIndex: number) => {
          return cardsBeforeLast.slice(startIndex, startIndex + maxVisible);
        };

        const visibleCards = getVisibleCards(dum10CardIndex);

        // Navigation functions
        const nextCards = () => {
          if (dum10CardIndex + maxVisible < cardsBeforeLast.length) {
            setDum10CardIndex(dum10CardIndex + 1);
          }
        };

        const prevCards = () => {
          if (dum10CardIndex > 0) {
            setDum10CardIndex(dum10CardIndex - 1);
          }
        };

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            {/* Cards Display - All cards except the last with slider */}
            {cardsBeforeLast.length > 0 && (
              <div className="flex flex-col gap-2 my-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={prevCards}
                      disabled={dum10CardIndex === 0}
                      className="p-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      <FaChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={nextCards}
                      disabled={
                        dum10CardIndex + maxVisible >= cardsBeforeLast.length
                      }
                      className="p-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      <FaChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 items-center justify-center flex-wrap">
                  {visibleCards.map((card: string, index: number) => {
                    const originalPosition = dum10CardIndex + index + 1;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-1"
                      >
                        <img
                          src={getCardByCode(card, "dum10", "individual")}
                          alt={card}
                          className="md:w-10 w-8 h-full"
                        />
                        <h2 className="text-xs font-semibold text-gray-600">
                          {originalPosition}
                        </h2>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Last Card Display - Separately below */}
            {lastCard && (
              <div className="flex justify-center items-center my-2">
                <div className="">
                  <img
                    src={getCardByCode(lastCard, "dum10", "individual")}
                    alt={lastCard}
                    className="md:w-10 w-8"
                  />
                </div>
              </div>
            )}

            {/* Result Breakdown Text Box */}
            <div className="bg-gray-100 border border-gray-300 rounded p-3 my-4">
              <div className="flex flex-col text-justify justify-center items-center gap-1 text-sm text-black">
                {/* Card number and suit */}
                <div className="font-semibold">
                  Card {cardNumber} {lastCardSuit}
                </div>

                {/* Current Total and Next Total */}
                <div>
                  Curr. Total {currentTotal} | Next Total {threshold} or More
                </div>

                {/* Total calculation and result */}
                <div>
                  Total {currentTotal} + {lastCardValue} = {newTotal} |{" "}
                  <span
                    className={
                      reachedThreshold
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {reachedThreshold ? "Yes" : "No"}
                  </span>
                </div>

                {/* Odd/Even */}
                <div>Odd/Even {oddEvenText}</div>

                {/* Red/Black */}
                <div>Red/Black {redBlackText}</div>
              </div>
            </div>
          </div>
        );
      }

      case "trio": {
        // Trio game - displays 3 cards horizontally
        const trioCards = cards.slice(0, 3).filter(Boolean);

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            {/* Cards Display - 3 cards horizontally */}
            {trioCards.length > 0 && (
              <div className="flex justify-center items-center gap-2 my-4 flex-wrap">
                {trioCards.map((card: string, index: number) => (
                  <div key={index} className="">
                    <img
                      src={getCardByCode(
                        card,
                        normalizedGameType || "trio",
                        "individual"
                      )}
                      alt={card}
                      className="w-8 md:w-10"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case "lucky15":
      case "lucky715": {
        // Lucky15/Lucky715 - displays winner in a centered ball
        // Map win value (sid) to display name
        const getWinnerName = (
          winValue: string | number | undefined
        ): string => {
          if (!winValue) return "Unknown";

          const winStr = String(winValue);
          const winMap: { [key: string]: string } = {
            "1": "0 Runs",
            "2": "1 Runs",
            "3": "2 Runs",
            "4": "4 Runs",
            "5": "6 Runs",
            "6": "Wicket",
          };

          // First try to get from winnat if available
          if (matchData?.winnat) {
            return matchData.winnat;
          }

          // Then try the winMap
          if (winMap[winStr]) {
            return winMap[winStr];
          }

          // Fallback to description parsing
          const desc = matchData?.desc || matchData?.newdesc || "";
          if (desc) {
            // Try to extract from description
            const descParts = desc.split("#");
            if (descParts[0]) {
              return descParts[0].trim();
            }
          }

          return winStr;
        };

        const winnerName = getWinnerName(win);

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="max-w-lg my-4 mx-auto w-full mb-2 flex justify-center items-center">
              <div className="relative">
                <img
                  src="https://versionobj.ecoassetsservice.com/v80/static/front/img/balls/ball-blank.png"
                  alt=""
                  className="md:w-20 w-16"
                />
                <h2 className="md:text-sm text-[11px] font-semibold text-white absolute top-1/2 left-[40%] -translate-y-1/2 -translate-x-1/2">
                  {winnerName}
                </h2>
              </div>
            </div>
          </div>
        );
      }

      case "goal": {
        // Goal game - displays winner with soccer ball
        const getWinnerName = (): string => {
          // First try to get from winnat if available
          if (matchData?.winnat) {
            return matchData.winnat;
          }

          // Try to extract from description
          const desc = matchData?.desc || matchData?.newdesc || "";
          if (desc) {
            const descParts = desc.split("#");
            if (descParts[0]) {
              return descParts[0].trim();
            }
          }

          // Fallback to win value
          return matchData?.win || "N/A";
        };

        const winnerName = getWinnerName();

        return (
          <div className="flex flex-col gap-1 justify-center items-center py-2">
            <div className="flex flex-col gap-4 w-full py-4 max-w-md mx-auto justify-center items-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 relative">
                  <img
                    src="https://versionobj.ecoassetsservice.com/v80/static/front/img/balls/soccer-ball.png"
                    alt="soccer-ball"
                    className="w-1/2"
                  />
                  <span className="text-lg font-semibold tracking-wide absolute -bottom-4 right-10 -translate-x-1/2 -translate-y-1/2">
                    {winnerName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "teen120":
      case "teen_120":
      case "onecard2020":
      case "onecard_2020": {
        // Onecard2020 / Teen120 - displays Player and Dealer cards
        // Parse cards from cards string or card field
        const cardString = matchData?.cards || matchData?.card || "";
        const parsedCards = cardString
          ? cardString
              .split(",")
              .filter((card: string) => card && card.trim() && card !== "1")
          : [];

        // For Onecard2020: first card is Player, second card is Dealer
        const playerCard = parsedCards[0] || null;
        const dealerCard = parsedCards[1] || null;

        // Determine winner from win field (1=Player, 2=Dealer, 3=Tie, 4=Pair)
        const winValue = matchData?.win || "";
        const winnat = matchData?.winnat || "";
        const desc = matchData?.desc || matchData?.newdesc || "";

        let winner: string | null = null;
        let hasPair = false;

        // Check for pair in description
        if (desc && desc.toLowerCase().includes("pair")) {
          hasPair = true;
        }

        // Use winnat as primary source, fallback to win field
        if (winnat === "Player" || winValue === "1") winner = "Player";
        else if (winnat === "Dealer" || winValue === "2") winner = "Dealer";
        else if (winnat === "Tie" || winValue === "3") winner = "Tie";
        else if (winnat === "Pair" || winValue === "4") winner = "Pair";

        return (
          <div className="flex flex-col gap-4 justify-center items-center py-4">
            {/* Player and Dealer Cards */}
            <div className="flex md:flex-row flex-col w-full py-4 md:max-w-lg mx-auto justify-between items-center gap-4">
              {/* Player Card */}
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-base font-normal text-center leading-8 text-black">
                  Player
                </h2>
                <div className="flex gap-2 items-center">
                  {playerCard ? (
                    <>
                      <img
                        src={getCardByCode(playerCard, "teen120", "individual")}
                        alt="Player card"
                        className="w-8 h-auto"
                      />
                      {winner === "Player" && (
                        <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400 text-sm">No card</span>
                      {winner === "Player" && (
                        <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dealer Card */}
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-base font-normal leading-8 text-black">
                  Dealer
                </h2>
                <div className="flex gap-2 items-center">
                  {dealerCard ? (
                    <>
                      <img
                        src={getCardByCode(dealerCard, "teen120", "individual")}
                        alt="Dealer card"
                        className="w-8 h-auto"
                      />
                      {winner === "Dealer" && (
                        <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400 text-sm">No card</span>
                      {winner === "Dealer" && (
                        <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Winner Information */}
            <div
              className="max-w-lg my-2 mx-auto w-full mb-2 border border-gray-300 rounded"
              style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
            >
              <div className="flex flex-col gap-0 justify-center items-center py-2">
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Winner:{" "}
                  <span className="text-black font-normal pl-1">
                    {winner || "N/A"}
                  </span>
                </h2>
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Pair:{" "}
                  <span className="text-black font-normal pl-1">
                    {hasPair ? "Yes" : "No"}
                  </span>
                </h2>
              </div>
            </div>
          </div>
        );
      }

      case "race2":
      case "race_2": {
        // Race 2 - displays 4 players (A, B, C, D) with their cards
        // Parse cards from cards string or card field
        const cardString = matchData?.cards || matchData?.card || "";
        const parsedCards = cardString
          ? cardString
              .split(",")
              .filter((card: string) => card && card.trim() && card !== "1")
          : [];

        // Determine winner from win field (1=Player A, 2=Player B, 3=Player C, 4=Player D)
        const winValue = matchData?.win || "";
        const winnerIndex =
          winValue === "1"
            ? 0
            : winValue === "2"
              ? 1
              : winValue === "3"
                ? 2
                : winValue === "4"
                  ? 3
                  : -1;

        const playerLabels = ["Player A", "Player B", "Player C", "Player D"];

        return (
          <div className="flex flex-col gap-4 justify-center items-center py-4">
            {/* Cards Display - 4 players horizontally */}
            <div className="flex justify-around items-center gap-4 flex-wrap w-full max-w-4xl">
              {parsedCards.length > 0 ? (
                parsedCards.slice(0, 4).map((card: string, index: number) => {
                  const isWinner = index === winnerIndex;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-2"
                    >
                      <h2 className="text-sm font-semibold text-black">
                        {playerLabels[index] ||
                          `Player ${String.fromCharCode(65 + index)}`}
                      </h2>
                      <div className="flex gap-2 items-center justify-center">
                        <img
                          src={getCardByCode(card, "race2", "individual")}
                          alt={card}
                          className="w-8 h-auto"
                        />
                        {isWinner && (
                          <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-400 text-sm">No cards available</div>
              )}
            </div>

            {/* Winner Information */}
            {winnerIndex >= 0 && (
              <div
                className="max-w-lg py-2 my-2 mx-auto w-full mb-2 border border-gray-300 rounded"
                style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
              >
                <div className="flex justify-center items-center py-2">
                  <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                    Winner:{" "}
                    <span className="text-black font-normal pl-1">
                      {playerLabels[winnerIndex] || "N/A"}
                    </span>
                  </h2>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "race20":
      case "race_20": {
        // Race 20 - displays cards by suit with winner
        // Parse cards from cards string or card field
        const cardString = matchData?.cards || matchData?.card || "";
        const parsedCards = cardString
          ? cardString
              .split(",")
              .filter((card: string) => card && card.trim() && card !== "1")
          : [];

        // Get card value helper
        const getCardValue = (cardCode: string): number => {
          if (!cardCode || cardCode === "1") return 0;
          const rank = cardCode.slice(0, -2); // Everything except last 2 characters (suit)
          if (rank === "A") return 1;
          if (rank === "J") return 11;
          if (rank === "Q") return 12;
          if (rank === "K") return 13;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        // Group cards by suit
        const getSuit = (cardCode: string): string => {
          if (!cardCode || cardCode === "1") return "";
          const suit = cardCode.slice(-2); // Last 2 characters (suit)
          return suit;
        };

        const suits = {
          SS: { name: "Spades", cards: [] as string[], points: 0, icon: "♠" },
          HH: { name: "Hearts", cards: [] as string[], points: 0, icon: "♥" },
          CC: { name: "Clubs", cards: [] as string[], points: 0, icon: "♣" },
          DD: {
            name: "Diamonds",
            cards: [] as string[],
            points: 0,
            icon: "♦",
          },
        };

        // Group cards by suit and calculate points
        parsedCards.forEach((card: string) => {
          const suit = getSuit(card);
          if (suit && suits[suit as keyof typeof suits]) {
            suits[suit as keyof typeof suits].cards.push(card);
            suits[suit as keyof typeof suits].points += getCardValue(card);
          }
        });

        // Determine winner from win field (1=Spades, 2=Hearts, 3=Clubs, 4=Diamonds)
        const winValue = matchData?.win || "";
        let winnerSuit: keyof typeof suits | null = null;
        if (winValue === "1") winnerSuit = "SS";
        else if (winValue === "2") winnerSuit = "HH";
        else if (winValue === "3") winnerSuit = "CC";
        else if (winValue === "4") winnerSuit = "DD";

        // If no winner from win field, find suit with highest points
        if (!winnerSuit) {
          const maxPoints = Math.max(
            ...Object.values(suits).map((s) => s.points)
          );
          const winnerEntry = Object.entries(suits).find(
            ([_, suit]) => suit.points === maxPoints
          );
          if (winnerEntry) winnerSuit = winnerEntry[0] as keyof typeof suits;
        }

        const winner = winnerSuit ? suits[winnerSuit] : null;
        const winnerCard = winner?.cards[winner?.cards.length - 1] || ""; // Last card of winner suit

        return (
          <div className="flex flex-col gap-4 justify-center items-center py-4">
            {/* Main Display: WINNER label on left, suits in middle, winner card with trophy on right */}
            <div className="flex items-start gap-4 w-full max-w-4xl">
              {/* WINNER Label (Vertical) */}
              <div className="flex flex-col justify-center items-center">
                <div className="flex flex-col text-black font-bold text-sm">
                  <span>W</span>
                  <span>I</span>
                  <span>N</span>
                  <span>N</span>
                  <span>E</span>
                  <span>R</span>
                </div>
              </div>

              {/* Suits Display */}
              <div className="flex-1 flex flex-col gap-2">
                {Object.entries(suits).map(([suitKey, suit]) => {
                  const isWinner = suitKey === winnerSuit;
                  return (
                    <div key={suitKey} className="flex items-center gap-2">
                      {/* Suit Icon */}
                      <div
                        className={`text-2xl ${suitKey === "HH" || suitKey === "DD" ? "text-red-500" : "text-black"}`}
                      >
                        {suit.icon}
                      </div>
                      {/* Cards */}
                      <div className="flex gap-1 flex-wrap">
                        {suit.cards.length > 0 ? (
                          suit.cards.map((card: string, index: number) => (
                            <img
                              key={index}
                              src={getCardByCode(card, "race20", "individual")}
                              alt={card}
                              className="w-8 h-auto"
                            />
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">
                            No cards
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Winner Card with Trophy */}
              {winner && winnerCard && (
                <div className="flex  items-center gap-2">
                  <img
                    src={getCardByCode(winnerCard, "race20", "individual")}
                    alt={winnerCard}
                    className="w-8 h-auto"
                  />
                  <i className="fa-solid fa-trophy text-green-600 text-2xl"></i>
                </div>
              )}
            </div>

            {/* Winner Details Box */}
            {winner && winnerSuit && (
              <div
                className="max-w-lg py-2 my-2 mx-auto w-full mb-2 border border-gray-300 rounded"
                style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
              >
                <div className="flex flex-col gap-1 justify-center items-center py-2">
                  <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                    Winner:{" "}
                    <span className="text-black font-normal pl-1">
                      K {suits[winnerSuit].name}
                    </span>
                  </h2>
                  <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                    Points:{" "}
                    <span className="text-black font-normal pl-1">
                      {winner.points}
                    </span>
                  </h2>
                  <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                    Cards:{" "}
                    <span className="text-black font-normal pl-1">
                      {winner.cards.length}
                    </span>
                  </h2>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "race17":
      case "race_17": {
        // Race to 17 - displays cards horizontally with yellow border
        // Parse cards from cards string or card field
        const cardString = matchData?.cards || matchData?.card || "";
        const parsedCards = cardString
          ? cardString
              .split(",")
              .filter((card: string) => card && card.trim() && card !== "1")
          : [];

        // Get card value helper
        const getCardValue = (cardCode: string): number => {
          if (!cardCode || cardCode === "1") return 0;
          const rank = cardCode.slice(0, -2); // Everything except last 2 characters (suit)
          if (rank === "A") return 1;
          if (rank === "J") return 11;
          if (rank === "Q") return 12;
          if (rank === "K") return 13;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        // Check if card is Big (7, 8, 9)
        const isBigCard = (cardCode: string): boolean => {
          const value = getCardValue(cardCode);
          return value === 7 || value === 8 || value === 9;
        };

        // Check if card is Zero Card (10, J, Q, K)
        const isZeroCard = (cardCode: string): boolean => {
          const value = getCardValue(cardCode);
          return value === 10 || value === 11 || value === 12 || value === 13;
        };

        // Calculate total
        const total = parsedCards.reduce((sum: number, card: string) => {
          return sum + getCardValue(card);
        }, 0);

        // Race to 17 result
        const raceTo17Met = total >= 17;
        const raceTo17Text = raceTo17Met ? "Yes" : "No";

        // Big Card sequence
        const bigCardSequence = parsedCards.map((card: string) =>
          isBigCard(card) ? "Big" : "Small"
        );

        // Zero Card sequence
        const zeroCardSequence = parsedCards.map((card: string) =>
          isZeroCard(card) ? "Yes" : "No"
        );

        // Count zero cards
        const zeroCardCount = parsedCards.filter((card: string) =>
          isZeroCard(card)
        ).length;
        const oneZeroCard = zeroCardCount === 1 ? "Yes" : "No";

        return (
          <div className="flex flex-col gap-4 justify-center items-center py-4">
            {/* Cards Display with shadow border */}
            <div className="flex justify-center items-center gap-2 flex-wrap">
              {parsedCards.length > 0 ? (
                parsedCards.map((card: string, index: number) => (
                  // <div
                  //   key={index}
                  //   className="rounded p-1"
                  //   style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
                  // >
                  <img
                    key={index}
                    src={getCardByCode(card, "race17", "individual")}
                    alt={card}
                    className="w-8 h-auto"
                  />
                  // </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm">No cards available</div>
              )}
            </div>

            {/* Result Breakdown */}
            <div
              className="flex flex-col gap-2 text-sm w-full max-w-md py-4"
              style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
            >
              {/* Race to 17 */}
              <div className="flex justify-center items-center">
                <span className="font-semibold text-black">Race to 17:</span>
                <span className="text-black ml-2">
                  {raceTo17Text} ({total})
                </span>
              </div>

              {/* Big Card */}
              <div className="flex justify-center items-center">
                <span className="font-semibold text-black">Big Card:</span>
                <span className="text-black ml-2">
                  {bigCardSequence.join(" ")}
                </span>
              </div>

              {/* Zero Card */}
              <div className="flex justify-center items-center">
                <span className="font-semibold text-black">Zero Card:</span>
                <span className="text-black ml-2">
                  {zeroCardSequence.join(" ")}
                </span>
              </div>

              {/* One Zero Card */}
              <div className="flex justify-center items-center">
                <span className="font-semibold text-black">One Zero Card:</span>
                <span className="text-black ml-2">{oneZeroCard}</span>
              </div>
            </div>
          </div>
        );
      }
    }
  };

  // Render game-specific description
  const renderGameDescription = () => {
    const descSections = parseDescription(matchData?.desc, matchData?.newdesc);
    const win = matchData?.win || matchData?.winnat;

    switch (normalizedGameType) {
      case "dt6":
      case "dt20":
      case "dt202": {
        const winner =
          win === "1" || win === "Dragon"
            ? "Dragon"
            : win === "2" || win === "Tiger"
              ? "Tiger"
              : descSections[0] || "N/A";
        const pair = descSections[1] || "No";
        const oddEven = descSections[2] || "N/A";
        const color = descSections[3] || "N/A";
        const suit = descSections[4] || "N/A";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Pair:{" "}
                <span className="text-black font-normal pl-1">{pair}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Odd/Even:{" "}
                <span className="text-black font-normal pl-1">{oddEven}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Color:{" "}
                <span className="text-black font-normal pl-1">{color}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Suit:{" "}
                <span className="text-black font-normal pl-1">{suit}</span>
              </h2>
            </div>
          </div>
        );
      }

      case "dtl20": {
        // Dragon Tiger Lion 20 description format
        // Parse description sections and extract card info
        const cardsString = matchData?.cards || "";
        const allCards = parseCards(cardsString);
        const dragonCard = allCards[0] || "";
        const tigerCard = allCards[1] || "";
        const lionCard = allCards[2] || "";

        // Helper to get card rank (e.g., "10", "Q", "A")
        const getCardRank = (cardCode: string): string => {
          if (!cardCode || cardCode === "1") return "";
          return cardCode.slice(0, -2);
        };

        // Helper to determine if card is red (Heart or Diamond)
        const isRedCard = (cardCode: string): boolean => {
          if (!cardCode || cardCode === "1") return false;
          const suitCode = cardCode.slice(-2);
          return suitCode === "HH" || suitCode === "DD";
        };

        // Helper to determine if card value is odd
        const isCardOdd = (cardCode: string): boolean => {
          if (!cardCode || cardCode === "1") return false;
          const rank = getCardRank(cardCode);
          if (rank === "A") return true; // Ace is odd
          if (rank === "J" || rank === "Q" || rank === "K") {
            // J=11 (odd), Q=12 (even), K=13 (odd)
            return rank === "J" || rank === "K";
          }
          const num = parseInt(rank, 10);
          return !isNaN(num) && num % 2 !== 0;
        };

        // Get card ranks for display
        const dragonRank = getCardRank(dragonCard) || "N/A";
        const tigerRank = getCardRank(tigerCard) || "N/A";
        const lionRank = getCardRank(lionCard) || "N/A";

        // Get Red/Black for each card
        const dragonRedBlack = dragonCard
          ? isRedCard(dragonCard)
            ? "Red"
            : "Black"
          : "N/A";
        const tigerRedBlack = tigerCard
          ? isRedCard(tigerCard)
            ? "Red"
            : "Black"
          : "N/A";
        const lionRedBlack = lionCard
          ? isRedCard(lionCard)
            ? "Red"
            : "Black"
          : "N/A";

        // Get Odd/Even for each card
        const dragonOddEven = dragonCard
          ? isCardOdd(dragonCard)
            ? "Odd"
            : "Even"
          : "N/A";
        const tigerOddEven = tigerCard
          ? isCardOdd(tigerCard)
            ? "Odd"
            : "Even"
          : "N/A";
        const lionOddEven = lionCard
          ? isCardOdd(lionCard)
            ? "Odd"
            : "Even"
          : "N/A";

        // Determine winner
        const winner =
          win === "1"
            ? "Dragon"
            : win === "21"
              ? "Tiger"
              : win === "41"
                ? "Lion"
                : descSections[0] || "N/A";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Red/Black D: {dragonRedBlack} | T: {tigerRedBlack} | L:{" "}
                {lionRedBlack}
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Odd/Even D: {dragonOddEven} | T: {tigerOddEven} | L:{" "}
                {lionOddEven}
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Card D:{dragonRank} | T:{tigerRank} | L:{lionRank}
              </h2>
            </div>
          </div>
        );
      }

      case "teen6":
      case "teenpatti2o": {
        const desc = matchData?.desc || matchData?.newdesc || "";

        // Parse description: "Player B#Diamond  Spade  Spade  Spade  Club  Club#Even  Odd  Odd  Even  Odd  Odd#6  J  5  8  9  3#A : Under 21(20)  |  B : Draw(22)"
        const descSegments = desc
          .split("#")
          .map((s: string) => s.trim())
          .filter(Boolean);

        // Segment 0: Winner (e.g., "Player B")
        const winner =
          descSegments[0] ||
          matchData?.winnat ||
          (matchData?.win === "1"
            ? "Player A"
            : matchData?.win === "2"
              ? "Player B"
              : "N/A");

        // Segment 1: Suits (e.g., "Diamond  Spade  Spade  Spade  Club  Club")
        const suitsText = descSegments[1] || "";
        const suits = suitsText.split(/\s+/).filter((s: string) => s.trim());

        // Segment 2: Odd/Even (e.g., "Even  Odd  Odd  Even  Odd  Odd")
        const oddEvenText = descSegments[2] || "";
        const oddEven = oddEvenText
          .split(/\s+/)
          .filter((s: string) => s.trim());

        // Segment 3: Card ranks (e.g., "6  J  5  8  9  3")
        const cardRanksText = descSegments[3] || "";
        const cardRanks = cardRanksText
          .split(/\s+/)
          .filter((s: string) => s.trim());

        // Segment 4: Under/Over (e.g., "A : Under 21(20)  |  B : Draw(22)")
        const underOverText = descSegments[4] || "";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-2 justify-center items-center">
              {winner && (
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Winner:{" "}
                  <span className="text-black font-normal pl-1">{winner}</span>
                </h2>
              )}

              {suits.length > 0 && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Suit:{" "}
                  </span>
                  {suits.join(" ")}
                </p>
              )}

              {oddEven.length > 0 && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Odd/Even:{" "}
                  </span>
                  {oddEven.join(" ")}
                </p>
              )}

              {cardRanks.length > 0 && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Cards:{" "}
                  </span>
                  {cardRanks.join(" ")}
                </p>
              )}

              {underOverText && (
                <p className="text-sm text-black text-center whitespace-pre-line">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Under/Over:{" "}
                  </span>
                  {underOverText.replace(/\s+/g, " ").trim()}
                </p>
              )}
            </div>
          </div>
        );
      }

      case "teen41":
      case "teen42": {
        // Parse Under/Over information from description
        const parseUnderOver = (desc: string) => {
          if (!desc)
            return { player: null, total: null, type: null, display: "N/A" };

          // Format: "Player B#B : (21)" or similar
          // Extract the number in parentheses
          const match = desc.match(/\((\d+)\)/);
          if (!match)
            return { player: null, total: null, type: null, display: "N/A" };

          const total = parseInt(match[1], 10);
          if (isNaN(total))
            return { player: null, total: null, type: null, display: "N/A" };

          // Determine if it's Player A or B based on description
          let player = null;
          if (desc.includes("Player A") || desc.includes("A :")) {
            player = "A";
          } else if (desc.includes("Player B") || desc.includes("B :")) {
            player = "B";
          }

          // Determine Under/Over 21
          const type =
            total < 21 ? "Under 21" : total > 21 ? "Over 21" : "Exactly 21";

          const display = player
            ? `${player}: ${type}(${total})`
            : `${type}(${total})`;

          return { player, total, type, display };
        };

        const winValue = matchData?.win;
        const baseWinner =
          winValue === "1"
            ? "Player A"
            : winValue === "2"
              ? "Player B"
              : undefined;
        const winner = matchData?.winnat || baseWinner || "N/A";
        const desc = matchData?.desc || matchData?.newdesc || "";
        const underOver = parseUnderOver(desc);

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-0 justify-center items-center py-2">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              {underOver.display !== "N/A" && (
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Under/Over:{" "}
                  <span className="text-black font-normal pl-1">
                    {underOver.display}
                  </span>
                </h2>
              )}
            </div>
          </div>
        );
      }

      case "teen20b":
      case "teen20": {
        const winValue = matchData?.win;
        const baseWinner =
          winValue === "1"
            ? "Player A"
            : winValue === "2"
              ? "Player B"
              : winValue === "0"
                ? "Tie"
                : undefined;
        const teenInfo = getTeenWinnerInfo(matchData);
        const winner =
          teenInfo.winner || matchData?.winnat || baseWinner || "No Winner";
        const redBlack = matchData?.desc?.split("#")[4];

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-2 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>

              {teenInfo.cards.length > 0 && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    3 baccarat:
                  </span>{" "}
                  {teenInfo.cards.join(" ")}
                </p>
              )}

              {teenInfo.oddEven.length > 0 && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Total:
                  </span>{" "}
                  {teenInfo.oddEven.join(" ")}
                </p>
              )}

              {teenInfo.consecutive && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Pair Plus:
                  </span>{" "}
                  {teenInfo.consecutive}
                </p>
              )}
              {redBlack && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Red Black:
                  </span>{" "}
                  {redBlack}
                </p>
              )}
            </div>
          </div>
        );
      }

      case "teenmuf": {
        // TeenMuf description format: "Player A#-#Player B (A : 7  |  B : 0)"
        // sections[0] = "Player A"
        // sections[1] = "-" (Top 9)
        // sections[2] = "Player B (A : 7  |  B : 0)" (M Baccarat)
        const winValue = matchData?.win;
        const winner =
          winValue === "1"
            ? "Player A"
            : winValue === "2"
              ? "Player B"
              : matchData?.winnat || descSections[0] || "N/A";
        const top9 = descSections[1] || "N/A";
        const mBaccarat = descSections[2] || "N/A";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Top 9:{" "}
                <span className="text-black font-normal pl-1">{top9}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                M Baccarat:{" "}
                <span className="text-black font-normal pl-1">{mBaccarat}</span>
              </h2>
            </div>
          </div>
        );
      }
      case "teen": {
        const winValue = matchData?.win;
        const baseWinner =
          winValue === "1"
            ? "Player A"
            : winValue === "2"
              ? "Player B"
              : winValue === "0"
                ? "Tie"
                : undefined;
        const teenInfo = getTeenWinnerInfo(matchData);
        const winner =
          teenInfo.winner || matchData?.winnat || baseWinner || "No Winner";
        const redBlack = matchData?.desc?.split("#")[4];

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-2 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>

              {teenInfo.oddEven.length > 0 && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Odd/Even:
                  </span>{" "}
                  {teenInfo.oddEven.join(" ")}
                </p>
              )}

              {teenInfo.consecutive && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Consecutive:
                  </span>{" "}
                  {teenInfo.consecutive}
                </p>
              )}
              {redBlack && (
                <p className="text-sm text-black text-center">
                  <span className="text-[var(--bg-secondary)] font-medium">
                    Red Black:
                  </span>{" "}
                  {redBlack}
                </p>
              )}
            </div>
          </div>
        );
      }
      case "teen8": {
        const details = parseTeen8Description(
          matchData?.desc || matchData?.newdesc || "",
          matchData?.win
        );

        return (
          <div className="max-w-xl mx-auto w-full mb-2 border border-gray-200 bg-white py-2 shadow-sm">
            <div className="flex flex-col justify-center items-center gap-0 px-4 py-0">
              <h2 className="text-sm font-semibold leading-6 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">
                  {details.winnersText}
                </span>
              </h2>
              <h2 className="text-sm font-semibold leading-6 text-[var(--bg-secondary)]">
                Pair Plus:{" "}
                <span className="text-black font-normal pl-1">
                  {details.pairPlusText}
                </span>
              </h2>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold leading-6 text-[var(--bg-secondary)]">
                  Total:
                </h2>
                {details.playerTotalLines.length ? (
                  details.playerTotalLines.map((line, index) => (
                    <span
                      key={`teen8-total-${index}`}
                      className="text-sm text-black whitespace-pre-line"
                    >
                      {line}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-black">N/A</span>
                )}
                {details.dealerTotal && (
                  <span className="text-sm text-black">
                    Dealer : {details.dealerTotal}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }

      case "poker": {
        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[0] || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                2 Cards:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[1] || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                7 Cards:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[2] || "N/A"}
                </span>
              </h2>
            </div>
          </div>
        );
      }

      case "poker6": {
        const normalize = (value?: string) => {
          if (!value) return "";
          return value.replace(/\s+/g, " ").trim();
        };

        const directMap: Record<string, string> = {
          "11": "Player 1",
          "12": "Player 2",
          "13": "Player 3",
          "14": "Player 4",
          "15": "Player 5",
          "16": "Player 6",
        };

        const resolveWinner = () => {
          const fromDesc = normalize(descSections[0]);
          if (fromDesc) return fromDesc;

          const fromWinNat = normalize(matchData?.winnat);
          if (fromWinNat) return fromWinNat;

          const winValue = String(matchData?.win ?? "")
            .split(",")
            .map((token) => token.trim())
            .filter(Boolean)
            .map((token) => directMap[token] || token);

          if (winValue.length) {
            return winValue.join(", ");
          }

          return "No Winner";
        };

        const pattern = normalize(descSections[1]) || "N/A";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">
                  {resolveWinner()}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Pattern:{" "}
                <span className="text-black font-normal pl-1">{pattern}</span>
              </h2>
            </div>
          </div>
        );
      }

      case "poker20": {
        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[0] || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                2 Cards:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[1] || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                7 Cards:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[2] || "N/A"}
                </span>
              </h2>
            </div>
          </div>
        );
      }

      case "war":
      case "casinowar": {
        const winnerSections = descSections[0]?.replace(/\s+/g, " ").trim();
        const winnerPositions = winnerSections
          ? winnerSections.split(" ").filter(Boolean)
          : [];
        const normalizedWin = String(win || "").trim();

        const getSectionText = (section?: string) => {
          if (!section) return "N/A";
          return section
            .split("~")
            .map((part) =>
              part
                .split("|")
                .map((segment) => segment.trim())
                .filter(Boolean)
                .join(" | ")
            )
            .filter(Boolean)
            .map((row) => row.replace(/\s+/g, " ").trim())
            .join(" • ");
        };

        const colorInfo = getSectionText(descSections[1]);
        const oddEvenInfo = getSectionText(descSections[2]);
        const suitInfo = getSectionText(descSections[3]);

        const resolvedWinner =
          matchData?.winnat ||
          (normalizedWin
            ? normalizedWin
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
                .join(", ")
            : winnerPositions.join(", ")) ||
          "N/A";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="grid place-items-center gap-y-1 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-800">Winner:</span>{" "}
                {winnerSections || "N/A"}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Color:</span>{" "}
                {(() => {
                  const desc = matchData?.desc;
                  if (desc) {
                    const parts = desc.split("#");
                    return parts[1] || "N/A";
                  }
                  return "N/A";
                })()}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Odd/Even:</span>{" "}
                {oddEvenInfo}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Suit:</span>{" "}
                {colorInfo}
              </p>
            </div>
          </div>
        );
      }

      case "cmeter1":
      case "casinometer1": {
        // Casino Meter 1 - Display winner and points
        const cardsString = matchData?.cards || matchData?.card || "";
        const allCards = parseCards(cardsString);
        const fighterACard = allCards[0] || "";
        const fighterBCard = allCards[1] || "";
        const winner = win;
        const isFighterAWinner = winner === "1";
        const isFighterBWinner = winner === "2";

        // Get card value for points calculation
        const getCardValue = (cardCode: string): number => {
          if (!cardCode || cardCode === "1") return 0;
          const rank = cardCode.slice(0, -2); // Everything except last 2 characters (suit)
          if (rank === "A") return 1;
          if (rank === "J") return 11;
          if (rank === "Q") return 12;
          if (rank === "K") return 13;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        const fighterAPoints = fighterACard ? getCardValue(fighterACard) : 0;
        const fighterBPoints = fighterBCard ? getCardValue(fighterBCard) : 0;

        const winnerName = isFighterAWinner
          ? "Fighter A"
          : isFighterBWinner
            ? "Fighter B"
            : "N/A";

        const winnerPoints = isFighterAWinner
          ? fighterAPoints
          : isFighterBWinner
            ? fighterBPoints
            : "N/A";

        return (
          <div
            className="max-w-lg py-4 px-6 mx-auto w-full mb-2 box-shadow-lg border border-gray-100 bg-white rounded"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-2 justify-center items-center">
              <h2 className="text-sm text-justify text-black">
                Winner{" "}
                <span className="text-black font-normal pl-1">
                  {winnerName}
                </span>
              </h2>
              <h2 className="text-sm text-justify text-black">
                Points{" "}
                <span className="text-black font-normal pl-1">
                  {winnerPoints}
                </span>
              </h2>
            </div>
          </div>
        );
      }

      case "abj": {
        // Andar Bahar Joker - Parse description format
        // Format can be: "Winner#Suit#Odd/Even#Joker" or "Winner#3 Baccarat#Total#Pair Plus"
        // Also handle win field: win === "1" = Andar, win === "2" = Bahar
        let winner =
          descSections[0] ||
          matchData?.winnat ||
          (win === "1" ? "Andar" : win === "2" ? "Bahar" : "N/A");

        // Check if description follows the joker format (Suit, Odd/Even, Joker) or baccarat format (3 Baccarat, Total, Pair Plus)
        const hasJokerFormat =
          descSections[1] &&
          (descSections[1].toLowerCase().includes("club") ||
            descSections[1].toLowerCase().includes("diamond") ||
            descSections[1].toLowerCase().includes("heart") ||
            descSections[1].toLowerCase().includes("spade") ||
            descSections[1].toLowerCase() === "suit");

        if (hasJokerFormat || descSections.length >= 4) {
          // Joker format: Winner#Suit#Odd/Even#Joker
          const jokerDetails = {
            suit: descSections[1] || "N/A",
            isOdd: descSections[2]
              ? descSections[2].toLowerCase().includes("odd") ||
                descSections[2].toLowerCase() === "odd"
              : null,
            rank: descSections[3] || "N/A",
          };

          return (
            <div
              className="max-w-lg mx-auto w-full mb-4 box-shadow-lg border border-gray-100 bg-gray-50"
              style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
            >
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Winner:{" "}
                  <span className="text-black font-normal pl-1">{winner}</span>
                </h2>
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Suit:{" "}
                  <span className="text-black font-normal pl-1">
                    {jokerDetails.suit.toUpperCase()}
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
                    {jokerDetails.rank}
                  </span>
                </h2>
                {(matchData?.desc || matchData?.newdesc) && (
                  <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                    Description:{" "}
                    <span className="text-black font-normal pl-1">
                      {matchData?.desc || matchData?.newdesc}
                    </span>
                  </h2>
                )}
              </div>
            </div>
          );
        } else {
          // Baccarat format: Winner#3 Baccarat#Total#Pair Plus
          return (
            <div className="flex flex-col gap-1 max-w-md mx-auto my-2">
              <h2 className="text-sm font-semibold text-black">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              {descSections[1] && (
                <h2 className="text-sm font-semibold text-black">
                  3 Baccarat:{" "}
                  <span className="text-black font-normal pl-1">
                    {descSections[1]}
                  </span>
                </h2>
              )}
              {descSections[2] && (
                <h2 className="text-sm font-semibold text-black">
                  Total:{" "}
                  <span className="text-black font-normal pl-1">
                    {descSections[2]}
                  </span>
                </h2>
              )}
              {descSections[3] && (
                <h2 className="text-sm font-semibold text-black">
                  Pair Plus:{" "}
                  <span className="text-black font-normal pl-1">
                    {descSections[3]}
                  </span>
                </h2>
              )}
            </div>
          );
        }
      }

      case "ab3":
      case "ab_3":
      case "AB_3": {
        // Parse winner from description or win field
        const desc = matchData?.desc || matchData?.newdesc || "";
        let winnerText = "";

        if (desc) {
          const descValues = desc
            .split(",")
            .map((v: string) => v.trim())
            .filter(Boolean);
          if (descValues.length > 0) {
            winnerText = descValues.join(", ");
          }
        }

        // Fallback to win field
        if (!winnerText) {
          if (win === "1") winnerText = "Andar";
          else if (win === "2") winnerText = "Bahar";
          else if (win === "0") winnerText = "Tie";
          else winnerText = win || "N/A";
        }

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <p className="text-sm font-normal leading-8 text-black">
                Winner:{" "}
                <span className="text-[var(--bg-secondary)] font-normal pl-1">
                  {winnerText}
                </span>
              </p>
            </div>
          </div>
        );
      }

      case "ab20":
      case "ab_20": {
        // Parse winner from description or win field
        // Description format: "3,12,11,1,1026,28,22,27,33,25,29" (winning positions)
        const desc = matchData?.desc || "";
        let winnerText = "";

        if (desc) {
          // The desc field contains comma-separated winning positions
          const descValues = desc
            .split(",")
            .map((v: string) => v.trim())
            .filter(Boolean);
          if (descValues.length > 0) {
            winnerText = descValues.join(",");
          }
        }

        // Fallback to win field
        if (!winnerText) {
          if (win === "1") winnerText = "Andar";
          else if (win === "2") winnerText = "Bahar";
          else if (win === "0") winnerText = "Tie";
          else winnerText = win || "N/A";
        }

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center py-2">
              <p className="text-sm font-normal leading-8 text-black">
                Winner{" "}
                <span className="text-[var(--bg-secondary)] font-normal pl-1">
                  {winnerText}
                </span>
              </p>
            </div>
          </div>
        );
      }
      case "aaa2":
      case "aaa_2":
      case "aaa": {
        // Amar Akbar Anthony - Description format: "Winner#3 Baccarat#Total#Pair Plus#Red Black"
        // Also handle win field: win === "1" = Amar, win === "2" = Akbar, win === "3" = Anthony
        let winner = descSections[0] || matchData?.winnat || "";

        // If winner is not in descSections, use win field
        if (!winner || winner === "N/A") {
          if (win === "1") winner = "Amar";
          else if (win === "2") winner = "Akbar";
          else if (win === "3") winner = "Anthony";
          else winner = "N/A";
        }

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                3 Baccarat:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[1] || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Total:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[2] || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Pair Plus:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[3] || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Red Black:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[4] || "N/A"}
                </span>
              </h2>
            </div>
          </div>
        );
      }

      case "btable2":
      case "bollywoodtable": {
        // BTable2 description format: "Movie#OddEven#Game#Color#Card"
        // Example: "Sahib Bibi Aur Ghulam#Yes#Barati#Black#J"
        // Display format: Winner, Odd, Dulha Dulhan/Barati, Color, Card
        const movie =
          descSections[0] ||
          matchData?.winnat ||
          (win === "1"
            ? "Don"
            : win === "2"
              ? "Amar Akbar Anthony"
              : win === "3"
                ? "Sahib Bibi Aur Ghulam"
                : win === "4"
                  ? "Dharam Veer"
                  : win === "5"
                    ? "Kis Kis ko Pyaar Karoon"
                    : win === "6"
                      ? "Ghulam"
                      : "N/A");
        const oddEven = descSections[1] || "N/A";
        const game = descSections[2] || "N/A"; // Dulha Dulhan or Barati
        const color = descSections[3] || "N/A";
        const card = descSections[4] || "N/A";

        // If only winner is available (descSections.length === 1), show only winner
        if (
          descSections.length === 1 ||
          (!descSections[1] &&
            !descSections[2] &&
            !descSections[3] &&
            !descSections[4])
        ) {
          return (
            <div
              className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
              style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
            >
              <div className="flex flex-col gap-1 justify-center items-center">
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Winner:{" "}
                  <span className="text-black font-normal pl-1">{movie}</span>
                </h2>
              </div>
            </div>
          );
        }

        // Full description available - match the screenshot format
        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner{" "}
                <span className="text-black font-normal pl-1">{movie}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Odd{" "}
                <span className="text-black font-normal pl-1">{oddEven}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Dulha Dulhan/Barati{" "}
                <span className="text-black font-normal pl-1">{game}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Color{" "}
                <span className="text-black font-normal pl-1">{color}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Card{" "}
                <span className="text-black font-normal pl-1">
                  {card !== "N/A" ? card.toUpperCase() : card}
                </span>
              </h2>
            </div>
          </div>
        );
      }

      case "32card":
      case "card32eu": {
        const resolveWinnerLabel = () => {
          const winValue = String(matchData?.win ?? "").trim();
          const winNat = String(matchData?.winnat ?? "").trim();
          const directMap: Record<string, string> = {
            "1": "Player 8",
            "2": "Player 9",
            "3": "Player 10",
            "4": "Player 11",
            "8": "Player 8",
            "9": "Player 9",
            "10": "Player 10",
            "11": "Player 11",
          };

          if (directMap[winValue]) return directMap[winValue];

          if (winNat) return winNat;

          const playerMatch =
            winValue.match(/player\s*(\d+)/i) ||
            winNat.match(/player\s*(\d+)/i) ||
            (descSections[0] || "").match(/player\s*(\d+)/i);

          if (playerMatch && playerMatch[1]) {
            return `Player ${playerMatch[1]}`;
          }

          if (descSections[0]) {
            return descSections[0];
          }

          return "No Winner";
        };

        return (
          <div className="flex flex-col gap-2 max-w-lg mx-auto w-full">
            {/* Winner section with shadow border */}
            <div
              className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
              style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
            >
              <div className="flex flex-col gap-1 justify-center items-center p-4">
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Winner{" "}
                  <span className="text-black font-normal pl-1">
                    {resolveWinnerLabel()}
                  </span>
                </h2>
              </div>
            </div>
          </div>
        );
      }

      case "teen9": {
        const winValue = String(matchData?.win ?? "");
        const winner =
          matchData?.winnat ||
          (winValue === "1" || winValue === "11"
            ? "Tiger"
            : winValue === "2" || winValue === "21"
              ? "Lion"
              : winValue === "3" || winValue === "31"
                ? "Dragon"
                : "No Winner");

        const rawDescription = matchData?.desc || matchData?.newdesc || "";
        const otherInfo = rawDescription.includes("#")
          ? rawDescription.split("#")[1] || ""
          : "";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Other:{" "}
                <span className="text-black font-normal pl-1">
                  {otherInfo || "N/A"}
                </span>
              </h2>
            </div>
          </div>
        );
      }

      case "lucky7":
      case "lucky7":
      case "lucky7eu": {
        const [result, oddEven, color, cardValue, line] = descSections;

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Result:{" "}
                <span className="text-black font-normal pl-1">
                  {result || matchData?.winnat || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Odd/Even:{" "}
                <span className="text-black font-normal pl-1">
                  {oddEven || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Color:{" "}
                <span className="text-black font-normal pl-1">
                  {color || "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Card:{" "}
                <span className="text-black font-normal pl-1">
                  {cardValue || "N/A"}
                </span>
              </h2>
              {line && (
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Line:{" "}
                  <span className="text-black font-normal pl-1">{line}</span>
                </h2>
              )}
            </div>
          </div>
        );
      }

      case "teen1":
      case "onecard1day": {
        const desc = matchData?.desc || matchData?.newdesc || "";
        let winner = matchData?.winnat || "";

        // Parse winner from win field if winnat is not available
        if (!winner || winner === "N/A") {
          if (win === "1") winner = "Player";
          else if (win === "2") winner = "Dealer";
          else winner = "N/A";
        }

        // Parse 7 Up/Down from description
        // Format: "Player#P : Up  |  D : Down" or "P : Up  |  D : Down"
        let playerUpDown = null;
        let dealerUpDown = null;

        if (desc) {
          // Try to match the exact format: "Player#P : Up  |  D : Down"
          const upDownMatch = desc.match(
            /(?:Player#)?P\s*:\s*(Up|Down)\s*\|\s*D\s*:\s*(Up|Down)/i
          );
          if (upDownMatch) {
            playerUpDown = upDownMatch[1]; // Up or Down for Player
            dealerUpDown = upDownMatch[2]; // Up or Down for Dealer
          } else {
            // Try alternative format - split by |
            const parts = desc.split("|");
            if (parts.length >= 2) {
              // Extract from first part (Player section)
              const playerMatch =
                parts[0].match(/(?:Player#)?P\s*:\s*(Up|Down)/i) ||
                parts[0].match(/Player.*?:\s*(Up|Down)/i);
              if (playerMatch) playerUpDown = playerMatch[1];

              // Extract from second part (Dealer section)
              const dealerMatch =
                parts[1].match(/D\s*:\s*(Up|Down)/i) ||
                parts[1].match(/Dealer.*?:\s*(Up|Down)/i);
              if (dealerMatch) dealerUpDown = dealerMatch[1];
            }
          }
        }

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-0 justify-center items-center py-2">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner{" "}
                <span className="text-black font-normal pl-1">
                  {winner || "N/A"}
                </span>
              </h2>
              {/* 7 Up/Down Information */}
              {(playerUpDown || dealerUpDown) && (
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  7 Up - 7 Down P: {playerUpDown || "N/A"} | D:{" "}
                  {dealerUpDown || "N/A"}
                </h2>
              )}
              {/* Fallback: Show description if parsing failed */}
              {!playerUpDown && !dealerUpDown && desc && (
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  {desc}
                </h2>
              )}
            </div>
          </div>
        );
      }

      case "baccarat": {
        // Parse description: "Banker#-#No#No#Small"
        // Segment 0: Winner (Banker)
        // Segment 1: Winner Pair (- or Perfect)
        // Segment 2: Either (No)
        // Segment 3: Big/Small (Small)
        let winner = descSections[0] || matchData?.winnat || "";

        // If winner is a number or "Player X" format, convert to Player/Banker based on win field
        if (!winner || winner === "N/A") {
          if (win === "1" || win === "11") {
            winner = "Player";
          } else if (win === "2" || win === "21") {
            winner = "Banker";
          } else if (win === "3") {
            winner = "Tie";
          } else if (win && typeof win === "string" && win.match(/^\d+$/)) {
            const winNum = parseInt(win);
            if (winNum === 1 || winNum === 11) {
              winner = "Player";
            } else if (winNum === 2 || winNum === 21) {
              winner = "Banker";
            } else if (winNum === 3) {
              winner = "Tie";
            } else {
              winner = `Player ${win}`;
            }
          } else {
            winner =
              win === "1"
                ? "Player"
                : win === "2"
                  ? "Banker"
                  : win === "3"
                    ? "Tie"
                    : "N/A";
          }
        }

        let winnerPair = descSections[1] || "-";
        const either = descSections[2] || "-";
        const winnerPerfectPair = descSections[3] || "-";
        const bigSmall = descSections[4] || "-";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner Pair:{" "}
                <span className="text-black font-normal pl-1">
                  {winnerPair}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Either:{" "}
                <span className="text-black font-normal pl-1">{either}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Perfect Pair:{" "}
                <span className="text-black font-normal pl-1">
                  {winnerPerfectPair}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Big/Small:{" "}
                <span className="text-black font-normal pl-1">{bigSmall}</span>
              </h2>
            </div>
          </div>
        );
      }
      case "baccarat2": {
        // Parse description: "Banker#-#No#No#Small"
        // Segment 0: Winner (Banker)
        // Segment 1: Winner Pair (- or Perfect)
        // Segment 2: Score (No)
        // Note: Big/Small is not displayed for Baccarat2
        let winner = descSections[0] || matchData?.winnat || "";

        // If winner is a number or "Player X" format, convert to Player/Banker based on win field
        if (!winner || winner === "N/A") {
          if (win === "1" || win === "11") {
            winner = "Player";
          } else if (win === "2" || win === "21") {
            winner = "Banker";
          } else if (win === "3") {
            winner = "Tie";
          } else if (win && typeof win === "string" && win.match(/^\d+$/)) {
            const winNum = parseInt(win);
            if (winNum === 1 || winNum === 11) {
              winner = "Player";
            } else if (winNum === 2 || winNum === 21) {
              winner = "Banker";
            } else if (winNum === 3) {
              winner = "Tie";
            } else {
              winner = `Player ${win}`;
            }
          } else {
            winner =
              win === "1"
                ? "Player"
                : win === "2"
                  ? "Banker"
                  : win === "3"
                    ? "Tie"
                    : "N/A";
          }
        }

        let winnerPair = descSections[1] || "-";
        const either = descSections[2] || "N/A";

        // Handle Perfect Pair - if segment 1 is "Perfect" or contains "Perfect", format it properly
        if (winnerPair && winnerPair.toLowerCase().includes("perfect")) {
          winnerPair = "Perfect Pair";
        } else if (
          winnerPair === "-" ||
          !winnerPair ||
          winnerPair.trim() === ""
        ) {
          winnerPair = "-";
        }

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner Pair:{" "}
                <span className="text-black font-normal pl-1">
                  {winnerPair}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Score:{" "}
                <span className="text-black font-normal pl-1">{either}</span>
              </h2>
            </div>
          </div>
        );
      }
      case "teensin":
      case "baccarat29": {
        // Parse description for Baccarat29/TeensIn
        // Description format may vary, but typically includes winner and other details
        // Parse cards to calculate scores and determine winners
        const cardsString = matchData?.cards || "";
        const cards = cardsString
          .split(",")
          .filter((card: string) => card && card.trim() && card !== "1");

        // For Baccarat29: cards are distributed as Player A (1st, 3rd, 5th) and Player B (2nd, 4th, 6th)
        const playerACards = [cards[0], cards[2], cards[4]].filter(
          (card: string) => card
        );
        const playerBCards = [cards[1], cards[3], cards[5]].filter(
          (card: string) => card
        );

        // Helper functions to calculate baccarat scores
        const getCardValue = (card: string): number => {
          if (!card || card.length < 2) return 0;
          const rank = card.slice(0, -2);
          if (rank === "A") return 1;
          if (["10", "J", "Q", "K"].includes(rank)) return 0;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        const calculateBaccaratScore = (cards: string[]): number => {
          const sum = cards.reduce((acc, card) => acc + getCardValue(card), 0);
          return sum % 10;
        };

        const getNumericRank = (card: string): number => {
          if (!card || card.length < 2) return 0;
          const rank = card.slice(0, -2);
          if (rank === "A") return 1;
          if (rank === "J") return 11;
          if (rank === "Q") return 12;
          if (rank === "K") return 13;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        const isRedCard = (card: string): boolean => {
          if (!card || card.length < 2) return false;
          const suit = card.slice(-2);
          return suit.includes("H") || suit.includes("D");
        };

        const hasPair = (cards: string[]): boolean => {
          if (cards.length < 2) return false;
          const ranks = cards.map((card: string) => card.slice(0, -2));
          const uniqueRanks = new Set(ranks);
          return ranks.length !== uniqueRanks.size;
        };

        const hasColorPlus = (cards: string[]): boolean => {
          if (cards.length < 2) return false;
          const firstIsRed = isRedCard(cards[0]);
          return cards.every((card: string) => isRedCard(card) === firstIsRed);
        };

        const checkLucky9 = (cards: string[]): boolean => {
          if (cards.some((card: string) => card.slice(0, -2) === "9"))
            return true;
          if (calculateBaccaratScore(cards) === 9) return true;
          return false;
        };

        // Calculate scores
        const scoreA = calculateBaccaratScore(playerACards);
        const scoreB = calculateBaccaratScore(playerBCards);

        // Determine winner
        let winner = descSections[0] || matchData?.winnat || "";
        if (!winner || winner === "N/A") {
          if (scoreA > scoreB) winner = "Player A";
          else if (scoreB > scoreA) winner = "Player B";
          else if (win === "1") winner = "Player A";
          else if (win === "2") winner = "Player B";
          else winner = "N/A";
        }

        // Get high card winner
        let maxRankA = 0;
        let maxRankB = 0;
        playerACards.forEach((card: string) => {
          const rankNum = getNumericRank(card);
          if (rankNum > maxRankA) maxRankA = rankNum;
        });
        playerBCards.forEach((card: string) => {
          const rankNum = getNumericRank(card);
          if (rankNum > maxRankB) maxRankB = rankNum;
        });
        let highCardWinner = "-";
        if (maxRankB > maxRankA) highCardWinner = "Player B";
        else if (maxRankA > maxRankB) highCardWinner = "Player A";

        // Check pairs
        const pairA = hasPair(playerACards);
        const pairB = hasPair(playerBCards);
        let pairWinner = "-";
        if (pairA && !pairB) pairWinner = "Player A";
        else if (pairB && !pairA) pairWinner = "Player B";

        // Check color plus
        const colorPlusA = hasColorPlus(playerACards);
        const colorPlusB = hasColorPlus(playerBCards);
        let colorPlusWinner = "-";
        if (colorPlusA && !colorPlusB) colorPlusWinner = "Player A";
        else if (colorPlusB && !colorPlusA) colorPlusWinner = "Player B";

        // Check lucky 9
        const lucky9A = checkLucky9(playerACards);
        const lucky9B = checkLucky9(playerBCards);
        const hasLucky9Result = lucky9A || lucky9B ? "Yes" : "No";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center py-3 px-4">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">
                  {winner !== "N/A"
                    ? `${winner} (A: ${scoreA} | B: ${scoreB})`
                    : "N/A"}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                High Card:{" "}
                <span className="text-black font-normal pl-1">
                  {highCardWinner}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Pair:{" "}
                <span className="text-black font-normal pl-1">
                  {pairWinner}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Color Plus:{" "}
                <span className="text-black font-normal pl-1">
                  {colorPlusWinner}
                </span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Lucky 9:{" "}
                <span className="text-black font-normal pl-1">
                  {hasLucky9Result}
                </span>
              </h2>
            </div>
          </div>
        );
      }
      case "worli2":
      case "worli": {
        // Worli doesn't need description section - return null
        return null;
      }

      case "dum10":
      case "duskadum": {
        // Duskadum doesn't need description section - return null
        // All details are shown in renderGameResult
        return null;
      }
      case "teen3": {
        // Teen3 (Instant Teenpatti) - shows Player A vs Player B with description
        const winValue = matchData?.win;
        const winner =
          winValue === "1"
            ? "Player A"
            : winValue === "2"
              ? "Player B"
              : matchData?.desc || matchData?.winnat || "N/A";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-0 justify-center items-center py-2">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
            </div>
          </div>
        );
      }

      case "race17":
      case "race_17": {
        // Race to 17 - description is already shown in renderGameResult
        // Return null since all details are in the result display
        return null;
      }

      case "teen120":
      case "teen_120":
      case "onecard2020":
      case "onecard_2020": {
        // Onecard2020 - description is already shown in renderGameResult
        // Return null since all details are in the result display
        return null;
      }

      case "race2":
      case "race_2": {
        // Race 2 - description is already shown in renderGameResult
        // Return null since all details are in the result display
        return null;
      }

      case "race20":
      case "race_20": {
        // Race 20 - description is already shown in renderGameResult
        // Return null since all details are in the result display
        return null;
      }

      case "lucky15":
      case "lucky715": {
        // Lucky15/Lucky715 description - simple winner display
        const getWinnerName = (
          winValue: string | number | undefined
        ): string => {
          if (!winValue) return "Unknown";

          const winStr = String(winValue);
          const winMap: { [key: string]: string } = {
            "1": "0 Runs",
            "2": "1 Runs",
            "3": "2 Runs",
            "4": "4 Runs",
            "5": "6 Runs",
            "6": "Wicket",
          };

          // First try to get from winnat if available
          if (matchData?.winnat) {
            return matchData.winnat;
          }

          // Then try the winMap
          if (winMap[winStr]) {
            return winMap[winStr];
          }

          // Fallback to description parsing
          const desc = matchData?.desc || matchData?.newdesc || "";
          if (desc) {
            const descParts = desc.split("#");
            if (descParts[0]) {
              return descParts[0].trim();
            }
          }

          return winStr;
        };

        const winner = getWinnerName(win);

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Winner:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
            </div>
          </div>
        );
      }

      case "goal": {
        // Goal game description - shows winner, method, and description
        const desc = matchData?.desc || matchData?.newdesc || "";
        const descParts = desc.split("#");
        const winner =
          matchData?.winnat || descParts[0] || matchData?.win || "N/A";
        const method = descParts[1] || null;
        const description = desc || "N/A";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              {method && (
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Method:{" "}
                  <span className="text-black font-normal pl-1">{method}</span>
                </h2>
              )}
              {description && description !== "N/A" && (
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Description:{" "}
                  <span className="text-black font-normal pl-1">
                    {description}
                  </span>
                </h2>
              )}
            </div>
          </div>
        );
      }

      case "trio": {
        // Trio game description
        const cardsString = matchData?.cards || "";
        const trioCards = parseCards(cardsString).slice(0, 3);

        // Helper functions for card calculations
        const getCardRank = (cardCode: string): string => {
          if (!cardCode || cardCode === "1") return "";
          return cardCode.slice(0, -2);
        };

        const getCardValue = (cardCode: string): number => {
          if (!cardCode || cardCode === "1") return 0;
          const rank = getCardRank(cardCode);
          if (rank === "A") return 1;
          if (rank === "J") return 11;
          if (rank === "Q") return 12;
          if (rank === "K") return 13;
          const num = parseInt(rank, 10);
          return isNaN(num) ? 0 : num;
        };

        const isRedCard = (cardCode: string): boolean => {
          if (!cardCode || cardCode === "1") return false;
          const suitCode = cardCode.slice(-2);
          return suitCode === "HH" || suitCode === "DD";
        };

        const isCardOdd = (cardCode: string): boolean => {
          const value = getCardValue(cardCode);
          return value % 2 !== 0;
        };

        // Parse description: "Yes (33)#J Q K##Even#"
        // Part 0: Session result "Yes (33)" or "No (10)"
        // Part 1: Card Judgement "J Q K" or "1 2 4" or empty
        // Part 2: Empty
        // Part 3: Odd/Even "Even" or "Odd"
        // Part 4: Pattern (empty in this case, but we'll calculate it)

        const sessionDesc = descSections[0] || "";
        // Extract session result and sum from "Yes (33)" or "No (10)"
        const sessionMatch = sessionDesc.match(/(Yes|No)\s*\((\d+)\)/);
        const sessionResult = sessionMatch ? sessionMatch[1] : "";
        const sessionSum = sessionMatch ? parseInt(sessionMatch[2], 10) : 0;

        // Calculate actual sum from cards
        const actualSum = trioCards.reduce(
          (sum, card) => sum + getCardValue(card),
          0
        );

        // Session target - try to extract from description or use actual sum
        const sessionTarget = sessionSum || actualSum;

        const cardJudgement = descSections[1] || "";
        const oddEven = descSections[3] || "";

        // Calculate Red/Black
        const redCount = trioCards.filter((card) => isRedCard(card)).length;
        const blackCount = trioCards.length - redCount;
        const redBlack = redCount > blackCount ? "Red" : "Black";

        // Calculate Pattern
        let pattern = "-";
        if (trioCards.length === 3) {
          const card1 = trioCards[0];
          const card2 = trioCards[1];
          const card3 = trioCards[2];

          const card1Rank = getCardRank(card1);
          const card2Rank = getCardRank(card2);
          const card3Rank = getCardRank(card3);

          const card1Value = getCardValue(card1);
          const card2Value = getCardValue(card2);
          const card3Value = getCardValue(card3);

          const values = [card1Value, card2Value, card3Value].sort(
            (a, b) => a - b
          );

          // Check for Trio (all same rank)
          if (card1Rank === card2Rank && card2Rank === card3Rank) {
            pattern = "Trio";
          }
          // Check for Straight Flush (consecutive and same suit)
          else if (
            values[1] === values[0] + 1 &&
            values[2] === values[1] + 1 &&
            card1.slice(-2) === card2.slice(-2) &&
            card2.slice(-2) === card3.slice(-2)
          ) {
            pattern = "Straight Flush";
          }
          // Check for Straight (consecutive values)
          else if (values[1] === values[0] + 1 && values[2] === values[1] + 1) {
            pattern = "Straight";
          }
          // Check for Flush (all same suit)
          else if (
            card1.slice(-2) === card2.slice(-2) &&
            card2.slice(-2) === card3.slice(-2)
          ) {
            pattern = "Flush";
          }
          // Check for Pair (two same rank)
          else if (
            card1Rank === card2Rank ||
            card2Rank === card3Rank ||
            card1Rank === card3Rank
          ) {
            pattern = "Pair";
          }
        }

        return (
          <div className="bg-white border border-gray-300 rounded p-3 my-4">
            <div className="flex justify-center items-center flex-col gap-2 text-sm text-black">
              {/* Session */}
              <div>
                <span className="font-semibold">Session</span> ({sessionTarget}){" "}
                {sessionResult} ({actualSum})
              </div>

              {/* 3 Card Judgement */}
              {cardJudgement && <div>{cardJudgement}</div>}

              {/* Red/Black */}
              <div>
                <span className="font-semibold">Red/Black</span> {redBlack}
              </div>

              {/* Odd/Even */}
              {oddEven && (
                <div>
                  <span className="font-semibold">Odd/Even</span> {oddEven}
                </div>
              )}

              {/* Pattern */}
              <div>
                <span className="font-semibold">Pattern</span> {pattern}
              </div>
            </div>
          </div>
        );
      }
      case "note_num":
      case "note num":
      case "notenum":
      case "note number":
      case "notenumber": {
        // Note Number - parse description with # separator
        // Format: "Odd/Even#Red/Black#Low/High#Cards#Baccarat"
        // Display labels: Winner, 3 Baccarat, Total, Pair Plus, Red Black
        const descString = matchData?.desc || matchData?.newdesc || "";
        const descParts = descString.split("#");
        const winner = descParts[0]?.trim() || "N/A"; // Odd/Even -> Winner
        const baccarat3 = descParts[1]?.trim() || "N/A"; // Red/Black -> 3 Baccarat
        const total = descParts[2]?.trim() || "N/A"; // Low/High -> Total
        const pairPlus = descParts[3]?.trim() || "N/A"; // Cards -> Pair Plus
        const redBlack = descParts[4]?.trim() || "N/A"; // Baccarat -> Red Black

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center py-1 px-4">
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Odd/Even:{" "}
                <span className="text-black font-normal pl-1">{winner}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Red/Black:{" "}
                <span className="text-black font-normal pl-1">{baccarat3}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Low/High:{" "}
                <span className="text-black font-normal pl-1">{total}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Cards:{" "}
                <span className="text-black font-normal pl-1">{pairPlus}</span>
              </h2>
              <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                Baccarat:{" "}
                <span className="text-black font-normal pl-1">{redBlack}</span>
              </h2>
            </div>
          </div>
        );
      }
      case "teen":
      case "teen8":
      case "32card":
      case "card32eu": {
        // Generic description for games with similar structure
        // For 32card, winner might be in format "Player 8" or "8", normalize it
        let winner: any = descSections[0] || matchData?.winnat || "";

        // If winner is a number or "Player X" format, convert to Player A/B based on win field
        if (!winner || winner === "N/A") {
          if (win === "1" || win === "11") {
            winner = "Player A";
          } else if (win === "2" || win === "21") {
            winner = "Player B";
          } else if (win && typeof win === "string" && win.match(/^\d+$/)) {
            // If win is just a number like "8", show as "Player 8" or "Player B" based on context
            const winNum = parseInt(win);
            if (winNum === 1 || winNum === 11) {
              winner = "Player A";
            } else if (winNum === 2 || winNum === 21) {
              winner = "Player B";
            } else {
              winner = `Player ${win}`;
            }
          } else {
            winner =
              win === "1" ? "Player A" : win === "2" ? "Player B" : "N/A";
          }
        }

        return (
          <div className="flex flex-col gap-1 max-w-md mx-auto my-2">
            <h2 className="text-sm font-semibold text-black">
              Winner:{" "}
              <span className="text-black font-normal pl-1">{winner}</span>
            </h2>
            {descSections[1] && (
              <h2 className="text-sm font-semibold text-black">
                3 Baccarat:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[1]}
                </span>
              </h2>
            )}
            {descSections[2] && (
              <h2 className="text-sm font-semibold text-black">
                Total:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[2]}
                </span>
              </h2>
            )}
            {descSections[3] && (
              <h2 className="text-sm font-semibold text-black">
                Pair Plus:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[3]}
                </span>
              </h2>
            )}
            {descSections[4] && (
              <h2 className="text-sm font-semibold text-black">
                Red Black:{" "}
                <span className="text-black font-normal pl-1">
                  {descSections[4]}
                </span>
              </h2>
            )}
          </div>
        );
      }

      case "cricketv3":
      case "cricket_v3":
      case "superover":
      case "fivefivecricket": {
        // Sport games (Cricket/SuperOver) - display match details
        const scoreArray = matchData?.score || [];
        const winner = matchData?.win || matchData?.winnat || "N/A";
        const desc = matchData?.desc || matchData?.newdesc || "";

        return (
          <div
            className="max-w-lg py-2 my-2 mx-auto w-full mb-2 box-shadow-lg border border-gray-100"
            style={{ boxShadow: "0 0 4px -1px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="flex flex-col gap-1 justify-center items-center">
              {winner && winner !== "N/A" && (
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Winner:{" "}
                  <span className="text-black font-normal pl-1">{winner}</span>
                </h2>
              )}
              {desc && (
                <h2 className="text-sm font-normal leading-8 text-[var(--bg-secondary)]">
                  Description:{" "}
                  <span className="text-black font-normal pl-1">{desc}</span>
                </h2>
              )}
              {scoreArray && Array.isArray(scoreArray) && scoreArray.length > 0 && (
                <div className="w-full">
                  <h2 className="text-sm font-semibold text-black mb-2">Score:</h2>
                  {scoreArray.map((score: any, index: number) => (
                    <div key={index} className="text-sm text-black">
                      {score.team || score.name || `Team ${index + 1}`}: {score.score || score.runs || "0"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }
    }
  };

  // Render user bets table (common for all games)
  const renderUserBetsTable = () => {
    if (!userBets || userBets.length === 0) return null;

    const filteredBets = getFilteredBets(userBets, betFilter);
    const totalAmount = filteredBets.reduce((sum: number, bet: any) => {
      const result = bet.betData?.result;
      if (!result || !result.settled) return sum;
      let profitLoss = 0;
      if (result.status === "won" || result.status === "profit") {
        profitLoss = Number(result.profitLoss) || 0;
      } else if (result.status === "lost") {
        profitLoss = Number(result.profitLoss) || 0;
      }
      return sum + profitLoss;
    }, 0);

    return (
      <div className="max-w-4xl mx-auto w-full mb-4">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">User Bets</h3>
        </div>

        {/* Filter Options - Only show if setBetFilter is not an empty function */}
        {setBetFilter.toString() !== "() => {}" && (
          <div className="bg-white px-4 py-2 border-b border-gray-200">
            <div className="flex items-center gap-4">
              {["all", "back", "lay", "deleted"].map((filter) => (
                <label key={filter} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="betFilter"
                    value={filter}
                    checked={betFilter === filter}
                    onChange={(e) => setBetFilter(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm capitalize">{filter}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white px-4 py-2 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Total Bets: {filteredBets.length}
            </span>
            <span className="text-sm font-medium">
              Total Amount:{" "}
              <span
                className={totalAmount >= 0 ? "text-green-600" : "text-red-600"}
              >
                {totalAmount.toFixed(2)}
              </span>
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                  Username
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
              {filteredBets.map((bet: any, index: number) => (
                <tr
                  key={bet.id || index}
                  className={`${
                    bet.betData?.oddCategory?.toLowerCase() === "back"
                      ? "bg-[var(--bg-back)]"
                      : bet.betData?.oddCategory?.toLowerCase() === "lay"
                        ? "bg-[var(--bg-lay)]"
                        : "bg-white"
                  }`}
                >
                  <td className="border text-nowrap border-gray-300 px-3 py-2">
                    {bet.username || bet.loginId || "N/A"}
                  </td>
                  <td className="border text-nowrap border-gray-300 px-3 py-2">
                    {bet.betData?.betRate || bet.betData?.matchOdd || "N/A"}
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
                    {bet.betData?.result?.status === "won" ? "+" : ""}{" "}
                    {bet.betData?.result?.profitLoss?.toFixed(2) || "N/A"}
                  </td>
                  <td className="border text-nowrap border-gray-300 px-3 py-2">
                    {bet.createdAt
                      ? new Date(bet.createdAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="border text-nowrap border-gray-300 px-3 py-2 text-xs">
                    {bet.ipAddress || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Detail
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <input type="checkbox" className="text-blue-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col px-2">
      {/* Header Information */}
      <div className="flex justify-between items-center">
        <h2 className="text-xs md:text-sm font-semibold leading-8 text-black">
          Round Id:{" "}
          <span className="text-black font-normal pl-1">{matchData?.mid}</span>
        </h2>
        <h2 className="text-xs md:text-sm font-semibold leading-8 text-black capitalize">
          Match Time:{" "}
          <span className="text-black font-normal pl-1">
            {formatDateTime(
              matchData?.winAt ||
                matchData?.mtime ||
                matchData?.matchTime ||
                matchData?.dateAndTime ||
                matchData?.createdAt
            )}
          </span>
        </h2>
      </div>

      {/* Game-specific Result Display */}

      {renderGameResult()}

      {/* Game-specific Description */}
      {(matchData?.desc || matchData?.newdesc || matchData?.winnat) &&
        renderGameDescription()}

      {/* User Bets Table */}
      {renderUserBetsTable()}
    </div>
  );
};

export default CasinoMatchDetailsDisplay;
