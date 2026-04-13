"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FaRegCommentDots, FaGlobe, FaChartLine, FaUserSecret, 
  FaBitcoin, FaHeart, FaHistory, FaLeaf, FaVideo, 
  FaPalette, FaClinicMedical, FaChild, FaBriefcase, 
  FaImage, FaShieldAlt, FaMapMarkedAlt, FaBalanceScale, 
  FaCameraRetro, FaMicroscope, FaHandPaper, FaMicrochip, 
 FaPrayingHands, FaFlask, FaLock, 
  FaPizzaSlice, FaVenus, FaBan, FaCity, FaGavel, FaAtom 
} from "react-icons/fa";
import { database } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';

const topics = [
  {
    id: 1,
    key: "ai-ethics",
    icon: <FaRegCommentDots className="text-purple-400" />,
    title: "AI & Ethics",
    description: "Should artificial intelligence be regulated?",
  },
  {
    id: 2,
    key: "climate-change",
    icon: <FaGlobe className="text-green-400" />,
    title: "Climate Change",
    description: "Is climate change the biggest threat to humanity?",
  },
  {
    id: 3,
    key: "future-work",
    icon: <FaChartLine className="text-yellow-400" />,
    title: "Future of Work",
    description: "Will remote work become the new standard?",
  },
  {
    id: 4,
    key: "digital-privacy",
    icon: <FaUserSecret className="text-pink-400" />,
    title: "Digital Privacy",
    description: "Should social media be more strictly regulated?",
  },
  {
    id: 5,
    key: "cryptocurrency",
    icon: <FaBitcoin className="text-blue-400" />,
    title: "Cryptocurrency",
    description: "Is cryptocurrency the future of finance?",
  },
  {
    id: 6,
    key: "healthcare",
    icon: <FaHeart className="text-purple-400" />,
    title: "Healthcare",
    description: "Should healthcare be free for everyone?",
  },
  {
    id: 7,
    key: "ancient-history",
    icon: <FaHistory className="text-orange-400" />,
    title: "Ancient History",
    description: "Ancient Athens or Sparta: Which was the better place to live?"
  },
  {
    id: 8,
    key: "climate-strategy",
    icon: <FaLeaf className="text-emerald-400" />,
    title: "Climate Strategy",
    description: "Are “debt-for-nature swaps” a good strategy for rainforest conservation?"
  },
  {
    id: 9,
    key: "social-media-ethics",
    icon: <FaVideo className="text-red-400" />,
    title: "Social Media Ethics",
    description: "Are apology videos effective?"
  },
  {
    id: 10,
    key: "art-criticism",
    icon: <FaPalette className="text-pink-400" />,
    title: "Art Criticism",
    description: "Are art critics worth listening to?"
  },
  {
    id: 11,
    key: "public-health",
    icon: <FaClinicMedical className="text-blue-300" />,
    title: "Public Health",
    description: "Are drug consumption rooms a good idea?"
  },
  {
    id: 12,
    key: "childhood-dev",
    icon: <FaChild className="text-yellow-500" />,
    title: "Childhood Development",
    description: "Are fairy tales good for children?"
  },
  {
    id: 13,
    key: "workplace",
    icon: <FaBriefcase className="text-gray-400" />,
    title: "Workplace",
    description: "Are hard skills or soft skills more important in the workplace?"
  },
  {
    id: 14,
    key: "nfts",
    icon: <FaImage className="text-indigo-400" />,
    title: "NFTs",
    description: "Are NFTs good for art?"
  },
  {
    id: 15,
    key: "privacy-safety",
    icon: <FaShieldAlt className="text-red-500" />,
    title: "Privacy vs Safety",
    description: "Are online privacy protections more important than public safety?"
  },
  {
    id: 16,
    key: "geopolitics",
    icon: <FaMapMarkedAlt className="text-green-500" />,
    title: "Geopolitics",
    description: "Are open borders a good idea?"
  },
  {
    id: 17,
    key: "economics",
    icon: <FaBalanceScale className="text-amber-600" />,
    title: "Economics",
    description: "Are price caps a useful economic tool?"
  },
  {
    id: 18,
    key: "influencers",
    icon: <FaCameraRetro className="text-purple-500" />,
    title: "Influencers",
    description: "Are social media influencers legitimate celebrities?"
  },
  {
    id: 19,
    key: "biology",
    icon: <FaMicroscope className="text-cyan-400" />,
    title: "Biology",
    description: "Are viruses alive?"
  },
  {
    id: 20,
    key: "human-rights",
    icon: <FaHandPaper className="text-orange-500" />,
    title: "Human Rights",
    description: "Are water resources a basic human right?"
  },
  {
    id: 21,
    key: "simulation-theory",
    icon: <FaMicrochip className="text-blue-500" />,
    title: "Simulation Theory",
    description: "Are we living in a simulation?"
  },
  {
    id: 22,
    key: "ai-education",
    icon: <FaUserSecret className="text-teal-400" />,
    title: "AI & Education",
    description: "Can AI replace teachers?"
  },
  {
    id: 23,
    key: "ethics-religion",
    icon: <FaPrayingHands className="text-yellow-600" />,
    title: "Ethics & Religion",
    description: "Can morality exist without religion?"
  },
  {
    id: 24,
    key: "lab-meat",
    icon: <FaFlask className="text-green-300" />,
    title: "Lab-Grown Meat",
    description: "Could lab-grown meat be a useful tool for fighting climate change?"
  },
  {
    id: 25,
    key: "parenting",
    icon: <FaLock className="text-red-400" />,
    title: "Parenting",
    description: "Do children need privacy?"
  },
  {
    id: 26,
    key: "food-debate",
    icon: <FaPizzaSlice className="text-orange-400" />,
    title: "Food Debate",
    description: "Does pineapple belong on pizza?"
  },
  {
    id: 27,
    key: "feminism",
    icon: <FaVenus className="text-pink-500" />,
    title: "Feminism",
    description: "Does feminism have to be intersectional?"
  },
  {
    id: 28,
    key: "cancel-culture",
    icon: <FaBan className="text-red-600" />,
    title: "Cancel Culture",
    description: "Is cancel culture really a new phenomenon?"
  },
  {
    id: 29,
    key: "urban-living",
    icon: <FaCity className="text-blue-400" />,
    title: "Urban Living",
    description: "Is it better to live in a big city or a small town?"
  },
  {
    id: 30,
    key: "justice-peace",
    icon: <FaGavel className="text-brown-500" />,
    title: "Justice vs Peace",
    description: "Is justice more important than peace?"
  },
  {
    id: 31,
    key: "energy-future",
    icon: <FaAtom className="text-blue-300" />,
    title: "Energy Future",
    description: "Is nuclear power our best option for energy production?"
  }
];

const ITEMS_PER_PAGE = 6;

export default function DebatePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // 2. Add current page state
  const [currentPage, setCurrentPage] = useState(1);

  // 3. Logic for pagination
  const totalPages = Math.ceil(topics.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTopics = topics.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 if user searches (optional but recommended)
  // const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setSearch(e.target.value);
  //   setCurrentPage(1); 
  //   if (e.target.value.trim()) {
  //     setSelected(e.target.value.trim());
  //   } else {
  //     setSelected(null);
  //   }
  // };

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
      {/* 4. Use paginatedTopics instead of topics */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 w-full max-w-5xl">
  {paginatedTopics.map((topic) => (
    <button
      key={topic.id}
      onClick={() => handleTopicClick(topic.key)}
      className={`bg-[#232b39] rounded-xl p-8 flex flex-col items-center shadow-lg border-2 transition-all duration-200 ${
        selected === topic.key ? "border-blue-400" : "border-transparent"
      } hover:border-blue-400`}
    >
      <div className="text-4xl mb-4">{topic.icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{topic.title}</h3>
      <div className="text-center text-gray-400">
        &ldquo;{topic.description}&rdquo;
      </div>
    </button>
  ))}
</div>

{/* 5. Pagination Controls */}
<div className="flex items-center gap-4 mb-12">
  <button
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-30 hover:bg-gray-600 transition-colors"
  >
    Previous
  </button>
  
  <span className="text-gray-400">
    Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
  </span>

  <button
    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
    className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-30 hover:bg-gray-600 transition-colors"
  >
    Next
  </button>
</div>
      {/* Show custom topic if entered */}
      {customTopic && (
        <div className="mb-4 text-center">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded font-bold">
            Custom Topic: &ldquo;{search.trim()}&rdquo;
          </span>
        </div>
      )}
    </div>
  );
}
