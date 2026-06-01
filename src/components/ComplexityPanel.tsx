/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Waves, Target, Atom, X, Play } from 'lucide-react';
import { DifficultyLevel } from '../types';
import { gameAudio } from '../utils/audio';

interface ComplexityPanelProps {
  onSelect: (difficulty: DifficultyLevel) => void;
  onClose: () => void;
  selectedMode: string;
}

interface DifficultyOption {
  level: DifficultyLevel;
  title: string;
  tagline: string;
  desc: string;
  icon: any;
  color: string;
}

const DIFFICULTIES: DifficultyOption[] = [
  {
    level: 'zen',
    title: 'Zen',
    tagline: 'Very Easy • Relaxing',
    desc: 'Perfect for clearing your mind. Generous clues to let you breeze through the grid.',
    icon: Coffee,
    color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
  },
  {
    level: 'flow',
    title: 'Flow',
    tagline: 'Easy - Medium',
    desc: 'Engage your thoughts. A perfectly balanced experience that gets you in the zone quickly.',
    icon: Waves,
    color: 'text-sky-500 bg-sky-50 border-sky-100',
  },
  {
    level: 'focus',
    title: 'Focus',
    tagline: 'Medium - Hard',
    desc: 'A robust workout for the logical mind. Deep strategy required with few direct clues.',
    icon: Target,
    color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
  },
  {
    level: 'quantum',
    title: 'Quantum',
    tagline: 'Expert Challenge',
    desc: 'For Sudoku Masters only. Heavy backtracking, absolute precision, and expert deductive reasoning.',
    icon: Atom,
    color: 'text-violet-500 bg-violet-50 border-violet-100',
  },
];

export default function ComplexityPanel({ onSelect, onClose, selectedMode }: ComplexityPanelProps) {
  const [selected, setSelected] = useState<DifficultyLevel>('flow');

  const handleSelect = (level: DifficultyLevel) => {
    gameAudio.playClick();
    setSelected(level);
  };

  const handleConfirm = () => {
    gameAudio.playClick();
    onSelect(selected);
  };

  const handleCancel = () => {
    gameAudio.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-xs z-50 flex items-end justify-center transition-all">
      {/* Dimmer backdrop */}
      <div className="absolute inset-0" onClick={handleCancel} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-xl bg-white/40 backdrop-blur-md rounded-t-3xl border-t border-white/60 p-6 shadow-2xl flex flex-col gap-6 z-10"
        id="complexity-slideup-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#4A5568] flex items-center gap-2">
              Select Difficulty Level
            </h3>
            <p className="text-[10px] text-[#87CEEB] font-bold uppercase tracking-widest mt-0.5">
              Playing {selectedMode === 'numbers' ? 'Numbers Mode' : 'A-I Mode'}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-full hover:bg-white/60 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            id="complexity-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Cards */}
        <div className="flex flex-col gap-3" id="difficulty-options-list">
          {DIFFICULTIES.map((opt) => {
            const isSel = selected === opt.level;
            const IconComponent = opt.icon;
            return (
              <button
                key={opt.level}
                onClick={() => handleSelect(opt.level)}
                className={`w-full p-3 text-left rounded-xl border flex gap-3 transition-all duration-200 cursor-pointer outline-none ${
                  isSel
                    ? 'border-[#4DA6FF] bg-[#E0F4FF]/50 shadow-[0_0_12px_rgba(77,166,255,0.25)] font-semibold'
                    : 'border-white/40 bg-white/40 hover:bg-white/60'
                }`}
                id={`difficulty-choice-${opt.level}`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 flex items-center justify-center border ${opt.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#4A5568]">{opt.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 text-[#4DA6FF] font-bold">
                      {opt.tagline}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5568]/60 leading-relaxed max-w-sm">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 bg-white/50 border border-white hover:bg-white text-[#4A5568] font-bold rounded-2xl transition cursor-pointer text-sm"
            id="complexity-cancel-btn"
          >
            Go Back
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-[#4DA6FF] hover:bg-[#3BA7FF] active:scale-[0.98] text-white font-bold rounded-2xl transition cursor-pointer text-sm flex items-center justify-center gap-2 shadow-sm"
            id="complexity-confirm-btn"
          >
            <span>Play Game</span>
            <Play className="w-4 h-4 fill-white" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
