"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { connectSocket, disconnectSocket, joinRoom, leaveRoom, sendMessage, getSocket } from '@/lib/socket';
import { FaPaperPlane, FaUser } from 'react-icons/fa';
import { database } from '@/lib/firebase';
import { ref as dbRef, onValue as onDbValue } from 'firebase/database';

interface Message {
  content: string;
  user: {
    id: string;
    email: string;
    username?: string;
  };
  timestamp: Date;
}

interface LiveChatProps {
  debateId: string;
  isDebateRunning: boolean;
}

export default function LiveChat({ debateId, isDebateRunning }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSocketInitialized, setIsSocketInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch username for the current user
  useEffect(() => {
    if (user) {
      const userRef = dbRef(database, `users/${user.uid}`);
      const unsubscribe = onDbValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.username) {
          setUsername(data.username);
        } else {
          setUsername('');
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Connect to socket and join room
  useEffect(() => {
    if (!user) return;

    try {
      // Initialize socket connection with user info
      connectSocket(user);
      setIsConnected(true);

      const socket = getSocket();
      console.log('Socket instance:', socket);

      // Set isSocketInitialized to true only after socket connects
      const handleConnect = () => {
        console.log('Socket connected successfully');
        setIsSocketInitialized(true);
      };
      socket.on('connect', handleConnect);

      // Join the debate room
      joinRoom(debateId);
      console.log('Joined room:', debateId);

      // Load existing messages from Firebase
      const chatRef = dbRef(database, `debates/${debateId}/chat`);
      const unsubscribe = onDbValue(chatRef, (snapshot) => {
        const data = snapshot.val();
        console.log('Firebase chat data:', data);
        if (data) {
          const formattedMessages = Object.values(data).map((msg: any) => ({
            content: msg.content,
            user: msg.user,
            timestamp: new Date(msg.timestamp)
          }));
          console.log('Formatted messages:', formattedMessages);
          setMessages(formattedMessages);
        }
      });

      // Listen for new messages
      socket.on('chat-message', (message: Message) => {
        console.log('Received new message:', message);
      });

      // Listen for user joined/left events
      socket.on('user-joined', (userEmail: string) => {
        const systemMessage: Message = {
          content: `${userEmail} joined the debate`,
          user: { id: 'system', email: 'System' },
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      });

      socket.on('user-left', (userEmail: string) => {
        const systemMessage: Message = {
          content: `${userEmail} left the debate`,
          user: { id: 'system', email: 'System' },
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      });

      // Listen for room users update
      socket.on('room-users', (users: string[]) => {
        console.log('Current room users:', users);
      });

      return () => {
        leaveRoom(debateId);
        disconnectSocket();
        setIsConnected(false);
        setIsSocketInitialized(false);
        unsubscribe();
        socket.off('connect', handleConnect);
      };
    } catch (error) {
      console.error('Error initializing socket:', error);
      setError('Failed to connect to chat. Please refresh the page.');
      setIsConnected(false);
      setIsSocketInitialized(false);
    }
  }, [debateId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !isSocketInitialized) return;

    try {
      const message: Message = {
        content: newMessage,
        user: {
          id: user.uid,
          email: user.email || 'Anonymous',
          username: username || user.email || 'Anonymous',
        },
        timestamp: new Date()
      };

      console.log('Sending message:', message);
      sendMessage(debateId, message);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl bg-[#232b39] rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Live Chat</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="h-[400px] overflow-y-auto mb-4 custom-scrollbar">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.user.id === 'system'
                ? 'text-center text-gray-400 text-sm'
                : 'flex items-start gap-3'
            }`}
          >
            {message.user.id !== 'system' && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <FaUser className="text-white" />
              </div>
            )}
            <div className="flex-1">
              {message.user.id !== 'system' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">
                    {message.user.username || message.user.email}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div className={`${
                message.user.id === 'system'
                  ? 'text-gray-400'
                  : 'bg-[#1a2234] text-white p-3 rounded-lg'
              }`}>
                {message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={!isSocketInitialized ? "Connecting..." : "Type your message..."}
          disabled={!isSocketInitialized}
          className="flex-1 px-4 py-2 rounded-lg bg-[#1a2234] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !isSocketInitialized}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
} 