/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Award,
  Shield,
  RotateCcw,
  Sparkles,
  Eraser,
  HelpCircle,
  ToggleLeft,
  Volume2,
  VolumeX,
  BookOpen,
  Calendar,
  BarChart3,
  Globe,
  Home,
  CheckCircle,
  Play,
  Pause,
  Star,
  Lock,
  Trophy,
  Bot,
  Mic,
  MicOff,
  Send,
  Loader2,
  Download,
  Image,
  X
} from 'lucide-react';
import { CellState, DifficultyLevel, GameMode, PlayerProfile, HistoryState, LeaderboardEntry, DailyChallenge } from '../types';
import { generatePuzzle, generateVariantPuzzle, initializeBoard, getCellDisplay, isValidPlacement, localizeNumber } from '../utils/sudoku';
import { solveSudoku } from '../utils/lensSolver';
import { gameAudio } from '../utils/audio';
import { ACHIEVEMENTS, getXpLevel } from '../utils/achievements';
import { TUTORIALS } from '../utils/tutorial';
import BlueFirecrackerCelebration from './BlueFirecrackerCelebration';

interface GameInterfaceProps {
  profile: PlayerProfile;
  initialMode: GameMode;
  initialDifficulty: DifficultyLevel;
  initialSpecialGame?: 'daily' | 'weekly' | 'monthly' | null;
  initialBoss?: any;
  initialVariant?: string;
  onUpdateProfile: (p: PlayerProfile) => void;
  onExitToMenu: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export default function GameInterface({
  profile,
  initialMode,
  initialDifficulty,
  initialSpecialGame = null,
  initialBoss = null,
  initialVariant = 'classic',
  onUpdateProfile,
  onExitToMenu,
}: GameInterfaceProps) {
  // Game Setup States
  const [mode, setMode] = useState<GameMode>(initialSpecialGame ? 'numbers' : initialMode);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialSpecialGame 
      ? (initialSpecialGame === 'daily' ? 'focus' : 'quantum') 
      : initialDifficulty
  );
  const [variant, setVariant] = useState<string>(initialVariant);
  const [boss, setBoss] = useState<any>(initialBoss);
  const [bossHealth, setBossHealth] = useState<number>(initialBoss ? initialBoss.health : 100);
  const [bossDialogue, setBossDialogue] = useState<string>(initialBoss ? initialBoss.dialogue : '');
  const [board, setBoard] = useState<CellState[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);

  // Stats / Gameplay tracking
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [undosUsed, setUndosUsed] = useState(0);
  const [erasesUsed, setErasesUsed] = useState(0);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintCoachingMode, setHintCoachingMode] = useState<'socratic' | 'reveal'>('socratic');
  const [hasAppliedHintThisSession, setHasAppliedHintThisSession] = useState(false);
  const [gameActive, setGameActive] = useState(true);

  // UI state
  const [notesMode, setNotesMode] = useState(false);
  const [isMuted, setIsMuted] = useState(gameAudio.getMuted());
  const [isShaking, setIsShaking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeTab, setActiveTab] = useState<'academy' | 'challenges' | 'stats' | 'globals' | 'ai' | null>(null);

  // Skudo AI Assistant States for Playing Board
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [coachVoice, setCoachVoice] = useState<string>(() => localStorage.getItem('skudo_coach_voice') || 'neural');
  const [aiChat, setAiChat] = useState<Array<{ sender: 'user' | 'siri'; text: string; id: string; imageUrl?: string }>>([
    {
      id: 'welcome-in-game',
      sender: 'siri',
      text: "Hello! I'm your in-game Skudo AI, powered by Google Gemini AI. I'm your logic partner: feel free to ask me any rule queries or type commands, or toggle voice mode using the microphone below!",
    }
  ]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Scroll logic for the dynamic Siri chat log
  useEffect(() => {
    if (activeTab === 'ai') {
      const scrollContainer = document.getElementById('in-game-ai-conversation-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [aiChat, aiLoading, activeTab]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Clean markdown, symbols, and remove emoji to prevent speech engines from pronouncing emoji literally.
    // Also add smart abbreviations expansion and phonetical adjustments for premium pronunciation of "Sudoku" and "Skudo"
    const cleanText = text
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/#+\s/g, '')
      .replace(/`[^`]*`/g, '')
      // Remove symbols that interrupt flow or cause stutters
      .replace(/[|•:\-_]/g, ' ')
      // Remove visual emoji completely so the TTS engine doesn't read them literally (e.g. "warning sign", "glowing star")
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Expand abbreviations for high fluency and natural phrasing
      .replace(/\bvs\b\.?/gi, 'versus')
      .replace(/\be\.g\./gi, 'for example,')
      .replace(/\bi\.e\./gi, 'that is,')
      .replace(/\bmax\b\.?/gi, 'maximum')
      .replace(/\bmin\b\.?/gi, 'minimum')
      .replace(/\bsec\b\.?/gi, 'seconds')
      .replace(/\bhr\b\.?/gi, 'hour')
      .replace(/\bqty\b\.?/gi, 'quantity')
      .replace(/\bpts\b\.?/gi, 'points')
      // Custom phonetics for stunningly realistic rendering of key brand words
      .replace(/\bSudoku\b/gi, 'Soo-doh-koo')
      .replace(/\bSkudo\b/gi, 'Skoo-doh')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    const activeLang = typeof localStorage !== 'undefined' ? (localStorage.getItem('skudo_lang') || 'en') : 'en';
    let targetLang = activeLang.toLowerCase();
    
    // Sort and prioritize high-quality neural, natural, online and premium voices
    let languageVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(targetLang));
    if (languageVoices.length === 0) {
      languageVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith('en'));
    }

    const scoredVoices = languageVoices
      .map(voice => {
        let score = 0;
        const name = voice.name.toLowerCase();
        
        // Language locale priorities (US English first, then British English, then other English)
        if (voice.lang.includes('en-US') || voice.lang.includes(targetLang + '-')) score += 100;
        else score += 50;

        // Custom selected voice filter boost!
        if (coachVoice === 'male') {
          if (name.includes('david') || name.includes('george') || name.includes('mark') || name.includes('male') || name.includes('james')) {
            score += 500;
          }
        } else if (coachVoice === 'female') {
          if (name.includes('zira') || name.includes('siri') || name.includes('samantha') || name.includes('aria') || name.includes('hazel') || name.includes('female') || name.includes('karen')) {
            score += 500;
          }
        } else if (coachVoice === 'neural') {
          if (name.includes('online') || name.includes('natural') || name.includes('neural') || name.includes('google')) {
            score += 500;
          }
        }

        // Neural/Online voices are highly lifelike - major score boost
        if (name.includes('online')) score += 300; // Edge/Chrome online neural voices
        if (name.includes('natural')) score += 250; // Apple/Google natural voices
        if (name.includes('neural')) score += 200;  // general neural
        if (name.includes('google')) score += 150;  // Google neural
        if (name.includes('premium')) score += 120; // Premium offline
        
        return { voice, score };
      })
      .sort((a, b) => b.score - a.score);

    const chosenVoice = scoredVoices.length > 0 ? scoredVoices[0].voice : null;

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = activeLang;
    }
    
    // Set parameters for premium clarity and steady cadence
    // Slightly slower and highly deliberate voice articulation
    utterance.rate = 0.96;
    utterance.pitch = coachVoice === 'male' ? 0.95 : 1.02; // Deeper for male, crispy for neural/female

    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleMicrophoneClick = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition is unsupported in this browser. Try Chrome/Safari!");
      setTimeout(() => setMicError(null), 3000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      gameAudio.playClick();
      handleStopSpeaking();
      setMicError(null);

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition error:", event.error);
        setMicError(`Mic Error: ${event.error}`);
        setIsListening(false);
        setTimeout(() => setMicError(null), 3050);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setAiQuery(transcript);
          handleSendQuery(transcript);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error(err);
      setMicError("Cannot initialize microphone.");
      setIsListening(false);
      setTimeout(() => setMicError(null), 3000);
    }
  };

  const handleSendQuery = async (queryToSend?: string) => {
    const textQuery = queryToSend || aiQuery;
    if (!textQuery.trim()) return;

    gameAudio.playClick();
    handleStopSpeaking();

    // Check if prompt is requesting image visualization/creation
    const isImageRequest = /generate\s*(an?)?\s*image|create\s*(an?)?\s*image|make\s*(an?)?\s*image|generate\s*(an?)?\s*picture|create\s*(an?)?\s*picture|make\s*(an?)?\s*picture|draw|paint|visualize|show\s*(an?)?\s*image|show\s*(an?)?\s*picture|illustration|create\s*a\s*visual|photo|sketch|render/i.test(textQuery);

    const userMessage = { 
      sender: 'user' as const, 
      text: textQuery, 
      id: `user-${Date.now()}`
    };
    setAiChat(prev => [...prev, userMessage]);
    setAiQuery('');
    setAiLoading(true);

    const siriMessageId = `siri-${Date.now()}`;

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: textQuery, 
          stream: !isImageRequest,
          lang: localStorage.getItem('skudo_lang') || 'en'
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errText = data.error || "Server issue encountered. Check your connection or API configuration.";
        const siriMessage = { sender: 'siri' as const, text: `⚠️ Skudo AI Error: ${errText}`, id: `siri-err-${Date.now()}` };
        setAiChat(prev => [...prev, siriMessage]);
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (isImageRequest || contentType.includes('application/json')) {
        const data = await response.json();
        if (data.text || data.imageUrl) {
          const siriMessage = { 
            sender: 'siri' as const, 
            text: data.text || "Generated graphic for you.", 
            id: siriMessageId,
            imageUrl: data.imageUrl
          };
          setAiChat(prev => [...prev, siriMessage]);
          speakText(siriMessage.text);
        }
      } else {
        // Stream text chunk-by-chunk for instant Q&A cognitive feedback
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Body reader unavailable");

        const decoder = new TextDecoder();
        let done = false;
        let cumulativeText = "";

        const placeholderMsg = {
          sender: 'siri' as const,
          text: "",
          id: siriMessageId
        };
        setAiChat(prev => [...prev, placeholderMsg]);

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            cumulativeText += chunk;
            setAiChat(prev => prev.map(msg => msg.id === siriMessageId ? { ...msg, text: cumulativeText } : msg));
          }
        }

        if (cumulativeText) {
          speakText(cumulativeText);
        }
      }
    } catch (e: any) {
      console.error("Fetch API error:", e);
      const siriMessage = { sender: 'siri' as const, text: "⚠️ Network Error: Could not connect to Skudo AI server.", id: `siri-net-${Date.now()}` };
      setAiChat(prev => [...prev, siriMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  // Victory/Loss Sheets
  const [showEndSheet, setShowEndSheet] = useState(false);
  const [endState, setEndState] = useState<'win' | 'lose' | null>(null);
  const [userRating, setUserRating] = useState(5); // 5 Blue Stars rating simulation

  // Completed/glowing state for lines & 3x3 blocks
  const [glowingRows, setGlowingRows] = useState<number[]>([]);
  const [glowingCols, setGlowingCols] = useState<number[]>([]);
  const [glowingBoxes, setGlowingBoxes] = useState<number[]>([]);

  // Offline Mock States (for premium challenges & leaderboards)
  const [highScores, setHighScores] = useState<LeaderboardEntry[]>([
    { id: '1', name: 'Sophia', score: 1200, time: 245, difficulty: 'quantum', mode: 'numbers', date: 'Today' },
    { id: '2', name: 'Liam', score: 850, time: 380, difficulty: 'focus', mode: 'numbers', date: 'Today' },
    { id: '3', name: 'Emily', score: 620, time: 420, difficulty: 'flow', mode: 'letters', date: 'Yesterday' },
  ]);

  const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'daily' | 'weekly'>('global');

  // Daily competitive tournament leaderboard state
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([
    { id: 'dl-1', name: 'Sebastian', score: 980, time: 270, difficulty: 'focus', mode: 'numbers', date: 'Today' },
    { id: 'dl-2', name: 'Clara', score: 850, time: 310, difficulty: 'focus', mode: 'numbers', date: 'Today' },
    { id: 'dl-3', name: 'Julian', score: 710, time: 395, difficulty: 'focus', mode: 'numbers', date: 'Today' },
    { id: 'dl-4', name: 'Aurora', score: 600, time: 420, difficulty: 'focus', mode: 'numbers', date: 'Today' },
  ]);

  // Weekly competitive championship leaderboard state
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([
    { id: 'wl-1', name: 'Evelyn', score: 1450, time: 420, difficulty: 'quantum', mode: 'numbers', date: 'This Week' },
    { id: 'wl-2', name: 'Alexander', score: 1320, time: 465, difficulty: 'quantum', mode: 'numbers', date: 'This Week' },
    { id: 'wl-3', name: 'Seraphina', score: 1100, time: 510, difficulty: 'quantum', mode: 'numbers', date: 'This Week' },
    { id: 'wl-4', name: 'Nolan', score: 920, time: 580, difficulty: 'quantum', mode: 'numbers', date: 'This Week' },
  ]);

  const [leaderboardCountdown, setLeaderboardCountdown] = useState(300); // 5 minutes in seconds

  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([
    { date: 'May 30', completed: false, score: 350, difficulty: 'flow', mode: 'numbers' },
    { date: 'May 29', completed: true, score: 500, difficulty: 'focus', mode: 'letters' },
    { date: 'May 28', completed: true, score: 300, difficulty: 'zen', mode: 'numbers' },
  ]);

  // Special Premium competitive modes states
  const [dailyHighScore, setDailyHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('skudo_daily_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [weeklyHighScore, setWeeklyHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('skudo_weekly_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [monthlyHighScore, setMonthlyHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('skudo_monthly_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lastPlayedDaily, setLastPlayedDaily] = useState<number>(() => {
    const saved = localStorage.getItem('skudo_last_played_daily');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lastPlayedWeekly, setLastPlayedWeekly] = useState<number>(() => {
    const saved = localStorage.getItem('skudo_last_played_weekly');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lastPlayedMonthly, setLastPlayedMonthly] = useState<number>(() => {
    const saved = localStorage.getItem('skudo_last_played_monthly');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [activeSpecialGame, setActiveSpecialGame] = useState<'daily' | 'weekly' | 'monthly' | null>(initialSpecialGame);
  const [now, setNow] = useState<number>(Date.now());

  const downloadCertificateFile = (tier: string, date: string, time: string, scoreVal: number, playerName: string) => {
    const formattedTier = tier === 'daily' ? 'Daily' : tier === 'weekly' ? 'Weekly' : 'Monthly';
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
        <defs>
          <radialGradient id="gold-shine" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFE066" />
            <stop offset="70%" stop-color="#F5B041" />
            <stop offset="100%" stop-color="#9A7D0A" />
          </radialGradient>
        </defs>
        
        <rect width="800" height="600" fill="#0F172A" rx="20" />
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="#1E293B" stroke-width="4" rx="16" />
        <rect x="35" y="35" width="730" height="530" fill="#1E293B" rx="12" opacity="0.6"/>
        <rect x="50" y="50" width="700" height="500" fill="#0A0F1D" stroke="url(#gold-shine)" stroke-width="3" rx="8" />
        
        <path d="M 60 90 L 60 60 L 90 60" fill="none" stroke="url(#gold-shine)" stroke-width="2" />
        <path d="M 740 90 L 740 60 L 710 60" fill="none" stroke="url(#gold-shine)" stroke-width="2" />
        <path d="M 60 510 L 60 540 L 90 540" fill="none" stroke="url(#gold-shine)" stroke-width="2" />
        <path d="M 740 510 L 740 540 L 710 540" fill="none" stroke="url(#gold-shine)" stroke-width="2" />
        
        <text x="400" y="110" font-family="'Inter', sans-serif" font-weight="900" font-size="12" fill="#38BDF8" letter-spacing="6" text-anchor="middle">SKUDO LENS VISION CORE</text>
        <text x="400" y="160" font-family="'Inter', sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">CHAMPIONSHIP CERTIFICATE</text>
        
        <line x1="250" y1="185" x2="550" y2="185" stroke="#334155" stroke-width="1.5" />
        
        <text x="400" y="235" font-family="'Inter', sans-serif" font-size="14" fill="#94A3B8" text-anchor="middle">This document officially recognizes that elite player</text>
        
        <text x="400" y="295" font-family="'Inter', sans-serif" font-weight="900" font-size="36" fill="#F5B041" text-anchor="middle">\${playerName.toUpperCase()}</text>
        <line x1="200" y1="315" x2="600" y2="315" stroke="url(#gold-shine)" stroke-width="2" />
        
        <text x="400" y="355" font-family="'Inter', sans-serif" font-size="15" fill="#E2E8F0" text-anchor="middle" font-weight="600">has successfully conquered the ultra-high stakes</text>
        <text x="400" y="395" font-family="'Inter', sans-serif" font-weight="800" font-size="24" fill="#38BDF8" text-anchor="middle" letter-spacing="1.5">\${formattedTier.toUpperCase()} SUDOKU TOURNAMENT</text>
        
        <g transform="translate(100, 430)">
          <rect x="20" y="0" width="165" height="55" fill="#111827" stroke="#1E293B" rx="8" />
          <text x="102" y="20" font-family="'Inter', sans-serif" font-weight="700" font-size="9" fill="#64748B" text-anchor="middle" letter-spacing="1">DATE COMPLETED</text>
          <text x="102" y="42" font-family="'Inter', sans-serif" font-weight="800" font-size="12" fill="#F8FAFC" text-anchor="middle">\${date}</text>
          
          <rect x="205" y="0" width="165" height="55" fill="#111827" stroke="#1E293B" rx="8" />
          <text x="287" y="20" font-family="'Inter', sans-serif" font-weight="700" font-size="9" fill="#64748B" text-anchor="middle" letter-spacing="1">TIME TAKEN</text>
          <text x="287" y="42" font-family="'Inter', sans-serif" font-weight="800" font-size="14" fill="#38BDF8" text-anchor="middle">\${time}</text>
          
          <rect x="390" y="0" width="180" height="55" fill="#111827" stroke="#1E293B" rx="8" />
          <text x="480" y="20" font-family="'Inter', sans-serif" font-weight="700" font-size="9" fill="#64748B" text-anchor="middle" letter-spacing="1">SCORE SECURED</text>
          <text x="480" y="42" font-family="'Inter', sans-serif" font-weight="900" font-size="14" fill="#4ADE80" text-anchor="middle">\${scoreVal} PTS</text>
        </g>
        
        <circle cx="400" cy="525" r="30" fill="url(#gold-shine)" />
        <polygon points="390,525 400,510 410,525 400,540" fill="none" stroke="#000" stroke-width="1" />
        <path d="M 390 550 L 382 585 L 400 575 L 418 585 L 410 550 Z" fill="url(#gold-shine)" opacity="0.8"/>
      </svg>
    `;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const triggerLink = document.createElement('a');
    triggerLink.href = url;
    triggerLink.download = `Skudo_Championship_Certificate_\${formattedTier}_\${date.replace(/\\s+/g, '_')}.svg`;
    document.body.appendChild(triggerLink);
    triggerLink.click();
    document.body.removeChild(triggerLink);
    URL.revokeObjectURL(url);
  };

  // Effect to backport user scores on mount or layout switch
  useEffect(() => {
    if (dailyHighScore > 0) {
      setDailyLeaderboard((prev) => {
        if (prev.some(x => x.name.includes('(You)'))) return prev;
        const userEntry: LeaderboardEntry = {
          id: `user-daily-saved`,
          name: `${profile.name} (You)`,
          score: dailyHighScore,
          time: 320,
          difficulty: 'focus',
          mode: 'numbers',
          date: 'Today'
        };
        return [...prev, userEntry].sort((a, b) => b.score - a.score);
      });
    }
    if (weeklyHighScore > 0) {
      setWeeklyLeaderboard((prev) => {
        if (prev.some(x => x.name.includes('(You)'))) return prev;
        const userEntry: LeaderboardEntry = {
          id: `user-weekly-saved`,
          name: `${profile.name} (You)`,
          score: weeklyHighScore,
          time: 480,
          difficulty: 'quantum',
          mode: 'numbers',
          date: 'This Week'
        };
        return [...prev, userEntry].sort((a, b) => b.score - a.score);
      });
    }
  }, [dailyHighScore, weeklyHighScore, profile.name]);

  // Max Mistakes configured by difficulty
  const maxMistakes = difficulty === 'zen' ? 5 : difficulty === 'flow' ? 3 : difficulty === 'focus' ? 3 : 2;

  // Resource limits derived strictly from active game difficulty
  const getMaxLimits = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'zen':
        return { hints: 5, erases: 3, undos: 3 };
      case 'flow':
        return { hints: 3, erases: 2, undos: 2 };
      case 'focus':
        return { hints: 2, erases: 1, undos: 1 };
      case 'quantum':
      default:
        return { hints: 0, erases: 0, undos: 0 };
    }
  };

  const limits = getMaxLimits(difficulty);

  // Refs
  const timerRef = useRef<any>(null);
  const particleIdRef = useRef(0);
  const prevCompletsRef = useRef<{ rows: number[]; cols: number[]; boxes: number[] }>({
    rows: [],
    cols: [],
    boxes: [],
  });

  // Generate a new puzzle
  const startNewGame = (gMode = mode, gDiff = difficulty, preserveSpecial = false) => {
    let initialGrid = null;
    if (variant === 'lens-ocr-loaded') {
      try {
        const raw = localStorage.getItem('skudo_lens_loaded_digits');
        if (raw) {
          const loadedGrid = JSON.parse(raw);
          if (loadedGrid && loadedGrid.length === 9) {
            const solved = solveSudoku(loadedGrid);
            if (solved) {
              initialGrid = initializeBoard(loadedGrid, solved);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load custom lens board on restart", err);
      }
    }

    if (!initialGrid) {
      const isCustomVariant = variant && variant !== 'classic' && variant !== 'lens-ocr-loaded' && variant !== 'saved_session' && variant !== 'continue';
      const { solved, puzzle } = isCustomVariant
        ? generateVariantPuzzle(variant, gDiff)
        : generatePuzzle(gDiff);
      initialGrid = initializeBoard(puzzle, solved);
    }

    setBoard(initialGrid);
    setSelectedCell(null);
    setScore(0);
    setMistakes(0);
    setSeconds(0);
    setHistory([]);
    setHintsUsed(0);
    setUndosUsed(0);
    setErasesUsed(0);
    setNotesMode(false);
    setGameActive(true);
    setEndState(null);
    setShowEndSheet(false);
    setIsPaused(false);
    setGlowingRows([]);
    setGlowingCols([]);
    setGlowingBoxes([]);
    if (!preserveSpecial) {
      setActiveSpecialGame(null);
    }
    prevCompletsRef.current = { rows: [], cols: [], boxes: [] };
    gameAudio.startBackgroundMusic();
  };

  // Start new game on mount with saved session recovery
  useEffect(() => {
    if (initialVariant === 'saved_session' || initialVariant === 'continue') {
      try {
        const raw = localStorage.getItem('skudo_saved_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.board && parsed.board.length > 0) {
            setBoard(parsed.board);
            setMode(parsed.mode || 'numbers');
            setDifficulty(parsed.difficulty || 'flow');
            setVariant(parsed.variant || 'classic');
            setBoss(parsed.boss || null);
            setBossHealth(parsed.bossHealth !== undefined ? parsed.bossHealth : 100);
            setBossDialogue(parsed.bossDialogue || '');
            setScore(parsed.score || 0);
            setMistakes(parsed.mistakes || 0);
            setSeconds(parsed.seconds || 0);
            setGameActive(true);
            setEndState(null);
            setShowEndSheet(false);
            setIsPaused(false);
            setGlowingRows([]);
            setGlowingCols([]);
            setGlowingBoxes([]);
            prevCompletsRef.current = { rows: [], cols: [], boxes: [] };
            gameAudio.startBackgroundMusic();
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load saved session", err);
      }
    }

    if (initialVariant === 'lens-ocr-loaded') {
      try {
        const raw = localStorage.getItem('skudo_lens_loaded_digits');
        if (raw) {
          const loadedGrid = JSON.parse(raw);
          if (loadedGrid && loadedGrid.length === 9) {
            const solved = solveSudoku(loadedGrid);
            if (solved) {
              const initialGrid = initializeBoard(loadedGrid, solved);
              setBoard(initialGrid);
              setSelectedCell(null);
              setScore(0);
              setMistakes(0);
              setSeconds(0);
              setHistory([]);
              setHintsUsed(0);
              setUndosUsed(0);
              setErasesUsed(0);
              setNotesMode(false);
              setGameActive(true);
              setEndState(null);
              setShowEndSheet(false);
              setIsPaused(false);
              setGlowingRows([]);
              setGlowingCols([]);
              setGlowingBoxes([]);
              prevCompletsRef.current = { rows: [], cols: [], boxes: [] };
              gameAudio.startBackgroundMusic();
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to load lens ocr puzzle on mount", err);
      }
    }

    startNewGame(mode, difficulty, true);
    return () => {
      gameAudio.stopBackgroundMusic();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-save active game to localStorage on coordinates change
  useEffect(() => {
    if (gameActive && board && board.length > 0 && initialVariant !== 'saved_session') {
      try {
        const data = {
          board,
          mode,
          difficulty,
          variant,
          boss,
          bossHealth,
          bossDialogue,
          score,
          mistakes,
          seconds,
        };
        localStorage.setItem('skudo_saved_session', JSON.stringify(data));
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }
  }, [board, score, mistakes, seconds, mode, difficulty, variant, boss, bossHealth, bossDialogue, gameActive]);

  // Sync BGM on mount/mute changes
  useEffect(() => {
    if (isMuted) {
      gameAudio.stopBackgroundMusic();
    } else if (gameActive && !isPaused) {
      gameAudio.startBackgroundMusic();
    }
  }, [isMuted, isPaused, gameActive]);

  // Timer interval
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (gameActive && !isPaused && !showEndSheet) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameActive, isPaused, showEndSheet]);

  // Sparkles Particle Animation Tick
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // gravity drift
            size: p.size * 0.92, // shrink
          }))
          .filter((p) => p.size > 0.4)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [particles]);

  // Periodic global, daily, and weekly leaderboard simulator (Every 5 minutes, i.e., 300 seconds)
  useEffect(() => {
    const listFirstNames = [
      "Sophia", "Liam", "Emily", "Alexander", "Gabriel", "Chloe", 
      "Sebastian", "Evelyn", "Julian", "Aurora", "Clara", "Adrian", 
      "Elena", "Xavier", "Isla", "Maximus", "Seraphina", "Leo", 
      "Jasper", "Zara", "Tristan", "Phoebe", "Nolan", "Freya", 
      "Aria", "Mateo", "Zoe", "Oliver", "Maya", "Ethan", "Nova", 
      "Luna", "Kai", "Sienna", "Lucas", "Maya", "Hugo", "Iris"
    ];
    const listLastStyles = [
      "K.", "M.", "P.", "S.", "V.", "T.", "R.", "A.", "D.", "F.", "W.", "Z.", "B.", "C.", "G."
    ];

    const generateFreshName = () => {
      const first = listFirstNames[Math.floor(Math.random() * listFirstNames.length)];
      const last = listLastStyles[Math.floor(Math.random() * listLastStyles.length)];
      return `${first} ${last}`;
    };

    const timer = setInterval(() => {
      setLeaderboardCountdown((prev) => {
        if (prev <= 1) {
          // Trigger new high scores and update global, daily, and weekly with completely brand new names every 5 minutes!
          
          // 1. Update Global Leaderboard
          setHighScores((currentScores) => {
            const userEntries = currentScores.filter(x => x.name.includes('(You)'));
            const freshEntries: LeaderboardEntry[] = [];
            const countToGen = Math.max(4, 7 - userEntries.length);
            
            for (let i = 0; i < countToGen; i++) {
              const diffs: DifficultyLevel[] = ['zen', 'flow', 'focus', 'quantum'];
              const randomDiff = diffs[Math.floor(Math.random() * diffs.length)];
              const randomGMode = Math.random() > 0.5 ? 'numbers' : 'letters';
              const baseScore = randomDiff === 'quantum' ? 1000 : randomDiff === 'focus' ? 700 : randomDiff === 'flow' ? 400 : 200;
              
              freshEntries.push({
                id: `rand-glob-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
                name: generateFreshName(),
                score: baseScore + Math.floor(Math.random() * 450),
                time: 150 + Math.floor(Math.random() * 300),
                difficulty: randomDiff,
                mode: randomGMode,
                date: 'Today'
              });
            }
            return [...userEntries, ...freshEntries].sort((a, b) => b.score - a.score).slice(0, 8);
          });

          // 2. Update Daily Leaderboard
          setDailyLeaderboard((currentDaily) => {
            const userEntries = currentDaily.filter(x => x.name.includes('(You)'));
            const freshEntries: LeaderboardEntry[] = [];
            const countToGen = Math.max(4, 7 - userEntries.length);
            
            for (let i = 0; i < countToGen; i++) {
              freshEntries.push({
                id: `rand-daily-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
                name: generateFreshName(),
                score: 550 + Math.floor(Math.random() * 450),
                time: 180 + Math.floor(Math.random() * 250),
                difficulty: 'focus',
                mode: Math.random() > 0.5 ? 'numbers' : 'letters',
                date: 'Today'
              });
            }
            return [...userEntries, ...freshEntries].sort((a, b) => b.score - a.score).slice(0, 8);
          });

          // 3. Update Weekly Championship Board
          setWeeklyLeaderboard((currentWeekly) => {
            const userEntries = currentWeekly.filter(x => x.name.includes('(You)'));
            const freshEntries: LeaderboardEntry[] = [];
            const countToGen = Math.max(4, 7 - userEntries.length);
            
            for (let i = 0; i < countToGen; i++) {
              freshEntries.push({
                id: `rand-weekly-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
                name: generateFreshName(),
                score: 1000 + Math.floor(Math.random() * 600),
                time: 300 + Math.floor(Math.random() * 350),
                difficulty: 'quantum',
                mode: Math.random() > 0.5 ? 'numbers' : 'letters',
                date: 'This Week'
              });
            }
            return [...userEntries, ...freshEntries].sort((a, b) => b.score - a.score).slice(0, 8);
          });

          return 300; // Reset to 5 minutes (300 seconds)
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update real-time timestamp every second
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Run a watchdog whenever board updates to detect newly completed rows, cols, or 3x3 boxes
  useEffect(() => {
    if (!board || board.length < 9) return;

    const currentRows: number[] = [];
    const currentCols: number[] = [];
    const currentBoxes: number[] = [];

    // Checked Rows
    for (let r = 0; r < 9; r++) {
      if (!board[r]) continue;
      let rowComplete = true;
      for (let c = 0; c < 9; c++) {
        const cell = board[r][c];
        if (!cell || cell.value === 0 || cell.value !== cell.correctValue) {
          rowComplete = false;
          break;
        }
      }
      if (rowComplete) currentRows.push(r);
    }

    // Checked Columns
    for (let c = 0; c < 9; c++) {
      let colComplete = true;
      for (let r = 0; r < 9; r++) {
        const cell = board[r]?.[c];
        if (!cell || cell.value === 0 || cell.value !== cell.correctValue) {
          colComplete = false;
          break;
        }
      }
      if (colComplete) currentCols.push(c);
    }

    // Checked 3x3 Boxes
    for (let b = 0; b < 9; b++) {
      let boxComplete = true;
      const startR = Math.floor(b / 3) * 3;
      const startC = (b % 3) * 3;
      for (let i = 0; i < 9; i++) {
        const r = startR + Math.floor(i / 3);
        const c = startC + (i % 3);
        const cell = board[r]?.[c];
        if (!cell || cell.value === 0 || cell.value !== cell.correctValue) {
          boxComplete = false;
          break;
        }
      }
      if (boxComplete) currentBoxes.push(b);
    }

    // Compare with historical completions to identify exactly which ones just completed
    const prev = prevCompletsRef.current || { rows: [], cols: [], boxes: [] };
    const isInitialLoad = prev.rows.length === 0 && prev.cols.length === 0 && prev.boxes.length === 0;

    const newRows = currentRows.filter((r) => !prev.rows.includes(r));
    const newCols = currentCols.filter((c) => !prev.cols.includes(c));
    const newBoxes = currentBoxes.filter((b) => !prev.boxes.includes(b));

    // Persist the current snapshot
    prevCompletsRef.current = {
      rows: currentRows,
      cols: currentCols,
      boxes: currentBoxes,
    };

    // If not the initial start-game scan and we have new accomplishments, trigger 1-second pulse glows!
    if (!isInitialLoad && (newRows.length > 0 || newCols.length > 0 || newBoxes.length > 0)) {
      try {
        gameAudio.playPlacement(true); // Play positive placement cue
      } catch (err) {}

      if (newRows.length > 0) setGlowingRows((prevRows) => [...prevRows, ...newRows]);
      if (newCols.length > 0) setGlowingCols((prevCols) => [...prevCols, ...newCols]);
      if (newBoxes.length > 0) setGlowingBoxes((prevBoxes) => [...prevBoxes, ...newBoxes]);

      // Clear the bright celebratory glows after exactly 1 second
      setTimeout(() => {
        if (newRows.length > 0) setGlowingRows((prevRows) => prevRows.filter((r) => !newRows.includes(r)));
        if (newCols.length > 0) setGlowingCols((prevCols) => prevCols.filter((c) => !newCols.includes(c)));
        if (newBoxes.length > 0) setGlowingBoxes((prevBoxes) => prevBoxes.filter((b) => !newBoxes.includes(b)));
      }, 1000);
    }
  }, [board]);

  const soundToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    gameAudio.setMute(nextMute);
    gameAudio.playClick();
  };

  const saveHistoryState = () => {
    const freshBoard = board.map((row) =>
      row.map((cell) => ({
        ...cell,
        candidates: [...cell.candidates],
      }))
    );
    setHistory((prev) => [...prev, { board: freshBoard, mistakes, score }]);
  };

  const handleUndo = () => {
    gameAudio.playClick();
    if (undosUsed >= limits.undos) return;
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setBoard(previous.board);
    setMistakes(previous.mistakes);
    setScore(previous.score);
    setHistory((prev) => prev.slice(0, -1));
    setUndosUsed((prev) => prev + 1);
  };

  // Check completion
  const checkCompletion = (currentBoard: CellState[][]) => {
    let complete = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = currentBoard[r][c];
        if (cell.value !== cell.correctValue) {
          complete = false;
          break;
        }
      }
    }

    if (complete) {
      triggerWin();
    }
  };

  const triggerParticles = (r: number, col: number, isGood: boolean) => {
    // Generate particles bursting from cell location
    const cellElement = document.getElementById(`cell-${r}-${col}`);
    if (!cellElement) return;

    const rect = cellElement.getBoundingClientRect();
    const parent = cellElement.offsetParent?.getBoundingClientRect();

    if (!parent) return;

    const startX = rect.left - parent.left + rect.width / 2;
    const startY = rect.top - parent.top + rect.height / 2;

    const count = isGood ? 12 : 6;
    const color = isGood ? '#87CEEB' : '#FF6B6B'; // soft blue / soft red

    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      newParticles.push({
        id: particleIdRef.current++,
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // burst upward slightly
        size: 4 + Math.random() * 6,
        color,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const triggerWin = () => {
    setGameActive(false);
    gameAudio.stopBackgroundMusic();
    gameAudio.playWin();
    setEndState('win');
    setShowEndSheet(true);

    // Calculate XP
    const diffMultiplier = difficulty === 'quantum' ? 300 : difficulty === 'focus' ? 200 : difficulty === 'flow' ? 100 : 50;
    const rewardXp = diffMultiplier + Math.max(0, 100 - seconds * 0.1);
    
    const xpGained = Math.round(rewardXp);
    const updatedXp = (profile.xp || 0) + xpGained;
    
    // Genuine accurate calendar day calculation
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dayNum = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${dayNum}`;

    const updatedDailyHistory = {
      ...(profile.dailyHistory || {}),
      [todayStr]: true,
    };

    // Calculate continuous daily streak from actual history
    let currentStreak = 1;
    let checkDate = new Date();
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const prevDateKey = `${y}-${m}-${d}`;
      if (updatedDailyHistory[prevDateKey] === true) {
        currentStreak += 1;
      } else {
        break;
      }
      if (currentStreak > 365) break; 
    }

    const currentLongest = profile.longestStreak || 0;
    const longestStreak = Math.max(currentLongest, currentStreak);

    // Record minutes played to actual persistent 28-day activity heatmap selector
    const dayIndex = (today.getDate() - 1) % 28;
    const updatedHeatmap = profile.heatmapData ? [...profile.heatmapData] : Array(28).fill(0);
    updatedHeatmap[dayIndex] = (updatedHeatmap[dayIndex] || 0) + 15; // Log 15m for a win!

    // Highest score check
    const newRatingScore = Math.max(0, 1000 - seconds - mistakes * 50);
    const calculatedScore = Math.round(newRatingScore + diffMultiplier);
    
    const highestScore = Math.max(profile.highestScore, calculatedScore);

    // Achievements check
    const activeAchievements = [...profile.achievements];
    if (difficulty === 'zen' && !activeAchievements.includes('zen_master')) {
      activeAchievements.push('zen_master');
    }
    if (difficulty === 'quantum' && !activeAchievements.includes('quantum_leap')) {
      activeAchievements.push('quantum_leap');
    }
    if (mistakes === 0 && !activeAchievements.includes('flawless')) {
      activeAchievements.push('flawless');
    }
    if (seconds < 480 && !activeAchievements.includes('flow_state')) {
      activeAchievements.push('flow_state');
    }
    if (profile.completedGames + 1 >= 5 && !activeAchievements.includes('completionist')) {
      activeAchievements.push('completionist');
    }

    // Record special highscores if played in daily/weekly/monthly modes
    if (activeSpecialGame === 'daily') {
      const storedHighScore = Math.max(dailyHighScore, calculatedScore);
      setDailyHighScore(storedHighScore);
      localStorage.setItem('skudo_daily_highscore', storedHighScore.toString());
      
      // Live publish to Daily Leaderboard state!
      setDailyLeaderboard((prev) => {
        const userEntry: LeaderboardEntry = {
          id: `user-daily-${Date.now()}`,
          name: `${profile.name} (You)`,
          score: calculatedScore,
          time: seconds,
          difficulty: 'focus',
          mode: 'numbers',
          date: 'Today'
        };
        return [...prev.filter(x => !x.name.includes('(You)')), userEntry]
          .sort((a, b) => b.score - a.score);
      });
      setLeaderboardTab('daily');
    } else if (activeSpecialGame === 'weekly') {
      const storedHighScore = Math.max(weeklyHighScore, calculatedScore);
      setWeeklyHighScore(storedHighScore);
      localStorage.setItem('skudo_weekly_highscore', storedHighScore.toString());

      // Live publish to Weekly Leaderboard state!
      setWeeklyLeaderboard((prev) => {
        const userEntry: LeaderboardEntry = {
          id: `user-weekly-${Date.now()}`,
          name: `${profile.name} (You)`,
          score: calculatedScore,
          time: seconds,
          difficulty: 'quantum',
          mode: 'numbers',
          date: 'This Week'
        };
        return [...prev.filter(x => !x.name.includes('(You)')), userEntry]
          .sort((a, b) => b.score - a.score);
      });
      setLeaderboardTab('weekly');
    } else if (activeSpecialGame === 'monthly') {
      const storedHighScore = Math.max(monthlyHighScore, calculatedScore);
      setMonthlyHighScore(storedHighScore);
      localStorage.setItem('skudo_monthly_highscore', storedHighScore.toString());
      setLeaderboardTab('weekly');
    }

    if (activeSpecialGame) {
      // Create and store earning certificate!
      const certId = `cert_${activeSpecialGame}_${Date.now()}`;
      const displayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const displayTime = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
      const newCertificate = {
        id: certId,
        tournamentId: `skudo_tournament_${activeSpecialGame}_${new Date().toISOString().split('T')[0]}`,
        type: activeSpecialGame,
        date: displayDate,
        time: displayTime,
        score: calculatedScore,
        playerName: profile.name || "Commander"
      };

      try {
        const existingData = localStorage.getItem('skudo_earned_certificates');
        const certs = existingData ? JSON.parse(existingData) : [];
        certs.push(newCertificate);
        localStorage.setItem('skudo_earned_certificates', JSON.stringify(certs));
      } catch (err) {
        console.error("Failed to write to certificate storage", err);
      }

      // Update tournament state
      const tState = {
        tournamentId: `skudo_tournament_${activeSpecialGame}_${new Date().toISOString().split('T')[0]}`,
        type: activeSpecialGame,
        hasPlayed: true,
        isLocked: true,
        completionStatus: "won",
        earnedCertificateId: certId
      };
      localStorage.setItem(`skudo_t_state_${activeSpecialGame}`, JSON.stringify(tState));
      localStorage.setItem(`skudo_last_played_${activeSpecialGame}`, Date.now().toString());
    }

    // Difficulty specific stats update
    const currentStats = (profile.difficultyStats?.[difficulty] || {
      wins: 0,
      losses: 0,
      perfectWins: 0,
    });
    const isPerfect = mistakes === 0;
    const isNewBestTime = !currentStats.bestTime || seconds < currentStats.bestTime;
    const isNewPerfectBestTime = isPerfect && (!currentStats.perfectBestTime || seconds < currentStats.perfectBestTime);
    const isNewBestScore = !currentStats.bestScore || calculatedScore > currentStats.bestScore;

    const updatedDifficultyStats = {
      ...(profile.difficultyStats || {}),
      [difficulty]: {
        wins: (currentStats.wins || 0) + 1,
        losses: currentStats.losses || 0,
        perfectWins: (currentStats.perfectWins || 0) + (isPerfect ? 1 : 0),
        bestTime: isNewBestTime ? seconds : currentStats.bestTime,
        perfectBestTime: isNewPerfectBestTime ? seconds : currentStats.perfectBestTime,
        bestScore: isNewBestScore ? calculatedScore : currentStats.bestScore,
      }
    };

    onUpdateProfile({
      ...profile,
      completedGames: profile.completedGames + 1,
      totalGames: profile.totalGames + 1,
      xp: updatedXp,
      streak: currentStreak,
      longestStreak,
      dailyHistory: updatedDailyHistory,
      heatmapData: updatedHeatmap,
      highestScore,
      achievements: activeAchievements,
      totalTime: profile.totalTime + seconds,
      difficultyStats: updatedDifficultyStats as any,
    });
  };

  const triggerLoss = () => {
    setGameActive(false);
    gameAudio.stopBackgroundMusic();
    gameAudio.playLose();
    setEndState('lose');
    setShowEndSheet(true);

    if (activeSpecialGame) {
      // Record failed state
      const tState = {
        tournamentId: `skudo_tournament_${activeSpecialGame}_${new Date().toISOString().split('T')[0]}`,
        type: activeSpecialGame,
        hasPlayed: true,
        isLocked: true,
        completionStatus: "lost",
        earnedCertificateId: null
      };
      localStorage.setItem(`skudo_t_state_${activeSpecialGame}`, JSON.stringify(tState));
      localStorage.setItem(`skudo_last_played_${activeSpecialGame}`, Date.now().toString());
    }

    const currentStats = (profile.difficultyStats?.[difficulty] || {
      wins: 0,
      losses: 0,
      perfectWins: 0,
    });

    const updatedDifficultyStatsLoss = {
      ...(profile.difficultyStats || {}),
      [difficulty]: {
        ...currentStats,
        losses: (currentStats.losses || 0) + 1,
      }
    };

    const today = new Date();
    const dayIndex = (today.getDate() - 1) % 28;
    const updatedHeatmap = profile.heatmapData ? [...profile.heatmapData] : Array(28).fill(0);
    updatedHeatmap[dayIndex] = (updatedHeatmap[dayIndex] || 0) + 10; // log 10 minutes effort even on defeat

    const updatedXpLoss = Math.max(0, (profile.xp || 0) - 15); // small penalty

    onUpdateProfile({
      ...profile,
      totalGames: profile.totalGames + 1,
      xp: updatedXpLoss,
      streak: 0, // broken streak on game fail
      heatmapData: updatedHeatmap,
      difficultyStats: updatedDifficultyStatsLoss as any,
    });
  };

  // Primary selection handler
  const handleSelectCell = (r: number, c: number) => {
    if (!gameActive || isPaused) return;
    gameAudio.playClick();
    setSelectedCell({ r, c });
  };

  // Erase value
  const handleErase = () => {
    gameAudio.playClick();
    if (erasesUsed >= limits.erases) return;
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    const cell = board[r]?.[c];
    if (!cell || cell.isGiven) return;

    saveHistoryState();

    const newBoard = board.map((row) =>
      row.map((item) => {
        if (item.row === r && item.col === c) {
          return { ...item, value: 0, hasError: false, candidates: [] };
        }
        return item;
      })
    );
    setBoard(newBoard);
    setErasesUsed((prev) => prev + 1);
  };

  // Calculate dynamic valid physical placement possibilities for a cell based on active row/col/box numbers
  const getPossibleOutcomeCandidates = (r: number, c: number) => {
    const possible: number[] = [];
    const cell = board[r]?.[c];
    if (!cell) return [];
    
    for (let num = 1; num <= 9; num++) {
      let hasConflict = false;
      // Check row conflict
      for (let i = 0; i < 9; i++) {
        if (i !== c && board[r]?.[i]?.value === num) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) continue;
      // Check col conflict
      for (let i = 0; i < 9; i++) {
        if (i !== r && board[i]?.[c]?.value === num) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) continue;
      // Check box conflict
      const boxRowStart = Math.floor(r / 3) * 3;
      const boxColStart = Math.floor(c / 3) * 3;
      for (let br = boxRowStart; br < boxRowStart + 3; br++) {
        for (let bc = boxColStart; bc < boxColStart + 3; bc++) {
          if ((br !== r || bc !== c) && board[br]?.[bc]?.value === num) {
            hasConflict = true;
            break;
          }
        }
        if (hasConflict) break;
      }
      if (!hasConflict) {
        possible.push(num);
      }
    }
    return possible;
  };

  // Safe execution of final correct fill
  const applyHintFill = (r: number, c: number) => {
    if (hintsUsed >= limits.hints) return; // limit check
    gameAudio.playClick();
    
    saveHistoryState();
    triggerParticles(r, c, true);

    const newBoard = board.map((row) =>
      row.map((item) => {
        if (item.row === r && item.col === c) {
          return { ...item, value: item.correctValue, hasError: false, candidates: [] };
        }
        return item;
      })
    );

    setBoard(newBoard);
    setHintsUsed((prev) => prev + 1);
    checkCompletion(newBoard);
    setHasAppliedHintThisSession(true); // show outcome now!
  };

  // Hint action - Now opens the detailed logical HUD assistant popover
  const handleHint = () => {
    gameAudio.playClick();
    setHasAppliedHintThisSession(false);
    setShowHintModal(true);
  };

  // Special play options helpers
  const timeLeftDaily = Math.max(0, lastPlayedDaily + 86400000 - now);
  const timeLeftWeekly = Math.max(0, lastPlayedWeekly + 604800000 - now);

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '';
    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    }
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFormattedDateDaily = () => {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  };

  const getFormattedDateWeekly = () => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    // Compute start of this week (Sunday)
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Week of ${months[sunday.getMonth()]} ${sunday.getDate()}`;
  };

  const startSpecialDaily = () => {
    if (Math.max(0, lastPlayedDaily + 86400000 - Date.now()) > 0) return;
    gameAudio.playClick();
    
    const nowTs = Date.now();
    setLastPlayedDaily(nowTs);
    localStorage.setItem('skudo_last_played_daily', nowTs.toString());
    
    setDifficulty('focus');
    setMode('numbers');
    startNewGame('numbers', 'focus');
    
    // Set activeSpecialGame AFTER startNewGame resets it
    setActiveSpecialGame('daily');
    setActiveTab(null);
  };

  const startSpecialWeekly = () => {
    if (Math.max(0, lastPlayedWeekly + 604800000 - Date.now()) > 0) return;
    gameAudio.playClick();
    
    const nowTs = Date.now();
    setLastPlayedWeekly(nowTs);
    localStorage.setItem('skudo_last_played_weekly', nowTs.toString());
    
    setDifficulty('quantum');
    setMode('numbers');
    startNewGame('numbers', 'quantum');
    
    // Set activeSpecialGame AFTER startNewGame resets it
    setActiveSpecialGame('weekly');
    setActiveTab(null);
  };

  // Action keyboard input (numbers 1-9)
  const handleNumberInput = (num: number) => {
    if (!gameActive || isPaused || !selectedCell) return;
    const { r, c } = selectedCell;
    const cell = board[r]?.[c];
    if (!cell || cell.isGiven) return;

    saveHistoryState();

    if (notesMode) {
      // Toggle candidate pencil outline mark
      const newBoard = board.map((row) =>
        row.map((item) => {
          if (item.row === r && item.col === c) {
            const hasCandidate = item.candidates.includes(num);
            const nextCandidates = hasCandidate
              ? item.candidates.filter((cand) => cand !== num)
              : [...item.candidates, num].sort();
            return { ...item, value: 0, candidates: nextCandidates, hasError: false };
          }
          return item;
        })
      );
      setBoard(newBoard);
      gameAudio.playClick();
    } else {
      // Direct numeric entry
      const correct = cell.correctValue === num;

      if (correct) {
        // Success
        triggerParticles(r, c, true);
        gameAudio.playPlacement(true);
        setScore((prev) => prev + 100);

        if (boss) {
          setBossHealth((prevHealth) => {
            const next = Math.max(0, prevHealth - 30);
            if (next <= 0) {
              setBossDialogue(`No! My logical coordinates are shattered! You have defeated me, Commander...`);
            } else {
              setBossDialogue(`Agggh! A perfect scan! My logic shields are taking heavy damage, now at ${next} HP!`);
            }
            return next;
          });
        }

        const newBoard = board.map((row) =>
          row.map((item) => {
            if (item.row === r && item.col === c) {
              return { ...item, value: num, hasError: false, candidates: [] };
            }
            return item;
          })
        );
        setBoard(newBoard);
        checkCompletion(newBoard);
      } else {
        // Mistake
        triggerParticles(r, c, false);
        gameAudio.playPlacement(false); // plays low tone error buzzing
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);

        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);

        if (boss) {
          setBossHealth((prevHealth) => {
            const next = Math.min(boss.health, prevHealth + 25);
            setBossDialogue(`A mistake! Socratic scan error! That heals my database shield by 25 HP, current HP: ${next}!`);
            return next;
          });
        }

        const newBoard = board.map((row) =>
          row.map((item) => {
            if (item.row === r && item.col === c) {
              return { ...item, value: num, hasError: true };
            }
            return item;
          })
        );
        setBoard(newBoard);

        if (nextMistakes >= maxMistakes) {
          triggerLoss();
        }
      }
    }
  };

  // Helper mapping to check if a specific number has been fully placed correctly
  // (9 instances correctly positioned on the Sudoku board grid)
  const isNumberCompleted = (num: number): boolean => {
    if (!board || board.length === 0) return false;
    let count = 0;
    const size = board.length;
    for (let r = 0; r < size; r++) {
      if (!board[r]) continue;
      for (let c = 0; c < size; c++) {
        const cell = board[r][c];
        if (cell && cell.value === num && cell.value === cell.correctValue) {
          count++;
        }
      }
    }
    return count >= size;
  };

  const getNumberFilledCount = (num: number): number => {
    if (!board || board.length === 0) return 0;
    let count = 0;
    const size = board.length;
    for (let r = 0; r < size; r++) {
      if (!board[r]) continue;
      for (let c = 0; c < size; c++) {
        const cell = board[r][c];
        if (cell && cell.value === num && cell.value === cell.correctValue) {
          count++;
        }
      }
    }
    return Math.min(count, size);
  };

  // Grid Highlights Calculator
  const getCellHighlightClass = (cell: CellState) => {
    // 1. Prioritize line/box completion pulse glows (temporary 1-second overlay)
    const cellBoxR = Math.floor(cell.row / 3);
    const cellBoxC = Math.floor(cell.col / 3);
    const cellBoxIdx = cellBoxR * 3 + cellBoxC;

    const isInGlowingRow = glowingRows.includes(cell.row);
    const isInGlowingCol = glowingCols.includes(cell.col);
    const isInGlowingBox = glowingBoxes.includes(cellBoxIdx);

    if (isInGlowingRow || isInGlowingCol || isInGlowingBox) {
      return 'animate-complete-glow text-[#047857] font-black text-xl sm:text-2xl z-40';
    }

    // Dynamic text style determination to preserve given colors and errors under line glows
    const textClass = cell.isGiven
      ? 'text-[#085182] font-black'
      : cell.hasError
        ? 'text-[#EF4444] font-bold'
        : 'text-[#1E293B] font-extrabold';

    if (!selectedCell || !board || board.length < 9 || !board[selectedCell.r]) {
      if (cell.isGiven) {
        return 'bg-white text-[#085182] font-black text-xl sm:text-2xl ring-1 ring-inset ring-slate-100/50';
      }
      return cell.hasError
        ? 'bg-red-50 text-[#EF4444] font-bold text-xl sm:text-2xl ring-1 ring-inset ring-red-100'
        : 'bg-white text-[#1E293B] font-extrabold text-xl sm:text-2xl hover:bg-[#E0F4FF]/25 ring-1 ring-inset ring-slate-100/50';
    }
    const sCell = board[selectedCell.r][selectedCell.c];
    if (!sCell) {
      if (cell.isGiven) {
        return 'bg-white text-[#085182] font-black text-xl sm:text-2xl ring-1 ring-inset ring-slate-100/50';
      }
      return 'bg-white text-[#1E293B] font-extrabold text-xl sm:text-2xl hover:bg-[#E0F4FF]/25 ring-1 ring-inset ring-slate-100/50';
    }
    const isSelected = selectedCell.r === cell.row && selectedCell.c === cell.col;
    
    // Check same 3x3 region glow
    const sBoxR = Math.floor(selectedCell.r / 3);
    const sBoxC = Math.floor(selectedCell.c / 3);
    const sameBox = sBoxR === cellBoxR && sBoxC === cellBoxC;

    // Highlight cells with identical numeric value
    const sameValue = sCell.value !== 0 && cell.value === sCell.value;

    if (isSelected) {
      return cell.hasError
        ? 'bg-red-100/70 text-[#EF4444] ring-2 ring-inset ring-red-400 font-extrabold text-xl sm:text-2xl z-30 scale-[1.04] rounded-lg transition-all duration-300 ease-out shadow-md shadow-red-200/50'
        : 'bg-[#C2E0FF] ring-2 ring-inset ring-[#007FFF] text-[#085182] text-xl sm:text-2xl font-black rounded-lg scale-[1.04] z-35 transition-all duration-300 ease-out shadow-sm shadow-[#0a5cbf]/10';
    }

    if (cell.hasError) {
      return 'bg-red-50 text-[#EF4444] font-bold text-xl sm:text-2xl transition-all duration-300 ease-out ring-1 ring-inset ring-red-100';
    }

    if (sameValue) {
      return 'bg-[#D6EBFF] ring-1 ring-inset ring-[#7BBFFF] text-[#085182] font-black text-xl sm:text-2xl z-25 scale-[1.02] transition-all duration-300 ease-out rounded-md';
    }

    if (selectedCell.r === cell.row) {
      return `bg-[#ECF5FF] ring-1 ring-inset ring-[#B9DFFF]/40 ${textClass} text-xl sm:text-2xl z-10 transition-all duration-300 ease-out`;
    }

    if (selectedCell.c === cell.col) {
      return `bg-[#ECF5FF] ring-1 ring-inset ring-[#B9DFFF]/40 ${textClass} text-xl sm:text-2xl z-10 transition-all duration-300 ease-out`;
    }

    if (sameBox) {
      return `bg-[#ECF5FF]/60 ring-1 ring-inset ring-[#B9DFFF]/20 ${textClass} text-xl sm:text-2xl transition-all duration-300 ease-out`;
    }

    if (cell.isGiven) {
      if (variant === 'xsudoku' && (cell.row === cell.col || cell.row + cell.col === 8)) {
        return 'bg-amber-100/55 text-[#085182] font-black text-xl sm:text-2xl ring-1 ring-inset ring-amber-200';
      }
      if ((variant === 'hyper' || variant === 'windoku') && (
        (cell.row >= 1 && cell.row <= 3 && cell.col >= 1 && cell.col <= 3) ||
        (cell.row >= 1 && cell.row <= 3 && cell.col >= 5 && cell.col <= 7) ||
        (cell.row >= 5 && cell.row <= 7 && cell.col >= 1 && cell.col <= 3) ||
        (cell.row >= 5 && cell.row <= 7 && cell.col >= 5 && cell.col <= 7)
      )) {
        return 'bg-sky-50 text-[#085182] font-black text-xl sm:text-2xl ring-1 ring-inset ring-sky-100';
      }
      return 'bg-white text-[#085182] font-black text-xl sm:text-2xl ring-1 ring-inset ring-slate-100/50';
    }

    if (variant === 'xsudoku' && (cell.row === cell.col || cell.row + cell.col === 8)) {
      return `bg-amber-500/10 text-amber-600 border border-amber-300/30 ${textClass} text-xl sm:text-2xl ring-1 ring-inset ring-amber-100`;
    }
    
    if ((variant === 'hyper' || variant === 'windoku') && (
      (cell.row >= 1 && cell.row <= 3 && cell.col >= 1 && cell.col <= 3) ||
      (cell.row >= 1 && cell.row <= 3 && cell.col >= 5 && cell.col <= 7) ||
      (cell.row >= 5 && cell.row <= 7 && cell.col >= 1 && cell.col <= 3) ||
      (cell.row >= 5 && cell.row <= 7 && cell.col >= 5 && cell.col <= 7)
    )) {
      return `bg-sky-500/10 text-sky-600 border border-sky-300/30 ${textClass} text-xl sm:text-2xl ring-1 ring-inset ring-sky-100`;
    }

    if (variant === 'killer') {
      return `bg-rose-500/5 ${textClass} text-xl sm:text-2xl hover:bg-[#E0F4FF]/25 ring-1 ring-inset ring-slate-100/50`;
    }

    return 'bg-white text-[#1E293B] font-extrabold text-xl sm:text-2xl hover:bg-[#E0F4FF]/25 ring-1 ring-inset ring-slate-100/50';
  };

  // Calculate current completion percent
  const calculateProgressPercent = () => {
    if (!board || board.length === 0) return 0;
    let placed = 0;
    let totalTargets = 0;
    const size = board.length;
    for (let r = 0; r < size; r++) {
      if (!board[r]) continue;
      for (let c = 0; c < board[r].length; c++) {
        const cell = board[r][c];
        if (!cell) continue;
        if (!cell.isGiven) {
          totalTargets++;
          if (cell.value === cell.correctValue) {
            placed++;
          }
        }
      }
    }
    if (totalTargets === 0) return 0;
    return Math.round((placed / totalTargets) * 100);
  };

  const progressPercent = calculateProgressPercent();
  const xpInfo = getXpLevel(profile.xp);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 items-center select-none" id="skudo-game-screen">
      
      {/* 1. Header Toolbar */}
      <div className="w-full bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm z-10" id="game-controls-header">
        
        {/* Info badges */}
        <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
          <button
            onClick={onExitToMenu}
            className="px-3.5 py-1.5 bg-white/50 hover:bg-white border border-white text-[#4A5568] hover:text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
          >
            <Home className="w-3.5 h-3.5 text-[#4DA6FF]" />
            <span>Dashboard</span>
          </button>
          
          <span className="text-[10px] uppercase tracking-wider text-[#87CEEB] font-bold px-3 py-1.5 bg-[#E0F4FF]/30 border border-white rounded-xl">
            {mode === 'numbers' ? 'Numbers Mode' : 'A-I Mode'} • {difficulty}
          </span>
          
          <div className="flex items-center gap-1 bg-white/60 border border-white text-[#4A5568] rounded-xl py-1 px-3 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] uppercase tracking-wider text-[#87CEEB] font-bold">Level</span>
            <span className="text-[#4DA6FF] font-bold text-sm ml-1">{xpInfo.level}</span>
          </div>

          <div className="text-[10px] uppercase tracking-wider text-[#FF6B6B] font-bold px-2.5 py-1 bg-red-50/20 border border-white/40 rounded-lg">
            STREAK: 🔥 {profile.streak}
          </div>
        </div>

        {/* Quick Tools Header Actions */}
        <div className="flex gap-3 items-center">
          {/* Mute button */}
          <button
            onClick={soundToggle}
            className="p-2.5 bg-white/60 border border-white rounded-xl text-[#4DA6FF] hover:text-sky-500 hover:bg-white transition cursor-pointer"
            id="sound-opt-toggle"
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Academic strategy guide */}
          <button
            onClick={() => {
              gameAudio.playClick();
              setActiveTab(activeTab === 'academy' ? null : 'academy');
            }}
            className={`p-2.5 border rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              activeTab === 'academy'
                ? 'border-[#4DA6FF] bg-[#E0F4FF]/50 text-[#4DA6FF] font-bold shadow-[0_0_8px_rgba(77,166,255,0.2)]'
                : 'border-white bg-white/50 hover:bg-white text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#4DA6FF]" />
            <span className="hidden md:inline">Academy</span>
          </button>

          {/* Statistics Tab */}
          <button
            onClick={() => {
              gameAudio.playClick();
              setActiveTab(activeTab === 'stats' ? null : 'stats');
            }}
            className={`p-2.5 border rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              activeTab === 'stats'
                ? 'border-[#4DA6FF] bg-[#E0F4FF]/50 text-[#4DA6FF] font-bold shadow-[0_0_8px_rgba(77,166,255,0.2)]'
                : 'border-white bg-white/50 hover:bg-white text-slate-500'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#4DA6FF]" />
            <span className="hidden md:inline">Stats</span>
          </button>

          {/* Daily Challenges */}
          <button
            onClick={() => {
              gameAudio.playClick();
              setActiveTab(activeTab === 'challenges' ? null : 'challenges');
            }}
            className={`p-2.5 border rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              activeTab === 'challenges'
                ? 'border-[#4DA6FF] bg-[#E0F4FF]/50 text-[#4DA6FF] font-bold shadow-[0_0_8px_rgba(77,166,255,0.2)]'
                : 'border-white bg-white/50 hover:bg-white text-slate-500'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#4DA6FF]" />
            <span className="hidden md:inline">Challenges</span>
          </button>

          {/* Skudo AI Tab Button */}
          <button
            onClick={() => {
              gameAudio.playClick();
              setActiveTab(activeTab === 'ai' ? null : 'ai');
            }}
            className={`p-2.5 border rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold relative overflow-hidden group ${
              activeTab === 'ai'
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600 font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'border-slate-800 bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01]'
            }`}
          >
            {activeTab !== 'ai' && (
              <span className="absolute inset-0 bg-[#4DA6FF]/10 scale-100 group-hover:scale-110 transition pointer-events-none animate-pulse" />
            )}
            <Bot className={`w-4 h-4 ${activeTab === 'ai' ? 'text-emerald-500' : 'text-[#4DA6FF] animate-bounce'}`} />
            <span className="hidden md:inline">Skudo AI</span>
          </button>
        </div>
      </div>

      {/* 2. Primary layout board/stats container split */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="main-interface-split-layer">
        
        {/* Left Side: Game Stats Dashboard Info */}
        <div className="lg:col-span-3 flex flex-col gap-4 w-full" id="game-stats-sidebar">
          
          <div className="p-6 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 flex flex-col gap-6 shadow-lg">
            
            {/* Score */}
            <div className="flex items-center justify-between border-b border-white/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#87CEEB] font-bold">Score</span>
              </div>
              <span className="text-xl font-bold text-[#4A5568]" id="stat-score-val">{score}</span>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-between border-b border-white/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#87CEEB] font-bold">Timer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono text-[#4A5568] font-bold" id="stat-timer-val">
                  {Math.floor(seconds / 60).toString().padStart(2, '0')}:
                  {(seconds % 60).toString().padStart(2, '0')}
                </span>
                <button
                  onClick={() => {
                    gameAudio.playClick();
                    setIsPaused(!isPaused);
                  }}
                  className="p-1 rounded bg-white/60 hover:bg-white text-[#4DA6FF] border border-white/20 transition cursor-pointer"
                  title={isPaused ? "Resume game" : "Pause game"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Mistakes tracking */}
            <div className="flex items-center justify-between border-b border-white/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#FF6B6B] font-bold">Mistakes</span>
              </div>
              <span className="text-xl font-bold text-[#FF6B6B]" id="stat-mistakes-val">
                {mistakes}/{maxMistakes}
              </span>
            </div>

            {/* Progress calculation % metric */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-[#87CEEB] tracking-wider">
                <span>Progress</span>
                <span id="stat-progress-val">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4DA6FF] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="w-full bg-white/40 border border-white/60 p-6 rounded-3xl shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-[#87CEEB] font-bold flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#4DA6FF] animate-pulse" /> Guidance Tip
            </span>
            <p className="text-[11px] italic text-[#4A5568]/80 leading-normal font-sans">
              "Tap any blank cell first, then choose a number/letter from the keypad below. Turn on Notes Mode to keep track."
            </p>
          </div>

        </div>

        {/* Center Section: Main Sudoku Grid */}
        <div className="lg:col-span-6 flex flex-col items-center gap-5 w-full" id="sudoku-grid-container-layout">
          
          {/* Aesthetic minimalist quote and inspiring words */}
          <div className="text-center max-w-md px-4 select-none pb-1" id="sudoku-board-quote-header">
            <p className="text-[11px] font-mono font-medium text-[#4A5568]/80 italic leading-relaxed">
              "Every champion was once a beginner who kept playing."
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-1 opacity-75">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4DA6FF]/50" />
              <p className="text-[9px] uppercase tracking-widest font-bold text-[#87CEEB]">
                Patience • Clarity • Focus
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4DA6FF]/50" />
            </div>
          </div>
          
          {/* ⚔️ ELITE BOSS HEALTH & SPEECH MULTIPLEXER HUD */}
          {boss && (
            <div className="w-full max-w-md md:max-w-xl p-3.5 bg-[#1E2540] text-slate-100 rounded-2xl border-2 border-red-500/30 flex flex-col gap-2.5 shadow-xl select-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{boss.avatar}</span>
                  <div className="text-left">
                    <h5 className="text-[11px] font-black tracking-widest text-[#FF4D4D] uppercase leading-none">⚔️ ACTIVE AI BOSS CHALLENGER</h5>
                    <h4 className="text-xs font-black uppercase text-white tracking-wide mt-1 leading-none">{boss.name}</h4>
                  </div>
                </div>
                
                <span className="text-[10.5px] font-mono font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full leading-none">
                  HP: {bossHealth} / {boss.health}
                </span>
              </div>

              {/* Dynamic Animated Health Bar */}
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-pink-500 to-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${(bossHealth / boss.health) * 100}%` }}
                />
              </div>

              {/* Boss Dialogue Banner */}
              <div className="bg-black/40 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 flex items-start gap-1 text-left relative">
                <span className="text-[10px] uppercase font-black tracking-wider text-red-500 select-all shrink-0">Banter:</span>
                <p className="font-mono text-[10.5px] leading-snug italic font-semibold">"{bossDialogue}"</p>
              </div>
            </div>
          )}
          
          <div className="relative w-full aspect-square bg-white border-4 border-[#87CEEB]/30 rounded-3xl overflow-hidden p-1 shadow-xl max-w-md md:max-w-xl">
            
            {/* Sparkles particle container inside board bounds */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    left: p.x,
                    top: p.y,
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    boxShadow: `0 0 6px ${p.color}`,
                  }}
                />
              ))}
            </div>

            {/* Big Pause Overlay */}
            <AnimatePresence>
              {isPaused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 rounded-2xl ${
                    document.documentElement.classList.contains('dark') 
                      ? 'bg-[#0F1423]/98 text-[#E2E8F0]' 
                      : 'bg-[#E0F4FF]/95 text-slate-800'
                  }`}
                  id="game-pause-layer"
                >
                  <Pause className="w-12 h-12 text-[#4DA6FF] animate-pulse" />
                  <h4 className="text-xl font-black uppercase tracking-tight">Game Paused</h4>
                  <p className="text-xs font-semibold">Your puzzle timer is currently static.</p>
                  <button
                    onClick={() => {
                      gameAudio.playClick();
                      setIsPaused(false);
                    }}
                    className="mt-2 px-6 py-2.5 bg-[#4DA6FF] text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-[#3BA7FF] transition duration-150 shadow"
                    id="resume-paused-btn"
                  >
                    Resume Game
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Board render loop with mistake shaker */}
            <div
              className={`w-full h-full grid gap-[1.5px] bg-[#87CEEB]/45 rounded-2xl overflow-hidden transition-opacity duration-300 ${
                isShaking ? 'animate-shake' : ''
              } ${isPaused ? 'invisible opacity-0 pointer-events-none' : 'visible opacity-100'}`}
              style={{
                gridTemplateColumns: `repeat(${board.length || 9}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${board.length || 9}, minmax(0, 1fr))`,
              }}
              id="sudoku-interactive-board"
            >
              {board.length > 0 &&
                board.map((rowArr, rIdx) =>
                  rowArr.map((cell, cIdx) => {
                    const displayVal = getCellDisplay(cell.value, mode === 'letters' || variant === 'wordoku');
                    
                    // Specific border configuration matching classical Sudoku blocks
                    const boardSize = board.length || 9;
                    let hasThickerRight = false;
                    let hasThickerBottom = false;

                    if (boardSize === 9) {
                      hasThickerRight = cIdx === 2 || cIdx === 5;
                      hasThickerBottom = rIdx === 2 || rIdx === 5;
                    } else if (boardSize === 6) {
                      hasThickerRight = cIdx === 2;
                      hasThickerBottom = rIdx === 1 || rIdx === 3;
                    } else if (boardSize === 4) {
                      hasThickerRight = cIdx === 1;
                      hasThickerBottom = rIdx === 1;
                    } else if (boardSize === 16) {
                      hasThickerRight = cIdx === 3 || cIdx === 7 || cIdx === 11;
                      hasThickerBottom = rIdx === 3 || rIdx === 7 || rIdx === 11;
                    }

                    return (
                      <button
                        key={`${rIdx}-${cIdx}`}
                        id={`cell-${rIdx}-${cIdx}`}
                        onClick={() => handleSelectCell(rIdx, cIdx)}
                        className={`w-full h-full relative cursor-pointer outline-none transition-all duration-300 ease-out active:scale-[0.95] hover:brightness-[0.98] will-change-transform flex items-center justify-center font-sans ${getCellHighlightClass(
                          cell
                        )} ${hasThickerRight ? 'border-r-[2.5px] border-[#87CEEB]' : ''} ${
                          hasThickerBottom ? 'border-b-[2.5px] border-[#87CEEB]' : ''
                        }`}
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {/* Elegant gray dot indicator for starting clue numbers at top right */}
                        {cell.isGiven && cell.value !== 0 && (
                          <span className="absolute top-[3px] right-[3px] sm:top-1.5 sm:right-1.5 w-[3.5px] h-[3.5px] sm:w-[5px] sm:h-[5px] rounded-full bg-[#94A3B8]/50" />
                        )}

                        {/* OVERLAYS FOR COGNITIVE VARIANTS */}
                        {variant === 'killer' && (() => {
                          const cagesToSums: Record<string, number> = {
                            '0-0': 15, '0-2': 8, '0-5': 12, '1-7': 14, '2-1': 10, '2-3': 7, '2-6': 16,
                            '3-0': 9, '3-5': 11, '4-2': 18, '5-1': 6, '5-7': 15, '6-4': 13, '7-0': 11, '7-8': 8, '8-3': 14
                          };
                          const key = `${rIdx}-${cIdx}`;
                          if (cagesToSums[key]) {
                            return (
                              <span className="absolute top-[3px] left-[3px] sm:top-1 sm:left-1 text-[7.5px] font-black text-rose-500 bg-rose-50/85 border border-rose-300/30 px-1 rounded-[3px] leading-tight z-15 scale-[0.9]">
                                {cagesToSums[key]}
                              </span>
                            );
                          }
                          return null;
                        })()}

                        {variant === 'thermo' && (() => {
                          const bulbs = ['0-0', '3-3', '6-6'];
                          const trails = ['0-1', '0-2', '3-4', '4-4', '5-4', '6-7', '7-7', '8-7'];
                          const key = `${rIdx}-${cIdx}`;
                          if (bulbs.includes(key)) {
                            return <span className="absolute bottom-1 right-1 leading-none text-[10px]" title="Thermometer Bulb Reservoir">🌡️</span>;
                          }
                          if (trails.includes(key)) {
                            return <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-fuchsia-500/30" />;
                          }
                          return null;
                        })()}

                        {variant === 'arrow' && (() => {
                          const nodes = ['0-4', '4-0', '8-4'];
                          const paths = ['1-4', '2-4', '4-1', '4-2', '7-4', '6-4'];
                          const key = `${rIdx}-${cIdx}`;
                          if (nodes.includes(key)) {
                            return <span className="absolute bottom-1 right-1 text-[9px] text-indigo-400 font-extrabold font-mono">🎯</span>;
                          }
                          if (paths.includes(key)) {
                            return <span className="absolute bottom-0.5 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500/20" />;
                          }
                          return null;
                        })()}

                        {variant === 'sandwich' && (() => {
                          if (['0-1', '1-0', '8-1', '1-8'].includes(`${rIdx}-${cIdx}`)) {
                            return <span className="absolute top-1 right-1 text-[7.5px] text-amber-500 font-bold">🥪</span>;
                          }
                          return null;
                        })()}

                        {/* Render Candidates Pencil Notes */}
                        {cell.value === 0 && cell.candidates.length > 0 ? (
                          <div className="absolute inset-0.5 grid grid-cols-3 grid-rows-3 gap-[1px] font-sans">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                              const noteDisplay = getCellDisplay(n, mode === 'letters');
                              const activeNoteFlag = cell.candidates.includes(n);
                              return (
                                <span
                                  key={n}
                                  className="text-[8px] sm:text-[9.5px] leading-tight flex items-center justify-center text-[#87CEEB] font-bold"
                                >
                                  {activeNoteFlag ? noteDisplay : ''}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="p-0.5">{displayVal}</span>
                        )}
                      </button>
                    );
                  })
                )}
            </div>
          </div>

          {/* Core Interactive Action Toolbar (Undo, eraser, hint, pencil toggle) */}
          <div className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl px-6 py-4 flex items-center justify-between gap-3 max-w-md md:max-w-xl shadow-lg" id="gameplay-toolbars">
            
            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0 || undosUsed >= limits.undos}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-[10px] font-bold uppercase cursor-pointer transition flex-1 relative ${
                history.length > 0 && undosUsed < limits.undos
                  ? 'border-white bg-white/50 hover:bg-white text-[#4DA6FF]'
                  : 'border-white/10 bg-white/15 text-slate-300 pointer-events-none'
              }`}
              title="Undo last move"
              id="tool-undo-btn"
            >
              <span className="absolute -top-2 bg-[#009DFF] text-white font-black text-[8px] px-1.5 py-0.5 rounded-full border border-white shadow-xs tracking-wider">
                {localizeNumber(`${undosUsed}/${limits.undos}`)}
              </span>
              <RotateCcw className="w-4 h-4" />
              <span>Undo</span>
            </button>

            {/* Erase */}
            <button
              onClick={handleErase}
              disabled={erasesUsed >= limits.erases}
              className={`p-3 border rounded-2xl flex flex-col items-center gap-1.5 text-[10px] font-bold uppercase cursor-pointer transition flex-1 shadow-xs relative ${
                erasesUsed < limits.erases
                  ? 'border-white bg-white/50 hover:bg-white text-[#4DA6FF] hover:text-sky-500'
                  : 'border-white/10 bg-white/15 text-slate-300 pointer-events-none'
              }`}
              title="Erase cell value"
              id="tool-erase-btn"
            >
              <span className="absolute -top-2 bg-[#009DFF] text-white font-black text-[8px] px-1.5 py-0.5 rounded-full border border-white shadow-xs tracking-wider">
                {localizeNumber(`${erasesUsed}/${limits.erases}`)}
              </span>
              <Eraser className="w-4 h-4" />
              <span>Erase</span>
            </button>

            {/* Candidate Notes (Pencil Mode) */}
            <button
              onClick={() => {
                gameAudio.playClick();
                setNotesMode(!notesMode);
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-[10px] font-bold uppercase cursor-pointer transition flex-1 shadow-xs ${
                notesMode
                  ? 'border-[#4DA6FF] bg-[#4DA6FF] text-white shadow-[0_0_12px_rgba(77,166,255,0.4)] font-bold'
                  : 'border-white bg-white/50 hover:bg-white text-[#4DA6FF]'
              }`}
              title="Toggle Candidate Notes (Pencil mode)"
              id="tool-notes-btn"
            >
              <Sparkles className={`w-4 h-4 ${notesMode ? 'text-white' : 'text-[#4DA6FF]'}`} />
              <span>Notes: {notesMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Hints */}
            <button
              onClick={handleHint}
              disabled={hintsUsed >= limits.hints}
              className={`p-3 border rounded-2xl flex flex-col items-center gap-1.5 text-[10px] font-bold uppercase cursor-pointer transition flex-1 shadow-xs relative ${
                hintsUsed < limits.hints
                  ? 'border-white bg-white/50 hover:bg-white text-[#4DA6FF] hover:text-sky-500'
                  : 'border-white/10 bg-white/15 text-slate-300 pointer-events-none'
              }`}
              title="Reveal correct cell value"
              id="tool-hint-btn"
            >
              {/* Highly visible minimalist tracker badge precisely over the top of the button */}
              <span className="absolute -top-2 bg-[#009DFF] text-white font-black text-[8px] px-1.5 py-0.5 rounded-full border border-white shadow-xs tracking-wider">
                {localizeNumber(`${hintsUsed}/${limits.hints}`)}
              </span>
              <HelpCircle className="w-4 h-4" />
              <span>Hint</span>
            </button>
          </div>

          {/* 3. Input Keyboard Numbers (with crossed-out finished digits) */}
          <div className="w-full max-w-sm md:max-w-xl bg-white/45 p-4 rounded-3xl border border-white/60 shadow-lg" id="digit-keyboard-wrapper">
            <div 
              className="grid gap-1.5 sm:gap-2.5" 
              style={{
                gridTemplateColumns: `repeat(${(board && board.length) > 9 ? 8 : (board && board.length) || 9}, minmax(0, 1fr))`
              }}
              id="digit-keyboard"
            >
              {Array.from({ length: (board && board.length) || 9 }, (_, idx) => idx + 1).map((num) => {
                const charVal = getCellDisplay(num, mode === 'letters');
                const isFin = isNumberCompleted(num);
                const filledCount = getNumberFilledCount(num);
                return (
                  <button
                    key={num}
                    onClick={() => handleNumberInput(num)}
                    className={`h-16 sm:h-20 rounded-[20px] font-sans flex flex-col items-center justify-center transition cursor-pointer relative border ${
                      isFin
                        ? 'bg-white/40 border-white/20 text-[#4A5568]/20 pointer-events-none'
                        : 'bg-white border-white hover:border-[#4DA6FF] hover:scale-105 active:scale-95 text-[#0F4C81] hover:text-[#007FFF] font-black hover:shadow-md hover:shadow-[#4DA6FF]/10'
                    }`}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                    }}
                    id={`keyboard-btn-${num}`}
                  >
                    <span className="text-lg sm:text-2xl font-black leading-none">{charVal}</span>

                    {/* Smooth, compact progress badge with absolute sizing protection to never pop out */}
                    <div className="mt-1.5 text-[8.5px] sm:text-[10px] font-mono font-black text-[#0F4C81]/80 px-1 py-0.5 rounded bg-slate-100/70 border border-slate-200/50 max-w-[95%] truncate leading-none select-none">
                      {localizeNumber(`${filledCount}/9`)}
                    </div>
                    
                    {/* Visual completed crosses representation as required */}
                    {isFin && (
                      <div className="absolute inset-0 flex items-center justify-center text-[#FF6B6B] opacity-[0.45]">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Tab panel slide overs (Academy, stats, challenges) */}
        <div className="lg:col-span-3 flex flex-col gap-4 w-full" id="supplementary-tabs-panel">
          <AnimatePresence mode="wait">
            
            {/* Tab: Academy Tutorials */}
            {activeTab === 'academy' && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="p-5 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg flex flex-col gap-4 max-h-[460px] overflow-y-auto"
                id="academy-tab-panel"
              >
                <div className="flex items-center justify-between border-b border-white/30 pb-2">
                  <h4 className="font-bold text-[#4A5568] flex items-center gap-1.5 text-sm">
                    <BookOpen className="w-4 h-4 text-[#4DA6FF]" />
                    <span>Sudoku Academy</span>
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-[#4DA6FF] bg-white/60 border border-white px-2 py-0.5 rounded">Tutorials</span>
                </div>
                <div className="flex flex-col gap-4" id="academy-lessons-list">
                  {TUTORIALS.map((lesson) => (
                    <div key={lesson.id} className="p-3.5 bg-white/50 border border-white rounded-2xl flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#4A5568]">{lesson.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#E0F4FF] text-[#4DA6FF] font-semibold rounded">{lesson.difficulty}</span>
                      </div>
                      <p className="text-[#4A5568]/60 leading-normal mt-1 mt-1">{lesson.desc}</p>
                      <ul className="list-decimal list-inside text-[#4A5568]/70 font-snug mt-2 pl-1 gap-1.5 flex flex-col">
                        {lesson.steps.map((st, sidx) => (
                          <li key={sidx} className="leading-normal">{st}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab: Stats Dashboard */}
            {activeTab === 'stats' && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="p-5 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg flex flex-col gap-4 h-full"
                id="stats-tab-panel"
              >
                <div className="flex items-center justify-between border-b border-white/30 pb-2">
                  <h4 className="font-bold text-[#4A5568] flex items-center gap-1.5 text-sm">
                    <BarChart3 className="w-4 h-4 text-[#4DA6FF]" />
                    <span>Progression & Stats</span>
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-[#4DA6FF] bg-white/60 border border-white px-2 py-0.5 rounded">History</span>
                </div>

                {/* Level Up progress bar */}
                <div className="p-3.5 bg-white/50 border border-white rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs text-[#4A5568]">
                    <span className="font-bold text-[10px] uppercase text-[#87CEEB] tracking-wider">XP progression</span>
                    <span className="font-bold text-xs">{profile.xp} XP</span>
                  </div>
                  <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4DA6FF]" style={{ width: `${xpInfo.progress}%` }} />
                  </div>
                  <p className="text-[10px] text-[#4E5B70] font-sans leading-normal">
                    Reach 500 XP to advance to the next player level.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3" id="stats-numbers-grid">
                  <div className="p-3 bg-white/50 rounded-2xl text-center border border-white flex flex-col gap-0.5 shadow-xs">
                    <span className="text-lg font-bold text-[#4A5568]">{profile.totalGames}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Games</span>
                  </div>
                  <div className="p-3 bg-white/50 rounded-2xl text-center border border-white flex flex-col gap-0.5 shadow-xs">
                    <span className="text-lg font-bold text-[#4A5568]">{profile.completedGames}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Victories</span>
                  </div>
                  <div className="p-3 bg-white/50 rounded-2xl text-center border border-white flex flex-col gap-0.5 shadow-xs">
                    <span className="text-lg font-bold text-[#4A5568]">{profile.highestScore}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Best Record</span>
                  </div>
                  <div className="p-3 bg-white/50 rounded-2xl text-center border border-white flex flex-col gap-0.5 shadow-xs">
                    <span className="text-lg font-bold text-[#4A5568]">
                      {profile.completedGames > 0 ? `${Math.round((profile.completedGames / Math.max(1, profile.totalGames)) * 100)}%` : '0%'}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Win Ratio</span>
                  </div>
                </div>

                {/* Achievements List */}
                <div className="flex flex-col gap-2" id="achievements-micro-list">
                  <span className="text-[10px] font-bold text-[#87CEEB] uppercase tracking-wider ml-1">Unlocked Achievements</span>
                  <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto">
                    {ACHIEVEMENTS.map((ach) => {
                      const isUnl = profile.achievements.includes(ach.id);
                      return (
                        <div
                          key={ach.id}
                          className={`p-2.5 border rounded-xl text-xs flex items-center justify-between transition ${
                            isUnl ? 'bg-white/60 border-white text-[#4A5568] shadow-xs' : 'bg-white/20 border-white/10 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{ach.title}</span>
                            <span className="text-[9px] text-[#4A5568]/60 leading-tight">{ach.desc}</span>
                          </div>
                          {isUnl ? (
                            <CheckCircle className="w-4 h-4 text-[#4DA6FF] shrink-0" />
                          ) : (
                            <span className="text-[9px] text-[#4DA6FF] font-semibold font-mono bg-[#E0F4FF]/50 px-1.5 py-0.5 rounded">+{ach.xpValue}xp</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            )}

            {/* Tab: Daily Challenges */}
            {activeTab === 'challenges' && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="p-5 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg flex flex-col gap-4 h-full"
                id="challenges-tab-panel"
              >
                <div className="flex items-center justify-between border-b border-white/30 pb-2">
                  <h4 className="font-bold text-[#4A5568] flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-[#4DA6FF]" />
                    <span>Tournament & Puzzles</span>
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-[#4DA6FF] bg-white/60 border border-white px-2 py-0.5 rounded">League</span>
                </div>

                {/* Special Limited Competitive Modes (Daily Puzzle & Weekly Competition) */}
                <div className="flex flex-col gap-3.5 border-b border-white/30 pb-4 mb-1" id="premium-competitive-modes">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Competitive Play (1 Attempt Limited)</span>
                  </div>
                  
                  {/* Daily Puzzle Card */}
                  <div className="bg-gradient-to-br from-[#E0F2FE]/50 to-white/70 border border-white/80 rounded-2xl p-3 flex flex-col gap-2 relative shadow-xs">
                    {/* Date and Day in small but visible way at top */}
                    <div className="flex justify-between items-center text-[9px] text-[#4DA6FF] font-black tracking-wide uppercase">
                      <span>📆 {getFormattedDateDaily()}</span>
                      <span className="text-slate-600 bg-white/70 px-1.5 py-0.5 rounded border border-slate-100">
                        Score Today: <strong className="text-[#009DFF]">{dailyHighScore > 0 ? `${dailyHighScore}` : "0"}</strong>
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2 mt-1">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-xs text-[#4A5568]">Daily Mind Gym</span>
                        <span className="text-[9px] text-[#87CEEB] font-bold uppercase tracking-wider">Focus Mode • 1 Play Daily</span>
                      </div>

                      {/* Button and timer */}
                      {timeLeftDaily > 0 ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            disabled
                            className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-not-allowed uppercase"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            Locked
                          </button>
                          <span className="text-[8.5px] text-red-400 font-mono font-bold animate-pulse">
                            Reset in: {formatCountdown(timeLeftDaily)}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={startSpecialDaily}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-[#4DA6FF] to-[#009DFF] hover:from-[#3BA7FF] hover:to-[#008CE6] text-white rounded-xl text-[10.5px] font-black cursor-pointer transition flex items-center gap-1 shadow-xs active:scale-95 uppercase tracking-wide"
                        >
                          <Play className="w-2.5 h-2.5 fill-white" />
                          Play Daily
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Weekly Competition Card */}
                  <div className="bg-gradient-to-br from-[#F5F3FF]/50 to-white/70 border border-white/80 rounded-2xl p-3 flex flex-col gap-2 relative shadow-xs">
                    {/* Date and Day in small but visible way at top */}
                    <div className="flex justify-between items-center text-[9px] text-violet-500 font-black tracking-wide uppercase">
                      <span>🗓️ {getFormattedDateWeekly()}</span>
                      <span className="text-slate-600 bg-white/70 px-1.5 py-0.5 rounded border border-slate-100">
                        Score Week: <strong className="text-violet-600">{weeklyHighScore > 0 ? `${weeklyHighScore}` : "0"}</strong>
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2 mt-1">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-xs text-[#4A5568]">Weekly Championship</span>
                        <span className="text-[9px] text-violet-400 font-bold uppercase tracking-wider">Quantum Mode • 1 Play Weekly</span>
                      </div>

                      {/* Button and timer */}
                      {timeLeftWeekly > 0 ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            disabled
                            className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-not-allowed uppercase"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            Locked
                          </button>
                          <span className="text-[8.5px] text-red-400 font-mono font-bold animate-pulse">
                            Reset in: {formatCountdown(timeLeftWeekly)}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={startSpecialWeekly}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl text-[10.5px] font-black cursor-pointer transition flex items-center gap-1 shadow-xs active:scale-95 uppercase tracking-wide"
                        >
                          <Play className="w-2.5 h-2.5 fill-white" />
                          Compete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 mb-1">
                  <span>Standard Training Puzzles</span>
                </div>

                <div className="flex flex-col gap-3" id="daily-challenges-list">
                  {dailyChallenges.map((chal, index) => (
                    <div
                      key={index}
                      className={`p-3.5 border rounded-2xl flex justify-between items-center transition ${
                        chal.completed
                          ? 'bg-white/60 border-[#4DA6FF]/35 shadow-xs'
                          : 'bg-white/40 border-white/40 hover:bg-white/60 hover:border-white'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-bold text-[#4A5568]">{chal.date} Challenge</span>
                        <span className="capitalize text-[10px] text-[#4E5B70] font-sans font-medium">
                          {chal.mode} Mode • {chal.difficulty} level
                        </span>
                      </div>
                      {chal.completed ? (
                        <span className="text-[10px] bg-[#E0F4FF] text-[#4DA6FF] px-2.5 py-1 rounded-md border border-white font-bold flex items-center gap-1">
                          Solved <CheckCircle className="w-3 h-3" />
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setMode(chal.mode);
                            setDifficulty(chal.difficulty);
                            startNewGame(chal.mode, chal.difficulty);
                            setActiveTab(null);
                          }}
                          className="px-3.5 py-1.5 bg-[#4DA6FF] hover:bg-[#3BA7FF] text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-sm"
                        >
                          Play <Play className="w-2.5 h-2.5 fill-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab: Skudo AI */}
            {activeTab === 'ai' && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="p-5 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg flex flex-col gap-4 h-full"
                id="ai-tab-panel"
              >
                <div className="flex items-center justify-between border-b border-white/30 pb-2">
                  <h4 className="font-bold text-[#4A5568] flex items-center gap-1.5 text-sm">
                    <Bot className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>Skudo AI Brain</span>
                  </h4>
                  <span className="text-[10px] uppercase font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse">Live Tutor</span>
                </div>

                <div className="flex flex-col gap-3 flex-1 min-h-[350px] bg-slate-50 border border-slate-200/50 rounded-2xl p-3">
                  
                  {/* Glowing Voice Indicator Box */}
                  <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-2.5 z-10 w-full">
                      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <div className={`absolute rounded-full bg-cyan-500/20 transition-all duration-300 ${
                          isListening ? 'w-8 h-8 animate-ping' : isSpeaking ? 'w-7 h-7 scale-[1.1] opacity-75' : 'w-6 h-6 opacity-30'
                        }`} />
                        <button
                          onClick={handleMicrophoneClick}
                          disabled={aiLoading}
                          className={`w-7.5 h-7.5 rounded-full flex items-center justify-center border cursor-pointer z-20 ${
                            isListening
                              ? 'bg-red-500 border-red-450 text-white animate-pulse'
                              : isSpeaking
                              ? 'bg-emerald-500 border-emerald-450 text-white'
                              : 'bg-[#4DA6FF] border-[#4DA6FF] text-white hover:scale-105 transition'
                          }`}
                          title="Click to dictate using Microphone"
                        >
                          <Mic className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] font-black tracking-wide text-[#4DA6FF] truncate">
                          {isListening ? "🎙️ Skudo AI is listening..." : isSpeaking ? "🔊 Speaking Result..." : "ASK SKUDO ANYTHING"}
                        </span>
                        <span className="text-[9px] text-slate-400 truncate">
                          {isListening ? "Speak now..." : "Press mic to talk/dictate"}
                        </span>
                      </div>
                    </div>

                    {isSpeaking && (
                      <button
                        onClick={handleStopSpeaking}
                        className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white font-mono text-[8.5px] rounded-md cursor-pointer z-10 transition text-center shrink-0"
                      >
                        Stop
                      </button>
                    )}
                  </div>

                  {/* Mic Error Log */}
                  {micError && (
                    <div className="text-[9px] text-red-500 font-bold bg-red-50 border border-red-100 p-2 rounded-lg leading-snug">
                      ⚠️ {micError}
                    </div>
                  )}

                  {/* Dynamic Scrollable Conversation Bubbles */}
                  <div 
                    className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[220px]"
                    id="in-game-ai-conversation-scroll"
                  >
                    {aiChat.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 px-0.5">
                          {msg.sender === 'user' ? 'You' : 'Skudo AI'}
                          {msg.sender === 'siri' && (
                            <button
                              onClick={() => speakText(msg.text)}
                              title="Listen to result"
                              className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-[#4DA6FF] rounded transition cursor-pointer"
                            >
                              <Volume2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <div
                          className={`p-2.5 rounded-xl text-[10.5px] leading-relaxed font-sans shadow-2xs whitespace-pre-line ${
                            msg.sender === 'user'
                              ? 'bg-[#4DA6FF] text-white rounded-tr-none font-bold'
                              : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none font-medium'
                          }`}
                        >
                          {msg.text}
                          {msg.imageUrl && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 p-1">
                              <img
                                src={msg.imageUrl}
                                alt="Skudo AI visualization"
                                className="rounded w-full h-auto max-h-[180px] object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-[8px] text-slate-400 font-mono mt-1 text-right">
                                Powered by Gemini
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {aiLoading && (
                      <div className="self-start flex flex-col max-w-[85%] items-start animate-pulse">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                          Skudo AI is reasoning...
                        </span>
                        <div className="p-2 bg-white text-slate-500 rounded-xl rounded-tl-none border border-slate-100 flex items-center gap-1.5 leading-none">
                          <Loader2 className="w-3 animate-spin text-[#4DA6FF]" />
                          <span className="text-[9.5px] font-semibold">Tuning brain...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggested Help Chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 shrink-0 scrollbar-none text-[9.5px]">
                    {[
                      "Naked Twins technique",
                      "How are columns checked?",
                      "Solve Einstein's riddle",
                      "Generate an image of a cosmic supernova",
                      "How many states are in the US?"
                    ].map(pill => (
                      <button
                        key={pill}
                        onClick={() => {
                          setAiQuery(pill);
                          handleSendQuery(pill);
                        }}
                        disabled={aiLoading}
                        className="px-2 py-0.5 bg-white hover:bg-sky-50 text-slate-800 hover:text-[#4DA6FF] border border-slate-200 hover:border-sky-200 font-bold rounded shrink-0 transition duration-150 cursor-pointer disabled:opacity-50"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>

                  {/* Input Row */}
                  <div className="flex gap-1.5 shrink-0 items-center">
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendQuery();
                      }}
                      disabled={aiLoading}
                      placeholder="Ask Skudo a logic query..."
                      className="flex-1 min-w-0 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-[#4DA6FF] transition disabled:opacity-60"
                    />
                    <button
                      onClick={() => handleSendQuery()}
                      disabled={aiLoading || !aiQuery.trim()}
                      className="p-1.5 bg-[#4DA6FF] hover:bg-[#3BA7FF] text-white rounded-xl cursor-pointer active:scale-95 transition disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

            {/* Default: Local Leaderboards simulation */}
            {activeTab === null && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="p-5 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg flex flex-col gap-4"
                id="default-leaderboard-panel"
              >
                <div className="flex items-center justify-between border-b border-white/30 pb-2">
                  <h4 className="font-bold text-[#4A5568] flex items-center gap-1.5 text-sm">
                    {leaderboardTab === 'global' && <Globe className="w-4 h-4 text-[#4DA6FF]" />}
                    {leaderboardTab === 'daily' && <Calendar className="w-4 h-4 text-emerald-500" />}
                    {leaderboardTab === 'weekly' && <Trophy className="w-4 h-4 text-amber-500" />}
                    <span>
                      {leaderboardTab === 'global' && 'Global Campaign Board'}
                      {leaderboardTab === 'daily' && 'Daily Solitaire League'}
                      {leaderboardTab === 'weekly' && 'Weekly Championship Cup'}
                    </span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-black text-slate-500 bg-white/40 border border-slate-200/50 px-1.5 py-0.5 rounded tracking-wider animate-pulse">
                      Update: {Math.floor(leaderboardCountdown / 60)}:{(leaderboardCountdown % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#4DA6FF] bg-white/60 border border-white px-2 py-0.5 rounded">Live</span>
                  </div>
                </div>

                {/* Switcher Tab Header */}
                <div className="grid grid-cols-3 bg-slate-200/30 p-1 border border-slate-300/10 rounded-2xl w-full" id="board-tabs-selector">
                  <button
                    onClick={() => {
                      gameAudio.playClick();
                      setLeaderboardTab('global');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-150 cursor-pointer min-w-0 ${
                      leaderboardTab === 'global'
                        ? 'bg-[#4DA6FF] text-white shadow-sm shadow-[#4DA6FF]/15'
                        : 'text-slate-600 hover:bg-white/40'
                    }`}
                  >
                    <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="truncate">Campaign</span>
                  </button>
                  <button
                    onClick={() => {
                      gameAudio.playClick();
                      setLeaderboardTab('daily');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-150 cursor-pointer min-w-0 ${
                      leaderboardTab === 'daily'
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/15'
                        : 'text-slate-600 hover:bg-white/40'
                    }`}
                  >
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="truncate">Daily</span>
                  </button>
                  <button
                    onClick={() => {
                      gameAudio.playClick();
                      setLeaderboardTab('weekly');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-150 cursor-pointer min-w-0 ${
                      leaderboardTab === 'weekly'
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/15'
                        : 'text-slate-600 hover:bg-white/40'
                    }`}
                  >
                    <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="truncate">Weekly</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2.5" id="leaderboards-entries-list">
                  {(leaderboardTab === 'global'
                    ? highScores
                    : leaderboardTab === 'daily'
                    ? dailyLeaderboard
                    : weeklyLeaderboard
                  ).map((leader, index) => {
                    const isUser = leader.name.includes('(You)');
                    return (
                      <div
                        key={leader.id}
                        className={`flex justify-between items-center p-2.5 border rounded-xl text-xs transition duration-150 ${
                          isUser
                            ? 'bg-[#E0F4FF]/90 border-[#4DA6FF] shadow-xs scale-[1.01]'
                            : 'bg-white/50 border-white text-[#4A5568]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 font-bold flex items-center justify-center rounded-lg text-[10px] ${
                            index === 0
                              ? 'bg-[#E0F4FF] text-[#4DA6FF]'
                              : index === 1
                              ? 'bg-slate-100/80 text-[#4A5568]'
                              : 'bg-white/30 text-[#4A5568]/60 border border-white/30'
                          }`}>
                            {index + 1}
                          </span>
                          <span className={`${isUser ? 'font-extrabold text-[#009DFF]' : 'font-bold text-[#4A5568]'}`}>
                            {leader.name}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`font-mono font-bold ${isUser ? 'text-[#009DFF]' : 'text-[#4A5568]'}`}>
                            {leader.score} {leaderboardTab === 'global' ? 'XP' : 'Pts'}
                          </span>
                          <span className="text-[9px] text-[#4E5B70]">
                            {Math.floor(leader.time / 60)}m {leader.time % 60}s
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-3 border border-[#87CEEB]/20 bg-white/30 text-center rounded-2xl text-[10px] text-[#4A5568]/70 italic mt-1 font-medium">
                    {leaderboardTab === 'global' && "Compete across multiple difficulties to rank higher!"}
                    {leaderboardTab === 'daily' && "Only your best daily attempt is saved. Resets every 24 hours!"}
                    {leaderboardTab === 'weekly' && "Compete with global players to reach the podium this week!"}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* 3. Win / Loss End Game Bottom Sheet Drawer */}
      <AnimatePresence>
        {showEndSheet && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-end justify-center transition-all overflow-hidden">
            
            {/* Overlay background dimmer */}
            <div className="absolute inset-0" onClick={() => setShowEndSheet(false)} />

            {/* Premium Blue Shooting Rockets and Popping Firecrackers Sparkles */}
            {endState === 'win' && <BlueFirecrackerCelebration />}
            
            {/* Slide up panel container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white/90 backdrop-blur-md rounded-t-3xl border-t border-white/60 px-6 py-8 shadow-2xl flex flex-col gap-6 z-20 text-center"
              id="endgame-bottom-sheet"
            >

              {/* Title Section */}
              <div className="flex flex-col gap-1 items-center">
                {endState === 'win' ? (
                  <>
                    <div className="p-4 bg-white/60 border border-white rounded-full text-[#4DA6FF] mb-2 shadow-sm">
                      <Sparkles className="w-12 h-12" id="trophy-win-vibe" />
                    </div>
                    <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#4A5568]" id="win-headline">
                      Puzzle Complete!
                    </h2>
                    <p className="text-[10px] uppercase font-bold text-[#87CEEB] tracking-wider mt-1">Excellent Work!</p>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-red-50/60 border border-red-100 rounded-full text-[#FF6B6B] mb-2 shadow-sm">
                      <Shield className="w-12 h-12 animate-bounce animate-pulse" id="bomb-fail-vibe" />
                    </div>
                    <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#FF6B6B]" id="lose-headline">
                      Puzzle Failed
                    </h2>
                    <p className="text-[10px] uppercase font-bold text-[#FF6B6B]/70 tracking-wider mt-1">Mistakes quota exceeded. Keep trying!</p>
                  </>
                )}
              </div>

              {/* Stats Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-2" id="endgame-stats-summary">
                <div className="p-3 bg-white/50 border border-white rounded-2xl flex flex-col shadow-xs">
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Final Score</span>
                  <span className="text-lg font-bold text-[#4A5568] font-mono mt-0.5">
                    {endState === 'win' ? score : 0}
                  </span>
                </div>
                <div className="p-3 bg-white/50 border border-white rounded-2xl flex flex-col shadow-xs">
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Time</span>
                  <span className="text-lg font-bold text-[#4A5568] font-mono mt-0.5">
                    {Math.floor(seconds / 60).toString().padStart(2, '0')}:
                    {(seconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="p-3 bg-white/50 border border-white rounded-2xl flex flex-col shadow-xs">
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Mistakes</span>
                  <span className="text-lg font-bold text-[#FF6B6B] font-mono mt-0.5">
                    {mistakes}/{maxMistakes}
                  </span>
                </div>
                <div className="p-3 bg-white/50 border border-white rounded-2xl flex flex-col shadow-xs">
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Accuracy</span>
                  <span className="text-lg font-bold text-[#4A5568] font-mono mt-0.5">
                    {Math.max(0, 100 - mistakes * 15)}%
                  </span>
                </div>
              </div>

              {/* Rate game (5 elegant blue stars) */}
              <div className="flex flex-col gap-1 items-center bg-white/45 p-4 border border-white rounded-2xl w-full" id="rate-game-container">
                <span className="text-xs font-bold text-[#4A5568]">Enjoying SKUDO.ZIP? Rate this puzzle!</span>
                <div className="flex gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <button
                      key={starIdx}
                      onClick={() => {
                        gameAudio.playClick();
                        setUserRating(starIdx);
                      }}
                      className="p-1 cursor-pointer transition transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-5.5 h-5.5 ${
                          starIdx <= userRating ? 'fill-[#4DA6FF] text-[#4DA6FF]' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-[#4DA6FF] font-bold mt-1">Thank you for playing {profile.name}!</span>
              </div>

              {activeSpecialGame && endState === 'win' && (
                <div className="my-1 p-4 border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl text-center flex flex-col items-center gap-2" id="tournament-certificate-card-earned">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-505 animate-pulse" />
                    <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 font-sans tracking-wide">Official Champion Certificate Secured!</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Your absolute logic dominance is preserved. You can now download your Official Skudo Champion Certificate.
                  </p>
                  <button
                    onClick={() => {
                      gameAudio.playClick();
                      downloadCertificateFile(
                        activeSpecialGame, 
                        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 
                        `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`, 
                        score, 
                        profile.name || "Commander"
                      );
                    }}
                    className="mt-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Digital Certificate
                  </button>
                </div>
              )}

              {/* Primary Slide Up drawer menu option links */}
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-2" id="endgame-action-list">
                {activeSpecialGame ? (
                  <div className="flex-1 py-3 bg-red-50 border border-red-200/50 text-red-700 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold px-3 shadow-xs">
                    <span className="flex items-center gap-1 uppercase tracking-wide text-[10px] font-black text-red-500">
                      <Lock className="w-3.5 h-3.5" /> Single Attempt Locked
                    </span>
                    <span className="text-[10px] font-medium text-red-600/90 text-center">Competitive challenges are 1-play limited. Returning to Dashboard is required.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => startNewGame(mode, difficulty)}
                    className="flex-1 py-3.5 bg-[#4DA6FF] hover:bg-[#3BA7FF] text-white font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition duration-150 active:scale-[0.98] shadow-md"
                    id="endsheet-retry-btn"
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                    <span>{endState === 'win' ? 'Next Puzzle' : 'Retry'}</span>
                  </button>
                )}
                <button
                  onClick={onExitToMenu}
                  className="flex-1 py-3.5 bg-white/50 hover:bg-white text-[#4A5568] font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition duration-150 active:scale-[0.98] border border-white shadow-xs"
                  id="endsheet-home-btn"
                >
                  <Home className="w-4.5 h-4.5 text-[#4DA6FF]" />
                  <span>Main Dashboard</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Companion Hint Analyzer & Outcome Predictor */}
      <AnimatePresence>
        {showHintModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Overlay background dim click closing support */}
            <div className="absolute inset-0" onClick={() => setShowHintModal(false)} />
            
            {/* Smooth Springing Pop-up Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 230 }}
              className="relative w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 p-6 shadow-2xl flex flex-col gap-4.5 z-20"
              id="hint-detail-popup"
            >
              {/* Header section with icon and subtitle */}
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3" id="hint-popup-header">
                <div className="p-2 bg-gradient-to-br from-[#38BDF8] to-[#009DFF] rounded-xl text-white shadow-xs">
                  <HelpCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-extrabold text-[#4A5568] leading-none mb-0.5">
                    Logical Hint Companion
                  </h3>
                  <p className="text-[9px] tracking-widest text-[#87CEEB] font-black uppercase mt-0.5">
                    Skudo Daydream Solver
                  </p>
                </div>
              </div>

              {/* MANDATORY ONLY HINTS CAN TAKE HINT RULE BANNER */}
              <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-3 text-center shadow-xs" id="hint-warning-banner">
                <p className="text-[9px] font-black tracking-wider text-amber-600 uppercase leading-none mb-1">
                  ⚠️ Limit Notice
                </p>
                <p className="text-xs font-black text-amber-800 tracking-wide uppercase">
                  ONLY {limits.hints} TIMES CAN TAKE HINT
                </p>
              </div>

              {/* Minimalist usage dots mapping hints history slots */}
              <div className="flex items-center justify-between bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-500 font-bold">
                <span>Usage status:</span>
                <div className="flex items-center gap-1.5">
                  {limits.hints > 0 ? (
                    Array.from({ length: limits.hints }).map((_, idx) => (
                      <div 
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          hintsUsed > idx 
                            ? 'bg-amber-500 shadow-sm shadow-amber-300' 
                            : 'bg-slate-200 border border-slate-300/40'
                        }`}
                      />
                    ))
                  ) : (
                    <span className="text-[10px] text-red-500 font-bold">No hints allowed in this difficulty</span>
                  )}
                  <span className="text-[10.5px] font-extrabold text-slate-700 ml-1">({hintsUsed}/{limits.hints} Used)</span>
                </div>
              </div>

              {/* Target Position and Mathematical Candidate Analysis */}
              <div className="flex flex-col gap-2.5 bg-white/40 border border-slate-100 p-3.5 rounded-xl text-xs" id="hint-analysis-content">
                {!selectedCell ? (
                  <p className="text-center text-slate-400 font-bold py-3">
                    No cell selected. Click any active square on the board first to view custom hints!
                  </p>
                ) : (() => {
                  const { r, c } = selectedCell;
                  const cell = board[r]?.[c];
                  if (!cell) return null;

                  const isLetterMode = mode === 'letters';
                  const labelRow = r + 1;
                  const labelCol = c + 1;

                  if (cell.isGiven) {
                    return (
                      <p className="text-center text-slate-400 font-bold py-3 leading-relaxed">
                        This cell is an official starting clue ({getCellDisplay(cell.value, isLetterMode)}). Given values cannot be edited or hinted.
                      </p>
                    );
                  }

                  if (cell.value === cell.correctValue && !hasAppliedHintThisSession) {
                    return (
                      <p className="text-center text-emerald-600 font-extrabold py-3 leading-relaxed">
                        Excellent! This space is already filled correctly with {getCellDisplay(cell.value, isLetterMode)}.
                      </p>
                    );
                  }

                  // Mathematical Deep Analysis of constraints
                  const rowValuesSet = new Set<number>();
                  const colValuesSet = new Set<number>();
                  const boxValuesSet = new Set<number>();

                  const boxRowStart = Math.floor(r / 3) * 3;
                  const boxColStart = Math.floor(c / 3) * 3;

                  for (let br = boxRowStart; br < boxRowStart + 3; br++) {
                    for (let bc = boxColStart; bc < boxColStart + 3; bc++) {
                      const v = board[br]?.[bc]?.value;
                      if (v && v !== 0) boxValuesSet.add(v);
                    }
                  }

                  for (let i = 0; i < 9; i++) {
                    const rv = board[r]?.[i]?.value;
                    if (rv && rv !== 0) rowValuesSet.add(rv);
                    const cv = board[i]?.[c]?.value;
                    if (cv && cv !== 0) colValuesSet.add(cv);
                  }

                  const combinedExcluded = new Set([...rowValuesSet, ...colValuesSet, ...boxValuesSet]);
                  const remainingMathCandidatesCount = Math.max(0, 9 - combinedExcluded.size);

                  const rowDisplays = Array.from(rowValuesSet).map(n => getCellDisplay(n, isLetterMode)).join(', ');
                  const colDisplays = Array.from(colValuesSet).map(n => getCellDisplay(n, isLetterMode)).join(', ');
                  const boxDisplays = Array.from(boxValuesSet).map(n => getCellDisplay(n, isLetterMode)).join(', ');

                  // Compute placement candidates dynamically
                  const posNums = getPossibleOutcomeCandidates(r, c);
                  const posDisplays = posNums.map(n => getCellDisplay(n, isLetterMode));
                  const solDisplay = getCellDisplay(cell.correctValue, isLetterMode);

                  return (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between text-slate-400 font-extrabold border-b border-dashed border-slate-100 pb-2">
                        <span className="uppercase text-[9px] tracking-wide text-sky-600">Coordinate Diagnosis:</span>
                        <span className="text-slate-600">Row {labelRow}, Col {labelCol}</span>
                      </div>

                      {/* DEEP ANALISIATION SECTION */}
                      <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-200/40 text-slate-600 text-[11px] leading-relaxed flex flex-col gap-2">
                        <p className="text-[9.5px] text-slate-400 uppercase font-black tracking-wide border-b border-slate-200/50 pb-1">
                          📊 Deep Logical Analysis:
                        </p>
                        <div>
                          <strong>Row Eliminations:</strong> {rowDisplays ? rowDisplays : <span className="text-slate-400 italic">none yet</span>}
                        </div>
                        <div>
                          <strong>Col Eliminations:</strong> {colDisplays ? colDisplays : <span className="text-slate-400 italic">none yet</span>}
                        </div>
                        <div>
                          <strong>Box Eliminations:</strong> {boxDisplays ? boxDisplays : <span className="text-slate-400 italic">none yet</span>}
                        </div>
                        <div className="mt-1 pt-1.5 border-t border-slate-200/50 font-medium text-[10px] text-[#085182] bg-[#E0F2FE]/40 p-1.5 rounded-md">
                          💡 <strong>Solver Insight:</strong> There are <strong>{combinedExcluded.size}</strong> unique values eliminating options from peer scopes, leaving exactly <strong>{remainingMathCandidatesCount}</strong> mathematical candidates for this block.
                        </div>
                      </div>

                      {!hasAppliedHintThisSession ? (
                        /* OUTCOME HIDDEN INITIAL STATE */
                        <div className="flex flex-col gap-3">
                          {/* Tab Controller Buttons */}
                          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() => setHintCoachingMode('socratic')}
                              className={`flex-grow py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                                hintCoachingMode === 'socratic'
                                  ? 'bg-white text-[#009DFF] shadow-xs'
                                  : 'text-slate-400 hover:text-slate-650'
                              }`}
                            >
                              🎓 Socratic Clue
                            </button>
                            <button
                              onClick={() => setHintCoachingMode('reveal')}
                              className={`flex-grow py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                                hintCoachingMode === 'reveal'
                                  ? 'bg-white text-red-500 shadow-xs'
                                  : 'text-slate-400 hover:text-slate-650'
                              }`}
                            >
                              ⚡ Reveal Ans
                            </button>
                          </div>

                          {hintCoachingMode === 'socratic' ? (
                            /* SOCRATIC TEACHING SECTION (Infinite clues, questions, pattern highlights) */
                            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-left flex flex-col gap-2">
                              <span className="text-[8.5px] uppercase font-black text-[#009DFF] tracking-widest block mb-0.5">
                                💡 UNIVERSAL COACH STUDY:
                              </span>
                              <p className="font-sans font-medium text-[11.5px] text-[#085182] leading-relaxed">
                                Let's study the coordinates at Row {labelRow}, Col {labelCol}.
                              </p>
                              <p className="font-sans font-semibold text-[11px] text-slate-650 leading-relaxed">
                                • Socratic Clue: There is exactly one place in Box {Math.floor(r/3)*3 + Math.floor(c/3) + 1} where the digit <strong className="text-[#009DFF] text-xs">{solDisplay}</strong> is forced to fit. Why?
                              </p>
                              <p className="font-sans font-semibold text-[11px] text-slate-650 leading-relaxed">
                                • Pattern highlights: Cross-reference your eliminated scope values: {combinedExcluded.size} slots are locked. Can you see where {solDisplay} has a clean alignment?
                              </p>
                              <p className="font-sans text-[10px] text-indigo-400 font-bold border-t border-dashed border-blue-150 pt-2.5 mt-0.5">
                                Think: What happens if you place a value other than {solDisplay} here? Will it collide with other peers?
                              </p>
                            </div>
                          ) : (
                            /* REVEAL PRESET VIEW */
                            <div className="flex flex-col gap-2">
                              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center relative overflow-hidden shadow-xs">
                                <span className="absolute top-1.5 right-2 text-[8px] bg-sky-100 text-[#009DFF] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider">
                                  Locked
                                </span>
                                <p className="text-[10.5px] tracking-widest text-[#085182]/70 font-black uppercase mb-1">
                                  Solution Outcome
                                </p>
                                <div className="flex items-center justify-center gap-1.5 text-slate-400 my-1 py-1">
                                  <span className="text-2xl font-black tracking-widest">🔒 ? 🔒</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold px-1.5 leading-relaxed mt-1">
                                  Outcome masked. Consume 1 of your allocated hints to view and place the correct item.
                                </p>
                              </div>

                              {hintsUsed < limits.hints ? (
                                <button
                                  onClick={() => applyHintFill(r, c)}
                                  className="w-full mt-1.5 py-3 bg-[#009DFF] hover:bg-[#3BA7FF] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-150 active:scale-[0.98] shadow-md shadow-[#009DFF]/15 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Reveal & Consume 1 Hint</span>
                                </button>
                              ) : (
                                <div className="w-full mt-1.5 py-3 bg-red-50 text-red-600 text-center font-bold text-xs uppercase tracking-wider rounded-xl border border-red-100/60 select-none">
                                  ONLY {limits.hints} TIMES CAN TAKE HINT
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* REVEALED STATE (AFTER HINT CONSUMPTION) */
                        <div className="flex flex-col gap-3">
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <p className="text-xs font-black text-emerald-800 tracking-wide uppercase">
                              ✨ HINT USED SUCCESS
                            </p>
                          </div>

                          {/* Correct outcome display */}
                          <div className="bg-gradient-to-br from-[#E0F2FE]/50 to-[#E0F4FF]/10 border border-[#BAE6FD]/40 rounded-xl p-3.5 text-center">
                            <p className="text-[10px] tracking-widest text-[#009DFF] font-black uppercase mb-1">
                              Revealed Solution
                            </p>
                            <p className="text-4xl font-black text-[#085182] tracking-tight">
                              {solDisplay}
                            </p>
                            <p className="text-[10px] text-[#009DFF] font-extrabold mt-1 uppercase tracking-wider">
                              Auto-Applied at ({labelRow}, {labelCol})
                            </p>
                          </div>

                          {/* Possible outcomes candidates display */}
                          <div>
                            <p className="text-[9.5px] tracking-wide text-slate-400 font-extrabold uppercase mb-1.5">
                              Allowed Candidates for Cell:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {posDisplays.length > 0 ? (
                                posDisplays.map((p) => (
                                  <span 
                                    key={p} 
                                    className={`px-2.5 py-0.5 text-xs font-black rounded-md border ${
                                      p === solDisplay 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 ring-1 ring-emerald-300/30' 
                                        : 'bg-sky-50 text-[#009DFF] border-[#BAE6FD]'
                                    }`}
                                  >
                                    {p} {p === solDisplay && '✓'}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-red-400 font-bold">
                                  No option valid due to current grid mistakes.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowHintModal(false)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-slate-150 cursor-pointer transition duration-150 active:scale-[0.98]"
              >
                Return to Puzzle
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
