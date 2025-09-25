import React from "react";
import { useParams, useLocation } from "react-router-dom";
import useLiveMatchOdds from "@/hooks/useLiveMatchOdds";

const SportDetail: React.FC = () => {
  const { sportId:sportName, eventId } = useParams();

  const { competition, date, match, market, sportId } = useLocation().state;
  const {
    data: matchOdds,
    isLoading,
    error,
  } = useLiveMatchOdds({
    sportId: sportId || "",
    eventId: eventId || "",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading match odds...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          Error loading match odds: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Sport Details - Sport: {sportName}, Event ID: {eventId}
      </h1>

      {matchOdds?.data ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Live Match Odds</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(matchOdds.data, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="text-gray-500">No match odds data available</div>
      )}
    </div>
  );
};

export default SportDetail;
