'use client'
import { FaRegCommentDots, FaGlobe, FaChartLine, FaUserSecret, FaBitcoin, FaHeart } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Header from '@/components/Header';

export default function Home() {
  const router = useRouter();

  // Popular topics data
  const topics = [
    {
      icon: <FaRegCommentDots className="text-purple-400" />,
      title: "AI & Ethics",
      description: "Should artificial intelligence be regulated?",
    },
    {
      icon: <FaGlobe className="text-green-400" />,
      title: "Climate Change",
      description: "Is climate change the biggest threat to humanity?",
    },
    {
      icon: <FaChartLine className="text-yellow-400" />,
      title: "Future of Work",
      description: "Will remote work become the new standard?",
    },
    {
      icon: <FaUserSecret className="text-pink-400" />,
      title: "Digital Privacy",
      description: "Should social media be more strictly regulated?",
    },
    {
      icon: <FaBitcoin className="text-blue-400" />,
      title: "Cryptocurrency",
      description: "Is cryptocurrency the future of finance?",
    },
    {
      icon: <FaHeart className="text-purple-400" />,
      title: "Healthcare",
      description: "Should healthcare be free for everyone?",
    },
  ];

  // Project flow steps
  const flow = [
    {
      step: 1,
      title: "Select Topic",
      desc: "Choose or search for a debate topic that interests you.",
    },
    {
      step: 2,
      title: "Debate",
      desc: "Watch AI bots debate both sides, or join the chat as a user.",
    },
    {
      step: 3,
      title: "Vote",
      desc: "Cast your vote for the side you think argued best.",
    },
    {
      step: 4,
      title: "See Winner",
      desc: "View the results in voting bar @ and see which side won!",
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#181f2a] flex flex-col items-center px-4 pb-20">
        {/* Hero Section */}
        <section className="w-full max-w-4xl text-center mt-16 mb-16">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">Welcome to Debattle</h1>
          <p className="text-lg text-gray-300 mb-8">
            Debattle is an interactive platform where AI and users engage in lively debates on trending topics. Watch AI bots argue both sides, join the chat, and vote for the winner. Perfect for learning, fun, and sharpening your critical thinking skills!
          </p>
          <button
            className="px-8 py-3 rounded-lg font-bold text-lg bg-blue-500 text-white hover:bg-blue-600 transition mb-2 shadow-lg"
            onClick={() => router.push("/debate")}
          >
            Start a Debate
          </button>
        </section>

        {/* Project Flow Section */}
        <section className="w-full max-w-4xl mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            {flow.map((f) => (
              <div key={f.step} className="flex flex-col items-center bg-[#232b39] rounded-xl p-6 shadow-lg w-full md:w-1/4">
                <div className="text-3xl font-bold text-blue-400 mb-2">{f.step}</div>
                <div className="text-xl font-bold text-white mb-1">{f.title}</div>
                <div className="text-gray-300 text-center text-sm">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Debate Topics Section */}
        <section className="w-full max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Popular Debate Topics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {topics.map((topic) => (
              <div key={topic.title} className="bg-[#232b39] rounded-xl p-8 flex flex-col items-center shadow-lg">
                <div className="text-4xl mb-4">{topic.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{topic.title}</h3>
                <p className="text-gray-300 text-center">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
