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
  const userType = upline?.user?.userType || upline?.user?.__type || "";
  
  // Use React Query to fetch balance dashboard data
  const { data: balanceData, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['balanceDashboard', userId, userType],
    queryFn: async () => {
      console.log("🚀 Calling getAccountSummary API...");
      
      const response: any = await getAccountSummary({ cookies, userId, userType });
      
      console.log("📊 API Response:", response);
      
      if (response?.success && response?.data) {
        console.log("✅ Balance Dashboard Data:", response.data);
        return response.data;
      } else {
        console.error("❌ API Response Error:", response);
        throw new Error("Failed to fetch balance dashboard data");
      }
    },
    enabled: true, // Always enabled since API only needs cookies
    refetchInterval: false, // No automatic refetching
    refetchIntervalInBackground: false, // Don't refetch in background
    staleTime: 0, // Data is immediately stale
    gcTime: 0, // Don't cache data at all (garbage collection time)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 3, // Retry failed requests 3 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Debug logging
  console.log("🔍 Drawer Debug:", { upline, userId, userType, cookies });
  console.log("📊 Balance Data:", balanceData);
  console.log("🔄 Query State:", { loading, error });

  // Refetch data when drawer opens (no caching, fresh data every time)
  const handleDrawerToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // If opening the drawer, refetch the data
    if (newIsOpen) {
      refetch();
    }
  };



  // Default 3-column groups using fetched API data (matching the dashboard layout)
  const defaultGroups: DrawerItem[][] = useMemo(
    () => [
      [
        { label: "Upper Level Credit Reference", value: balanceData?.upperLevelCreditReference || 0 },
        { label: "Total Master Balance", value: balanceData?.totalMasterBalance || 0 },
        { label: "Available Balance", value: balanceData?.availableBalance || 0 },
      ],
      [
        { label: "Down Level Occupy Balance", value: balanceData?.downLevelOccupyBalance || 0 },
        { label: "Upper Level", value: balanceData?.upperLevel || 0 },
        { label: "Available Balance With Profit/Loss", value: balanceData?.availableBalanceWithProfitLoss || 0 },
      ],
      [
        { label: "Down Level Credit Reference", value: balanceData?.downLevelCreditReference || 0 },
        { label: "Down Level Profit/Loss", value: balanceData?.downLevelProfitLoss || 0 },
        { label: "My Profit/Loss", value: balanceData?.myProfitLoss || 0 },
      ],
    ],
    [balanceData]
  );

  // Normalize into groups: prioritize API data, then explicit groups, then items, then defaults
  const groupedMetrics: DrawerItem[][] = useMemo(() => {
    // Always use API data if available
    if (balanceData) {
      return defaultGroups;
    }
    // Fallback to other sources
    if (groups && groups.length > 0) return groups;
    if (ctx?.groups && ctx.groups.length > 0) return ctx.groups;
    if (items && items.length > 0) {
      const cols: DrawerItem[][] = [[], [], []];
      items.forEach((it, idx) => {
        cols[idx % 3].push(it);
      });
      return cols;
    }
    return defaultGroups;
  }, [balanceData, groups, items, defaultGroups, ctx?.groups]);

  // Debug logging for grouped metrics
  console.log("📋 Grouped Metrics:", groupedMetrics);

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
                      <span className={`font-medium`}>
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