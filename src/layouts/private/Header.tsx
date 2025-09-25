import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { baseUrl, getDecodedTokenData, logout } from "@/helper/auth";
import useCricketTree from "@/hooks/useCricketTree";
import { CricketCompetition, CricketDate, CricketMatch, CricketMarket } from "@/types/cricket.ts";


const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
  const [isSportsOpen, setIsSportsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(["sport-cricket"]));
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies([
    baseUrl.includes("techadmin") ? "TechAdmin" : "Admin",
    "hasPopupBeenShown",
  ]);  
  const userData = getDecodedTokenData(cookies);
  const { data: cricketData, isLoading: cricketLoading, error: cricketError } = useCricketTree();
  const handleLogout = () => {
    logout(
      (name: string, options?: any) =>
        removeCookie(
          name as "Admin" | "TechAdmin" | "hasPopupBeenShown",
          options
        ),
      navigate
    );
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderSportsList = () => {
    // Get all dynamic sports from API data
    const allDynamicSports = cricketData?.data?.children || [];


    const renderCompetition = (competition: CricketCompetition, index: number, sportName: string) => {
      const competitionId = `comp-${competition.name}`;
      const isExpanded = expandedItems.has(competitionId);
      
      return (
        <div key={competitionId} className="relative">
          {/* Blue dot */}
          <div className="absolute left-0 top-2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1"></div>
          <div 
            className="flex items-center cursor-pointer py-1 hover:bg-gray-100 ml-4"
            onClick={() => toggleExpanded(competitionId)}
          >
            <i className={`fa-solid fa-${isExpanded ? 'minus' : 'plus'} text-xs mr-2 text-gray-600`}></i>
            <span className="text-xs text-gray-800">{competition.name}</span>
          </div>
          {isExpanded && (
            <div className="ml-4 relative">
              {/* Vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-blue-200"></div>
              <div className="space-y-1">
                {competition.children.map((date, dateIndex) => renderDate(date, dateIndex, competition.children.length, sportName, competition.name))}
              </div>
            </div>
          )}
        </div>
      );
    };

    const renderDate = (date: CricketDate, index: number, totalDates: number, sportName: string, competitionName: string) => {
      const dateId = `date-${date.name}`;
      const isExpanded = expandedItems.has(dateId);
      
      return (
        <div key={dateId} className="relative">
          {/* Blue dot */}
          <div className="absolute left-0 top-2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1"></div>
          <div 
            className="flex items-center cursor-pointer py-1 hover:bg-gray-100 ml-4"
            onClick={() => toggleExpanded(dateId)}
          >
            <i className={`fa-solid fa-${isExpanded ? 'minus' : 'plus'} text-xs mr-2 text-gray-600`}></i>
            <span className="text-xs text-gray-800">{date.name}</span>
          </div>
          {isExpanded && (
            <div className="ml-4 relative">
              {/* Vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-blue-200"></div>
              <div className="space-y-1">
                {date.children.map((match, matchIndex) => renderMatch(match, matchIndex, date.children.length, sportName, competitionName, date.name))}
              </div>
            </div>
          )}
        </div>
      );
    };

    const renderMatch = (match: CricketMatch, index: number, totalMatches: number, sportName: string, competitionName: string, dateName: string) => {
      const matchId = `match-${match.gmid}`;
      const isExpanded = expandedItems.has(matchId);
      
      return (
        <div key={matchId} className="relative">
          {/* Blue dot */}
          <div className="absolute left-0 top-2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1"></div>
          <div 
            className="flex items-center cursor-pointer py-1 hover:bg-gray-100 ml-4"
            onClick={() => toggleExpanded(matchId)}
          >
            <i className={`fa-solid fa-${isExpanded ? 'minus' : 'plus'} text-xs mr-2 text-gray-600`}></i>
            <span className="text-xs text-gray-800">{match.name}</span>
          </div>
          {isExpanded && (
            <div className="ml-4 relative">
              {/* Vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-blue-200"></div>
              <div className="space-y-1">
                {match.children.map((market, marketIndex) => renderMarket(market, marketIndex, match.children.length, match.gmid, sportName, competitionName, dateName, match.name))}
              </div>
            </div>
          )}
        </div>
      );
    };

    const renderMarket = (market: CricketMarket, index: number, totalMarkets: number, gmid: number, sportName: string, competitionName: string, dateName: string, matchName: string) => {
      return (
        <div key={`market-${market.name}`} className="relative">
          {/* Blue dot */}
          <div className="absolute left-0 top-2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1"></div>
          <div className="flex items-center py-1 hover:bg-gray-100 ml-4">
            <span onClick={() => { 
              navigate(`/sport-details/${sportName.toLowerCase()}/${market.gmid}`, {
                state: {
                  competition: competitionName,
                  date: dateName,
                  match: matchName,
                  market: market.name,
                  sportId:market.etid
                }
              }); 
              setIsSportsOpen(false); 
            }} className="text-xs uppercase text-gray-800 cursor-pointer">{market.name}</span>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-1">
        {/* All Dynamic Sports from API */}
        {allDynamicSports.map((sport) => {
          const sportName = sport.name === "Soccer" ? "Football" : sport.name;
          const sportId = `sport-${sport.name.toLowerCase()}`;
          const isExpanded = expandedItems.has(sportId);
          
          return (
            <div key={sport.name} className="relative">
              <div 
                className="flex items-center cursor-pointer py-1 hover:bg-gray-100"
                onClick={() => toggleExpanded(sportId)}
              >
                <i className={`fa-solid fa-${isExpanded ? 'minus' : 'plus'} text-xs mr-2 text-gray-600`}></i>
                <span className="text-xs text-gray-800">{sportName}</span>
              </div>
              {isExpanded && sport.children && sport.children.length > 0 && (
                <div className="ml-4 relative">
                  {/* Vertical line */}
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-blue-200"></div>
                  <div className="space-y-1">
                    {sport.children.map((competition, index) => renderCompetition(competition, index, sportName))}
                  </div>
                </div>
              )}
              {isExpanded && (!sport.children || sport.children.length === 0) && (
                <div className="ml-4 text-xs text-gray-500">No competitions available</div>
              )}
            </div>
          );
        })}

        {/* Loading/Error states for Cricket */}
        {cricketLoading && (
          <div className="ml-4 text-xs text-gray-500">Loading cricket data...</div>
        )}
        {cricketError && (
          <div className="ml-4 text-xs text-red-500">Error loading cricket data</div>
        )}
      </div>
    );
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navLinks = [
    { label: "List of Clients", href: "/clients" },
    { label: "Market Analysis", href: "/market-analysis" },
    {
      label: "Live Market",
      href: "#",
      items: [
        {
          name: "Unique Teenpatti",
          id: 1,
          href: "/live-market/unique-teenpatti",
        },
        { name: "Roulette", id: 2, href: "/live-market/roulette" },
        { name: "Ball by Ball", id: 3, href: "/live-market/ball-by-ball" },
        { name: "Lucky15", id: 4, href: "/live-market/lucky15" },
        { name: "Goal", id: 5, href: "/live-market/goal" },
        { name: "Binary", id: 6, href: "/live-market/binary" },
        { name: "Race 20-20", id: 7, href: "/live-market/race-20-20" },
        { name: "Queen", id: 8, href: "/live-market/queen" },
        { name: "Baccarat", id: 9, href: "/live-market/baccarat" },
        { name: "Sport Casino", id: 10, href: "/live-market/sport-casino" },
        { name: "Casino War", id: 11, href: "/live-market/casino-war" },
        { name: "Worli", id: 12, href: "/live-market/worli" },
        {
          name: "3 Card Judgement",
          id: 13,
          href: "/live-market/3-card-judgement",
        },
        { name: "32 Card Casino", id: 14, href: "/live-market/32-card-casino" },
        { name: "Live Teenpatti", id: 15, href: "/live-market/live-teenpatti" },
        { name: "Teenpatti 2.0", id: 16, href: "/live-market/teenpatti-2-0" },
        { name: "Live Poker", id: 17, href: "/live-market/live-poker" },
        { name: "Andar Bahar", id: 18, href: "/live-market/andar-bahar" },
        { name: "Lucky 7", id: 19, href: "/live-market/lucky-7" },
        { name: "Dragon Tiger", id: 20, href: "/live-market/dragon-tiger" },
        {
          name: "Bollywood Casino",
          id: 21,
          href: "/live-market/bollywood-casino",
        },
      ],
    },
    {
      label: "Live Virtual Market",
      href: "#",
      items: [
        { name: "20-20 DTL", id: 1, href: "/live-virtual-market/20-20-dtl" },
        {
          name: "Amar Akbar Anthony",
          id: 2,
          href: "/live-virtual-market/amar-akbar-anthony",
        },
        {
          name: "Muflis Teenpatti",
          id: 3,
          href: "/live-virtual-market/muflis-teenpatti",
        },
        {
          name: "1 Day Teenpatti",
          id: 4,
          href: "/live-virtual-market/1-day-teenpatti",
        },
        {
          name: "1 Day Dragon Tiger",
          id: 5,
          href: "/live-virtual-market/1-day-dragon-tiger",
        },
        { name: "Lucky 7", id: 6, href: "/live-virtual-market/lucky-7" },
        {
          name: "Bollywood Casino",
          id: 7,
          href: "/live-virtual-market/bollywood-casino",
        },
        {
          name: "20-20 Teenpatti",
          id: 8,
          href: "/live-virtual-market/20-20-teenpatti",
        },
        { name: "Trio", id: 9, href: "/live-virtual-market/trio" },
      ],
    },
    {
      label: "Reports",
      href: "#",
      items: [
        {
          name: "Account Statement",
          id: 1,
          href: "/reports/account-statement",
        },
        { name: "Current Bets", id: 2, href: "/reports/current-bets" },
        { name: "General Report", id: 3, href: "/reports/general-report" },
        { name: "Game Report", id: 4, href: "/reports/game-report" },
        { name: "Casino Report", id: 5, href: "/reports/casino-report" },
        { name: "Profit And Loss", id: 6, href: "/reports/profit-and-loss" },
        {
          name: "Casino Result Report",
          id: 7,
          href: "/reports/casino-result-report",
        },
      ],
    },
    { label: "Multi Login", href: "/multi-login" },
  ];

  return (
    <header>
      {/* Top nav bar */}
      <section className="flex items-center justify-between bg-[var(--bg-primary)] text-[var(--text-primary)] px-2 h-[50px] min-w-fit w-screen">
        {/* Logo and Hamburger */}
        <div className="flex items-center gap-2">
          <div
            onClick={() => navigate("/")}
            className="h-10 w-20 cursor-pointer"
          >
            <img
              src="https://allpanealexch.com/assets/hosts/allpanealexch.com/logo.png?v=1.4"
              className="h-full w-full object-contain"
              alt=""
              loading="lazy"
            />
          </div>
          {/* Hamburger for mobile menu */}
          {/* <button
            className="text-white block md:hidden cursor-pointer text-lg focus:outline-none ml-1"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open main menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button> */}
          {/* Football icon for sports menu (always visible) */}
          <button
            className="text-white cursor-pointer text-lg focus:outline-none ml-1"
            onClick={() => setIsSportsOpen(true)}
            aria-label="Open sports menu"
          >
            <i className="fa-solid fa-football"></i>
          </button>
        </div>
        {/* Nav links (desktop only) */}
        <nav className="flex-1 items-center gap-6 ml-6 relative flex">
          {navLinks.map((item, idx) => (
            <div
              key={item.label}
              className="relative h-full"
              onMouseEnter={() => item.items && setIsDropdownOpen(item.label)}
              onMouseLeave={() => item.items && setIsDropdownOpen(null)}
            >
              <Link
                className="font-normal whitespace-nowrap tracking-wide text-sm hover:bg-[var(--bg-secondary)]  flex items-center gap-1 h-full px-2 py-2"
                to={item.href}
              >
                {item.label}
                {item.items && (
                  <i className="fa-solid fa-caret-down text-xs ml-1"></i>
                )}
              </Link>
              {/* Dropdown */}
              {item.items && isDropdownOpen === item.label && (
                <div
                  className="absolute left-0 top-full min-w-[220px] bg-[var(--bg-primary)] text-white py-2 px-0 shadow-lg z-50"
                  style={{ marginTop: "2px" }}
                >
                  <ul className="flex flex-col">
                    {item.items.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          to={sub.href}
                          className="block px-6 py-2 text-sm whitespace-nowrap hover:bg-[var(--bg-secondary)] cursor-pointer hover:text-white"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </nav>
        {/* User and search (desktop only) */}
        <div className="items-center gap-2 flex">
          <div
            className="relative flex items-center h-full"
            onMouseEnter={() => setIsUserDropdownOpen(true)}
            onMouseLeave={() => setIsUserDropdownOpen(false)}
          >
            <span className="font-normal text-sm cursor-pointer">
              {userData?.user?.PersonalDetails?.userName}
            </span>
            <i className="fa-solid fa-caret-down ml-1 text-xs"></i>
            {/* User Dropdown */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 top-full bg-[var(--bg-primary)] text-white shadow-lg z-50 min-w-[220px] py-2">
                <ul className="flex flex-col gap-2">
                  {[
                    {
                      label: "Secure Auth Verification",
                      href: "/secure-auth-verification",
                    },
                    { label: "Change Password", href: "/change-password" },
                  ].map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.href}
                        className="block px-6 py-2 text-sm whitespace-nowrap hover:bg-[var(--bg-secondary)] cursor-pointer hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-6 py-2 text-sm whitespace-nowrap hover:bg-[var(--bg-secondary)] cursor-pointer hover:text-white"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div className="flex items-center bg-white rounded ml-2">
            <input
              className="px-2 py-1 rounded-l outline-none text-gray-500 w-28"
              type="text"
              placeholder="All Client"
            />
            <button
              className="px-2 text-[var(--bg-secondary)] text-xl"
              aria-label="Search"
            >
              <i className="fa-solid fa-search-plus"></i>
            </button>
          </div>
        </div>
      </section>
      {/* Mobile menu overlay */}
     
      {/* Sports overlay */}
      {isSportsOpen && (
        <React.Fragment>
          {/* Dim background only below header */}
          <div
            className="fixed left-0 top-[50px] w-full h-full z-40 bg-black/40"
            onClick={() => setIsSportsOpen(false)}
          ></div>
          {/* Sports panel */}
          <div className="fixed left-0 top-[50px] w-[320px] max-w-[90vw] h-full z-50 bg-white p-2 overflow-y-auto animate-slide-in-left shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-normal">Sports</span>
              <button
                className="text-3xl text-black focus:outline-none"
                onClick={() => setIsSportsOpen(false)}
                aria-label="Close sports menu"
              >
                <i className="fa-solid cursor-pointer fa-xmark text-xl me-2"></i>
              </button>
            </div>
            {renderSportsList()}
          </div>
        </React.Fragment>
      )}
    </header>
  );
};

export default Header;
