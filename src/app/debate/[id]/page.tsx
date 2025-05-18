"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { DebateAI, GeminiResponse } from "../debateAI";
import LiveChat from '@/components/LiveChat';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { connectSocket, disconnectSocket, joinRoom, leaveRoom, sendDebateMessage, sendDebateTyping, getSocket } from '@/lib/socket';
import { useSocket } from '@/context/SocketContext';

const BOT_NAMES = { pro: "OptiBot", con: "CautiBot" };
const BOT_BADGES = { pro: "Pro", con: "Con" };

// Helper function to safely copy text to clipboard
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
        textArea.remove();
        return false;
      }
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
};

export default function DebateRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const debateId = resolvedParams.id;
  const [arguments_, setArguments] = useState<GeminiResponse[]>([]);
  const [votes, setVotes] = useState({ pro: 0, con: 0 });
  const [chat, setChat] = useState<Array<{
    content: string;
    role: 'AI1' | 'AI2' | 'user';
    timestamp: Date;
  }>>([]);
  const [debateAI, setDebateAI] = useState<DebateAI | null>(null);
  const [rounds, setRounds] = useState(3);
  const [debateRunning, setDebateRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [typing, setTyping] = useState<{ pro: boolean; con: boolean }>({
    pro: false,
    con: false,
  });
  const [topic, setTopic] = useState<string>("");
  const [proCards, setProCards] = useState<string[]>([]);
  const [conCards, setConCards] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { socket, isConnected, isInitialized } = useSocket();

  // Get API key from env
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

  // Initialize debate AI and fetch room data
  useEffect(() => {
    if (debateId) {
      try {
        const debateRef = ref(database, `debates/${debateId}`);
        const unsubscribe = onValue(debateRef, (snapshot) => {
          try {
            const data = snapshot.val();
            if (data) {
              setTopic(data.topic || '');
              setVotes(data.votes || { pro: 0, con: 0 });
              
              // Handle chat data
              if (data.chat) {
                const chatArray = Object.values(data.chat).map((msg: any) => ({
                  content: msg.content || '',
                  role: msg.role || 'user',
                  timestamp: new Date(msg.timestamp || Date.now())
                }));
                setChat(chatArray);
              }
              
              // Initialize AI if not already done
              if (!debateAI) {
                const ai = new DebateAI(apiKey);
                ai.setTopic(data.topic || '');
                setDebateAI(ai);
                
                // Generate initial arguments
                const generateInitialArgs = async () => {
                  try {
                    const args = await ai.generateInitialArguments();
                    setArguments(args);
                    setProCards([args[0].content]);
                    setConCards([args[1].content]);
                    setChat([
                      {
                        content: args[0].content,
                        role: "AI1",
                        timestamp: new Date(),
                      },
                      {
                        content: args[1].content,
                        role: "AI2",
                        timestamp: new Date(),
                      },
                    ]);
                  } catch (error) {
                    console.error('Error generating initial arguments:', error);
                    setError('Failed to generate initial arguments. Please try again.');
                  }
                };
                
                generateInitialArgs();
              }
            }
          } catch (error) {
            console.error('Error processing debate data:', error);
            setError('Error loading debate data. Please refresh the page.');
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up debate room:', error);
        setError('Error setting up debate room. Please try again.');
      }
    }
  }, [debateId, debateAI, apiKey]);

  const handleDebateMessage = useCallback((message: { content: string; role: 'AI1' | 'AI2'; timestamp: Date }) => {
    if (message.role === 'AI1') {
      setProCards(prev => [...prev, message.content]);
    } else {
      setConCards(prev => [...prev, message.content]);
    }
    setChat(prev => [...prev, {
      content: message.content,
      role: message.role,
      timestamp: new Date(message.timestamp)
    }]);
  }, []);

  const handleTypingStatus = useCallback(({ side, isTyping }: { side: 'pro' | 'con'; isTyping: boolean }) => {
    setTyping(prev => ({
      ...prev,
      [side === 'pro' ? 'pro' : 'con']: isTyping
    }));
  }, []);

  // Connect to socket and join room
  useEffect(() => {
    if (!socket || !isInitialized || !debateId) return;

    try {
      // Join the debate room
      joinRoom(socket, debateId);
      console.log('Joined debate room:', debateId);

      // Set up event listeners
      socket.on('debate-message', handleDebateMessage);
      socket.on('debate-typing', handleTypingStatus);

      return () => {
        leaveRoom(socket, debateId);
        socket.off('debate-message', handleDebateMessage);
        socket.off('debate-typing', handleTypingStatus);
      };
    } catch (error) {
      console.error('Error setting up debate room:', error);
      setError('Failed to join debate room. Please refresh the page.');
    }
  }, [debateId, socket, isInitialized, handleDebateMessage, handleTypingStatus]);

  // Update handleVote to use Firebase
  const handleVote = async (side: "pro" | "con") => {
    if (!debateId) return;
    
    try {
      const votesRef = ref(database, `debates/${debateId}/votes`);
      const newVotes = { ...votes, [side]: votes[side] + 1 };
      await update(votesRef, newVotes);
    } catch (error) {
      console.error('Error updating vote:', error);
      setError('Failed to update vote. Please try again.');
    }
  };

  // Update startDebateRounds to use socket from context
  const startDebateRounds = async () => {
    if (!debateAI || debateRunning || !debateId || !socket || !isConnected) return;
    
    try {
      setDebateRunning(true);
      setCurrentRound(1);
      setError(null);

      // Use local variables to track the conversation
      let localProCards = [...proCards];
      let localConCards = [...conCards];

      for (let round = 1; round <= rounds; round++) {
        // PRO AI TURN
        setTyping({ pro: true, con: false });
        sendDebateTyping(socket, debateId, 'pro', true);
        const lastConMessage = localConCards[localConCards.length - 1];
        const proResponse = await debateAI.generateProResponse(lastConMessage);
        localProCards.push(proResponse);
        setProCards([...localProCards]);
        
        // Send pro response through socket
        sendDebateMessage(socket, debateId, {
          content: proResponse,
          role: 'AI1',
          timestamp: new Date()
        });
        
        setTyping({ pro: false, con: false });
        sendDebateTyping(socket, debateId, 'pro', false);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // CON AI TURN
        setTyping({ pro: false, con: true });
        sendDebateTyping(socket, debateId, 'con', true);
        const lastProMessage = localProCards[localProCards.length - 1];
        const conResponse = await debateAI.generateConResponse(lastProMessage);
        localConCards.push(conResponse);
        setConCards([...localConCards]);
        
        // Send con response through socket
        sendDebateMessage(socket, debateId, {
          content: conResponse,
          role: 'AI2',
          timestamp: new Date()
        });
        
        setTyping({ pro: false, con: false });
        sendDebateTyping(socket, debateId, 'con', false);
        setCurrentRound(round + 1);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Debate error:', error);
      setError('An error occurred during the debate. Please try again.');
    } finally {
      setDebateRunning(false);
      setTyping({ pro: false, con: false });
    }
  };

  // Handler to stop the debate
  const handleStopDebate = () => {
    setDebateRunning(false);
    setTyping({ pro: false, con: false });
  };

  // Update handleResetDebate to use socket from context
  const handleResetDebate = async () => {
    if (!socket || !isConnected) {
      setError('Socket not connected. Please refresh the page.');
      return;
    }

    try {
      setError(null);
      // Reset all debate state
      setCurrentRound(0);
      setProCards([]);
      setConCards([]);
      setChat([]);
      setArguments([]);
      setDebateRunning(false);
      setTyping({ pro: false, con: false });

      // Generate new initial arguments
      if (debateAI && topic) {
        const initialArgs = await debateAI.generateInitialArguments();
        setArguments(initialArgs);
        
        // Send initial arguments through socket
        sendDebateMessage(socket, debateId, {
          content: initialArgs[0].content,
          role: 'AI1',
          timestamp: new Date()
        });
        
        sendDebateMessage(socket, debateId, {
          content: initialArgs[1].content,
          role: 'AI2',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error resetting debate:', error);
      setError('Failed to reset debate. Please try again.');
    }
  };

  // Helper to determine winner
  const getWinner = () => {
    if (votes.pro > votes.con) return BOT_NAMES.pro;
    if (votes.con > votes.pro) return BOT_NAMES.con;
    return "Tie";
  };

  const debateFinished = !debateRunning && currentRound > rounds;

  // Update the round status display to be more informative
  const getRoundStatus = () => {
    if (!debateAI) return "Loading...";
    if (!debateRunning && currentRound === 0) return "Ready to Start";
    if (debateRunning) {
      if (typing.pro) return `Round ${currentRound}: Pro AI is formulating response...`;
      if (typing.con) return `Round ${currentRound}: Con AI is formulating response...`;
      return `Round ${currentRound} in Progress`;
    }
    if (currentRound > rounds) return "Debate Complete";
    return `Round ${currentRound} of ${rounds}`;
  };

  return (
    <div className="min-h-screen bg-[#181f2a] p-8 flex flex-col items-center">
      {error && (
        <div className="w-full max-w-4xl mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}
      <h2 className="text-2xl font-bold mb-2 text-white text-center">
        Topic: {topic}
      </h2>
      {/* Room ID Share/Copy UI */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-mono text-sm">Room ID:</span>
          <span className="bg-gray-800 text-blue-300 px-2 py-1 rounded font-mono text-sm select-all">{debateId}</span>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
            onClick={async () => {
              await copyToClipboard(debateId);
              alert('Room ID copied to clipboard!');
            }}
          >
            Copy Room ID
          </button>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
            onClick={async () => {
              const url = `${window.location.origin}/debate/${debateId}`;
              await copyToClipboard(url);
              alert('Room link copied to clipboard!');
            }}
          >
            Copy Room Link
          </button>
        </div>
      </div>
      <div className="text-center text-gray-300 mb-4">
        {getRoundStatus()}
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
          <div className="flex flex-col gap-2 mt-2 h-[300px] overflow-y-auto pr-2 custom-scrollbar pro-scrollbar">
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
          <div className="flex flex-col gap-2 mt-2 h-[300px] overflow-y-auto pr-2 custom-scrollbar con-scrollbar">
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
              onClick={() => router.push('/debate')}
            >
              Create New Debate
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
          className="w-16 px-2 py-1 rounded border border-gray-400 text-white bg-[#232b39]"
        />
        <button
          className={`px-6 py-2 rounded font-bold text-white ${
            debateRunning 
              ? "bg-gray-500 cursor-not-allowed" 
              : "bg-blue-500 hover:bg-blue-600"
          } transition`}
          onClick={startDebateRounds}
          disabled={debateRunning}
        >
          {debateRunning ? "Debate in Progress..." : `Start ${rounds} Rounds`}
        </button>
        {debateRunning && (
          <button
            className="px-6 py-2 rounded font-bold text-white bg-red-600 hover:bg-red-700 transition"
            onClick={handleStopDebate}
          >
            Stop Debate
          </button>
        )}
        {!debateRunning && currentRound > 0 && (
          <button
            className="px-6 py-2 rounded font-bold text-white bg-gray-600 hover:bg-gray-700 transition"
            onClick={handleResetDebate}
          >
            Reset Debate
          </button>
        )}
      </div>
      {/* Live Chat Component */}
      <LiveChat 
        debateId={debateId} 
        isDebateRunning={debateRunning}
      />
    </div>
  );
}
