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

  const bets = data?.data || [];

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="bg-[var(--bg-secondary70)] py-1 px-3 flex items-center rounded-t justify-between">
        <h2 className="text-xs tracking-tighter leading-6 uppercase text-white">
          My Bets {roundId && roundId !== "—" && `(Round: ${roundId})`}
        </h2>
        <button className="bg-[var(--bg-secondary)] text-white px-2 py-1 text-xs">
          View More
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-2 text-left">
                UserName
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-2 text-left">
                Nation
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-2 text-right">
                Rate
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-2 text-right">
                Amount
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-2 text-left">
                PlaceDate
              </th>
              <th className="text-xs tracking-tight leading-6 font-semibold py-2 px-2 text-left">
                Gametype
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center text-xs leading-6 py-4 text-gray-500">
                  Loading bets...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="text-center text-xs leading-6 py-4 text-red-500">
                  Error loading bets
                </td>
              </tr>
            ) : bets.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-xs leading-6 py-4 bg-gray-50 text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              bets.map((bet, index) => (
                <tr
                  key={bet.id || index}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="text-xs leading-6 py-2 px-2 text-left">
                    {bet.userName}
                  </td>
                  <td className="text-xs leading-6 py-2 px-2 text-left">
                    {bet.nation}
                  </td>
                  <td className="text-xs leading-6 py-2 px-2 text-right font-medium">
                    {Number(bet.rate).toFixed(2)}
                  </td>
                  <td className="text-xs leading-6 py-2 px-2 text-right font-medium">
                    ₹{Number(bet.amount).toLocaleString()}
                  </td>
                  <td className="text-xs leading-6 py-2 px-2 text-left text-gray-600">
                    {formatDate(bet.placeDate)}
                  </td>
                  <td className="text-xs leading-6 py-2 px-2 text-left">
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      {bet.gameType}
                    </span>
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
