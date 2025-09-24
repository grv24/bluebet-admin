import { lazyWithErrorHandling } from "@/utils/lazyLoad";

export const SignIn = lazyWithErrorHandling(() => import("./auth/SignIn"));
export const AuthChangePassword = lazyWithErrorHandling(() => import("./auth/ChangePassword"));
export const MarketAnalysis = lazyWithErrorHandling(() => import("./MarketAnalysis"));
export const ClientList = lazyWithErrorHandling(() => import("./client/ClientList"));
export const LiveMarket = lazyWithErrorHandling(() => import("./LiveMarket"));
export const VirtualMarket = lazyWithErrorHandling(() => import("./VirtualMarket"));
export const MultiLogin = lazyWithErrorHandling(() => import("./MultiLogin"));


// report
export const Statement = lazyWithErrorHandling(() => import("./report/Statement"));
export const CurrentBet = lazyWithErrorHandling(() => import("./report/CurrentBet"));
export const General = lazyWithErrorHandling(() => import("./report/General"));
export const GameReport = lazyWithErrorHandling(() => import("./report/GameReport"));
export const CasinoReport = lazyWithErrorHandling(() => import("./report/CasinoReport"));
export const ProfitLoss = lazyWithErrorHandling(() => import("./report/ProfitLoss"));
export const CasinoResult = lazyWithErrorHandling(() => import("./report/CasinoResult"));

export const Verification = lazyWithErrorHandling(() => import("./Verification"));
export const ChangePassword = lazyWithErrorHandling(() => import("./ChangePassword"));
export const Sports = lazyWithErrorHandling(() => import("./Sports"));
export const AddClient = lazyWithErrorHandling(() => import("./client/AddClient"));
export const TransactionPassword = lazyWithErrorHandling(() => import("./client/TransactionPassword"));
export const PaymentGateway = lazyWithErrorHandling(() => import("./PaymentGateway"));

export const NotFound = lazyWithErrorHandling(() => import("./NotFound"));