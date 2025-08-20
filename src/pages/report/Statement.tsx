import React, { useState, useRef } from "react";

const accountTypes = ["All", "User", "Admin"];
const gameNames = ["All", "Game 1", "Game 2"];
const pageSizeOptions = [25, 50, 100];

const Statement = () => {
  const [accountType, setAccountType] = useState("All");
  const [gameName, setGameName] = useState("All");
  const [clientName, setClientName] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // Table columns
  const columns = [
    "Date",
    "Credit",
    "Debit",
    "Closing",
    "Description",
    "Fromto",
  ];

  // No client options for now
  const clientOptions: string[] = [];

  // Pagination (empty for now)
  const totalPages = 1;

  // Handle click outside for dropdown
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        clientInputRef.current &&
        !clientInputRef.current.contains(e.target as Node)
      ) {
        setClientDropdownOpen(false);
      }
    }
    if (clientDropdownOpen) {
      document.addEventListener("mousedown", handleClick);
    } else {
      document.removeEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clientDropdownOpen]);

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Account Statement</h2>
      {/* Filters */}
      <div className="flex flex-wrap md:grid md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-2 w-full">
        <div className="flex flex-col min-w-[140px] w-full">
          <label className="text-sm font-medium mb-1">Account Type</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
          >
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col min-w-[140px] w-full">
          <label className="text-sm font-medium mb-1">Game Name</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
          >
            {gameNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        {/* Improved Search By Client Name */}
        <div className="flex flex-col min-w-[160px] w-full relative">
          <label className="text-sm font-medium mb-1">Search By Client Name</label>
          <div className="relative">
            <input
              ref={clientInputRef}
              className={`border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 w-full focus:border-gray-300 focus:ring-0 outline-none transition placeholder:text-[#42526e]`}
              placeholder="Select option"
              value={clientName}
              onFocus={() => setClientDropdownOpen(true)}
              onChange={(e) => setClientName(e.target.value)}
              autoComplete="off"
            />
            {clientDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-b shadow z-10 text-sm">
                {clientOptions.length === 0 ? (
                  <div className="px-4 py-2 text-[#42526e] font-medium">
                    List is empty.
                  </div>
                ) : (
                  clientOptions.map((option) => (
                    <div
                      key={option}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setClientName(option);
                        setClientDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col min-w-[120px] w-full">
          <label className="text-sm font-medium mb-1">From</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col min-w-[120px] w-full">
          <label className="text-sm font-medium mb-1">To</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="flex items-end w-full md:w-auto">
          <button className="px-6 leading-9 w-full md:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition">
            Load
          </button>
        </div>
      </div>
      {/* Show entries and search */}
      <div className="flex flex-wrap items-center gap-2 mb-3 w-full">
        <span className="text-xs">Show</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="px-2 py-1 rounded border border-gray-300 text-xs"
        >
          {pageSizeOptions.map((opt) => (
            <option className="text-xs text-gray-500" key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span className="text-xs">entries</span>
        <div className="ml-auto flex gap-2 items-center w-full sm:w-auto">
          <span className="text-sm">Search:</span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2 py-1 rounded border border-gray-300 min-w-[120px] text-sm leading-6 w-full sm:w-auto"
          />
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow mb-4">
        <table className="w-full min-w-[700px] sm:min-w-[900px] border-separate border-spacing-0 text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#f5f5f5] text-left">
              {columns.map((col, idx) => (
                <th
                  key={col}
                  className="py-2 px-2 font-semibold border border-[#e0e0e0]"
                >
                  {col}
                  {col === "Closing" && (
                    <span className="ml-1 align-middle">▲</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-6 text-gray-500 border border-[#e0e0e0]"
              >
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex flex-wrap justify-end items-center gap-2 w-full">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-gray-200 rounded px-3 py-1 disabled:opacity-60"
        >
          &lt;
        </button>
        <span className="min-w-[32px] text-center font-medium text-base">
          {page}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="bg-gray-200 rounded px-3 py-1 disabled:opacity-60"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Statement;
