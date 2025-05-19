import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface DebateHistoryItem {
  roomId: string;
  topic: string;
  joinedAt: string;
  role: string;
}

interface RoomData {
  topic: string;
  participants: {
    [key: string]: {
      joinedAt: string;
      role: string;
    };
  };
}

const DebateHistory: React.FC = () => {
  const [history, setHistory] = useState<DebateHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDebateHistory = async () => {
      if (!user) return;

      try {
        const roomsRef = ref(database, 'rooms');
        const snapshot = await get(roomsRef);
        
        if (snapshot.exists()) {
          const rooms = snapshot.val();
          const userHistory: DebateHistoryItem[] = [];

          Object.entries(rooms).forEach(([roomId, roomData]: [string, unknown]) => {
            const typedRoomData = roomData as RoomData;
            if (typedRoomData.participants && typedRoomData.participants[user.uid]) {
              userHistory.push({
                roomId,
                topic: typedRoomData.topic,
                joinedAt: typedRoomData.participants[user.uid].joinedAt,
                role: typedRoomData.participants[user.uid].role
              });
            }
          });

          // Sort by most recent
          userHistory.sort((a, b) => 
            new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
          );

          setHistory(userHistory);
        }
      } catch (error) {
        console.error('Error fetching debate history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebateHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Debate History</h1>
      
      {history.length === 0 ? (
        <div className="text-center text-gray-500">
          You haven&apos;t participated in any debates yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <div
              key={item.roomId}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/room/${item.roomId}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{item.topic}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Role: {item.role}</span>
                    <span>•</span>
                    <span>
                      Joined: {new Date(item.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/room/${item.roomId}`);
                  }}
                >
                  Rejoin
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebateHistory; 