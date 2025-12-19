import React, { useState, useRef } from "react";

import TooltipPortal from "@/components/TooltipPortal";

interface SportMatchDetailsDisplayProps {
  responseData: any; // Full API response

  betFilter: string;

  setBetFilter: (filter: string) => void;

  getFilteredBets: (bets: any[], filter: string) => any[];
}

const SportMatchDetailsDisplay: React.FC<SportMatchDetailsDisplayProps> = ({
  responseData,

  betFilter,

  setBetFilter,

  getFilteredBets,
}) => {
  // Extract data from API response structure
  // API response structure: { success, message, data: { bet, match, matchedMarket } }
  const bet = responseData?.data?.bet || responseData?.bet || {};
  const match = responseData?.data?.match || responseData?.match || {};
  const matchedMarket =
    responseData?.data?.matchedMarket || responseData?.matchedMarket || {};

  // Create bets array from single bet (API returns single bet)

  const userBets = bet?.id ? [bet] : [];

  // User Bet Row Component with Tooltip

  const UserBetRow = ({ bet, index }: { bet: any; index: number }) => {
    const btnRef = useRef<HTMLElement>(null);

    const [open, setOpen] = useState(false);

    const winAmount = bet.betData?.result?.profitLoss || 0;

    const isWin =
      bet.betData?.result?.status === "won" ||
      bet.status === "won" ||
      bet.betData?.result?.status === "profit";

    const betType =
      bet.betData?.betType?.toLowerCase() ||
      bet.betData?.oddCategory?.toLowerCase() ||
      "";

    return (
      <tr
        key={bet.id || index}
        className={` ${
          betType === "back" || betType === "yes"
            ? "bg-[var(--bg-back)]"
            : betType === "lay" || betType === "no"
              ? "bg-[var(--bg-lay)]"
              : "bg-white"
        }`}
      >
        <td className="border text-nowrap border-gray-300 px-3 py-2">
          {bet.username || "N/A"}
        </td>

        <td className="border text-nowrap border-gray-300 px-3 py-2">
          {bet.betData?.name ||
            bet.betData?.betName ||
            bet.betData?.rname ||
            "N/A"}
        </td>

        <td className="border text-nowrap border-gray-300 px-3 py-2">
          {bet.betData?.run ||
            bet.betData?.bhav ||
            bet.betData?.bhavValue ||
            "N/A"}
        </td>

        <td className="border text-nowrap border-gray-300 px-3 py-2">
          {bet.betData?.matchOdd ||
            bet.betData?.odd ||
            bet.betData?.betRate ||
            bet.betData?.rate ||
            "N/A"}
        </td>

        <td className="border text-nowrap border-gray-300 px-3 py-2">
          {bet.betData?.stake || bet.betData?.amount || "N/A"}
        </td>

        <td
          className={`border text-nowrap border-gray-300 px-3 py-2 ${
            isWin ? "text-green-600" : "text-red-600"
          }`}
        >
          {isWin && winAmount > 0 ? "+" : ""}

          {winAmount.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          })}
        </td>

        <td className="border text-nowrap border-gray-300 px-3 py-2">
          {bet.createdAt
            ? new Date(bet.createdAt).toLocaleString()
            : bet.betData?.placedAt
              ? new Date(bet.betData.placedAt).toLocaleString()
              : "N/A"}
        </td>

        <td className="border text-nowrap border-gray-300 px-3 py-2 text-xs">
          {bet.ipAddress || "N/A"}
        </td>

        <td className="border border-gray-300 px-3 py-2">
          <div className="relative inline-block">
            <button
              ref={btnRef as React.RefObject<HTMLButtonElement>}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Detail
            </button>

            <TooltipPortal targetRef={btnRef} open={open}>
              <div className="text-xs">{bet.userAgent || "N/A"}</div>
            </TooltipPortal>
          </div>
        </td>

        <td className="border border-gray-300 px-3 py-2 text-center">
          <input type="checkbox" className="text-blue-600" />
        </td>
      </tr>
    );
  };

  // Render user bets table

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
      <div className="max-w-6xl mx-auto w-full mb-4">
        {/* Filter Options and Summary on same row */}

        <div className="bg-white px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Filter Options */}

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

            {/* Summary */}

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                Total Bets: {filteredBets.length}
              </span>

              <span className="text-sm font-medium">
                Total Amount:{" "}
                <span
                  className={
                    totalAmount >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {totalAmount.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
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
                  Nation
                </th>

                <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                  Rate
                </th>

                <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                  Bhav
                </th>

                <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                  Amount
                </th>

                <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                  Win
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
                <UserBetRow key={bet.id || index} bet={bet} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Build match path from API response

  const buildMatchPath = () => {
    const sport = bet?.betData?.sportType || match?.sportType || "Sport";

    const tournament = bet?.betData?.seriesName || "";

    const teams = bet?.betData?.eventName || match?.eventName || "";

    const market =
      matchedMarket?.marketName ||
      bet?.betData?.market ||
      bet?.betData?.gtype ||
      "";

    const pathParts = [sport];

    if (tournament) pathParts.push(tournament);

    if (teams) pathParts.push(teams);

    if (market) pathParts.push(market);

    return pathParts.join(" -> ");
  };

  // Get winner from matchedMarket result

  const getWinner = () => {
    return bet?.betData?.result?.result || "N/A";
  };

  // Get game time from bet data

  const getGameTime = () => {
    // Try gameDate first, then settledAt, then placedAt

    if (bet?.betData?.gameDate) {
      return bet.betData.gameDate;
    }

    if (bet?.settledAt) {
      return new Date(bet.settledAt).toLocaleString();
    }

    if (bet?.betData?.placedAt) {
      return new Date(bet.betData.placedAt).toLocaleString();
    }

    if (bet?.createdAt) {
      return new Date(bet.createdAt).toLocaleString();
    }

    return "N/A";
  };

  return (
    <div className="flex flex-col px-2">
      {/* Match Path */}

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-black">
          Match Path:{" "}
          <span className="text-black font-normal pl-1">
            {buildMatchPath()}
          </span>
        </h2>
      </div>

      {/* Winner and Game Time */}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-black">
          Winner:{" "}
          <span className="text-black font-normal pl-1">{getWinner()}</span>
        </h2>

        <h2 className="text-sm font-semibold text-black capitalize">
          Game Time:{" "}
          <span className="text-black font-normal pl-1">{getGameTime()}</span>
        </h2>
      </div>

      {/* User Bets Table */}

      {renderUserBetsTable()}
    </div>
  );
};

export default SportMatchDetailsDisplay;
