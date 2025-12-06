import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Socket } from "socket.io-client";
import socketService, { SocketUser } from "@/utils/socketService";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  casinoData: any;
  setCasinoData: (data: any) => void;
  subscribeToCasinoUpdates: (
    gameSlug: string,
    callback: (data: any) => void
  ) => void;
  unsubscribeFromCasinoUpdates: (gameSlug: string) => void;
  joinCasinoRoom: (gameSlug: string) => void;
  leaveCasinoRoom: (gameSlug: string) => void;
  getCasinoSubscriptions: () => string[];
  connectionStatus: {
    isConnected: boolean;
    isConnecting: boolean;
    hasSocket: boolean;
    socketId?: string;
    currentUser: SocketUser | null;
  };
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
  const context = useContext(SocketContext);

  if (!context) {
    console.error("useSocketContext must be used within a SocketProvider");
    return {
      socket: null,
      isConnected: false,
      casinoData: null,
      setCasinoData: () => {},
      subscribeToCasinoUpdates: () => {},
      unsubscribeFromCasinoUpdates: () => {},
      joinCasinoRoom: () => {},
      leaveCasinoRoom: () => {},
      getCasinoSubscriptions: () => [],
      connectionStatus: {
        isConnected: false,
        isConnecting: false,
        hasSocket: false,
        currentUser: null,
      },
    };
  }

  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
  userId: string;
  userType: "admin" | "techadmin";
  onLeaveOldSignIn: () => void;
  onBalanceUpdate: (data: any) => void;
  onExposureUpdate: (data: any) => void;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  userId,
  userType,
  onLeaveOldSignIn,
  onBalanceUpdate,
  onExposureUpdate,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(
    socketService.isSocketConnected()
  );
  const [casinoData, setCasinoData] = useState<any>(null);
  const casinoSubscribers = useRef<Map<string, (data: any) => void>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    isConnecting: boolean;
    hasSocket: boolean;
    socketId?: string;
    currentUser: SocketUser | null;
  }>({
    isConnected: false,
    isConnecting: false,
    hasSocket: false,
    socketId: undefined,
    currentUser: null,
  });

  const onLeaveOldSignInRef = useRef(onLeaveOldSignIn);
  const onBalanceUpdateRef = useRef(onBalanceUpdate);
  const onExposureUpdateRef = useRef(onExposureUpdate);

  useEffect(() => {
    onLeaveOldSignInRef.current = onLeaveOldSignIn;
    onBalanceUpdateRef.current = onBalanceUpdate;
    onExposureUpdateRef.current = onExposureUpdate;
  }, [onLeaveOldSignIn, onBalanceUpdate, onExposureUpdate]);

  const processCasinoUpdate = useCallback((data: any) => {
    let casinoType =
      data?.casinoType || data?.type || data?.gameType || data?.data?.casinoType;

    if (!casinoType) {
      console.log("🎰 No casino type found in data:", data);
      return;
    }

    const gameKey = String(casinoType).toLowerCase();
    const callback = casinoSubscribers.current.get(gameKey);

    if (callback) {
      callback(data);
    } else {
      console.log(
        "🎰 No subscriber found for:",
        gameKey,
        "Available subscribers:",
        Array.from(casinoSubscribers.current.keys())
      );
    }
  }, []);

  useEffect(() => {
    if (!userId || !userType) {
      setIsConnected(false);
      return;
    }

    let isMounted = true;

    const connectSocket = async () => {
      try {
        console.log("SocketProvider: Connecting socket", { userId, userType });
        await socketService.connect(userId, userType);
        if (!isMounted) return;

        setIsConnected(true);
        setConnectionStatus(socketService.getConnectionStatus() as any);
        setupEventListeners();
      } catch (error) {
        console.error("SocketProvider: Socket connection error:", error);
        if (isMounted) {
          setIsConnected(false);
          setConnectionStatus(socketService.getConnectionStatus() as any);
        }
      }
    };

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus(socketService.getConnectionStatus() as any);

      const currentRooms = socketService.getCasinoSubscriptions();
      currentRooms.forEach((room) => socketService.joinCasino(room));
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus(socketService.getConnectionStatus() as any);
    };

    const setupEventListeners = () => {
      socketService.on("recievechips", (data) => {
        onBalanceUpdateRef.current(data);
      });

      socketService.on("updatechips", (data) => {
        onBalanceUpdateRef.current(data);
      });

      socketService.on("exposure", (data) => {
        onExposureUpdateRef.current(data);
      });

      socketService.on("updateExposure", (data) => {
        onExposureUpdateRef.current(data);
      });

      socketService.on("leaveOldSignIn", () => {
        onLeaveOldSignInRef.current();
      });

      const casinoEvents = [
        "casinoOddsUpdate",
        "casinoGameUpdate",
        "casinoUpdate",
      ];

      casinoEvents.forEach((event) => {
        socketService.on(event, (data) => {
          setCasinoData(data);
          processCasinoUpdate(data);
        });
      });

      socketService.on("connect", handleConnect);
      socketService.on("disconnect", handleDisconnect);
      socketService.on("connect_error", handleDisconnect);
    };

    connectSocket();

    return () => {
      isMounted = false;
      
      // Remove event listeners
      socketService.off("recievechips");
      socketService.off("updatechips");
      socketService.off("exposure");
      socketService.off("updateExposure");
      socketService.off("leaveOldSignIn");
      socketService.off("casinoOddsUpdate");
      socketService.off("casinoGameUpdate");
      socketService.off("casinoUpdate");
      socketService.off("connect");
      socketService.off("disconnect");
      socketService.off("connect_error");
      
      // Only disconnect if userId/userType actually changed (real unmount)
      // In React Strict Mode, the effect cleanup runs but userId/userType don't change
      // So we check if the socket is still for the same user before disconnecting
      const status = socketService.getConnectionStatus();
      const isSameUser = 
        status.currentUser?.userId === userId && 
        status.currentUser?.userType === userType;
      
      if (!isSameUser) {
        // User changed, safe to disconnect
        console.log('🔌 Disconnecting socket - user changed');
        socketService.disconnect();
      } else {
        // Same user - might be React Strict Mode cleanup, don't disconnect
        // The socket will be reused when the effect runs again
        console.log('🔌 Skipping disconnect - same user (likely React Strict Mode)');
      }
    };
  }, [userId, userType, processCasinoUpdate]);

  const subscribeToCasinoUpdates = useCallback(
    (gameSlug: string, callback: (data: any) => void) => {
      if (!gameSlug) return;
      const gameKey = gameSlug.toLowerCase();
      casinoSubscribers.current.set(gameKey, callback);
      console.log("🎰 Subscribed to casino updates for:", gameKey);
    },
    []
  );

  const unsubscribeFromCasinoUpdates = useCallback((gameSlug: string) => {
    if (!gameSlug) return;
    const gameKey = gameSlug.toLowerCase();
    casinoSubscribers.current.delete(gameKey);
    console.log("🎰 Unsubscribed from casino updates for:", gameKey);
  }, []);

  const joinCasinoRoom = useCallback(
    (gameSlug: string) => {
      if (!gameSlug) return;
      socketService.joinCasino(gameSlug);
    },
    []
  );

  const leaveCasinoRoom = useCallback((gameSlug: string) => {
    if (!gameSlug) return;
    socketService.leaveCasino(gameSlug);
  }, []);

  const getCasinoSubscriptions = useCallback(() => {
    return socketService.getCasinoSubscriptions();
  }, []);

  const value: SocketContextType = {
    socket: null,
    isConnected,
    casinoData,
    setCasinoData,
    subscribeToCasinoUpdates,
    unsubscribeFromCasinoUpdates,
    joinCasinoRoom,
    leaveCasinoRoom,
    getCasinoSubscriptions,
    connectionStatus,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;

