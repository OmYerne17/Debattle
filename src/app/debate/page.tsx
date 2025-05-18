"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaRegCommentDots,
  FaGlobe,
  FaChartLine,
  FaUserSecret,
  FaBitcoin,
  FaHeart,
} from "react-icons/fa";
import { database } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';

const topics = [
  {
    key: "ai-ethics",
    icon: <FaRegCommentDots className="text-purple-400" />,
    title: "AI & Ethics",
    description: "Should artificial intelligence be regulated?",
  },
  {
    key: "climate-change",
    icon: <FaGlobe className="text-green-400" />,
    title: "Climate Change",
    description: "Is climate change the biggest threat to humanity?",
  },
  {
    key: "future-work",
    icon: <FaChartLine className="text-yellow-400" />,
    title: "Future of Work",
    description: "Will remote work become the new standard?",
  },
  {
    key: "digital-privacy",
    icon: <FaUserSecret className="text-pink-400" />,
    title: "Digital Privacy",
    description: "Should social media be more strictly regulated?",
  },
  {
    key: "cryptocurrency",
    icon: <FaBitcoin className="text-blue-400" />,
    title: "Cryptocurrency",
    description: "Is cryptocurrency the future of finance?",
  },
  {
    key: "healthcare",
    icon: <FaHeart className="text-purple-400" />,
    title: "Healthcare",
    description: "Should healthcare be free for everyone?",
  },
];

export default function DebatePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  // If user types in search, treat it as a custom topic
  const customTopic =
    search.trim() && !topics.some((t) => t.key === search.trim().toLowerCase());

  // When user types, set selected to custom topic
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value.trim()) {
      setSelected(e.target.value.trim());
    } else {
      setSelected(null);
    }
  };

  // When user clicks a topic, set selected and clear search
  const handleTopicClick = (key: string) => {
    setSelected(key);
    setSearch("");
  };

  const handleCreateRoom = async () => {
    if (!selected) return;
    
    if (!user) {
      alert('Please login to create a room');
      return;
    }

    try {
      // Generate a unique room ID
      const roomRef = push(ref(database, 'debates'));
      const roomId = roomRef.key;

      if (!roomId) {
        throw new Error('Failed to generate room ID');
      }

      // Create room data
      const roomData = {
        topic: selected,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        votes: { pro: 0, con: 0 },
        chat: [],
        rounds: []
      };

      // Save room data to Firebase
      await set(roomRef, roomData);
      
      // Use replace instead of push for better navigation
      router.replace(`/debate/${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#181f2a] p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">
        Select a Topic for Debate
      </h1>
      {/* Search input */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-2xl justify-center items-center">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Type any topic to start a debate..."
          className="flex-1 px-4 py-2 rounded border border-gray-400 text-white"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 w-full max-w-5xl">
        {topics.map((topic) => (
          <button
            key={topic.key}
            onClick={() => handleTopicClick(topic.key)}
            className={`bg-[#232b39] rounded-xl p-8 flex flex-col items-center shadow-lg border-2 transition-all duration-200 ${
              selected === topic.key
                ? "border-blue-400"
                : "border-transparent"
            } hover:border-blue-400`}
          >
            <div className="text-4xl mb-4">{topic.icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {topic.title}
            </h3>
            <div className="text-center text-gray-600">
              &ldquo;{topic.description}&rdquo;
            </div>
          </button>
        ))}
      </div>
      {/* Show custom topic if entered */}
      {customTopic && (
        <div className="mb-4 text-center">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded font-bold">
            Custom Topic: &ldquo;{search.trim()}&rdquo;
          </span>
        </div>
      )}
      <button
        className={`px-8 py-3 rounded-lg font-bold text-lg transition-colors duration-200 ${
          selected
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-600 text-gray-300 cursor-not-allowed"
        }`}
        disabled={!selected}
        onClick={handleCreateRoom}
      >
        Create Debate Room
      </button>
    </div>
  );
}
