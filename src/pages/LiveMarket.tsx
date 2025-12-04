import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import useCasinoGamesByType from "@/hooks/useCasinoGamesByType";
import Loader from "@/components/common/Loader";
import { CasinoGame } from "@/helper/casino";

const LiveMarket: React.FC = () => {
  const { game } = useParams<{ game: string }>();
  const navigate = useNavigate();
  
  // Convert URL parameter to game type (handle "other" case)
  const gameType = game === "other" ? null : game || null;
  
  const {
    data: casinoGamesData,
    isLoading,
    error,
  } = useCasinoGamesByType(gameType);

  // Handle game click
  const handleGameClick = (gameCode: string) => {
    // Navigate to game detail page or handle game selection
    // You can customize this based on your requirements
    console.log("Game clicked:", gameCode);
    navigate(`/casino-game-detail/${gameCode}`);
    // Example: navigate(`/game/${gameCode}`);
  };

  // Helper function to format game type name for display
  const formatGameTypeName = (gameType: string | null): string => {
    if (!gameType) return "Other";
    return gameType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Show loading state
  if (isLoading) {
    return <Loader />;
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 bg-[#fafafa] min-h-screen">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-red-500">
            ❌ Error loading casino games
          </div>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  // Get games data
  const games: CasinoGame[] = casinoGamesData?.data || [];
  const activeGames = games.filter((game) => game.isActive);

  return (
    <div className="p-1 bg-[#fafafa] min-h-screen">
      {/* <div className="mb-4">
        <h2 className="m-0 text-lg font-normal mb-2">
          Live Market - {formatGameTypeName(gameType)}
        </h2>
        <p className="text-sm text-gray-600">
          {activeGames.length} {activeGames.length === 1 ? "game" : "games"} available
        </p>
      </div> */}

      {activeGames.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-gray-500">No active games found</div>
        </div>
      ) : (
        <div className="grid grid-cols-6 xl:grid-cols-8 gap-1">
          {activeGames.map((game) => (
            <div
              key={game.id}
              className="bg-white overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
            >
              <div onClick={() => handleGameClick(game.casinoGameCode)} className=" bg-gray-100 flex items-center justify-center">
                {game.casinoGameIcon ? (
                  <img
                    src={game.casinoGameIcon}
                    alt={game.casinoGameName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-sm">No Image</div>
                )}
              </div>
             
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveMarket;