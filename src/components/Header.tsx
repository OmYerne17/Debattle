"use client";

import { FaCube } from "react-icons/fa";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { HiUser, HiX } from "react-icons/hi";

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-[#1a1f2c] to-[#232b39] p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-3xl text-blue-400"><FaCube /></span>
          <Link href="/" className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent select-none cursor-pointer">
            Debattle
          </Link>
        </div>

        {/* Profile button */}
        <button 
          className="md:hidden text-white p-2 hover:text-blue-400 transition-colors duration-200"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <HiX size={24} /> : <HiUser size={24} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link href="/debate" className="text-white hover:text-blue-400 transition-colors duration-200">
                Create Debate
              </Link>
              <Link href="/join-room" className="text-white hover:text-blue-400 transition-colors duration-200">
                Join Room
              </Link>
              <Link href="/history" className="text-white hover:text-blue-400 transition-colors duration-200">
                History
              </Link>
              <button
                onClick={handleLogout}
                className="text-white hover:text-blue-400 transition-colors duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white hover:text-blue-400 transition-colors duration-200">
                Login
              </Link>
              <Link href="/signup" className="text-white hover:text-blue-400 transition-colors duration-200">
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#1a1f2c] md:hidden shadow-lg">
            <nav className="flex flex-col p-4 space-y-4">
              {user ? (
                <>
                  <Link 
                    href="/debate" 
                    className="text-white hover:text-blue-400 transition-colors duration-200 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Debate
                  </Link>
                  <Link 
                    href="/join-room" 
                    className="text-white hover:text-blue-400 transition-colors duration-200 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Join Room
                  </Link>
                  <Link 
                    href="/history" 
                    className="text-white hover:text-blue-400 transition-colors duration-200 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    History
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-white hover:text-blue-400 transition-colors duration-200 py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-white hover:text-blue-400 transition-colors duration-200 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    className="text-white hover:text-blue-400 transition-colors duration-200 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 