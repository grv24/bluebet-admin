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
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [transactionCode, setTransactionCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<string>("");

  // Get authentication token from cookies
  const [cookies] = useCookies([
    baseUrl.includes("techadmin") ? "TechAdmin" : "Admin",
  ]);
  const authToken =
    cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];

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
    }
  }, [isOpen]);

  // Auto-check accounts when transaction code is entered
  useEffect(() => {
    if (transactionCode.trim()) {
      // If transaction code exists, mark all accounts
      setSelectedUsers(new Set(users.map((u) => u.username)));
      setTransactionError("");
    } else {
      // If transaction code is empty, uncheck all
      setSelectedUsers(new Set());
    }
  }, [transactionCode, users.length]);

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
      if (data.success && data.clients) {
        // Transform API response to user accounts
        const userAccounts: UserAccount[] = Array.isArray(data.clients)
          ? data.clients.map((client: any) => ({
              username: client.username || client.loginId || "",
              userId: client.userId || client._id,
              backAmount: client.backAmount || 0,
              layAmount: client.layAmount || 0,
            }))
          : [];

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

  const handleUserToggle = (username: string) => {
    // Check if transaction code is present
    if (!transactionCode.trim()) {
      setTransactionError("Please enter transaction code first");
      return;
    }
    
    setTransactionError("");
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelectedUsers(newSelected);
  };

  const handleLockBets = async () => {
    if (!transactionCode.trim()) {
      toast.error("Please enter transaction code");
      return;
    }

    if (selectedUsers.size === 0) {
      toast.error("Please select at least one account");
      return;
    }

    if (!mid) {
      toast.error("Market ID is required");
      return;
    }

    setSubmitting(true);
    try {
      // Get selected user IDs (excluding "All Account")
      const selectedUserIds = users
        .filter((u) => selectedUsers.has(u.username) && u.userId)
        .map((u) => u.userId!);

      const isAllAccount = selectedUsers.has("All Account");

      // If "All Account" is selected, we need to get all user IDs
      const userIdsToProcess = isAllAccount
        ? users.filter((u) => u.userId).map((u) => u.userId!)
        : selectedUserIds;

      // Send request for each user
      const requests = userIdsToProcess.map((userId) =>
        fetch(`${SERVER_URL}/api/v1/sports/bet-lock`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mid,
            marketName: marketName || (marketType === "match_odds" ? "Match Odds" : "Bookmaker"),
            eventId,
            eventName: eventName || "",
            userId,
            transactionPassword: transactionCode,
          }),
        })
      );

      const responses = await Promise.all(requests);
      const results = await Promise.all(
        responses.map((res) => res.json().catch(() => ({})))
      );

      // Check if all requests were successful
      const allSuccess = results.every((data) => data.success);
      const hasErrors = results.some((data) => !data.success);

      if (allSuccess) {
        toast.success("Bets locked successfully!");
        onClose();
      } else if (hasErrors) {
        const errorMessages = results
          .filter((data) => !data.success)
          .map((data) => data.message || "Failed to lock bet")
          .join(", ");
        toast.error(errorMessages || "Some bets failed to lock");
      } else {
        toast.error("Failed to lock bets");
      }
    } catch (error: any) {
      console.error("Error locking bets:", error);
      toast.error(error.message || "Error locking bets. Please try again.");
    } finally {
      setSubmitting(false);
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
          <div className="mb-4">
            <input
              type="password"
              value={transactionCode}
              onChange={(e) => {
                setTransactionCode(e.target.value);
                setTransactionError("");
              }}
              placeholder="Transaction Code"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                transactionError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              disabled={submitting}
            />
            {transactionError && (
              <p className="text-red-500 text-xs mt-1">{transactionError}</p>
            )}
          </div>

          {/* Accounts List */}
          <div className="mb-4">
            <div className="border border-gray-200 rounded">
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
                      className="flex items-center cursor-pointer w-full p-2 hover:bg-gray-50"
                      onClick={() => !submitting && handleUserToggle(user.username)}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          selectedUsers.has(user.username)
                            ? "bg-black"
                            : "bg-black"
                        }`}
                      >
                        {selectedUsers.has(user.username) && (
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
                        )}
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
