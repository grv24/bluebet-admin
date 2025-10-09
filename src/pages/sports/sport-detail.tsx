import React from "react";
import { useParams, useLocation } from "react-router-dom";
import useLiveMatchOdds from "@/hooks/useLiveMatchOdds";
import Cricket from "./cricket";
import Football from "./football";
import Tennis from "./tennis";

/**
 * SportDetail Component
 * 
 * This component serves as a router for different sport-specific detail pages.
 * It fetches live match odds data and renders the appropriate sport component
 * based on the sport type from the URL parameters.
 * 
 * URL Structure: /sport-details/{sportName}/{eventId}
 * 
 * Props from navigation state:
 * - competition: Competition name (e.g., "Asia Cup")
 * - date: Match date (e.g., "2025-09-25")
 * - match: Match name (e.g., "Pakistan v Bangladesh")
 * - market: Market name (e.g., "MATCH_ODDS")
 * - sportId: Sport ID from API (e.g., "2" for Tennis)
 */
const SportDetail: React.FC = () => {
  // Extract sport name and event ID from URL parameters
  const { sportId: sportName, eventId } = useParams();
  
  // Get navigation state data passed from Header component
  const { competition, date, match, market, sportId } = useLocation().state || {};

  // Fetch live match odds data using React Query
  const {
    data: matchOdds,
    isLoading,
    error,
  } = useLiveMatchOdds({
    sportId: sportId || "",
    eventId: eventId || "",
  });

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading match odds...</div>
      </div>
    );
  }

  // Show error state if API call fails
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          Error loading match odds: {error.message}
        </div>
      </div>
    );
  }

  // Validate required data before rendering
  if (!matchOdds || !sportName || !eventId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          Missing required data. Please navigate from the sports menu.
        </div>
      </div>
    );
  }

  // Render sport-specific components based on sport type
  const renderSportComponent = () => {
    switch (sportName.toLowerCase()) {
      case "football":
        return (
          <Football
            matchOdds={matchOdds}
            competition={competition}
            date={date}
            match={match}
            market={market}
            eventId={eventId}
            sportId={sportId}
          />
        );
      
      case "tennis":
        return (
          <Tennis
            matchOdds={matchOdds}
            competition={competition}
            date={date}
            match={match}
            market={market}
            eventId={eventId}
            sportId={sportId}
          />
        );
      
      case "cricket":
        return (
          <Cricket
            matchOdds={matchOdds}
            competition={competition}
            date={date}
            match={match}
            market={market}
            eventId={eventId}
            sportId={sportId}
          />
        );
      
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg text-red-500">
              Unsupported sport: {sportName}. Please select a valid sport.
            </div>
          </div>
        );
    }
  };

  return renderSportComponent();
};

export default SportDetail;
