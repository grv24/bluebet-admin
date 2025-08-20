import React, { useState } from "react";

const typeOptions = ["All", "Type 1", "Type 2"];
const gameOptions = ["All", "Game 1", "Game 2"];

const GameReport = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState(typeOptions[0]);
  const [game, setGame] = useState(gameOptions[0]);

  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Game Report</h2>
      {/* Filter Row 1 */}
      <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 mb-2 w-full items-end">
        <div className="flex flex-col w-full md:w-auto">
          <label className="text-sm font-medium mb-1">From</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full min-w-[140px]"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col w-full md:w-auto">
          <label className="text-sm font-medium mb-1">To</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full min-w-[140px]"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>
        <div className="flex flex-col w-full md:w-auto">
          <label className="text-sm font-medium mb-1">Type</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full min-w-[120px]"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button className="px-6 leading-9 w-full md:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition mt-2 md:mt-0">
          Game List
        </button>
      </div>
      {/* Filter Row 2 */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full items-end">
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:border-gray-300 focus:ring-0 outline-none transition w-full sm:w-[400px]"
          value={game}
          onChange={e => setGame(e.target.value)}
        >
          {gameOptions.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <div className="flex flex-row gap-2 w-full sm:w-auto">
          <button className="px-6 leading-9 w-full sm:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition">
            Show Game Report
          </button>
          <button className="px-6 leading-9 w-full sm:w-auto cursor-pointer rounded font-medium text-white text-sm bg-[var(--bg-primary)] hover:opacity-90 transition">
            Master Game Report
          </button>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[600px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-[#f5f5f5] text-left">
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Sr.No</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Name</th>
              <th className="py-2 px-2 font-semibold border border-[#e0e0e0]">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="text-center py-6 text-gray-500 border border-[#e0e0e0] bg-[#f0f4f8]">
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameReport;