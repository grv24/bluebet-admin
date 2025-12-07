import React from "react";

interface CasinoMatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: any;
  casinoType: string;
}

const CasinoMatchDetailsModal: React.FC<CasinoMatchDetailsModalProps> = ({
  isOpen,
  onClose,
  matchData,
  casinoType,
}) => {
  if (!isOpen || !matchData) return null;

  const data = matchData?.data || matchData;
  const matchInfo = data?.match || {};
  const bets = data?.bets || [];

  const getMatchTitle = () => {
    return `${casinoType.toUpperCase()} - Match Details`;
  };

  const getMatchInfo = () => {
    const roundId = data?.mid || data?.roundId || matchInfo?.roundId || "N/A";
    const status = matchInfo?.status || data?.status || "N/A";
    const winner = matchInfo?.winner || data?.winner || "N/A";
    const result = matchInfo?.result || data?.result || "N/A";

    return { roundId, status, winner, result };
  };

  const { roundId, status, winner, result } = getMatchInfo();

  const totalBets = bets.length;
  const totalAmount = bets.reduce((sum: number, bet: any) => {
    const amount = bet.betData?.stake || bet.betAmount || 0;
    return sum + amount;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {getMatchTitle()}
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
          {/* Match Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Round ID</p>
                <p className="font-semibold">{roundId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold capitalize">{status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Winner</p>
                <p className="font-semibold">{winner}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Result</p>
                <p className="font-semibold">{result}</p>
              </div>
            </div>
          </div>

          {/* Bets Summary */}
          <div className="flex items-center justify-between mb-4 bg-blue-50 p-3 rounded">
            <span className="text-sm font-medium">
              Total Bets: <span className="font-bold">{totalBets}</span>
            </span>
            <span className="text-sm font-medium">
              Total Amount:{" "}
              <span className="font-bold text-green-600">
                {totalAmount.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </div>

          {/* Bets Table */}
          {bets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                      User
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                      Selection
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                      Odds
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                      Amount
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                      Type
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                      Win/Loss
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                      Status
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                      Placed At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bets.map((bet: any, index: number) => {
                    const userName = bet.user?.userName || bet.userName || "N/A";
                    const selection =
                      bet.betData?.name ||
                      bet.betData?.betName ||
                      bet.name ||
                      "N/A";
                    const odds =
                      bet.betData?.matchOdd ||
                      bet.betData?.betRate ||
                      bet.betRate ||
                      "N/A";
                    const amount =
                      bet.betData?.stake || bet.betAmount || bet.amount || 0;
                    const betType =
                      bet.betData?.betType ||
                      bet.betData?.oddCategory ||
                      bet.oddCategory ||
                      "N/A";
                    const profitLoss = bet.betProfit || bet.betLoss || 0;
                    const betStatus =
                      bet.betStatus || bet.status || "pending";
                    const placedAt =
                      bet.betData?.placedAt || bet.createdAt || "N/A";

                    const rowBgClass =
                      betType.toLowerCase() === "back"
                        ? "bg-[var(--bg-back)]"
                        : betType.toLowerCase() === "lay"
                          ? "bg-[var(--bg-lay)]"
                          : "bg-white";

                    return (
                      <tr key={bet.betId || index} className={rowBgClass}>
                        <td className="border border-gray-300 px-3 py-2">
                          {userName}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {selection}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {odds}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          {Number(amount).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              betType.toLowerCase() === "back"
                                ? "bg-blue-100 text-blue-800"
                                : betType.toLowerCase() === "lay"
                                  ? "bg-pink-100 text-pink-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {betType}
                          </span>
                        </td>
                        <td
                          className={`border border-gray-300 px-3 py-2 text-right font-semibold ${
                            profitLoss > 0
                              ? "text-green-600"
                              : profitLoss < 0
                                ? "text-red-600"
                                : ""
                          }`}
                        >
                          {profitLoss > 0 ? "+" : ""}
                          {Number(profitLoss).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              betStatus === "settled"
                                ? "bg-green-100 text-green-800"
                                : betStatus === "void"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {betStatus}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-xs">
                          {placedAt !== "N/A"
                            ? new Date(placedAt).toLocaleString()
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No bets found for this match
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CasinoMatchDetailsModal;

