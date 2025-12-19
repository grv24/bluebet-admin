import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useCookies } from 'react-cookie';
import { baseUrl, SERVER_URL } from '@/helper/auth';
import toast from 'react-hot-toast';

interface UserBookData {
  username: string;
  australia: number;
  england: number;
  theDraw: number;
}

interface UserBookProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  marketType?: 'match_odds' | 'bookmaker';
  matchTeams?: {
    team1?: string;
    team2?: string;
  };
}

const UserBook: React.FC<UserBookProps> = ({
  isOpen,
  onClose,
  eventId,
  marketType = 'match_odds',
  matchTeams,
}) => {
  const [userBookData, setUserBookData] = useState<UserBookData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchUsername, setSearchUsername] = useState<string>('');
  const [hasDrawColumn, setHasDrawColumn] = useState<boolean>(false);
  
  // Get authentication token from cookies
  const [cookies] = useCookies([
    baseUrl.includes("techadmin") ? "TechAdmin" : "Admin",
  ]);
  const authToken = cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];

  // Fetch user book data
  useEffect(() => {
    if (isOpen && eventId && authToken) {
      fetchUserBookData();
    }
  }, [isOpen, eventId, authToken, marketType]);

  const fetchUserBookData = async () => {
    if (!authToken || !eventId) {
      console.error('No auth token or eventId available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/sports/user-book/${eventId}?type=${marketType}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user book data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('User Book API Response:', data);
      if (data.success && data.bets) {
        // Check if any bet has "The Draw" field
        const hasDrawField = Array.isArray(data.bets) && data.bets.some((bet: any) => 
          bet.data && 'The Draw' in bet.data
        );
        setHasDrawColumn(hasDrawField);
        
        // Transform API response to match our interface
        const transformedData: UserBookData[] = Array.isArray(data.bets)
          ? data.bets.map((bet: any) => ({
              username: bet.username || '',
              australia: bet.data?.Australia || 0,
              england: bet.data?.England || 0,
              theDraw: bet.data?.['The Draw'] || 0,
            }))
          : [];
        setUserBookData(transformedData);
      } else {
        // If no data, use empty array
        setUserBookData([]);
        setHasDrawColumn(false);
      }
    } catch (error) {
      console.error('Error fetching user book data:', error);
      toast.error('Failed to fetch user book data');
      // Fallback to empty array on error
      setUserBookData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data by username search
  const filteredData = userBookData.filter((user) =>
    user.username.toLowerCase().includes(searchUsername.toLowerCase())
  );

  // Calculate totals
  const totals = filteredData.reduce(
    (acc, user) => ({
      australia: acc.australia + user.australia,
      england: acc.england + user.england,
      theDraw: acc.theDraw + user.theDraw,
    }),
    { australia: 0, england: 0, theDraw: 0 }
  );

  if (!isOpen) return null;

  const team1Name = matchTeams?.team1 ;
  const team2Name = matchTeams?.team2 ;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
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
        {/* Search Section */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Search Username:</label>
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Enter username"
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-xs"
            />
          </div>
        </div>

        {/* Summary Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="user-book">
              {/* Header Table */}
              <ul className="mtree transit bubba mtree-header list-none m-0 p-0">
                <li className="mtree-node">
                  <table className="w-full text-sm border-0 mb-0">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-right p-3 font-semibold text-gray-700">UserName</th>
                        {hasDrawColumn && (
                          <th className="text-right p-3 font-semibold text-gray-700">The Draw</th>
                        )}
                        <th className="text-right p-3 font-semibold text-gray-700">{team2Name}</th>
                        <th className="text-right p-3 font-semibold text-gray-700">{team1Name}</th>
                      </tr>
                    </thead>
                  </table>
                </li>
              </ul>

              {/* Data Rows */}
              <ul className="mtree transit bubba user-table list-none m-0 p-0">
                {filteredData.map((user, index) => (
                  <li key={index} className="mtree-node mtree-closed item">
                    <table className="w-full text-sm mb-0">
                      <tbody>
                        <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                          <td className="text-right p-3 font-medium text-gray-800">{user.username}</td>
                          {hasDrawColumn && (
                            <td className={`text-right p-3 font-semibold ${user.theDraw >= 0 ? 'positive text-green-600' : 'negative text-red-600'}`}>
                              {user.theDraw}
                            </td>
                          )}
                          <td className={`text-right p-3 font-semibold ${user.england >= 0 ? 'positive text-green-600' : 'negative text-red-600'}`}>
                            {user.england}
                          </td>
                          <td className={`text-right p-3 font-semibold ${user.australia >= 0 ? 'positive text-green-600' : 'negative text-red-600'}`}>
                            {user.australia}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </li>
                ))}
                
                {/* Totals Row */}
                <li className="mtree-node item">
                  <table className="w-full text-sm mb-0">
                    <tbody>
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                        <td className="text-right p-3 text-gray-800">Total</td>
                        {hasDrawColumn && (
                          <td className={`text-right p-3 ${totals.theDraw >= 0 ? 'positive text-green-600' : 'negative text-red-600'}`}>
                            {totals.theDraw}
                          </td>
                        )}
                        <td className={`text-right p-3 ${totals.england >= 0 ? 'positive text-green-600' : 'negative text-red-600'}`}>
                          {totals.england}
                        </td>
                        <td className={`text-right p-3 ${totals.australia >= 0 ? 'positive text-green-600' : 'negative text-red-600'}`}>
                            {totals.australia}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </li>
              </ul>
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
