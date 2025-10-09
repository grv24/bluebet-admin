import React from 'react'

interface FootballProps {
  matchOdds: any;
  competition: any;
  date: any;
  match: any;
  market: any;
  eventId: any;
  sportId: any;
}

const Football: React.FC<FootballProps> = ({ matchOdds, competition, date, match, market, eventId, sportId }) => {
  return (
    <div>
        <h1>Football</h1>
 
        <p>Competition: {competition}</p>
        <p>Date: {date}</p>
        <p>Match: {match}</p>
        <p>Market: {market}</p>
        <div className="flex flex-col gap-2">
        Match: <div className="w-full">{matchOdds.data.data.map((item: any) => (
            <div key={item.mname}>
              {item.mname}
            </div>
        ))}
        </div>
      </div>
    </div>
  )
}

export default Football