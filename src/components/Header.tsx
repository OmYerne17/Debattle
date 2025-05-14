import { FaCube, FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Header = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="w-full sticky top-0 z-50 bg-[#181f2a] border-b border-gray-800 shadow">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl text-blue-400"><FaCube /></span>
          <span onClick={() => router.push("/")} className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent select-none">Debattle</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          <button className="px-4 py-1 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition">Signup</button>
          <button className="px-4 py-1 rounded bg-purple-500 text-white font-bold hover:bg-purple-600 transition">Login</button>
          <span className="text-3xl text-gray-300 ml-2 cursor-pointer"><FaUserCircle /></span>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-2xl text-gray-300"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#232b39] border-t border-gray-800">
          <div className="flex flex-col items-center py-4 gap-4">
            <button className="w-4/5 px-4 py-2 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition">Signup</button>
            <button className="w-4/5 px-4 py-2 rounded bg-purple-500 text-white font-bold hover:bg-purple-600 transition">Login</button>
            <div className="flex items-center gap-2 text-gray-300">
              <FaUserCircle className="text-2xl" />
              <span>Profile</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 