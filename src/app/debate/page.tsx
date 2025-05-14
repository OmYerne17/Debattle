"use client";
import { useState, useEffect } from "react";
import {
  FaRegCommentDots,
  FaGlobe,
  FaChartLine,
  FaUserSecret,
  FaBitcoin,
  FaHeart,
  FaUserCircle,
  FaCube,
} from "react-icons/fa";
import { DebateAI, GeminiResponse } from "./debateAI";
import { useRouter } from "next/navigation";

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

const BOT_NAMES = { pro: "OptiBot", con: "CautiBot" };
const BOT_BADGES = { pro: "Pro", con: "Con" };
const WAIT_BETWEEN_TURNS_MS = 5000; // 5 seconds

export default function DebatePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [arguments_, setArguments] = useState<GeminiResponse[]>([]);
  const [votes, setVotes] = useState({ pro: 0, con: 0 });
  const [chat, setChat] = useState<Array<{
    content: string;
    role: 'AI1' | 'AI2' | 'user';
    timestamp: Date;
  }>>([]);
  const [message, setMessage] = useState("");
  const [debateAI, setDebateAI] = useState<DebateAI | null>(null);
  const [rounds, setRounds] = useState(3); // N rounds
  const [debateRunning, setDebateRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [typing, setTyping] = useState<{ pro: boolean; con: boolean }>({
    pro: false,
    con: false,
  });
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Get API key from env
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

  useEffect(() => {
    if (created && selected) {
      const ai = new DebateAI(apiKey);
      ai.setTopic(selected);
      setDebateAI(ai);
      ai.generateInitialArguments().then((args) => {
        setArguments(args);
        // Add initial arguments to chat
        setChat([
          {
            content: args.find((a) => a.role === "AI1")?.content || '',
            role: "AI1",
            timestamp: new Date(),
          },
          {
            content: args.find((a) => a.role === "AI2")?.content || '',
            role: "AI2",
            timestamp: new Date(),
          },
        ]);
        setCurrentRound(1);
      });
    }
  }, [created, selected, apiKey]);

  const handleCreateRoom = () => {
    if (selected) {
      setCreated(true);
    }
  };

  const handleVote = (side: "pro" | "con") => {
    setVotes((v) => ({ ...v, [side]: v[side] + 1 }));
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setChat([
      ...chat,
      { content: message, role: "user", timestamp: new Date() },
    ]);
    setMessage("");
  };

  // N round debate logic
  const startDebateRounds = async () => {
    if (!debateAI || debateRunning) return;
    setDebateRunning(true);
    let lastPro =
      chat.filter((m) => m.role === "AI1").slice(-1)[0]?.content ||
      arguments_.find((a) => a.role === "AI1")?.content ||
      "";
    let lastCon =
      chat.filter((m) => m.role === "AI2").slice(-1)[0]?.content ||
      arguments_.find((a) => a.role === "AI2")?.content ||
      "";
    let proResponses = chat
      .filter((m) => m.role === "AI1")
      .map((m) => m.content);
    let conResponses = chat
      .filter((m) => m.role === "AI2")
      .map((m) => m.content);
    for (let i = currentRound; i < rounds + 1; i++) {
      // AI1 (Pro) turn
      setTyping((t) => ({ ...t, pro: true }));
      await new Promise((res) => setTimeout(res, 1200)); // show typing for a bit before response
      const proMsg = await debateAI.generateProResponse(lastCon || lastPro);
      proResponses = [...proResponses, proMsg];
      setTyping((t) => ({ ...t, pro: false }));
      setProCards([...proResponses]);
      lastPro = proMsg;
      await new Promise((res) => setTimeout(res, WAIT_BETWEEN_TURNS_MS));
      // AI2 (Con) turn
      setTyping((t) => ({ ...t, con: true }));
      await new Promise((res) => setTimeout(res, 1200));
      const conMsg = await debateAI.generateConResponse(lastPro);
      conResponses = [...conResponses, conMsg];
      setTyping((t) => ({ ...t, con: false }));
      setConCards([...conResponses]);
      lastCon = conMsg;
      setCurrentRound(i + 1);
      await new Promise((res) => setTimeout(res, WAIT_BETWEEN_TURNS_MS));
    }
    setDebateRunning(false);
  };

  // Store Pro/Con responses as cards
  const [proCards, setProCards] = useState<string[]>([]);
  const [conCards, setConCards] = useState<string[]>([]);

  useEffect(() => {
    if (created && selected && arguments_.length) {
      setProCards(
        arguments_.filter((a) => a.role === "AI1").map((a) => a.content)
      );
      setConCards(
        arguments_.filter((a) => a.role === "AI2").map((a) => a.content)
      );
    }
  }, [created, selected, arguments_]);

  // Helper to determine winner
  const getWinner = () => {
    if (votes.pro > votes.con) return BOT_NAMES.pro;
    if (votes.con > votes.pro) return BOT_NAMES.con;
    return "Tie";
  };
  const debateFinished = !debateRunning && currentRound > rounds;

  // Remove topic filtering; always show all topics
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

  // Handler for starting a new debate
  const handleNextDebate = () => {
    setCreated(false);
    setSelected(null);
    setChat([]);
    setArguments([]);
    setVotes({ pro: 0, con: 0 });
    setProCards([]);
    setConCards([]);
    setMessage("");
    setCurrentRound(0);
    setRounds(3);
    setSearch("");
  };

  // Handler to stop the debate
  const handleStopDebate = () => {
    setDebateRunning(false);
  };

  // Header component
  const Header = () => (
    <header className="w-full sticky top-0 z-50 bg-[#181f2a] border-b border-gray-800 shadow flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        {/* 3D Logo (cube icon as placeholder) */}
        <span className="text-3xl text-blue-400">
          <FaCube />
        </span>
        {/* On topic selection page, clicking Debattle runs handleCreateRoom if a topic is selected */}
        <span
          onClick={() => router.push("/debate")}
          className={`text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent select-none ${
            !created ? "cursor-pointer" : ""
          }`}
        >
          Debattle
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="px-4 py-1 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition">
          Signup
        </button>
        <button className="px-4 py-1 rounded bg-purple-500 text-white font-bold hover:bg-purple-600 transition">
          Login
        </button>
        <span className="text-3xl text-gray-300 ml-2 cursor-pointer">
          <FaUserCircle />
        </span>
      </div>
    </header>
  );

  // UI rendering
  if (!created) {
    // Topic selection UI
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#181f2a] p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] flex flex-col items-center">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">
            Select a Topic for Debate
          </h1>
          {/* Search and Random */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-2xl justify-center items-center">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Type any topic to start a debate..."
              className="flex-1 px-4 py-2 rounded border border-gray-400 text-indigo-600"
            />
            <button
              className="px-6 py-2 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition"
              disabled={!selected}
              onClick={handleCreateRoom}
            >
              Create Debate Room
            </button>
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
      </>
    );
  }

  // Debate room UI
  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#181f2a] p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-white text-center">
          Topic: {selected}
        </h2>
        <div className="text-center text-gray-300 mb-4">
          Round: Closing Statements
        </div>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl mb-6">
          {/* Pro Card List */}
          <div className="flex-1 bg-[#232b39] rounded-xl p-6 border-2 border-green-200 shadow-lg flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-green-300">
              <span className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold">
                O
              </span>
              {BOT_NAMES.pro}
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs ml-2">
                {BOT_BADGES.pro}
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-2 max-h-60 overflow-y-auto pr-2">
              {proCards.map((content, idx) => (
                <div
                  key={idx}
                  className="bg-green-900/30 border border-green-400 rounded p-2 text-white"
                >
                  <span className="font-bold text-green-300 mr-2">
                    {idx + 1}.
                  </span>
                  {content}
                </div>
              ))}
              {typing.pro && (
                <div className="italic text-green-200 flex items-center gap-2">
                  <span>Typing</span>
                  <span className="animate-pulse">...</span>
                </div>
              )}
            </div>
          </div>
          {/* Con Card List */}
          <div className="flex-1 bg-[#232b39] rounded-xl p-6 border-2 border-red-200 shadow-lg flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-red-300">
              <span className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-red-800 font-bold">
                C
              </span>
              {BOT_NAMES.con}
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs ml-2">
                {BOT_BADGES.con}
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-2 max-h-60 overflow-y-auto pr-2">
              {conCards.map((content, idx) => (
                <div
                  key={idx}
                  className="bg-red-900/30 border border-red-400 rounded p-2 text-white"
                >
                  <span className="font-bold text-red-300 mr-2">
                    {idx + 1}.
                  </span>
                  {content}
                </div>
              ))}
              {typing.con && (
                <div className="italic text-red-200 flex items-center gap-2">
                  <span>Typing</span>
                  <span className="animate-pulse">...</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Voting Bar */}
        <div className="w-full max-w-4xl mb-4">
          <div className="flex items-center gap-4">
            <span className="text-green-400 font-bold">Pro ({votes.pro})</span>
            <div className="flex-1 h-6 bg-gray-700 rounded relative overflow-hidden">
              <div
                className="h-6 bg-green-500 absolute left-0 top-0 transition-all duration-300"
                style={{
                  width: `${
                    votes.pro + votes.con === 0
                      ? 50
                      : (votes.pro / (votes.pro + votes.con)) * 100
                  }%`,
                }}
              />
              <div
                className="h-6 bg-red-500 absolute right-0 top-0 transition-all duration-300"
                style={{
                  width: `${
                    votes.pro + votes.con === 0
                      ? 50
                      : (votes.con / (votes.pro + votes.con)) * 100
                  }%`,
                }}
              />
            </div>
            <span className="text-red-400 font-bold">Con ({votes.con})</span>
          </div>
        </div>
        {/* Winner Announcement */}
        {debateFinished && (
          <>
            <div className="mb-4 text-2xl font-bold text-center text-yellow-300">
              {getWinner() === "Tie"
                ? "It's a tie!"
                : `${getWinner()} wins the debate!`}
            </div>
            <div className="flex justify-center mb-6">
              <button
                className="px-8 py-3 rounded-lg font-bold text-lg bg-blue-500 text-white hover:bg-blue-600 transition shadow-lg"
                onClick={handleNextDebate}
              >
                Create Debate Room
              </button>
            </div>
          </>
        )}
        {/* Voting Buttons */}
        <div className="mb-6 flex gap-4 justify-center">
          <button
            onClick={() => handleVote("pro")}
            className="bg-green-500 text-white px-6 py-2 rounded font-bold hover:bg-green-600 transition"
          >
            Pro ({votes.pro})
          </button>
          <button
            onClick={() => handleVote("con")}
            className="bg-red-500 text-white px-6 py-2 rounded font-bold hover:bg-red-600 transition"
          >
            Con ({votes.con})
          </button>
        </div>
        {/* N Rounds Controls */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-white font-bold">Rounds:</label>
          <input
            type="number"
            min={1}
            max={10}
            value={rounds}
            disabled={debateRunning}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-16 px-2 py-1 rounded border border-gray-400 text-white"
          />
          <button
            className={`px-6 py-2 rounded font-bold text-white ${debateRunning ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"} transition`}
            onClick={startDebateRounds}
            disabled={debateRunning}
          >
            {debateRunning ? "Debate Running..." : `Start ${rounds} Rounds`}
          </button>
          {/* Stop Debate Button */}
          {debateRunning && (
            <button
              className="px-6 py-2 rounded font-bold text-white bg-red-600 hover:bg-red-700 transition"
              onClick={handleStopDebate}
            >
              Stop Debate
            </button>
          )}
        </div>
        {/* Live Chat (user only) */}
        <div className="w-full max-w-4xl bg-[#232b39] rounded-xl p-4 mb-4 shadow-lg">
          <div className="font-bold text-white mb-2">Debate Chat</div>
          <div className="h-64 overflow-y-auto mb-2 bg-[#232b39] rounded">
            {chat.filter((m) => m.role === "user").length === 0 && (
              <div className="text-gray-400">No messages yet.</div>
            )}
            {chat
              .filter((m) => m.role === "user")
              .map((msg, i) => (
                <div key={i} className="mb-2 text-gray-200">
                  <span className="font-semibold">You:</span> {msg.content}
                </div>
              ))}
          </div>
          <div className="flex">
            <input
              className="flex-1 rounded-l px-2 py-1 bg-[#181f2a] text-white border border-gray-600 focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={debateRunning}
            />
            <button
              className="bg-blue-500 text-white px-4 rounded-r"
              onClick={handleSendMessage}
              disabled={debateRunning}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
