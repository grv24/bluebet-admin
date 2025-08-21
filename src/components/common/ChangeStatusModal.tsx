import React, { useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { ClientRow } from "./DepositModal";
import { useCookies } from "react-cookie";
import { useMutation } from "@tanstack/react-query";
import { changeUserStatus } from "@/helper/user";

interface ChangeStatusModalProps {
  open: boolean;
  onClose: () => void;
  user: ClientRow | null;
  title: string;
  onSuccess?: () => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ open, onClose, user, title, onSuccess }) => {
  // `ust`/`bst` are ACTIVE booleans from parent (true means active)
  const [userActive, setUserActive] = useState<boolean>(() => (user ? !!user.ust : true));
  const [betActive, setBetActive] = useState<boolean>(() => (user ? !!user.bst : true));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [initialUserActive] = useState<boolean>(() => (user ? !!user.ust : true));
  const [initialBetActive] = useState<boolean>(() => (user ? !!user.bst : true));

  const [cookies] = useCookies(["Admin", "TechAdmin"]);

  // Note: State is initialized from props on mount. The parent sets a key to remount when opening or switching users.

  const propsOnSuccess = onSuccess;
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      cookies: cookieBag,
      downlineUserId,
      lockUser,
      lockBet,
      transactionPassword,
      userType,
    }: {
      cookies: any;
      downlineUserId: string;
      lockUser: boolean;
      lockBet: boolean;
      transactionPassword: string;
      userType: string;
    }) => {
      const response: any = await changeUserStatus({
        cookies: cookieBag,
        userId: user?._id || "",
        lockUser,
        lockBet,
        transactionPassword,
        userType: user?.__type || "",
      });
      if (!response?.success) {
        throw new Error(response?.message || "Update failed");
      }
      return response;
    },
    onSuccess: () => {
      setPassword("");
      setError("");
      if (propsOnSuccess) propsOnSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err?.message || "Request failed. Please try again.");
    },
  });

  if (!open || !user) return null;

  const hasChanges = userActive !== initialUserActive || betActive !== initialBetActive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-xl p-0 animate-fadein">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-[var(--bg-primary)] text-white rounded-full w-8 h-8 cursor-pointer flex items-center justify-center text-md"
          onClick={onClose}
          disabled={isPending}
        >
          <FaTimes />
        </button>
        <h2 className="text-xl p-4 font-normal mb-2">{title}</h2>
        <div className="px-12 py-4 pb-4">
          {error && (
            <div className="text-center text-sm text-red-500 mb-4">{error}</div>
          )}
          {/* Username */}
          <div className="mb-6">
            <span className="text-md font-normal text-[#ffc85a]">{user.userName}</span>
          </div>
          {/* Toggles */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col items-center">
              <span className="text-lg font-normal mb-2">User Active</span>
              <button
                type="button"
                role="switch"
                aria-checked={userActive}
                className={`flex items-center px-4 py-1 rounded-full focus:outline-none transition-colors ${userActive ? "bg-[#0096db]" : "bg-gray-300"}`}
                onClick={() => setUserActive((v) => !v)}
                disabled={isPending}
              >
                <span
                  className={`text-sm font-medium mr-2 ${userActive ? "text-white" : "text-gray-700"}`}
                >
                  {userActive ? "ON" : "OFF"}
                </span>
                <span
                  className={`inline-block w-4 h-4 rounded-full bg-[#232f3e] transition-transform ${userActive ? "translate-x-0" : "translate-x-4"}`}
                ></span>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-normal mb-2">Bet Active</span>
              <button
                type="button"
                role="switch"
                aria-checked={betActive}
                className={`flex items-center px-4 py-1 rounded-full focus:outline-none transition-colors ${betActive ? "bg-[#0096db]" : "bg-gray-300"}`}
                onClick={() => setBetActive((v) => !v)}
                disabled={isPending}
              >
                <span
                  className={`text-sm font-medium mr-2 ${betActive ? "text-white" : "text-gray-700"}`}
                >
                  {betActive ? "ON" : "OFF"}
                </span>
                <span
                  className={`inline-block w-4 h-4 rounded-full bg-[#232f3e] transition-transform ${betActive ? "translate-x-0" : "translate-x-4"}`}
                ></span>
              </button>
            </div>
          </div>
          {/* Transaction Password */}
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              if (!password) {
                setError("Transaction password is required.");
                return;
              }
              if (!hasChanges) {
                setError("No changes to update.");
                return;
              }
              // API expects locked booleans; our toggles are "active" booleans
              const lockUser = !userActive;
              const lockBet = !betActive;
              mutate({
                cookies,
                downlineUserId: user?._id || "",
                lockUser,
                lockBet,
                transactionPassword: password,
                userType: user?.__type || "",
              });
            }}
          >
            <div className="flex gap-2 items-center h-fit">
              <label className="block text-sm text-nowrap leading-8 font-normal mb-2">Transaction Password</label>
              <input
                placeholder="Enter Transaction Password"
                type="password"
                className="border rounded px-3 border-gray-300 leading-8 focus:outline-none focus:ring w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="flex justify-end gap-4 mt-2">
              <button
                type="button"
                className="flex items-center gap-2 px-4 leading-8 rounded bg-[#232f3e] text-white font-medium uppercase text-sm cursor-pointer hover:opacity-90"
                onClick={onClose}
                disabled={isPending}
              >
                <FaArrowLeft /> BACK
              </button>
              <button
                type="submit"
                disabled={isPending || !hasChanges}
                className={`flex items-center gap-2 leading-8 px-4 cursor-pointer rounded uppercase text-white font-medium text-sm ${
                  isPending || !hasChanges ? "bg-gray-400 cursor-not-allowed" : "bg-[var(--bg-primary)] hover:opacity-90"
                }`}
              >
                {isPending ? "Processing..." : (<>
                  Submit <FaArrowRight />
                </>)}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        .animate-fadein { animation: fadein 0.2s; }
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default ChangeStatusModal;