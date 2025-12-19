import React, { useState, useMemo, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import TooltipPortal from "../../../components/TooltipPortal";

interface ViewMoreProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  eventId: string;
  onBetDetailClick?: (betId: string) => void;
}

const ViewMore: React.FC<ViewMoreProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<string>(() => {
    return data?.markets ? Object.keys(data.markets)[0] : "normal";
  });
  const [searchFilters, setSearchFilters] = useState({
    username: "",
    amountFrom: "",
    amountTo: "",
    ipAddress: "",
    betType: "all", // all, back, lay
  });
  const [openTooltipIndex, setOpenTooltipIndex] = useState<number | null>(null);
  const buttonRefs = useRef<{ [key: number]: React.RefObject<HTMLButtonElement | null> }>({});
 
  // Filter bets based on active tab and search filters
  const filteredBets = useMemo(() => {
    if (!data?.markets) return [];

    // Get bets from the selected market
    const marketBets = data.markets[activeMainTab] || [];
    let filtered = [...marketBets];

    // Filter by bet type
    if (searchFilters.betType !== "all") {
      if (searchFilters.betType === "back") {
        filtered = filtered.filter(
          (bet: any) => bet.betType?.toLowerCase() === "back"
        );
      } else if (searchFilters.betType === "lay") {
        filtered = filtered.filter(
          (bet: any) => bet.betType?.toLowerCase() === "lay"
        );
      }
    }

    // Filter by username
    if (searchFilters.username) {
      filtered = filtered.filter((bet: any) =>
        (bet.username || "")
          .toLowerCase()
          .includes(searchFilters.username.toLowerCase())
      );
    }

    // Filter by amount range
    if (searchFilters.amountFrom) {
      const fromAmount = parseFloat(searchFilters.amountFrom);
      filtered = filtered.filter(
        (bet: any) => parseFloat(bet.amount || 0) >= fromAmount
      );
    }
    if (searchFilters.amountTo) {
      const toAmount = parseFloat(searchFilters.amountTo);
      filtered = filtered.filter(
        (bet: any) => parseFloat(bet.amount || 0) <= toAmount
      );
    }

    // Filter by IP address
    if (searchFilters.ipAddress) {
      filtered = filtered.filter((bet: any) =>
        (bet.ip || "").includes(searchFilters.ipAddress)
      );
    }

    return filtered;
  }, [data, activeMainTab, searchFilters]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalBets = filteredBets.length;
    const totalAmount = filteredBets.reduce((sum: number, bet: any) => {
      return sum + parseFloat(bet.amount || 0);
    }, 0);
    return { totalBets, totalAmount };
  }, [filteredBets]);

  const handleReset = () => {
    setSearchFilters({
      username: "",
      amountFrom: "",
      amountTo: "",
      ipAddress: "",
      betType: "all",
    });
  };

  const handleSearch = () => {
    // Search is handled by useMemo, just trigger re-render
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-4">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col animate-fadein">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-[var(--bg-primary)] text-white rounded-full w-8 h-8 cursor-pointer flex items-center justify-center text-md z-10"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        {/* Header */}
        <h2 className="text-xl p-4 font-normal">View More</h2>

        {/* Main Tabs */}
        <div className="px-4">
          <div className="flex items-center gap-2">
            {data?.markets &&
              Object.keys(data.markets).map((marketName) => (
                <button
                  key={marketName}
                  onClick={() => setActiveMainTab(marketName)}
                  className={`text-xs font-medium p-1 px-2 cursor-pointer ${
                    activeMainTab === marketName
                      ? "border border-b-0 border-gray-400 bg-gray-50"
                      : ""
                  }`}
                >
                  {marketName.charAt(0).toUpperCase() + marketName.slice(1)}
                </button>
              ))}
          </div>

          {/* Search and Filter Section */}
          <div className="py-3">
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={searchFilters.username}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      username: e.target.value,
                    })
                  }
                  placeholder="Search Username"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount From
                </label>
                <input
                  type="text"
                  value={searchFilters.amountFrom}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      amountFrom: e.target.value,
                    })
                  }
                  placeholder="Amount From"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount To
                </label>
                <input
                  type="text"
                  value={searchFilters.amountTo}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      amountTo: e.target.value,
                    })
                  }
                  placeholder="Amount To"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  value={searchFilters.ipAddress}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      ipAddress: e.target.value,
                    })
                  }
                  placeholder="IP Address"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="betType"
                    value="all"
                    checked={searchFilters.betType === "all"}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        betType: e.target.value,
                      })
                    }
                    className="mr-1.5"
                  />
                  <span className="text-xs text-gray-700">All</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="betType"
                    value="back"
                    checked={searchFilters.betType === "back"}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        betType: e.target.value,
                      })
                    }
                    className="mr-1.5"
                  />
                  <span className="text-xs text-gray-700">Back</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="betType"
                    value="lay"
                    checked={searchFilters.betType === "lay"}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        betType: e.target.value,
                      })
                    }
                    className="mr-1.5"
                  />
                  <span className="text-xs text-gray-700">Lay</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                >
                  Search
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-1.5 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div className="px-4 py-2 bg-gray-50 border-y border-gray-200 flex flex-col items-end justify-center text-xs">
          <span className="font-medium">Total Soda: {totals.totalBets}</span>
          <span className="ml-4 font-medium">
            Total Amount: {totals.totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <table className="w-full text-xs ">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-2 font-medium text-gray-700 text-xs">
                  Username
                </th>
                <th className="text-left p-2 font-medium text-gray-700 text-xs">
                  Nation
                </th>
                <th className="text-left p-2 font-medium text-gray-700 text-xs">
                  Rate
                </th>
                <th className="text-left p-2 font-medium text-gray-700 text-xs">
                  Amount
                </th>
                <th className="text-left p-2 font-medium text-gray-700 text-xs">
                  Date
                </th>
                <th className="text-left p-2 font-medium text-gray-700 text-xs">
                  IP
                </th>
                <th className="text-center p-2 font-medium text-gray-700 text-xs">
                  B Details
                </th>
                <th className="text-center p-2 font-medium text-gray-700 text-xs">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBets.length > 0 ? (
                filteredBets.map((bet: any, index: number) => {
                  const betType = bet.betType;
                  const isBackType =
                    betType?.toLowerCase() === "back" ||
                    betType?.toLowerCase() === "yes" ||
                    betType?.toLowerCase() === "odd" ||
                    betType?.toLowerCase() === "even";
                  const bgColor = isBackType
                    ? "bg-[var(--bg-back)]/60"
                    : "bg-[var(--bg-lay)]/60";

                  // Create ref for this specific button if it doesn't exist
                  if (!buttonRefs.current[index]) {
                    buttonRefs.current[index] = React.createRef<HTMLButtonElement>();
                  }

                  return (
                    <React.Fragment key={bet.betId || index}>
                      {/* Second Row - Username, Nation, Rate, Amount, IP, Actions */}
                      <tr className={bgColor}>
                        <td className="px-2 border-l-2 border-blue-500">
                          {bet.username || "-"}
                        </td>
                        <td className="px-2">{bet.nation || "-"}</td>
                        <td className="px-2 text-center">{bet.rate || "-"}</td>
                        <td className="px-2">{bet.amount}</td>

                        <td className="px-2">{bet.date}</td>
                        <td className="px-2 text-xs">{bet.ip || "-"}</td>
                        <td className="px-2 text-center">
                          <div className="relative inline-block">
                            <button
                              ref={buttonRefs.current[index]}
                              onMouseEnter={() => setOpenTooltipIndex(index)}
                              onMouseLeave={() => setOpenTooltipIndex(null)}
                              className="px-2 text-green-800 text-xs font-medium hover:text-green-900"
                            >
                              Detail
                            </button>
                            <TooltipPortal 
                              targetRef={buttonRefs.current[index]} 
                              open={openTooltipIndex === index}
                            >
                              <div className="text-xs">{bet.userAgent || "N/A"}</div>
                            </TooltipPortal>
                          </div>
                        </td>
                        <td className="px-2 text-center flex items-center justify-center py-1">
                          <button className="w-4 h-4 bg-black text-white rounded text-xs font-medium hover:bg-gray-800">
                            {/* ⚫ */}
                          </button>
                        </td>
                      </tr>
                      {/* Spacer row for gap between entries */}
                      <tr>
                        <td colSpan={8} className="h-0.5"></td>
                      </tr>
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .animate-fadein { animation: fadein 0.2s; }
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default ViewMore;
