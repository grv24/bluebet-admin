import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { ClientRow } from "./DepositModal";
import { FaTimes } from "react-icons/fa";
import { useCookies } from "react-cookie";
import { useMutation } from "@tanstack/react-query";
import { exposureLimitChange } from "@/helper/user";
import toast from "react-hot-toast";

interface ExporsureLimitProps {
  open: boolean;
  onClose: () => void;
  user: ClientRow | null;
  title: string;
  onSuccess?: () => void;
}

const ExporsureLimit: React.FC<ExporsureLimitProps> = ({
  open,
  onClose,
  user,
  title,
  onSuccess,
}) => {
  const [newLimit, setNewLimit] = useState<number>(0);
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string>("");

  const [cookies] = useCookies(["Admin", "TechAdmin"]);
  // Initialize new limit when modal opens or user changes
  useEffect(() => {
    if (open && user?.exposureLimit != null) {
      setNewLimit(Number(user.exposureLimit) || 0);
    } else if (!open) {
      setNewLimit(0);
      setPassword("");
      setFormError("");
    }
  }, [open, user?.exposureLimit]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      cookies: cookieBag,
      downlineUserId,
      exposureLimit,
      transactionPassword,
      userType,
    }: {
      cookies: any;
      downlineUserId: string;
      exposureLimit: number;
      transactionPassword: string;
      userType: string;
    }) =>
      exposureLimitChange({
        cookies: cookieBag,
        userId: user?._id || "",
        newLimit:exposureLimit,
        transactionPassword,
        userType: user?.__type || "",
      }),
    onSuccess: () => {
      setNewLimit(0);
      setPassword("");
      setFormError("");
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message);
      setFormError(err?.message || "Request failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!Number.isFinite(newLimit) || newLimit <= 0) {
      setFormError("Please enter a valid new limit.");
      return;
    }
    if (!password) {
      setFormError("Transaction password is required.");
      return;
    }

    mutate({
      cookies,
      downlineUserId: user?._id || "",
      exposureLimit: Number(newLimit),
      transactionPassword: password,
      userType: user?.__type || "",
    });
  };

  if (!open || !user) return null;

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
          {formError && (
            <div className="col-span-2 text-red-500 text-sm mb-2 text-center">{formError}</div>
          )}
          {/* Form Fields - two column grid */}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3 items-center">
            <label className="text-sm font-normal text-left pr-2">
              Old Limit
            </label>
            <input
              type="number"
              className="bg-gray-200 border border-gray-400 rounded px-3 py-2 h-10 text-sm text-gray-500 focus:outline-none focus:ring w-full"
              value={user?.exposureLimit}
              disabled
              // onChange={(e) => setAmount(Number(e.target.value))}
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

export default ExporsureLimit;
