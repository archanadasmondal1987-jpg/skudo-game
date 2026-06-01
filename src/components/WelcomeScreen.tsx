/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Sparkles, Play } from 'lucide-react';
import { PlayerProfile } from '../types';
import { gameAudio } from '../utils/audio';

interface WelcomeScreenProps {
  profile: PlayerProfile;
  onNext: () => void;
}

export default function WelcomeScreen({ profile, onNext }: WelcomeScreenProps) {
  const handleStart = () => {
    gameAudio.playClick();
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 shadow-xl text-center flex flex-col items-center gap-8 relative"
      id="welcome-card"
    >
      {profile.avatarUrl ? (
        <div className="relative">
          <div className="w-20 h-20 bg-white/60 border border-white rounded-full p-1 overflow-hidden shadow-sm shrink-0">
            <img 
              src={profile.avatarUrl} 
              alt={profile.name} 
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 bg-sky-100 border border-white rounded-full text-[#4DA6FF] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white/60 border border-white rounded-full text-[#4DA6FF] shadow-sm">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[#87CEEB] font-bold">
          Welcome
        </span>
        <h1 className="font-sans text-3xl font-extrabold tracking-tight text-[#4A5568]" id="welcome-player-name">
          Hello, {profile.name}
        </h1>
        <p className="text-xs italic text-[#4A5568]/80 mt-2 font-mono leading-relaxed px-2">
          "Great players don't just move pieces—they move possibilities."
        </p>
      </div>

      {/* Decorative user skill info bar */}
      <div className="w-full p-3.5 bg-white/50 border border-white rounded-2xl text-xs text-[#4A5568] flex justify-between items-center">
        <span className="font-bold text-[#87CEEB] text-[10px] uppercase tracking-wider">Skill Tier</span>
        <span className="px-3 py-1 bg-[#4DA6FF] text-white font-bold rounded-md shadow-xs">
          {profile.experience}
        </span>
      </div>

      <button
        onClick={handleStart}
        className="w-full py-4 bg-[#4DA6FF] hover:bg-[#3BA7FF] active:scale-[0.98] text-white font-bold rounded-2xl shadow-md transition duration-200 cursor-pointer flex items-center justify-center gap-2 text-lg"
        id="welcome-start-btn"
      >
        <span>Start Playing</span>
        <Play className="w-5 h-5 fill-white" />
      </button>
    </motion.div>
  );
}
