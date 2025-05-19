import React, { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, off } from 'firebase/database';
import { database } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: string;
  senderName: string;
  timestamp: string;
}

interface DebateChatProps {
  roomId: string;
}

const DebateChat: React.FC<DebateChatProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedMessages = Object.values(data).map((msg: unknown) => {
          const message = msg as Message;
          return {
            id: message.id,
            text: message.text,
            sender: message.sender,
            senderName: message.senderName,
            timestamp: message.timestamp
          };
        });
        setMessages(formattedMessages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
      } else {
        setMessages([]);
      }
    });

    return () => {
      off(messagesRef);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    try {
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      await push(messagesRef, {
        text: newMessage,
        sender: user.uid,
        senderName: user.displayName || 'Anonymous',
        timestamp: new Date().toISOString()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-md">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.sender === user?.uid
                ? 'text-right'
                : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.sender === user?.uid
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <div className="text-sm font-semibold mb-1">
                {message.senderName}
              </div>
              <div>{message.text}</div>
              <div className="text-xs mt-1 opacity-75">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default DebateChat; 