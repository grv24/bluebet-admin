import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useCookies } from "react-cookie";
import { baseUrl, SERVER_URL } from "@/helper/auth";
import toast from "react-hot-toast";

interface BetLockProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  marketType?: "match_odds" | "bookmaker";
  mid?: string;
  eventName?: string;
  marketName?: string;
  competition?: string;
  match?: string;
}

interface UserAccount {
  username: string;
  userId?: string;
  backAmount?: number;
  layAmount?: number;
}

const BetLock: React.FC<BetLockProps> = ({
  isOpen,
  onClose,
  eventId,
  marketType = "match_odds",
  mid,
  eventName,
  marketName,
  competition,
  match: matchName,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [transactionCode, setTransactionCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());
  const [transactionError, setTransactionError] = useState<string>("");
  const [marketId, setMarketId] = useState<string | undefined>(mid);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [finalEventName, setFinalEventName] = useState<string>(() => {
    return eventName || (competition && matchName ? `${competition} > ${matchName}` : matchName || competition || "");
  });
  
  // Helper function to get eventName with all fallbacks
  const getEventName = (): string => {
    // First check state
    if (finalEventName && finalEventName.trim()) {
      console.log("BetLock getEventName: Using finalEventName from state:", finalEventName);
      return finalEventName;
    }
    // Then check props
    if (eventName && eventName.trim()) {
      console.log("BetLock getEventName: Using eventName from props:", eventName);
      return eventName;
    }
    // Then construct from competition and match
    if (competition && matchName) {
      const constructed = `${competition} > ${matchName}`;
      if (constructed.trim()) {
        console.log("BetLock getEventName: Using constructed name:", constructed);
        return constructed;
      }
    }
    if (matchName && matchName.trim()) {
      console.log("BetLock getEventName: Using matchName:", matchName);
      return matchName;
    }
    if (competition && competition.trim()) {
      console.log("BetLock getEventName: Using competition:", competition);
      return competition;
    }
    // Log warning if we can't construct eventName
    console.warn("BetLock: Unable to construct eventName. Props:", { eventName, competition, matchName, finalEventName });
    return "";
  };

  // Helper function to get marketName - supports any market name
  const getMarketName = (): string => {
    // If marketName prop is provided, use it (convert to lowercase and replace spaces with underscores)
    if (marketName && marketName.trim()) {
      return marketName.toLowerCase().replace(/\s+/g, '_');
    }
    // Fallback to marketType if marketName is not provided
    return marketType === "match_odds" ? "match_odds" : "bookmaker";
  };

  // Get authentication token from cookies
  const [cookies] = useCookies([
    baseUrl.includes("techadmin") ? "TechAdmin" : "Admin",
  ]);
  const authToken =
    cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];

  // Update marketId when mid prop changes
  useEffect(() => {
    if (mid) {
      setMarketId(mid);
    }
  }, [mid]);

  // Also update marketId when modal opens if mid is available
  useEffect(() => {
    if (isOpen && mid && !marketId) {
      setMarketId(mid);
    }
  }, [isOpen, mid, marketId]);

  // Construct eventName when props change
  useEffect(() => {
    const constructedName = eventName || 
      (competition && matchName ? `${competition} > ${matchName}` : matchName || competition || "");
    if (constructedName && constructedName.trim()) {
      setFinalEventName(constructedName);
    }
    // Debug logging
    console.log("BetLock eventName construction:", {
      eventName,
      competition,
      matchName,
      constructedName,
      finalEventName
    });
  }, [eventName, competition, matchName]);

  // Fetch users with bets on this event
  useEffect(() => {
    if (isOpen && eventId && authToken) {
      fetchUsers();
    }
  }, [isOpen, eventId, authToken, marketType]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers(new Set());
      setTransactionCode("");
      setTransactionError("");
      setMarketId(mid); // Reset to prop value
      // Reset eventName to constructed value
      const constructedName = eventName || 
        (competition && matchName ? `${competition} > ${matchName}` : matchName || competition || "");
      setFinalEventName(constructedName);
    }
  }, [isOpen, mid, eventName, competition, matchName]);

  const fetchUsers = async () => {
    if (!authToken || !eventId) {
      console.error("No auth token or eventId available");
      return;
    }

    setLoading(true);
    try {
      // Use bet-lock/clients API to fetch clients list
      const response = await fetch(
        `${SERVER_URL}/api/v1/sports/bet-lock/clients?eventId=${eventId}&marketType=${marketType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch clients: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("BetLock clients API response:", data);
      if (data.success && data.clients) {
        // Get mid from API response if not provided as prop
        // Try multiple possible field names
        const apiMid = data.mid || data.marketId || data.market_id;
        if (!marketId && apiMid) {
          setMarketId(apiMid);
        } else if (!marketId && mid) {
          // Fallback to prop if API doesn't provide it
          setMarketId(mid);
        }

        // Get eventName from API response if available
        const apiEventName = data.eventName || data.event_name || data.name || data.matchName || data.match_name;
        if (apiEventName) {
          setFinalEventName(apiEventName);
        } else if (!finalEventName) {
          // If API doesn't provide it and we don't have it, try to construct it
          const constructedName = eventName || 
            (competition && matchName ? `${competition} > ${matchName}` : matchName || competition || "");
          if (constructedName) {
            setFinalEventName(constructedName);
          }
        }
        
        // Transform API response to user accounts and collect users with betLock: true
        const userAccounts: UserAccount[] = [];
        const lockedUsers = new Set<string>();
        
        if (Array.isArray(data.clients)) {
          data.clients.forEach((client: any) => {
            const username = client.username || client.loginId || "";
            if (username) {
              userAccounts.push({
                username,
                userId: client.userId || client._id || client.id,
                backAmount: client.backAmount || 0,
                layAmount: client.layAmount || 0,
              });
              
              // If betLock is true, add to selected users
              if (client.betLock === true) {
                lockedUsers.add(username);
              }
            }
          });
        }

        // Set selected users to those with betLock: true
        setSelectedUsers(lockedUsers);

        // Add "All Account" option at the beginning
        setUsers([{ username: "All Account" }, ...userAccounts]);
      } else {
        setUsers([{ username: "All Account" }]);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients");
      setUsers([{ username: "All Account" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = async (username: string) => {
    // Check if transaction code is present
    if (!transactionCode.trim()) {
      setTransactionError("Please enter transaction code first");
      return;
    }

    // Check if marketId is available
    if (!marketId) {
      // If still loading, wait a bit for fetchUsers to complete
      if (loading) {
        toast.error("Please wait for the data to load.");
        return;
      }
      toast.error("Market ID is required. Unable to proceed without market information.");
      return;
    }

    const currentMarketId = marketId;

    setTransactionError("");

    // If user is already selected, unselect and call API to unlock
    if (selectedUsers.has(username)) {
      // Handle "All Account" unselection
      if (username === "All Account") {
        // Get all user IDs except "All Account"
        const allUserIds = users
          .filter((u) => u.username !== "All Account" && (u.userId || u.username))
          .map((u) => u.userId || u.username!);
        
        if (allUserIds.length === 0) {
          toast.error("No users available to unlock");
          return;
        }

        setProcessingUsers(new Set(["All Account"]));
        
        try {
          // Send unlock request for each user
          const requests = allUserIds.map((userId) =>
            fetch(`${SERVER_URL}/api/v1/sports/bet-lock`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${authToken}`,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
          body: JSON.stringify({
            mid: currentMarketId,
            marketName: getMarketName(),
            eventId: eventId || "",
            eventName: getEventName(),
            userId,
            transactionPassword: transactionCode,
          }),
            })
          );

          const responses = await Promise.all(requests);
          const results = await Promise.all(
            responses.map((res) => res.json().catch(() => ({})))
          );

          const allSuccess = results.every((data) => data.success);
          
          if (allSuccess) {
            // Unselect all users in UI
            setSelectedUsers(new Set());
            toast.success("All accounts unlocked successfully!");
          } else {
            const errorMessages = results
              .filter((data) => !data.success)
              .map((data) => data.error || data.message || "Failed to unlock bet")
              .join(", ");
            toast.error(errorMessages || "Some accounts failed to unlock");
          }
        } catch (error: any) {
          console.error("Error unlocking bets:", error);
          toast.error(error.message || "Error unlocking bets. Please try again.");
        } finally {
          setProcessingUsers(new Set());
        }
        return;
      }

      // Handle individual user unselection
      const user = users.find((u) => u.username === username);
      if (!user) {
        toast.error("User not found");
        return;
      }

      // Use userId if available, otherwise use username as userId
      const userIdToUse = user.userId || user.username;
      
      if (!userIdToUse) {
        toast.error("User ID not found");
        return;
      }

      setProcessingUsers(new Set([username]));

      try {
        const response = await fetch(`${SERVER_URL}/api/v1/sports/bet-lock`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mid: currentMarketId,
            marketName: getMarketName(),
            eventId: eventId || "",
            eventName: getEventName(),
            userId: userIdToUse,
            transactionPassword: transactionCode,
          }),
        });

        const data = await response.json();
        
        if (!response.ok || !data.success) {
          const errorMessage = data.error || data.message || `Failed to unlock bet: ${response.statusText}`;
          toast.error(errorMessage);
          setProcessingUsers(new Set());
          return;
        }

        if (data.success) {
          // Remove user from selected list
          const newSelected = new Set(selectedUsers);
          newSelected.delete(username);
          setSelectedUsers(newSelected);
          toast.success(`Bet unlocked successfully for ${username}!`);
        } else {
          const errorMessage = data.error || data.message || "Failed to unlock bet";
          toast.error(errorMessage);
        }
      } catch (error: any) {
        console.error("Error unlocking bet:", error);
        toast.error(error.message || "Error unlocking bet. Please try again.");
      } finally {
        setProcessingUsers(new Set());
      }
      return;
    }

    // User is being selected - call API immediately
    const user = users.find((u) => u.username === username);
    
    // Handle "All Account" selection
    if (username === "All Account") {
      // Get all user IDs except "All Account" - use userId if available, otherwise use username
      const allUserIds = users
        .filter((u) => u.username !== "All Account" && (u.userId || u.username))
        .map((u) => u.userId || u.username!);
      
      if (allUserIds.length === 0) {
        toast.error("No users available to lock");
        return;
      }

      setProcessingUsers(new Set(["All Account"]));
      
      try {
        // Send request for each user
        const requests = allUserIds.map((userId) =>
          fetch(`${SERVER_URL}/api/v1/sports/bet-lock`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mid: currentMarketId,
              marketName: getMarketName(),
              eventId: eventId || "",
              eventName: getEventName(),
              userId,
              transactionPassword: transactionCode,
            }),
          })
        );

        const responses = await Promise.all(requests);
        const results = await Promise.all(
          responses.map((res) => res.json().catch(() => ({})))
        );

        const allSuccess = results.every((data) => data.success);
        
        if (allSuccess) {
          // Select all users in UI
          setSelectedUsers(new Set(users.map((u) => u.username)));
          toast.success("All accounts locked successfully!");
        } else {
          const errorMessages = results
            .filter((data) => !data.success)
            .map((data) => data.error || data.message || "Failed to lock bet")
            .join(", ");
          toast.error(errorMessages || "Some accounts failed to lock");
        }
      } catch (error: any) {
        console.error("Error locking bets:", error);
        toast.error(error.message || "Error locking bets. Please try again.");
      } finally {
        setProcessingUsers(new Set());
      }
      return;
    }

    // Handle individual user selection
    if (!user) {
      toast.error("User not found");
      return;
    }

    // Use userId if available, otherwise use username as userId
    const userIdToUse = user.userId || user.username;
    
    if (!userIdToUse) {
      toast.error("User ID not found");
      return;
    }

    setProcessingUsers(new Set([username]));

    try {
      const response = await fetch(`${SERVER_URL}/api/v1/sports/bet-lock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
          body: JSON.stringify({
            mid: currentMarketId,
            marketName: getMarketName(),
            eventId: eventId || "",
            eventName: getEventName(),
            userId: userIdToUse,
            transactionPassword: transactionCode,
          }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        const errorMessage = data.error || data.message || `Failed to lock bet: ${response.statusText}`;
        toast.error(errorMessage);
        setProcessingUsers(new Set());
        return;
      }

      if (data.success) {
        // Add user to selected list
        const newSelected = new Set(selectedUsers);
        newSelected.add(username);
        setSelectedUsers(newSelected);
        toast.success(`Bet locked successfully for ${username}!`);
      } else {
        const errorMessage = data.error || data.message || "Failed to lock bet";
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error locking bet:", error);
      toast.error(error.message || "Error locking bet. Please try again.");
    } finally {
      setProcessingUsers(new Set());
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-fadein">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-[var(--bg-primary)] text-white rounded-full w-8 h-8 cursor-pointer flex items-center justify-center text-md z-10"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        {/* Header */}
        <h2 className="text-xl p-4 font-normal">Bet Lock</h2>

        <div className="px-6 py-4 pb-4 flex-1 overflow-hidden flex flex-col">
          {/* Transaction Code */}
          <div className="mb-4 flex justify-end">
            <div className="w-1/2 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={transactionCode}
                onChange={(e) => {
                  setTransactionCode(e.target.value);
                  setTransactionError("");
                }}
                placeholder="Transaction Password"
                className={`w-full px-3 py-2 pr-10 border rounded focus:outline-none focus:ring-2 ${
                  transactionError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            {transactionError && (
              <p className="text-red-500 text-xs mt-1">{transactionError}</p>
            )}
            </div>
          </div>

          {/* Accounts List */}
          <div className="mb-4 flex-1 overflow-hidden flex flex-col">
            <div className="border border-gray-200 rounded overflow-y-auto max-h-64">
              {loading ? (
                <div className="text-center text-gray-500 py-4">Loading...</div>
              ) : users.length > 0 ? (
                users.map((user, index) => (
                  <div
                    key={index}
                    className={`flex items-center border-b border-gray-200 last:border-b-0 ${
                      index === 0 ? "first:rounded-t" : ""
                    } ${index === users.length - 1 ? "last:rounded-b" : ""}`}
                  >
                    <div
                      className={`flex items-center w-full p-2 hover:bg-gray-50 ${
                        processingUsers.has(user.username) ? "opacity-50 cursor-wait" : "cursor-pointer"
                      }`}
                      onClick={() => !processingUsers.has(user.username) && handleUserToggle(user.username)}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          selectedUsers.has(user.username)
                            ? "bg-black"
                            : "bg-black"
                        }`}
                      >
                        {processingUsers.has(user.username) ? (
                          <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : selectedUsers.has(user.username) ? (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : null}
                      </div>
                      <span className="text-sm text-gray-800 ml-2">{user.username}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No accounts found
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          .animate-fadein { animation: fadein 0.2s; }
          @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
    </div>
  );
};

export default BetLock;
