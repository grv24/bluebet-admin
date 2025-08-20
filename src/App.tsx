import React, { Suspense, createContext, useContext } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import withAuth from "@components/hoc/withAuth";
import Layout from "@layouts/index";
import { routes } from "@routes/index.tsx";
import { Loader } from "@components/index";
import useWhiteListData from "@/hooks/useWhiteListData";
import useClientIpAddress from "@/hooks/useClientIpAddress";
import { WhiteListData, IpAddressData } from "@/helper/auth";

// Global data context
interface GlobalDataContextType {
  whitelistData: WhiteListData | undefined;
  isLoadingWhitelist: boolean;
  whitelistError: Error | null;
  IpAddressData: IpAddressData | undefined;
  isLoadingIpAddress: boolean;
  ipAddressError: Error | null;
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

// Hook to use global data
export const useGlobalData = (): GlobalDataContextType | undefined => {
  const context = useContext(GlobalDataContext);
  return context;
};

// Global Data Provider Component
const GlobalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    data: whitelistData,
    isLoading: isLoadingWhitelist,
    error: whitelistError,
  } = useWhiteListData({ staleTime: 10000 });

  const {
    IpAddressData,
    isLoading: isLoadingIpAddress,
    error: ipAddressError,
  } = useClientIpAddress();

  // Show error if critical data failed to load
  if (whitelistError || ipAddressError) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">
        <div className="text-white text-center">
          <p className="text-red-300 mb-4">Failed to load required data</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-[var(--bg-primary)] px-4 py-2 rounded hover:bg-gray-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading while critical data is loading
  if (isLoadingWhitelist || isLoadingIpAddress) {
    return <Loader />;
  }

  const value: GlobalDataContextType = {
    whitelistData,
    isLoadingWhitelist,
    whitelistError,
    IpAddressData,
    isLoadingIpAddress,
    ipAddressError,
  };

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  );
};

const router = createBrowserRouter(
  routes.map((route) => {
    const Page = route.private ? withAuth(route.component) : route.component;

    return {
      path: route.path,
      element: (
        <Layout
          LayoutType={route.layout}
          title={route.title}
          description={route.description}
        >
          <Suspense fallback={<Loader />}>
            <Page  />
          </Suspense>
        </Layout>
      ),
    };
  })
);

const App: React.FC = () => {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  document.title = baseUrl?.includes("techadmin") ? "Tech Admin" : "Admin";
  return (
    <GlobalDataProvider>
      <RouterProvider router={router} />
    </GlobalDataProvider>
  );
};

export default App;
