import { logout } from "@/helper/auth";
import React, { useState } from "react";
import { useCookies } from "react-cookie";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const TransactionPassword: React.FC = () => {
  const { state } = useLocation() as {
    state?: { transactionPassword?: string };
  };
  const navigate = useNavigate();
  const [, removeCookie] = useCookies(["Admin", "TechAdmin"]);
  const password = state?.transactionPassword;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // noop
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
      <div className="bg-white rounded-lg shadow p-6 w-[480px] max-w-full">
        <h2 className="text-xl font-normal mb-2">Account Created Successfully</h2>
        <div className="text-sm text-gray-700 mb-4 space-y-1">
          <p>
            This transaction password is shown only once. Please copy it or take a screenshot and store it securely.
          </p>
          <p className="text-gray-600">
            यह ट्रांजैक्शन पासवर्ड केवल एक बार दिखाया जा रहा है। कृपया इसे कॉपी करें या स्क्रीनशॉट लेकर सुरक्षित रखें।
          </p>
        </div>

        <div className="border rounded p-3 bg-gray-50 flex items-center justify-between">
          <div className="mr-3">
            <div className="text-xs text-gray-500">Transaction Password</div>
            <div className="text-lg font-medium tracking-wider">
              {password || "Unavailable"}
            </div>
          </div>
          <button
            className={`px-3 py-1 text-xs rounded cursor-pointer text-white transition-all ${
              copied
                ? "bg-green-600 animate-bounce"
                : "bg-[var(--bg-primary)] hover:opacity-90"
            }`}
            onClick={handleCopy}
            aria-live="polite"
          >
            {copied ? (
              <span className="inline-flex items-center gap-1">
                <i className="fa-solid fa-check"></i> Copied
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <i className="fa-regular fa-copy"></i> Copy
              </span>
            )}
          </button>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button
            className="px-4 py-2 text-sm rounded bg-[var(--bg-primary)] text-white cursor-pointer"
            onClick={() => logout(removeCookie as any, navigate)}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionPassword;
