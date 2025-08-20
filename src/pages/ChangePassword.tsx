import { updatePassword, baseUrl } from "@/helper/auth";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useCookies } from "react-cookie";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordType, setPasswordType] = useState<"current" | "transaction">("current");
  const [isLoading, setIsLoading] = useState(false);
  
  const [cookies] = useCookies(["Admin", "TechAdmin"]);

  // Clear password fields when switching between types
  useEffect(() => {
    setCurrentPassword("");
    setTransactionPassword("");
    // setShowCurrentPassword(false);
  }, [passwordType]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New Password and Confirm Password do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New Password must be at least 8 characters long");
      return;
    }

    // Validate the selected password type
    if (passwordType === "current") {
      if (!currentPassword.trim()) {
        toast.error("Current Password is required");
        return;
      }
    } else {
      if (!transactionPassword.trim()) {
        toast.error("Transaction Password is required");
        return;
      }
    }

    const token = cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];
    if (!token) {
      toast.error("Authentication required. Please login again.");
      return;
    }

    setIsLoading(true);
    try {
      const passwordToUse = passwordType === "current" ? currentPassword : transactionPassword;
      const response = await updatePassword(newPassword, passwordToUse, token);
      if (response.success) {
        toast.success(response.message || "Password changed successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
        setTransactionPassword("");
      } else {
        toast.error(response.message || "Failed to change password");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen w-screen">
      <h2 className="m-0 text-lg font-normal mb-4">Change Password</h2>
      <div className="rounded-lg p-4 max-w-xl">
        {/* Password Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Select Verification Method</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="passwordType"
                value="current"
                checked={passwordType === "current"}
                onChange={(e) => setPasswordType(e.target.value as "current" | "transaction")}
                className="mr-2 text-[var(--bg-primary)] focus:ring-[var(--bg-primary)]"
              />
              <span className="text-sm font-medium">Current Password</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="passwordType"
                value="transaction"
                checked={passwordType === "transaction"}
                onChange={(e) => setPasswordType(e.target.value as "current" | "transaction")}
                className="mr-2 text-[var(--bg-primary)] focus:ring-[var(--bg-primary)]"
              />
              <span className="text-sm font-medium">Transaction Password</span>
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:border-gray-300 focus:ring-0 outline-none transition"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <FaEyeSlash className="w-4 h-4" />
              ) : (
                <FaEye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:border-gray-300 focus:ring-0 outline-none transition"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <FaEyeSlash className="w-4 h-4" />
              ) : (
                <FaEye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* Conditional Password Field */}
        {passwordType === "current" ? (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <div className="relative">
              <input
                type="text"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:border-gray-300 focus:ring-0 outline-none transition"
                placeholder="Enter current password"
              />
              {/* <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? (
                  <FaEyeSlash className="w-4 h-4" />
                ) : (
                  <FaEye className="w-4 h-4" />
                )}
              </button> */}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Transaction Password</label>
            <input
              type="text"
              value={transactionPassword}
              onChange={(e) => setTransactionPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-gray-300 focus:ring-0 outline-none transition"
              placeholder="Enter transaction password"
            />
          </div>
        )}
        <button
          onClick={handleChangePassword}
          disabled={isLoading}
          className="px-6 py-2 rounded font-medium text-white text-base bg-[var(--bg-primary)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Changing...
            </>
          ) : (
            "Change Password"
          )}
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;
