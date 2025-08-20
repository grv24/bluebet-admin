import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import { ClientRow } from './DepositModal'
import { useCookies } from 'react-cookie'
import { baseUrl, getDecodedTokenData } from '@/helper/auth'
import { withdrawChips } from '@/helper/user'

interface WithdrawModalProps {
    open: boolean;
    onClose: () => void;
    user: ClientRow | null;
    title: string;
}
const WithdrawModal = ({ open, onClose, user, title }: WithdrawModalProps) => {
    const [amount, setAmount] = useState("");
    const [remark, setRemark] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [cookies] = useCookies(["Admin", "TechAdmin"]);

    const upline: any = getDecodedTokenData(cookies) || {};
    const uplineBalance = Number(upline?.AccountDetails?.Balance || 0);

    if (!open || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const enteredAmount = Number(amount);
      if (!enteredAmount || enteredAmount <= 0) {
        setError("Please enter a valid amount.");
        return;
      }

      if (enteredAmount > (user?.balance || 0)) {
        setError("Amount exceeds downline balance.");
        return;
      }

      if (!password) {
        setError("Transaction password is required.");
        return;
      }

      try {
        setLoading(true);
        await withdrawChips({
          cookies,
          amount: enteredAmount,
          downlineUserId: user?._id || "",
          uplineUserId: upline?.userId,
          transactionPassword: password,
        });

        // Reset state and close
        setAmount("");
        setRemark("");
        setPassword("");
        onClose();
      } catch (err: any) {
        setError(err?.message || "Withdraw failed.");
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
            {/* Balances Grid - two column grid like form */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-2 items-center">
              {/* Upline */}
              <label className="text-sm font-normal text-left pr-2">{upline?.PersonalDetails?.userName}</label>
              <div className="flex gap-2">
                <input
                  className="bg-gray-200 border border-gray-400 text-sm rounded w-full h-10 px-2 text-right"
                  value={uplineBalance}
                  readOnly
                />
                <input
                  className="bg-gray-200 border text-sm border-gray-400 rounded w-full h-10 px-2 text-right"
                  value={uplineBalance + Number(amount)}
                  readOnly
                />
              </div>
              {/* Downline */}
              <label className="text-sm font-normal text-left pr-2">
                {user.userName}
              </label>
              <div className="flex gap-2">
                <input
                  className="bg-gray-200 border border-gray-400 text-sm rounded w-full h-10 px-2 text-right"
                  value={user.balance}
                  readOnly
                />
                <input
                  className="bg-gray-200 border text-sm border-gray-400 rounded w-full h-10 px-2 text-right"
                  value={amount ? `- ${amount} ₹` : "0"}
                  readOnly
                />
              </div>
            </div>
            {/* Error */}
            {error && (
              <div className="col-span-2 text-red-500 text-sm mb-2 text-center">{error}</div>
            )}
            {/* Form Fields - two column grid */}
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 items-center">
              <label className="text-sm font-normal text-left pr-2">
                Amount
              </label>
              <input
                type="number"
                min="0"
                placeholder="Enter Amount"
                disabled={loading}
                className="border rounded text-sm px-3 text-gray-500 py-2 h-10 focus:outline-none focus:ring w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <label className="text-sm font-normal text-left pr-2">
                Remark
              </label>
              <textarea
                disabled={loading}
                className="border rounded px-3 py-2 h-10 min-h-[40px] text-sm text-gray-500 focus:outline-none focus:ring resize-none w-full"
                value={remark}
                placeholder="Enter Remark"
                onChange={(e) => setRemark(e.target.value)}
              />
              <label className="text-sm font-normal text-left pr-2">
                Transaction Password
              </label>
              <input
                type="password"
                disabled={loading}
                className="border rounded px-3 py-2 h-10 text-sm text-gray-500 focus:outline-none focus:ring w-full"
                value={password}
                placeholder="Enter Transaction Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Empty cell for alignment */}
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
                  disabled={loading}
                  className={`flex items-center gap-2 leading-8 px-4 cursor-pointer rounded uppercase text-white font-medium text-sm ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--bg-primary)] hover:opacity-90'
                  }`}
                >
                  {loading ? 'Processing...' : <>Submit <FaArrowRight /></>}
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
}

export default WithdrawModal