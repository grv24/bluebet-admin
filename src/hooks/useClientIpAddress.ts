import { useQuery } from "@tanstack/react-query";
import { getIpAddress, IpAddressData } from "../helper/auth";

const useClientIpAddress = () => {
    const {
        data: IpAddressData,
        isLoading,
        error,
      } = useQuery<IpAddressData, Error>({
        queryKey: ["ipAddress"],
        queryFn: getIpAddress,
        placeholderData: (previousData) => previousData,
        retry: 3,
        staleTime: 10 * 60 * 1000, // 10 minutes
      });

      return {
        IpAddressData,
        isLoading,
        error,
      };
};

export default useClientIpAddress;