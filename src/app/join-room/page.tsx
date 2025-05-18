"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { FaDoorOpen } from "react-icons/fa";

export default function JoinRoomPage() {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError("Please enter a room ID");
      return;
    }

    if (!user) {
      setError("Please login to join a room");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if room exists
      const roomRef = ref(database, `debates/${roomId}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setError("Room not found. Please check the ID and try again.");
        return;
      }

      // Room exists, navigate to it
      router.replace(`/debate/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      setError("Failed to join room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181f2a] p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-[#232b39] rounded-xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <FaDoorOpen className="text-4xl text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Join Debate Room</h1>
          <p className="text-gray-400">
            Enter the room ID to join an existing debate
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-2">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              className="w-full px-4 py-2 rounded-lg bg-[#1a2234] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleJoinRoom}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? "Joining..." : "Join Room"}
          </button>

          <div className="text-center mt-4">
            <button
              onClick={() => router.push('/debate')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Create New Room Instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 