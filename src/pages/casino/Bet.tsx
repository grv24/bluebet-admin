import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { getCasinoUserMatchBets } from "@/helper/casino";

interface BetProps {
  roundId: string | number;
}

const Bet: React.FC<BetProps> = ({ roundId }) => {
  const [cookies] = useCookies(["Admin", "TechAdmin", "token"]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user match bets
  const { data, isLoading, error } = useQuery({
    queryKey: ["casinoUserMatchBets", roundId],
    queryFn: () => getCasinoUserMatchBets(roundId, cookies),
    enabled: !!roundId && roundId !== "—",
    refetchInterval: 5000, // Refetch every 5 seconds to get new bets
    staleTime: 0,
  });

  const bets = data?.bets || [];

  // Format date for display - matches screenshot format: 06/12/2025 22:49:14
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col bg-white">
      <div className="bg-[#5a6c7d] py-1 px-3 flex items-center justify-between">
        <h2 className="text-xs tracking-tight leading-6 uppercase text-white font-semibold">
          MY BETS
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4a5c6d] hover:bg-[#3a4c5d] text-white px-3 py-1 text-xs uppercase font-medium transition-colors"
        >
          VIEW MORE
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#e8f0f8]">
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-3 text-left border-b border-gray-300">
                UserName
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-3 text-left border-b border-gray-300">
                Nation
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-3 text-center border-b border-gray-300">
                Rate
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-3 text-center border-b border-gray-300">
                Amount
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-3 text-left border-b border-gray-300">
                PlaceDate
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-3 text-left border-b border-gray-300">
                Gametype
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center text-xs leading-6 py-4 text-gray-500 border-b">
                  Loading bets...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="text-center text-xs leading-6 py-4 text-red-500 border-b">
                  Error loading bets
                </td>
              </tr>
            ) : bets.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-xs leading-6 py-3 bg-[#f5f5f5] text-gray-600 ">
                  No records found
                </td>
              </tr>
            ) : (
              bets.map((bet, index) => {
                // Determine bet type from betData.betType or oddCategory
                const betType = bet.betData?.betType?.toLowerCase() || bet.oddCategory?.toLowerCase() || 'back';
                const isBackBet = betType === 'back';
                const bgColor = isBackBet ? 'border-l-4 border-[var(--bg-back)] bg-[var(--bg-back)]/60' : 'border-l-4 border-[var(--bg-lay)] bg-[var(--bg-lay)]/60';
                
                return (
                  <tr
                    key={bet.betId || index}
                    className={`border-b border-gray-200 hover:opacity-90 transition-all ${bgColor}`}
                  >
                  <td className="text-xs leading-6 py px-1 text-left">
                    {bet.userName}
                  </td>
                  <td className="text-xs leading-6 py px text-left">
                    {bet.name}
                  </td>
                  <td className="text-xs leading-6 py px text-center font-medium">
                    {Number(bet.betRate).toFixed(2)}
                  </td>
                  <td className="text-xs leading-6 py px text-center font-medium">
                    {Number(bet.betAmount).toFixed(2)}
                  </td>
                  <td className="text-xs leading-6 py px text-left text-gray-700">
                    {formatDate(bet.createdAt)}
                  </td>
                  <td className="text-xs leading-6 py p text-left">
                    {bet.gameSlug.toLowerCase()}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View More Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadein">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[90vw] max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#3b5160] px-6 py-3 rounded-t-lg flex items-center justify-between relative">
              <h2 className="text-lg font-semibold text-yellow-400 tracking-wide">
                View More
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-blue-400 text-2xl font-bold focus:outline-none bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-auto flex-1">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-xs font-semibold py-2 px-3 text-left border border-gray-300">
                        No
                      </th>
                      <th className="text-xs font-semibold py-2 px-3 text-left border border-gray-300">
                        UserName
                      </th>
                      <th className="text-xs font-semibold py-2 px-3 text-left border border-gray-300">
                        Nation
                      </th>
                      <th className="text-xs font-semibold py-2 px-3 text-left border border-gray-300">
                        Amount
                      </th>
                      <th className="text-xs font-semibold py-2 px-3 text-left border border-gray-300">
                        User Rate
                      </th>
                      <th className="text-xs font-semibold py-2 px-3 text-left border border-gray-300">
                        Place Date
                      </th>
                      <th className="text-xs font-semibold py-2 px-3 text-left border border-gray-300">
                        IP
                      </th>
                      <th className="text-xs font-semibold py-2 px-3 text-left border border-gray-300">
                        Browser Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center text-xs py-4 border border-gray-300">
                          Loading bets...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={8} className="text-center text-xs py-4 text-red-500 border border-gray-300">
                          Error loading bets
                        </td>
                      </tr>
                    ) : bets.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-xs py-4 border border-gray-300">
                          No records found
                        </td>
                      </tr>
                    ) : (
                      bets.map((bet, index) => (
                        <tr key={bet.betId || index} className="hover:bg-gray-50">
                          <td className="text-xs py-2 px-3 border border-gray-300">
                            {index + 1}
                          </td>
                          <td className="text-xs py-2 px-3 border border-gray-300">
                            {bet.userName}
                          </td>
                          <td className="text-xs py-2 px-3 border border-gray-300">
                            {bet.name}
                          </td>
                          <td className="text-xs py-2 px-3 border border-gray-300">
                            {Number(bet.betAmount).toFixed(2)}
                          </td>
                          <td className="text-xs py-2 px-3 border border-gray-300">
                            {Number(bet.betRate).toFixed(2)}
                          </td>
                          <td className="text-xs py-2 px-3 border border-gray-300">
                            {formatDate(bet.createdAt)}
                          </td>
                          <td className="text-xs py-2 px-3 border border-gray-300">
                            {bet.betData?.userIp || '—'}
                          </td>
                          <td className="text-xs py-2 px-3 border border-gray-300">
                            {bet.betData?.userAgent || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bet;
