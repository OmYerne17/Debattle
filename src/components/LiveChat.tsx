"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { FaPaperPlane, FaUser } from 'react-icons/fa';
import { database } from '@/lib/firebase';
import { ref as dbRef, onValue as onDbValue } from 'firebase/database';
import { joinRoom, leaveRoom, sendMessage } from '@/lib/socket';

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
}

export default function LiveChat({ debateId }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { socket, isConnected, isInitialized, error: socketError } = useSocket();

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

  // Join room and set up socket listeners
  useEffect(() => {
    if (!socket || !isInitialized || !debateId) return;

    try {
      // Join the debate room
      joinRoom(socket, debateId);
      console.log('Joined room:', debateId);

      // Load existing messages from Firebase
      const chatRef = dbRef(database, `debates/${debateId}/chat`);
      const unsubscribe = onDbValue(chatRef, (snapshot) => {
        const data = snapshot.val();
        console.log('Firebase chat data received:', data);
        if (data) {
          const formattedMessages = Object.values(data).map((msg: unknown) => {
            const message = msg as Message;
            return {
              content: message.content,
              user: message.user,
              timestamp: new Date(message.timestamp)
            };
          });
          console.log('Formatted messages to be set:', formattedMessages);
          setMessages(formattedMessages);
        } else {
          console.log('No chat data found in Firebase');
          setMessages([]);
        }
      });

      // Listen for new messages
      socket.on('chat-message', (message: Message) => {
        console.log('Socket message received:', message);
        setMessages(prev => {
          console.log('Previous messages:', prev);
          const newMessages = [...prev, message];
          console.log('New messages array:', newMessages);
          return newMessages;
        });
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
        leaveRoom(socket, debateId);
        socket.off('chat-message');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('room-users');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up socket listeners:', error);
      setError('Failed to set up chat. Please refresh the page.');
    }
  }, [socket, isInitialized, debateId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !socket || !isConnected) return;

    setNewMessage('');

    try {
      const message: Message = {
        content: newMessage.trim(),
        user: {
          id: user.uid,
          email: user.email || 'Anonymous',
          username: username || user.email || 'Anonymous',
        },
        timestamp: new Date()
      };

      console.log('Sending message:', message);
      await sendMessage(socket, debateId, message);
      setError(null);
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

      {(error || socketError) && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
          {error || socketError}
        </div>
      )}

      <div className="h-[400px] overflow-y-auto mb-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.user.id}-${index}`}
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={!isConnected ? "Connecting..." : "Type your message..."}
          disabled={!isConnected}
          className="flex-1 px-4 py-2 rounded-lg bg-[#1a2234] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
} 