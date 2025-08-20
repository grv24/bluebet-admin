import React from 'react'

import { FaHome, FaInfoCircle } from "react-icons/fa";

const cardBack = (
    <div className="w-16 h-24 bg-blue-200 border-4 border-yellow-400 rounded-md flex-shrink-0" />
  );
  
  const history = ["B", "B", "A", "B", "A", "B", "B", "B", "A", "A"];
  
const VirtualMarket:React.FC = () => {
  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Game Area */}
        <div className="flex-1 bg-[#23272b] rounded-lg overflow-hidden relative flex flex-col min-w-0">
          {/* Top border */}
          <div className="h-2 bg-green-400 w-full absolute top-0 left-0" />
          {/* Header */}
          <div className="flex justify-between items-start p-4 pt-6">
            <div className="bg-black bg-opacity-80 px-4 py-2 rounded">
              <div className="text-lg font-bold text-yellow-300 tracking-wide">V-MUFLIS TEENPATTI</div>
              <div className="text-xs text-white mt-1">Round ID: 338250706044112</div>
            </div>
            <div className="flex gap-3 mt-1">
              <button className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-white text-white bg-black bg-opacity-40 hover:bg-opacity-60 transition">
                <FaHome size={18} />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-white text-white bg-black bg-opacity-40 hover:bg-opacity-60 transition">
                <FaInfoCircle size={18} />
              </button>
            </div>
          </div>
          {/* Cards */}
          <div className="flex justify-between items-start px-8 mt-2 mb-4">
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold text-red-400 mb-2">Player A</div>
              <div className="flex gap-2">{[cardBack, cardBack, cardBack]}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold text-green-400 mb-2">Player B</div>
              <div className="flex gap-2">{[cardBack, cardBack]}</div>
            </div>
          </div>
          {/* Betting Grid */}
          <div className="flex-1 flex flex-col justify-center items-center pb-8">
            <div className="flex flex-row w-full justify-center gap-16">
              {/* Player A */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-lg font-bold text-red-400 mb-2">Player A</div>
                {[1.98, 2, 1.98].map((odds, i) => (
                  <div key={i} className="w-32 h-14 border-2 border-blue-400 rounded flex flex-col items-center justify-center text-white text-lg font-bold relative">
                    {odds}
                    <span className="text-red-500 text-base font-bold absolute bottom-1 left-1/2 -translate-x-1/2">0</span>
                  </div>
                ))}
              </div>
              {/* Center labels */}
              <div className="flex flex-col justify-center gap-8 mt-8">
                {[
                  { label: "Winner", info: true },
                  { label: "TOP 9", info: true },
                  { label: "M Baccarat", info: true },
                ].map((row, i) => (
                  <div key={row.label} className="flex items-center gap-2 text-white text-lg font-medium">
                    {row.label}
                    <FaInfoCircle className="text-gray-300" size={16} />
                  </div>
                ))}
              </div>
              {/* Player B */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-lg font-bold text-green-400 mb-2">Player B</div>
                {[1.98, 2, 1.98].map((odds, i) => (
                  <div key={i} className="w-32 h-14 border-2 border-blue-400 rounded flex flex-col items-center justify-center text-white text-lg font-bold relative">
                    {odds}
                    <span className="text-red-500 text-base font-bold absolute bottom-1 left-1/2 -translate-x-1/2">0</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* History Row */}
          <div className="flex justify-center items-center gap-2 pb-4">
            {history.map((h, i) => (
              <span
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold border border-gray-400 ${
                  h === "A" ? "bg-red-500 text-white" : "bg-yellow-400 text-black"
                }`}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
        {/* Sidebar */}
        <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-4">
          {/* My Bets */}
          <div className="bg-[#6c7686] rounded-t-lg px-4 py-2 flex items-center justify-between">
            <span className="text-white text-lg font-medium">MY BETS</span>
            <button className="bg-[#2c3e50] text-white px-4 py-1 rounded font-medium text-base hover:opacity-90 transition">VIEW MORE</button>
          </div>
          <div className="bg-white rounded-b-lg shadow -mt-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-[#444]">
                  <th className="py-2 px-2 font-semibold">UserName</th>
                  <th className="py-2 px-2 font-semibold">Rate</th>
                  <th className="py-2 px-2 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={3} className="text-center py-4 text-gray-500">No records found</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Rules */}
          <div className="bg-[#6c7686] rounded-t-lg px-4 py-2 mt-4">
            <span className="text-white text-lg font-medium">RULES</span>
          </div>
          <div className="bg-white rounded-b-lg shadow -mt-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-[#444]">
                  <th className="py-2 px-2 font-semibold">&nbsp;</th>
                  <th className="py-2 px-2 font-semibold">Top 9</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { card: "Card 9", odds: "1 TO 3" },
                  { card: "Card 8", odds: "1 TO 4" },
                  { card: "Card 7", odds: "1 TO 5" },
                  { card: "Card 6", odds: "1 TO 8" },
                  { card: "Card 5", odds: "1 TO 30" },
                ].map((row) => (
                  <tr key={row.card}>
                    <td className="py-2 px-2">{row.card}</td>
                    <td className="py-2 px-2">{row.odds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VirtualMarket