import React, { useMemo, useState, useEffect } from "react";
import FlipClockCountdown from "@leenguyen/react-flip-clock-countdown";
import "@leenguyen/react-flip-clock-countdown/dist/index.css";

interface TimerProps {
  time: number;
  isComplete?: boolean;
  isRunning?: boolean;
}

const Timer: React.FC<TimerProps> = ({
  time,
  isComplete = false,
  isRunning = true,
}) => {
  // Convert timestamp to Date object for FlipClockCountdown with memoization
  const targetDate = useMemo(() => {
    const date = new Date(time);
    return isNaN(date.getTime()) ? null : date;
  }, [time]);

  // Calculate remaining time in seconds
  const remainingSeconds = useMemo(() => {
    if (!targetDate) return 0;
    const now = Date.now();
    return Math.max(0, Math.floor((targetDate.getTime() - now) / 1000));
  }, [targetDate]);

  // Show loading state if time is invalid
  if (!targetDate) {
    return null;
  }

  // Common styles for both desktop and mobile
  const commonStyles = {
    backgroundColor: "var(--bg-secondary)",
    color: "white",
    // border: "1px solid var(--bg-primary)",
    borderRadius: "4px",
    fontWeight: "bold" as const,
  };

  return (
    <React.Fragment>
      {/* Desktop Timer */}
      <div className="md:block hidden">
        <FlipClockCountdown
          to={targetDate}
          labels={["", "", "", ""]}
          showLabels={false}
          digitBlockStyle={{
            height: "40px",
            fontSize: "36px",
            width: "30px",
            ...commonStyles,
          }}
          showSeparators={false}
          renderMap={[false, false, false, true]}
          hideOnComplete={false}
          onComplete={() => {
            console.debug("Timer completed");
          }}
        />
      </div>

      {/* Mobile Timer */}
      <div className="md:hidden block">
        <FlipClockCountdown
          to={targetDate}
          labels={["", "", "", ""]}
          showLabels={false}
          digitBlockStyle={{
            height: "30px",
            fontSize: "26px",
            width: "20px",
            ...commonStyles,
          }}
          showSeparators={false}
          renderMap={[false, false, false, true]}
          hideOnComplete={false}
          onComplete={() => {
            console.debug("Timer completed");
          }}
        />
      </div>
    </React.Fragment>
  );
};

export default Timer;
