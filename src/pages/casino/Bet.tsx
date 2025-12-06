import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { getCasinoUserMatchBets } from "@/helper/casino";

interface BetProps {
  roundId: string | number;
}

const Bet: React.FC<BetProps> = ({ roundId }) => {
  const [cookies] = useCookies(["Admin", "TechAdmin", "token"]);

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
        <button className="bg-[#4a5c6d] hover:bg-[#3a4c5d] text-white px-3 py-1 text-xs uppercase font-medium transition-colors">
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
                <td colSpan={6} className="text-center text-xs leading-6 py-3 bg-[#f5f5f5] text-gray-600 border-b">
                  No records found
                </td>
              </tr>
            ) : (
              bets.map((bet, index) => (
                <tr
                  key={bet.betId || index}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="text-xs leading-6 py-2 px-3 text-left">
                    {bet.userName}
                  </td>
                  <td className="text-xs leading-6 py-2 px-3 text-left">
                    {bet.name}
                  </td>
                  <td className="text-xs leading-6 py-2 px-3 text-center font-medium">
                    {Number(bet.betRate).toFixed(2)}
                  </td>
                  <td className="text-xs leading-6 py-2 px-3 text-center font-medium">
                    {Number(bet.betAmount).toFixed(2)}
                  </td>
                  <td className="text-xs leading-6 py-2 px-3 text-left text-gray-700">
                    {formatDate(bet.createdAt)}
                  </td>
                  <td className="text-xs leading-6 py-2 px-3 text-left">
                    {bet.gameSlug.toLowerCase()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bet;
