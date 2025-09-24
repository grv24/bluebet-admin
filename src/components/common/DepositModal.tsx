import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { useCookies } from "react-cookie";
import { baseUrl, getDecodedTokenData } from "@/helper/auth";
import { depositBalance, getOwnBalance } from "@/helper/user";
import toast from "react-hot-toast";

export interface ClientRow {
  __type: string;
  userName: string;
  balance: number;
  creditRef: string;
  ust: boolean;
  bst: boolean;
  exposureLimit: number;
  defaultPercent: number;
  accountType: string;
  _id?: string; // This will be userId from the new structure
}

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  user: ClientRow | null;
  title: string;
}

const DepositModal: React.FC<DepositModalProps> = ({
  open,
  onClose,
  user,
  title,
}) => {
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [cookies] = useCookies(["Admin", "TechAdmin"]);

  const upline: any = getDecodedTokenData(cookies) || {};
  const token = cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];
  const userId = upline?.user?.userId || "";
  
  // Fallback to token balance if API fails
  const uplineBalance = currentBalance || Number(upline?.user?.AccountDetails?.Balance || 0);

  // Fetch current balance when modal opens
  useEffect(() => {
    const fetchBalance = async () => {
      if (!open || !userId || !token) return;
      
      setBalanceLoading(true);
      try {
        const response: any = await getOwnBalance({
          token,
          userId,
          cookies,
        });
        
        if (response?.status && response?.balance !== undefined) {
          setCurrentBalance(response.balance);
        } else {
          console.warn("Failed to fetch balance, using token balance");
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
        // Keep using token balance as fallback
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();
  }, [open, userId, token, cookies]);

  if (!open || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const enteredAmount = Number(amount);
    if (!enteredAmount || enteredAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (enteredAmount > uplineBalance) {
      setError("Amount exceeds upline balance.");
      return;
    }

    if (!password) {
      setError("Transaction password is required.");
      return;
    }
    console.log(user, "user");
    try {
      setLoading(true);
      const res = await depositBalance({
        token,
        amount: enteredAmount,
        userId: user?._id || "", // This is now userId from the new structure
        transactionPassword: password,
        remark,
        userType: user?.__type || "",
      });

      if (res?.success) {
        toast.success(res?.message)
        setAmount("");
        setRemark("");
        setPassword("");
        onClose(); // close modal
      } else {
        toast.error(res?.error);
      }
    } catch (err) {
      // toast.error(err)
      setError("An error occurred during deposit.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-xl p-0 animate-fadein">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-[var(--bg-primary)] text-white rounded-full w-8 h-8 cursor-pointer flex items-center justify-center text-md"
          onClick={onClose}
          disabled={loading}
        >
          <FaTimes />
        </button>

        <h2 className="text-xl p-4 font-normal mb-2">{title}</h2>

        <div className="px-8 py-4 pb-4">
          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-2 items-center">
            <label className="text-sm font-normal text-left pr-2">
              {upline?.user?.PersonalDetails?.userName}
            </label>
            <div className="flex gap-2">
              <input
                className="bg-gray-200 border border-gray-400 text-sm rounded w-full h-10 px-2 text-right"
                value={balanceLoading ? "Loading..." : uplineBalance.toLocaleString()}
                readOnly
              />
              <input
                className="bg-gray-200 border text-sm border-gray-400 rounded w-full h-10 px-2 text-right"
                value={balanceLoading ? "Loading..." : (uplineBalance - Number(amount)).toLocaleString()}
                readOnly
              />
            </div>

            <label className="text-sm font-normal text-left pr-2">
              {user?.userName}
            </label>
            <div className="flex gap-2">
              <input
                className="bg-gray-200 border border-gray-400 text-sm rounded w-full h-10 px-2 text-right"
                value={user?.balance}
                readOnly
              />
              <input
                className="bg-gray-200 border text-sm border-gray-400 rounded w-full h-10 px-2 text-right"
                value={amount ? `+ ${amount} ₹` : "0"}
                readOnly
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="col-span-2 text-red-500 text-sm mb-2 text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-2 gap-x-4 gap-y-3 items-center"
          >
            <label className="text-sm font-normal text-left pr-2">Amount</label>
            <input
              type="number"
              min="0"
              disabled={loading || balanceLoading}
              placeholder={balanceLoading ? "Loading balance..." : "Enter Amount"}
              className="border rounded text-sm px-3 text-gray-500 py-2 h-10 focus:outline-none focus:ring w-full"
              value={amount}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val <= uplineBalance && !balanceLoading) {
                  setAmount(e.target.value);
                  // Auto-set remark when amount is entered
                  if (e.target.value && val > 0) {
                    setRemark(`${e.target.value} is deposited to your account`);
                  } else {
                    setRemark("");
                  }
                }
              }}
            />

            <label className="text-sm font-normal text-left pr-2">Remark</label>
            <textarea
              disabled={true}
              className="bg-gray-200 border border-gray-400 rounded px-3 py-2 h-10 min-h-[40px] text-sm text-gray-500 resize-none w-full"
              placeholder="Auto-generated remark"
              value={remark}
              readOnly
            />

            <label className="text-sm font-normal text-left pr-2">
              Transaction Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                disabled={loading}
                className="border rounded px-3 py-2 h-10 text-sm text-gray-500 focus:outline-none focus:ring w-full pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Transaction Password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div></div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                disabled={loading}
                className="flex items-center gap-2 leading-8 px-4 rounded bg-[#232f3e] text-white font-medium uppercase text-sm cursor-pointer hover:opacity-90"
                onClick={onClose}
              >
                <FaArrowLeft /> BACK
              </button>
              <button
                type="submit"
                disabled={loading || balanceLoading}
                className={`flex items-center gap-2 leading-8 px-4 rounded uppercase text-white font-medium text-sm ${
                  loading || balanceLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[var(--bg-primary)] hover:opacity-90"
                }`}
              >
                {loading ? (
                  "Processing..."
                ) : balanceLoading ? (
                  "Loading..."
                ) : (
                  <>
                    Submit <FaArrowRight />
                  </>
                )}
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

export default DepositModal;
