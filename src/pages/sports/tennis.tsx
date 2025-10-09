import React from "react";

interface TennisProps {
  matchOdds: any;
  competition: any;
  date: any;
  match: any;
  market: any;
  eventId: any;
  sportId: any;
}

const marketData = [
  "1st Set Winner Home/Away",
  "MATCH_ODDS",
  "Game Winner 5/9",
  "Game Winner 5/8",
  "Game Winner 5/7",
  "Game Winner 5/6",
  "Game Winner 5/5",
  "Game Winner 5/4",
  "Game Winner 5/3",
  "Game Winner 5/2",
  "Game Winner 5/12",
  "Game Winner 5/11",
  "Game Winner 5/10",
  "Game Winner 5/1",
  "Game Winner 4/9",
  "Game Winner 4/7",
  "Game Winner 4/6",
  "Game Winner 4/5",
  "Game Winner 4/4",
  "Game Winner 4/3",
  "Game Winner 4/2",
  "Game Winner 4/12",
  "Game Winner 4/11",
  "Game Winner 4/10",
  "Game Winner 4/1",
  "Game Winner 3/9",
  "Game Winner 3/8",
  "Game Winner 3/7",
  "Game Winner 3/6",
  "Game Winner 3/5",
  "Game Winner 3/4",
  "Game Winner 3/3",
  "Game Winner 3/2",
  "Game Winner 3/12",
  "Game Winner 3/11",
  "Game Winner 3/10",
  "Game Winner 3/1",
  "Game Winner 2/9",
  "Game Winner 2/8",
  "Game Winner 2/7",
  "Game Winner 2/6",
  "Game Winner 2/5",
  "Game Winner 2/4",
  "Game Winner 2/3",
  "Game Winner 2/2",
  "Game Winner 2/12",
  "Game Winner 2/11",
  "Game Winner 2/10",
  "Game Winner 2/1",
  "Game Winner 1/9",
  "Game Winner 1/8",
  "Game Winner 1/7",
  "Game Winner 1/6",
  "Game Winner 1/5",
  "Game Winner 1/4",
  "Game Winner 1/3",
  "Game Winner 1/2",
  "Game Winner 1/12",
  "Game Winner 1/11",
  "Game Winner 1/10",
  "2nd Set Winner Home/Away",
];

const Tennis: React.FC<TennisProps> = ({
  matchOdds,
  competition,
  date,
  match,
  market,
  eventId,
  sportId,
}) => {
  const [selectedMarket, setSelectedMarket] = React.useState<string | null>(
    market
  );
  const [selectedMarketData, setSelectedMarketData] = React.useState<any>(null);
  const [scoreboardLoading, setScoreboardLoading] = React.useState(true);
  const [scoreboardError, setScoreboardError] = React.useState(false);
  const [scoreboardErrorMessage, setScoreboardErrorMessage] = React.useState("");


  // Extract market names from API data
  const apiMarkets =
    matchOdds?.data?.data?.map((item: any) => item.mname) || [];

  // Combine static markets with API markets, removing duplicates
  const allMarkets = [...new Set([...marketData, ...apiMarkets])];

  const handleMarketClick = (marketName: string) => {
    setSelectedMarket(marketName);

    // Find the market data from API
    const marketData = matchOdds?.data?.data?.find(
      (item: any) => item.mname === marketName
    );
    setSelectedMarketData(marketData);
  };

  // Initialize selected market data when component mounts
  React.useEffect(() => {
    if (market && matchOdds?.data?.data) {
      const initialMarketData = matchOdds.data.data.find(
        (item: any) => item.mname === market
      );
      setSelectedMarketData(initialMarketData);
    }
  }, [market, matchOdds]);

  console.log(selectedMarketData, "selectedMarketData");
  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Market Buttons */}
      <div className="flex flex-wrap gap-1">
        {allMarkets.map((item, index) => {
          const isActive = selectedMarket === item;
          return (
            <div
              key={index}
              onClick={() => handleMarketClick(item)}
              className={`
                cursor-pointer p-1 text-white transition-colors duration-200
                ${isActive ? "bg-[#2c3e50]" : "bg-[#0088cc] hover:bg-[#2c3e50]"}
              `}
            >
              <h3 className="text-sm tracking-tighter px-1.5 leading-normal font-medium text-center">
                {item}
              </h3>
            </div>
          );
        })}
      </div>

      {/* buttom */}
      <div className="w-full flex flex-row gap-2">
        <div className="flex flex-col w-full">
          <div className="w-full flex flex-row gap-1 items-center bg-[#2c3e50] p-1 justify-between px-2">
            <div className="flex flex-row gap-1 text-white text-sm items-center">
              <h2 className="text-sm text-white tracking-tighter leading-6">
                {competition}
              </h2>
              {">"}
              <h2 className="text-sm text-white tracking-tighter leading-normal font-medium">
                {match}
              </h2>
            </div>
            <h2 className="text-sm text-white tracking-tighter leading-normal font-medium">
              {date}
            </h2>
          </div>
          <div className="w-full bg-black/90 lg:h-[28vh] h-[39vh] relative">
              <iframe
                src={` https://e765432.diamondcricketid.com/anm.php?type=scorecard&eventid=${eventId}&sportid=${sportId}`}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                title="Live Scoreboard"
                onError={(e) => {
                  console.error("Sports scoreboard iframe error:", e);
                  setScoreboardLoading(false);
                  setScoreboardError(true);
                  setScoreboardErrorMessage(
                    "Failed to load sports scoreboard. Please check your connection."
                  );
                }}
                onLoad={() => {
                  console.log("Sports scoreboard loaded successfully");
                  setScoreboardLoading(false);
                  setScoreboardError(false);
                  setScoreboardErrorMessage("");
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                loading="lazy"
                referrer-policy="allow"
              />
           
            </div>
        </div>
        <div className="w-5/12"></div>
      </div>
    </div>
  );
};

export default Tennis;
