import React, { useMemo, useState, useEffect } from "react";
import { useDrawerMetrics } from "@/components/context/DrawerMetricsContext";
import { useCookies } from "react-cookie";
import { baseUrl, getDecodedTokenData } from "@/helper/auth";
import { getAccountSummary } from "@/helper/user";
import { useQuery } from "@tanstack/react-query";

interface DrawerItem {
  label: string;
  value: string | number;
}

interface TopDrawerProps {
  items?: DrawerItem[]; // flat list (will be auto-grouped)
  groups?: DrawerItem[][]; // explicit 3-column grouping
  defaultOpen?: boolean;
}

const Drawer: React.FC<TopDrawerProps> = ({ items, groups, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [cookies] = useCookies(["Admin", "TechAdmin"]);
  const ctx = useDrawerMetrics();

  const upline: any = getDecodedTokenData(cookies) || {};
  const userId = upline?.user?.userId || "";
  const userType = upline?.user?.userType || "";
  
  // Debug logging for user data extraction
  console.log("🔍 Drawer - Upline data:", upline);
  console.log("🔍 Drawer - User ID:", userId);
  console.log("🔍 Drawer - User Type:", userType);
  console.log("🔍 Drawer - User object:", upline?.user);

  // Use React Query to fetch balance dashboard data
  const { data: balanceData, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['balanceDashboard', userId, userType],
    queryFn: async () => {
      console.log("🚀 Query function called with:", { userId, userType });
      
      if (!userId || !userType) {
        console.log("❌ Query disabled - missing userId or userType");
        return null;
      }
      
      console.log("📡 Making API call to getAccountSummary...");
      const response: any = await getAccountSummary({
        cookies,
        userId,
        userType,
      });
      
      console.log("📊 Balance Dashboard API Response:", response);
      console.log("👤 User ID:", userId, "User Type:", userType);
      
      if (response?.success && response?.data) {
        console.log("✅ Balance Data:", response.data);
        console.log("💰 Upper Level Credit Reference:", response.data.upperLevelCreditReference);
        return response.data;
      } else {
        console.error("❌ API Response Error:", response);
        throw new Error("Failed to fetch balance dashboard data");
      }
    },
    enabled: !!userId && !!userType, // Only run query if userId and userType exist
    refetchInterval: false, // No automatic refetching
    refetchIntervalInBackground: false, // Don't refetch in background
    staleTime: 0, // Data is immediately stale
    gcTime: 0, // Don't cache data at all (garbage collection time)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 3, // Retry failed requests 3 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Refetch data when drawer opens (no caching, fresh data every time)
  const handleDrawerToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // If opening the drawer, refetch the data
    if (newIsOpen) {
      refetch();
    }
  };

  // Manual API test - let's try calling the API directly
  const testApiCall = async () => {
    console.log("🧪 Testing API call manually...");
    try {
      const response = await getAccountSummary({
        cookies,
        userId: "test-user-id", // Let's try with a test ID
        userType: "admin",
      });
      console.log("🧪 Manual API test result:", response);
    } catch (error) {
      console.error("🧪 Manual API test error:", error);
    }
  };

  // Test API call on component mount
  useEffect(() => {
    testApiCall();
  }, []);

  // Debug logging
  console.log("📊 Current balanceData:", balanceData);
  console.log("💰 Upper Level Credit Reference value:", balanceData?.upperLevelCreditReference);
  console.log("🔄 Query state:", { loading, error, enabled: !!userId && !!userType });

  // Default 3-column groups to match the screenshot layout
  const defaultGroups: DrawerItem[][] = useMemo(
    () => [
      [
        { label: "Upper Level Credit Referance", value: balanceData?.upperLevelCreditReference || 0 },
        { label: "Total Master Balance", value: balanceData?.totalMasterBalance || 0 },
        { label: "Available Balance", value: balanceData?.availableBalance || 0 },
      ],
      [
        { label: "Down level Occupy Balance", value: balanceData?.downLevelOccupyBalance || 0 },
        { label: "Upper Level", value: balanceData?.upperLevel || 0 },
        { label: "Available Balance With Profit/Loss", value: balanceData?.availableBalanceWithProfitLoss || 0 },
      ],
      [
        { label: "Down Level Credit Referance", value: balanceData?.downLevelCreditReference || 0 },
        { label: "Down Level Profit/Loss", value: balanceData?.downLevelProfitLoss || 0 },
        { label: "My Profit/Loss", value: balanceData?.myProfitLoss || 0 },
      ],
    ],
    [balanceData]
  );

  // Normalize into 3 groups: prefer explicit groups, else auto-group items, else defaults
  const groupedMetrics: DrawerItem[][] = useMemo(() => {
    if (groups && groups.length > 0) return groups;
    if (ctx?.groups) return ctx.groups;
    if (items && items.length > 0) {
      const cols: DrawerItem[][] = [[], [], []];
      items.forEach((it, idx) => {
        cols[idx % 3].push(it);
      });
      return cols;
    }
    return defaultGroups;
  }, [groups, items, defaultGroups, ctx?.groups]);

  return (
    <section className="relative z-10 select-none">
      {/* Collapsible container */}
      <div
        className={`overflow-hidden transition-[max-height] duration-500 ease-in-out bg-[var(--bg-secondary)] text-[var(--text-secondary)] ${
          isOpen ? "max-h-[250px]" : "max-h-[40px]"
        }`}
      >
        {/* Control bar with centered toggle */}
        <div className="h-[40px] flex items-center justify-center">
          <button
            type="button"
            aria-label={isOpen ? "Collapse summary" : "Expand summary"}
            aria-expanded={isOpen}
            onClick={handleDrawerToggle}
            className="h-6 w-6 rounded-full flex justify-center items-center border-2 font-semibold border-white/70 text-white shadow cursor-pointer"
          >
            <i className={`fa-solid ${isOpen ? "fa-angle-up" : "fa-angle-down"} text-xs`}></i>
          </button>
        </div>
        <div className={`px-3 ${isOpen ? "py-2" : "py-0"}`}>
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-3 transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {loading ? (
              <div className="col-span-3 text-center text-white/70 text-xs py-4">
                Loading balance data...
              </div>
            ) : error ? (
              <div className="col-span-3 text-center text-red-300 text-xs py-4">
                Error loading balance data. Retrying...
              </div>
            ) : (
              groupedMetrics.map((col, colIdx) => (
                <div key={`col-${colIdx}`} className="space-y-2">
                  {col.map((m) => (
                    <div key={m.label} className="text-xs flex items-center justify-between">
                      <span className="opacity-90 whitespace-nowrap mr-2">{m.label}:</span>
                      <span className={`font-medium ${typeof m.value === "number" && m.value < 0 ? "text-red-300" : "text-white"}`}>
                        {typeof m.value === "number" ? m.value.toLocaleString("en-IN") : m.value}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Drawer;