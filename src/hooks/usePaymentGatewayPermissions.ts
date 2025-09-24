import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { getPaymentGatewayPermissions } from "@/helper/user";
import { baseUrl } from "@/helper/auth";

/**
 * Custom hook to fetch payment gateway permissions for the current user
 * 
 * @returns Query result containing payment gateway permissions data
 */
const usePaymentGatewayPermissions = () => {
  const [cookies] = useCookies(["Admin", "TechAdmin"]);

  // Get the appropriate auth token based on the base URL
  const authToken = cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];

  return useQuery({
    queryKey: ["paymentGatewayPermissions"],
    queryFn: async () => {
      if (!authToken) {
        throw new Error("No authentication token available");
      }
      return await getPaymentGatewayPermissions({ cookies: { [baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"]: authToken } });
    },
    enabled: !!authToken,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export default usePaymentGatewayPermissions;
