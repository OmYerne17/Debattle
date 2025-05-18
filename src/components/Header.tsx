"use client";

import { FaCube } from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-[#232b39] p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-3xl text-blue-400"><FaCube /></span>
          <Link href="/" className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent select-none cursor-pointer">
            Debattle
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/debate" className="text-white hover:text-blue-400 transition">
                Create Debate
              </Link>
              <Link href="/join-room" className="text-white hover:text-blue-400 transition">
                Join Room
              </Link>
              <Link href="/history" className="text-white hover:text-blue-400 transition">
                History
              </Link>
              <button
                onClick={handleLogout}
                className="text-white hover:text-blue-400 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white hover:text-blue-400 transition">
                Login
              </Link>
              <Link href="/signup" className="text-white hover:text-blue-400 transition">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
} 