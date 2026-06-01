import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Sparkles, BookOpen, Brain, Cpu, 
  Target, ChevronRight, ArrowRight, Zap, Info, Play,
  Award, GraduationCap, Compass
} from 'lucide-react';
import { SUDOKU_STRATEGIES, SudokuStrategy } from '../data/strategies';

interface StrategyAcademyProps {
  onClose: () => void;
  theme: 'light' | 'dark';
}

const LEARNING_PATH_LEVELS = [
  {
    level: 1,
    title: "Basic Singles",
    label: "Level 1: Naked Single → Hidden Single → Full House",
    color: "from-emerald-500 to-teal-500",
    border: "border-emerald-500/20",
    text: "text-emerald-500",
    bg: "bg-emerald-500/5",
    desc: "Placing immediate digits with no complex chain searching.",
    techniques: [
      { name: "Naked Single", label: "Naked Single" },
      { name: "Hidden Single", label: "Hidden Single" },
      { name: "Full House", label: "Full House" }
    ]
  },
  {
    level: 2,
    title: "Locked Intersections",
    label: "Level 2: Locked Candidates → Box-Line Reduction",
    color: "from-sky-500 to-blue-500",
    border: "border-sky-500/20",
    text: "text-sky-500",
    bg: "bg-sky-500/5",
    desc: "Learning how row-column segments project constraints into boxes.",
    techniques: [
      { name: "Locked Candidate (Pointing)", label: "Pointing Candidates" },
      { name: "Locked Candidate (Claiming)", label: "Claiming Candidates" },
      { name: "Box-Line Reduction", label: "Box-Line Reduction" }
    ]
  },
  {
    level: 3,
    title: "Symmetric Pairs & Subsets",
    label: "Level 3: Pairs → Triples → Quads",
    color: "from-cyan-500 to-sky-500",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    bg: "bg-cyan-500/5",
    desc: "Isolating groups of N candidates in N cells to clear remaining marks.",
    techniques: [
      { name: "Naked Pair", label: "Pairs (Naked)" },
      { name: "Naked Triple", label: "Triples (Naked)" },
      { name: "Naked Quad", label: "Quads (Naked)" }
    ]
  },
  {
    level: 4,
    title: "Dimensional Fish Grids",
    label: "Level 4: X-Wing → Swordfish → Jellyfish",
    color: "from-amber-500 to-orange-500",
    border: "border-amber-500/20",
    text: "text-amber-500",
    bg: "bg-amber-500/5",
    desc: "Unlocking advanced grid frameworks utilizing N x N rows and columns.",
    techniques: [
      { name: "X-Wing", label: "X-Wing" },
      { name: "Swordfish", label: "Swordfish" },
      { name: "Jellyfish", label: "Jellyfish" }
    ]
  },
  {
    level: 5,
    title: "Pincer Formations",
    label: "Level 5: XY-Wing → XYZ-Wing → WXYZ-Wing",
    color: "from-orange-500 to-red-500",
    border: "border-orange-500/20",
    text: "text-orange-500",
    bg: "bg-orange-500/5",
    desc: "Finding central pivots with branching wings to target intersections.",
    techniques: [
      { name: "XY-Wing", label: "XY-Wing" },
      { name: "XYZ-Wing", label: "XYZ-Wing" },
      { name: "WXYZ-Wing", label: "WXYZ-Wing" }
    ]
  },
  {
    level: 6,
    title: "Geometric Offsets",
    label: "Level 6: Skyscraper → Two-String Kite → Empty Rectangle",
    color: "from-pink-500 to-rose-500",
    border: "border-pink-500/20",
    text: "text-pink-500",
    bg: "bg-rose-500/5",
    desc: "Using structural geometry coordinates and bounding empty boxes.",
    techniques: [
      { name: "Skyscraper", label: "Skyscraper" },
      { name: "Two-String Kite", label: "Two-String Kite" },
      { name: "Empty Rectangle", label: "Empty Rectangle" }
    ]
  },
  {
    level: 7,
    title: "Chained Truth Systems",
    label: "Level 7: AIC → Nice Loops → Forcing Chains",
    color: "from-fuchsia-500 to-purple-500",
    border: "border-fuchsia-500/20",
    text: "text-fuchsia-400",
    bg: "bg-fuchsia-500/5",
    desc: "Connecting strong and weak link lines to form looping logic circuits.",
    techniques: [
      { name: "AIC (Alternating Inference Chains)", label: "AIC Paths" },
      { name: "Nice Loops", label: "Nice Loops" },
      { name: "Forcing Chains", label: "Forcing Chains" }
    ]
  },
  {
    level: 8,
    title: "Almost Locked Multi-Sets (ALS)",
    label: "Level 8: ALS → Sue de Coq → Death Blossom",
    color: "from-violet-500 to-indigo-505",
    border: "border-violet-500/20",
    text: "text-violet-400",
    bg: "bg-violet-500/5",
    desc: "Advanced multi-candidate units mapped onto core stem cells.",
    techniques: [
      { name: "Almost Locked Sets (ALS)", label: "ALS Multi-Sets" },
      { name: "Sue de Coq", label: "Sue de Coq" },
      { name: "Death Blossom", label: "Death Blossom" }
    ]
  },
  {
    level: 9,
    title: "Exotic Intersections",
    label: "Level 9: Exocet → Franken Fish → Mutant Fish",
    color: "from-rose-500 to-red-600",
    border: "border-rose-500/20",
    text: "text-rose-400",
    bg: "bg-rose-500/5",
    desc: "Extreme mirrored base alignments and non-standard row-column cuts.",
    techniques: [
      { name: "Exocet", label: "Exocet" },
      { name: "Franken Fish", label: "Franken Fish" },
      { name: "Mutant Fish", label: "Mutant Fish" }
    ]
  },
  {
    level: 10,
    title: "Supreme Logic Matrix",
    label: "Level 10: Kraken Fish → Advanced Nets → Template Logic",
    color: "from-yellow-500 via-amber-500 to-orange-500",
    border: "border-amber-500/25",
    text: "text-amber-400",
    bg: "bg-[#7F1D1D]/5",
    desc: "Ultimate solver depth utilizing full template overlays and dynamic nets.",
    techniques: [
      { name: "Kraken Fish", label: "Kraken Fish" },
      { name: "Dynamic Forcing Nets", label: "Advanced Nets" },
      { name: "Template Elimination", label: "Template Logic" }
    ]
  }
];

export default function StrategyAcademy({ onClose, theme }: StrategyAcademyProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('s1');
  const [showSimulatedBoard, setShowSimulatedBoard] = useState<boolean>(true);

  // Guided path active configuration
  const [activeTab, setActiveTab] = useState<'path' | 'catalog'>('path');
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);

  // Categories list matching data for Catalogue Tab
  const CATEGORIES = [
    { key: 'All', label: '📚 All (95)', color: 'border-slate-400 text-slate-500' },
    { key: 'Beginner', label: '🟢 Beginner (1-4)', color: 'border-emerald-500 text-emerald-500 bg-emerald-500/5' },
    { key: 'Easy', label: '🔵 Easy (5-7)', color: 'border-sky-500 text-sky-500 bg-sky-500/5' },
    { key: 'Intermediate', label: '🟡 Intermediate (8-17)', color: 'border-amber-500 text-amber-500 bg-amber-500/5' },
    { key: 'Advanced', label: '🟠 Advanced (18-30)', color: 'border-orange-500 text-orange-500 bg-orange-500/5' },
    { key: 'Expert', label: '🔴 Expert (31-43)', color: 'border-red-500 text-red-500 bg-red-400/5' },
    { key: 'Master', label: '🟣 Master (44-55)', color: 'border-fuchsia-500 text-fuchsia-500 bg-fuchsia-500/5' },
    { key: 'Grandmaster', label: '⚫ Grandmaster (56-68)', color: 'border-slate-600 text-slate-400 bg-slate-500/5' },
    { key: 'Extreme', label: '🔥 Extreme Elite (69-85)', color: 'border-rose-500 text-rose-500 bg-rose-500/5' },
    { key: 'Computer', label: '🤖 Computer-Level (86-95)', color: 'border-purple-500 text-purple-500 bg-purple-500/5' }
  ];

  // Robust search function matching user names to strategy objects inside SUDOKU_STRATEGIES
  const findStrategy = (techName: string): SudokuStrategy => {
    const searchName = techName.toLowerCase().trim();
    if (searchName === 'locked candidates') {
      return SUDOKU_STRATEGIES.find(s => s.name.includes('Locked Candidate (Pointing)')) || SUDOKU_STRATEGIES[0];
    }
    if (searchName === 'pairs') {
      return SUDOKU_STRATEGIES.find(s => s.name === 'Naked Pair') || SUDOKU_STRATEGIES[0];
    }
    if (searchName === 'triples') {
      return SUDOKU_STRATEGIES.find(s => s.name === 'Naked Triple') || SUDOKU_STRATEGIES[0];
    }
    if (searchName === 'quads') {
      return SUDOKU_STRATEGIES.find(s => s.name === 'Naked Quad') || SUDOKU_STRATEGIES[0];
    }
    if (searchName === 'aic') {
      return SUDOKU_STRATEGIES.find(s => s.name.includes('AIC')) || SUDOKU_STRATEGIES[0];
    }
    if (searchName === 'als') {
      return SUDOKU_STRATEGIES.find(s => s.name.startsWith('Almost Locked Sets') || s.name === 'Almost Locked Sets (ALS)') || SUDOKU_STRATEGIES[0];
    }
    if (searchName === 'advanced nets') {
      return SUDOKU_STRATEGIES.find(s => s.name.includes('Nets') || s.name.includes('Dynamic Forcing Nets')) || SUDOKU_STRATEGIES[0];
    }
    if (searchName === 'template logic') {
      return SUDOKU_STRATEGIES.find(s => s.name.includes('Template Elimination') || s.name.includes('Digit Templates')) || SUDOKU_STRATEGIES[0];
    }

    const exact = SUDOKU_STRATEGIES.find(s => s.name.toLowerCase() === searchName);
    if (exact) return exact;

    const partial = SUDOKU_STRATEGIES.find(s => s.name.toLowerCase().includes(searchName));
    if (partial) return partial;

    return SUDOKU_STRATEGIES[0];
  };

  // Catalogue filter logic
  const filteredStrategies = SUDOKU_STRATEGIES.filter(strat => {
    const matchesCategory = selectedCategory === 'All' || strat.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      strat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strat.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strat.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeStrategy = SUDOKU_STRATEGIES.find(s => s.id === selectedStrategyId) || SUDOKU_STRATEGIES[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 210 }}
        className={`rounded-3xl border w-full max-w-6xl h-[92vh] overflow-hidden shadow-2xl relative flex flex-col ${
          theme === 'dark' 
            ? 'bg-[#0F1423] border-slate-800 text-[#E2E8F0]' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header bar */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-[#009DFF] to-[#3BA7FF] rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white animate-pulse" />
            </span>
            <div className="text-left">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider flex items-center gap-2">
                <span>SKUDO STRATEGY ACADEMY</span>
                <span className="text-[10px] bg-[#009DFF] text-white px-2 py-0.5 rounded-full font-mono normal-case tracking-normal">95 Tactics Functional</span>
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                The absolute collection of grid solving techniques. Study step-by-step with master demonstrations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-500/10 rounded-full transition cursor-pointer"
            title="Exit Academy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Switcher & Live Search or Road description */}
        <div className={`p-3 sm:p-4 border-b flex flex-col gap-3 shrink-0 ${
          theme === 'dark' ? 'bg-[#151B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Top Switcher tab row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/10 dark:border-slate-800/40 pb-2.5">
            <div className="flex p-0.5 bg-slate-900/40 dark:bg-slate-950/40 rounded-xl border border-slate-800/20 max-w-sm w-full">
              <button
                onClick={() => {
                  setActiveTab('path');
                  const firstTech = LEARNING_PATH_LEVELS[selectedLevelId - 1].techniques[0];
                  setSelectedStrategyId(findStrategy(firstTech.name).id);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11.5px] font-black uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'path'
                    ? 'bg-[#009DFF] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>🏆 Learning Path</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('catalog');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11.5px] font-black uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-[#009DFF] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>📚 All Techniques</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Active Mode: {activeTab === 'path' ? 'Guided AI Path' : 'All-Tactic Index'}
              </span>
              <span className="text-[10.5px] font-bold text-slate-400">95 Complete Strategies Functional</span>
            </div>
          </div>

          {/* Catalog Tab Specific elements */}
          {activeTab === 'catalog' && (
            <>
              {/* Live search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search all 95 strategies (e.g. Naked Pair, Exocet, AIC, SAT Solver...)..."
                  className={`w-full pl-10 pr-10 py-2.5 font-bold rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#009DFF] transition-all border ${
                    theme === 'dark' 
                      ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' 
                      : 'bg-slate-55 border-slate-220 text-slate-800 placeholder-slate-450'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-3 transition hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick tab filters - Horizontal Scrolling list of Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 grid-scroll">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setSelectedCategory(cat.key);
                      }}
                      className={`px-3 py-1.5 border rounded-full text-[10.5px] font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#009DFF] bg-[#009DFF] text-white shadow-md'
                          : theme === 'dark'
                            ? 'border-slate-805 bg-slate-950/40 text-slate-350 hover:bg-slate-900'
                            : 'border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Learning Path Tab Description */}
          {activeTab === 'path' && (
            <div className={`p-2.5 rounded-xl flex items-start gap-2.5 text-left text-[11px] leading-relaxed ${
              theme === 'dark' ? 'bg-slate-950/20 text-slate-400' : 'bg-slate-50 border border-slate-100 text-slate-600'
            }`}>
              <Compass className="w-4 h-4 text-[#009DFF] shrink-0 mt-0.5" />
              <p className="font-semibold">
                Welcome to the **SKUDO AI Learning Path**. We recommend studying these techniques in sequence across **10 progressive difficulty levels**. Click on any Level card in the left sidebar to change milestones, then use the level step navigator above the study panels to explore each technique's mechanics!
              </p>
            </div>
          )}
        </div>

        {/* Major split workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {activeTab === 'path' ? (
            /* Left side: Guided Road Level selector */
            <div className={`w-full md:w-[330px] lg:w-[370px] border-r overflow-y-auto flex flex-col shrink-0 ${
              theme === 'dark' ? 'bg-[#0B0F1B]/90 border-slate-800' : 'bg-slate-50/50 border-slate-200'
            }`}>
              <div className="p-3 border-b border-dashed border-slate-805 flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#009DFF]" />
                  <span>Master AI Road Map</span>
                </span>
                <span className="text-[9px] bg-[#009DFF]/10 text-[#009DFF] border border-[#009DFF]/20 px-2.5 py-0.5 rounded-full font-bold">10 Progressive Levels</span>
              </div>

              <div className="flex flex-col p-2 gap-2">
                {LEARNING_PATH_LEVELS.map((level) => {
                  const isCurrent = level.level === selectedLevelId;
                  return (
                    <button
                      key={level.level}
                      onClick={() => {
                        setSelectedLevelId(level.level);
                        const firstTech = level.techniques[0];
                        setSelectedStrategyId(findStrategy(firstTech.name).id);
                        setShowSimulatedBoard(true);
                      }}
                      className={`w-full p-3 rounded-2xl flex flex-col gap-1.5 transition text-left cursor-pointer border ${
                        isCurrent 
                          ? theme === 'dark'
                            ? 'bg-[#1E293B]/70 border-[#009DFF] shadow-lg shadow-[#009DFF]/5' 
                            : 'bg-sky-50 border-[#009DFF] shadow'
                          : theme === 'dark'
                            ? 'border-transparent bg-transparent hover:bg-[#1E293B]/15'
                            : 'border-transparent bg-transparent hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isCurrent 
                            ? 'bg-[#009DFF] text-white' 
                            : theme === 'dark' 
                              ? 'bg-slate-900 border border-slate-850 text-slate-400' 
                              : 'bg-slate-200 text-slate-650'
                        }`}>
                          Level {level.level}
                        </span>
                        
                        {isCurrent && (
                          <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-extrabold uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Studying</span>
                          </div>
                        )}
                      </div>

                      <div className="pr-2">
                        <h4 className={`text-[12px] font-black uppercase tracking-tight ${
                          isCurrent ? 'text-[#009DFF]' : ''
                        }`}>
                          {level.title}
                        </h4>
                        <p className="text-[10px] text-slate-450 font-bold leading-normal mt-0.5">
                          {level.desc}
                        </p>
                      </div>

                      {/* Display techniques within the Level card */}
                      <div className="flex flex-wrap items-center gap-1 text-[8.5px] font-black mt-1 font-mono uppercase">
                        {level.techniques.map((t, idx) => {
                          const isActiveStrategyOfLevel = activeStrategy.name.toLowerCase() === t.name.toLowerCase();
                          return (
                            <React.Fragment key={idx}>
                              <span className={`px-1.5 py-0.5 rounded border ${
                                isActiveStrategyOfLevel
                                  ? 'bg-[#009DFF]/15 text-[#009DFF] border-[#009DFF]/30 font-black'
                                  : 'text-slate-500 bg-slate-900/10 border-transparent'
                              }`}>
                                {t.label}
                              </span>
                              {idx < level.techniques.length - 1 && (
                                <span className="opacity-40 text-slate-600 font-sans">→</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Left Side: Traditional Scaled Strategy Selector Catalogue list */
            <div className={`w-full md:w-[325px] lg:w-[365px] border-r overflow-y-auto flex flex-col shrink-0 ${
              theme === 'dark' ? 'bg-[#0B0F1B]/90 border-slate-800' : 'bg-slate-50/50 border-slate-200'
            }`}>
              <div className="p-3 border-b border-dashed border-slate-805 flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Strategies ({filteredStrategies.length})</span>
                <span className="text-[10px] text-[#009DFF] font-black">Category: {selectedCategory}</span>
              </div>

              {filteredStrategies.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl">🧩</span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">No Strategies Match</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs font-semibold">We couldn't locate strategies for "{searchQuery}". Try updating filters or search words.</p>
                  <button 
                    onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                    className="px-3 py-1.5 mt-2 bg-[#009DFF] text-white font-extrabold text-[10px] uppercase rounded-lg"
                  >
                    Reset Channels
                  </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredStrategies.map((strat) => {
                    const isCurrent = strat.id === selectedStrategyId;
                    return (
                      <button
                        key={strat.id}
                        onClick={() => {
                          setSelectedStrategyId(strat.id);
                          setShowSimulatedBoard(true);
                        }}
                        className={`w-full p-3 flex items-start gap-2.5 transition text-left cursor-pointer border-b ${
                          isCurrent 
                            ? theme === 'dark' 
                              ? 'bg-[#1E293B]/70 border-l-4 border-l-[#009DFF] border-slate-800' 
                              : 'bg-sky-50 border-l-4 border-l-[#009DFF] border-slate-150'
                            : theme === 'dark' 
                              ? 'border-slate-800 hover:bg-[#1E293B]/20' 
                              : 'border-slate-200 hover:bg-slate-100/50'
                        }`}
                      >
                        {/* Num index badge */}
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                          isCurrent 
                            ? 'bg-[#009DFF] text-white' 
                            : theme === 'dark' ? 'bg-slate-900 text-slate-450' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {strat.index}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className={`text-[12px] font-extrabold truncate ${
                              isCurrent ? 'text-[#009DFF]' : ''
                            }`}>
                              {strat.name}
                            </h5>
                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${strat.badgeColor}`}>
                              {strat.category}
                            </span>
                          </div>
                          <p className={`text-[10px] truncate-2-lines mt-1 font-semibold leading-normal ${
                            isCurrent ? theme === 'dark' ? 'text-slate-200' : 'text-slate-850' : 'text-slate-450'
                          }`}>
                            {strat.shortDesc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Right Side: Interactive "Master Solver Workspace" for Detailed Explanation */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-5 bg-transparent select-none">
            
            {/* Step-by-Step Level technique nodes across the top of Detail screen (only if activeTab === 'path') */}
            {activeTab === 'path' && (
              <div className={`p-3 rounded-2xl border mb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 ${
                theme === 'dark' ? 'bg-[#151B2E]/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-left shrink-0">
                  <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">SKUDO DEVELOPMENT TRACK PROGRESS</span>
                  <h4 className="text-[12px] font-black text-slate-450 uppercase tracking-tight mt-0.5">
                    LEVEL {selectedLevelId} ROADMAP STEPS
                  </h4>
                </div>
                
                {/* Horizontal Level Tracks */}
                <div className="flex flex-col sm:flex-row items-center gap-2 flex-grow max-w-2xl justify-start xl:justify-end">
                  {LEARNING_PATH_LEVELS[selectedLevelId - 1].techniques.map((t, idx) => {
                    const techStrategy = findStrategy(t.name);
                    const isSelected = techStrategy.id === selectedStrategyId;
                    return (
                      <React.Fragment key={idx}>
                        <button
                          onClick={() => {
                            setSelectedStrategyId(techStrategy.id);
                            setShowSimulatedBoard(true);
                          }}
                          className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-left sm:text-center font-black text-[11px] transition cursor-pointer flex items-center justify-between sm:justify-center gap-2 border ${
                            isSelected
                              ? 'bg-[#009DFF] border-[#009DFF] text-white shadow-md shadow-[#009DFF]/10'
                              : theme === 'dark'
                                ? 'bg-slate-900/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-750'
                                : 'bg-white border-slate-205 text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-mono">
                            <span className={`w-4.5 h-4.5 rounded-full text-[9px] font-mono flex items-center justify-center font-bold ${
                              isSelected ? 'bg-white text-[#009DFF]' : 'bg-slate-800 text-slate-350'
                            }`}>
                              {idx + 1}
                            </span>
                            <span>{t.label}</span>
                          </span>
                          <Sparkles className={`w-3 h-3 ${isSelected ? 'text-white animate-pulse' : 'text-slate-500 opacity-60'}`} />
                        </button>
                        {idx < 2 && (
                          <span className="hidden sm:inline text-slate-600 font-bold text-xs uppercase opacity-80">➔</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStrategy.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col gap-5 text-left h-full"
              >
                {/* Active Strategy Header Card */}
                <div className={`p-4 rounded-2xl border ${
                  theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-805' : 'bg-slate-50 border-slate-220'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/10 pb-3">
                    <div>
                      <span className="text-[10px] bg-[#009DFF]/15 border border-[#009DFF]/25 text-[#009DFF] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        Strategy Technique #{activeStrategy.index} ({activeStrategy.category})
                      </span>
                      <h4 className="text-lg font-black tracking-tight mt-1 ml-0.5 text-slate-100 dark:text-white">
                        {activeStrategy.name}
                      </h4>
                    </div>
                    <span className={`self-start sm:self-center text-[9.5px] font-black uppercase px-3 py-1 rounded-full border ${activeStrategy.badgeColor}`}>
                      Level: {activeStrategy.category}
                    </span>
                  </div>

                  <p className="text-xs font-semibold leading-relaxed text-slate-400 mt-3 border-l-2 border-[#009DFF] pl-3">
                    {activeStrategy.shortDesc}
                  </p>
                </div>

                {/* Grid Split: Explanation vs Visualized Grid Reference */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
                  
                  {/* Left part: Explanation column (lg:col-span-7) */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    {/* Deep technical details */}
                    <div>
                      <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                        <Info className="w-3.5 h-3.5 text-[#009DFF]" />
                        <span>Master Concept & Mechanics</span>
                      </h5>
                      <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed text-slate-300 select-text ${
                        theme === 'dark' ? 'bg-slate-950/50' : 'bg-slate-50/70 border border-slate-200'
                      }`}>
                        {activeStrategy.explanation}
                      </div>
                    </div>

                    {/* Step-by-Step "Hand-in-Hand" guide */}
                    <div>
                      <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                        <Zap className="w-3.5 h-3.5 text-[#009DFF]" />
                        <span>Step-by-Step Human Solver Search (Hand-in-Hand Guide)</span>
                      </h5>
                      <div className="flex flex-col gap-2">
                        {activeStrategy.steps.map((step, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-xl flex items-start gap-3 transition-colors ${
                              theme === 'dark' ? 'bg-slate-900/30 border border-slate-800/40' : 'bg-slate-50 border border-slate-200/50'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-[#009DFF]/10 text-[#009DFF] font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 leading-relaxed text-left">
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right part: Simulated grid visualization (lg:col-span-5) */}
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-[#009DFF] flex items-center justify-between mb-0.5">
                      <span className="flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-[#009DFF]" />
                        <span>Realistic Board coordinate Example</span>
                      </span>
                      <button 
                        onClick={() => setShowSimulatedBoard(!showSimulatedBoard)}
                        className="text-[9px] underline hover:text-white cursor-pointer"
                      >
                        {showSimulatedBoard ? 'Hide Grid' : 'Show Grid'}
                      </button>
                    </h5>

                    {showSimulatedBoard ? (
                      <div className={`rounded-2xl overflow-hidden border flex flex-col p-4 shadow-inner ${
                        theme === 'dark' ? 'bg-slate-950/80 border-slate-850' : 'bg-slate-100 border-slate-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-mono text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wide">Dynamic Elimination Visualizer</span>
                        </div>
                        
                        {/* Monospaced realistic puzzle coordinates map */}
                        <div className="p-3 bg-slate-900 text-[#C7D2FE] font-mono text-[11px] leading-relaxed rounded-xl white-space-pre-wrap select-all text-left overflow-x-auto shadow-inner border border-slate-800 max-h-[220px] grid-scroll">
                          <pre className="whitespace-pre-wrap">{activeStrategy.example}</pre>
                        </div>

                        <div className="mt-3 p-2.5 rounded-lg bg-[#009DFF]/5 text-[#009DFF] font-mono text-[9.5px] leading-normal flex items-start gap-1.5 text-left font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-[#009DFF] shrink-0 mt-0.5" />
                          <span>
                            <strong>Solver Hint:</strong> Study the layout vectors R (Rows) and C (Columns). This ensures perfect logic scanning!
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center flex flex-col items-center justify-center gap-2 text-slate-500">
                        <span>💡</span>
                        <span className="text-xs font-bold uppercase">Grid Reference Cached</span>
                        <p className="text-[10px] max-w-xs leading-relaxed">Toggle the show option above to display monospaced coordinate matrix lines.</p>
                      </div>
                    )}

                    {/* Fun Academy Stats Widget */}
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                      theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-500/5 border-emerald-500/20'
                    }`}>
                      <span className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <Target className="w-5 h-5" />
                      </span>
                      <div className="text-left">
                        <h6 className="text-[11px] font-black uppercase text-emerald-500 tracking-wide">Elite Coordination Badge</h6>
                        <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                          Study these 95 strategies to increase your **Deduction Power Index**! Correct applications lock continuous score multipliers.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Support portal status bar */}
        <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
          theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10.5px] uppercase font-bold text-slate-450 tracking-wider">
              Skudo Coordinator Protocol: ACTIVE • Learn hand-by-hand
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black dark:bg-[#009DFF] hover:opacity-90 text-white font-black text-[11px] uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition active:scale-95"
          >
            Close Academy Hub
          </button>
        </div>
      </motion.div>
    </div>
  );
}
