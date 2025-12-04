import React from "react";
import Bet from "./Bet";
import Rules from "./Rules";

const Casino: React.FC = () => {
  return (
    <div className="p-2 bg-[#fafafa] min-h-screen">
      <div className="grid grid-cols-8 gap-3">
        {/* Left Side */}
        <div className="col-span-5 min-h-40">
          {/* top bar */}
          <div className="bg-[var(--bg-secondary)]  py-1 px-3 rounded-t  flex items-center justify-between">
            <h2 className="text-xs tracking-tighter leading-6 uppercase text-white">
              Casino
            </h2>
            <h2 className="text-xs tracking-tighter leading-6 text-white">
              Round ID: <span className="text-white">103251204134720</span>
            </h2>
          </div>

          <div></div>
        </div>
        {/* Right Side */}
        <div className="col-span-3  min-h-40">
          <div className="flex flex-col gap-2">
            <Bet />
            <Rules />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Casino;
