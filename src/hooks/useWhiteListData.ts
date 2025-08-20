import { useQuery } from "@tanstack/react-query";
import { getWhiteListData, WhiteListData } from "../helper/auth";

interface UseWhiteListDataOptions {
  staleTime?: number;
  retry?: boolean | number;
  enabled?: boolean;
}

const useWhiteListData = (options?: UseWhiteListDataOptions) => {
  return useQuery<WhiteListData, Error>({
    queryKey: ["whiteListData"],
    queryFn: getWhiteListData,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export default useWhiteListData;