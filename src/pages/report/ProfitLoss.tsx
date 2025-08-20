import React, { useState } from "react";

const filterOptions = ["All", "Option 1", "Option 2"];

const ProfitLoss = () => {
  const [filter, setFilter] = useState(filterOptions[0]);
  const [search, setSearch] = useState("");

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Profit Loss</h2>
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full items-end">
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full sm:w-[220px]"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          {filterOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="px-6 leading-9 w-full sm:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition">
          Load
        </button>
        <div className="ml-auto flex gap-2 items-center w-full sm:w-auto">
          <span className="text-sm">Search:</span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-2 py-1 rounded border border-gray-300 min-w-[120px] text-sm leading-6 w-full sm:w-auto"
          />
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-[#f5f5f5] text-left">
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">No</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">User Name</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Level</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Casino Pts</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Sport Pts</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Third Party Pts</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="text-center py-6 text-gray-500 border border-[#e0e0e0] bg-[#f0f4f8]">
                No data available in table
              </td>
            </tr>
            {/* Blank summary row */}
            <tr>
              <td className="border border-[#e0e0e0] h-10"></td>
              <td className="border border-[#e0e0e0]"></td>
              <td className="border border-[#e0e0e0]"></td>
              <td className="border border-[#e0e0e0]"></td>
              <td className="border border-[#e0e0e0]"></td>
              <td className="border border-[#e0e0e0]"></td>
              <td className="border border-[#e0e0e0]"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;