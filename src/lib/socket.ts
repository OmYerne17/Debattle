import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: any = null;

export const initializeSocket = (user: any) => {
  if (!socket) {
    try {
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
      });

      socket.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error);
        socket = null; // Reset socket on connection error
      });

      socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect' && socket) {
          // Server initiated disconnect, try to reconnect
          socket.connect();
        }
      });
    } catch (error) {
      console.error('Error creating socket:', error);
      socket = null;
      throw error;
    }
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  return socket;
};

export const connectSocket = (user: any) => {
  try {
    const socket = initializeSocket(user);
    if (socket && !socket.connected) {
      socket.connect();
    }
  } catch (error) {
    console.error('Error connecting socket:', error);
    throw error;
  }
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null; // Reset socket after disconnecting
};

export const joinRoom = (roomId: string) => {
  try {
    const socket = getSocket();
    if (socket) {
      socket.emit('join-room', roomId);
    }
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

export const leaveRoom = (roomId: string) => {
  try {
    const socket = getSocket();
    if (socket) {
      socket.emit('leave-room', roomId);
    }
  } catch (error) {
    console.error('Error leaving room:', error);
    throw error;
  }
};

export const sendMessage = (roomId: string, message: {
  content: string;
  user: {
    id: string;
    email: string;
    username?: string;
  };
  timestamp: Date;
}) => {
  try {
    const socket = getSocket();
    if (socket) {
      socket.emit('chat-message', { roomId, message });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}; 