"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const CONNECTION_TIMEOUT = 10000;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isInitialized: boolean;
  error: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isInitialized: false,
  error: null,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let socketInstance: Socket | null = null;
    let retryCount = 0;
    let retryTimeout: NodeJS.Timeout;
    let connectionTimeout: NodeJS.Timeout;

    const initializeSocket = async () => {
      try {
        // Clean up existing socket if any
        if (socketInstance) {
          socketInstance.disconnect();
          socketInstance = null;
        }

        // Create new socket instance
        socketInstance = io(SOCKET_URL, {
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: CONNECTION_TIMEOUT,
          transports: ['websocket', 'polling'],
          auth: {
            email: user?.email || 'Anonymous',
            userId: user?.uid
          }
        });

        // Set up connection timeout
        connectionTimeout = setTimeout(() => {
          if (!socketInstance?.connected) {
            socketInstance?.disconnect();
            throw new Error('Socket connection timeout');
          }
        }, CONNECTION_TIMEOUT);

        // Set up event listeners before connecting
        socketInstance.on('connect', () => {
          console.log('Socket connected');
          clearTimeout(connectionTimeout);
          setIsConnected(true);
          setIsInitialized(true);
          setError(null);
          retryCount = 0;
        });

        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error: Error) => {
          console.error('Socket connection error:', error);
          clearTimeout(connectionTimeout);
          setError('Failed to connect to server');
          setIsConnected(false);
          setIsInitialized(false);
        });

        // Attempt connection
        socketInstance.connect();
        setSocket(socketInstance);

      } catch (error) {
        console.error('Error initializing socket:', error);
        clearTimeout(connectionTimeout);
        setError('Failed to initialize socket connection');
        setIsConnected(false);
        setIsInitialized(false);

        // Retry logic
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying socket connection (${retryCount}/${MAX_RETRIES})...`);
          retryTimeout = setTimeout(initializeSocket, RETRY_DELAY);
        } else {
          setError('Failed to connect after multiple attempts. Please refresh the page.');
        }
      }
    };

    initializeSocket();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
        setIsInitialized(false);
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isInitialized, error }}>
      {children}
    </SocketContext.Provider>
  );
} 