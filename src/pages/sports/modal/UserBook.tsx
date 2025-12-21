import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useCookies } from "react-cookie";
import { baseUrl, SERVER_URL } from "@/helper/auth";
import toast from "react-hot-toast";

interface UserBookData {
  username: string;
  data: { [key: string]: number };
  allOtherInfo?: Array<{ [key: string]: number }>;
}

interface UserBookProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  marketType?: "match_odds" | "bookmaker";
  mid?: string;
  matchTeams?: {
    team1?: string;
    team2?: string;
  };
}

const UserBook: React.FC<UserBookProps> = ({
  isOpen,
  onClose,
  eventId,
  marketType = "match_odds",
  mid,
  matchTeams,
}) => {
  const [userBookData, setUserBookData] = useState<UserBookData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  
  // Get authentication token from cookies
  const [cookies] = useCookies([
    baseUrl.includes("techadmin") ? "TechAdmin" : "Admin",
  ]);
  const authToken =
    cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];

  // Fetch user book data
  useEffect(() => {
    if (isOpen && eventId && authToken) {
      fetchUserBookData();
    }
  }, [isOpen, eventId, authToken, marketType, mid]);

  // Format number: if it has many decimal places (like 65.99999999), format to 2 decimals, else return as is
  const formatNumber = (value: number): number | string => {
    if (value === 0 || value === null || value === undefined) {
      return value;
    }

    const valueStr = value.toString();
    // Check if number has decimal point and more than 2 decimal places
    if (valueStr.includes(".") && valueStr.split(".")[1]?.length > 2) {
      // Truncate to 2 decimal places using string manipulation to avoid floating point issues
      const parts = valueStr.split(".");
      if (parts[1] && parts[1].length > 2) {
        const truncatedStr = parts[0] + "." + parts[1].substring(0, 2);
        return parseFloat(truncatedStr);
      }
    }

    // Return original value if it doesn't have many decimal places
    return value;
  };

  const fetchUserBookData = async () => {
    if (!authToken || !eventId) {
      console.error("No auth token or eventId available");
      return;
    }

    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('type', marketType);
      if (mid && marketType === 'bookmaker') {
        queryParams.append('mid', mid);
      }
      
      const response = await fetch(
        `${SERVER_URL}/api/v1/sports/user-book/${eventId}?${queryParams.toString()}`,
        {
          method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch user book data: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("User Book API Response:", data);
      if (data.success && data.bets) {
        // Extract all unique team/option names from all bets
        const allTeamNames = new Set<string>();
        
        Array.isArray(data.bets) && data.bets.forEach((bet: any) => {
          if (bet.data && typeof bet.data === 'object') {
            Object.keys(bet.data).forEach((key) => {
              // Exclude 'newExposure' as it's not a team name
              if (key !== 'newExposure') {
                allTeamNames.add(key);
              }
            });
          }
        });

        // Convert Set to Array and sort for consistent display
        const sortedTeamNames = Array.from(allTeamNames).sort();
        setTeamNames(sortedTeamNames);
        
        // Transform API response to match our interface
        const transformedData: UserBookData[] = Array.isArray(data.bets)
          ? data.bets.map((bet: any) => ({
              username: bet.username || "",
              data: bet.data || {},
              allOtherInfo: bet.allOtherInfo || [],
            }))
          : [];
        setUserBookData(transformedData);
      } else {
        // If no data, use empty array
        setUserBookData([]);
        setTeamNames([]);
      }
    } catch (error) {
      console.error("Error fetching user book data:", error);
      toast.error("Failed to fetch user book data");
      // Fallback to empty array on error
      setUserBookData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const team1Name = matchTeams?.team1;
  const team2Name = matchTeams?.team2;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-4">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fadein">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-[var(--bg-primary)] text-white rounded-full w-8 h-8 cursor-pointer flex items-center justify-center text-md z-10"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        {/* Header */}
        <h2 className="text-xl p-4 font-normal mb-2">User Book</h2>
        
        <div className="px-8 py-4 pb-4 flex-1 overflow-hidden flex flex-col">
        {/* Summary Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading...</div>
            </div>
            ) : userBookData.length > 0 && teamNames.length > 0 ? (
            <div className="user-book">
                <table className="w-full text-sm border-collapse">
                    <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-3 py-1 font-normal text-gray-700">
                        UserName
                      </th>
                      {teamNames.map((teamName) => (
                        <th
                          key={teamName}
                          className="text-right px-3 py-1 font-normal text-gray-700"
                        >
                          {teamName}
                        </th>
                      ))}
                      </tr>
                    </thead>
                      <tbody>
                    {userBookData.map((user, index) => (
                      <tr
                        key={index}
                        // className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors`}
                      >
                        <td className="text-left px-3 py-1 font-medium text-gray-800">
                          {user.username}
                            </td>
                        {teamNames.map((teamName) => (
                          <td
                            key={teamName}
                            className="text-right px-3 py-1 font-normal"
                          >
                            {formatNumber(user.data[teamName] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    </tbody>
                  </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">No Record Found</div>
            </div>
          )}
        </div>
        </div>
      </div>

      <style>{`
        .animate-fadein { animation: fadein 0.2s; }
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default UserBook;
