'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, query, orderByChild, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Room {
  id: string;
  topic: string;
  createdAt: string;
  votes: {
    pro: number;
    con: number;
  };
  createdBy: string;
}

export default function HistoryPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchUserRooms = async () => {
      try {
        const debatesRef = ref(database, 'debates');
        const userDebatesQuery = query(debatesRef, orderByChild('createdBy'));
        
        const unsubscribe = onValue(userDebatesQuery, (snapshot) => {
          const roomsData: Room[] = [];
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            if (data.createdBy === user.uid) {
              roomsData.push({
                id: childSnapshot.key!,
                topic: data.topic,
                createdAt: data.createdAt,
                votes: data.votes || { pro: 0, con: 0 },
                createdBy: data.createdBy
              });
            }
          });
          setRooms(roomsData);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    fetchUserRooms();
  }, [user]);

  const handleRoomClick = (roomId: string) => {
    router.push(`/debate/${roomId}`);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Your Debate Rooms</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{room.topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">
                Created: {new Date(room.createdAt).toLocaleDateString()}
              </p>
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>Pro: {room.votes.pro}</span>
                <span>Con: {room.votes.con}</span>
              </div>
              <Button 
                onClick={() => handleRoomClick(room.id)}
                className="w-full"
              >
                View Room
              </Button>
            </CardContent>
          </Card>
        ))}
        {rooms.length === 0 && (
          <div className="text-center text-gray-500">
            You haven&apos;t participated in any debates yet.
          </div>
        )}
      </div>
    </div>
  );
} 