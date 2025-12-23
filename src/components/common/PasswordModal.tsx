import React, { useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { ClientRow } from "./DepositModal";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useCookies } from "react-cookie";
import { useMutation } from "@tanstack/react-query";
import { SERVER_URL, getAuthCookieKey, baseUrl } from "@/helper/auth";
import toast from "react-hot-toast";

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  user: ClientRow | null;
  title: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  open,
  onClose,
  user,
  title,
}) => {
  const [newpassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [transactionPassword, setTransactionPassword] = useState("");
  const [showTransactionPassword, setShowTransactionPassword] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState<string>("");
  const [cookies] = useCookies(["Admin", "TechAdmin"]);
  const cookieBag = cookies as any;
  const passwordRule =
    "Password must be 6-32 characters, start with a capital letter, include at least one letter, one number, one special character (e.g., @), and contain no spaces.";

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!user?._id) throw new Error("Missing user id");
      
      // Get token from cookies
      const authCookieKey = getAuthCookieKey();
      const token = cookieBag?.[authCookieKey] || cookieBag[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];
      
      if (!token || token === "undefined") {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${SERVER_URL}/api/v1/users/change-password-downline`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          newPassword: newpassword.trim(),
          transactionPassword: transactionPassword.trim(),
          userType: user?.__type || "",
        }),
      });

      // Parse response body regardless of status code
      const data = await response.json();

      // Check if API returned success: false or HTTP error
      if (!response.ok || (data && typeof data === 'object' && 'success' in data && !data.success)) {
        const errorMessage = data?.error || data?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return data;
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        toast.success(res?.message || "Password updated successfully");
        setFormSuccess(res?.message || "Password updated successfully");
        setFormError("");
        setNewPassword("");
        setConfirmPassword("");
        setTransactionPassword("");
        setTimeout(() => {
          setFormSuccess("");
          onClose();
        }, 800);
      } else {
        const errorMessage = res?.error || res?.message || "Update failed";
        toast.error(errorMessage);
        setFormError(errorMessage);
        setFormSuccess("");
      }
    },
    onError: (err: any) => {
      const errorMessage = err?.message || err?.error || "Request failed. Please try again.";
      toast.error(errorMessage);
      setFormError(errorMessage);
      setFormSuccess("");
    },
  });
  console.log(baseUrl, "baseUrl");
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative bg-white rounded-lg shadow-lg w-[92vw] max-w-xl md:w-full p-0 animate-fadein max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-[var(--bg-primary)] text-white rounded-full w-8 h-8 cursor-pointer flex items-center justify-center text-md"
          onClick={onClose}
        >
          <FaTimes />
        </button>
        <h2 className="text-xl p-4 font-normal mb-2">{title}</h2>
        <div className="px-4 md:px-8 py-4 pb-4">
        
          {/* Form Fields - two column grid */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFormError("");
              setFormSuccess("");
              if (
                !newpassword.trim() ||
                !confirmPassword.trim() ||
                !transactionPassword.trim()
              ) {
                setFormError("All fields are required");
                return;
              }
              // Validate string password strength
              const hasMinLen =
                newpassword.length >= 6 && newpassword.length <= 32;
              const hasLetter = /[A-Za-z]/.test(newpassword);
              const hasNumber = /\d/.test(newpassword);
              const hasNoSpaces = !/\s/.test(newpassword);
              const startsWithCapital = /^[A-Z]/.test(newpassword);
              const hasSpecial = /[^A-Za-z0-9\s]/.test(newpassword);
              if (
                !(
                  hasMinLen &&
                  hasLetter &&
                  hasNumber &&
                  hasSpecial &&
                  hasNoSpaces &&
                  startsWithCapital
                )
              ) {
                setFormError(passwordRule);
                return;
              }
              if (newpassword.trim() !== confirmPassword.trim()) {
                setFormError("Passwords do not match");
                return;
              }
              mutate();
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-center"
          >
            <label className="text-sm font-normal text-left pr-2">
              New Password
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                className="border  rounded px-3 py-2 h-10 focus:outline-none focus:ring w-full"
                value={newpassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isPending}
              />

              {showNewPassword ? (
                <FaEyeSlash
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                />
              ) : (
                <FaEye
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                />
              )}
            </div>
            <div className="col-span-1 md:col-span-2 text-[11px] text-gray-500 -mt-1">
              {passwordRule}
            </div>
            <label className="text-sm font-normal text-left pr-2">
              Confirm Password
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="border rounded px-3 py-2 h-10 focus:outline-none focus:ring w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
              />
              {showConfirmPassword ? (
                <FaEyeSlash
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              ) : (
                <FaEye
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )}
            </div>
            <label className="text-sm font-normal text-left pr-2">
              Transaction Password
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showTransactionPassword ? "text" : "password"}
                placeholder="Transaction Password"
                className="border rounded px-3 py-2 h-10 focus:outline-none focus:ring w-full"
                value={transactionPassword}
                onChange={(e) => setTransactionPassword(e.target.value)}
                disabled={isPending}
              />
              {showTransactionPassword ? (
                <FaEyeSlash
                  className="w-4 h-4 cursor-pointer"
                  onClick={() =>
                    setShowTransactionPassword(!showTransactionPassword)
                  }
                />
              ) : (
                <FaEye
                  className="w-4 h-4 cursor-pointer"
                  onClick={() =>
                    setShowTransactionPassword(!showTransactionPassword)
                  }
                />
              )}
            </div>
            {/* Empty cell for alignment */}
            <div></div>
            <div className="flex flex-col md:flex-row justify-end gap-3 mt-2">
              <button
                type="button"
                className="flex items-center gap-2 leading-8 px-4 rounded bg-[#232f3e] text-white font-medium uppercase text-sm cursor-pointer hover:opacity-90 w-full md:w-auto"
                onClick={() => !isPending && onClose()}
                disabled={isPending}
              >
                <FaArrowLeft /> BACK
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={`flex items-center gap-2 leading-8 px-4 cursor-pointer rounded uppercase text-white font-medium text-sm w-full md:w-auto ${
                  isPending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[var(--bg-primary)] hover:opacity-90"
                }`}
              >
                {isPending ? (
                  <>Processing...</>
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

export default PasswordModal;
