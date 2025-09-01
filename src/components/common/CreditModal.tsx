import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { ClientRow } from "./DepositModal";
import { useCookies } from "react-cookie";
import { useMutation } from "@tanstack/react-query";
import { changeCreditReference } from "@/helper/user";
import toast from "react-hot-toast";

interface CreditModalProps {
  open: boolean;
  onClose: () => void;
  user: ClientRow | null;
  title: string;
  onSuccess?: () => void;
}

const CreditModal: React.FC<CreditModalProps> = ({
  open,
  onClose,
  user,
  title,
  onSuccess,
}) => {
  const [newLimit, setNewLimit] = useState<number>(0);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cookies] = useCookies(["Admin", "TechAdmin"]);

  useEffect(() => {
    if (open) {
      setNewLimit(0);
      setPassword("");
      setError("");
    }
  }, [open]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      cookies: cookieBag,
      downlineUserId,
      creditReference,
      transactionPassword,
      userType,
    }: {
      cookies: any;
      downlineUserId: string;
      creditReference: number;
      transactionPassword: string;
      userType: string;
    }) =>
      changeCreditReference({
        cookies: cookieBag,
        userId: user?._id || "",
        creditReference,
        transactionPassword,
        userType,
      }),
    onSuccess: () => {
      setNewLimit(0);
      setPassword("");
      setError("");
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
     toast?.error(err?.message)
      // setError(err?.message || "Request failed. Please try again.");
    },
  });

  if (!open || !user) return null;
// console.log(user.creditRef,'user')
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
        <div className="px-8 py-4 pb-4">
          {/* Error Display */}
          {error && (
            <div className="col-span-2 text-red-500 text-sm mb-2 text-center">{error}</div>
          )}
          {/* Form Fields - two column grid */}
          <form
            className="grid grid-cols-2 gap-x-4 gap-y-3 items-center"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              if (!Number.isFinite(newLimit) || newLimit <= 0) {
                setError("Please enter a valid new limit.");
                return;
              }
              if (!password) {
                setError("Transaction password is required.");
                return;
              }
              mutate({
                cookies,
                downlineUserId: user?._id || "",
                creditReference: Number(newLimit),
                transactionPassword: password,
                userType: user?.__type || "",
              });
            }}
          >
            <label className="text-sm font-normal text-left pr-2">
              Old Limit
            </label>
            <input
              type="string"
              className="bg-gray-200 border border-gray-400 rounded px-3 py-2 h-10 text-sm focus:outline-none focus:ring w-full"
              value={user?.creditRef}
              disabled 
            />
            <label className="text-sm font-normal text-left pr-2">
              New Limit
            </label>
            <input
              type="number"
              className="border rounded text-sm px-3 text-gray-500 py-2 h-10 focus:outline-none focus:ring w-full"
              value={newLimit}
              placeholder="Enter New Limit"
              onChange={(e) => {
                const next = Number(e.target.value);
                setNewLimit(Number.isFinite(next) && next >= 0 ? next : 0);
              }}
              disabled={isPending}
            />
            <label className="text-sm font-normal text-left pr-2">
              Transaction Password
            </label>
            <input
              type="password"
              className="border rounded text-sm px-3 text-gray-500 py-2 h-10 focus:outline-none focus:ring w-full"
              value={password}
              placeholder="Enter Transaction Password"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
            />
            {/* Empty cell for alignment */}
            <div></div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                className="flex items-center gap-2 leading-8 px-4 rounded bg-[#232f3e] text-white font-medium uppercase text-sm cursor-pointer hover:opacity-90"
                onClick={onClose}
                disabled={isPending}
              >
                <FaArrowLeft /> BACK
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={`flex items-center gap-2 leading-8 px-4 cursor-pointer rounded uppercase text-white font-medium text-sm ${
                  isPending ? "bg-gray-400 cursor-not-allowed" : "bg-[var(--bg-primary)] hover:opacity-90"
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

export default CreditModal;
