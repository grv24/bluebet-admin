import { io, Socket } from 'socket.io-client';
import { getDecodedTokenData, baseUrl } from '@/helper/auth';
import toast from "react-hot-toast";

/**
 * Interface for socket user information
 * Contains user identification and role for socket room management
 */
export interface SocketUser {
  userId: string;        // Unique user identifier from authentication
  userType: 'admin' | 'techadmin'; // User role for proper room assignment
}

/**
 * Interface for force logout data received from server
 * Triggered when a user logs in from another location, causing current session to logout
 */
export interface ForceLogoutData {
  reason: string;        // Reason for force logout (e.g., "DUPLICATE_LOGIN", "SECURITY_ALERT")
  message?: string;      // Optional descriptive message from server
  timestamp: string;     // ISO timestamp of when force logout was triggered
  newLoginLocation?: string; // Optional location information of the new login
}

/**
 * Socket.IO Service Class
 * 
 * Manages real-time WebSocket communication with the server for admin/techadmin users.
 * Handles connection lifecycle, authentication, force logout scenarios,
 * and automatic reconnection for robust real-time functionality.
 * 
 * Key Features:
 * - Automatic connection management with environment-based server URL
 * - User authentication via loginId and userType
 * - Force logout detection and handling for security
 * - Heartbeat monitoring for connection health
 * - Automatic reconnection on network issues
 * - Room-based messaging for different user types (admin/techadmin)
 * - Connection status tracking for UI feedback
 */
class SocketService {
  /** Socket.IO instance for real-time communication */
  private socket: Socket | null = null;
  
  /** Current reconnection attempt counter */
  private reconnectAttempts = 0;
  
  /** Maximum number of reconnection attempts before giving up */
  private maxReconnectAttempts = 5;
  
  /** Base delay between reconnection attempts (in milliseconds) */
  private reconnectDelay = 1000;
  
  /** Interval reference for heartbeat monitoring */
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  /** Callback function for force logout events */
  private forceLogoutCallback: ((data: ForceLogoutData) => void) | null = null;
  
  /** Callback function for admin login notifications */
  private adminLoginCallback: ((data: any) => void) | null = null;

  /** Set to track registered event listeners to prevent duplicates */
  private registeredListeners: Set<string> = new Set();

  /** Internal connection status flag */
  private _isConnected = false;
  
  /** Currently authenticated user information */
  private _currentUser: SocketUser | null = null;
  
  /** Track casino room subscriptions */
  private casinoRoomSubscriptions: Set<string> = new Set();

  /**
   * Getter for internal connection status
   * @returns boolean indicating if socket is internally marked as connected
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Getter for current authenticated user
   * @returns SocketUser object or null if no user is authenticated
   */
  get currentUser(): SocketUser | null {
    return this._currentUser;
  }

  /**
   * Establishes connection to Socket.IO server
   * 
   * Creates a new socket connection, sets up event handlers, and authenticates
   * the user with the server. Handles connection lifecycle and error scenarios.
   * 
   * @param userId - Unique identifier for the user (loginId from JWT token)
   * @param userType - User role ('admin' or 'techadmin') for room assignment
   * @returns Promise that resolves when connection is established
   * @throws Error if connection fails or authentication is invalid
   */
  connect(userId: string, userType: 'admin' | 'techadmin'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let socketUrl: string = '';
      try {
        console.log('🔌 Starting socket connection...', { userId, userType });
        
        // Disconnect existing connection if any
        this.disconnect();
        
        // Clear any existing listeners to prevent duplicates
        this.registeredListeners.clear();

        // Create new socket connection using environment variable
        socketUrl = 'https://api.2xbat.com'; // Hardcoded to resolve import.meta.env issues
        console.log('🔌 [DEBUG] Socket URL:', socketUrl);
        console.log('🔌 [DEBUG] Environment variables:', {
          VITE_SERVER_URL: 'https://api.2xbat.com', // Hardcoded
          NODE_ENV: 'production', // Hardcoded
          MODE: 'production' // Hardcoded
        });

        // Get authentication token from cookies
        const getAuthToken = () => {
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            const tokenCookie = cookies.find(cookie => 
              cookie.trim().startsWith('Admin=') || 
              cookie.trim().startsWith('TechAdmin=')
            );
            return tokenCookie ? tokenCookie.split('=')[1] : null;
          }
          return null;
        };

        const authToken = getAuthToken();
        console.log('🔌 [DEBUG] Auth token available:', !!authToken);
        
        console.log('🔌 [DEBUG] Creating socket connection with config:', {
          socketUrl,
          transports: ['polling', 'websocket'], // Polling first, then upgrade to WebSocket
          upgrade: true,
          rememberUpgrade: true,
          timeout: 10000,
          forceNew: false,
          secure: true,
          rejectUnauthorized: false,
          note: 'Using polling first because WebSocket upgrade blocked by server'
        });
        
        // Prepare socket options - Use polling first, then upgrade to WebSocket
        const socketOptions: any = {
          // IMPORTANT: Polling first because WebSocket upgrade is blocked by server
          // Socket.IO will automatically upgrade to WebSocket if server allows it
          transports: ['polling', 'websocket'],
          upgrade: true, // Allow upgrade to WebSocket after initial polling connection
          rememberUpgrade: true, // Remember successful WebSocket upgrade
          timeout: 10000, // Increased timeout for polling
          forceNew: false, // Allow connection reuse
          secure: true,
          rejectUnauthorized: false,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: 5,
          withCredentials: false,
          // Optimize for WebSocket upgrade after polling connection
          upgradeTimeout: 10000, // Increased timeout for upgrade
          pingTimeout: 60000, // Increased for polling
          pingInterval: 25000, // Increased for polling
        };

        // Add authentication if token is available
        if (authToken) {
          socketOptions.auth = {
            token: authToken,
            userId: userId,
            userType: userType
          };
          // Let Socket.IO send auth via "auth" payload; avoid forbidden headers like Origin
          // The server should read token from the connection auth, not from custom headers.
        }

        this.socket = io(socketUrl, socketOptions);

        this._currentUser = { userId, userType };
        // Set initial connection state to connecting to prevent disconnected flash
        this._isConnected = true;
        console.log('🔌 [DEBUG] Socket instance created:', {
          socketId: this.socket?.id,
          userId,
          userType,
          isConnected: this._isConnected
        });

        // Connection timeout variable - will be cleared on successful connection
        let connectionTimeoutId: NodeJS.Timeout | null = null;

        // Connection event handlers
        this.socket.on('connect', () => {
          // Clear timeout if connection succeeds
          if (connectionTimeoutId) {
            clearTimeout(connectionTimeoutId);
            connectionTimeoutId = null;
          }

          console.log('🔌 [DEBUG] Socket connected successfully:', {
            socketId: this.socket?.id,
            userId,
            userType,
            reconnectAttempts: this.reconnectAttempts
          });
          this._isConnected = true;
          this.reconnectAttempts = 0;
          
          // Emit login event
          const loginData = {
            userId,
            userType,
            socketId: this.socket?.id,
            timestamp: new Date().toISOString(),
          };
          console.log('🔌 [DEBUG] Emitting login event:', loginData);
          this.socket?.emit('adminLogin', loginData);

          // 🚀 AUTO-RECONNECT: Restore active casino rooms after connection
          // Small delay to ensure login is processed first
          setTimeout(() => {
            if (this.socket?.connected && this.casinoRoomSubscriptions.size > 0) {
              const rooms = Array.from(this.casinoRoomSubscriptions);
              console.log('🎰 Auto-rejoining casino rooms after connection:', rooms);
              rooms.forEach((room) => {
                // Use original casing if available, otherwise use lowercase
                if (this.socket) {
                  this.socket.emit('joinCasino', room);
                }
              });
            }
          }, 100);

          // Start heartbeat
          this.startHeartbeat();
          console.log('🔌 [DEBUG] Socket connection complete - Promise resolved');
          resolve(true);
        });

        // Handle connecting state
        this.socket.on('connecting', () => {
          console.log('🔌 [DEBUG] Socket connecting...', {
            socketId: this.socket?.id,
            userId,
            userType
          });
          this._isConnected = false;
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 [DEBUG] Socket disconnected:', {
            reason,
            socketId: this.socket?.id,
            userId,
            userType,
            reconnectAttempts: this.reconnectAttempts
          });
          this._isConnected = false;
          this.stopHeartbeat();

          // Handle reconnection for unexpected disconnections
          if (reason === 'io server disconnect' || reason === 'io client disconnect') {
            // Server or client initiated disconnect - don't reconnect
            this._currentUser = null;
          } else {
            // Network issues - attempt reconnection
            this.handleReconnection();
          }
        });

        this.socket.on('connect_error', (error) => {
          // Only log WebSocket errors once, not repeatedly
          const errorType = (error as any).type || 'Unknown';
          const isWebSocketError = errorType === 'TransportError' && error.message === 'websocket error';
          
          if (isWebSocketError) {
            // Suppress repeated WebSocket transport errors - these are expected during polling connection
            // Socket.IO will try to upgrade to WebSocket after polling connection is established
            console.log('🔌 WebSocket direct connection failed (expected) - using polling transport. Will upgrade to WebSocket if server allows.');
          } else {
            // Log other connection errors (auth, CORS, etc.)
            console.error('🔌 [DEBUG] Socket connection error:', {
              message: error.message,
              description: (error as any).description,
              context: (error as any).context,
              type: (error as any).type,
              socketUrl,
              userId,
              userType,
              hasAuthToken: !!authToken,
            });
            
            // Check if it's a 400 error specifically
            if ((error as any).description === 400) {
              console.error('🔌 [DEBUG] 400 Bad Request - Possible causes:');
              console.error('1. Missing or invalid authentication token');
              console.error('2. Server not accepting the connection');
              console.error('3. CORS issues');
              console.error('4. Invalid socket configuration');
            }

            // Check if it's a CORS error
            if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
              console.error('🔌 [DEBUG] CORS Error detected - Possible solutions:');
              console.error('1. Server needs to allow localhost:3005 in CORS policy');
              console.error('2. Try using withCredentials: false');
              console.error('3. Check if server supports preflight OPTIONS requests');
              console.error('4. Verify Origin header is correct');
            }
          }
          
          this._isConnected = false;
          reject(error);
        });

        // Force logout event
        this.socket.on('forceLogout', (data: ForceLogoutData) => {
          console.log('🚨 [DEBUG] Force logout received:', {
            data,
            socketId: this.socket?.id,
            currentUser: this._currentUser
          });
          
          // Only show notification if we have a current user
          if (this._currentUser) {
            // Show notification to user
            toast.error(data.message || "You have been logged out from another device", {
              duration: 5000,
            });
            
            this.handleForceLogout(data);
          } else {
            console.log('🚨 [DEBUG] Force logout ignored - no current user');
          }
        });

        // Admin login notification event
        this.socket.on('adminLogin', (data: any) => {
          console.log('👤 [DEBUG] Admin login notification received:', {
            data,
            socketId: this.socket?.id,
            currentUser: this._currentUser
          });
          // You can add a callback for admin login notifications if needed
          if (this.adminLoginCallback) {
            this.adminLoginCallback(data);
          }
        });

        // Heartbeat events
        this.socket.on('ping', () => {
          console.log('🔌 [DEBUG] Received ping, sending pong', {
            socketId: this.socket?.id,
            timestamp: new Date().toISOString()
          });
          this.socket?.emit('pong');
        });

        // Add more debugging events
        this.socket.on('error', (error) => {
          console.error('🔌 [DEBUG] Socket error:', {
            error,
            socketId: this.socket?.id,
            userId,
            userType
          });
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔌 [DEBUG] Socket reconnected after', {
            attemptNumber,
            socketId: this.socket?.id,
            userId,
            userType
          });
          
          // 🚀 AUTO-RECONNECT: Restore active casino room after reconnection
          if (this.casinoRoomSubscriptions.size > 0) {
            const rooms = Array.from(this.casinoRoomSubscriptions);
            console.log('🎰 Auto-rejoining casino rooms after reconnection:', rooms);
            rooms.forEach((room) => {
              if (this.socket?.connected) {
                this.socket.emit('joinCasino', room);
              }
            });
          }
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔌 [DEBUG] Socket reconnect attempt:', {
            attemptNumber,
            socketId: this.socket?.id,
            userId,
            userType
          });
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('🔌 [DEBUG] Socket reconnect error:', {
            error,
            socketId: this.socket?.id,
            userId,
            userType
          });
        });

        this.socket.on('reconnect_failed', () => {
          console.error('🔌 [DEBUG] Socket reconnect failed', {
            socketId: this.socket?.id,
            userId,
            userType,
            reconnectAttempts: this.reconnectAttempts
          });
        });

        // Connection timeout - reduced to 5 seconds for faster feedback
        connectionTimeoutId = setTimeout(() => {
          // Check both internal flag and actual socket connection state
          const isActuallyConnected = this.socket?.connected || this._isConnected;
          
          if (!isActuallyConnected) {
            console.error('🔌 [DEBUG] Socket connection timeout after 5 seconds', {
              socketId: this.socket?.id,
              socketConnected: this.socket?.connected,
              internalConnected: this._isConnected,
              userId,
              userType,
              socketUrl
            });
            
            // Only reject if socket is definitely not connected
            if (!this.socket?.connected) {
              reject(new Error('Socket connection timeout'));
            } else {
              // Socket is connected but flag isn't set - resolve anyway
              console.log('🔌 [DEBUG] Socket connected but internal flag not set - resolving connection');
              this._isConnected = true;
              resolve(true);
            }
          } else {
            // Connection successful - timeout fired but connection exists
            console.log('🔌 [DEBUG] Socket connected - timeout check passed', {
              socketId: this.socket?.id,
              socketConnected: this.socket?.connected
            });
          }
        }, 5000); // Reduced from 20s to 5s for faster timeout

      } catch (error) {
        console.error('🔌 [DEBUG] Socket connection failed:', {
          error,
          userId,
          userType,
          socketUrl
        });
        reject(error);
      }
    });
  }

  /**
   * Disconnects from Socket.IO server
   * 
   * Properly closes the socket connection, emits logout event to server,
   * cleans up internal state, and stops heartbeat monitoring.
   * Should be called when user logs out or component unmounts.
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      
      // Clear registered listeners to prevent duplicates on reconnect
      this.registeredListeners.clear();
      
      // Emit logout event before disconnecting
      if (this._currentUser) {
        this.socket.emit('adminLogout', {
          userId: this._currentUser.userId,
          userType: this._currentUser.userType,
          socketId: this.socket.id,
          timestamp: new Date().toISOString(),
        });
      }

      this.socket.disconnect();
      this.socket = null;
      this._isConnected = false;
      this._currentUser = null;
      this.stopHeartbeat();
      this.casinoRoomSubscriptions.clear();
    }
  }

  /**
   * Checks if socket is currently connected
   * 
   * Determines connection status by checking both socket instance existence
   * and actual connection state. Prevents brief "disconnected" flashes
   * during connection establishment.
   * 
   * @returns boolean indicating if socket is connected and ready for communication
   */
  isSocketConnected(): boolean {
    // If we have a socket instance and it's connected, consider it connected
    if (this.socket && this.socket.connected) {
      return true;
    }
    
    // If we have a socket instance and we have a current user, 
    // consider it connected even if not fully connected yet
    // This prevents the brief "disconnected" flash
    if (this.socket && this._currentUser) {
      return true;
    }
    
    return false;
  }

  /**
   * Gets detailed connection status information
   * 
   * Provides comprehensive connection state including connection status,
   * connecting state, socket existence, and current user information.
   * Used by UI components to display accurate connection status.
   * 
   * @returns Object containing detailed connection status information
   */
  getConnectionStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    hasSocket: boolean;
    socketId?: string;
    currentUser: { userId: string; userType: string } | null;
  } {
    const hasSocket = !!this.socket;
    const hasUser = !!this._currentUser;
    const isFullyConnected = this.socket?.connected === true;
    
    return {
      isConnected: this.isSocketConnected(),
      isConnecting: hasSocket && hasUser && !isFullyConnected,
      hasSocket,
      socketId: this.socket?.id,
      currentUser: this._currentUser,
    };
  }

  /**
   * Gets immediate connection status for initial component render
   * 
   * Used to prevent brief "disconnected" flashes when components first mount.
   * Returns true if socket instance and user data exist, regardless of
   * actual connection state, to provide immediate UI feedback.
   * 
   * @returns boolean indicating if socket should be considered connected for UI
   */
  getImmediateConnectionStatus(): boolean {
    // If we have a socket and user, consider it connected immediately
    // This prevents the brief disconnected flash on component mount
    return !!(this.socket && this._currentUser);
  }

  /**
   * Sets callback function for force logout events
   * 
   * Registers a callback that will be executed when the server sends
   * a force logout event (e.g., when user logs in from another location).
   * 
   * @param callback - Function to execute when force logout is triggered
   */
  onForceLogout(callback: (data: ForceLogoutData) => void): void {
    this.forceLogoutCallback = callback;
  }

  /**
   * Sets callback function for admin login notifications
   * 
   * Registers a callback that will be executed when the server sends
   * admin login notification events.
   * 
   * @param callback - Function to execute when admin login notification is received
   */
  onAdminLogin(callback: (data: any) => void): void {
    this.adminLoginCallback = callback;
  }

  /**
   * Handles force logout events from server
   * 
   * Processes force logout data, disconnects socket, and executes
   * registered callback function. Called when server detects duplicate login.
   * 
   * @param data - Force logout data containing reason and metadata
   */
  private handleForceLogout(data: ForceLogoutData): void {
    // Disconnect socket
    this.disconnect();
    
    // Call the callback if set
    if (this.forceLogoutCallback) {
      this.forceLogoutCallback(data);
    }
  }

  /**
   * Handles automatic reconnection attempts
   * 
   * Implements exponential backoff strategy for reconnection attempts.
   * Attempts to reconnect up to maxReconnectAttempts times with increasing delays.
   * Resets connection state if max attempts are reached.
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this._currentUser) {
      this.reconnectAttempts++;
      console.log(`🔌 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        if (this._currentUser) {
          this.connect(this._currentUser.userId, this._currentUser.userType)
            .catch((error) => {
              console.error('🔌 Reconnection failed:', error);
              this.handleReconnection();
            });
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('🔌 Max reconnection attempts reached');
      this._currentUser = null;
    }
  }

  /**
   * Starts heartbeat monitoring to maintain connection health
   * 
   * Sends periodic ping events to server every 30 seconds to keep
   * connection alive and detect connection issues early.
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stops heartbeat monitoring
   * 
   * Clears the heartbeat interval to stop sending ping events.
   * Called when disconnecting or when connection is lost.
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Emits custom event to server
   * 
   * Sends custom events to the server if socket is connected.
   * Provides warning if socket is not connected.
   * 
   * @param event - Event name to emit
   * @param data - Data to send with the event
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('🔌 Cannot emit event: socket not connected', {
        event,
        data,
        socketExists: !!this.socket,
        socketConnected: this.socket?.connected,
        currentUser: this._currentUser
      });
      
      // Try to reconnect if we have user data
      if (this._currentUser) {
        console.log('🔌 Attempting to reconnect for event emission...');
        this.connect(this._currentUser.userId, this._currentUser.userType)
          .then(() => {
            console.log('🔌 Reconnected, retrying event emission');
            if (this.socket?.connected) {
              this.socket.emit(event, data);
            }
          })
          .catch((error) => {
            console.error('🔌 Failed to reconnect for event emission:', error);
          });
      }
    }
  }

  /**
   * Listens to custom events from server
   * 
   * Registers event listener for custom events from the server.
   * Prevents duplicate listeners by tracking registered events.
   * 
   * @param event - Event name to listen for
   * @param callback - Function to execute when event is received
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      // Check if listener is already registered to prevent duplicates
      if (this.registeredListeners.has(event)) {
        console.log(`🔌 [DEBUG] Event listener for '${event}' already registered, skipping duplicate`);
        return;
      }
      
      // Wrap callback to log raw data received from server
      const wrappedCallback = (...args: any[]) => {
        console.log(`🔌 [RAW EVENT] Received '${event}' from server:`, {
          event,
          args,
          argsCount: args.length,
          firstArg: args[0],
          timestamp: new Date().toISOString(),
        });
        callback(...args);
      };
      
      this.socket.on(event, wrappedCallback);
      this.registeredListeners.add(event);
      console.log(`🔌 [DEBUG] Registered event listener for '${event}'`);
    }
  }

  /**
   * Removes event listener
   * 
   * Unregisters event listener for custom events.
   * Updates the registered listeners tracking.
   * 
   * @param event - Event name to stop listening for
   * @param callback - Optional specific callback to remove
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
      
      // Remove from registered listeners tracking
      this.registeredListeners.delete(event);
      console.log(`🔌 [DEBUG] Removed event listener for '${event}'`);
    }
  }

  /**
   * Debug method to test connection and log detailed information
   * 
   * Logs comprehensive connection information including socket existence,
   * connection status, user data, and environment variables for debugging.
   * Only used during development and troubleshooting.
   */
  debugConnection(): void {
    console.log("🔌 Socket Debug Info:", {
      socketExists: !!this.socket,
      socketId: this.socket?.id,
      socketConnected: this.socket?.connected,
      internalConnected: this._isConnected,
      currentUser: this._currentUser,
      serverUrl: 'https://api.2xbat.com', // Hardcoded
      allEnvVars: 'production' // Hardcoded to resolve import.meta.env issues
    });
  }

  /**
   * Forces reconnection to the server
   * 
   * Manually triggers reconnection process if current user data exists.
   * Useful for testing or recovering from connection issues.
   * 
   * @throws Error if no current user data is available
   */
  async forceReconnect(): Promise<void> {
    console.log("🔌 Force reconnection requested");
    if (this._currentUser) {
      await this.connect(this._currentUser.userId, this._currentUser.userType);
    } else {
      console.error("🔌 Cannot force reconnect: no current user");
    }
  }

  /**
   * Manual force logout method for testing purposes
   * 
   * Simulates a force logout event for testing the force logout flow.
   * Creates test data and triggers the force logout handler.
   * Only used during development and testing.
   */
  manualForceLogout(): void {
    console.log("🔌 Manual force logout triggered");
    const testData: ForceLogoutData = {
      reason: "MANUAL_TEST",
      message: "Manual force logout test",
      timestamp: new Date().toISOString()
    };
    this.handleForceLogout(testData);
  }

  /**
   * Ensure socket is connected before emitting
   * 
   * Checks if socket is connected and attempts to connect if not.
   * Returns a promise that resolves when socket is ready.
   * 
   * @returns Promise that resolves when socket is connected
   */
  async ensureConnected(): Promise<boolean> {
    if (this.socket?.connected) {
      return true;
    }

    if (!this._currentUser) {
      console.warn('🔌 Cannot ensure connection: no current user');
      return false;
    }

    try {
      await this.connect(this._currentUser.userId, this._currentUser.userType);
      return this.socket?.connected || false;
    } catch (error) {
      console.error('🔌 Failed to ensure connection:', error);
      return false;
    }
  }

  /**
   * Emit event with connection guarantee
   * 
   * Ensures socket is connected before emitting the event.
   * 
   * @param event - Event name to emit
   * @param data - Data to send with the event
   * @returns Promise that resolves when event is emitted
   */
  async emitWithConnection(event: string, data: any): Promise<void> {
    const isConnected = await this.ensureConnected();
    if (isConnected) {
      this.socket?.emit(event, data);
    } else {
      throw new Error('Failed to establish socket connection');
    }
  }

  /**
   * Join a casino room to receive real-time updates
   * Matches working implementation: emits 'joinCasino' with gameSlug string
   */
  joinCasino(gameSlug: string): void {
    if (!gameSlug || typeof gameSlug !== 'string') {
      console.error('🎰 Invalid gameSlug provided:', gameSlug);
      return;
    }

    const room = gameSlug.toLowerCase();
    this.casinoRoomSubscriptions.add(room);

    if (this.socket?.connected) {
      // Match working implementation: emit 'joinCasino' with gameSlug string directly
      this.socket.emit('joinCasino', gameSlug);
      console.log('🎰 [JOIN ROOM] Emitting joinCasino for:', gameSlug, {
        timestamp: new Date().toISOString(),
        socketConnected: this.socket.connected,
        socketId: this.socket.id,
      });
    } else {
      console.warn('🎰 Cannot join casino room, socket not connected. Room will be joined when connected:', room);
      // Store room to join when socket connects
    }
  }

  /**
   * Leave an active casino room to stop updates
   * Matches working implementation: emits 'leaveCasino' with gameSlug string
   */
  leaveCasino(gameSlug: string): void {
    if (!gameSlug || typeof gameSlug !== 'string') {
      console.error('🎰 Invalid gameSlug provided:', gameSlug);
      return;
    }

    const room = gameSlug.toLowerCase();
    this.casinoRoomSubscriptions.delete(room);

    if (this.socket?.connected) {
      // Match working implementation: emit 'leaveCasino' with gameSlug string directly
      this.socket.emit('leaveCasino', gameSlug);
      console.log('🎰 [LEAVE ROOM] Emitting leaveCasino for:', gameSlug, {
        timestamp: new Date().toISOString(),
        socketConnected: this.socket.connected,
        socketId: this.socket.id,
      });
    } else {
      console.warn('🎰 Cannot leave casino room, socket not connected:', room);
    }
  }

  /**
   * Get a list of currently subscribed casino rooms
   */
  getCasinoSubscriptions(): string[] {
    return Array.from(this.casinoRoomSubscriptions);
  }
}

/**
 * Singleton instance of SocketService
 * 
 * Exported as the main socket service instance to be used throughout the application.
 * Ensures consistent socket connection management across all components.
 */
export const socketService = new SocketService();

/**
 * Global socket service access for debugging
 * 
 * Makes socketService available on window object for browser console debugging.
 * Only available in browser environment.
 */
if (typeof window !== 'undefined') {
  (window as any).socketService = socketService;
}

export default socketService;