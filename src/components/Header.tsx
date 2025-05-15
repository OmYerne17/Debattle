'use client';

import { FaCube, FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const Header = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const toggleSignOut = () => {
    setShowSignOut(!showSignOut);
  };
  
  return (
    <header className="w-full sticky top-0 z-50 bg-[#181f2a] border-b border-gray-800 shadow">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl text-blue-400"><FaCube /></span>
          <span onClick={() => router.push("/")} className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent select-none cursor-pointer">Debattle</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="relative">
              <span 
                className="text-3xl text-gray-300 cursor-pointer hover:text-blue-400 transition"
                onClick={toggleSignOut}
              >
                <FaUserCircle />
              </span>
              {showSignOut && (
                <div className="absolute right-0 mt-2 bg-[#232b39] rounded-lg shadow-lg p-4 border border-gray-700 min-w-[200px]">
                  <div className="mb-3 pb-3 border-b border-gray-700">
                    <div className="text-gray-300 font-medium">{user.email}</div>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button 
                onClick={handleSignUp}
                className="px-4 py-1 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition"
              >
                Signup
              </button>
              <button 
                onClick={handleLogin}
                className="px-4 py-1 rounded bg-purple-500 text-white font-bold hover:bg-purple-600 transition"
              >
                Login
              </button>
            </>
          )}
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
        <div className="md:hidden bg-[#232b39] border-t border-gray-800 ">
          <div className="flex flex-col items-center py-4 gap-4">
            {user ? (
              <>
                <div className='rounded-2xl bg-blue-500 px-2 py-1'>
                  <span className="text-gray-300">
                    {user.email?.trim().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 cursor-pointer" onClick={toggleSignOut}>
                  <FaUserCircle className="text-2xl" />
                  <span>Profile</span>
                </div>
                {showSignOut && (
                  <button 
                    onClick={handleSignOut}
                    className="w-4/5 px-4 py-2 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition"
                  >
                    Sign Out
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  onClick={handleSignUp}
                  className="w-4/5 px-4 py-2 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition"
                >
                  Signup
                </button>
                <button 
                  onClick={handleLogin}
                  className="w-4/5 px-4 py-2 rounded bg-purple-500 text-white font-bold hover:bg-purple-600 transition"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 