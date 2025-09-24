import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { soundManager } from '../utils/sounds';
import { SocketContextType, Message } from '../types';

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: string[]}>({});
  const socketRef = useRef<Socket | null>(null);
  const connectionAttemptRef = useRef<boolean>(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user && !socketRef.current && !connectionAttemptRef.current) {
      connectionAttemptRef.current = true;
      console.log('🔌 Initializing Socket.IO connection for user:', user.username);
      console.log('🌐 Socket URL:', process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
      console.log('🔧 Environment variables:', {
        REACT_APP_SOCKET_URL: process.env.REACT_APP_SOCKET_URL,
        NODE_ENV: process.env.NODE_ENV,
        window_location: window.location.href
      });
      
      // Create socket connection using cookies for auth
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      console.log('🔗 Creating socket connection to:', socketUrl);
      
      const socketOptions = {
        withCredentials: true, // This will send cookies including JWT token
        transports: ['polling', 'websocket'], // Allow HTTP polling fallback
        upgrade: true,
        rememberUpgrade: true,
        forceNew: true, // Force new connection
        autoConnect: true, // Ensure auto connection
        timeout: 10000, // 10 second timeout
      };
      
      console.log('🔧 Socket options:', socketOptions);
      const newSocket = io(socketUrl, socketOptions);
      
      console.log('🔄 Socket.IO instance created:', newSocket);
      console.log('🔌 Initial socket state:', {
        connected: newSocket.connected,
        disconnected: newSocket.disconnected,
        id: newSocket.id
      });
      
      socketRef.current = newSocket;
      setSocket(newSocket);
      
      // Monitor connection status
      const checkConnection = () => {
        console.log('🔄 Connection status check:', {
          connected: newSocket.connected,
          disconnected: newSocket.disconnected,
          id: newSocket.id,
          transport: newSocket.io?.engine?.transport?.name
        });
      };
      
      // Check every 2 seconds for the first 10 seconds
      const statusInterval = setInterval(checkConnection, 2000);
      setTimeout(() => clearInterval(statusInterval), 10000);
      
      // Force connection if it doesn't auto-connect
      setTimeout(() => {
        if (!newSocket.connected) {
          console.log('🔄 Forcing Socket.IO connection after 1 second...');
          newSocket.connect();
        }
      }, 1000);
      
      // Additional force after 3 seconds
      setTimeout(() => {
        if (!newSocket.connected) {
          console.log('🔄 Forcing Socket.IO connection again after 3 seconds...');
          newSocket.disconnect();
          newSocket.connect();
        }
      }, 3000);

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket.IO Connected! ID:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket.IO Disconnected. Reason:', reason);
        setConnected(false);
      });
      
      newSocket.on('connecting', () => {
        console.log('🔄 Socket.IO Connecting...');
      });
      
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket.IO Reconnected after', attemptNumber, 'attempts');
        setConnected(true);
      });
      
      newSocket.on('reconnecting', (attemptNumber) => {
        console.log('🔄 Socket.IO Reconnecting... Attempt:', attemptNumber);
      });

      // Message event handlers
      newSocket.on('new_message', (message: Message) => {
        setMessages(prev => [...prev, message]);
        // Play sound notification for new messages (except your own)
        if (message.user_id !== user?.id) {
          soundManager.newMessage();
        }
      });

      // Typing indicators
      newSocket.on('user_typing', ({ userId, username, channelId }: any) => {
        setTypingUsers(prev => ({
          ...prev,
          [channelId]: [...(prev[channelId] || []).filter(u => u !== username), username]
        }));
      });

      newSocket.on('user_stopped_typing', ({ userId, username, channelId }: any) => {
        setTypingUsers(prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).filter(u => u !== username)
        }));
      });

      // Error handling
      newSocket.on('connect_error', (error: any) => {
        console.error('❌ Socket.IO Connection Error:', error);
        console.error('Error details:', {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type
        });
        setConnected(false);
      });
      
      newSocket.on('error', (error: any) => {
        console.error('⚠️ Socket.IO Error:', error);
        setConnected(false);
      });
      
      newSocket.on('reconnect_error', (error: any) => {
        console.error('🔄 Socket.IO Reconnect Error:', error);
      });
      
      newSocket.on('reconnect_failed', () => {
        console.error('❌ Socket.IO Reconnect Failed - giving up');
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else if (!user && socketRef.current) {
      // User logged out, close socket
      console.log('❌ User logged out, closing Socket.IO connection');
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setMessages([]);
      setTypingUsers({});
      connectionAttemptRef.current = false;
    }
  }, [user, socket]);

  const joinChannel = (channelId: number) => {
    if (socket && connected) {
      socket.emit('join_channel', { channelId });
      console.log('Joining channel:', channelId);
    }
  };

  const leaveChannel = (channelId: number) => {
    if (socket && connected) {
      socket.emit('leave_channel', { channelId });
      console.log('Leaving channel:', channelId);
    }
  };

  const sendMessage = (channelId: number, content: string, replyTo?: number) => {
    if (socket && connected) {
      socket.emit('send_message', {
        channelId,
        content,
        replyTo
      });
    }
  };

  const startTyping = (channelId: number) => {
    if (socket && connected) {
      socket.emit('typing_start', { channelId });
    }
  };

  const stopTyping = (channelId: number) => {
    if (socket && connected) {
      socket.emit('typing_stop', { channelId });
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const value: SocketContextType = {
    socket,
    connected,
    messages,
    typingUsers,
    joinChannel,
    leaveChannel,
    sendMessage,
    startTyping,
    stopTyping,
    clearMessages,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;