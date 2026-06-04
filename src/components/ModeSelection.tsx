/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Image
} from 'lucide-react';
import { GameMode, PlayerProfile } from '../types';
import { gameAudio } from '../utils/audio';

interface ModeSelectionProps {
  profile: PlayerProfile;
  onSelect: (mode: GameMode) => void;
  onSelectSpecial: (type: 'daily' | 'weekly') => void;
}

export default function ModeSelection({ profile, onSelect, onSelectSpecial }: ModeSelectionProps) {
  const [now, setNow] = useState<number>(Date.now());
  const [showLearnModal, setShowLearnModal] = useState<boolean>(false);
  const [learnTab, setLearnTab] = useState<'rules' | 'terms' | 'techniques' | 'ai'>('rules');


  // Skudo AI Assistant States
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [coachVoice, setCoachVoice] = useState<string>(() => localStorage.getItem('skudo_coach_voice') || 'neural');
  const [chatInputImage, setChatInputImage] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
  const [aiChat, setAiChat] = useState<Array<{ sender: 'user' | 'siri'; text: string; id: string; imageUrl?: string }>>([
    {
      id: 'welcome',
      sender: 'siri',
      text: "Hi! I'm Skudo Omni AI, your smart logic companion. Now powered with Google Gemini AI capabilities, you can ask me anything from any field! Or ask me to create/generate an image (e.g. 'generate a futuristic neon sudoku card'), or drag/paste pictures to scan and solve them instantly!",
    }
  ]);

  // Handle SpeechSynthesis audio cleanup
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle Auto-Scrolling of chat area when new answers or questions drop in
  useEffect(() => {
    if (learnTab === 'ai') {
      const logger = document.getElementById('ai-chat-scroller');
      if (logger) {
        logger.scrollTop = logger.scrollHeight;
      }
    }
  }, [aiChat, aiLoading, learnTab]);

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
        setTimeout(() => setMicError(null), 3000);
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

  const processChatImage = (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setAiChat(prev => [...prev, { 
        sender: 'siri', 
        text: `⚠️ Attachment Error: Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image smaller than 10MB limit.`, 
        id: `err-${Date.now()}` 
      }]);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setChatInputImage(reader.result as string);
      gameAudio.playClick();
    };
    reader.readAsDataURL(file);
  };

  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processChatImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processChatImage(file);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processChatImage(file);
            break;
          }
        }
      }
    }
  };

  const handleSendQuery = async (queryToSend?: string) => {
    const textQuery = queryToSend || aiQuery;
    const sendingImage = chatInputImage;
    if (!textQuery.trim() && !sendingImage) return;

    gameAudio.playClick();
    handleStopSpeaking();

    // Check if prompt is requesting image visualization/creation
    const isImageRequest = !sendingImage && /generate\s*(an?)?\s*image|create\s*(an?)?\s*image|make\s*(an?)?\s*image|generate\s*(an?)?\s*picture|create\s*(an?)?\s*picture|make\s*(an?)?\s*picture|draw|paint|visualize|show\s*(an?)?\s*image|show\s*(an?)?\s*picture|illustration|create\s*a\s*visual|photo|sketch|render/i.test(textQuery);

    const userMessage = { 
      sender: 'user' as const, 
      text: textQuery || "Scanned image attachment", 
      id: `user-${Date.now()}`,
      imageUrl: sendingImage || undefined 
    };
    setAiChat(prev => [...prev, userMessage]);
    setAiQuery('');
    setChatInputImage(null);
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
          image: sendingImage || undefined,
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

  const closeLearnSkudo = () => {
    gameAudio.playClick();
    setShowLearnModal(false);
    handleStopSpeaking();
    setIsListening(false);
  };

  // Local storage properties matching GameInterface handles
  const [dailyHighScore, setDailyHighScore] = useState<number>(0);
  const [weeklyHighScore, setWeeklyHighScore] = useState<number>(0);
  const [lastPlayedDaily, setLastPlayedDaily] = useState<number>(0);
  const [lastPlayedWeekly, setLastPlayedWeekly] = useState<number>(0);

  // Visualization Sandbox states
  const [vizCell, setVizCell] = useState<{ r: number; c: number } | null>({ r: 4, c: 4 });
  const [vizMode, setVizMode] = useState<'numbers' | 'letters'>('numbers');

  useEffect(() => {
    // Synchronize highscore limits and timestamps from same workspace database
    const dScore = localStorage.getItem('skudo_daily_highscore');
    const wScore = localStorage.getItem('skudo_weekly_highscore');
    const dLast = localStorage.getItem('skudo_last_played_daily');
    const wLast = localStorage.getItem('skudo_last_played_weekly');

    if (dScore) setDailyHighScore(parseInt(dScore, 10));
    if (wScore) setWeeklyHighScore(parseInt(wScore, 10));
    if (dLast) setLastPlayedDaily(parseInt(dLast, 10));
    if (wLast) setLastPlayedWeekly(parseInt(wLast, 10));

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Time remaining calculator
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
    return `${days[d.getDay()]} • ${months[d.getMonth()]} ${d.getDate()}`;
  };

  const getFormattedDateWeekly = () => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Week starting ${months[sunday.getMonth()]} ${sunday.getDate()}`;
  };

  const handleSelectMode = (mode: GameMode) => {
    gameAudio.playClick();
    onSelect(mode);
  };

  const handleSelectDaily = () => {
    if (timeLeftDaily > 0) return;
    gameAudio.playClick();
    
    const nowTs = Date.now();
    localStorage.setItem('skudo_last_played_daily', nowTs.toString());
    onSelectSpecial('daily');
  };

  const handleSelectWeekly = () => {
    if (timeLeftWeekly > 0) return;
    gameAudio.playClick();
    
    const nowTs = Date.now();
    localStorage.setItem('skudo_last_played_weekly', nowTs.toString());
    onSelectSpecial('weekly');
  };

  const openLearnSkudo = () => {
    gameAudio.playClick();
    setShowLearnModal(true);
  };

  const openSiriAI = () => {
    gameAudio.playClick();
    setLearnTab('ai');
    setShowLearnModal(true);
  };

  // Advanced Visualizer Database Sandbox
  const mockVizBoard = [
    [5, 3, 0,  0, 7, 0,  0, 0, 0],
    [6, 0, 0,  1, 9, 5,  0, 0, 0],
    [0, 9, 8,  0, 0, 0,  0, 6, 0],

    [8, 0, 0,  0, 6, 0,  0, 0, 3],
    [4, 0, 0,  8, 0, 3,  0, 0, 1],
    [7, 0, 0,  0, 2, 0,  0, 0, 6],

    [0, 6, 0,  0, 0, 0,  2, 8, 0],
    [0, 0, 0,  4, 1, 9,  0, 0, 5],
    [0, 0, 0,  0, 8, 0,  0, 7, 9]
  ];

  const getDeductionDetails = (r: number, c: number) => {
    const originalValue = mockVizBoard[r][c];
    if (originalValue > 0) {
      return {
        originalValue,
        isGiven: true,
        rowConflicts: [],
        colConflicts: [],
        boxConflicts: [],
        candidates: [originalValue]
      };
    }

    const rowVals = new Set<number>();
    const colVals = new Set<number>();
    const boxVals = new Set<number>();

    // Row Conflict scan
    for (let i = 0; i < 9; i++) {
      if (mockVizBoard[r][i] > 0) rowVals.add(mockVizBoard[r][i]);
    }
    // Col Conflict scan
    for (let i = 0; i < 9; i++) {
      if (mockVizBoard[i][c] > 0) colVals.add(mockVizBoard[i][c]);
    }
    // Box Conflict scan
    const bi = Math.floor(r / 3) * 3;
    const bj = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const val = mockVizBoard[bi + i][bj + j];
        if (val > 0) boxVals.add(val);
      }
    }

    const allConflicts = new Set([...rowVals, ...colVals, ...boxVals]);
    const candidates: number[] = [];
    for (let v = 1; v <= 9; v++) {
      if (!allConflicts.has(v)) candidates.push(v);
    }

    return {
      originalValue: 0,
      isGiven: false,
      rowConflicts: Array.from(rowVals),
      colConflicts: Array.from(colVals),
      boxConflicts: Array.from(boxVals),
      candidates
    };
  };

  const getCellLabel = (val: number) => {
    if (!val) return '';
    if (vizMode === 'letters') {
      return String.fromCharCode(64 + val); // 1->A, 2->B...
    }
    return val.toString();
  };

  const vizDetails = vizCell ? getDeductionDetails(vizCell.r, vizCell.c) : null;

  // Dynamic Logical Rating score calculation (ELO concept)
  const logicRating = Math.max(100, 1000 + (profile.completedGames * 25) - (Math.max(0, profile.totalGames - profile.completedGames) * 12));

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 items-center px-4" id="mode-selection-container">
      {/* Title Header */}
      <div className="text-center max-w-md">
        <span className="text-[10px] uppercase tracking-wider text-[#87CEEB] font-bold">
          Select Game Mode
        </span>
        <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#4A5568] mt-1">
          Choose Your Canvas
        </h2>
        <p className="text-xs text-[#4A5568]/60 mt-2 font-medium">
          Play traditional numeric Sudoku or challenge yourself with sequential A-I letter tracking.
        </p>
      </div>

      {/* Elegant Player Profile HUD Dashboard */}
      <div 
        className="w-full bg-white/70 backdrop-blur-md border border-white rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch justify-between gap-4 relative overflow-hidden"
        id="player-hub-stats-panel"
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#4DA6FF]/10 rounded-full blur-xl pointer-events-none" />
        
        {/* Left Side: Avatar and Info */}
        <div className="flex items-center gap-3.5 pr-4 md:border-r border-slate-200/50 md:max-w-[240px] shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#4DA6FF] to-[#009DFF] flex items-center justify-center font-extrabold text-white text-lg shadow-xs select-none shrink-0 border border-white/20 overflow-hidden">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              profile.name ? profile.name.charAt(0).toUpperCase() : 'S'
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1 leading-none">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Active Solver
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <h3 className="font-sans text-sm font-black text-slate-700 truncate" id="hud-profile-name">
                {profile.name}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="px-1.5 py-0.5 bg-sky-50 text-[#009DFF] border border-sky-100 rounded text-[9.5px] font-black uppercase tracking-wider leading-none">
                {profile.experience}
              </span>
              <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded text-[9.5px] font-black uppercase tracking-wider leading-none">
                Lvl {Math.floor((profile.xp || 0) / 250) + 1} ({profile.xp || 0} XP)
              </span>
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9.5px] font-black uppercase tracking-wider leading-none">
                ★ {logicRating} Rating
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Simple grid-based player statistics */}
        <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-2.5 items-center justify-stretch">
          {/* Played Stat */}
          <div className="bg-slate-100/50 hover:bg-slate-100/80 border border-slate-200/40 p-2 rounded-xl flex flex-col items-center justify-center transition text-center group min-w-0">
            <Activity className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#4DA6FF] shrink-0 mb-1 transition-transform group-hover:scale-110" />
            <span className="text-[6.5px] sm:text-[8px] uppercase font-bold tracking-wide text-slate-400 group-hover:text-[#4DA6FF] transition mb-1 select-none leading-none w-full truncate">
              Played
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-slate-700 leading-none" id="hud-stat-played">
              {profile.totalGames}
            </span>
          </div>

          {/* Won Stat */}
          <div className="bg-slate-100/50 hover:bg-slate-100/80 border border-slate-200/40 p-2 rounded-xl flex flex-col items-center justify-center transition text-center group min-w-0">
            <Award className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mb-1 transition-transform group-hover:scale-110" />
            <span className="text-[6.5px] sm:text-[8px] uppercase font-bold tracking-wide text-slate-400 group-hover:text-emerald-500 transition mb-1 select-none leading-none w-full truncate">
              Victories
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-emerald-600 leading-none" id="hud-stat-won">
              {profile.completedGames}
            </span>
          </div>

          {/* Lost Stat */}
          <div className="bg-slate-100/50 hover:bg-slate-100/80 border border-slate-200/40 p-2 rounded-xl flex flex-col items-center justify-center transition text-center group min-w-0">
            <XCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-red-400 shrink-0 mb-1 transition-transform group-hover:scale-110" />
            <span className="text-[6.5px] sm:text-[8px] uppercase font-bold tracking-wide text-slate-400 group-hover:text-red-500 transition mb-1 select-none leading-none w-full truncate">
              Defeats
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-red-500 leading-none" id="hud-stat-lost">
              {Math.max(0, profile.totalGames - profile.completedGames)}
            </span>
          </div>

          {/* Ratio Stat */}
          <div className="bg-slate-100/50 hover:bg-slate-100/80 border border-slate-200/40 p-2 rounded-xl flex flex-col items-center justify-center transition text-center group min-w-0">
            <Shield className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#4DA6FF] shrink-0 mb-1 transition-transform group-hover:scale-110" />
            <span className="text-[6.5px] sm:text-[8px] uppercase font-bold tracking-wide text-slate-400 group-hover:text-[#4DA6FF] transition mb-1 select-none leading-none w-full truncate">
              Success
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-slate-700 leading-none" id="hud-stat-winrate">
              {profile.totalGames > 0 ? Math.round((profile.completedGames / profile.totalGames) * 100) : 0}%
            </span>
          </div>

          {/* Streak Stat */}
          <div className="bg-slate-100/50 hover:bg-slate-100/80 border border-slate-200/40 p-2 rounded-xl flex flex-col items-center justify-center transition text-center group min-w-0">
            <Flame className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-500 animate-pulse shrink-0 mb-1 transition-transform group-hover:scale-115" />
            <span className="text-[6.5px] sm:text-[8px] uppercase font-bold tracking-wide text-slate-400 group-hover:text-amber-500 transition mb-1 select-none leading-none w-full truncate">
              Streak
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-600 leading-none flex items-center gap-1 justify-center" id="hud-stat-streak">
              {profile.streak} <span className="text-[9px]">🔥</span>
            </span>
          </div>

          {/* Skudo AI Quick Button */}
          <button
            onClick={openSiriAI}
            className="group/siri relative overflow-hidden bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col items-center justify-center transition text-center cursor-pointer hover:shadow-cyan-500/10 hover:border-cyan-500/50 min-w-0"
          >
            {/* Pulsing visual element */}
            <span className="absolute inset-0 bg-sky-500/5 group-hover/siri:bg-sky-500/10 transition" />
            <Bot className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#4DA6FF] animate-pulse shrink-0 mb-1 transition-transform group-hover/siri:scale-110" />
            <span className="text-[6.5px] sm:text-[8px] uppercase font-bold tracking-wide text-slate-400 group-hover/siri:text-[#4DA6FF] transition mb-1 select-none leading-none w-full truncate">
              Skudo AI
            </span>
            <span className="text-[9.5px] sm:text-[11px] font-sans font-black text-white group-hover/siri:scale-105 transition leading-none truncate w-full">
              Ask AI
            </span>
          </button>
        </div>
      </div>

      {/* Primary Row Grid: Left (Numbers Card) and Right (A-I Letters Card) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full" id="modes-grid">
        {/* Numbers Mode Card */}
        <motion.button
          onClick={() => handleSelectMode('numbers')}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.99 }}
          className="p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 shadow-md text-left cursor-pointer flex flex-col items-start gap-3 transition group outline-none"
          id="mode-numbers-card"
        >
          <div className="p-3 bg-white/60 text-[#4DA6FF] border border-white group-hover:bg-white transition duration-200 rounded-xl">
            <Hash className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-[#4A5568]">Numbers Mode</h3>
            <p className="text-xs text-[#4A5568]/60 font-sans leading-relaxed">
              Classical format using digits 1 to 9. Best for traditional speedrunning, mental focus, and standard math puzzle rules.
            </p>
          </div>
        </motion.button>

        {/* A-I Mode Card */}
        <motion.button
          onClick={() => handleSelectMode('letters')}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.99 }}
          className="p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 shadow-md text-left cursor-pointer flex flex-col items-start gap-3 transition group outline-none"
          id="mode-letters-card"
        >
          <div className="p-3 bg-white/60 text-[#4DA6FF] border border-white group-hover:bg-white transition duration-200 rounded-xl">
            <AlignLeft className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-[#4A5568]">A-I Mode</h3>
            <p className="text-xs text-[#4A5568]/60 font-sans leading-relaxed">
              Alphabetical sequential format using letters A to I. Rewires your muscle-memory, offering a refreshing cognitive challenge.
            </p>
          </div>
        </motion.button>
      </div>

      {/* Rectangular Competitive Options (Daily Puzzle & Weekly Competition) BELOW normal Modes */}
      <div className="w-full flex flex-col gap-4 mt-1" id="competitive-modes-section">
        <div className="flex items-center gap-1.5 text-[9px] text-[#87CEEB] font-black uppercase tracking-wider pl-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Limited High-Stakes Solitaire Leagues</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Daily Puzzle Rectangular Card */}
          <div 
            className="p-4 bg-gradient-to-br from-[#E0F2FE]/50 to-white/60 border border-white/80 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden"
            id="rectangular-daily-mode"
          >
            {/* Top Info section */}
            <div className="flex flex-col mb-3">
              <div className="text-[10px] font-black tracking-wide text-[#009DFF] uppercase mb-0.5" id="daily-top-meta">
                📆 {getFormattedDateDaily()}
              </div>
              <div className="flex flex-wrap justify-between items-center gap-1.5 text-[10.5px] border-b border-white/30 pb-1.5">
                <span className="font-extrabold text-slate-700">Daily Solitaire Puzzle</span>
                <span className="font-black text-[#009DFF] bg-white/70 px-1.5 py-0.5 rounded text-[9.5px]">
                  Peak today: {dailyHighScore > 0 ? `${dailyHighScore} pts` : "0"}
                </span>
              </div>
            </div>

            {/* Bottom Button Action */}
            {timeLeftDaily > 0 ? (
              <div className="flex items-center justify-between mt-1 gap-2">
                <div className="flex items-center gap-1 text-red-500 text-[9.5px] font-black uppercase tracking-wider animate-pulse font-mono">
                  <Lock className="w-3 h-3" /> Locked
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-bold bg-white/40 px-2 py-0.5 rounded border border-white/20">
                  Resets in: {formatCountdown(timeLeftDaily)}
                </span>
              </div>
            ) : (
              <button
                onClick={handleSelectDaily}
                className="w-full py-2 bg-gradient-to-r from-[#4DA6FF] to-[#009DFF] hover:from-[#3BA7FF] hover:to-[#008CE6] text-white text-[11px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Play className="w-3 h-3 fill-white" />
                Play Daily (Focus level)
              </button>
            )}
          </div>

          {/* Weekly Competition Rectangular Card */}
          <div 
            className="p-4 bg-gradient-to-br from-[#F5F3FF]/50 to-white/60 border border-white/80 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden"
            id="rectangular-weekly-mode"
          >
            {/* Top Info section */}
            <div className="flex flex-col mb-3">
              <div className="text-[10px] font-black tracking-wide text-violet-500 uppercase mb-0.5" id="weekly-top-meta">
                🗓️ {getFormattedDateWeekly()}
              </div>
              <div className="flex flex-wrap justify-between items-center gap-1.5 text-[10.5px] border-b border-white/30 pb-1.5">
                <span className="font-extrabold text-slate-700">Weekly Grand Championship</span>
                <span className="font-black text-violet-600 bg-white/70 px-1.5 py-0.5 rounded text-[9.5px]">
                  Peak week: {weeklyHighScore > 0 ? `${weeklyHighScore} pts` : "0"}
                </span>
              </div>
            </div>

            {/* Bottom Button Action */}
            {timeLeftWeekly > 0 ? (
              <div className="flex items-center justify-between mt-1 gap-2">
                <div className="flex items-center gap-1 text-red-500 text-[9.5px] font-black uppercase tracking-wider animate-pulse font-mono">
                  <Lock className="w-3 h-3" /> Locked
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-bold bg-white/40 px-2 py-0.5 rounded border border-white/20">
                  Resets in: {formatCountdown(timeLeftWeekly)}
                </span>
              </div>
            ) : (
              <button
                onClick={handleSelectWeekly}
                className="w-full py-2 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Trophy className="w-3 h-3" />
                Compete (Quantum level)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LEARN SKUDO Long Rectangular Box at the bottom */}
      <button
        onClick={openLearnSkudo}
        className="w-full p-4.5 bg-gradient-to-r from-slate-50/80 via-white/40 to-slate-50/80 hover:bg-slate-50/100 border border-dashed border-slate-300 rounded-2xl flex items-center justify-between text-left cursor-pointer transition group mt-3 relative overflow-hidden"
        id="learn-skudo-long-btn"
      >
        <div className="absolute top-0 right-0 p-2 text-sky-400 bg-sky-50/20 border-l border-b border-sky-100 rounded-bl-xl opacity-0 group-hover:opacity-100 transition duration-150">
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-white shadow-xs text-[#4DA6FF] border border-slate-200 group-hover:border-sky-300 rounded-xl-lg transition">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h4 className="font-bold text-slate-600 text-sm flex flex-wrap items-center gap-1.5">
              <span>LEARN SKUDO RULES & POSSIBILITIES</span>
              <span className="px-2 py-0.5 text-[8.5px] uppercase bg-[#E0F2FE] text-[#009DFF] rounded font-black tracking-widest leading-none shrink-0">Interactive Wiki</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug font-sans mt-0.5">
              Explore terms, conditions, regulations, and dynamic scanning techniques with our live deduction sandbox.
            </p>
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-[#4DA6FF] group-hover:translate-x-1 transition duration-200" />
      </button>

      {/* LEARN SKUDO MODAL DIALOG DRAWER WITH INTERACTIVE VISUALIZATION SANDBOX */}
      <AnimatePresence>
        {showLearnModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/60 shadow-2xl relative"
              id="learn-skudo-modal"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#4DA6FF] text-white rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#4A5568] text-base leading-none">Skudo Academy Hub</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Rules, Regulations & Live Visualizer</p>
                  </div>
                </div>
                <button
                  onClick={closeLearnSkudo}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition duration-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs list */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 text-[10px] sm:text-xs font-semibold text-slate-500">
                <button
                  onClick={() => setLearnTab('rules')}
                  className={`flex-1 py-3 border-b-2 text-center font-bold tracking-wider uppercase transition cursor-pointer ${
                    learnTab === 'rules'
                      ? 'border-[#4DA6FF] text-[#4DA6FF] bg-white font-black'
                      : 'border-transparent hover:bg-slate-100/50'
                  }`}
                >
                  📖 Rules
                </button>
                <button
                  onClick={() => setLearnTab('terms')}
                  className={`flex-1 py-3 border-b-2 text-center font-bold tracking-wider uppercase transition cursor-pointer ${
                    learnTab === 'terms'
                      ? 'border-[#4DA6FF] text-[#4DA6FF] bg-white font-black'
                      : 'border-transparent hover:bg-slate-100/50'
                  }`}
                >
                  🛡️ Limits
                </button>
                <button
                  onClick={() => setLearnTab('techniques')}
                  className={`flex-1 py-3 border-b-2 text-center font-bold tracking-wider uppercase transition cursor-pointer ${
                    learnTab === 'techniques'
                      ? 'border-[#4DA6FF] text-[#4DA6FF] bg-white font-black'
                      : 'border-transparent hover:bg-slate-100/50'
                  }`}
                >
                  💡 Sandbox
                </button>
                <button
                  onClick={() => setLearnTab('ai')}
                  className={`flex-1 py-3 border-b-2 text-center font-bold tracking-wider uppercase transition cursor-pointer ${
                    learnTab === 'ai'
                      ? 'border-[#4DA6FF] text-[#4DA6FF] bg-white font-black'
                      : 'border-transparent hover:bg-slate-100/50'
                  }`}
                >
                  🎙️ Skudo AI
                </button>
              </div>

              {/* Scrollable Core content */}
              <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]" id="learn-skudo-content-body">
                {/* Tab: Rules */}
                {learnTab === 'rules' && (
                  <div className="flex flex-col gap-5 animate-fade-in">
                    <div>
                      <h4 className="font-extrabold text-[#4A5568] text-sm uppercase tracking-wider mb-1">The Golden Rule of Sudoku</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        SKUDO is a logical deduction puzzle. The interface supports two modes: <strong className="text-[#009DFF]">Numbers Mode</strong> (focusing on digits 1 through 9) and <strong className="text-violet-500">A-I Mode</strong> (focusing on alphabetical letters A through I).
                        The objective remains identical in both contexts: populate the 9x9 grid cells so that every column, row, and 3x3 region contains all nine elements.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-black text-amber-600 tracking-wider">01. Row Restriction</span>
                        <p className="text-[11.5px] text-amber-800 font-medium leading-relaxed">
                          No repeating characters inside the same horizontal layout of 9 squares.
                        </p>
                      </div>

                      <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-black text-sky-600 tracking-wider">02. Column Restriction</span>
                        <p className="text-[11.5px] text-sky-800 font-medium leading-relaxed">
                          No repeating characters inside the same vertical column of 9 squares.
                        </p>
                      </div>

                      <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-2xl flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-black text-violet-600 tracking-wider">03. Region Restriction</span>
                        <p className="text-[11.5px] text-violet-800 font-medium leading-relaxed">
                          No repeating characters inside any outlined 3x3 box grid.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start mt-2">
                      <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-xs text-slate-700">Did you know?</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-sans mt-0.5">
                          Unlike math or spelling competitions, SKUDO requires NO calculations or pre-existing words. It is purely a pattern recognition and deduction layout. It serves to refresh cognitive pathways, making it the perfect daytime meditation utility.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Terms & Conditions */}
                {learnTab === 'terms' && (
                  <div className="flex flex-col gap-5 animate-fade-in">
                    <div>
                      <h4 className="font-extrabold text-[#4A5568] text-sm uppercase tracking-wider mb-1">Mistake Quotas, Undos, & Hints</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        To cultivate different meditation and focusing states, SKUDO enforces special resource allocations based meticulously on the active difficulty tier.
                      </p>
                    </div>

                    {/* Table styling */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white mt-1">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <th className="p-3">Difficulty Level</th>
                            <th className="p-3 text-center">Max Mistakes</th>
                            <th className="p-3 text-center">Hints Limit</th>
                            <th className="p-3 text-center">Erases Allowed</th>
                            <th className="p-3 text-center">Undos Allowed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-3 font-extrabold"><span className="text-emerald-500">Zen</span></td>
                            <td className="p-3 text-center">5 Mistakes</td>
                            <td className="p-3 text-center">5</td>
                            <td className="p-3 text-center">3</td>
                            <td className="p-3 text-center">3</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-3 font-extrabold"><span className="text-sky-500">Flow</span></td>
                            <td className="p-3 text-center">3 Mistakes</td>
                            <td className="p-3 text-center">3</td>
                            <td className="p-3 text-center">2</td>
                            <td className="p-3 text-center">2</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-3 font-extrabold"><span className="text-amber-500">Focus</span></td>
                            <td className="p-3 text-center">3 Mistakes</td>
                            <td className="p-3 text-center">2</td>
                            <td className="p-3 text-center">1</td>
                            <td className="p-3 text-center">1</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50 bg-red-50/20">
                            <td className="p-3 font-extrabold"><span className="text-red-500">Quantum</span></td>
                            <td className="p-3 text-center">2 Mistakes</td>
                            <td className="p-3 text-center"><span className="text-red-500 font-black">0</span></td>
                            <td className="p-3 text-center"><span className="text-red-500 font-black">0</span></td>
                            <td className="p-3 text-center"><span className="text-red-500 font-black">0</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start mt-2">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-xs text-amber-800">Quantum Mode Regulations</h5>
                        <p className="text-xs text-amber-900/80 leading-relaxed font-sans mt-0.5">
                          Quantum mode represents the ultimate focus challenge. You are left entirely with your own deducing capabilities. There are NO tools. You can make AT MOST 1 mistake—making a 2nd mistake results in an immediate game failure.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Techniques & Live Visualization */}
                {learnTab === 'techniques' && (
                  <div className="flex flex-col gap-5 animate-fade-in">
                    <div>
                      <h4 className="font-extrabold text-[#4A5568] text-sm uppercase tracking-wider mb-1">Possibility Deduction Sandbox</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        Hover or click any cell in our custom interactive board to run real-time intersection logic. It demonstrates how scanning rows and columns immediately eliminates candidates.
                      </p>
                    </div>

                    {/* Interactive Sandbox Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      {/* Left: Intersecting Board */}
                      <div className="md:col-span-6 flex flex-col items-center gap-3">
                        <div className="flex justify-between items-center w-full max-w-[260px] text-[10px] font-bold text-slate-500 bg-white border px-3 py-1 rounded-xl shadow-xs">
                          <span>Sandbox View:</span>
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border">
                            <button 
                              onClick={() => setVizMode('numbers')}
                              className={`px-2 py-0.5 rounded text-[9.5px] cursor-pointer ${vizMode === 'numbers' ? 'bg-[#009DFF] text-white' : 'hover:bg-slate-200'}`}
                            >
                              1-9
                            </button>
                            <button 
                              onClick={() => setVizMode('letters')}
                              className={`px-2 py-0.5 rounded text-[9.5px] cursor-pointer ${vizMode === 'letters' ? 'bg-[#009DFF] text-white' : 'hover:bg-slate-200'}`}
                            >
                              A-I
                            </button>
                          </div>
                        </div>

                        {/* Beautiful interactive 9x9 viz board */}
                        <div className="grid grid-cols-9 border-2 border-slate-700 bg-white shadow-md p-[1px] select-none" style={{ width: '260px', height: '260px' }}>
                          {mockVizBoard.map((row, r) => 
                            row.map((val, c) => {
                              const isRowIntersected = vizCell && vizCell.r === r;
                              const isColIntersected = vizCell && vizCell.c === c;
                              const isFocused = vizCell && vizCell.r === r && vizCell.c === c;
                              
                              // Determine if cell is in same 3x3 region as focused
                              const isSameRegion = vizCell && (Math.floor(vizCell.r / 3) === Math.floor(r / 3)) && (Math.floor(vizCell.c / 3) === Math.floor(c / 3));

                              return (
                                <div
                                  key={`${r}-${c}`}
                                  onClick={() => setVizCell({ r, c })}
                                  className={`aspect-square flex items-center justify-center font-bold text-xs cursor-pointer border transition duration-100 ${
                                    isFocused
                                      ? 'bg-amber-300 border-amber-500 text-slate-850 z-10 scale-105 shadow-md'
                                      : isSameRegion
                                      ? 'bg-sky-50 border-sky-100/40 text-slate-700'
                                      : isRowIntersected || isColIntersected
                                      ? 'bg-sky-100/70 border-sky-200 text-slate-700'
                                      : 'bg-white border-slate-150 text-slate-600'
                                  } ${
                                    c === 2 || c === 5 ? 'border-r-2 border-r-slate-700' : ''
                                  } ${
                                    r === 2 || r === 5 ? 'border-b-2 border-b-slate-700' : ''
                                  }`}
                                  style={{ borderCollapse: 'collapse' }}
                                >
                                  {getCellLabel(val)}
                                </div>
                              );
                            })
                          )}
                        </div>
                        <span className="text-[9.5px] italic text-slate-400 font-bold">💡 Tip: click any cell on the board above</span>
                      </div>

                      {/* Right: Analyzer details */}
                      <div className="md:col-span-6 flex flex-col gap-4 self-stretch justify-center">
                        {vizCell && vizDetails && (
                          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex flex-col gap-3 shadow-xs h-full justify-between">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] uppercase font-black text-[#87CEEB] tracking-wider leading-none">
                                Real-time Intersection Engine
                              </span>
                              <h5 className="font-extrabold text-[#4A5568] text-xs leading-none">
                                Square Coordinates: [Row {vizCell.r + 1}, Column {vizCell.c + 1}]
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-normal font-sans mt-1">
                                {vizDetails.isGiven 
                                  ? `This cell contains a pre-solved starting value of "${getCellLabel(vizDetails.originalValue)}". It is anchored and cannot be changed.`
                                  : `This cell is empty. Let's analyze row, column, and box values to see what cannot go here.`
                                }
                              </p>
                            </div>

                            {!vizDetails.isGiven && (
                              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                                {/* Intersecting conflicts info */}
                                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                                  <span className="text-slate-400">Row conflicts:</span>
                                  {vizDetails.rowConflicts.length > 0 ? (
                                    <div className="flex gap-1">
                                      {vizDetails.rowConflicts.map(v => (
                                        <span key={v} className="bg-slate-100 px-1 rounded text-slate-600 font-mono">{getCellLabel(v)}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-emerald-500">None</span>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                                  <span className="text-slate-400">Col conflicts:</span>
                                  {vizDetails.colConflicts.length > 0 ? (
                                    <div className="flex gap-1">
                                      {vizDetails.colConflicts.map(v => (
                                        <span key={v} className="bg-slate-100 px-1 rounded text-slate-600 font-mono">{getCellLabel(v)}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-emerald-500">None</span>
                                  )}
                                </div>

                                {/* Active candidates deduction */}
                                <div className="bg-[#E0F2FE]/50 border border-[#E0F2FE] p-2.5 rounded-xl flex flex-col gap-1 mt-1">
                                  <span className="text-[9.5px] uppercase font-black text-[#009DFF] tracking-wider leading-none">Active Candidates Available:</span>
                                  <div className="flex gap-1.5 mt-1">
                                    {vizDetails.candidates.length > 0 ? (
                                      vizDetails.candidates.map(v => (
                                        <span key={v} className="bg-white border border-sky-100 px-2 py-0.5 rounded-md text-[#009DFF] font-black text-[11px] font-mono shadow-xs">{getCellLabel(v)}</span>
                                      ))
                                    ) : (
                                      <span className="text-red-500 text-[10px] font-extrabold font-sans">No candidates left (error conflict on board)</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {vizDetails.isGiven && (
                              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-[11px] font-semibold">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span>Starting clue locked in play. Use scanning on cross rows to discover solutions!</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Skudo AI Assistant */}
                {learnTab === 'ai' && (
                  <div className="flex flex-col gap-4 animate-fade-in" id="ai-skudo-tab-content" style={{ height: '380px' }}>
                    <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 h-full">
                      
                      {/* Left: Skudo Glowing Voice Orbit Card */}
                      <div className="w-full md:w-[240px] bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 flex flex-col items-center justify-between shadow-lg relative overflow-hidden shrink-0">
                        <div className="text-center w-full z-10">
                          <span className="text-[8px] uppercase font-black tracking-widest text-[#4DA6FF] bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-full select-none">
                            Skudo Logic Brain
                          </span>
                          <h4 className="font-extrabold text-white text-xs mt-2 font-mono flex items-center justify-center gap-1">
                            <Bot className="w-3.5 h-3.5 text-emerald-400" />
                            Skudo AI
                          </h4>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-sans">
                            Voice & Text Logic Assistant
                          </p>
                        </div>

                        {/* Beautiful Glowing Interactive Voice Core Wave */}
                        <div className="my-1.5 relative flex items-center justify-center z-10 w-24 h-24 shrink-0">
                          <div className={`absolute rounded-full bg-[#4DA6FF]/15 border border-[#4DA6FF]/30 transition-all duration-300 ${
                            isListening ? 'w-24 h-24 animate-ping' : isSpeaking ? 'w-20 h-20 scale-[1.1] opacity-70' : 'w-16 h-16 opacity-30'
                          }`} style={{ animationDuration: '1.2s' }} />

                          {/* Sound wave visual bar animations */}
                          {(isListening || isSpeaking) && (
                            <div className="absolute flex gap-1 items-center justify-center z-20">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                  key={i}
                                  className={`w-0.5 rounded-full ${isListening ? 'bg-cyan-400' : 'bg-emerald-400'}`}
                                  animate={{
                                    height: isListening ? [6, 24, 6] : [4, 16, 4]
                                  }}
                                  transition={{
                                    duration: 0.4 + i * 0.1,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                              ))}
                            </div>
                          )}

                          {/* Central Pulsing Sphere Button */}
                          <button
                            onClick={handleMicrophoneClick}
                            disabled={aiLoading}
                            title="Click to dictate using Microphone"
                            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer border z-30 ${
                              isListening 
                                ? 'bg-red-500 border-red-450 hover:bg-red-600 text-white animate-pulse'
                                : isSpeaking
                                ? 'bg-emerald-500 border-emerald-450 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                                : 'bg-[#4DA6FF] border-[#4DA6FF] hover:bg-[#3BA7FF] text-white hover:scale-105'
                            }`}
                          >
                            <Mic className="w-5 h-5 text-white" />
                          </button>
                        </div>

                        {/* Interactive Status Footer */}
                        <div className="text-center w-full z-10">
                          {micError ? (
                            <span className="text-[9px] text-red-400 font-bold block leading-snug">
                              {micError}
                            </span>
                          ) : isListening ? (
                            <span className="text-[9px] text-red-400 font-bold tracking-widest block uppercase animate-pulse">
                              🎤 Skudo AI is listening...
                            </span>
                          ) : isSpeaking ? (
                            <div className="flex flex-col gap-1 items-center">
                              <span className="text-[9px] text-emerald-400 font-bold tracking-wide uppercase block">
                                🔊 Speaking result...
                              </span>
                              <button 
                                onClick={handleStopSpeaking}
                                className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-white font-mono text-[8px] rounded-lg cursor-pointer"
                              >
                                Stop Voice
                              </button>
                            </div>
                          ) : (
                            <div className="text-[8.5px] text-slate-400">
                              <span>Ask Skudo or dictate mic:</span>
                              <span className="block font-sans font-black text-[#4DA6FF] hover:underline cursor-pointer mt-0.5 truncate" onClick={() => {
                                setAiQuery("Give me a Sudoku tip for beginners");
                              }}>
                                "Give me a Sudoku tip!"
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Scrollable conversation bubble dashboard */}
                      <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex flex-col min-h-0 h-full">
                        {/* Messages Area with drag-and-drop support */}
                        <div 
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`flex-1 overflow-y-auto mb-2 pr-1 flex flex-col gap-2.5 scrollbar-thin relative transition-all duration-200 ${
                            isDraggingImage ? 'bg-sky-500/10 border border-dashed border-[#4DA6FF] rounded-xl p-2' : ''
                          }`} 
                          id="ai-chat-scroller"
                        >
                          {isDraggingImage && (
                            <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-50 pointer-events-none rounded-xl">
                              <Image className="w-8 h-8 text-[#4DA6FF] animate-bounce mb-1" />
                              <p className="text-xs font-black text-white uppercase tracking-wider">Drop Image To Scan</p>
                              <p className="text-[10px] text-slate-300">Skudo Omni AI will analyze it instantly</p>
                            </div>
                          )}
                          {aiChat.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[85%] ${
                                msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                              }`}
                            >
                              <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 px-1">
                                {msg.sender === 'user' ? 'You' : 'Skudo AI'}
                                {msg.sender === 'siri' && (
                                  <button
                                    onClick={() => speakText(msg.text)}
                                    title="Listen to result"
                                    className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-[#4DA6FF] rounded transition cursor-pointer"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div
                                className={`p-2.5 rounded-xl text-[11px] leading-relaxed font-sans shadow-2xs whitespace-pre-line ${
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
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 px-1">
                                Skudo AI is thinking...
                              </span>
                              <div className="p-2.5 bg-white text-slate-500 rounded-xl rounded-tl-none border border-slate-100 flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4DA6FF]" />
                                <span className="text-[10px] font-semibold">Tuning logical engines...</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom suggestions chips */}
                        <div className="flex gap-1 mb-2 overflow-x-auto pb-0.5 shrink-0 scrollbar-none text-[9.5px]">
                          {[
                            "How is Skudo played?",
                            "What is a Naked Pair?",
                            "Explain relativity in one sentence",
                            "Generate an image of a cybernetic sudoku machine",
                            "🍰 Mug cake recipe",
                            "Can I play daily twice?"
                          ].map(pill => (
                            <button
                              key={pill}
                              onClick={() => {
                                setAiQuery(pill);
                                handleSendQuery(pill);
                              }}
                              disabled={aiLoading}
                              className="px-2 py-0.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-[#4DA6FF] border border-slate-200 hover:border-sky-200 font-bold rounded-md shrink-0 transition duration-150 cursor-pointer disabled:opacity-50"
                            >
                              {pill}
                            </button>
                          ))}
                        </div>

                        {/* Image Preview Block */}
                        {chatInputImage && (
                          <div className="p-1.5 rounded-xl border border-slate-200 bg-white mb-2 shrink-0 flex items-center gap-2 w-fit max-w-full transition">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                              <img src={chatInputImage} alt="Uploaded attachment" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Scanned</p>
                              <p className="text-[8px] text-slate-400 truncate leading-tight font-semibold">Image attach active</p>
                            </div>
                            <button
                              onClick={() => {
                                setChatInputImage(null);
                                gameAudio.playClick();
                              }}
                              className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full cursor-pointer transition"
                              title="Clear image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Input bar */}
                        <div className="flex gap-1.5 shrink-0 items-center">
                          {/* Image upload selector button */}
                          <button
                            onClick={() => {
                              const uploadInput = document.getElementById('overlay-ai-file-upload');
                              if (uploadInput) uploadInput.click();
                            }}
                            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 rounded-xl cursor-pointer transition shrink-0 flex items-center justify-center"
                            title="Upload Image/Picture to scan"
                          >
                            <Image className="w-4 h-4" />
                          </button>
                          <input
                            id="overlay-ai-file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleChatImageUpload}
                            className="hidden"
                          />

                          <input
                            type="text"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendQuery();
                            }}
                            onPaste={handlePaste}
                            disabled={aiLoading}
                            placeholder={isListening ? "Listening with mic..." : "Ask Omni AI... paste/drag images!"}
                            className="flex-1 min-w-0 bg-white border border-slate-200 px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-705 focus:outline-none focus:border-[#4DA6FF] focus:ring-1 focus:ring-[#4DA6FF] transition disabled:opacity-60"
                          />
                          <button
                            onClick={() => handleSendQuery()}
                            disabled={aiLoading || (!aiQuery.trim() && !chatInputImage)}
                            className="p-2 bg-[#4DA6FF] hover:bg-[#3BA7FF] text-white rounded-xl shadow-xs hover:scale-[1.01] cursor-pointer active:scale-95 transition disabled:opacity-40"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-[9.5px] tracking-wider text-slate-400 font-bold uppercase">Skudo Engine 1.0.4 • Daydream Solitaire Studio</p>
                <button
                  onClick={closeLearnSkudo}
                  className="px-4 py-2 bg-[#4DA6FF] hover:bg-[#3BA7FF] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition"
                >
                  Close & Play
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
