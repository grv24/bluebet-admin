import { io, Socket } from 'socket.io-client';

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

  /** Internal connection status flag */
  private _isConnected = false;
  
  /** Currently authenticated user information */
  private _currentUser: SocketUser | null = null;

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
  connect(userId: string, userType: 'admin' | 'techadmin'): Promise<void> {
    return new Promise((resolve, reject) => {
      let socketUrl: string = '';
      try {
        // console.log('🔌 Starting socket connection...', { userId, userType });
        
        // Disconnect existing connection if any
        this.disconnect();

        // Create new socket connection using environment variable
        socketUrl = import.meta.env.VITE_SERVER_URL || 'http://195.35.20.50'
        console.log('🔌 [DEBUG] Socket URL:', socketUrl);
        console.log('🔌 [DEBUG] Environment variables:', {
          VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
          NODE_ENV: import.meta.env.NODE_ENV,
          MODE: import.meta.env.MODE
        });
        
        console.log('🔌 [DEBUG] Creating socket connection with config:', {
          socketUrl,
          transports: ['polling', 'websocket'],
          upgrade: true,
          rememberUpgrade: false,
          timeout: 20000,
          forceNew: true,
          secure: false,
          rejectUnauthorized: false
        });
        
        this.socket = io(socketUrl, {
          transports: ['polling', 'websocket'],
          upgrade: true,
          rememberUpgrade: false,
          timeout: 20000,
          forceNew: true,
          secure: false,
          rejectUnauthorized: false,
        });

        this._currentUser = { userId, userType };
        // Set initial connection state to connecting to prevent disconnected flash
        this._isConnected = true;
        console.log('🔌 [DEBUG] Socket instance created:', {
          socketId: this.socket?.id,
          userId,
          userType,
          isConnected: this._isConnected
        });

        // Connection event handlers
        this.socket.on('connect', () => {
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
          this.socket?.emit('login', loginData);

          // Listen for any event to debug
          // this.socket?.onAny((eventName, ...args) => {
          //   console.log('🔌 Socket received event:', eventName, args);
          // });

          // Start heartbeat
          this.startHeartbeat();
          console.log('🔌 [DEBUG] Socket connection complete - Promise resolved');
          resolve();
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
          console.error('🔌 [DEBUG] Socket connection error:', {
            message: error.message,
            description: (error as any).description,
            context: (error as any).context,
            type: (error as any).type,
            socketUrl,
            userId,
            userType
          });
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
          this.handleForceLogout(data);
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

        // Connection timeout
        setTimeout(() => {
          if (!this._isConnected) {
            console.error('🔌 [DEBUG] Socket connection timeout after 10 seconds', {
              socketId: this.socket?.id,
              userId,
              userType,
              socketUrl
            });
            reject(new Error('Socket connection timeout'));
          }
        }, 10000);

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
      // console.log('🔌 Disconnecting socket...');
      
      // Emit logout event before disconnecting
      if (this._currentUser) {
        this.socket.emit('logout', {
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
      // console.log(`🔌 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        if (this._currentUser) {
          this.connect(this._currentUser.userId, this._currentUser.userType)
            .catch((error) => {
              // console.error('🔌 Reconnection failed:', error);
              this.handleReconnection();
            });
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      // console.error('🔌 Max reconnection attempts reached');
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
      console.warn('🔌 Cannot emit event: socket not connected');
    }
  }

  /**
   * Listens to custom events from server
   * 
   * Registers event listener for custom events from the server.
   * 
   * @param event - Event name to listen for
   * @param callback - Function to execute when event is received
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Removes event listener
   * 
   * Unregisters event listener for custom events.
   * 
   * @param event - Event name to stop listening for
   * @param callback - Optional specific callback to remove
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
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
      serverUrl: import.meta.env.VITE_SERVER_URL,
      allEnvVars: import.meta.env
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
