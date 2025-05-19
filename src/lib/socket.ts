import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface User {
  email?: string;
  uid?: string;
}

interface Message {
  content: string;
  user: {
    id: string;
    email: string;
    username?: string;
  };
  timestamp: Date;
}

interface DebateMessage {
  content: string;
  role: 'AI1' | 'AI2';
  timestamp: Date;
}

let socket: Socket | null = null;
let isInitializing = false;
let initializationPromise: Promise<Socket> | null = null;

export const initializeSocket = (user: User) => {
  if (socket?.connected) {
    return Promise.resolve(socket);
  }

  if (isInitializing) {
    return initializationPromise;
  }

  isInitializing = true;
  initializationPromise = new Promise((resolve, reject) => {
    try {
      if (!socket) {
        socket = io(SOCKET_URL, {
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          auth: {
            email: user?.email || 'Anonymous',
            userId: user?.uid
          }
        });

        // Add connection event listeners
        socket.on('connect', () => {
          if (socket && socket.auth) {
            console.log('Socket connected with auth:', socket.auth);
          } else {
            console.log('Socket connected');
          }
          isInitializing = false;
          if (socket) {
            resolve(socket);
          } else {
            reject(new Error('Socket is null after connection'));
          }
        });

        socket.on('connect_error', (error: Error) => {
          console.error('Socket connection error:', error);
          socket = null;
          isInitializing = false;
          reject(error);
        });

        socket.on('disconnect', (reason: string) => {
          console.log('Socket disconnected:', reason);
          if (reason === 'io server disconnect' && socket) {
            // Server initiated disconnect, try to reconnect
            socket.connect();
          }
        });
      }

      // Start connection
      socket.connect();
    } catch (error) {
      console.error('Error creating socket:', error);
      socket = null;
      isInitializing = false;
      reject(error);
    }
  });

  return initializationPromise;
};

export const getSocket = (): Socket => {
  if (!socket?.connected) {
    throw new Error('Socket not initialized or not connected. Call connectSocket first.');
  }
  return socket;
};

export const connectSocket = async (user: User): Promise<void> => {
  try {
    await initializeSocket(user);
  } catch (error) {
    console.error('Error connecting socket:', error);
    throw error;
  }
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
  isInitializing = false;
  initializationPromise = null;
};

export const joinRoom = (socket: Socket, roomId: string): void => {
  if (!socket?.connected) {
    throw new Error('Socket not initialized or not connected');
  }
  socket.emit('join-room', roomId);
};

export const leaveRoom = (socket: Socket, roomId: string): void => {
  if (!socket?.connected) {
    throw new Error('Socket not initialized or not connected');
  }
  socket.emit('leave-room', roomId);
};

export const sendMessage = async (socket: Socket, roomId: string, message: Message): Promise<boolean> => {
  if (!socket?.connected) {
    throw new Error('Socket not initialized or not connected');
  }
  return new Promise((resolve, reject) => {
    socket.emit('chat-message', { roomId, message }, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
};

export const sendDebateMessage = async (socket: Socket, roomId: string, message: DebateMessage): Promise<boolean> => {
  if (!socket?.connected) {
    throw new Error('Socket not initialized or not connected');
  }
  return new Promise((resolve, reject) => {
    socket.emit('debate-message', { roomId, message }, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
};

export const sendDebateTyping = async (socket: Socket, roomId: string, side: 'pro' | 'con', isTyping: boolean): Promise<boolean> => {
  if (!socket?.connected) {
    throw new Error('Socket not initialized or not connected');
  }
  return new Promise((resolve, reject) => {
    socket.emit('debate-typing', { roomId, side, isTyping }, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}; 