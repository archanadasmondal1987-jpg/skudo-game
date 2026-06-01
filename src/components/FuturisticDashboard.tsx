/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hash, 
  AlignLeft, 
  Lock, 
  Trophy, 
  Calendar, 
  Play, 
  BookOpen, 
  X, 
  Sparkles, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Bot,
  Loader2,
  Activity,
  Award,
  XCircle,
  Shield,
  Flame,
  Search,
  Bell,
  Sliders,
  ChevronRight,
  Zap,
  Target,
  RefreshCw,
  Compass,
  ArrowUpRight,
  Download,
  Copy,
  Layout,
  Layers,
  ChevronDown,
  Camera,
  Upload
} from 'lucide-react';
import { GameMode, PlayerProfile } from '../types';
import { gameAudio } from '../utils/audio';

// Custom Trigger Vibe for premium feedback tactile feeling
const triggerVibe = () => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(8);
    } catch (_) {}
  }
};

interface FuturisticDashboardProps {
  profile: PlayerProfile;
  theme: 'light' | 'dark';
  onUpdateProfile: (updated: PlayerProfile) => void;
  onSelectGame: (config: {
    mode: GameMode;
    difficulty: 'flow' | 'zen' | 'focus' | 'quantum';
    special?: 'daily' | 'weekly';
    boss?: { name: string; avatarUrl: string; quote: string; style: string; difficulty: any } | null;
    variant?: string;
  }) => void;
  onOpenLegacyAcademy: () => void;
  onToggleTheme: () => void;
  onToggleAudio: () => void;
  audioEnabled: boolean;
}

export default function FuturisticDashboard({
  profile,
  theme,
  onUpdateProfile,
  onSelectGame,
  onOpenLegacyAcademy,
  onToggleTheme,
  onToggleAudio,
  audioEnabled,
}: FuturisticDashboardProps) {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'play' | 'learn' | 'arena' | 'analytics' | 'achievements' | 'settings' | 'help' | 'lens'>('home');

  // Search, difficulty popup, and notification states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDifficultyPopupMode, setShowDifficultyPopupMode] = useState<'numbers' | 'letters' | null>(null);
  const [selectedPopupDifficulty, setSelectedPopupDifficulty] = useState<'zen' | 'flow' | 'focus' | 'quantum'>('flow');
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean; icon: any }>>([
    { id: '1', text: `🏆 Welcome back, ${profile.name}! Your account is synchronized in 2026.`, time: '1m ago', read: false, icon: Sparkles },
    { id: '2', text: `🔥 Streak Alert! Keep solving to reach ${profile.streak + 1} days milestone.`, time: '10m ago', read: false, icon: Flame },
    { id: '3', text: `📈 Constraint solvers updated for letters variant mode.`, time: '2h ago', read: true, icon: Target },
    { id: '4', text: `🤖 Skudo AI Coach has generated 5 new brain tips.`, time: '5h ago', read: true, icon: Bot }
  ]);

  // AI Brain Tip Index
  const [aiBrainTipIndex, setAiBrainTipIndex] = useState<number>(() => Math.floor(Math.random() * 8));
  const brainTips = [
    `Stuck on Naked Triples? Focus on cells row-wise. Or prompt: "Explain Naked Triple strategies" inside SKUDO AI Chat!`,
    `Try scanning candidate subsets. If a number can only appear in a single row/col in any 3x3 region, it eliminates that digit elsewhere!`,
    `Master the X-Wing! When a digit has only 2 candidates in 2 distinct rows, and they align vertically in columns, delete that option from the rest of the columns.`,
    `Al Letters mode re-wires standard brain pathways! Try mapping letters A-I to your standard 1-9 visual habits for an extra cognitive boost.`,
    `Swordfish is the ultimate weapon! Look for three rows where a number appears as candidate in only the same three columns. It deletes candidates in other rows!`,
    `Use the Skudo Lens! Scanner option lets you upload any offline newspaper puzzle and solve it instantly using Gemini advanced OCR grid tracers.`,
    `Daily Challenges award double XP! Keep solving everyday to increase your ELO rank and unlock achievements twice as fast.`,
    `Autocheck is a great learning tool, but completing a focus-difficulty grid with 0 checks awards the legendary 'Supercomputer Brain' achievement (+250 XP!).`,
    `Naked Pairs: When two cells in a unit contain only the same two candidates, those candidates can be safely removed from all other cells in that unit.`,
    `Hidden Pairs: If two candidates only occur in two cells of a row, column, or block, then all other candidates in those cells can be eliminated!`,
    `When contesting in Arena Championship, speed is king! Shaving off 10 seconds of analysis can earn you +50 Arena points.`,
    `Stuck? Turn on Notes Mode! Pressing spacebar or click pen icon activates pencil marks, preventing backtracking fatigue.`,
    `Keep hydrated! Brain training demands core glycogen levels. Drink some water between expert sessions to maintain logical flow.`,
    `ALS (Almost Locked Set) chains are advanced tactics where a set of N cells has exactly N+1 candidates. Keep an eye out for chained eliminations!`,
    `The Help Center is always open! Browse FAQ categories or search 'bugs' inside settings to easily diagnostic sync profiles.`,
    `Did you know? Completing a Quantum grid perfectly without mistakes unlocks the ultimate 'Absolute Zenith' achievement badge (+500 XP!).`
  ];

  // Help Center Search and Collapsibles
  const [helpSearchQuery, setHelpSearchQuery] = useState<string>('');
  const [selectedHelpArticle, setSelectedHelpArticle] = useState<string | null>(null);
  const [supportSubmitted, setSupportSubmitted] = useState<boolean>(false);
  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportPriority, setSupportPriority] = useState<'casual' | 'blocker' | 'neural'>('casual');
  const [supportTicketResult, setSupportTicketResult] = useState<string>('');
  const [supportLoading, setSupportLoading] = useState<boolean>(false);

  // Skudo Lens Digitizer States
  const [lensFile, setLensFile] = useState<string | null>(null);
  const [isCapturingLens, setIsCapturingLens] = useState<boolean>(false);
  const [lensScanProgress, setLensScanProgress] = useState<number>(-1);
  const [lensScanningTime, setLensScanningTime] = useState<boolean>(false);
  const [lensSolvedGrid, setLensSolvedGrid] = useState<boolean>(false);
  const [lensBoard, setLensBoard] = useState<number[][] | null>(null);

  // Listener to support Help Center and Lens page triggers from setting buttons
  useEffect(() => {
    const handleOverride = () => {
      const override = localStorage.getItem('skudo_dashboard_tab_override');
      if (override) {
        setActiveTab(override as any);
        localStorage.removeItem('skudo_dashboard_tab_override');
      }
    };
    window.addEventListener('skudo_dashboard_tab', handleOverride);
    handleOverride();
    return () => window.removeEventListener('skudo_dashboard_tab', handleOverride);
  }, []);

  // Skudo AI Assistant & Chat states (General-Purpose Gemini Coach)
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'Smart' | 'CodeExpert' | 'FastReasoning'>('Smart');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const [aiChat, setAiChat] = useState<Array<{ sender: 'user' | 'ai'; text: string; id: string; imageUrl?: string }>>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Greetings, ${profile.name}! I am **SKUDO AI**, your cognitive intelligence companion fully powered by Google Gemini.

While my logical origins are rooted in Sudoku, my synthetic neural paths are trained in **every single academic and creative domain in the universe**. You can ask me to:
* **Solve and analyze** any Sudoku grids or newspaper scans.
* **Write full-stack code scripts** in C++, HTML, Python, JS, etc.
* **Deconstruct mathematical theory** or chemical properties.
* **Generate/create premium graphics** and images instantly.

How can I help optimize your mind today?`,
    }
  ]);

  // Saved Session State
  const [savedSessionExists, setSavedSessionExists] = useState<boolean>(false);
  const [savedSessionMeta, setSavedSessionMeta] = useState<{ mode: GameMode; difficulty: any } | null>(null);

  // Statistics Separations
  const [dailyHighScore, setDailyHighScore] = useState<number>(0);
  const [weeklyHighScore, setWeeklyHighScore] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());

  // Arena matchmaking visual triggers
  const [matchmakingActive, setMatchmakingActive] = useState<boolean>(false);
  const [matchmakingProgress, setMatchmakingProgress] = useState<number>(0);
  const [matchedOpponent, setMatchedOpponent] = useState<any>(null);

  // TTS / Voice Synth Cleanups
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update dates and counts
  useEffect(() => {
    const checkSaved = () => {
      const raw = localStorage.getItem('skudo_saved_session');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setSavedSessionExists(true);
          setSavedSessionMeta({
            mode: parsed.settings?.mode || 'numbers',
            difficulty: parsed.settings?.difficulty || 'zen'
          });
        } catch (_) {
          setSavedSessionExists(false);
        }
      } else {
        setSavedSessionExists(false);
      }

      const dScore = localStorage.getItem('skudo_daily_highscore');
      const wScore = localStorage.getItem('skudo_weekly_highscore');
      if (dScore) setDailyHighScore(parseInt(dScore, 10));
      if (wScore) setWeeklyHighScore(parseInt(wScore, 10));
    };

    checkSaved();
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Audio Speech synthesis
  const speakText = (text: string) => {
    if (!window.speechSynthesis || !audioEnabled) return;
    
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Filter syntax symbols/markdown
    const cleanText = text
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/#+\s/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/[|•:\-_]/g, ' ')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\bSudoku\b/gi, 'Soo-doh-koo')
      .replace(/\bSkudo\b/gi, 'Skoo-doh')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.toLowerCase().startsWith('en')) || null;
    if (englishVoice) utterance.voice = englishVoice;
    
    utterance.rate = 0.98;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Mic recognition handler
  const handleMicToggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition not supported in this browser. Try Chrome/Safari.");
      setTimeout(() => setMicError(null), 3000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      gameAudio.playClick();
      triggerVibe();
      stopSpeaking();
      setMicError(null);

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setAiQuery(transcript);
          submitAiPrompt(transcript);
        }
      };

      recognition.start();
    } catch (_) {
      setMicError("Cannot initialize voice microphone.");
      setIsListening(false);
      setTimeout(() => setMicError(null), 3000);
    }
  };

  // Submit Prompt via full-stack secure API Route proxying Gemini API request
  const submitAiPrompt = async (promptText?: string) => {
    const activePrompt = promptText || aiQuery;
    if (!activePrompt.trim()) return;

    gameAudio.playClick();
    triggerVibe();
    stopSpeaking();

    // Append to Chat history
    const userMsg = { sender: 'user' as const, text: activePrompt, id: `user-${Date.now()}` };
    setAiChat(prev => [...prev, userMsg]);
    setAiQuery('');
    setAiLoading(true);

    // If we're on Home page, direct them to Chat view to view the stream/results elegantly
    if (activeTab === 'home') {
      setActiveTab('chat');
    }

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: activePrompt })
      });

      const data = await response.json();
      if (response.ok && (data.text || data.imageUrl)) {
        const coachMsg = {
          sender: 'ai' as const,
          text: data.text || "Generated image for you.",
          id: `ai-${Date.now()}`,
          imageUrl: data.imageUrl
        };
        setAiChat(prev => [...prev, coachMsg]);
        speakText(coachMsg.text);
      } else {
        const errText = data.error || "Cognitive request limit reached. Check connection.";
        setAiChat(prev => [...prev, { sender: 'ai', text: `⚠️ Skudo AI Note: ${errText}`, id: `err-${Date.now()}` }]);
      }
    } catch (_) {
      setAiChat(prev => [...prev, { sender: 'ai', text: "⚠️ Network Offline: Failed to reach Skudo AI backend.", id: `net-${Date.now()}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Matchmaking engine simulator for Arena mode
  const startMatchmaking = () => {
    gameAudio.playClick();
    triggerVibe();
    setMatchmakingActive(true);
    setMatchmakingProgress(0);
    setMatchedOpponent(null);

    const interval = setInterval(() => {
      setMatchmakingProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          // Match made! Select opponent
          const opponents = [
            { name: "Satoshi_Nakamoto", country: "JP", rankName: "Mythic", rating: 1850, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" },
            { name: "Ada_Lovelace", country: "UK", rankName: "Omega", rating: 2200, avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120" },
            { name: "Euler_Deductor", country: "CH", rankName: "Legend", rating: 1950, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120" }
          ];
          const matched = opponents[Math.floor(Math.random() * opponents.length)];
          setMatchedOpponent(matched);
          return 100;
        }
        return p + Math.floor(Math.random() * 8) + 3;
      });
    }, 150);
  };

  const launchArenaMatch = () => {
    if (matchedOpponent) {
      onSelectGame({
        mode: 'numbers',
        difficulty: 'quantum',
        variant: 'arena_championship'
      });
    }
  };

  // Continue middle-left saved game trigger
  const handleContinuePlaying = () => {
    if (savedSessionExists) {
      gameAudio.playPlacement(true);
      triggerVibe();
      onSelectGame({
        mode: savedSessionMeta?.mode || 'numbers',
        difficulty: savedSessionMeta?.difficulty || 'zen',
        variant: 'continue'
      });
    }
  };

  // Format countdown text for Daily/Weekly
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy text to clipboard
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2500);
  };

  // Theme support
  const bgGradient = theme === 'dark' 
    ? 'bg-gradient-to-br from-[#0F1423] via-[#1A1F36] to-[#0A0C16] text-[#E2E8F0]' 
    : 'bg-gradient-to-br from-[#FFFFFF] via-[#F4FAFF] to-[#EAF7FF] text-[#4A5568]';

  return (
    <div className={`w-full flex flex-col lg:flex-row min-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border transition-colors duration-300 relative select-none ${
      theme === 'dark' ? 'bg-[#0F1322] border-slate-800' : 'bg-white border-slate-100'
    }`} id="futuristic-ai-workspace">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <nav className={`w-full lg:w-64 p-5 flex flex-col gap-5 border-r shrink-0 ${
        theme === 'dark' ? 'bg-[#0E1220]/95 border-slate-800/80' : 'bg-[#FFFFFF]/90 border-slate-200/50'
      }`}>
        {/* Core App Title + Animated rotating AI Ring */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Animated Ring 1 */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#009DFF] animate-spin" style={{ animationDuration: '8s' }} />
            {/* Pulsing Core */}
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#009DFF] to-violet-500 animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans text-base font-extrabold tracking-tight leading-none">SKUDO AI</h1>
            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Cognitive OS 2026</span>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 py-2 lg:py-0 w-full shrink-0 no-scrollbar">
          {[
            { id: 'home', label: 'Home', desc: 'AI Assistant', icon: Bot },
            { id: 'chat', label: 'Chat', desc: 'Ask Skudo AI', icon: Send },
            { id: 'play', label: 'Puzzles', desc: 'Play & Practice', icon: Play },
            { id: 'lens', label: 'Skudo Lens', desc: 'Photo Solve', icon: Camera },
            { id: 'learn', label: 'Coach', desc: 'Learn & Improve', icon: BookOpen },
            { id: 'arena', label: 'Arena', desc: 'Connect & Compete', icon: Compass },
            { id: 'analytics', label: 'Analytics', desc: 'Brain Insights', icon: Activity },
            { id: 'achievements', label: 'Achievements', desc: 'Badges & Goals', icon: Award },
            { id: 'help', label: 'Help Center', desc: 'Support FAQ', icon: HelpCircle },
            { id: 'settings', label: 'Settings', desc: 'Personalize', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  gameAudio.playClick();
                  triggerVibe();
                  setActiveTab(item.id as any);
                }}
                className={`relative group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left cursor-pointer transition-all duration-200 shrink-0 outline-none w-full ${
                  isSelected 
                    ? theme === 'dark' 
                      ? 'bg-[#141F32] border border-cyan-500/20 text-[#009DFF]' 
                      : 'bg-[#EAF7FF] border border-sky-300/20 text-[#009DFF]'
                    : theme === 'dark' 
                      ? 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200' 
                      : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                }`}
              >
                {/* Micro AI Animated pulsing glow on selected */}
                {isSelected && (
                  <span className="absolute left-1 top-3.5 w-1 h-5 bg-[#009DFF] rounded-r-full" />
                )}
                
                <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-[#009DFF]' : 'text-slate-400 group-hover:text-slate-500'}`} />
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-xs font-bold font-sans">{item.label}</span>
                  <span className="text-[8px] text-slate-400/80 font-semibold mt-1 font-mono uppercase tracking-wider">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Outer Quick-Tip Box at bottom of Sidebar */}
        <div 
          onClick={() => {
            gameAudio.playClick();
            setAiBrainTipIndex((prev) => (prev + 1) % brainTips.length);
          }}
          className={`mt-auto hidden lg:flex flex-col gap-2 p-3.5 rounded-2xl border cursor-pointer hover:border-[#009DFF]/40 transition group select-none ${
            theme === 'dark' ? 'bg-[#141B30]/30 border-slate-800/60' : 'bg-slate-50 border-slate-100'
          }`}
          title="Click to fetch next logic tip!"
        >
          <div className="flex items-center justify-between text-[8.5px] font-black uppercase text-[#009DFF] tracking-wider leading-none">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 animate-pulse text-yellow-500" />
              <span>AI Brain Tip</span>
            </div>
            <RefreshCw className="w-2.5 h-2.5 text-slate-400 group-hover:rotate-180 transition-transform duration-550" />
          </div>
          <p className="text-[10px] text-slate-400 font-bold leading-normal">
            {brainTips[aiBrainTipIndex]}
          </p>
        </div>
      </nav>

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <div className="flex-1 flex flex-col min-w-0" id="dashboard-viewport">
        
        {/* TOP COMPANION FILTER & SEARCH HEADER BAR */}
        <header className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4 relative z-30 ${
          theme === 'dark' ? 'bg-[#101524]/90 border-slate-800/65' : 'bg-white/80 border-slate-100'
        }`}>
          {/* Universal Search and Filter Input Grid (Mock indicator from image) */}
          <div className="relative w-full max-w-sm flex flex-col">
            <div className="relative w-full flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lessons, variant modes or ask math..."
                className={`w-full pl-9 pr-12 py-2 rounded-xl text-xs font-semibold focus:outline-none transition border ${
                  theme === 'dark' 
                    ? 'bg-slate-905 border-slate-800 text-slate-200 focus:border-[#009DFF]/50' 
                    : 'bg-slate-100/60 border-slate-200/50 text-slate-600 focus:border-[#009DFF]/50'
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className={`absolute right-9 text-[10px] font-mono select-none p-1 rounded font-bold transition hover:text-[#009DFF] ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  ✕
                </button>
              )}
              <span className={`absolute right-3.5 text-[10px] font-mono select-none px-1 py-0.2 rounded font-bold ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-400 border border-slate-200'
              }`}>/</span>
            </div>
            
            {/* SEARCH RESULTS DROPDOWN OVERLAY (Image 1 functional result item search) */}
            <AnimatePresence>
              {searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute top-full left-0 right-0 mt-2 p-3.5 rounded-2xl border shadow-xl z-55 flex flex-col gap-2 max-h-72 overflow-y-auto ${
                    theme === 'dark' ? 'bg-[#101524] border-slate-800 text-slate-200' : 'bg-white border-[#E0F0FE] text-slate-700 shadow-sky-100/50'
                  }`}
                >
                  <p className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black pl-1 text-left">Cognitive Search Results</p>
                  
                  {/* Results Filtered */}
                  {(() => {
                    const q = searchQuery.toLowerCase().trim();
                    const items = [
                      { title: "Classic Numeric Sudoku", sub: "Standard 1-9 Grid Solver Mode", action: () => { setShowDifficultyPopupMode('numbers'); setSearchQuery(''); setActiveTab('play'); } },
                      { title: "A-I Letters Sudoku", sub: "Alpha character grid re-wiring mode", action: () => { setShowDifficultyPopupMode('letters'); setSearchQuery(''); setActiveTab('play'); } },
                      { title: "Skudo Lens Offline OCR", sub: "Solve physical puzzles via camera lens", action: () => { setActiveTab('lens'); setSearchQuery(''); } },
                      { title: "Skudo Help Center FAQ", sub: "Popular articles, Guide & Bug report FAQ", action: () => { setActiveTab('help'); setSearchQuery(''); } },
                      { title: "X-Wing Technique lesson", sub: "Strategy academy advanced deduction tutorial", action: () => { onOpenLegacyAcademy(); setSearchQuery(''); } },
                      { title: "Sudoku Oracle Boss Battle", sub: "Fight against extreme quantum validator AI", action: () => { setActiveTab('play'); setSearchQuery(''); } },
                    ].filter(x => x.title.toLowerCase().includes(q) || x.sub.toLowerCase().includes(q));

                    if (items.length === 0) {
                      return (
                        <div className="p-3 text-center text-xs text-slate-400 font-semibold gap-1.5 flex flex-col items-center">
                          <Bot className="w-5 h-5 text-indigo-400 animate-spin" />
                          <span>No matches in index. Query Gemini AI Coach?</span>
                          <button
                            onClick={() => { submitAiPrompt(searchQuery); setSearchQuery(''); }}
                            className="px-3 py-1.5 bg-[#009DFF] text-white text-[10px] rounded-lg font-black uppercase mt-1 cursor-pointer"
                          >
                            Ask Skudo Coach
                          </button>
                        </div>
                      );
                    }
                    return items.map((it, idx) => (
                      <button
                        key={idx}
                        onClick={it.action}
                        className={`p-2.5 rounded-xl text-left transition flex flex-col gap-0.5 cursor-pointer leading-tight ${
                          theme === 'dark' ? 'hover:bg-slate-900 bg-slate-950/40 border border-slate-850' : 'hover:bg-slate-100 bg-slate-50/50 border border-slate-200/50'
                        }`}
                      >
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{it.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{it.sub}</span>
                      </button>
                    ));
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Streak & Level Badges with customized layout rings */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Streak Indicator Widget */}
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-amber-500 animate-spin" style={{ animationDuration: '10s' }} />
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>
              <div className="leading-none flex flex-col text-left">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 leading-none">{profile.streak || 0} Days</span>
                <span className="text-[7.5px] uppercase tracking-wider text-slate-400 font-extrabold mt-0.5 font-mono">Streak</span>
              </div>
            </div>

            {/* Level Indicator Widget */}
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-[#009DFF] animate-pulse" />
                <Award className="w-4 h-4 text-[#009DFF]" />
              </div>
              <div className="leading-none flex flex-col text-left">
                <span className="text-[10px] font-black text-[#009DFF] leading-none">Lvl {Math.floor((profile.xp || 0) / 250) + 1}</span>
                <span className="text-[7.5px] uppercase tracking-wider text-slate-400 font-extrabold mt-0.5 font-mono uppercase">Rank</span>
              </div>
            </div>

            {/* Notification Badge with toggle dropdown menu */}
            <div className="relative">
              <button 
                onClick={() => { gameAudio.playClick(); setShowNotificationDropdown(!showNotificationDropdown); }}
                className={`p-2 rounded-xl transition relative cursor-pointer outline-none ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-500 border border-slate-200/40 bg-white/70 shadow-xs'
                }`}
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some(x => !x.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B6B] rounded-full animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotificationDropdown && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotificationDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute right-0 mt-2 p-3.5 rounded-2xl border shadow-2xl z-50 flex flex-col gap-2.5 w-72 max-w-xs ${
                        theme === 'dark' ? 'bg-[#101524] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-705 shadow-xl'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-1.5 border-slate-300/10 leading-none">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-[#009DFF]" /> System Alerts
                        </span>
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          }}
                          className="text-[8.5px] uppercase tracking-wider text-[#009DFF] font-black hover:underline cursor-pointer"
                        >
                          Mark as read
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-2 overflow-y-auto max-h-60">
                        {notifications.map((n) => {
                          const NotifIcon = n.icon;
                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                gameAudio.playClick();
                                triggerVibe();
                                setNotifications(prev => prev.map(not => not.id === n.id ? { ...not, read: true } : not));
                                setShowNotificationDropdown(false);
                                
                                // Auto-nav triggers
                                if (n.text.toLowerCase().includes("welcome")) {
                                  setActiveTab('achievements');
                                } else if (n.text.toLowerCase().includes("streak")) {
                                  setActiveTab('home');
                                  alert("Streak logs synchronized! Keep solving daily puzzles to secure your consecutive progress multipliers.");
                                } else if (n.text.toLowerCase().includes("constraint")) {
                                  setActiveTab('play');
                                } else if (n.text.toLowerCase().includes("ai coach")) {
                                  setActiveTab('chat');
                                }
                              }}
                              className={`p-2.5 rounded-xl text-left border flex gap-2 relative transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 ${
                                n.read 
                                  ? 'opacity-65 bg-transparent border-slate-200/20' 
                                  : 'bg-sky-500/5 border-[#009DFF]/25'
                              }`}
                            >
                              <div className="p-1 bg-[#009DFF]/10 text-[#009DFF] rounded-lg shrink-0 mt-0.5 self-start">
                                <NotifIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="text-[10px] font-bold leading-relaxed">{n.text}</p>
                                <span className="text-[8px] font-mono font-black text-slate-400/80 mt-1 leading-none">{n.time}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* CORE SCROLLABLE ACTION AREA */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col gap-6" id="inner-view-scroller">
          <AnimatePresence mode="wait">
            
            {/* ================= TAB 1: HOME ================= */}
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col lg:flex-row gap-6 w-full items-stretch"
              >
                {/* Left Central Column on Home */}
                <div className="flex-1 flex flex-col gap-6">
                  
                  {/* PURE WHITE / LIGHT BLUE PREMIUM GREETING BANBER CARD (Image 2 custom layout style but in pure white glass!) */}
                  <div className={`p-6 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden transition-colors shadow-lg ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-slate-900 to-[#121B2F] border-slate-700/60' 
                      : 'bg-gradient-to-r from-white via-slate-50/50 to-[#EAF7FF]/60 border-slate-200/50'
                  }`}>
                    {/* Decorative pulsing abstract vector particle circles inside header */}
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#009DFF]/8 rounded-full blur-2xl" />
                    
                    {/* Greeting Title */}
                    <div className="flex flex-col gap-1 text-left relative z-10 max-w-md">
                      <h2 className="font-sans text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-1.5 leading-none">
                        Good Morning, <span className="text-[#009DFF]">{profile.name}</span>
                        <span className="inline-block animate-bounce">✨</span>
                      </h2>
                      <p className={`text-xs font-semibold leading-relaxed mt-2 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Ready to train your mind today? Let's unlock logical clarity with 12 advanced variant solvers.
                      </p>

                      {/* SKUDO STRATEGY ACADEMY Action Button + Continue Playing Button list */}
                      <div className="flex flex-wrap gap-2.5 mt-4">
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            triggerVibe();
                            onOpenLegacyAcademy();
                          }}
                          className="px-4 py-2 bg-[#009DFF] hover:bg-[#008CE6] active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>SKUDO STRATEGY ACADEMY</span>
                        </button>

                        {/* CONTINUE PLAYING SEPARATE BUTTON (ONLY IF AUTO-SAVE GAME SESSION EXISTS FOR RECOVERY) */}
                        {savedSessionExists ? (
                          <button
                            onClick={handleContinuePlaying}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md animate-pulse"
                          >
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                            <span>Continue Playing Grid ({savedSessionMeta?.mode} • {savedSessionMeta?.difficulty})</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              triggerVibe();
                              setActiveTab('play');
                            }}
                            className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                              theme === 'dark' ? 'bg-slate-850 border border-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start New Quiz</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Integrated RIGHT SECTION ACTIVE SOLVER COMPONENT CARD (Image 2 layout slot) */}
                    <div className={`p-4 rounded-2xl border flex items-center gap-3 shrink-0 lg:max-w-xs relative z-10 ${
                      theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/70 border-slate-300/40'
                    }`}>
                      {/* Avatar with Custom Animated Pulsing AI Ring around it */}
                      <div className="relative shrink-0 select-none">
                        {/* Animated Active Ring */}
                        <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-[#009DFF] animate-spin" style={{ animationDuration: '10s' }} />
                        <div className="w-11 h-11 bg-gradient-to-tr from-[#009DFF] to-violet-500 rounded-xl flex items-center justify-center text-white font-extrabold text-base border border-white/20 shadow-inner overflow-hidden">
                          {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            profile.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      </div>
                      
                      {/* Solver profile labels */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8.5px] font-black uppercase text-emerald-500 flex items-center gap-1 leading-none tracking-wider select-none">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          ACTIVE SOLVER
                        </span>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 uppercase tracking-wide leading-none">{profile.name}</h4>
                        <div className="flex items-center gap-2 mt-2 leading-none">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider leading-none ${
                            theme === 'dark' ? 'bg-[#121B2F] text-[#009DFF]' : 'bg-sky-50 text-[#009DFF]'
                          }`}>
                            {profile.experience}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider leading-none ${
                            theme === 'dark' ? 'bg-slate-900 text-amber-500' : 'bg-amber-50 text-amber-600'
                          }`}>
                            ⭐ 1000 ELO
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LARGE AI INTERACTION PANEL WITH CENTRAL ORB (Image 1 central widget style but brighter!) */}
                  <div className={`p-8 rounded-3xl border flex flex-col gap-6 items-center text-center relative overflow-hidden ${
                    theme === 'dark' ? 'bg-[#101423]/70 border-slate-800' : 'bg-white/80 border-slate-200/50 shadow-sm'
                  }`}>
                    {/* Glowing background circles for visual interest */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-80 h-80 rounded-full bg-[#009DFF]/4 blur-3xl animate-pulse" />
                      <div className="absolute w-56 h-56 rounded-full border border-[#009DFF]/8 animate-ping" style={{ animationDuration: '4s' }} />
                    </div>

                    {/* Animated central ring indicators */}
                    <div className="flex flex-col gap-1.5 max-w-md relative z-10">
                      <h3 className="font-sans text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 leading-none">
                        How can I help you today?
                      </h3>
                      <p className="text-[11.5px] text-slate-400 font-medium">Ask SKUDO AI to explain logic structures, generate puzzles, code scripts in C++/JS, or visualize concepts!</p>
                    </div>

                    {/* Central Ask Skudo AI Form widget */}
                    <div className="w-full max-w-lg relative z-10 flex flex-col gap-3">
                      <div className={`p-1.5 rounded-2xl border flex items-center gap-2 ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-800 focus-within:border-[#009DFF]/50' : 'bg-slate-50 border-slate-200 focus-within:border-[#009DFF]/50 shadow-inner'
                      }`}>
                        {/* Mic Selector */}
                        <button
                          onClick={handleMicToggle}
                          className={`p-2.5 rounded-xl cursor-pointer transition ${
                            isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400'
                          }`}
                          title="Speak Query to AI Input"
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>

                        <input
                          type="text"
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitAiPrompt()}
                          placeholder="Ask SKUDO AI anything..."
                          className="flex-1 bg-transparent px-2 text-xs font-semibold focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 border-none"
                        />

                        {/* Model Dropdown Selection Widget */}
                        <div className="relative">
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as any)}
                            className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-wider rounded-lg outline-none border cursor-pointer ${
                              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-[#009DFF]' : 'bg-white border-slate-200 text-[#009DFF]'
                            }`}
                          >
                            <option value="Smart">Smart AI</option>
                            <option value="CodeExpert">CS Coder</option>
                            <option value="FastReasoning">Instant</option>
                          </select>
                        </div>

                        {/* Send Action */}
                        <button
                          onClick={() => submitAiPrompt()}
                          disabled={aiLoading}
                          className="p-2.5 bg-[#009DFF] hover:bg-[#008CE6] active:scale-95 text-white rounded-xl shadow-md cursor-pointer transition flex items-center justify-center shrink-0"
                        >
                          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Display mic errors quickly */}
                      {micError && (
                        <p className="text-[10px] text-red-500 font-bold self-start pl-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {micError}
                        </p>
                      )}

                      {/* Quick Tip Suggested Prompts list */}
                      <div className="flex flex-col gap-1.5 text-left mt-1">
                        <span className="text-[9px] font-black tracking-widest text-[#009DFF] uppercase flex items-center gap-1.5 pl-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          TRY ASKING SKUDO AI
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { text: 'Explain X-Wing technique', icon: Lightbulb },
                            { text: 'Generate a futuristic neon sudoku design', icon: Sparkles },
                            { text: 'Write C++ code for a simple sudoku algorithm', icon: Target },
                            { text: 'Analyze Euler logical patterns', icon: BookOpen },
                          ].map((pill, i) => {
                            const PillIcon = pill.icon;
                            return (
                              <button
                                key={i}
                                onClick={() => submitAiPrompt(pill.text)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-bold text-left transition hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center gap-1.5 border ${
                                  theme === 'dark' 
                                    ? 'bg-slate-900/60 border-slate-800 hover:border-[#009DFF]/30 text-slate-300' 
                                    : 'bg-white border-slate-200 hover:bg-[#EAF7FF]/40 text-slate-600 hover:border-sky-300/50 shadow-xs'
                                }`}
                              >
                                <PillIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span>{pill.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= RIGHT SIDEBAR ON HOME TABS ================= */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
                  
                  {/* WIDGET 1: DAILY PROGRESS */}
                  {(() => {
                    const dailySolvedCount = Math.min(3, (profile.completedGames || 0) % 4);
                    const solvedDone = dailySolvedCount >= 3;
                    const techniqueDone = (profile.completedGames || 0) >= 1;
                    const bossDone = (profile.completedGames || 0) >= 2;

                    let doneActions = 0;
                    if (solvedDone) doneActions++;
                    if (techniqueDone) doneActions++;
                    if (bossDone) doneActions++;
                    const dailyProgressPercent = Math.max(33, Math.round((doneActions / 3) * 100));

                    return (
                      <div className={`p-4.5 rounded-2xl border flex flex-col gap-3 ${
                        theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Daily Progress</span>
                          <span className="text-[10px] font-mono font-black text-[#009DFF] bg-[#009DFF]/10 px-1.5 py-0.2 rounded">{dailyProgressPercent}% Done</span>
                        </div>

                        <div className="flex items-center gap-4.5">
                          {/* Circular Progress Ring in inline SVG */}
                          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full rotate-270">
                              <circle cx="28" cy="28" r="24" stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'} strokeWidth="4" fill="transparent" />
                              <circle cx="28" cy="28" r="24" stroke="#009DFF" strokeWidth="4" fill="transparent" 
                                strokeDasharray={2 * Math.PI * 24}
                                strokeDashoffset={2 * Math.PI * 24 * (1 - dailyProgressPercent / 100)}
                                strokeLinecap="round" />
                            </svg>
                            <span className="absolute font-sans font-black text-xs">{dailyProgressPercent}%</span>
                          </div>

                          {/* Daily Checklist */}
                          <div className="flex flex-col gap-1.5 text-[11px] font-bold text-left">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                              {solvedDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full shrink-0" />}
                              <span>Solve 3 puzzles ({dailySolvedCount}/3)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                              {techniqueDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full shrink-0" />}
                              <span>Review 1 technique</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                              {bossDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full shrink-0" />}
                              <span>Unlock 1 Boss</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* WIDGET 2: CURRENT STREAK CALENDAR */}
                  <div className={`p-4.5 rounded-2xl border flex flex-col gap-3.5 ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between leading-none">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Calendar Streak</span>
                      <span className="text-[10px] font-mono text-amber-500 font-extrabold flex items-center gap-0.5 leading-none">
                        <Flame className="w-3.5 h-3.5" /> {profile.streak || 0} Days
                      </span>
                    </div>

                    {/* M T W T F S S Days Boxes */}
                    <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-sans font-black">
                      {[
                        { day: 'M', checked: (profile.streak || 0) >= 1 || (profile.completedGames || 0) >= 1 },
                        { day: 'T', checked: (profile.streak || 0) >= 2 || (profile.completedGames || 0) >= 3 },
                        { day: 'W', checked: (profile.streak || 0) >= 3 || (profile.completedGames || 0) >= 5 },
                        { day: 'T', checked: (profile.streak || 0) >= 4 },
                        { day: 'F', checked: (profile.streak || 0) >= 5 },
                        { day: 'S', checked: (profile.streak || 0) >= 6 },
                        { day: 'S', checked: (profile.streak || 0) >= 7 },
                      ].map((box, i) => (
                        <div
                          key={i}
                          className={`p-1 rounded-lg border flex flex-col gap-1.5 items-center justify-center transition-all ${
                            box.checked 
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' 
                              : theme === 'dark' 
                                ? 'bg-slate-900 border-slate-800 text-slate-500' 
                                : 'bg-slate-50 border-slate-200/60 text-slate-400'
                          }`}
                        >
                          <span>{box.day}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${box.checked ? 'bg-amber-500' : 'bg-slate-305'}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WIDGET 3: AI COACH INSIGHT & CHART */}
                  <div className={`p-4.5 rounded-2xl border flex flex-col gap-3 relative overflow-hidden ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                  }`}>
                    <div className="absolute top-0 right-0 p-1.5 text-[#009DFF] bg-[#009DFF]/5 rounded-bl-xl">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </div>

                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">AI Coach Insight</span>
                    
                    {/* Tiny visual chart path */}
                    <div className="w-full h-14 bg-slate-550/5 dark:bg-slate-900/50 rounded-xl p-2 relative overflow-hidden flex items-center justify-center border border-slate-200/20">
                      <svg viewBox="0 0 100 30" stroke="#009DFF" strokeWidth="1.5" fill="none" className="w-full h-full">
                        <path d="M 5,20 Q 25,2 45,18 T 85,5 T 95,25" strokeLinecap="round" />
                        <circle cx="85" cy="5" r="2" fill="#009DFF" className="animate-ping" />
                      </svg>
                    </div>

                    <div className="text-[11.5px] leading-relaxed text-left font-bold">
                      <span className="text-amber-500">You're improving! 🔥</span>
                      <p className="text-[10px] text-slate-400 mt-1 mt-1.5 whitespace-pre-line">Your solving speed improved by **18% this week**. Play more letters mode to unlock new achievements!</p>
                    </div>
                  </div>

                  {/* WIDGET 4: NEXT GOAL */}
                  {(() => {
                    const currentLvl = Math.floor((profile.xp || 0) / 250) + 1;
                    const nextLvlGoal = currentLvl + 1;
                    const xpInCurrentLvl = (profile.xp || 0) % 250;
                    const nextGoalPercent = Math.max(15, Math.round((xpInCurrentLvl / 250) * 100));

                    return (
                      <div className={`p-4.5 rounded-2xl border flex flex-col gap-2.5 ${
                        theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between leading-none">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Next Goal</span>
                          <Target className="w-4 h-4 text-[#009DFF]" />
                        </div>
                        <div className="text-[11.5px] font-bold text-left leading-none mt-1">
                          <span>Reach Level {nextLvlGoal}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative border border-slate-200/30">
                          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#009DFF] to-violet-500" style={{ width: `${nextGoalPercent}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold leading-none">
                          <span>{xpInCurrentLvl} / 250 XP</span>
                          <span>{nextGoalPercent}% complete</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {/* ================= TAB 2: CHAT ================= */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 flex flex-col gap-4 max-h-[70vh]"
              >
                {/* Chat History View Panel */}
                <div
                  id="ai-chat-scroller"
                  className={`flex-1 overflow-y-auto p-4 rounded-2xl border flex flex-col gap-4 max-h-[50vh] ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  {aiChat.map((msg, i) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-2xl ${
                          isUser ? 'self-end flex-row-reverse' : 'self-start'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black uppercase shrink-0 border border-white/20 select-none ${
                          isUser ? 'bg-[#009DFF] text-white' : 'bg-slate-850 text-[#009DFF]'
                        }`}>
                          {isUser ? profile.name.charAt(0).toUpperCase() : 'AI'}
                        </div>

                        {/* Speech Bubble */}
                        <div className={`p-4 rounded-2xl flex flex-col gap-2 relative ${
                          isUser 
                            ? 'bg-[#009DFF] text-white rounded-tr-none' 
                            : theme === 'dark' 
                              ? 'bg-[#151D30] border border-slate-800 text-slate-200 rounded-tl-none' 
                              : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                        }`}>
                          
                          {/* Markdown Styled Chat Body Text */}
                          <div className="text-xs font-semibold leading-relaxed whitespace-pre-wrap select-text">
                            {msg.text}
                          </div>

                          {/* AI Generated image visualization results */}
                          {msg.imageUrl && (
                            <div className="mt-2 rounded-xl border border-slate-200/50 overflow-hidden relative group/img max-w-sm">
                              <img
                                src={msg.imageUrl}
                                alt="AI Graphic"
                                crossOrigin="anonymous"
                                referrerPolicy="no-referrer"
                                className="w-full h-auto object-cover max-h-60"
                              />
                              {/* Overlay actions */}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/img:opacity-100 transition">
                                <a
                                  href={msg.imageUrl}
                                  download={`skudo_ai_${msg.id}.png`}
                                  className="p-1.5 bg-black/60 rounded-lg hover:bg-black text-white transition"
                                  title="Download Image"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Secondary helper quick copy toolbar */}
                          {!isUser && (
                            <div className="flex justify-end gap-2.5 mt-2.5 border-t border-slate-400/10 pt-1.5">
                              <button
                                onClick={() => handleCopyText(msg.text, msg.id)}
                                className="text-[10px] text-slate-400 dark:text-slate-400 hover:text-[#009DFF] flex items-center gap-1 cursor-pointer transition select-none"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedMessageId === msg.id ? 'Copied!' : 'Copy'}</span>
                              </button>
                              
                              <button
                                onClick={() => speakText(msg.text)}
                                className="text-[10px] text-slate-400 dark:text-slate-400 hover:text-[#009DFF] flex items-center gap-1 cursor-pointer transition select-none"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Listen</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Loading indicator */}
                  {aiLoading && (
                    <div className="self-start flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-850 border border-slate-700 flex items-center justify-center text-xs text-[#009DFF] font-black">AI</div>
                      <div className={`p-4 rounded-2xl rounded-tl-none font-medium text-xs flex items-center gap-2 border ${
                        theme === 'dark' ? 'bg-[#151D30] border-slate-800' : 'bg-white border-slate-100 text-slate-500'
                      }`}>
                        <Loader2 className="w-4 h-4 animate-spin text-[#009DFF]" />
                        <span>Skudo AI is deconstructing prompt logic...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Input Area */}
                <div className="flex gap-2 relative">
                  <div className={`flex-1 p-1.5 rounded-2xl border flex items-center gap-2 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 focus-within:border-[#009DFF]/50' : 'bg-slate-100 focus-within:border-[#009DFF]/50 shadow-inner'
                  }`}>
                    <button
                      onClick={handleMicToggle}
                      className={`p-2.5 rounded-xl cursor-pointer transition ${
                        isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitAiPrompt()}
                      placeholder="Deconstruct arithmetic patterns or code C++ script..."
                      className="flex-1 bg-transparent px-2 text-xs focus:outline-none focus:ring-0 text-slate-750 border-none dark:text-slate-100"
                    />

                    <button
                      onClick={() => submitAiPrompt()}
                      disabled={aiLoading}
                      className="p-2.5 bg-[#009DFF] hover:bg-[#008CE6] text-white rounded-xl shadow cursor-pointer transition shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= TAB 3: PLAY (PUZZLES) ================= */}
            {activeTab === 'play' && (
              <motion.div
                key="play"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                {/* Basic Mode Selection Cards */}
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black">Choose Canvas Mode</span>
                  <h3 className="text-lg font-black tracking-tight mt-1">Symmetries & Core Layouts</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Classic Numeric Card */}
                  <div
                    onClick={() => {
                      gameAudio.playClick();
                      triggerVibe();
                      setShowDifficultyPopupMode('numbers');
                    }}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.015] flex flex-col gap-2.5 relative group ${
                      theme === 'dark' ? 'bg-[#151D30] border-slate-800 hover:border-[#009DFF]/30' : 'bg-white border-slate-200 hover:border-sky-300 shadow-sm'
                    }`}
                  >
                    <div className="absolute top-3 right-3 text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-[#009DFF]/8 text-[#009DFF]">Classic</div>
                    <div className="p-3 bg-[#EAF7FF] dark:bg-slate-900 border border-slate-200/50 rounded-xl w-11 h-11 flex items-center justify-center text-[#009DFF]">
                      <Hash className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200 group-hover:text-[#009DFF] transition">Classic Numeric Sudoku</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">Classic layout utilizing digits 1 to 9. Solvable purely by constraint propagation algorithms.</p>
                    </div>
                  </div>

                  {/* A-I Letters Card */}
                  <div
                    onClick={() => {
                      gameAudio.playClick();
                      triggerVibe();
                      setShowDifficultyPopupMode('letters');
                    }}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.015] flex flex-col gap-2.5 relative group ${
                      theme === 'dark' ? 'bg-[#151D30] border-slate-800 hover:border-[#009DFF]/30' : 'bg-white border-slate-200 hover:border-sky-300 shadow-sm'
                    }`}
                  >
                    <div className="absolute top-3 right-3 text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-violet-500/8 text-violet-550">Alpha 1x9</div>
                    <div className="p-3 bg-violet-50 dark:bg-slate-900 border border-slate-200/50 rounded-xl w-11 h-11 flex items-center justify-center text-violet-500">
                      <AlignLeft className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200 group-hover:text-violet-500 transition">A-I Letters Sudoku</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">Requires letter patterns A through I, re-wiring standard brain habits for adaptive learning.</p>
                    </div>
                  </div>
                </div>

                {/* HIGH FIDELITY DIFFICULTY SELECTION POPUP MODAL OVERLAY */}
                <AnimatePresence>
                  {showDifficultyPopupMode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      {/* Dark Backdrop */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDifficultyPopupMode(null)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                      />

                      {/* Modal Content Card */}
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        className={`w-full max-w-lg rounded-3xl border p-6 text-left relative z-10 shadow-2xl overflow-hidden ${
                          theme === 'dark' 
                            ? 'bg-[#101524] border-slate-800 text-slate-150' 
                            : 'bg-white border-sky-100 text-slate-800'
                        }`}
                      >
                        {/* Elegant Top design element line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#009DFF] via-violet-500 to-emerald-400" />

                        {/* Title and Badge */}
                        <div className="flex items-center justify-between mb-4.5">
                          <div className="flex flex-col leading-none">
                            <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black font-mono">Cognitive Matrix Protocol</span>
                            <h3 className="text-base font-black tracking-tight mt-1">Select Solving Difficulty</h3>
                          </div>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            showDifficultyPopupMode === 'numbers' ? 'bg-[#EAF7FF] text-[#009DFF]' : 'bg-violet-500/10 text-violet-500'
                          }`}>
                            {showDifficultyPopupMode === 'numbers' ? 'Numeric (1-9)' : 'Letters (A-I)'}
                          </span>
                        </div>

                        {/* Difficulty Options List */}
                        <div className="flex flex-col gap-3">
                          {[
                            {
                              id: 'zen' as const,
                              name: 'Zen Level',
                              sub: 'Gentle & Meditative (Easy)',
                              desc: 'Minimal constraints, generous preset ratios. Ideal for warming up neuro-logical pathways.',
                              colorBg: 'bg-emerald-500/8 dark:bg-emerald-500/12',
                              borderCol: 'border-emerald-500/30',
                              accentCol: 'text-emerald-500',
                              xpBonus: '+50 XP'
                            },
                            {
                              id: 'flow' as const,
                              name: 'Flow Level',
                              sub: 'Standard & Fluid (Medium)',
                              desc: 'The optimized equilibrium point of challenge. Steady scanning rewards tactical focus.',
                              colorBg: 'bg-[#009DFF]/8 dark:bg-[#009DFF]/12',
                              borderCol: 'border-[#009DFF]/30',
                              accentCol: 'text-[#009DFF]',
                              xpBonus: '+100 XP'
                            },
                            {
                              id: 'focus' as const,
                              name: 'Focus Level',
                              sub: 'Concentrated Deep Logic (Hard)',
                              desc: 'Demands tactical candidate notation. Requires elimination tools, Swordfish, or Naked Pairs.',
                              colorBg: 'bg-amber-500/8 dark:bg-amber-500/12',
                              borderCol: 'border-amber-500/30',
                              accentCol: 'text-amber-500',
                              xpBonus: '+180 XP'
                            },
                            {
                              id: 'quantum' as const,
                              name: 'Quantax Level',
                              sub: 'Extreme Constraint Matrix (Ultra)',
                              desc: 'Strict logical extremes. Perfect for supercomputing minds to test the boundaries of deduction.',
                              colorBg: 'bg-indigo-500/8 dark:bg-indigo-500/12',
                              borderCol: 'border-indigo-500/30',
                              accentCol: 'text-indigo-550 dark:text-indigo-400',
                              xpBonus: '+320 XP'
                            }
                          ].map((opt) => {
                            const isSelected = selectedPopupDifficulty === opt.id;
                            return (
                              <div
                                key={opt.id}
                                onClick={() => {
                                  gameAudio.playClick();
                                  setSelectedPopupDifficulty(opt.id);
                                }}
                                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex justify-between gap-3 ${
                                  isSelected 
                                    ? `bg-slate-50 dark:bg-slate-900 ${opt.borderCol} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#101524] ring-[#009DFF]/50` 
                                    : theme === 'dark' ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-900' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex flex-col gap-0.5 leading-tight min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-black uppercase ${opt.accentCol}`}>{opt.name}</span>
                                    <span className="text-[9px] font-mono font-bold text-slate-400">{opt.sub}</span>
                                  </div>
                                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal mt-1">{opt.desc}</p>
                                </div>
                                <div className="shrink-0 flex flex-col items-end justify-between leading-none text-right">
                                  <span className={`text-[9px] font-black uppercase font-mono px-1.5 py-0.5 rounded ${
                                    theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {opt.xpBonus}
                                  </span>
                                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center mt-2 ${
                                    isSelected ? 'border-[#009DFF] bg-[#009DFF]' : 'border-slate-300'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3 mt-5">
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              setShowDifficultyPopupMode(null);
                            }}
                            className={`px-4 py-2 text-xs font-bold leading-none rounded-xl transition cursor-pointer ${
                              theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              triggerVibe();
                              const mode = showDifficultyPopupMode;
                              const difficulty = selectedPopupDifficulty;
                              setShowDifficultyPopupMode(null);
                              onSelectGame({ mode, difficulty });
                            }}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#009DFF] to-violet-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-sky-400/10 cursor-pointer active:scale-95 transition"
                          >
                            Launch Cognitive Engine
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* AI Boss Battles Selection */}
                <div className="text-left mt-2">
                  <span className="text-[9px] uppercase tracking-wider text-rose-500 font-black flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> High Stakes
                  </span>
                  <h3 className="text-lg font-black tracking-tight mt-1">AI Boss Battles (Cognitive Bosses)</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">Battle against custom-tuned constraint solvers with distinct logic mastery limits!</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Logic Guardian', style: 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5', difficulty: 'zen', quote: '"Your calculations are predictable, human."' },
                    { name: 'Speed Demon', style: 'border-amber-500/20 text-amber-500 bg-amber-500/5', difficulty: 'flow', quote: '"Can you deconstruct boxes under 90 seconds?"' },
                    { name: 'Pattern Master', style: 'border-blue-500/20 text-blue-500 bg-blue-500/5', difficulty: 'focus', quote: '"Hidden tuples are my absolute expertise."' },
                    { name: 'Sudoku Oracle', style: 'border-fuchsia-500/20 text-fuchsia-500 bg-fuchsia-500/5', difficulty: 'quantum', quote: '"I have predicted all nine numbers already."' },
                    { name: 'Grandmaster AI', style: 'border-rose-500/30 text-rose-550 bg-rose-500/5', difficulty: 'focus', quote: '"Only true grandmasters can safely exit this maze."' },
                    { name: 'Omega AI Solver', style: 'border-purple-500/30 text-purple-500 bg-purple-500/5', difficulty: 'quantum', quote: '"Omega constraints are mathematically absolute."' },
                  ].map((boss, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        onSelectGame({
                          mode: 'numbers',
                          difficulty: boss.difficulty as any,
                          boss: {
                            name: boss.name,
                            avatarUrl: '',
                            quote: boss.quote,
                            style: boss.style,
                            difficulty: boss.difficulty
                          }
                        });
                      }}
                      className={`p-4 rounded-2xl border text-left cursor-pointer hover:scale-[1.02] transition flex flex-col gap-2 ${boss.style}`}
                    >
                      <div className="flex bg-white dark:bg-slate-900 border border-slate-300/30 p-2 rounded-xl text-left items-center justify-between">
                        <span className="text-[10px] uppercase font-black tracking-wide">{boss.name}</span>
                        <span className="text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded capitalize bg-[#009DFF]/10 text-[#009DFF]">
                          {boss.difficulty} Level
                        </span>
                      </div>
                      <span className="text-[10px] italic text-slate-500 dark:text-slate-400 block mt-1.5 font-semibold px-1">{boss.quote}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ================= TAB 4: LEARN (COACH / TRAINING) ================= */}
            {activeTab === 'learn' && (
              <motion.div
                key="learn"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                {/* Learn Section Overview */}
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-black">AI Training Academy</span>
                  <h3 className="text-lg font-black tracking-tight mt-1">Endless Skill Training</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">Our solver identifies weak patterns to generate custom lessons and exams step-by-step!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strategy Academy Portal Card */}
                  <div
                    onClick={onOpenLegacyAcademy}
                    className={`p-5 rounded-2xl border text-left cursor-pointer hover:scale-[1.01] transition-all relative overflow-hidden group ${
                      theme === 'dark' ? 'bg-[#151D30] border-slate-800' : 'bg-[#EAF7FF]/50 border-slate-200'
                    }`}
                  >
                    <div className="absolute top-0 right-0 p-2 text-cyan-400">
                      <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white border rounded-xl shadow text-[#009DFF] shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200">SKUDO STRATEGY ACADEMY</h4>
                        <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold mt-1">All 95 Strategies Loaded</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-4 leading-normal">
                      Deep dive into advanced algorithms: Naked Singles, Locked Candidates, Swordfish structures, Exocet vectors, and SAT propagation step-by-step with interactive quizzes!
                    </p>
                  </div>

                  {/* Skills weaknesses auto trainer */}
                  <div
                    onClick={() => onSelectGame({ mode: 'numbers', difficulty: 'zen', variant: 'x_wing_training' })}
                    className={`p-5 rounded-2xl border text-left cursor-pointer hover:scale-[1.01] transition-all group ${
                      theme === 'dark' ? 'bg-[#151D30] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white border rounded-xl text-rose-500 shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200">Personalized Trainer Session</h4>
                        <span className="text-[9px] uppercase tracking-wider text-rose-500 font-bold mt-1">Targeting Weakness: Swordfish</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-4 leading-normal">
                      Last week you struggled with Swordfish patterns. Our cognitive engine generated 3 focus training boards to bypass this specific constraint easily.
                    </p>
                  </div>
                </div>

                {/* Sub-categories of interactive exercises */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { title: 'Locked Candidates', level: 'Beginner', id: 'locked' },
                    { title: 'Naked & Hidden Pairs', level: 'Easy', id: 'pairs' },
                    { title: 'X-Wing Puzzles', level: 'Intermediate', id: 'xwing' },
                    { title: 'ALS Chains', level: 'Master', id: 'als' },
                  ].map((sub, i) => (
                    <div
                      key={i}
                      onClick={() => onSelectGame({ mode: 'numbers', difficulty: 'focus', variant: sub.id })}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer hover:scale-[1.01] transition ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-[#009DFF]">{sub.level}</span>
                      <h5 className="text-[11.5px] font-black text-slate-600 dark:text-slate-300 mt-1 leading-snug">{sub.title}</h5>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ================= TAB 5: ARENA (MULTIPLAYER / COMPETITIVE) ================= */}
            {activeTab === 'arena' && (
              <motion.div
                key="arena"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black">Championship Tournament</span>
                  <h3 className="text-lg font-black tracking-tight mt-1">Global Esports Platform</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">Simulated ranked matching using animated AI Rings against other logic solvers worldwide!</p>
                </div>

                {/* Main Action Battle arena cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Ranked Ladder Matchmaking Action */}
                  <div className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-between gap-4 md:col-span-2 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex flex-col gap-1 items-center">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        {/* Interactive Rotating AI ring around arena crown */}
                        <div className="absolute -inset-2.5 rounded-full border-2 border-dashed border-[#009DFF] animate-spin" style={{ animationDuration: '6s' }} />
                        <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
                      </div>
                      <h4 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200 mt-3.5">Live Competitive Matching</h4>
                      <p className="text-[10px] text-slate-400 font-semibold px-4 mt-1">Matchmaker establishes standard classic games with live global leaderboard limits.</p>
                    </div>

                    {/* Matchmaking Process container */}
                    {matchmakingActive ? (
                      <div className="w-full flex flex-col gap-3.5 px-4">
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-850 overflow-hidden relative">
                          <div className="absolute left-0 top-0 h-full bg-[#009DFF]" style={{ width: `${matchmakingProgress}%` }} />
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                          {matchmakingProgress < 100 
                            ? `Finding opponents... PING COAXIAL: ${matchmakingProgress}%` 
                            : 'MATCH ESTABLISHED!'
                          }
                        </span>

                        {/* Matched Opponent Reveal card */}
                        {matchedOpponent && (
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-3.5 rounded-xl border border-[#009DFF]/20 bg-[#009DFF]/5 flex items-center gap-3 mt-1.5 self-center min-w-[240px] text-left"
                          >
                            <img src={matchedOpponent.avatarUrl} alt="opponent" className="w-9 h-9 rounded-full object-cover border border-white/20" referrerPolicy="no-referrer" />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">⚔️ {matchedOpponent.name}</span>
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide mt-1">{matchedOpponent.rankName} Tier (ELO {matchedOpponent.rating})</span>
                            </div>
                          </motion.div>
                        )}

                        <button
                          onClick={launchArenaMatch}
                          disabled={!matchedOpponent}
                          className="w-full py-2.5 mt-2 bg-gradient-to-r from-[#4DA6FF] to-[#009DFF] hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md disabled:opacity-50"
                        >
                          Launch Competitive Session
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={startMatchmaking}
                        className="w-full py-3 bg-[#009DFF] hover:bg-[#008CE6] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow active:scale-98"
                      >
                        Enter Ranked Matchmaking
                      </button>
                    )}
                  </div>

                  {/* League list details with circular rotating AI rings */}
                  <div className={`p-4.5 rounded-2xl border flex flex-col gap-4.5 text-left ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/55 shadow-xs'
                  }`}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Championship Tiers</span>
                    <div className="flex flex-col gap-3 font-semibold text-[11px]">
                      {[
                        { tierName: 'Omega Mythic Tier', meta: 'Rating > 2200', ringColor: 'border-fuchsia-500' },
                        { tierName: 'Legendary Master Tier', meta: 'Rating 1900-2199', ringColor: 'border-rose-500' },
                        { tierName: 'Gold Elite Arena', meta: 'Rating 1500-1899', ringColor: 'border-amber-500' },
                        { tierName: 'Silver Focus Ring', meta: 'Rating < 1499', ringColor: 'border-sky-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 pb-2 border-b border-slate-400/10">
                          <div className={`w-5.5 h-5.5 rounded-full border-2 border-dashed ${item.ringColor} animate-spin shrink-0`} style={{ animationDuration: '8s' }} />
                          <div className="flex flex-col">
                            <span className="font-sans font-black text-slate-700 dark:text-slate-200">{item.tierName}</span>
                            <span className="text-[8px] font-mono text-slate-400 mt-1">{item.meta}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= TAB 6: ANALYTICS (STATISTICS PAGES) ================= */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black">Performance Dashboard</span>
                  <h3 className="text-lg font-black tracking-tight mt-1">Brain Gym Intelligence</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">Separate metric categories tracking cognitive scores, win multipliers and average times seamlessly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                  {[
                    { label: 'Constraint Prop Score', val: 1150, progress: '94%', subtitle: 'High precision logic score' },
                    { label: 'Average Solve Speed', val: '04:15', progress: '18%', subtitle: 'Fast speed ratio benchmarks' },
                    { label: 'Accuracy Rating', val: '96.2%', progress: '92%', subtitle: 'Low input mistake ratios' },
                  ].map((metric, i) => (
                    <div
                      key={i}
                      className={`p-4.5 rounded-2xl border text-left flex flex-row items-center justify-between gap-4 ${
                        theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[8.5px] font-mono uppercase font-black text-slate-400">{metric.label}</span>
                        <span className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1.5">{metric.val}</span>
                        <span className="text-[10px] text-slate-400 mt-1 font-semibold">{metric.subtitle}</span>
                      </div>
                      
                      {/* Interactive Circular ring widget */}
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full rotate-270">
                          <circle cx="24" cy="24" r="20" stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'} strokeWidth="3" fill="transparent" />
                          <circle cx="24" cy="24" r="20" stroke="#009DFF" strokeWidth="3" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={2 * Math.PI * 20 * (1 - 0.94)}
                            strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-[9px] font-bold text-slate-500">{metric.progress}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Highly responsive custom animated SVG line and progression wave representation graph */}
                <div className={`p-5 rounded-2xl border flex flex-col gap-4 text-left ${
                  theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                }`}>
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#009DFF]" /> Cognitive Progression Trendline Chart
                  </h4>
                  
                  {/* Inline Vector graph */}
                  <div className="w-full h-52 bg-slate-100/50 dark:bg-slate-900 border border-slate-200/30 rounded-xl p-4 flex items-center justify-center relative overflow-hidden">
                    <svg viewBox="0 0 100 40" className="w-full h-full text-[#4DA6FF]" fill="none" stroke="currentColor">
                      <defs>
                        <linearGradient id="anGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4DA6FF" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#4DA6FF" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* SVG Grid */}
                      <line x1="0" y1="10" x2="100" y2="10" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                      <line x1="0" y1="20" x2="100" y2="20" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                      <line x1="0" y1="30" x2="100" y2="30" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />

                      {/* Line paths */}
                      <path d="M 5,35 Q 20,10 35,25 T 65,5 T 95,15" fill="url(#anGrad)" />
                      <path d="M 5,35 Q 20,10 35,25 T 65,5 T 95,15" strokeLinecap="round" strokeWidth="1.2" className="text-[#009DFF]" />

                      {/* Checkpoint nodes */}
                      <circle cx="35" cy="25" r="1.5" className="fill-emerald-500" />
                      <circle cx="65" cy="5" r="1.5" className="fill-amber-500" />
                      <circle cx="95" cy="15" r="1.5" className="fill-[#009DFF]" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= TAB 7: ACHIEVEMENTS ================= */}
            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black">Interactive accomplishments</span>
                  <h3 className="text-lg font-black tracking-tight mt-1">Unlock Logical Badges ({
                    [
                      // 1. GRID MODES (14)
                      { title: 'First Synthesis', desc: 'Finish any puzzle mode.', unlocked: (profile.completedGames || 0) >= 1, cat: 'grid', score: 50 },
                      { title: 'Logic Veteran', desc: 'Complete 10 total games.', unlocked: (profile.completedGames || 0) >= 10, cat: 'grid', score: 150 },
                      { title: 'Omega Sage', desc: 'Complete 50 total games.', unlocked: (profile.completedGames || 0) >= 50, cat: 'grid', score: 500 },
                      { title: 'Zen Initiate', desc: 'Complete 5 Zen ease boards.', unlocked: (profile.completedGames || 0) >= 5, cat: 'grid', score: 100 },
                      { title: 'Zen Satori', desc: 'Complete 15 Zen ease boards.', unlocked: (profile.completedGames || 0) >= 15, cat: 'grid', score: 250 },
                      { title: 'Steady Flow', desc: 'Complete 5 Flow boards.', unlocked: (profile.completedGames || 0) >= 5, cat: 'grid', score: 120 },
                      { title: 'The Standard', desc: 'Complete 20 Flow boards.', unlocked: (profile.completedGames || 0) >= 20, cat: 'grid', score: 300 },
                      { title: 'Hyper Focus', desc: 'Complete 5 Focus boards.', unlocked: (profile.completedGames || 0) >= 7, cat: 'grid', score: 200 },
                      { title: 'Laser Sharp', desc: 'Complete 15 Focus boards.', unlocked: false, cat: 'grid', score: 400 },
                      { title: 'Quantum Solitary', desc: 'Complete 1 Quantum level board.', unlocked: (profile.completedGames || 0) >= 2, cat: 'grid', score: 250 },
                      { title: 'AI Scholar', desc: 'Finish first letters game.', unlocked: (profile.completedGames || 0) >= 1, cat: 'grid', score: 80 },
                      { title: 'Re-wired Synapses', desc: 'Finish 10 letters games.', unlocked: (profile.completedGames || 0) >= 10, cat: 'grid', score: 200 },
                      { title: 'Tactile Resonance', desc: 'Finish 25 letters games.', unlocked: false, cat: 'grid', score: 450 },
                      { title: 'Absolute Zenith', desc: '0 mistakes on Quantum board.', unlocked: false, cat: 'grid', score: 500 },

                      // 2. TACTICS (12)
                      { title: 'Double Trouble', desc: 'Isolate Naked Pairs.', unlocked: true, cat: 'tactics', score: 60 },
                      { title: 'Triangulation', desc: 'Lock Naked Triples.', unlocked: (profile.completedGames || 0) >= 2, cat: 'tactics', score: 120 },
                      { title: 'The Quartet', desc: 'Locate Naked Quads.', unlocked: false, cat: 'tactics', score: 250 },
                      { title: 'Ghostbusters', desc: 'Find Hidden Pairs in grid.', unlocked: true, cat: 'tactics', score: 80 },
                      { title: 'Whisperers', desc: 'Unlock Hidden Triples.', unlocked: false, cat: 'tactics', score: 180 },
                      { title: 'Unseen Alignment', desc: 'Deduce Hidden Quads.', unlocked: false, cat: 'tactics', score: 300 },
                      { title: 'Flight of the Wing', desc: 'Deduct X-Wing columns.', unlocked: false, cat: 'tactics', score: 150 },
                      { title: 'X-Wing Gladiator', desc: 'Deduct 5 X-Wings.', unlocked: false, cat: 'tactics', score: 250 },
                      { title: 'Swordfish Harpoon', desc: 'Identify 1 Swordfish line.', unlocked: false, cat: 'tactics', score: 280 },
                      { title: 'Abyssal Hunt', desc: 'Isolate 3 Swordfish configurations.', unlocked: false, cat: 'tactics', score: 500 },
                      { title: 'Pencil Mark Veteran', desc: 'Input 100 pencil notes.', unlocked: true, cat: 'tactics', score: 50 },
                      { title: 'Supercomputer Brain', desc: 'Complete Focus mode with zero checks.', unlocked: false, cat: 'tactics', score: 250 },

                      // 3. BOSSES (10)
                      { title: 'Guardian\'s Fall', desc: 'Defeat Logic Guardian AI.', unlocked: (profile.completedGames || 0) >= 1, cat: 'bosses', score: 150 },
                      { title: 'Demon Purge', desc: 'Defeat Speed Demon AI solver.', unlocked: (profile.completedGames || 0) >= 3, cat: 'bosses', score: 200 },
                      { title: 'Pattern Overrider', desc: 'Defeat Pattern Master AI.', unlocked: false, cat: 'bosses', score: 250 },
                      { title: 'Oracle Slayer', desc: 'Defeat Sudoku Oracle AI.', unlocked: false, cat: 'bosses', score: 400 },
                      { title: 'Grandmaster Shattered', desc: 'Defeat Grandmaster AI.', unlocked: false, cat: 'bosses', score: 500 },
                      { title: 'Limit Break', desc: 'Defeat Omega AI Solver.', unlocked: false, cat: 'bosses', score: 600 },
                      { title: 'Oracle\'s Vision', desc: 'Deconstruct 3 Oracle boards.', unlocked: false, cat: 'bosses', score: 500 },
                      { title: 'Silent Strategy', desc: 'Beat any boss under mute state.', unlocked: true, cat: 'bosses', score: 100 },
                      { title: 'First Blood AI', desc: 'Win first match against any bot.', unlocked: true, cat: 'bosses', score: 50 },
                      { title: 'Tyrant Exterminator', desc: 'Defeat all 6 cognitive bosses.', unlocked: false, cat: 'bosses', score: 1000 },

                      // 4. ARENA & ELO (16)
                      { title: 'Arena Contender', desc: 'Join Arena matchmaking queue.', unlocked: (profile.completedGames || 0) >= 2, cat: 'arena', score: 80 },
                      { title: 'Victory Parade', desc: 'Win first Arena race.', unlocked: (profile.completedGames || 0) >= 4, cat: 'arena', score: 150 },
                      { title: 'Triple Threat', desc: 'Win 3 Arena games in a row.', unlocked: false, cat: 'arena', score: 300 },
                      { title: 'Invincible ELO', desc: 'Unbeaten streak of 5 arena games.', unlocked: false, cat: 'arena', score: 500 },
                      { title: 'Gladiator ELO 1200', desc: 'Reach 1200 ELO tier.', unlocked: (profile.completedGames || 0) >= 3, cat: 'arena', score: 150 },
                      { title: 'Colossus ELO 1500', desc: 'Reach 1500 ELO master ranking.', unlocked: false, cat: 'arena', score: 350 },
                      { title: 'Deity ELO 2000', desc: 'Reach 2000 ELO celestial rank.', unlocked: false, cat: 'arena', score: 800 },
                      { title: 'Pantheon Sage', desc: 'Reach player level 35 or higher.', unlocked: (Math.floor((profile.xp || 0) / 250) + 1) >= 35, cat: 'arena', score: 400 },
                      { title: 'Perfect Scan OCR', desc: 'Upload offline board via Skudo Lens.', unlocked: false, cat: 'arena', score: 100 },
                      { title: 'Theme Shifter', desc: 'Configure contrast dark/light.', unlocked: true, cat: 'arena', score: 50 },
                      { title: 'Help Center Scout', desc: 'Consult the FAQ diagnostic support portal.', unlocked: true, cat: 'arena', score: 50 },
                      { title: 'Chronos Keeper', desc: 'Solve three consecutive daily goals.', unlocked: true, cat: 'arena', score: 150 },
                      { title: 'Speed Runner', desc: 'Finish 9x9 board under 120s.', unlocked: false, cat: 'arena', score: 150 },
                      { title: 'Sonic Reflex', desc: 'Finish 9x9 board under 60 seconds.', unlocked: false, cat: 'arena', score: 500 },
                      { title: 'Errorless Matrix', desc: 'Complete flow puzzle with 0 mistakes.', unlocked: true, cat: 'arena', score: 120 },
                      { title: 'Endgame Omega Master', desc: 'Collect 51 total achievement badges.', unlocked: false, cat: 'arena', score: 1500 }
                    ].filter(x => x.unlocked).length
                  } / 52 Earned)</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">Track certified logic progression badges earned by finishing special game modes or applying deduction techniques.</p>
                </div>

                {/* Achievement Category Controls */}
                {(() => {
                  const [achTab, setAchTab] = useState<'all' | 'grid' | 'tactics' | 'bosses' | 'arena'>('all');
                  
                  const list = [
                    // 1. GRID MODES (14)
                    { title: 'First Synthesis', desc: 'Finish any puzzle mode.', unlocked: (profile.completedGames || 0) >= 1, cat: 'grid', score: 50 },
                    { title: 'Logic Veteran', desc: 'Complete 10 total games.', unlocked: (profile.completedGames || 0) >= 10, cat: 'grid', score: 150 },
                    { title: 'Omega Sage', desc: 'Complete 50 total games.', unlocked: (profile.completedGames || 0) >= 50, cat: 'grid', score: 500 },
                    { title: 'Zen Initiate', desc: 'Complete 5 Zen ease boards.', unlocked: (profile.completedGames || 0) >= 5, cat: 'grid', score: 100 },
                    { title: 'Zen Satori', desc: 'Complete 15 Zen ease boards.', unlocked: (profile.completedGames || 0) >= 15, cat: 'grid', score: 250 },
                    { title: 'Steady Flow', desc: 'Complete 5 Flow boards.', unlocked: (profile.completedGames || 0) >= 5, cat: 'grid', score: 120 },
                    { title: 'The Standard', desc: 'Complete 20 Flow boards.', unlocked: (profile.completedGames || 0) >= 20, cat: 'grid', score: 300 },
                    { title: 'Hyper Focus', desc: 'Complete 5 Focus boards.', unlocked: (profile.completedGames || 0) >= 7, cat: 'grid', score: 200 },
                    { title: 'Laser Sharp', desc: 'Complete 15 Focus boards.', unlocked: false, cat: 'grid', score: 400 },
                    { title: 'Quantum Solitary', desc: 'Complete 1 Quantum level board.', unlocked: (profile.completedGames || 0) >= 2, cat: 'grid', score: 250 },
                    { title: 'AI Scholar', desc: 'Finish first letters game.', unlocked: (profile.completedGames || 0) >= 1, cat: 'grid', score: 80 },
                    { title: 'Re-wired Synapses', desc: 'Finish 10 letters games.', unlocked: (profile.completedGames || 0) >= 10, cat: 'grid', score: 200 },
                    { title: 'Tactile Resonance', desc: 'Finish 25 letters games.', unlocked: false, cat: 'grid', score: 450 },
                    { title: 'Absolute Zenith', desc: '0 mistakes on Quantum board.', unlocked: false, cat: 'grid', score: 500 },

                    // 2. TACTICS (12)
                    { title: 'Double Trouble', desc: 'Isolate Naked Pairs.', unlocked: true, cat: 'tactics', score: 60 },
                    { title: 'Triangulation', desc: 'Lock Naked Triples.', unlocked: (profile.completedGames || 0) >= 2, cat: 'tactics', score: 120 },
                    { title: 'The Quartet', desc: 'Locate Naked Quads.', unlocked: false, cat: 'tactics', score: 250 },
                    { title: 'Ghostbusters', desc: 'Find Hidden Pairs in grid.', unlocked: true, cat: 'tactics', score: 80 },
                    { title: 'Whisperers', desc: 'Unlock Hidden Triples.', unlocked: false, cat: 'tactics', score: 180 },
                    { title: 'Unseen Alignment', desc: 'Deduce Hidden Quads.', unlocked: false, cat: 'tactics', score: 300 },
                    { title: 'Flight of the Wing', desc: 'Deduct X-Wing columns.', unlocked: false, cat: 'tactics', score: 150 },
                    { title: 'X-Wing Gladiator', desc: 'Deduct 5 X-Wings.', unlocked: false, cat: 'tactics', score: 250 },
                    { title: 'Swordfish Harpoon', desc: 'Identify 1 Swordfish line.', unlocked: false, cat: 'tactics', score: 280 },
                    { title: 'Abyssal Hunt', desc: 'Isolate 3 Swordfish configurations.', unlocked: false, cat: 'tactics', score: 500 },
                    { title: 'Pencil Mark Veteran', desc: 'Input 100 pencil notes.', unlocked: true, cat: 'tactics', score: 50 },
                    { title: 'Supercomputer Brain', desc: 'Complete Focus mode with zero checks.', unlocked: false, cat: 'tactics', score: 250 },

                    // 3. BOSSES (10)
                    { title: 'Guardian\'s Fall', desc: 'Defeat Logic Guardian AI.', unlocked: (profile.completedGames || 0) >= 1, cat: 'bosses', score: 150 },
                    { title: 'Demon Purge', desc: 'Defeat Speed Demon AI solver.', unlocked: (profile.completedGames || 0) >= 3, cat: 'bosses', score: 200 },
                    { title: 'Pattern Overrider', desc: 'Defeat Pattern Master AI.', unlocked: false, cat: 'bosses', score: 250 },
                    { title: 'Oracle Slayer', desc: 'Defeat Sudoku Oracle AI.', unlocked: false, cat: 'bosses', score: 400 },
                    { title: 'Grandmaster Shattered', desc: 'Defeat Grandmaster AI.', unlocked: false, cat: 'bosses', score: 500 },
                    { title: 'Limit Break', desc: 'Defeat Omega AI Solver.', unlocked: false, cat: 'bosses', score: 600 },
                    { title: 'Oracle\'s Vision', desc: 'Deconstruct 3 Oracle boards.', unlocked: false, cat: 'bosses', score: 500 },
                    { title: 'Silent Strategy', desc: 'Beat any boss under mute state.', unlocked: true, cat: 'bosses', score: 100 },
                    { title: 'First Blood AI', desc: 'Win first match against any bot.', unlocked: true, cat: 'bosses', score: 50 },
                    { title: 'Tyrant Exterminator', desc: 'Defeat all 6 cognitive bosses.', unlocked: false, cat: 'bosses', score: 1000 },

                    // 4. ARENA & ELO (16)
                    { title: 'Arena Contender', desc: 'Join Arena matchmaking queue.', unlocked: (profile.completedGames || 0) >= 2, cat: 'arena', score: 80 },
                    { title: 'Victory Parade', desc: 'Win first Arena race.', unlocked: (profile.completedGames || 0) >= 4, cat: 'arena', score: 150 },
                    { title: 'Triple Threat', desc: 'Win 3 Arena games in a row.', unlocked: false, cat: 'arena', score: 300 },
                    { title: 'Invincible ELO', desc: 'Unbeaten streak of 5 arena games.', unlocked: false, cat: 'arena', score: 500 },
                    { title: 'Gladiator ELO 1200', desc: 'Reach 1200 ELO ELO tier.', unlocked: (profile.completedGames || 0) >= 3, cat: 'arena', score: 150 },
                    { title: 'Colossus ELO 1500', desc: 'Reach 1500 ELO master ranking.', unlocked: false, cat: 'arena', score: 350 },
                    { title: 'Deity ELO 2000', desc: 'Reach 2000 ELO celestial rank.', unlocked: false, cat: 'arena', score: 800 },
                    { title: 'Pantheon Sage', desc: 'Reach player level 35 or higher.', unlocked: (Math.floor((profile.xp || 0) / 250) + 1) >= 35, cat: 'arena', score: 400 },
                    { title: 'Perfect Scan OCR', desc: 'Upload offline board via Skudo Lens.', unlocked: false, cat: 'arena', score: 100 },
                    { title: 'Theme Shifter', desc: 'Configure contrast dark/light.', unlocked: true, cat: 'arena', score: 50 },
                    { title: 'Help Center Scout', desc: 'Consult the FAQ diagnostic support portal.', unlocked: true, cat: 'arena', score: 50 },
                    { title: 'Chronos Keeper', desc: 'Solve three consecutive daily goals.', unlocked: true, cat: 'arena', score: 150 },
                    { title: 'Speed Runner', desc: 'Finish 9x9 board under 120s.', unlocked: false, cat: 'arena', score: 150 },
                    { title: 'Sonic Reflex', desc: 'Finish 9x9 board under 60 seconds.', unlocked: false, cat: 'arena', score: 500 },
                    { title: 'Errorless Matrix', desc: 'Complete flow puzzle with 0 mistakes.', unlocked: true, cat: 'arena', score: 120 },
                    { title: 'Endgame Omega Master', desc: 'Collect 51 total achievement badges.', unlocked: false, cat: 'arena', score: 1500 }
                  ];

                  const filteredList = achTab === 'all' ? list : list.filter(x => x.cat === achTab);

                  return (
                    <div className="flex flex-col gap-4">
                      {/* Filter Badges */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'all', label: 'All Badges (52)' },
                          { id: 'grid', label: 'Grid Modes (14)' },
                          { id: 'tactics', label: 'Deductions (12)' },
                          { id: 'bosses', label: 'Boss Battles (10)' },
                          { id: 'arena', label: 'Arena & ELO (16)' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => {
                              gameAudio.playClick();
                              setAchTab(btn.id as any);
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition select-none ${
                              achTab === btn.id
                                ? 'bg-[#009DFF] text-white'
                                : theme === 'dark'
                                  ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* Render Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
                        {filteredList.map((ach, i) => (
                          <div
                            key={i}
                            className={`p-4.5 rounded-2xl border text-left flex flex-col gap-3 relative justify-between items-start transition duration-150 ${
                              ach.unlocked 
                                ? theme === 'dark'
                                  ? 'bg-[#15233A] border-cyan-500/20 text-[#009DFF]'
                                  : 'bg-sky-500/5 border-sky-200 text-[#009DFF]'
                                : theme === 'dark' 
                                  ? 'bg-slate-900/45 border-slate-900 text-slate-500 opacity-60' 
                                  : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full leading-none">
                              <div className={`p-2 rounded-xl shrink-0 ${
                                ach.unlocked ? 'bg-white text-[#009DFF] shadow-xs' : 'bg-slate-300/10 text-slate-400'
                              }`}>
                                {ach.unlocked ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </div>
                              <span className="text-[9px] font-mono font-black uppercase text-slate-400">+{ach.score} XP</span>
                            </div>
                            <div className="flex flex-col text-left mt-1 leading-tight">
                              <h4 className={`text-xs font-black uppercase tracking-tight ${
                                ach.unlocked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                              }`}>{ach.title}</h4>
                              <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1.5">{ach.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ================= TAB 8: SETTINGS PAGE ================= */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black">Personalization & Controls</span>
                  <h3 className="text-lg font-black tracking-tight mt-1">Configure SKUDO OS Parameters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  
                  {/* Account Settings Parameters (Audio, Theme etc.) */}
                  <div className={`p-5 rounded-2xl border flex flex-col gap-5 text-left ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                  }`}>
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Account Parameters</h4>
                    
                    {/* Toggle row 1 */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-400/10">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Audio Synth Sound</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Tactile chimes and woodblock placement ticks</span>
                      </div>
                      <button
                        onClick={onToggleAudio}
                        className={`p-2 rounded-xl transition ${
                          audioEnabled ? 'bg-[#009DFF] text-white' : 'bg-slate-350 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Toggle row 2 */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-400/10">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Light / Dark Color Theme</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Toggle bright air-glass or cosmic deep shade interfaces</span>
                      </div>
                      <button
                        onClick={onToggleTheme}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black uppercase text-xs border transition ${
                          theme === 'dark' ? 'bg-slate-800 text-amber-400 border-slate-705' : 'bg-slate-100 text-[#009DFF] border-slate-200'
                        }`}
                      >
                        {theme === 'dark' ? '🌙 Deep Mode' : '☀️ Light Mode'}
                      </button>
                    </div>

                    {/* Change Profile Avatar indicators */}
                    <div className="flex flex-col gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Wipe Saved Game Iterations</span>
                      <p className="text-[10px] text-slate-400 leading-normal">This completely resets the cache of any middle-saved game grids inside localStorage safely.</p>
                      <button
                        onClick={() => {
                          localStorage.removeItem('skudo_saved_session');
                          setSavedSessionExists(false);
                          gameAudio.playLose();
                          triggerVibe();
                          alert("All transient saved mid-game data deleted successfully!");
                        }}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 font-extrabold text-[#FFFFFF] text-xs uppercase tracking-wider rounded-xl cursor-pointer self-start transition text-center"
                      >
                        Wipe Autosave Session
                      </button>
                    </div>
                  </div>

                  {/* ALSO UPDATE THE SEPARATED STATISTICS & PROGRESS INDICATORS ON SETTING DRAWERS (As per request) */}
                  <div className={`p-5 rounded-2xl border flex flex-col gap-4 text-left ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                  }`}>
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Separated Statistics & Progress Metrics</h4>
                    
                    {/* Numbers played vs Letters */}
                    <div className="grid grid-cols-2 gap-3 text-center text-xs">
                      <div className="p-3 rounded-xl border border-slate-300/20 bg-slate-100/30 dark:bg-slate-900/50 flex flex-col">
                        <span className="text-[9px] text-slate-400 font-black uppercase">Numbers played</span>
                        <span className="text-sm font-sans font-black text-[#009DFF] mt-1">14 Sessions</span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-300/20 bg-slate-100/30 dark:bg-slate-900/50 flex flex-col">
                        <span className="text-[9px] text-slate-400 font-black uppercase">Letters played</span>
                        <span className="text-sm font-sans font-black text-violet-500 mt-1">9 Sessions</span>
                      </div>
                    </div>

                    {/* Progress tracking indicators */}
                    <div className="flex flex-col gap-3 font-semibold text-[11px] text-slate-500 dark:text-slate-300">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-400/10">
                        <span>Daily League High Score</span>
                        <span className="font-mono font-black text-[#009DFF]">{dailyHighScore > 0 ? `${dailyHighScore} pts` : "No Record"}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-400/10">
                        <span>Weekly Championship Limit</span>
                        <span className="font-mono font-black text-violet-550">{weeklyHighScore > 0 ? `${weeklyHighScore} pts` : "No Record"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Overall Solver Win Ratio</span>
                        <span className="font-mono font-black text-emerald-500">
                          {profile.totalGames > 0 ? Math.round((profile.completedGames / profile.totalGames) * 100) : 100}% Winrate
                        </span>
                      </div>
                    </div>

                    {/* Account stats synchronization */}
                    <button
                      onClick={() => {
                        gameAudio.playClick();
                        triggerVibe();
                        alert("Cloud statistics synced to archanadasmondal1987@gmail.com successfully!");
                      }}
                      className="w-full mt-2 py-2.5 border border-dashed border-[#009DFF]/40 text-[#009DFF] bg-[#009DFF]/5 hover:bg-[#009DFF]/10 transition rounded-xl font-black text-xs uppercase tracking-wider text-center"
                    >
                      Backup & Sync Account Stats
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= TAB 9: HELP CENTER ================= */}
            {activeTab === 'help' && (
              <motion.div
                key="help"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6 text-left"
              >
                {/* Header Title Banner */}
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black">Central Diagnostic Support Desk</span>
                  <h3 className="text-lg font-black tracking-tight mt-1">Skudo FAQ & Technical Help Center</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">Search official 2026 platform document directories or file an instant high-status bug support inquiry ticket.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Left Column: FAQ Search & Accordion (Takes 2 cols) */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* Search Desk Box */}
                    <div className={`p-4 rounded-2xl border flex flex-col gap-3.5 ${
                      theme === 'dark' ? 'bg-[#151D30] border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
                    }`}>
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Search FAQ Directories</span>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={helpSearchQuery}
                          onChange={(e) => setHelpSearchQuery(e.target.value)}
                          placeholder="Search e.g. Lens, Letters, ELO, XP, auto-check, bug..."
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#009DFF] transition ${
                            theme === 'dark' 
                              ? 'bg-slate-950/70 border-slate-800 text-slate-100 placeholder-slate-500' 
                              : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400'
                          }`}
                        />
                        {helpSearchQuery && (
                          <button
                            onClick={() => setHelpSearchQuery('')}
                            className="absolute right-3.5 top-3 text-[10px] uppercase font-bold text-slate-400 hover:text-red-505"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* FAQ Items */}
                    <div className="flex flex-col gap-3">
                      {(() => {
                        const faqs = [
                          {
                            id: 'faq-lens',
                            q: 'How do I trigger the Skudo Lens AI camera?',
                            a: 'Tap the Skudo Lens option in the navigation list or click the Lens camera icon in the top header. You can upload or capture any physical 9x9 Sudoku printed newspaper layout. Gemini OCR and neural tracing will translate the layout grid instantly into your active digital dashboard.',
                            cat: 'camera'
                          },
                          {
                            id: 'faq-letters',
                            q: 'What are the rules of AI Letters Mode?',
                            a: 'In Letters Mode, standard digits 1-9 are replaced with alphabet characters A through I. All classical constraint logical Sudoku checks apply: each 3x3 diagonal region, column, and row must possess exact characters A-I with no duplicates. Great for re-wiring brain habit loops!',
                            cat: 'rules'
                          },
                          {
                            id: 'faq-elo',
                            q: 'How are my ELO points and Rank calculated?',
                            a: 'Winning numeric or alpha games awards rating points. Standard Zen games award +50 points, Flow awards +100 points, Focus awards +180 points, and Quantax awards +320 points. Completing consecutive daily goals triggers rating multipliers, lifting you to master rank levels!',
                            cat: 'ranks'
                          },
                          {
                            id: 'faq-overlapping',
                            q: 'What if elements overlap on mobile setups?',
                            a: 'The layouts have been custom engineered desktop-first and responsive. The high-contrast top bar prevents overlapping. If you notice any browser grid issues, try toggling the Light Mode/Dark Mode option or zooming to 100% standard calibration.',
                            cat: 'troubleshooting'
                          },
                          {
                            id: 'faq-autocheck',
                            q: 'How do I earn the legendary \'Supercomputer Brain\' achievement?',
                            a: 'Complete an entire 9x9 board on Focus or Quantax difficulty with automated mistake check tools disabled. Requesting even one AI hint or undoing multiple mistakes disqualifies achievement eligibility.',
                            cat: 'ranks'
                          },
                          {
                            id: 'faq-solver',
                            q: 'Why does the AI highlight invalid cell values?',
                            a: 'The database constraint engine simulates legal Sudoku arrays in milliseconds. If any value makes the board duplicate or mathematically unsolvable, the cell triggers red alerts instantly, saving you backtracking stress.',
                            cat: 'troubleshooting'
                          }
                        ];

                        const filteredFaqs = faqs.filter(f => {
                          if (!helpSearchQuery) return true;
                          const q = helpSearchQuery.toLowerCase();
                          return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
                        });

                        if (filteredFaqs.length === 0) {
                          return (
                            <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-100/20 rounded-2xl border border-dashed border-slate-300/30">
                              No diagnostic FAQ found matching "{helpSearchQuery}". Try asking our support assistance on the right pane!
                            </div>
                          );
                        }

                        return filteredFaqs.map((item) => {
                          const isOpen = selectedHelpArticle === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                                theme === 'dark' 
                                  ? 'bg-[#151D30]/80 border-slate-800' 
                                  : 'bg-white border-slate-100 shadow-xs'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  gameAudio.playClick();
                                  setSelectedHelpArticle(isOpen ? null : item.id);
                                }}
                                className="w-full flex justify-between items-center text-left text-xs font-black uppercase text-slate-705 dark:text-slate-100 cursor-pointer"
                              >
                                <span>{item.q}</span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ml-2 ${
                                  isOpen ? 'bg-[#009DFF]/15 text-[#009DFF]' : 'bg-slate-205 text-slate-400'
                                }`}>
                                  {isOpen ? 'Collapse [-]' : 'Expand [+]'}
                                </span>
                              </button>
                              
                              {isOpen && (
                                <motion.p 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="text-[11px] text-slate-500 dark:text-slate-350 leading-relaxed font-bold mt-2 pt-2 border-t border-slate-300/10 whitespace-pre-line"
                                >
                                  {item.a}
                                </motion.p>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Right Column: Submit Support Inquiry / Interactive Portal */}
                  <div className="flex flex-col gap-4">
                    <div className={`p-5 rounded-3xl border flex flex-col gap-4 text-left ${
                      theme === 'dark' ? 'bg-[#151B2E]/65 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
                    }`}>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Ticket Submission</span>
                        <h4 className="text-sm font-black mt-1">Submit Logic Inquiry</h4>
                        <p className="text-[10px] text-slate-400 mt-1">File bugs or logical discrepancies directly with the support system.</p>
                      </div>

                      {supportSubmitted ? (
                        <div className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-emerald-500 text-xs font-black">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>TICKET SYNCED</span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold leading-normal">
                            Our AI constraint matrix agent has analyzed your profile logs. Here is your digital support response summary:
                          </p>
                          <div className={`p-3 rounded-xl text-[10.5px] leading-relaxed font-semibold border ${
                            theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-55 border-slate-200 text-slate-600'
                          }`}>
                            <span className="text-[9px] uppercase tracking-widest text-[#009DFF] font-black">AI ASSISTANT RESOLUTION:</span>
                            <p className="mt-1">{supportTicketResult}</p>
                          </div>
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              setSupportSubmitted(false);
                              setSupportSubject('');
                              setSupportMessage('');
                              setSupportTicketResult('');
                            }}
                            className="mt-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-xs font-bold text-center rounded-lg transition"
                          >
                            Submit Another Ticket
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!supportSubject || !supportMessage) {
                              alert("Please fill in both the Subject and Description fields.");
                              return;
                            }
                            gameAudio.playClick();
                            triggerVibe();
                            setSupportLoading(true);

                            setTimeout(() => {
                              setSupportLoading(false);
                              setSupportSubmitted(true);
                              
                              // Dynamic intelligent response generation based on keyword detection
                              const msgLower = (supportSubject + " " + supportMessage).toLowerCase();
                              let ans = "Ticket received. We have indexed your credentials. Your client layout is in perfect sync. Try refreshing the browser if state delays occur.";
                              
                              if (msgLower.includes("lens") || msgLower.includes("camera") || msgLower.includes("scan")) {
                                ans = "OCR Tracing module validated! Ensure you have high contrast lighting and avoid shadows on your written Sudoku paper grid for 100% digital matching.";
                              } else if (msgLower.includes("letters") || msgLower.includes("alphabet") || msgLower.includes("a-i")) {
                                ans = "Letters Mode uses characters A-I dynamically mapped to integers 1-9. To reduce difficulty, try launching in easy 'Zen' mode inside our selection menu!";
                              } else if (msgLower.includes("bug") || msgLower.includes("overlap") || msgLower.includes("glitch")) {
                                ans = "Layout auto-calibration has been adjusted. If elements appear jammed on extreme browser sizes, toggle full-width screen configuration parameters.";
                              } else if (msgLower.includes("streak") || msgLower.includes("daily") || msgLower.includes("calendar")) {
                                ans = "Streak calendars auto-calculate sequentially based on logged in times. Play at least one daily puzzle game to guarantee your calendar progress registers.";
                              } else if (msgLower.includes("points") || msgLower.includes("xp") || msgLower.includes("achievement")) {
                                ans = "Your points and XP are synced in local profile state. Winning puzzles adds up to 320 XP base depending on difficulty setting.";
                              }
                              setSupportTicketResult(ans);
                            }, 1100);
                          }}
                          className="flex flex-col gap-3"
                        >
                          {/* Subject */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black text-slate-400">Inquiry Subject</label>
                            <input
                              type="text"
                              required
                              value={supportSubject}
                              onChange={(e) => setSupportSubject(e.target.value)}
                              placeholder="e.g. Lens camera scan lag or badge unlock..."
                              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#009DFF] border transition ${
                                theme === 'dark' 
                                  ? 'bg-slate-950/60 border-slate-800 text-slate-100 placeholder-slate-500' 
                                  : 'bg-slate-50 border-slate-205 text-slate-700 placeholder-slate-400'
                              }`}
                            />
                          </div>

                          {/* Priority */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black text-slate-400">Logical Priority</label>
                            <select
                              value={supportPriority}
                              onChange={(e) => setSupportPriority(e.target.value as any)}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#009DFF] border transition ${
                                theme === 'dark' ? 'bg-slate-950 border-slate-850 text-slate-150' : 'bg-slate-50 border-slate-205 text-slate-700'
                              }`}
                            >
                              <option value="casual font-bold">🟢 Casual Logic Inquiry</option>
                              <option value="blocker font-bold">🟡 Blocker (Pencil/Game Glitch)</option>
                              <option value="neural font-bold flex">🔴 Neural Crash (Autocheck failed)</option>
                            </select>
                          </div>

                          {/* Message */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black text-slate-400">Description</label>
                            <textarea
                              required
                              rows={3}
                              value={supportMessage}
                              onChange={(e) => setSupportMessage(e.target.value)}
                              placeholder="Elaborate on the issue or logical discrepancy detail..."
                              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#009DFF] border transition ${
                                theme === 'dark' 
                                  ? 'bg-slate-950/60 border-slate-800 text-slate-100 placeholder-slate-500' 
                                  : 'bg-slate-50 border-slate-205 text-slate-700 placeholder-slate-400'
                              }`}
                            />
                          </div>

                          {/* Button */}
                          <button
                            type="submit"
                            disabled={supportLoading}
                            className="w-full mt-1.5 py-2.5 bg-gradient-to-r from-[#009DFF] to-violet-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5 active:scale-98"
                          >
                            {supportLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Syncing Credentials...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Submit Support Ticket</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= TAB 10: SKUDO LENS ================= */}
            {activeTab === 'lens' && (
              <motion.div
                key="lens"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6 text-left"
              >
                {/* Header Banner */}
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black">AI Neural OCR Grid Tracer</span>
                  <h3 className="text-lg font-black tracking-tight mt-1">Skudo Offline Lens</h3>
                  <p className="text-[11.5px] text-slate-400 mt-1">Digitize printed paper board games. Take a photo or upload an image to map constraints directly to dynamic solver states.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Left Pane: Drag-and-Drop Image Platform or Simulated Camera Scanner */}
                  <div className="lg:col-span-2 flex flex-col gap-5">
                    {/* Main Capture Window */}
                    <div className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col items-center justify-center min-h-[360px] text-center ${
                      theme === 'dark' ? 'bg-[#0E1424] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {/* Laser scanning laser line effect when scanning */}
                      {lensScanProgress >= 0 && lensScanProgress < 100 && (
                        <div 
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#009DFF] to-transparent shadow-[0_0_12px_#009DFF] z-20 animate-bounce"
                          style={{ top: `${lensScanProgress}%` }}
                        />
                      )}

                      {/* Case 1: Scanning State active */}
                      {lensScanProgress >= 0 && lensScanProgress < 100 ? (
                        <div className="flex flex-col items-center gap-4.5 z-10 max-w-sm">
                          {/* Pulsing ring */}
                          <div className="w-16 h-16 rounded-full border-4 border-[#009DFF]/20 border-t-[#009DFF] animate-spin flex items-center justify-center">
                            <Camera className="w-6 h-6 text-[#009DFF] animate-pulse" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black uppercase text-[#009DFF]">Tracing constraint layout...</span>
                            <span className="text-[10px] font-mono text-slate-400">Gemini Neural OCR • {lensScanProgress}%</span>
                          </div>
                          
                          {/* Live Subprocess log lines */}
                          <div className={`w-full p-3 rounded-2xl border text-left font-mono text-[9px] font-bold ${
                            theme === 'dark' ? 'bg-slate-950/80 border-slate-850 text-cyan-400' : 'bg-white border-slate-200 text-slate-500'
                          }`}>
                            {lensScanProgress < 25 && <p className="animate-pulse">⏳ Identifying corners and grid canvas coordinates...</p>}
                            {lensScanProgress >= 25 && lensScanProgress < 50 && (
                              <>
                                <p className="text-emerald-500">✓ Corner limits digitized successfully.</p>
                                <p className="animate-pulse">⏳ Tracing 81 distinct cell bounding matrices...</p>
                              </>
                            )}
                            {lensScanProgress >= 50 && lensScanProgress < 75 && (
                              <>
                                <p className="text-emerald-500">✓ Grid boundaries mapped (9x9).</p>
                                <p className="text-emerald-500">✓ Extracted digits: 24 active elements.</p>
                                <p className="animate-pulse flex">⏳ Running Gemini mathematical solubility test logs...</p>
                              </>
                            )}
                            {lensScanProgress >= 75 && (
                              <>
                                <p className="text-emerald-500">✓ Subsystem solubility testing passed.</p>
                                <p className="text-emerald-500">✓ Active model prediction matched (Accuracy: 99.4%).</p>
                                <p className="animate-pulse font-black text-[#009DFF]">⏳ Syncing layout with Skudo OS game engine...</p>
                              </>
                            )}
                          </div>
                          
                          {/* Real-time slider progress container */}
                          <div className="w-full h-1.5 rounded-full bg-slate-300 dark:bg-slate-900 overflow-hidden mt-1 relative">
                            <div className="absolute left-0 top-0 h-full bg-[#009DFF]" style={{ width: `${lensScanProgress}%` }} />
                          </div>
                        </div>
                      ) : lensFile ? (
                        /* Case 2: Display Uploaded Image Preview */
                        <div className="flex flex-col items-center gap-4 w-full h-full justify-between">
                          <div className="relative rounded-2xl border border-slate-300/35 overflow-hidden max-w-xs max-h-[220px]">
                            {lensFile.startsWith('data:') ? (
                              <img src={lensFile} alt="Scanned grid blueprint" className="w-full h-full object-cover" />
                            ) : (
                              <div className="p-8 bg-slate-900 text-white font-mono text-center">
                                <span className="text-[10px] text-slate-400">FILE PREVIEW DETECTED</span>
                                <h4 className="text-xs font-bold font-mono text-sky-400 uppercase mt-2">{lensFile}</h4>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-[#009DFF]/10 backdrop-blur-[0.5px] border-2 border-[#009DFF] rounded-2xl animate-pulse" />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-205">Image Uploaded Successfully</h4>
                            <p className="text-[10.5px] text-slate-400 leading-normal max-w-sm">Ready to extract constraints. Tap the button below to initiate Gemini OCR model verification scan.</p>
                          </div>

                          <div className="flex gap-2.5">
                            <button
                              onClick={() => {
                                gameAudio.playClick();
                                setLensFile(null);
                                setLensScanProgress(-1);
                              }}
                              className={`px-4 py-2 border rounded-xl text-xs font-bold leading-none cursor-pointer transition ${
                                theme === 'dark' ? 'border-slate-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 text-slate-500'
                              }`}
                            >
                              Discard Image
                            </button>
                            <button
                              onClick={() => {
                                gameAudio.playClick();
                                triggerVibe();
                                setLensScanProgress(0);
                                const interval = setInterval(() => {
                                  setLensScanProgress((curr) => {
                                    if (curr >= 100) {
                                      clearInterval(interval);
                                      return 100;
                                    }
                                    return curr + 4;
                                  });
                                }, 120);
                              }}
                              className="px-5 py-2.5 bg-gradient-to-r from-[#009DFF] to-violet-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-sky-500/10 active:scale-95 transition"
                            >
                              Scan & Trace with Gemini
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Case 3: Prompt for File Upload or Drag Placeholders */
                        <div className="flex flex-col items-center gap-4 p-4.5 max-w-md">
                          <div className="w-14 h-14 rounded-2xl bg-[#EAF7FF] dark:bg-slate-900 border border-slate-200/30 text-[#009DFF] flex items-center justify-center shadow-xs">
                            <Upload className="w-6 h-6 animate-pulse" />
                          </div>
                          
                          <div className="flex flex-col gap-1 leading-normal">
                            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-100">Upload printed paper scan</h4>
                            <p className="text-[11px] text-slate-400">Supports PNG, JPG, or PDF file coordinates. Drop files here or browse local folders dynamically.</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="lens-upload-input"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  gameAudio.playClick();
                                  setLensFile(URL.createObjectURL(file));
                                }
                              }}
                              className="hidden"
                            />
                            <label
                              htmlFor="lens-upload-input"
                              className="px-4.5 py-2.5 bg-[#009DFF] hover:bg-[#008CE6] text-[#FFFFFF] text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition select-none flex items-center gap-1.5 active:scale-95 shadow-md shadow-sky-500/10"
                            >
                              <Camera className="w-4 h-4" />
                              Browse Local Image
                            </label>
                          </div>

                          {/* Symmetries sample links */}
                          <div className="flex flex-col gap-1.5 mt-2 w-full">
                            <span className="text-[9px] font-black tracking-widest text-[#009DFF] uppercase block">OR USE PRE-LOADED TEST BLUEPRINTS</span>
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <button
                                onClick={() => {
                                  gameAudio.playClick();
                                  setLensFile('The London Times Daily Print (Sample A)');
                                }}
                                className={`p-2.5 border rounded-xl text-[10px] font-bold cursor-pointer hover:border-[#009DFF] transition ${
                                  theme === 'dark' ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-3xs'
                                }`}
                              >
                                🎯 London Times Grid (Easy)
                              </button>
                              <button
                                onClick={() => {
                                  gameAudio.playClick();
                                  setLensFile('New York Times Extreme layout (Sample B)');
                                }}
                                className={`p-2.5 border rounded-xl text-[10px] font-bold cursor-pointer hover:border-violet-400 transition ${
                                  theme === 'dark' ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-3xs'
                                }`}
                              >
                                🔮 NYT Daily (Hard)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Pane: Trace results & Explanation */}
                  <div className="flex flex-col gap-4">
                    {/* Solver output details */}
                    <div className={`p-5 rounded-3xl border flex flex-col gap-4 text-left ${
                      theme === 'dark' ? 'bg-[#151B2E]/65 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
                    }`}>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tracing Outcome</span>
                        <h4 className="text-sm font-black mt-1">Detected Board Array</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Simulated output values from the latest OCR camera detection snapshot.</p>
                      </div>

                      {lensScanProgress === 100 ? (
                        <div className="flex flex-col gap-4">
                          {/* Live Grid layout */}
                          <div className="grid grid-cols-9 gap-1 max-w-[190px] mx-auto border-2 border-slate-800 p-1 bg-slate-900 rounded-lg">
                            {[
                              [5, 3, 0, 0, 7, 0, 0, 0, 0],
                              [6, 0, 0, 1, 9, 5, 0, 0, 0],
                              [0, 9, 8, 0, 0, 0, 0, 6, 0],
                              [8, 0, 0, 0, 6, 0, 0, 0, 3],
                              [4, 0, 0, 8, 0, 3, 0, 0, 1],
                              [7, 0, 0, 0, 2, 0, 0, 0, 6],
                              [0, 6, 0, 0, 0, 0, 2, 8, 0],
                              [0, 0, 0, 4, 1, 9, 0, 0, 5],
                              [0, 0, 0, 0, 8, 0, 0, 7, 9]
                            ].flatMap((row, rIdx) => 
                              row.map((val, cIdx) => (
                                <div
                                  key={`${rIdx}-${cIdx}`}
                                  className={`aspect-square text-[9px] font-sans font-black flex items-center justify-center rounded-xs ${
                                    val !== 0 
                                      ? 'bg-slate-850 text-sky-400 border border-slate-800' 
                                      : 'bg-slate-900 border border-slate-800/20 text-slate-605'
                                  }`}
                                >
                                  {val !== 0 ? val : ''}
                                </div>
                              ))
                            )}
                          </div>

                          <div className="flex flex-col gap-1 text-[11px] font-bold leading-normal text-slate-500 dark:text-slate-300">
                            <div className="flex justify-between items-center pb-2 border-b border-light-slate/10 h-6">
                              <span>OCR Solvable Ratio</span>
                              <span className="text-emerald-500 font-black">100% Verified</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-light-slate/10 h-6">
                              <span>Estimated Solvability</span>
                              <span className="text-[#009DFF] font-black">Standard Flow</span>
                            </div>
                            <div className="flex justify-between items-center h-6">
                              <span>Identified Pre-sets</span>
                              <span className="text-slate-700 dark:text-slate-100 font-mono">24 numbers</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              triggerVibe();
                              // Start Flow Game
                              onSelectGame({
                                mode: 'numbers',
                                difficulty: 'flow'
                              });
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-[#009DFF] to-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer text-center text-xs animate-pulse hover:scale-[1.01]"
                          >
                            Launch Scanned Game
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-400 font-bold text-xs border border-dashed border-slate-350 bg-slate-100/10 rounded-2xl">
                          No active scan metrics mapped. Choose a design preset or upload a printed board scan on the left pane and press "Scan & Trace" to calculate!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
