import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const JoinRoom: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to join a room');
      return;
    }

    try {
      // Check if room exists
      const roomRef = ref(database, `rooms/${roomId}`);
      const roomSnapshot = await get(roomRef);

      if (!roomSnapshot.exists()) {
        alert('Room not found');
        return;
      }

      const roomData = roomSnapshot.val();

      // Add user to participants
      const updates = {
        [`rooms/${roomId}/participants/${user.uid}`]: {
          name: user.displayName || 'Anonymous',
          joinedAt: new Date().toISOString(),
          role: 'participant'
        }
      };

      await update(ref(database), updates);

      // Navigate to the room
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Join Debate Room</h2>
      <form onSubmit={handleJoinRoom}>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Room ID
          </label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Enter room ID"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
        >
          Join Room
        </button>
      </form>
    </div>
  );
};

export default JoinRoom; 