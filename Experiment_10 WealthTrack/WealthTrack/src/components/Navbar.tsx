import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { LogOut, User as UserIcon, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, profile } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Wallet size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:inline-block">WealthTrack</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-gray-900">{profile?.displayName}</span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => auth.signOut()}
                className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
