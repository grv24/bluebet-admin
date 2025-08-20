import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import App from "./App.tsx";
import { CookiesProvider } from "react-cookie";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import UserLoginSocketContext from "./components/context/UserLoginStatusContext.tsx";

const queryClient = new QueryClient();
// console.log(import.meta.env.VITE_MODE);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserLoginSocketContext>
      <QueryClientProvider client={queryClient}>
        <CookiesProvider>
          <Toaster />
          <App />
          {import.meta.env.VITE_MODE === "development" && (
            <ReactQueryDevtools position="left" initialIsOpen={false} />
          )}
        </CookiesProvider>
      </QueryClientProvider>
    </UserLoginSocketContext>
  </StrictMode>
);
