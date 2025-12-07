import React, { useState } from "react";

interface SportMatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: any;
}

const SportMatchDetailsModal: React.FC<SportMatchDetailsModalProps> = ({
  isOpen,
  onClose,
  matchData,
}) => {
  const [betFilter, setBetFilter] = useState("all");

  if (!isOpen || !matchData) return null;

  const bet = matchData?.bet || {};
  const match = matchData?.match || {};
  const matchedMarket = matchData?.matchedMarket || {};

  const userBets = bet?.id ? [bet] : [];

  // Helper function to filter bets
  const getFilteredBets = (bets: any[], filter: string) => {
    if (filter === "all") return bets;
    if (filter === "deleted") return bets.filter((bet) => bet.isDeleted);
    return bets.filter((bet) => {
      const betType =
        bet.betData?.betType?.toLowerCase() ||
        bet.betData?.oddCategory?.toLowerCase() ||
        "";
      return betType === filter;
    });
  };

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

    return pathParts.join(" → ");
  };

  const getWinner = () => {
    return bet?.betData?.result?.result || "N/A";
  };

  const getGameTime = () => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Sport Match Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="flex flex-col px-2">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-black">
                Match Path:{" "}
                <span className="text-black font-normal pl-1">
                  {buildMatchPath()}
                </span>
              </h2>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-black">
                Winner:{" "}
                <span className="text-black font-normal pl-1">
                  {getWinner()}
                </span>
              </h2>
              <h2 className="text-sm font-semibold text-black capitalize">
                Game Time:{" "}
                <span className="text-black font-normal pl-1">
                  {getGameTime()}
                </span>
              </h2>
            </div>

            {/* Bets Table */}
            {userBets.length > 0 && (
              <div className="max-w-6xl mx-auto w-full mb-4">
                <div className="bg-white px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
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
                      {filteredBets.map((bet: any, index: number) => {
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
                            className={`${
                              betType === "back" || betType === "yes"
                                ? "bg-[var(--bg-back)]"
                                : betType === "lay" || betType === "no"
                                  ? "bg-[var(--bg-lay)]"
                                  : "bg-white"
                            }`}
                          >
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
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                Detail
                              </button>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input type="checkbox" className="text-blue-600" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportMatchDetailsModal;

