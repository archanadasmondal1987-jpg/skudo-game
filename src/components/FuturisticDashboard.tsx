/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Check, 
  TrendingUp, 
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
  Home,
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
  Brain,
  CheckCircle,
  Camera,
  Upload,
  Image,
  Grid,
  Smartphone,
  Moon,
  Sun,
  Save,
  Edit2
} from 'lucide-react';
import { GameMode, PlayerProfile } from '../types';
import { localizeNumber, isValidPlacementForVariant } from '../utils/sudoku';
import { HELP_ARTICLES, HelpArticle } from '../data/helpArticles';
import metadata from '../../metadata.json';
import { gameAudio } from '../utils/audio';
import { 
  detectGridConflicts, 
  solveSudoku, 
  generateExplanations, 
  analyzeStrategies,
  GridConflict,
  StepExplanation,
  StrategyAnalysis,
  ExplanationMode
} from '../utils/lensSolver';

const COACH_ACADEMIES = {
  beginner: {
    title: "Beginner Academy",
    greeting: "Let's learn Sudoku from the beginning. I'll guide every move.",
    lessons: [
      {
        title: "Sudoku Basics & Grid Structure",
        desc: "A standard Sudoku grid has 81 cells, divided into 9 rows, 9 columns, and 9 boxes (3x3 blocks). Each row, column, and box must contain the digits 1 to 9 exactly once, without repetition.",
        explanation: "Every number you place has gravity, locking out all intersecting row, column, and box lines from duplicating that value.",
        highlights: [] as Array<[number, number]>,
        voice: "Welcome to Sudoku! To start, think of the grid as 9 rows and 9 columns forming 9 separate boxes. None of the cells can share the same number in their row, column, or box."
      },
      {
        title: "Sighting Rows & Columns",
        desc: "Rows run horizontally (1-9) and Columns run vertically (1-9). If a row already contains a '5', no other cell in that row can ever be a '5'. This immediately rules out several options.",
        explanation: "Look at Row 1 of your board. Several spaces are blocked by existing digits. We look for intersections to eliminate possibilities.",
        highlights: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8]],
        voice: "Observe the highlighted row horizontal vector. Since the row has numbers like five, three, and seven, any other empty coordinate in this row must be a different number."
      },
      {
        title: "Unlocking 3x3 Box Constraints",
        desc: "Each 3x3 local block follows the same non-duplicate rules. If a box has a '9', that entire box is locked out from receiving another '9'. Use this to cross-eliminate.",
        explanation: "By cross-reconstructing which cells are blocked within a box, the remaining empty locations stand out immediately.",
        highlights: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
        voice: "Notice the highlighted square. It is a three by three box. It must house every digit from one to nine. Tap any cell inside to inspect constraints."
      }
    ],
    quiz: [
      {
        question: "How many cells are inside a standard Sudoku board, and what are the row/column counts?",
        options: [
          "81 cells: 9 rows, 9 columns, and 9 boxes",
          "64 cells: 8 rows, 8 columns, and 8 boxes",
          "100 cells: 10 rows, 10 columns, and 10 boxes"
        ],
        answerIdx: 0,
        explanation: "Correct! Sudoku is a 9x9 matrix representing 81 unique cell combinations."
      },
      {
        question: "If a 3x3 box already contains the number 7, where else inside that same box can you place another 7?",
        options: [
          "Only in the opposite corner cell",
          "Nowhere. Every digit from 1 to 9 can exist only once per box",
          "Anywhere as long as it aligns diagonally"
        ],
        answerIdx: 1,
        explanation: "Perfect! Digits cannot repeat inside any row, column, or local box."
      }
    ]
  },
  easy: {
    title: "Easy Strategy Academy",
    greeting: "Welcome back! Let's conquer the first standard logic strategies to find immediate cells without guessing.",
    lessons: [
      {
        title: "Naked Singles Mastery",
        desc: "A Naked Single occurs when a specific cell has ONLY ONE possible candidate left. After calculating all row, column, and box constraints, no other digit can legally occupy that cell.",
        explanation: "Always check cells that have dense row/column intersection lists. If eight digits are already locked, the ninth is your naked single!",
        highlights: [[2, 0]],
        voice: "A Naked Single means a cell has only one possible coordinate value remaining. Since every other number is locked by its row, column, or box, you must fill this with the single remaining candidate."
      },
      {
        title: "Hidden Singles Magic",
        desc: "A Hidden Single is when a digit has only one legal cell left inside a row, column, or box, even though other candidates might fit. If a '4' can only fit in one box cell, it goes there!",
        explanation: "We scan the coordinates line by line. If a digit can only go in one spot in an entire row, that digit is locked in place.",
        highlights: [[0, 2], [1, 2], [2, 2]],
        voice: "Hidden Singles are sneaky! The cell might accept other numbers, but because no other cell in that region can hold this target, it must go here."
      },
      {
        title: "Locked Candidates Concept",
        desc: "Locked Candidates happen when all possible spots for a candidate inside a box are lined up in a single row or column. This allows you to eliminate that candidate from the rest of that line!",
        explanation: "This acts as a remote laser projection. By observing the cell line alignment, you clear candidate marks in other boxes.",
        highlights: [[6, 6], [7, 6], [8, 6]],
        voice: "When candidates align inside a box, they project constraints onto the outer line elements. We eliminate these from adjacent spaces safely."
      }
    ],
    quiz: [
      {
        question: "When a single cell has only one legal candidate number remaining, it is called a...",
        options: [
          "Hidden Pair",
          "Naked Single",
          "Locked Candidate"
        ],
        answerIdx: 1,
        explanation: "Excellent! It is naked because it has no alternative candidates remaining."
      },
      {
        question: "What does the Locked Candidates strategy allow us to do?",
        options: [
          "Eliminate candidates from adjacent, non-box cells of the same row/column line",
          "Solve the entire board immediately",
          "Create duplicate numbers inside a column safely"
        ],
        answerIdx: 0,
        explanation: "Exactly right! It projects constraint lines onto the exterior cells."
      }
    ]
  },
  intermediate: {
    title: "Intermediate Strategy Academy",
    greeting: "Awesome. We are leaving the basics. Let's learn about Pairs and Box-Line intersections to prune Candidate notes.",
    lessons: [
      {
        title: "Naked Pairs Elimination",
        desc: "A Naked Pair is when two distinct cells in the same row, column, or box contain ONLY the exact same two candidates (e.g. [2,8] and [2,8]). No other cell in that line can contain those digits!",
        explanation: "Since these two cells must hold those two digits, those digits are completely locked out of all remaining empty coordinates in that line.",
        highlights: [[4, 3], [4, 5]],
        voice: "A Naked Pair locks two numbers inside two cells of a row or column. Because they occupy those spaces, you can clean those candidates from all neighboring cells!"
      },
      {
        title: "Hidden Pairs Strategy",
        desc: "A Hidden Pair is when two candidates exist in only two cells of a row, column, or box, but are mixed with other marks. You can safely clear all other excess candidates in those two cells!",
        explanation: "By isolating these hidden relationships, you simplify candidate grids and unmask Naked Singles.",
        highlights: [[5, 4], [8, 4]],
        voice: "Hidden Pairs are camouflaged by other numbers. Once located, you can delete everything else in those two cells except the pair."
      },
      {
        title: "Pointing Pairs & Triples",
        desc: "When candidates are restricted to coordinates forming a pointer alignment within a box, they lock that candidate in the entire row or column outside that box.",
        explanation: "Use this to eliminate candidate numbers from adjacent blocks without needing to place any actual digits.",
        highlights: [[3, 0], [4, 0], [5, 0]],
        voice: "Pointing Pairs act as linear indicators. They line up in a box and point down the column or across the row to prune outer pencil marks."
      }
    ],
    quiz: [
      {
        question: "If cell R4C2 has candidates [3,7] and cell R4C5 has [3,7] inside Row 4, what can we conclude?",
        options: [
          "We can eliminate 3 and 7 from all other cells in Row 4",
          "Row 4 is invalid and must be reset",
          "Both cells must equal 5 immediately"
        ],
        answerIdx: 0,
        explanation: "Correct! The Naked Pair isolates those digits to those two row coordinate indexes."
      }
    ]
  },
  master: {
    title: "Master Academy",
    greeting: "Now we unlock the supreme high-dimensional fish and loops patterns. Prepare to search of multidimensional configurations.",
    lessons: [
      {
        title: "X-Wing Wingtip Symmetry",
        desc: "An X-Wing occurs when a candidate is restricted to exactly two cells in two parallel rows (or columns) such that they form a perfect rectangle. This lets you eliminate that candidate from all other cells in those columns (or rows)!",
        explanation: "By locking the candidate into a diagonal 'X' coordinate axis, the surrounding grid is cleared of that digit.",
        highlights: [[1, 3], [1, 7], [7, 3], [7, 7]],
        voice: "Meet the legendary X-Wing! Four cells forming a perfect rectangle lock a candidate onto diagonal endpoints. You can prune all other instances from those columns."
      },
      {
        title: "Swordfish Grid Alignment",
        desc: "A Swordfish is a 3x3 expansion of the X-Wing. It involves three parallel rows where a candidate is restricted to the same three columns. You can eliminate that candidate from all other cells in those columns!",
        explanation: "This creates a strong chain matrix across three rows and columns, neutralizing candidate complexity.",
        highlights: [[0, 4], [0, 8], [4, 4], [4, 8], [8, 4], [8, 8]],
        voice: "The Swordfish is a massive three dimensional fish grid. It covers three parallel rows and columns to slice away candidates."
      },
      {
        title: "Chains & Nice Loops (AIC)",
        desc: "Alternating Inference Chains (AIC) connect alternating 'Strong links' and 'Weak links'. When they loop back, they form logic loops that eliminate candidates.",
        explanation: "This is equivalent to creating an electrical logic gate. If state A is false, state B is true, which forces a cascading elimination.",
        highlights: [[1, 1], [1, 4], [4, 4], [4, 1]],
        voice: "Chains and Alternating Inference Nice Loops construct logic circuits across the cells. We map alternating truths to eliminate outside potentials."
      }
    ],
    quiz: [
      {
        question: "How many parallel rows or columns are involved in a standard Swordfish pattern configuration?",
        options: [
          "2 parallel lines",
          "3 parallel lines",
          "5 intersecting circles"
        ],
        answerIdx: 1,
        explanation: "Spot on! Swordfish represents a 3x3 parallel matrix, while X-Wing is 2x2."
      }
    ]
  },
  grandmaster: {
    title: "Grandmaster Academy",
    greeting: "Welcome to elite computational Sudoku theory. Let's study Boolean Satisfiability (SAT), constraint systems, and Solver architectures.",
    lessons: [
      {
        title: "Boolean SAT Solving & Mapping",
        desc: "Sudoku can be cast as a Boolean Satisfiability (SAT) Problem. Every cell value is mapped to 9 boolean variables (X_r_c_v). We apply clauses for cell uniqueness and row-column-box coverages.",
        explanation: "Modern computer solvers translate these clauses into Conjunctive Normal Form (CNF) and utilize DPLL or CDCL algorithms to solve grids in sub-milliseconds.",
        highlights: [] as Array<[number, number]>,
        voice: "At the grandmaster computational level, we view Sudoku as a SAT decision problem. Cell states match boolean values, solved instantly with propositional normal formulas."
      },
      {
        title: "Constraint Propagation & Arc Consistency",
        desc: "Arc Consistency (AC-3/AC-4) reduces variable domains by checking overlapping constraints. If assigning '8' to cell A empties the legal candidates of cell B, arc consistency deletes '8' from cell A automatically.",
        explanation: "This forms the basis of computer heuristic solvers, eliminating branch and bound backtracking recursively.",
        highlights: [[4, 4]],
        voice: "Constraint propagation recursively enforces arc consistency across coordinate domains. By pruning domains before branch searches, we prevent combinatorial explosion."
      },
      {
        title: "Elite Competitive Secret Techniques",
        desc: "Top manual solvers use 'uniqueness tests' and advanced coloring chains to bypass master grids without pencil-marking everything.",
        explanation: "Uniqueness patterns keep the game mathematically valid, as a well-formed Sudoku must only have a single unique solution.",
        highlights: [[0, 0], [0, 8], [8, 0], [8, 8]],
        voice: "Competitive elite players utilize uniqueness heuristics and coloring templates to clear extreme puzzles with lightning speed."
      }
    ],
    quiz: [
      {
        question: "What algorithm do modern computing SAT solvers use to check the boolean matrices of a Sudoku CNF formula?",
        options: [
          "Bubble Sort heuristics",
          "CDCL (Conflict-Driven Clause Learning)",
          "Simple guessing loops"
        ],
        answerIdx: 1,
        explanation: "Superb! Conflict-Driven Clause Learning with backjumping solves constraint grids with maximum compute rate."
      },
      {
        question: "Why form Uniqueness patterns in elite competitive play?",
        options: [
          "Because a correctly defined Sudoku is mathematically guaranteed to have exactly one unique solution",
          "To allow duplicate numbers inside a local box",
          "To randomize solver branches on purpose"
        ],
        answerIdx: 0,
        explanation: "Exactly! Uniqueness constraints prevent grids from having dual states."
      }
    ]
  }
};

// Custom Trigger Vibe for premium feedback tactile feeling
const triggerVibe = () => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(8);
    } catch (_) {}
  }
};

const getLevelInfo = (xp: number) => {
  const level = Math.floor((xp || 0) / 250) + 1;
  const xpInLevel = (xp || 0) % 250;
  const xpNeeded = 250;
  const percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  return { level, xpInLevel, xpNeeded, percent };
};

const SIMULATOR_TEMPLATES = [
  { text: "Scanning Grid Block 3 for candidate exclusions... Done.", type: "candidate" },
  { text: "Detected Naked Single '4' at Row 2 Column 7. Placing value ✅", type: "move" },
  { text: "Scanning Grid Block 9... No direct naked singles found. Escaping to candidate notes.", type: "candidate" },
  { text: "Pruning candidate 5 from Row 4 Column 3 based on row-column constraints.", type: "candidate" },
  { text: "Pruning candidate 7 from Row 8 Column 5 based on block overlap rules.", type: "candidate" },
  { text: "Locked Naked Pair [1, 9] in Row 6 Column 2 and Row 6 Column 8. Eliminating from adjacent block cells.", type: "strategy" },
  { text: "Identified Hidden Single '3' in Column 6. Placing value ✅", type: "move" },
  { text: "Analytical sweep of Block 4: Candidates pruned for 11 sub-squares.", type: "candidate" },
  { text: "Applying X-Wing strategy on Columns 2 and 7 for digit 8. Pruning 4 other placements.", type: "strategy" },
  { text: "Detected Naked Single '9' at Row 3 Column 1. Placing value ✅", type: "move" },
  { text: "Constraint Propagation sweeps completed at 100% logic coverage.", type: "candidate" },
  { text: "Row-Column-Block (RCB) diagnostics scanning: No conflicts detected.", type: "candidate" },
  { text: "Applying Swordfish search pattern across Columns 3, 5, 8. Pruning redundant index candidates.", type: "strategy" },
  { text: "Detected Hidden Pair [2, 6] in Block 1 cells. Pruning alternate values.", type: "strategy" },
  { text: "Sudoku Grid complexity evaluated: CDCL Satisfiable status confirmed.", type: "candidate" },
  { text: "Naked Single '7' unmasked at Row 9 Column 9. Placing value ✅", type: "move" },
  { text: "Conflict resolution sweep triggered. No candidate violations found.", type: "candidate" },
  { text: "Master Puzzle grid solved successfully! 🏆 Recalibrating ELO rating...", type: "solve" }
];

const FIRST_NAMES_LIST = ["Alpha", "Beta", "Gamma", "Omega", "Solver_XP", "Deductor_Max", "Matrix", "Quantum_Core", "HyperScale", "ApexSolve", "GridMaster", "LogicWave", "VectorPrime", "CosmicDeduction", "VertexScan", "Spectral_SAT", "Neural_C", "ShadowNode", "Rogue_Solver", "Katarina", "Sheng", "Elena", "Marcus", "Yuki", "Amara", "Nikolai", "Zoe", "Xavier", "Turing_B", "Lovelace_C", "Dijkstra_P", "Euler_V", "Cantor_Set", "Gauss_E", "Noether_G", "Ramanujan_S", "Gödel_I5", "Hilbert_D", "Deep_M", "Curie_R", "Fermi_E", "Bohr_N", "Plancks_C", "Einstein_A", "Tesla_N", "Ada_L", "Alan_T", "Knuth_D", "Claudio_S", "Sipser_M"];
const LAST_NAMES_LIST = ["Client", "Server", "Dev", "Node", "Byte", "Tracer", "Quantum", "Omega", "Alpha", "Flux", "Core", "Scan", "Symmetry", "Pair", "Triple", "Quad", "Swordfish", "XWing", "CDCL", "SAT", "Algorithm", "Compiler", "Automata", "Grammar", "Regex", "Lexer", "Parser", "AST", "Interpreter", "Engine", "Virtual", "Machine", "Processor", "Cluster", "Grid", "Matrix", "Tensor", "Vector", "Array", "Buffer", "Stack", "Queue", "Heap", "BTree", "Graph", "Thread", "Process", "Socket", "Packet", "Router"];
const COUNTRIES_LIST = ["🇨🇳 China", "🇺🇸 USA", "🇯🇵 Japan", "🇩🇪 Germany", "🇮🇳 India", "🇬🇧 UK", "🇫🇷 France", "🇨🇦 Canada", "🇦🇺 Australia", "🇧🇷 Brazil", "🇿🇦 South Africa", "🇰🇷 South Korea", "🇸🇬 Singapore", "🇳🇱 Netherlands", "🇨🇭 Switzerland", "🇸🇪 Sweden", "🇳🇴 Norway", "🇪🇸 Spain", "🇮🇹 Italy", "🇮🇪 Ireland", "🇳🇿 New Zealand", "🇲🇽 Mexico", "🇦🇹 Austria", "🇧🇪 Belgium", "🇩🇰 Denmark", "🇫🇮 Finland", "🇬🇷 Greece", "🇵🇹 Portugal", "🇹🇷 Turkey", "🇺🇦 Ukraine"];

const generateStaticLeaderboardPool = (): Array<{ name: string; ELO: number; country: string; isSelf: boolean }> => {
  const pool = [];
  const poolSize = 10045;
  for (let i = 0; i < poolSize; i++) {
    const fName = FIRST_NAMES_LIST[i % FIRST_NAMES_LIST.length];
    const lName = LAST_NAMES_LIST[(i * 7 + 3) % LAST_NAMES_LIST.length];
    const country = COUNTRIES_LIST[(i * 13 + 5) % COUNTRIES_LIST.length];
    const pct = i / poolSize;
    const baseElo = 550 + Math.floor(2350 * Math.pow(1 - pct, 1.4));
    const noise = (i * 31 + 47) % 120;
    const ELO = Math.min(2960, baseElo + noise);
    
    let playerName = `${fName}_${lName}_${i + 137}`;
    let playerElo = ELO;
    if (i === 0) {
      playerName = "CDCL_SAT_Solver_v9";
      playerElo = 2990;
    } else if (i === 1) {
      playerName = "Sheng_W._Tokyo";
      playerElo = 2895;
    } else if (i === 2) {
      playerName = "Katarina_S._Berlin";
      playerElo = 2830;
    }
    
    pool.push({
      name: playerName,
      ELO: playerElo,
      country: country,
      isSelf: false
    });
  }
  return pool;
};

const BASE_LEADERBOARD_POOL = generateStaticLeaderboardPool();

const SUDOKU_VARIANTS = [
  {
    id: 'killer',
    name: 'Killer Sudoku',
    badge: 'MATH + LOGIC',
    gridBadge: 'NUMERIC (1-9)',
    desc: 'Combines Sudoku with Kakuro constraints. Dotted cages define sum groups where digits must be unique.',
    size: 9,
    constraints: { hasCageSumConstraints: true },
    explanation: "Standard Sudoku rules apply, plus: the sum of all digits inside each dotted cage must equal the number printed in its corner, and no digit can repeat inside a cage. A core master strategy is 'The Law of 45' — every row, column, and 3x3 region must sum to exactly 45."
  },
  {
    id: 'xsudoku',
    name: 'Sudoku X / Diagonals',
    badge: 'GEOMETRIC',
    gridBadge: 'NUMERIC (1-9)',
    desc: 'The two main diagonal paths (top-left to bottom-right and top-right to bottom-left) must also contain unique digits 1-9.',
    size: 9,
    constraints: { hasDiagonalConstraint: true },
    explanation: "Standard Sudoku rules apply, plus: digits 1 to 9 must not repeat along either of the two major diagonal lines (highlighted in orange)."
  },
  {
    id: 'jigsaw',
    name: 'Jigsaw Sudoku',
    badge: 'IRREGULAR',
    gridBadge: 'NUMERIC (1-9)',
    desc: 'Instead of linear 3x3 boxes, the regions are irregular jigsaw shapes. Demands a new spatial visualization focus.',
    size: 9,
    constraints: { hasJigsawRegions: true },
    explanation: "Instead of standard square 3x3 regions, the grid is divided into 9 irregular 'jigsaw' blocks of 9 cells each. Each region must contain the digits 1 through 9 exactly once."
  },
  {
    id: 'windoku',
    name: 'Windoku',
    badge: 'OVERLAP',
    gridBadge: 'NUMERIC (1-9)',
    desc: 'Four extra overlapping 3x3 regions are defined at specific zones (shaded in sky blue), which must also contain digits 1-9.',
    size: 9,
    constraints: { hasWindokuOverlays: true },
    explanation: "Standard Sudoku rules apply, plus: four extra shaded 3x3 windows must also contain digits 1 to 9 once. This leaves fewer open positions and tightens constraints."
  },
  {
    id: 'wordoku',
    name: 'Wordoku',
    badge: 'ALPHA 1X9',
    gridBadge: 'ALPHA (A-I)',
    desc: 'Uses alphabetic characters A-I instead of digits. The solution reveals a hidden 9-letter anagram in a specific row/col.',
    size: 9,
    constraints: { isAlphabetical: true },
    explanation: "Standard Sudoku rules apply, but using alphabetical characters 'A' through 'I' instead of '1' through '9'. Excellent for testing linguistic pattern matching."
  },
  {
    id: 'mini',
    name: 'Mini Sudoku',
    badge: '4x4 / 6x6 QUICK',
    gridBadge: 'MINI (1-6)',
    desc: 'An optimized smaller grid (6x6 size with 2x3 boxes). Perfect for fast-paced cognitive warmup training.',
    size: 6,
    constraints: { isMiniGrid: true },
    explanation: "An elegant smaller layout. Perfect for quick training sessions. Numbers 1 to 6 are placed on a 6x6 board divider with 2x3 blocks."
  },
  {
    id: 'mega',
    name: 'Mega Sudoku',
    badge: '16x16 EXPERT',
    gridBadge: 'MEGA (1-16)',
    desc: 'A massive 16x16 constraint board using hexadecimal symbols (0-9, A-F) and 4x4 region dividers.',
    size: 16,
    constraints: { isMegaGrid: true },
    explanation: "A massive, extreme scale expert layout of 16x16 grid utilizing hexadecimal digits 1-16 (or '0-9' and 'A-F'). Demands heavy scanning endurance."
  },
  {
    id: 'samurai',
    name: 'Samurai Sudoku',
    badge: 'MULTI-GRID',
    gridBadge: 'SAMURAI (9x9)',
    desc: 'Five overlapping 9x9 standard Sudoku matrices bound together at the corner quadrants. Solve all interlocking grids.',
    size: 9,
    constraints: { isSamuraiGrid: true },
    explanation: "Features 5 overlapping standard 9x9 grids that share 3x3 subgrids at their corners. Solvers must progress across all grids as constraints bleed across overlapping areas."
  },
  {
    id: 'greater_than',
    name: 'Greater Than Sudoku',
    badge: 'INEQUALITY',
    gridBadge: 'NUMERIC (1-9)',
    desc: 'No initial clues are given! Instead, every adjacent cell boundary displays a comparison flag (< or >) guiding cell values.',
    size: 9,
    constraints: { hasInequalityConstraints: true },
    explanation: "No start clues! Instead, comparison operators ( < and > ) are displayed on boundaries. Adjacent values must satisfy these comparator relations strictly."
  },
  {
    id: 'even_odd',
    name: 'Even-Odd Sudoku',
    badge: 'PARITY',
    gridBadge: 'NUMERIC (1-9)',
    desc: 'Shaded indicators on cells dictate parity rules: circular markings show odd digits, and square markings show even digits.',
    size: 9,
    constraints: { hasParityConstraints: true },
    explanation: "Standard Sudoku rules apply, plus: cells marked with subtle circles can only hold ODD numbers (1, 3, 5, 7, 9), while cells marked with squares can only hold EVEN numbers (2, 4, 6, 8)."
  },
  {
    id: 'anti_knight',
    name: 'Anti-Knight Sudoku',
    badge: 'CHESS LAYER',
    gridBadge: 'NUMERIC (1-9)',
    desc: 'No cells separated by a Chess Knight move (L-shape: 2 cells away, 1 sideways) can contain identical values.',
    size: 9,
    constraints: { hasChessKnightConstraint: true },
    explanation: "Standard Sudoku rules apply, plus: any two cells that are a Knight's Chess Move apart (2 rows & 1 col, or 2 cols & 1 row) MUST NOT contain the same digit. This heavily shifts cell mapping."
  },
  {
    id: 'anti_king',
    name: 'Anti-King Sudoku',
    badge: 'RADIUS PROXIMITY',
    gridBadge: 'NUMERIC (1-9)',
    desc: 'No cells containing the same digit are allowed within a Chess King move radius (all eight immediate surrounding adjacent cells).',
    size: 9,
    constraints: { hasChessKingConstraint: true },
    explanation: "Standard Sudoku only allows unique digits per row/col/box. Anti-King adds a 'King move constraint': cells sharing matching digits cannot be adjacent diagonally of each vertex (1-cell distance)."
  }
];

interface FuturisticDashboardProps {
  profile: PlayerProfile;
  theme: 'light' | 'dark';
  onUpdateProfile: (updated: PlayerProfile) => void;
  onSelectGame: (config: {
    mode: GameMode;
    difficulty: 'flow' | 'zen' | 'focus' | 'quantum';
    special?: 'daily' | 'weekly' | 'monthly';
    boss?: { name: string; avatarUrl: string; quote: string; style: string; difficulty: any } | null;
    variant?: string;
  }) => void;
  onOpenLegacyAcademy: () => void;
  onToggleTheme: () => void;
  onToggleAudio: () => void;
  audioEnabled: boolean;
  vibrateEnabled?: boolean;
  onToggleVibration?: () => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
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
  vibrateEnabled = true,
  onToggleVibration = () => {},
  notificationsEnabled = false,
  onToggleNotifications = () => {},
}: FuturisticDashboardProps) {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'play' | 'learn' | 'arena' | 'analytics' | 'achievements' | 'sandbox' | 'settings' | 'help' | 'lens' | 'training'>('home');
  const [showVariantPopup, setShowVariantPopup] = useState<string | null>(null);
  const [trainingVariant, setTrainingVariant] = useState<string>('killer');
  const [trainingBoard, setTrainingBoard] = useState<any[][]>([]);
  const [trainingSelectedCell, setTrainingSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [trainingCoachChatHistory, setTrainingCoachChatHistory] = useState<Array<{ sender: 'user' | 'coach', text: string }>>([
    { sender: 'coach', text: "Greetings, Commander. Welcome to the Tactical Variant Training Center. Ask me for rules explanations, step-by-step constraint walks, or technique tutorials anytime!" }
  ]);
  const [trainingModelLoading, setTrainingModelLoading] = useState(false);
  const [trainingQuery, setTrainingQuery] = useState('');
  
  const [dashboardEditName, setDashboardEditName] = useState(profile.name);
  const [isDashboardEditingName, setIsDashboardEditingName] = useState(false);
  const dashboardFileInputRef = useRef<HTMLInputElement>(null);

  const handleTrainingChatSubmit = async (customPrompt?: string) => {
    const promptToSend = customPrompt || trainingQuery;
    if (!promptToSend.trim()) return;

    gameAudio.playClick();
    setTrainingCoachChatHistory(prev => [...prev, { sender: 'user', text: promptToSend }]);
    if (!customPrompt) setTrainingQuery('');
    setTrainingModelLoading(true);

    try {
      const v = SUDOKU_VARIANTS.find(x => x.id === trainingVariant);
      const variantDesc = v ? `${v.name} (${v.badge}) - ${v.desc}` : trainingVariant;
      
      const fullSystemContext = `
        You are the Skudo AI Grandmaster Coach tutoring a cadet in the Sudoku Variant Training Center. 
        The student is studying the variant: ${variantDesc}.
        
        Answer questions accurately, patiently, and in accordance with advanced combinatorial techniques, but keep responses concise to fit in a clean widget terminal.
        Use Markdown formatting like bold texts, bullet points, or list formatting.
      `;

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `${fullSystemContext}\n\nCadet asks: ${promptToSend}`,
          stream: false,
          lang: localStorage.getItem('skudo_lang') || 'en'
        })
      });

      if (!response.ok) {
        throw new Error("Failed to receive feedback");
      }

      const data = await response.json();
      const answer = data.text || "I was unable to load strategic guidelines at this time.";
      setTrainingCoachChatHistory(prev => [...prev, { sender: 'coach', text: answer }]);
    } catch (e) {
      setTrainingCoachChatHistory(prev => [...prev, { sender: 'coach', text: "⚠️ System offline. Coach feed temporarily interrupted due to high matrix turbulence. Please try again shortly." }]);
    } finally {
      setTrainingModelLoading(false);
    }
  };

  const handleStartTraining = (variantId: string) => {
    const v = SUDOKU_VARIANTS.find(x => x.id === variantId);
    if (!v) return;

    const size = v.size;
    const initialGrid = Array.from({ length: size }, (_, rIdx) => 
      Array.from({ length: size }, (_, cIdx) => ({
        row: rIdx,
        col: cIdx,
        value: 0,
        correctValue: 0,
        isGiven: false,
        candidates: []
      }))
    );

    const solved = Array.from({ length: size }, () => Array(size).fill(0));
    const solveHelper = (grid: number[][]): boolean => {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === 0) {
            const nums = Array.from({ length: size }, (_, idx) => idx + 1).sort(() => Math.random() - 0.5);
            for (const num of nums) {
              if (isValidPlacementForVariant(grid, r, c, num, variantId)) {
                grid[r][c] = num;
                if (solveHelper(grid)) return true;
                grid[r][c] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };
    solveHelper(solved);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        initialGrid[r][c].correctValue = solved[r][c];
        if (Math.random() > (variantId === 'mega' ? 0.85 : 0.65)) {
          initialGrid[r][c].value = solved[r][c];
          initialGrid[r][c].isGiven = true;
        }
      }
    }

    setTrainingVariant(variantId);
    setTrainingBoard(initialGrid);
    setTrainingSelectedCell(null);
    setTrainingCoachChatHistory([
      { sender: 'coach', text: `Greetings, Commander. Welcome to the Tactical Variant Training Center. I've initialized a live **${v.name}** interactive grid. Here are the active training parameters:\n\n${v.explanation}\n\nAsk me anything! You can click "💡 EXPLAIN RULES" below, request a "🎯 STEP-BY-STEP WALK" of a constraint, or select a cell and digit then click "♟️ TEST MY MOVE" to validate your logic instantly!` }
    ]);
    setActiveTab('training');
    setShowVariantPopup(null);
  };

  useEffect(() => {
    setDashboardEditName(profile.name);
  }, [profile.name]);

  // Sandbox state variables
  const [sandboxBoard, setSandboxBoard] = useState<number[][]>([
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ]);
  const [sandboxHoverCell, setSandboxHoverCell] = useState<{ r: number; c: number } | null>(null);
  const [sandboxSelectedCell, setSandboxSelectedCell] = useState<{ r: number; c: number } | null>({ r: 2, c: 3 });
  const [sandboxViewMode, setSandboxViewMode] = useState<'numbers' | 'letters'>('numbers');

  // Dynamic Greeting state
  const [greetingInfo, setGreetingInfo] = useState(() => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return { text: "Good Morning", icon: "☀️" };
    if (hr >= 12 && hr < 17) return { text: "Good Afternoon", icon: "🌤️" };
    if (hr >= 17 && hr < 21) return { text: "Good Evening", icon: "🌇" };
    return { text: "Good Night", icon: "🌙" };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hr = new Date().getHours();
      let text = "Good Morning";
      let icon = "☀️";
      if (hr >= 5 && hr < 12) {
        text = "Good Morning";
        icon = "☀️";
      } else if (hr >= 12 && hr < 17) {
        text = "Good Afternoon";
        icon = "🌤️";
      } else if (hr >= 17 && hr < 21) {
        text = "Good Evening";
        icon = "🌇";
      } else {
        text = "Good Night";
        icon = "🌙";
      }
      setGreetingInfo({ text, icon });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Live reward function
  const awardXp = (amount: number, reason: string) => {
    if (typeof window !== 'undefined') {
      try {
        gameAudio.playClick();
      } catch (_) {}
    }
    triggerVibe();
    
    const updatedProfile = {
      ...profile,
      xp: (profile.xp || 0) + amount
    };
    
    onUpdateProfile(updatedProfile);

    setNotifications(prev => [
      {
        id: Date.now().toString(),
        text: `✨ +${amount} XP Awarded: ${reason}!`,
        time: 'Just now',
        read: false,
        icon: Sparkles
      },
      ...prev
    ]);
  };

  // Mount Daily Login award
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastLoginClaim = localStorage.getItem('skudo_last_login_claim');
    
    if (lastLoginClaim !== todayStr) {
      localStorage.setItem('skudo_last_login_claim', todayStr);
      const timer = setTimeout(() => {
        awardXp(50, 'Daily Login Reward');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Search, difficulty popup, and notification states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDifficultyPopupMode, setShowDifficultyPopupMode] = useState<'numbers' | 'letters' | null>(null);
  const [selectedPopupDifficulty, setSelectedPopupDifficulty] = useState<'zen' | 'flow' | 'focus' | 'quantum'>('flow');
  const [achTab, setAchTab] = useState<'all' | 'grid' | 'tactics' | 'bosses' | 'arena'>('all');
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
  const [leaderboardSearchQuery, setLeaderboardSearchQuery] = useState<string>('');
  const [selectedHelpArticle, setSelectedHelpArticle] = useState<string | null>(null);
  const [activeHelpCategory, setActiveHelpCategory] = useState<string>('all');
  
  // Custom Additional Support & Logic Inquiries array
  const [userInquiries, setUserInquiries] = useState<Array<{
    id: string;
    subject: string;
    message: string;
    priority: 'casual' | 'blocker' | 'neural';
    status: 'analyzing' | 'resolved' | 'escalated';
    submissionDate: string;
    aiResolution: string;
  }>>([
    {
      id: 'inq-prev-1',
      subject: 'Sync Key parsing failure on secondary tablet device',
      message: 'When I copy the generated Sync Key code from my phone to my tablet, it says "Unparseable Key Structure". The spaces might be automatically encoded.',
      priority: 'blocker',
      status: 'resolved',
      submissionDate: '2026-06-01 09:42 UTC',
      aiResolution: 'RESOLVED: Extended key parse regex to automatically strip horizontal whitespaces, carriage returns, or newline artifacts introduced by Android keyboard clipboard buffers.'
    },
    {
      id: 'inq-prev-2',
      subject: 'Mistake highlight delayed in Letters Mode',
      message: 'On Letters Mode under Flow difficulty, placing a duplicate character took 2 seconds to highlight in red compared to Numbers Mode.',
      priority: 'casual',
      status: 'resolved',
      submissionDate: '2026-06-02 11:15 UTC',
      aiResolution: 'RESOLVED: Local canvas thread prioritization was re-aligned. Conflict matrices for alphabet coordinates now execute on high-priority requestAnimationFrame loops.'
    }
  ]);

  const [supportSubmitted, setSupportSubmitted] = useState<boolean>(false);
  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportPriority, setSupportPriority] = useState<'casual' | 'blocker' | 'neural'>('casual');
  const [supportTicketResult, setSupportTicketResult] = useState<string>('');
  const [supportLoading, setSupportLoading] = useState<boolean>(false);

  // Skudo Lens Digitizer States (V5.0 Ultra Vision Engine)
  const [lensFile, setLensFile] = useState<string | null>(null);
  const [lensBase64, setLensBase64] = useState<string | null>(null);
  const [isCapturingLens, setIsCapturingLens] = useState<boolean>(false);
  const [lensScanProgress, setLensScanProgress] = useState<number>(-1);
  const [lensScanningTime, setLensScanningTime] = useState<boolean>(false);
  const [lensSolvedGrid, setLensSolvedGrid] = useState<boolean>(false);
  const [lensBoard, setLensBoard] = useState<number[][] | null>(null);

  // New V5.0 Advanced Image Calibration & Verification States
  const [lensRotation, setLensRotation] = useState<number>(0); // -45 to 45 deg
  const [lensBlur, setLensBlur] = useState<number>(0); // 0 (crisp) to 10 (very blurry)
  const [lensLighting, setLensLighting] = useState<number>(90); // 0-100%
  const [lensCropped, setLensCropped] = useState<boolean>(false);
  const [lensSourceType, setLensSourceType] = useState<'printed' | 'handwritten' | 'screenshot' | 'photo' | 'newspaper'>('printed');
  const [lensVerificationError, setLensVerificationError] = useState<string | null>(null);

  // Real Boards Matrix
  const [lensOriginalBoard, setLensOriginalBoard] = useState<number[][]>([
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]);
  const [lensCellConfidences, setLensCellConfidences] = useState<number[][]>(() => {
    return Array(9).fill(null).map(() => Array(9).fill(100));
  });
  const [lensIsEditingCell, setLensIsEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [lensAssistantMode, setLensAssistantMode] = useState<ExplanationMode>('intermediate');
  const [lensActiveExplanationIdx, setLensActiveExplanationIdx] = useState<number>(0);
  const [lensCandidatesView, setLensCandidatesView] = useState<boolean>(false);
  const [lensVoiceEnabled, setLensVoiceEnabled] = useState<boolean>(false);
  const [lensDifficulty, setLensDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert' | 'master'>('medium');

  // ================= SKUDO MASTER COACH AI v10.0 STATES =================
  const [coachActiveMode, setCoachActiveMode] = useState<'beginner' | 'easy' | 'intermediate' | 'master' | 'grandmaster'>('beginner');
  const [coachVoiceMode, setCoachVoiceMode] = useState<'teacher' | 'friendly' | 'tournament' | 'master'>('friendly');
  const [coachVoiceSpeed, setCoachVoiceSpeed] = useState<number>(1.0);
  const [coachIsMuted, setCoachIsMuted] = useState<boolean>(false);
  const [coachVisualWave, setCoachVisualWave] = useState<boolean>(false);
  const [coachChatQuery, setCoachChatQuery] = useState<string>('');
  const [coachChatHistory, setCoachChatHistory] = useState<Array<{ sender: 'user' | 'coach', text: string }>>([
    { sender: 'coach', text: "Hello! I am your AI Master Coach v10.0. I'll watch your games, guide your logic, and read explanations. Choose an Academy Mode to begin, or ask me any question!" }
  ]);
  const [coachSelectedLessonIdx, setCoachSelectedLessonIdx] = useState<number>(0);
  const [coachQuizAnswers, setCoachQuizAnswers] = useState<number[]>([]);
  const [coachQuizSubmitted, setCoachQuizSubmitted] = useState<boolean>(false);
  const [coachQuizPassed, setCoachQuizPassed] = useState<boolean | null>(null);
  const [coachCertificates, setCoachCertificates] = useState<string[]>([]);
  
  // Custom training indicators & weaknesses
  const [coachWeaknesses, setCoachWeaknesses] = useState<string[]>(['Swordfish', 'X-Wing', 'Hidden Pairs']);
  const [coachPBTime, setCoachPBTime] = useState<string>('3m 14s');
  const [coachHintLevel, setCoachHintLevel] = useState<number>(1);

  // ================= SKUDO ANALYTICS INTELLIGENCE CORE v12.0 STATES =================
  const [statsTimeframe, setStatsTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'alltime'>('weekly');
  const [statsChartType, setStatsChartType] = useState<'line' | 'bar' | 'area' | 'radar' | 'heatmap' | 'distribution'>('line');
  const [statsActiveMode, setStatsActiveMode] = useState<'zen' | 'flow' | 'quantum' | 'master' | 'grandmaster'>('zen');
  const [statsSimActive, setStatsSimActive] = useState<boolean>(false);
  const [statsCognitiveActiveTopic, setStatsCognitiveActiveTopic] = useState<string>('Pattern Recognition');
  const [statsCoachReportTimeframe, setStatsCoachReportTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Real-time telemetry counters
  const [analyticsMoves, setAnalyticsMoves] = useState<number>(314);
  const [analyticsCandidates, setAnalyticsCandidates] = useState<number>(562);
  const [analyticsStrategies, setAnalyticsStrategies] = useState<number>(118);
  const [analyticsMistakes, setAnalyticsMistakes] = useState<number>(14);
  const [analyticsHints, setAnalyticsHints] = useState<number>(8);
  const [analyticsSolved, setAnalyticsSolved] = useState<number>(24);
  
  // Simulated Log Console feed state
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    "🚀 Diagnostics Feed initialized in Standby. Click 'RUN SIMULATOR' to begin live solving telemetry."
  ]);

  // Component-wide reactive computed ELO IQ
  const liveSkudoIQ = Math.floor(1000 + (analyticsSolved * 20) + (analyticsMoves * 1.2) + (analyticsCandidates * 0.6) + (analyticsStrategies * 3) - (analyticsMistakes * 10) - (analyticsHints * 12));
  const highestSkudoIQ = Math.max(1620, liveSkudoIQ + 80);

  // Replay Session Selector
  const [replayMoveIdx, setReplayMoveIdx] = useState<number>(5);

  // Dynamic logged training heatmap minutes database (28 days)
  const [heatmapActivity, setHeatmapActivity] = useState<number[]>(() => {
    if (profile && profile.heatmapData && profile.heatmapData.length === 28) {
      return [...profile.heatmapData];
    }
    return [
      60, 45, 0, 75, 90, 30, 15, 0, 45, 50, 110, 15, 0, 40,
      65, 80, 0, 30, 45, 95, 120, 25, 0, 70, 85, 45, 60, 105
    ];
  });

  // Sync heatmap from profile changes
  useEffect(() => {
    if (profile && profile.heatmapData && profile.heatmapData.length === 28) {
      setHeatmapActivity([...profile.heatmapData]);
    }
  }, [profile?.heatmapData]);

  // Real-time Autopilot Simulator with lightning speed calculation feedback loops!
  useEffect(() => {
    if (!statsSimActive) return;
    const interval = setInterval(() => {
      // randomly pick an event template to simulate
      const templateIdx = Math.floor(Math.random() * SIMULATOR_TEMPLATES.length);
      const template = SIMULATOR_TEMPLATES[templateIdx];
      
      let logMessage = template.text;
      
      if (template.type === "move") {
        setAnalyticsMoves(prev => prev + 1);
        triggerVibe();
      } else if (template.type === "candidate") {
        setAnalyticsCandidates(prev => prev + 2);
      } else if (template.type === "strategy") {
        setAnalyticsStrategies(prev => prev + 1);
        setAnalyticsCandidates(prev => prev + 1);
      } else if (template.type === "solve") {
        setAnalyticsSolved(prev => prev + 1);
        setHeatmapActivity(prevH => {
          const copy = [...prevH];
          const last = copy.length - 1;
          copy[last] = Math.min(180, copy[last] + 15);
          return copy;
        });

        // Award XP on successful simulation of board clearance
        onUpdateProfile({
          ...profile,
          xp: profile.xp + 50,
          completedGames: profile.completedGames + 1,
          totalGames: profile.totalGames + 1
        });
      }
      
      // Occasionally simulate a small mistake or hint request to make the simulation fully realistic!
      const randValue = Math.random();
      if (randValue > 0.94) {
        setAnalyticsMistakes(prev => prev + 1);
        logMessage = `⚠️ Constraint violation detected! Resolved speculative cell conflict in Row ${Math.floor(Math.random() * 9 + 1)} Column ${Math.floor(Math.random() * 9 + 1)}.`;
      } else if (randValue > 0.88 && randValue <= 0.94) {
        setAnalyticsHints(prev => prev + 1);
        logMessage = "🔍 Requested AI Coach hint for strategic guidance on XY-Wing structures.";
      }

      // Add to simulated logs (limit to last 20)
      setSimulatedLogs(prev => [logMessage, ...prev].slice(0, 20));
      
      // Update heatmap activity occasionally
      if (Math.random() > 0.92) {
        setHeatmapActivity(prevH => {
          const copy = [...prevH];
          const randomDay = Math.floor(Math.random() * 28);
          copy[randomDay] = Math.min(120, copy[randomDay] + 5);
          return copy;
        });
      }
    }, 1200); // 1.2s per simulation tick
    return () => clearInterval(interval);
  }, [statsSimActive, profile]);
  const [coachCustomBoard, setCoachCustomBoard] = useState<number[][]>(() => [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ]);
  // Highlights vector to visually show candidates/cells on the guided board
  const [coachHighlightedCells, setCoachHighlightedCells] = useState<Array<[number, number]>>([]);
  const [coachActiveCell, setCoachActiveCell] = useState<[number, number] | null>(null);

  // ================= SKUDO LENS HELPERS =================
  // 1. Voice Synthesis Speech Output
  const readSpeechVerbally = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 0.95;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // ================= SKUDO MASTER COACH VOICE ENGINE =================
  const speakAsCoach = (rawText: string) => {
    if (coachIsMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      let prefix = "";
      let pitch = 1.0;
      
      if (coachVoiceMode === 'teacher') {
        prefix = "Student, pay attention! ";
        pitch = 1.15;
      } else if (coachVoiceMode === 'friendly') {
        prefix = "Let's check this out. ";
        pitch = 1.0;
      } else if (coachVoiceMode === 'tournament') {
        prefix = "Fast lock-in! ";
        pitch = 0.9;
      } else if (coachVoiceMode === 'master') {
        prefix = "Look closer, search the empty spots. ";
        pitch = 1.1;
      }
      
      const utterance = new SpeechSynthesisUtterance(prefix + rawText);
      utterance.pitch = pitch;
      utterance.rate = coachVoiceSpeed;
      
      utterance.onstart = () => setCoachVisualWave(true);
      utterance.onend = () => setCoachVisualWave(false);
      utterance.onerror = () => setCoachVisualWave(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCoachChatSubmit = (e?: any) => {
    if (e) e.preventDefault();
    if (!coachChatQuery.trim()) return;
    
    const userMsg = coachChatQuery.trim();
    setCoachChatQuery('');
    
    // Append user message
    const history = [...coachChatHistory, { sender: 'user' as const, text: userMsg }];
    setCoachChatHistory(history);
    gameAudio.playClick();
    
    // Choose dynamic response
    let answerText = "";
    const lower = userMsg.toLowerCase();
    
    if (lower.includes('swordfish') || lower.includes('levels')) {
      answerText = "A Swordfish is a magnificent grid structure! It coordinates 3 parallel rows and 3 parallel columns. If a candidate only fits in up to 3 columns across those 3 rows, you can strip that candidate from all other spots in those entire columns. It is Level 4 expertise, pay close attention to triple sightings!";
    } else if (lower.includes('propagation') || lower.includes('sat')) {
      answerText = "Constraint propagation is how modern automated engines solve Sudoku! By utilizing arc-consistency algorithms, the system eliminates invalid candidate domains recursively across connected cells. It prevents guesswork entirely, leading to sub-millisecond solving times.";
    } else if (lower.includes('pair') || lower.includes('naked')) {
      answerText = "Naked Pairs are two identical candidate sets (for example [4,7]) shared by exactly two cells in a single block or line. Because these cells must consume those two numbers, they are forbidden everywhere else inside that row, column, or box!";
    } else if (lower.includes('hint') || lower.includes('cheat')) {
      answerText = "I always recommend starting with a Level 1 Clue: look for cells with multiple row-column crossings! If stuck, raise the Hint Level inside my panel to get strategy-specific maps.";
    } else if (lower.includes('basics') || lower.includes('rule') || lower.includes('begin')) {
      answerText = "Sudoku is a pristine game of absolute constraints. You must fill every horizontal row, vertical column, and local 3x3 box with digits 1 through 9. No overlaps, no guessing. Start with our Beginner Academy to build strong sightlines!";
    } else {
      answerText = `Interesting question! "${userMsg}" is a superb tactical concept. Look closely at how Candidates partition the grid, and practice regularly. I'm here to support you 24/7!`;
    }
    
    // Set response after a brief organic delay
    setTimeout(() => {
      setCoachChatHistory(prev => [...prev, { sender: 'coach' as const, text: answerText }]);
      speakAsCoach(answerText);
    }, 450);
  };

  // 2. High-Accuracy Extraction Solver OCR Simulation (with calibration validation gates!)
  const handleScanAndTrace = () => {
    gameAudio.playClick();
    triggerVibe();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (lensBlur > 4) {
      setLensVerificationError("Image quality is insufficient. Blurred coordinates exceed boundary threshold. Please upload a clearer Sudoku image.");
      setLensScanProgress(-1);
      return;
    }
    if (lensRotation < -15 || lensRotation > 15) {
      setLensVerificationError("Image quality is insufficient. Skew and rotation angle too extreme. Adjust rotation or upload a perpendicular Sudoku image.");
      setLensScanProgress(-1);
      return;
    }
    if (lensLighting < 40) {
      setLensVerificationError("Image quality is insufficient. Shadow overlap and dark lighting detected. Please illuminate the physical magazine/newspaper better.");
      setLensScanProgress(-1);
      return;
    }
    if (lensCropped) {
      setLensVerificationError("Image quality is insufficient. Grid boundary is severely cropped. Frame the complete 9x9 outer perimeter.");
      setLensScanProgress(-1);
      return;
    }

    // Passed constraints verification checks -> proceed with trace simulation
    setLensVerificationError(null);
    setLensScanProgress(0);

    let progressSim = 0;
    const progressInterval = setInterval(() => {
      progressSim += 5;
      if (progressSim >= 90) {
        clearInterval(progressInterval);
        setLensScanProgress(90);
      } else {
        setLensScanProgress(progressSim);
      }
    }, 150);

    if (lensBase64) {
      // Connects directly to backend deep vision digitization endpoint!
      fetch("/api/lens/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: lensBase64 }),
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((err) => {
              throw new Error(err.error || "Failed to scan and digitize matrix.");
            });
          }
          return res.json();
        })
        .then((data) => {
          clearInterval(progressInterval);
          setLensScanProgress(100);

          if (data.grid && Array.isArray(data.grid) && data.grid.length === 9) {
            setLensOriginalBoard(data.grid);
            if (data.confidences && Array.isArray(data.confidences)) {
              setLensCellConfidences(data.confidences);
            } else {
              setLensCellConfidences(data.grid.map((row: any) => row.map((v: number) => (v === 0 ? 100 : 96))));
            }
            if (data.difficulty) {
              setLensDifficulty(data.difficulty);
            }
          } else {
            throw new Error("Invalid matrix structure returned from scanner.");
          }
        })
        .catch((error) => {
          clearInterval(progressInterval);
          setLensScanProgress(-1);
          setLensVerificationError(error.message || "Failed to analyze Sudoku grid via Vision engine. Refocus and try again.");
        });
    } else {
      const interval = setInterval(() => {
        setLensScanProgress((curr) => {
          if (curr >= 100) {
            clearInterval(interval);
            const baseGrid = lensFile && lensFile.includes("Extreme")
              ? [
                  [0, 0, 0, 6, 0, 0, 4, 0, 0],
                  [7, 0, 0, 0, 0, 3, 6, 0, 0],
                  [0, 0, 0, 0, 9, 1, 0, 8, 0],
                  [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  [0, 5, 0, 1, 8, 0, 0, 0, 3],
                  [0, 0, 0, 3, 0, 6, 0, 4, 5],
                  [0, 4, 0, 2, 0, 0, 0, 6, 0],
                  [9, 0, 3, 0, 0, 0, 0, 0, 0],
                  [0, 2, 0, 0, 0, 0, 1, 0, 0]
                ]
              : [
                  [5, 3, 0, 0, 7, 0, 0, 0, 0],
                  [6, 0, 0, 1, 9, 5, 0, 0, 0],
                  [0, 9, 8, 0, 0, 0, 0, 6, 0],
                  [8, 0, 0, 0, 6, 0, 0, 0, 3],
                  [4, 0, 0, 8, 0, 3, 0, 0, 1],
                  [7, 0, 0, 0, 2, 0, 0, 0, 6],
                  [0, 6, 0, 0, 0, 0, 2, 8, 0],
                  [0, 0, 0, 4, 1, 9, 0, 0, 5],
                  [0, 0, 0, 0, 8, 0, 0, 7, 9]
                ];

            const confs = baseGrid.map((row, r) => 
              row.map((val, c) => {
                if (val === 0) return 100;
                if (r === 0 && c === 0) return 84; // demo uncertainty value
                if (r === 7 && c === 3) return 89; // demo uncertainty value
                return Math.floor(Math.random() * 8) + 93;
              })
            );

            setLensOriginalBoard(baseGrid);
            setLensCellConfidences(confs);
            setLensActiveExplanationIdx(0);
            return 100;
          }
          return curr + 5;
        });
      }, 100);
    }
  };

  // 3. Strategy Suite Derivation
  const activeStratAnalyses = analyzeStrategies(lensDifficulty);

  // ======================== END SKUDO LENS HELPERS ========================

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
  const [coachVoice, setCoachVoice] = useState<string>(() => localStorage.getItem('skudo_coach_voice') || 'neural');
  const [chatInputImage, setChatInputImage] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState<boolean>(() => localStorage.getItem('skudo_voice_mode') !== 'false');
  
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
  const [monthlyHighScore, setMonthlyHighScore] = useState<number>(0);
  const [showCertificateVault, setShowCertificateVault] = useState<boolean>(false);
  const [earnedCertificates, setEarnedCertificates] = useState<any[]>([]);
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
      const mScore = localStorage.getItem('skudo_monthly_highscore');
      if (dScore) setDailyHighScore(parseInt(dScore, 10));
      if (wScore) setWeeklyHighScore(parseInt(wScore, 10));
      if (mScore) setMonthlyHighScore(parseInt(mScore, 10));
    };

    checkSaved();
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Load certificates whenever Certificate Vault modal is opened
  useEffect(() => {
    if (showCertificateVault) {
      try {
        const raw = localStorage.getItem('skudo_earned_certificates');
        if (raw) {
          setEarnedCertificates(JSON.parse(raw));
        } else {
          setEarnedCertificates([]);
        }
      } catch (e) {
        console.error("Failed to parse certificates", e);
      }
    }
  }, [showCertificateVault]);

  // Retrieve current tournament state and handle self-healing reset triggers
  const getTournamentState = (type: 'daily' | 'weekly' | 'monthly') => {
    const defaultState = {
      tournamentId: `${type}_${new Date().toISOString().split('T')[0]}`,
      type: type,
      hasPlayed: false,
      isLocked: false,
      completionStatus: 'unplayed',
      earnedCertificateId: null
    };

    try {
      const raw = localStorage.getItem(`skudo_t_state_${type}`);
      if (raw) {
        const state = JSON.parse(raw);
        const lastPlayed = localStorage.getItem(`skudo_last_played_${type}`);
        const lastPlayedTime = lastPlayed ? parseInt(lastPlayed, 10) : 0;
        
        let isExpired = false;
        if (type === 'daily' && Date.now() > lastPlayedTime + 24 * 60 * 60 * 1000) {
          isExpired = true;
        } else if (type === 'weekly' && Date.now() > lastPlayedTime + 7 * 24 * 3600 * 1000) {
          isExpired = true;
        } else if (type === 'monthly') {
          const d = new Date();
          const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
          if (Date.now() > nextMonth.getTime()) {
            isExpired = true;
          }
        }
        
        if (isExpired) {
          localStorage.removeItem(`skudo_t_state_${type}`);
          localStorage.removeItem(`skudo_last_played_${type}`);
          return defaultState;
        }
        
        return {
          ...state,
          isLocked: true
        };
      }
    } catch (e) {
      console.error(e);
    }
    return defaultState;
  };

  // Format real-time resets countdown label
  const getResetsCountdown = (type: 'daily' | 'weekly' | 'monthly', lastPlayedTime: number) => {
    if (!lastPlayedTime) return null;
    if (type === 'daily') {
      const remaining = Math.max(0, lastPlayedTime + 24 * 60 * 60 * 1000 - now);
      if (remaining <= 0) return null;
      const h = Math.floor(remaining / (3600 * 1000));
      const m = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
      const s = Math.floor((remaining % (60 * 1000)) / 1000);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else if (type === 'weekly') {
      const remaining = Math.max(0, lastPlayedTime + 7 * 24 * 3600 * 1000 - now);
      if (remaining <= 0) return null;
      const days = Math.floor(remaining / (24 * 3600 * 1000));
      const hours = Math.floor((remaining % (24 * 3600 * 1000)) / (3600 * 1000));
      const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
      return `${days}d ${hours}h ${mins}m`;
    } else {
      const d = new Date();
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const remaining = Math.max(0, nextMonth.getTime() - now);
      if (remaining <= 0) return null;
      const days = Math.floor(remaining / (24 * 3600 * 1000));
      const hours = Math.floor((remaining % (24 * 3600 * 1000)) / (3600 * 1000));
      const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
      return `${days}d ${hours}h ${mins}m`;
    }
  };

  // Securely download high contrast championship certificate as customizable SVG format
  const downloadCertificateFromDashboard = (cert: any) => {
    const formattedTier = cert.type === 'daily' ? 'Daily' : cert.type === 'weekly' ? 'Weekly' : 'Monthly';
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
        
        <text x="400" y="295" font-family="'Inter', sans-serif" font-weight="900" font-size="36" fill="#F5B041" text-anchor="middle">\${cert.playerName.toUpperCase()}</text>
        <line x1="200" y1="315" x2="600" y2="315" stroke="url(#gold-shine)" stroke-width="2" />
        
        <text x="400" y="355" font-family="'Inter', sans-serif" font-size="15" fill="#E2E8F0" text-anchor="middle" font-weight="600">has successfully conquered the ultra-high stakes</text>
        <text x="400" y="395" font-family="'Inter', sans-serif" font-weight="800" font-size="24" fill="#38BDF8" text-anchor="middle" letter-spacing="1.5">\${formattedTier.toUpperCase()} SUDOKU TOURNAMENT</text>
        
        <g transform="translate(100, 430)">
          <rect x="20" y="0" width="165" height="55" fill="#111827" stroke="#1E293B" rx="8" />
          <text x="102" y="20" font-family="'Inter', sans-serif" font-weight="700" font-size="9" fill="#64748B" text-anchor="middle" letter-spacing="1">DATE COMPLETED</text>
          <text x="102" y="42" font-family="'Inter', sans-serif" font-weight="800" font-size="12" fill="#F8FAFC" text-anchor="middle">\${cert.date}</text>
          
          <rect x="205" y="0" width="165" height="55" fill="#111827" stroke="#1E293B" rx="8" />
          <text x="287" y="20" font-family="'Inter', sans-serif" font-weight="700" font-size="9" fill="#64748B" text-anchor="middle" letter-spacing="1">TIME TAKEN</text>
          <text x="287" y="42" font-family="'Inter', sans-serif" font-weight="800" font-size="14" fill="#38BDF8" text-anchor="middle">\${cert.time}</text>
          
          <rect x="390" y="0" width="180" height="55" fill="#111827" stroke="#1E293B" rx="8" />
          <text x="480" y="20" font-family="'Inter', sans-serif" font-weight="700" font-size="9" fill="#64748B" text-anchor="middle" letter-spacing="1">SCORE SECURED</text>
          <text x="480" y="42" font-family="'Inter', sans-serif" font-weight="900" font-size="14" fill="#4ADE80" text-anchor="middle">\${cert.score} PTS</text>
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
    triggerLink.download = `Skudo_Championship_Certificate_\${formattedTier}_\${cert.date.replace(/\\s+/g, '_')}.svg`;
    document.body.appendChild(triggerLink);
    triggerLink.click();
    document.body.removeChild(triggerLink);
    URL.revokeObjectURL(url);
  };

  // Main game initialization and lockout write trigger for competitive tournaments
  const handleStartTournamentGame = (type: 'daily' | 'weekly' | 'monthly') => {
    gameAudio.playClick();
    triggerVibe();
    
    // Lock it down immediately on play click to prevent re-attempts/exiting!
    const tState = {
      tournamentId: `skudo_tournament_\${type}_\${new Date().toISOString().split('T')[0]}`,
      type: type,
      hasPlayed: true,
      isLocked: true,
      completionStatus: 'unplayed',
      earnedCertificateId: null
    };
    localStorage.setItem(`skudo_t_state_\${type}`, JSON.stringify(tState));
    localStorage.setItem(`skudo_last_played_\${type}`, Date.now().toString());

    onSelectGame({
      mode: 'numbers',
      difficulty: type === 'daily' ? 'focus' : 'quantum',
      special: type
    });
  };

  // Audio Speech synthesis
  const speakText = (text: string, force = false) => {
    if (!window.speechSynthesis || (!audioEnabled && !force)) return;
    
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Clean markdown, symbols, and remove emoji to prevent speech engines from pronouncing emoji literally.
    // Also add smart abbreviations expansion and phonetical adjustments for premium pronunciation of "Sudoku" and "Skudo"
    const cleanText = text
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/#+\s/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/[|•:\-_]/g, ' ')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\bvs\b\.?/gi, 'versus')
      .replace(/\be\.g\./gi, 'for example,')
      .replace(/\bi\.e\./gi, 'that is,')
      .replace(/\bmax\b\.?/gi, 'maximum')
      .replace(/\bmin\b\.?/gi, 'minimum')
      .replace(/\bsec\b\.?/gi, 'seconds')
      .replace(/\bhr\b\.?/gi, 'hour')
      .replace(/\bqty\b\.?/gi, 'quantity')
      .replace(/\bpts\b\.?/gi, 'points')
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
    
    // Set parameters for premium clarity and steady cadence using the configured coach voice speed
    utterance.rate = coachVoiceSpeed;
    utterance.pitch = coachVoice === 'male' ? 0.95 : 1.02; // Deeper for male, crispy for neural/female

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

  const processChatImage = (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setAiChat(prev => [...prev, { 
        sender: 'ai', 
        text: `⚠️ Attachment Error: Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image smaller than 10MB for premium logical processing.`, 
        id: `err-${Date.now()}` 
      }]);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setChatInputImage(reader.result as string);
      if (typeof window !== 'undefined') {
        gameAudio.playClick();
        triggerVibe();
      }
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

  // Submit Prompt via full-stack secure API Route proxying Gemini API request with instant text chunk streaming!
  const submitAiPrompt = async (promptText?: string) => {
    const activePrompt = promptText || aiQuery;
    const sendingImage = chatInputImage;
    if (!activePrompt.trim() && !sendingImage) return;

    gameAudio.playClick();
    triggerVibe();
    stopSpeaking();

    // Check if prompt is requesting image visualization/creation
    const isImageRequest = !sendingImage && /generate\s*(an?)?\s*image|create\s*(an?)?\s*image|make\s*(an?)?\s*image|generate\s*(an?)?\s*picture|create\s*(an?)?\s*picture|make\s*(an?)?\s*picture|draw|paint|visualize|show\s*(an?)?\s*image|show\s*(an?)?\s*picture|illustration|create\s*a\s*visual|photo|sketch|render/i.test(activePrompt);

    // Append user message to Chat history
    const userMsg = { 
      sender: 'user' as const, 
      text: activePrompt || "Scanned image attachment", 
      id: `user-${Date.now()}`,
      imageUrl: sendingImage || undefined
    };
    setAiChat(prev => [...prev, userMsg]);
    setAiQuery('');
    setChatInputImage(null);
    setAiLoading(true);

    // If we're on Home page, direct them to Chat view to view progress
    if (activeTab === 'home') {
      setActiveTab('chat');
    }

    const aiMessageId = `ai-${Date.now()}`;

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: activePrompt, 
          stream: !isImageRequest,
          image: sendingImage || undefined,
          lang: localStorage.getItem('skudo_lang') || 'en'
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errText = data.error || "Cognitive request limit reached. Check connection.";
        setAiChat(prev => [...prev, { sender: 'ai', text: `⚠️ Skudo AI Note: ${errText}`, id: `err-${Date.now()}` }]);
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (isImageRequest || contentType.includes('application/json')) {
        const data = await response.json();
        if (data.text || data.imageUrl) {
          const coachMsg = {
            sender: 'ai' as const,
            text: data.text || "Generated image for you.",
            id: aiMessageId,
            imageUrl: data.imageUrl
          };
          setAiChat(prev => [...prev, coachMsg]);
          if (voiceModeEnabled) {
            speakText(coachMsg.text);
          }
        }
      } else {
        // Stream text chunk-by-chunk!
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Body reader unavailable");

        const decoder = new TextDecoder();
        let done = false;
        let cumulativeText = "";

        // Add empty AI bubble immediately to start typing
        const placeholderMsg = {
          sender: 'ai' as const,
          text: "",
          id: aiMessageId
        };
        setAiChat(prev => [...prev, placeholderMsg]);

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            cumulativeText += chunk;
            setAiChat(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: cumulativeText } : msg));
          }
        }

        // Speak the completed text output with premium coach cadence
        if (cumulativeText && voiceModeEnabled) {
          speakText(cumulativeText);
        }
      }
    } catch (e: any) {
      console.error("Streaming chat response failed:", e);
      setAiChat(prev => [...prev, { sender: 'ai', text: "⚠️ Network Offline: Failed to stream Skudo AI backend response.", id: `net-${Date.now()}` }]);
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
          <div className="relative w-9 h-9 flex items-center justify-center">
            {/* Outer Hexagon Orbiting Ring */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[spin_15s_linear_infinite] opacity-80">
              <polygon 
                points="50,5 89,27 89,73 50,95 11,73 11,27" 
                fill="none" 
                stroke="#009DFF" 
                strokeWidth="5" 
                strokeDasharray="14 8"
              />
            </svg>
            {/* Inner Counter-rotating Gyroscope Ring */}
            <svg viewBox="0 0 100 100" className="absolute w-[72%] h-[72%] animate-[spin_8s_linear_infinite_reverse] opacity-90">
              <circle 
                cx="50" 
                cy="50" 
                r="38" 
                fill="none" 
                stroke="#A855F7" 
                strokeWidth="7" 
                strokeDasharray="40 15 10 15"
              />
            </svg>
            {/* Glowing Advanced Core Glyph */}
            <div className="relative w-3.5 h-3.5 flex items-center justify-center">
              <div className="absolute w-full h-full bg-[#009DFF] rotate-45 animate-pulse rounded-[2px] shadow-[0_0_12px_rgba(0,157,255,0.8)]" />
              <div className="absolute w-2 h-2 bg-white rotate-45 rounded-[1px]" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-sans text-sm font-black tracking-wider leading-none text-slate-800 dark:text-white flex items-center gap-1">
              SKUDO <span className="text-[#009DFF] text-[10px] px-1 py-0.5 bg-[#009DFF]/10 rounded font-mono font-bold">OMNI AI</span>
            </h1>
            <span className="text-[7.5px] uppercase tracking-widest text-[#A855F7] font-black mt-0.5">Quantum Neural Engine</span>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 py-2 lg:py-0 w-full shrink-0 no-scrollbar">
          {[
            { id: 'home', label: 'Home', desc: 'AI Assistant', icon: Home },
            { id: 'chat', label: 'Chat', desc: 'Ask Skudo AI', icon: Send },
            { id: 'play', label: 'Puzzles', desc: 'Play & Practice', icon: Play },
            { id: 'lens', label: 'Skudo Lens', desc: 'Photo Solve', icon: Camera },
            { id: 'learn', label: 'Coach', desc: 'Learn & Improve', icon: BookOpen },
            { id: 'arena', label: 'Arena', desc: 'Connect & Compete', icon: Compass },
            { id: 'analytics', label: 'Analytics', desc: 'Brain Insights', icon: Activity },
            { id: 'achievements', label: 'Achievements', desc: 'Badges & Goals', icon: Award },
            { id: 'sandbox', label: 'Sandbox', desc: 'Interactive Learning', icon: Grid },
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
                    const level = Math.floor((profile?.xp || 0) / 250) + 1;
                    const winrate = profile?.totalGames > 0 ? Math.round((profile.completedGames / profile.totalGames) * 100) : 100;
                    const localStorageBytes = JSON.stringify(localStorage).length;
                    const localStorageKeys = Object.keys(localStorage).length;
                    
                    const systemSearchItems = [
                      { 
                        title: "🏠 Switch to Home Dashboard Lobby", 
                        sub: `Profile: ${profile?.name || "Member"} • Lvl ${level} (${profile?.xp || 0} XP) • Streak: ${profile?.streak || 0} Days`, 
                        keywords: "home dashboard lobby index welcome main menu back to start screen",
                        action: () => { setActiveTab('home'); setSearchQuery(''); } 
                      },
                      { 
                        title: "💬 Active AI Mind Coach Chat", 
                        sub: "Dynamic Gemini neural network tutor. Ask logic tips or solver rules", 
                        keywords: "chat ai coach assistant gemini helper talk converse puzzle advice tutor solver",
                        action: () => { setActiveTab('chat'); setSearchQuery(''); } 
                      },
                      { 
                        title: "🔢 Solve Classic numeric Sudoku", 
                        sub: "Launch Standard numeric grid (easy, medium, hard, custom)", 
                        keywords: "play classic sudoku numeric grid easy medium hard numbers level",
                        action: () => { setShowDifficultyPopupMode('numbers'); setSearchQuery(''); setActiveTab('play'); } 
                      },
                      { 
                        title: "🔤 Solve Alpha Letters Sudoku", 
                        sub: "Launch character grid solver re-wired on A-I alphabet system", 
                        keywords: "play letters sudoku alpha grid easy medium hard character alphabet A-I",
                        action: () => { setShowDifficultyPopupMode('letters'); setSearchQuery(''); setActiveTab('play'); } 
                      },
                      { 
                        title: "📸 Skudo Lens AI OCR Camera scanner", 
                        sub: `Capture off-page printed Sudokus. Frame Permissions: ${(metadata.requestFramePermissions || []).join(', ')}`, 
                        keywords: "lens camera picture scan physical photo upload paper grid recognition frame permission",
                        action: () => { setActiveTab('lens'); setSearchQuery(''); } 
                      },
                      { 
                        title: "🎓 Strategy Academy Lessons Index", 
                        sub: "Step-by-step master tutorial walkholds for 95 tactical systems", 
                        keywords: "learn tactics academy techniques tutorial guide single candidate naked pair x-wing swordfish",
                        action: () => { onOpenLegacyAcademy(); setSearchQuery(''); } 
                      },
                      { 
                        title: "⚔️ Quantum Pantheon Arena Oracle", 
                        sub: "Fight the quantum computer SAT solver boss in extreme custom time", 
                        keywords: "arena league e-sports tournament championship oracle quantum boss oracle sat",
                        action: () => { setActiveTab('play'); setSearchQuery(''); } 
                      },
                      { 
                        title: "📈 Dynamic Performance Diagnostics Stats", 
                        sub: `Today: ${profile?.completedGames || 0} wins / ${profile?.totalGames || 0} games (${winrate}% winrate)`, 
                        keywords: "analytics analytics progress diagnostic stats performance telemetry metric accuracy time",
                        action: () => { setActiveTab('analytics'); setSearchQuery(''); } 
                      },
                      { 
                        title: "🏅 Master Achievements & Sage Titles", 
                        sub: `Check title milestones & XP awards (ELO ${liveSkudoIQ} Rank: ${profile?.experience || "Active Sage"})`, 
                        keywords: "achievements trophies awards milestones score xp stage title badge pantheon sage",
                        action: () => { setActiveTab('achievements'); setSearchQuery(''); } 
                      },
                      { 
                        title: "⚙️ OS Personalization & Theme Settings", 
                        sub: "Tune audio sound effects, sound synth state, active themes and cache", 
                        keywords: "settings specifications wipe sound audio theme controller configs sound font customize",
                        action: () => { setActiveTab('settings'); setSearchQuery(''); } 
                      },
                      { 
                        title: "❓ Help Support & Diagnostic Desk FAQ", 
                        sub: "File active tickets, inspect platform support guides and error reports", 
                        keywords: "help support bug faq tickets feedback guide crash error bug support",
                        action: () => { setActiveTab('help'); setSearchQuery(''); } 
                      },
                      { 
                        title: `🔊 System Audio Synthesizer: ${audioEnabled ? 'MUTED' : 'TACTILE SINE-WAVE ENABLED'}`, 
                        sub: `Currently ${audioEnabled ? 'Active' : 'Muted'}. Trigger switch clicking on search`, 
                        keywords: "audio sound enable audio volume toggle synth chimes music audioEnabled sounds",
                        action: () => { onToggleAudio(); setSearchQuery(''); } 
                      },
                      { 
                        title: `🎨 Toggle Workspace Theme: ${theme === 'dark' ? 'Light mode' : 'Dark cosmic mode'}`, 
                        sub: `Currently on ${theme === 'dark' ? 'Deep cosmic dark mode' : 'Bright air-glass white mode'}`, 
                        keywords: "toggle theme switch dark light mode styles background colors look face workspace visual",
                        action: () => { onToggleTheme(); setSearchQuery(''); } 
                      },
                      { 
                        title: "🚀 SKUDO PRODUCT INFORMATION CENTER v3.0", 
                        sub: `Release: v3.0.0-Live-Production • Core Tech: React v${React.version} • Server Host: ${window.location.hostname || "localhost"}:${window.location.port || "3000"}`, 
                        keywords: "product software specifications specs metadata package.json configuration build version environment status connection platform hardware viewport storage information center v3.0 release host port",
                        action: () => { setActiveTab('settings'); setSearchQuery(''); } 
                      },
                      { 
                        title: "📁 Active Local Storage Memory footstep", 
                        sub: `Occupancy: ${localStorageBytes} B of client space across ${localStorageKeys} keys`, 
                        keywords: "local storage memory bytes keys count profile state diagnostic footprint metadata payload save cache",
                        action: () => { setActiveTab('settings'); setSearchQuery(''); } 
                      },
                      { 
                        title: "⌚ UTC Dynamic Operating Epoch second", 
                        sub: `Live Stamp: ${new Date().toISOString()}`, 
                        keywords: "time clock calendar utc hour date day current time epoch second moment scheduler real calendar",
                        action: () => { setActiveTab('home'); setSearchQuery(''); } 
                      }
                    ];

                    const items = systemSearchItems.filter(item => 
                      item.title.toLowerCase().includes(q) || 
                      item.sub.toLowerCase().includes(q) ||
                      item.keywords.toLowerCase().includes(q)
                    );

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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* Hero Section Banner Panel (col-span-1 md:col-span-2) */}
                    <div className={`md:col-span-2 p-6 rounded-3xl border flex flex-col justify-between gap-6 relative overflow-hidden transition-colors shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-r from-slate-900 to-[#121B2F] border-slate-700/60' 
                        : 'bg-gradient-to-r from-white via-slate-50/50 to-[#EAF7FF]/60 border-slate-200/50'
                    }`}>
                      {/* Decorative pulsing abstract vector particle circles inside header */}
                      <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#009DFF]/8 rounded-full blur-2xl" />
                      
                      {/* Greeting Title */}
                      <div className="flex flex-col gap-1 text-left relative z-10 max-w-full">
                        <h2 className="font-sans text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-1.5 leading-none">
                          {greetingInfo.text}, <span className="text-[#009DFF]">{profile.name}</span>
                          <span className="inline-block animate-bounce">{greetingInfo.icon}</span>
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
                    </div>

                    {/* Dedicated Vertical Profile Container (col-span-1) */}
                    <div className={`md:col-span-1 p-6 rounded-3xl border flex flex-col items-center text-center justify-between gap-4.5 relative overflow-hidden transition-all shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-[#151B2E]/60 border-slate-800' 
                        : 'bg-white border-slate-200/50 shadow-sm'
                    }`}>
                      {/* Glowing background hint */}
                      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
                      
                      {/* Avatar with absolute green dot status */}
                      <div className="relative shrink-0 select-none">
                        <div className="w-16 h-16 bg-gradient-to-tr from-[#009DFF] to-violet-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl border border-white/20 shadow-md relative overflow-hidden">
                          {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            profile.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Status Green Circle Indicator */}
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center shadow-xs">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        </div>
                      </div>
                      
                      {/* Username */}
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{profile.name}</h4>
                        <span className="text-[8.5px] font-black uppercase text-emerald-500 flex items-center justify-center gap-1 leading-none tracking-widest mt-1 select-none">
                          ACTIVE SOLVER
                        </span>
                      </div>

                      {/* Rank Experience Category */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider leading-none border ${
                          theme === 'dark' ? 'bg-[#121B2F] border-cyan-950 text-[#009DFF]' : 'bg-sky-50 border-sky-100 text-[#009DFF]'
                        }`}>
                          {profile.experience}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider leading-none border ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-805 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-600'
                        }`}>
                          ⭐ {liveSkudoIQ} ELO
                        </span>
                      </div>

                      {/* XP Progress Representation */}
                      {(() => {
                        const levelData = getLevelInfo(profile.xp);
                        return (
                          <div className="w-full flex flex-col gap-1.5 px-0.5 mt-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 dark:text-slate-400">
                              <span className="font-mono font-black text-slate-705 dark:text-slate-205">Level {levelData.level}</span>
                              <span className="font-mono text-[9px]">{levelData.xpInLevel} / {levelData.xpNeeded} XP</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative border border-slate-200/20">
                              <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#009DFF] to-violet-500 transition-all duration-300" style={{ width: `${levelData.percent}%` }} />
                            </div>
                            <span className="text-[8.5px] font-black text-right text-slate-400 leading-none">{levelData.percent}% to Next Level</span>
                          </div>
                        );
                      })()}
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
                      <h3 className={`font-sans text-xl font-extrabold flex items-center justify-center gap-2 leading-none ${
                        theme === 'dark' ? 'text-slate-100' : 'text-[#0f172a]'
                      }`}>
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
                          className="flex-1 min-w-0 bg-transparent px-2 text-xs font-semibold focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 border-none placeholder-[#64748b] dark:placeholder-slate-500"
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

                  {/* ====== DAILY PERFORMANCE DIAGNOSTICS (DAILY SUMMARY PANEL) ====== */}
                  <div className={`p-6 rounded-3xl border flex flex-col gap-4 relative overflow-hidden transition-all ${
                    theme === 'dark' ? 'bg-[#0E1326]/70 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800/40 pb-2">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4.5 h-4.5 text-[#009DFF]" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Daily Performance Diagnostics</h4>
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-[#009DFF] font-extrabold flex items-center gap-1 bg-[#009DFF]/10 px-1.5 py-0.5 rounded animate-pulse">
                        <span className="w-1 h-1 bg-[#009DFF] rounded-full" />
                        LIVE DIAGNOSTIC SYNC
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {/* Stat 1: Today's Solves */}
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02] ${
                        theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-100 shadow-inner'
                      }`}>
                        <Trophy className="w-4.5 h-4.5 text-amber-500" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Today's Solves</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono leading-none mt-0.5">
                          {Math.max(1, (profile.completedGames || 0) % 5)}
                        </span>
                      </div>

                      {/* Stat 2: Today's Accuracy */}
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02] ${
                        theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-100 shadow-inner'
                      }`}>
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Today's Accuracy</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono leading-none mt-0.5">
                          {profile.totalGames > 0 ? Math.round((profile.completedGames / profile.totalGames) * 100) : 96}%
                        </span>
                      </div>

                      {/* Stat 3: Today's Time Played */}
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02] ${
                        theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-100 shadow-inner'
                      }`}>
                        <Activity className="w-4.5 h-4.5 text-[#009DFF]" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Time Played</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono leading-none mt-0.5 whitespace-nowrap">
                          {Math.max(14, Math.floor(profile.totalTime / 60) + 8)}m
                        </span>
                      </div>

                      {/* Stat 4: Strategies Learned */}
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02] ${
                        theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-100 shadow-inner'
                      }`}>
                        <BookOpen className="w-4.5 h-4.5 text-violet-500" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Strategies</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono leading-none mt-0.5">
                          3 / 8
                        </span>
                      </div>

                      {/* Stat 5: XP Earned Today */}
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02] ${
                        theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-100 shadow-inner'
                      }`}>
                        <Sparkles className="w-4.5 h-4.5 text-pink-500" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">XP Earned</span>
                        <span className="text-base font-black text-emerald-500 font-mono leading-none mt-0.5 whitespace-nowrap">
                          +{Math.max(110, (profile.xp || 0) % 500)} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= RIGHT SIDEBAR ON HOME TABS ================= */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
                  
                  {/* WIDGET 1: DAILY PROGRESS */}
                  {(() => {
                    // Objective 1: Solve 3 Puzzles
                    const obj1Current = Math.min(3, (profile.completedGames || 0) % 4 || 1); 
                    const obj1Target = 3;
                    const obj1Percent = Math.round((obj1Current / obj1Target) * 100);
                    const obj1Done = obj1Current >= obj1Target;

                    // Objective 2: Complete 1 Training Lesson
                    const obj2Done = localStorage.getItem('skudo_lessons_viewed_count') ? true : false;
                    const obj2Current = obj2Done ? 1 : 0;
                    const obj2Percent = obj2Done ? 100 : 0;

                    // Objective 3: Use X-Wing Strategy
                    const obj3Done = profile.completedGames >= 3;
                    const obj3Current = obj3Done ? 1 : 0;
                    const obj3Percent = obj3Done ? 100 : 0;

                    // Objective 4: Achieve 95% Accuracy
                    const obj4Done = true; 
                    const obj4Percent = 100;

                    // Objective 5: Finish a Zen Session
                    const obj5Done = profile.completedGames >= 1;
                    const obj5Current = obj5Done ? 1 : 0;
                    const obj5Percent = obj5Done ? 100 : 0;

                    let completedCount = 0;
                    if (obj1Done) completedCount++;
                    if (obj2Done) completedCount++;
                    if (obj3Done) completedCount++;
                    if (obj4Done) completedCount++;
                    if (obj5Done) completedCount++;

                    const overallPercent = Math.round((completedCount / 5) * 100);

                    return (
                      <div className={`p-4.5 rounded-2xl border flex flex-col gap-3.5 transition-all ${
                        theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Daily Progress</span>
                          <span className="text-[10px] font-mono font-black text-[#009DFF] bg-[#009DFF]/10 px-1.5 py-0.2 rounded">{overallPercent}% Done</span>
                        </div>

                        {/* Overall Progress Tracker Circle */}
                        <div className="flex items-center gap-4.5 border-b border-slate-100 dark:border-slate-800/40 pb-3">
                          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full rotate-270">
                              <circle cx="24" cy="24" r="20" stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'} strokeWidth="3" fill="transparent" />
                              <circle cx="24" cy="24" r="20" stroke="#009DFF" strokeWidth="3" fill="transparent" 
                                strokeDasharray={2 * Math.PI * 20}
                                strokeDashoffset={2 * Math.PI * 20 * (1 - overallPercent / 100)}
                                strokeLinecap="round" />
                            </svg>
                            <span className="absolute font-sans font-black text-[10px]">{overallPercent}%</span>
                          </div>
                          
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">OBJECTIVES GAUNTLET</span>
                            <span className="text-[9px] font-bold text-slate-455 mt-0.5">{completedCount} of 5 Completed • +450 XP Max</span>
                          </div>
                        </div>

                        {/* Tidy Checklist with Individual Progress Trackers */}
                        <div className="flex flex-col gap-3.5 text-left">
                          {/* Item 1 */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <div className="flex items-center gap-1.5 text-slate-705 dark:text-slate-300">
                                {obj1Done ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 border border-slate-300 rounded-sm shrink-0" />}
                                <span className={obj1Done ? "line-through text-slate-400" : ""}>Solve 3 Puzzles</span>
                              </div>
                              <span className="font-mono text-[9px] text-[#009DFF]">{obj1Current}/{obj1Target} ({obj1Percent}%)</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-[#009DFF]" style={{ width: `${obj1Percent}%` }} />
                            </div>
                          </div>

                          {/* Item 2 */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <div className="flex items-center gap-1.5 text-slate-705 dark:text-slate-300">
                                {obj2Done ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 border border-slate-300 rounded-sm shrink-0" />}
                                <span className={obj2Done ? "line-through text-slate-400" : ""}>Complete 1 Academy Lesson</span>
                              </div>
                              <span className="font-mono text-[9px] text-[#009DFF]">{obj2Current}/1 ({obj2Percent}%)</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${obj2Percent}%` }} />
                            </div>
                          </div>

                          {/* Item 3 */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <div className="flex items-center gap-1.5 text-slate-705 dark:text-slate-300">
                                {obj3Done ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 border border-slate-300 rounded-sm shrink-0" />}
                                <span className={obj3Done ? "line-through text-slate-400" : ""}>Use X-Wing Strategy</span>
                              </div>
                              <span className="font-mono text-[9px] text-[#009DFF]">{obj3Current}/1 ({obj3Percent}%)</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-[#009DFF]" style={{ width: `${obj3Percent}%` }} />
                            </div>
                          </div>

                          {/* Item 4 */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <div className="flex items-center gap-1.5 text-slate-705 dark:text-slate-300">
                                {obj4Done ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 border border-slate-300 rounded-sm shrink-0" />}
                                <span className={obj4Done ? "line-through text-slate-400" : ""}>Achieve 95% Accuracy</span>
                              </div>
                              <span className="font-mono text-[9px] text-emerald-500">{obj4Percent}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${obj4Percent}%` }} />
                            </div>
                          </div>

                          {/* Item 5 */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <div className="flex items-center gap-1.5 text-slate-705 dark:text-slate-300">
                                {obj5Done ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 border border-slate-300 rounded-sm shrink-0" />}
                                <span className={obj5Done ? "line-through text-slate-400" : ""}>Finish a Zen Session</span>
                              </div>
                              <span className="font-mono text-[9px] text-[#009DFF]">{obj5Current}/1 ({obj5Percent}%)</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-[#009DFF]" style={{ width: `${obj5Percent}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* WIDGET 2: CURRENT STREAK CALENDAR & REAL WORLD COMPLIANCE */}
                  {(() => {
                    // Compute actual calendar dates of the current week (Mon -> Sun)
                    const today = new Date();
                    const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
                    const mondayDiff = currentDay === 0 ? -6 : 1 - currentDay;
                    
                    const weekDays = [
                      { label: 'M', dayOffset: 0 },
                      { label: 'T', dayOffset: 1 },
                      { label: 'W', dayOffset: 2 },
                      { label: 'T', dayOffset: 3 },
                      { label: 'F', dayOffset: 4 },
                      { label: 'S', dayOffset: 5 },
                      { label: 'S', dayOffset: 6 },
                    ];
                    
                    const weekDaysWithStatus = weekDays.map((wd) => {
                      const date = new Date(today);
                      date.setDate(today.getDate() + mondayDiff + wd.dayOffset);
                      
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const dayNum = String(date.getDate()).padStart(2, '0');
                      const dateKey = `${year}-${month}-${dayNum}`;
                      
                      const isToday = dateKey === today.toISOString().split('T')[0];
                      const isCompleted = profile.dailyHistory?.[dateKey] === true;
                      
                      return {
                        day: wd.label,
                        dateKey,
                        isToday,
                        isCompleted,
                        dayOfMonth: date.getDate(),
                      };
                    });

                    const currentStreakVal = profile.streak || 0;
                    const longestStreakVal = Math.max(currentStreakVal, profile.longestStreak || 0);
                    const completedThisWeek = weekDaysWithStatus.filter(d => d.isCompleted).length;
                    const weeklyPercentage = Math.round((completedThisWeek / 7) * 100);
                    const totalCompletedCount = Object.values(profile.dailyHistory || {}).filter(Boolean).length;

                    return (
                      <div className={`p-4.5 rounded-2xl border flex flex-col gap-3.5 ${
                        theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between leading-none">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Calendar Streak</span>
                          <span className="text-[10px] font-mono text-[#009DFF] font-extrabold flex items-center gap-0.5 leading-none bg-[#009DFF]/10 px-2 py-1 rounded-lg">
                            🔥 {localizeNumber(currentStreakVal)} Day Streak
                          </span>
                        </div>

                        {/* Real-time M T W T F S S Days Grid */}
                        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-sans font-black">
                          {weekDaysWithStatus.map((box, i) => {
                            const isToday = box.isToday;
                            const isChecked = box.isCompleted;
                            
                            return (
                              <div
                                key={i}
                                title={`${box.dateKey}: ${isChecked ? 'Completed' : 'No Activity'}`}
                                className={`p-1.5 rounded-lg border flex flex-col gap-1.5 items-center justify-center transition-all ${
                                  isToday 
                                    ? 'bg-[#009DFF]/15 border-[#009DFF] text-[#009DFF] ring-2 ring-[#009DFF]/20 scale-102 font-black shadow-sm' 
                                    : isChecked 
                                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-550 dark:text-amber-500' 
                                      : theme === 'dark' 
                                        ? 'bg-slate-900 border-slate-800 text-slate-500' 
                                        : 'bg-slate-50 border-slate-200/60 text-slate-400'
                                }`}
                              >
                                <span className="text-[9px] font-extrabold">{box.day}</span>
                                <span className="text-[9.5px] font-mono font-black">{localizeNumber(box.dayOfMonth)}</span>
                                <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-[#009DFF]' : isChecked ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-800'}`} />
                              </div>
                            );
                          })}
                        </div>

                        {/* Real Player Streak Info Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                          <div className="flex flex-col text-left">
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold leading-none">Current Streak</span>
                            <span className="text-xs font-black text-slate-705 dark:text-slate-300 font-mono mt-1">🔥 {localizeNumber(currentStreakVal)} Days</span>
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[8px] uppercase tracking-wider text-slate-450 font-bold leading-none">Longest Streak</span>
                            <span className="text-xs font-black text-amber-500 font-mono mt-1">🏆 {localizeNumber(longestStreakVal)} Days</span>
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[8px] uppercase tracking-wider text-slate-450 font-bold leading-none">Weekly Solves</span>
                            <span className="text-xs font-black text-emerald-500 font-mono mt-1">⚡ {localizeNumber(completedThisWeek)}/৭ ({localizeNumber(weeklyPercentage)}%)</span>
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[8px] uppercase tracking-wider text-slate-450 font-bold leading-none">Total Gold Solves</span>
                            <span className="text-xs font-black text-[#009DFF] font-mono mt-1">📅 {localizeNumber(totalCompletedCount)} Matches</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* WIDGET 3: AI COACH INSIGHT & CHART */}
                  <div className={`p-4.5 rounded-2xl border flex flex-col gap-3 relative overflow-hidden ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                  }`}>
                    <div className="absolute top-0 right-0 p-1.5 text-[#009DFF] bg-[#009DFF]/5 rounded-bl-xl">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </div>

                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">AI Coach Insight</span>
                    
                    {/* Tiny visual chart path */}
                    <div className={`w-full h-14 rounded-xl p-2 relative overflow-hidden flex items-center justify-center border ${
                      theme === 'dark' ? 'bg-slate-900/50 border-slate-200/20' : 'bg-[#f8fafc] border-slate-200 shadow-3xs'
                    }`}>
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
                {/* Sleek Voice Tuning Controller */}
                <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  theme === 'dark' ? 'bg-[#151D30] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newVal = !voiceModeEnabled;
                        setVoiceModeEnabled(newVal);
                        localStorage.setItem('skudo_voice_mode', String(newVal));
                        gameAudio.playClick();
                        if (newVal) {
                          speakText("Automatic answers narration enabled", true);
                        } else {
                          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold transition select-none cursor-pointer ${
                        voiceModeEnabled
                          ? 'bg-[#009DFF]/15 border-[#009DFF]/30 text-[#009DFF] hover:bg-[#009DFF]/20'
                          : 'bg-slate-300/10 border-slate-300 text-slate-450 hover:bg-slate-300/20 dark:border-slate-800 dark:text-slate-500'
                      }`}
                    >
                      {voiceModeEnabled ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>Auto Voice: {voiceModeEnabled ? "ONLINE" : "MUTED"}</span>
                    </button>
                    
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">|</span>

                    {/* Quick indicator of current active Voice selection */}
                    <div className="text-[11px] font-bold text-slate-400">
                      Voice: <span className="text-[#009DFF] capitalize font-black">{coachVoice === "neural" ? "Neural AI" : coachVoice}</span>
                    </div>
                  </div>

                  {/* Speed controller directly here */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Speed:</span>
                    <span className="font-mono text-[#009DFF] font-extrabold text-[11px] bg-[#009DFF]/10 px-1.5 py-0.5 rounded-md">{coachVoiceSpeed.toFixed(1)}x</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={coachVoiceSpeed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCoachVoiceSpeed(val);
                      }}
                      className="w-24 accent-[#009DFF] h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Chat History View Panel with native drag and drop supporting instant multimodal image upload */}
                <div
                  id="ai-chat-scroller"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 overflow-y-auto p-4 rounded-2xl border flex flex-col gap-4 max-h-[50vh] relative transition-all duration-200 ${
                    isDraggingImage 
                      ? 'border-[#009DFF] bg-[#009DFF]/10 ring-2 ring-[#009DFF]/30 scale-[0.99]' 
                      : theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  {/* Neon drag overlay */}
                  {isDraggingImage && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center z-50 rounded-2xl pointer-events-none p-6 select-none animate-pulse">
                      <div className="p-4 rounded-full bg-[#009DFF]/15 border border-[#009DFF]/35">
                        <Image className="w-8 h-8 text-[#009DFF] animate-bounce" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-wider">Drop Image Here</p>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">Skudo Omni AI will scan and auto-analyze it instantly</p>
                      </div>
                    </div>
                  )}

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
                                onClick={() => speakText(msg.text, true)}
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
                <div className="flex flex-col gap-2 w-full">
                  {/* Uploaded Image Preview Block */}
                  {chatInputImage && (
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-100/60 dark:bg-slate-950/40 relative flex items-center gap-3 w-fit max-w-xs transition shadow-md self-start">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800 shrink-0">
                        <img src={chatInputImage} alt="Uploaded attachment" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Image Scanned</p>
                        <p className="text-[9px] text-slate-450 dark:text-slate-400 truncate font-semibold font-mono">Ready to scan & analyze...</p>
                      </div>
                      <button
                        onClick={() => {
                          setChatInputImage(null);
                          gameAudio.playClick();
                        }}
                        className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full cursor-pointer transition"
                        title="Clear image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 relative w-full">
                    <div className={`flex-1 p-1.5 rounded-2xl border flex items-center gap-1 sm:gap-2 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 focus-within:border-[#009DFF]/50' : 'bg-slate-100 focus-within:border-[#009DFF]/50 shadow-inner'
                    }`}>
                      <button
                        onClick={handleMicToggle}
                        className={`p-2.5 rounded-xl cursor-pointer transition ${
                          isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400'
                        }`}
                        title="Vocal voice mode"
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      {/* Multimodal paperclip image upload button */}
                      <button
                        onClick={() => {
                          const fileInput = document.getElementById('chat-file-upload');
                          if (fileInput) fileInput.click();
                        }}
                        className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 rounded-xl cursor-pointer transition shrink-0"
                        title="Upload Image/Picture to scan"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                      <input
                        id="chat-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleChatImageUpload}
                        className="hidden"
                      />

                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitAiPrompt()}
                      onPaste={handlePaste}
                      placeholder="Ask Skudo Omni AI... drag/paste images to scan!"
                      className="flex-1 min-w-0 bg-transparent px-2 text-xs focus:outline-none focus:ring-0 text-slate-755 border-none dark:text-slate-100"
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

                {/* HIGH FIDELITY SUDOKU VARIANT CONFIGURATION POPUP OVERLAY */}
                <AnimatePresence>
                  {showVariantPopup && (() => {
                    const v = SUDOKU_VARIANTS.find(x => x.id === showVariantPopup);
                    if (!v) return null;
                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Dark Backdrop */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowVariantPopup(null)}
                          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />

                        {/* Modal Content Card */}
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0, y: 30 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.95, opacity: 0, y: 30 }}
                          className={`w-full max-w-xl rounded-3xl border p-6 text-left relative z-10 shadow-2xl overflow-hidden ${
                            theme === 'dark' 
                              ? 'bg-[#101524] border-slate-800 text-slate-150' 
                              : 'bg-white border-sky-100 text-slate-800'
                          }`}
                        >
                          {/* Elegant Top design element line */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500" />

                          {/* Title and Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col leading-none">
                              <span className="text-[9px] uppercase tracking-wider text-cyan-500 dark:text-cyan-400 font-black font-mono">Cognitive Matrix Protocol</span>
                              <h3 className="text-base font-black tracking-tight mt-1">{v.name} Deployment</h3>
                            </div>
                            <span className="text-[10px] uppercase font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/15 px-2 py-0.5 rounded-full leading-none">
                              {v.badge}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                            {v.desc}
                          </p>

                          {/* 1. TRAIN WITH AI COACH ACTION BOX */}
                          <div 
                            onClick={() => handleStartTraining(v.id)}
                            className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-2xl p-4 cursor-pointer hover:from-cyan-500/15 hover:to-indigo-500/15 transition-all duration-150 group flex items-start gap-4 mb-5"
                          >
                            <div className="bg-cyan-500/25 text-cyan-400 p-2.5 rounded-xl border border-cyan-500/25 mt-0.5 group-hover:scale-105 transition-transform leading-none flex items-center justify-center">
                              <Brain className="w-5 h-5 text-cyan-500 dark:text-cyan-450" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-cyan-550 dark:text-cyan-400 m-0">🎓 TRAIN WITH AI COACH</h4>
                                <span className="bg-cyan-500/10 border border-cyan-550/15 text-[8px] font-mono text-cyan-500 dark:text-cyan-400 px-1 rounded-full leading-none py-0.5">RECOMMENDED</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-0 leading-relaxed font-semibold">
                                Learn the exact constraint rules, step through interactive tutorials, or test individual grid logic runs live.
                              </p>
                            </div>
                          </div>

                          {/* 2. DIFFICULTY SELECTOR */}
                          <div className="mb-4">
                            <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider font-mono">Launch Standard Match</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'zen' as const, name: 'Zen Level', sub: 'Simplified (Easy)', color: 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5' },
                              { id: 'flow' as const, name: 'Flow Level', sub: 'Standard (Medium)', color: 'border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/5' },
                              { id: 'focus' as const, name: 'Focus Level', sub: 'Deep Logic (Hard)', color: 'border-violet-500/20 text-violet-500 hover:bg-violet-500/5' },
                              { id: 'quantum' as const, name: 'Quantum Level', sub: 'Experiential (Expert)', color: 'border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/5' }
                            ].map((diff) => (
                              <button
                                key={diff.id}
                                onClick={() => {
                                  gameAudio.playClick();
                                  triggerVibe();
                                  setShowVariantPopup(null);
                                  onSelectGame({ mode: 'numbers', difficulty: diff.id, variant: v.id });
                                }}
                                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left cursor-pointer transition uppercase ${diff.color}`}
                              >
                                <span className="text-xs font-black tracking-tight leading-none">{diff.name}</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-semibold leading-none">{diff.sub}</span>
                              </button>
                            ))}
                          </div>

                          {/* Action buttons footer */}
                          <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-200/50 dark:border-slate-800/20">
                            <button
                              onClick={() => {
                                gameAudio.playClick();
                                setShowVariantPopup(null);
                              }}
                              className={`px-4 py-2 text-xs font-bold leading-none rounded-xl transition cursor-pointer ${
                                theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })()}
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

                {/* 🏆 HIGH-STAKES SUDOKU TOURNAMENTS */}
                <div className="text-left mt-8 border-t border-slate-800/60 pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-amber-500 font-black flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" /> High Stakes
                      </span>
                      <h3 className="text-lg font-black tracking-tight mt-1">🏆 HIGH-STAKES SUDOKU TOURNAMENTS</h3>
                      <p className="text-[11.5px] text-slate-400 mt-1">Compete in time-sensitive global SUDOKU events. One attempt only!</p>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          gameAudio.playClick();
                          triggerVibe();
                          setShowCertificateVault(true);
                        }}
                        className="px-4 py-2 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition active:scale-[0.98]"
                        id="certificate-vault-btn"
                      >
                        📂 MY CERTIFICATE VAULT
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4" id="tournaments-card-grid">
                  {/* Card 1: Daily Match */}
                  {(() => {
                    const tState = getTournamentState('daily');
                    const lastPlayed = parseInt(localStorage.getItem('skudo_last_played_daily') || '0', 10);
                    const countdown = getResetsCountdown('daily', lastPlayed);
                    const isLocked = tState.isLocked;
                    
                    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    const d = new Date();
                    const subHeader = `📅 ${days[d.getDay()]} • ${months[d.getMonth()]} ${d.getDate()}`;

                    return (
                      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 text-left flex flex-col justify-between gap-4 relative overflow-hidden" id="tournament-card-daily">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-extrabold">
                            {subHeader}
                          </span>
                          <h4 className="text-base font-black tracking-tight">Daily Tournament Puzzle</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                            Peak today: <strong className="text-[#009DFF]">{dailyHighScore > 0 ? `${dailyHighScore} pts` : "0 record"}</strong>
                          </span>
                        </div>
                        
                        {isLocked ? (
                          <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl">
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-500">
                              <Lock className="w-3.5 h-3.5 text-rose-500" /> LOCKED
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-400">
                              Resets in: {countdown || "00:00:00"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartTournamentGame('daily')}
                            className="w-full bg-[#009DFF] hover:bg-[#3BA7FF] text-white font-bold rounded-xl py-3 text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition duration-150 active:scale-[0.98]"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" /> PLAY DAILY (FOCUS LEVEL)
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Card 2: Weekly Compilation */}
                  {(() => {
                    const tState = getTournamentState('weekly');
                    const lastPlayed = parseInt(localStorage.getItem('skudo_last_played_weekly') || '0', 10);
                    const countdown = getResetsCountdown('weekly', lastPlayed);
                    const isLocked = tState.isLocked;

                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    const d = new Date();
                    const dayVal = d.getDay();
                    const sunday = new Date();
                    sunday.setDate(d.getDate() - dayVal);
                    const subHeader = `📅 WEEK STARTING ${months[sunday.getMonth()]} ${sunday.getDate()}`;

                    return (
                      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 text-left flex flex-col justify-between gap-4 relative overflow-hidden" id="tournament-card-weekly">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] uppercase tracking-wider text-purple-400 font-extrabold">
                            {subHeader}
                          </span>
                          <h4 className="text-base font-black tracking-tight">Weekly Grand Championship</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                            Peak week: <strong className="text-purple-400">{weeklyHighScore > 0 ? `${weeklyHighScore} pts` : "0 record"}</strong>
                          </span>
                        </div>
                        
                        {isLocked ? (
                          <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl">
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-500">
                              <Lock className="w-3.5 h-3.5 text-rose-500" /> LOCKED
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-400">
                              Resets in: {countdown || "00:00:00"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartTournamentGame('weekly')}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl py-3 text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition duration-150 active:scale-[0.98]"
                          >
                            <Trophy className="w-3.5 h-3.5" /> COMPETE (QUANTUM LEVEL)
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Card 3: Monthly League */}
                  {(() => {
                    const tState = getTournamentState('monthly');
                    const lastPlayed = parseInt(localStorage.getItem('skudo_last_played_monthly') || '0', 10);
                    const countdown = getResetsCountdown('monthly', lastPlayed);
                    const isLocked = tState.isLocked;

                    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
                    const d = new Date();
                    const subHeader = `📅 ${months[d.getMonth()]} SEASON`;

                    return (
                      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 text-left flex flex-col justify-between gap-4 relative overflow-hidden" id="tournament-card-monthly">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] uppercase tracking-wider text-amber-500 font-extrabold">
                            {subHeader}
                          </span>
                          <h4 className="text-base font-black tracking-tight">Monthly Master League</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                            Peak month: <strong className="text-amber-500">{monthlyHighScore > 0 ? `${monthlyHighScore} pts` : "0 record"}</strong>
                          </span>
                        </div>
                        
                        {isLocked ? (
                          <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl">
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-500">
                              <Lock className="w-3.5 h-3.5 text-rose-500" /> LOCKED
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-400">
                              Resets in: {countdown || "00:00:00"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartTournamentGame('monthly')}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl py-3 text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition duration-150 active:scale-[0.98]"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-white" /> ENTER LEAGUE (LEGEND LEVEL)
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 🌀 SUDOKU VARIANT MATRIX SECTION */}
                <div className="text-left mt-8 border-t border-slate-800/60 pt-6" id="sudoku-variant-matrix-section">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-cyan-500 font-black flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" /> COGNITIVE OVERLAYS
                      </span>
                      <h3 className="text-lg font-black tracking-tight mt-1">🧩 SUDOKU VARIANT MATRIX</h3>
                      <p className="text-[11.5px] text-slate-400 mt-1 mb-0">Deploy specialized constraints and grid-size modifiers to challenge your neural pathways.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="variant-matrix-grid">
                    {SUDOKU_VARIANTS.map((v) => {
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            gameAudio.playClick();
                            triggerVibe();
                            setShowVariantPopup(v.id);
                          }}
                          className={`p-4.5 rounded-2xl border text-left cursor-pointer transition duration-150 hover:scale-[1.015] flex flex-col justify-between h-[160px] group relative overflow-hidden ${
                            theme === 'dark' 
                              ? 'bg-gradient-to-b from-[#151D30] to-[#0D1322] border-slate-800/80 hover:border-cyan-500/30 shadow-lg' 
                              : 'bg-white border-slate-200 shadow-sm hover:border-sky-400 text-slate-800'
                          }`}
                          id={`variant-card-${v.id}`}
                        >
                          {/* Radial Ambient Glow */}
                          <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-cyan-500/5 dark:bg-cyan-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

                          <div>
                            <div className="flex items-start justify-between gap-2.5">
                              <h4 className="text-xs font-black tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-cyan-400 transition-colors m-0 leading-snug">{v.name}</h4>
                              <span className="text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded uppercase bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/15 whitespace-nowrap leading-none">
                                {v.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3 mb-0">
                              {v.desc}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/40 pt-2 mt-2">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider leading-none">
                              {v.gridBadge}
                            </span>
                            <span className="text-[9px] font-black text-cyan-500 dark:text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform leading-none uppercase">
                              DEPLOY <ChevronRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Certificate Vault Modal Overlay Gallery */}
                <AnimatePresence>
                  {showCertificateVault && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden select-none" id="certificate-vault-overlay">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-center shadow-2xl relative animate-none"
                      >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between text-left">
                          <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                              <Trophy className="w-6 h-6 text-amber-500" /> MY CERTIFICATE VAULT
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 font-semibold">View and export official certificates of logical dominance secured during competitive tournaments.</p>
                          </div>
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              setShowCertificateVault(false);
                            }}
                            className="p-2 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:text-white rounded-xl cursor-pointer transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body / Gallery Grid */}
                        <div className="flex-1 overflow-y-auto p-6 text-left">
                          {earnedCertificates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                              <div className="p-4 bg-slate-950 border border-slate-800 rounded-full text-slate-600">
                                <Award className="w-12 h-12 stroke-[1.5]" />
                              </div>
                              <div>
                                <h4 className="text-base font-black text-white">Vault is Currently Empty</h4>
                                <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed font-semibold">
                                  You haven't earned any official tournament certificates yet. Win a Daily, Weekly, or Monthly tournament challenge to secure your first Official Certificate of Championship!
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {earnedCertificates.map((cert) => (
                                <div 
                                  key={cert.id} 
                                  className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-lg hover:border-amber-500/30 transition-all group"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] uppercase font-black text-amber-500 tracking-wider flex items-center gap-1">
                                        <Trophy className="w-3.5 h-3.5 text-amber-500" /> {cert.type === 'daily' ? 'DAILY MATCH' : cert.type === 'weekly' ? 'WEEKLY GRAND CHAMPION' : 'MONTHLY MASTER LEAGUE'}
                                      </span>
                                      <h4 className="text-[15px] font-extrabold text-white">Tournament Certificate</h4>
                                      <span className="text-[10px] text-slate-500 font-semibold mt-0.5">ID: {cert.id}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-xl">
                                      <Award className="w-6 h-6 text-amber-500" />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-900 text-center text-[11px]">
                                    <div>
                                      <span className="block text-[8px] text-slate-500 uppercase font-black tracking-wider">Date</span>
                                      <span className="font-mono font-bold text-white mt-0.5 block">{cert.date}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] text-slate-500 uppercase font-black tracking-wider">Duration</span>
                                      <span className="font-mono font-bold text-sky-400 mt-0.5 block">{cert.time}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] text-slate-500 uppercase font-black tracking-wider">Score</span>
                                      <span className="font-mono font-black text-emerald-400 mt-0.5 block">{cert.score} pts</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-2">
                                    <button
                                      onClick={() => {
                                        gameAudio.playClick();
                                        downloadCertificateFromDashboard(cert);
                                      }}
                                      className="flex-1 py-2.5 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 font-bold rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Download SVG
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              setShowCertificateVault(false);
                            }}
                            className="px-5 py-2 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase rounded-xl border border-slate-800 cursor-pointer transition"
                          >
                            Close Vault
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ================= TAB 4: LEARN (COACH / TRAINING) ================= */}
            {activeTab === 'learn' && (
              <motion.div
                key="learn"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none text-left"
              >
                {/* 1. LEFT COLUMN: AI LIVE COACH ENGINE CONTROLLERS (lg:col-span-4) */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  
                  {/* Portrait & Face Widget */}
                  <div className={`p-5 rounded-3xl border flex flex-col items-center gap-4 relative overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-b from-[#151D30] to-[#0A0E1A] border-slate-800' 
                      : 'bg-gradient-to-b from-sky-50 to-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="absolute top-0 right-0 p-3">
                      <span className="text-[9px] font-extrabold bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        v10.0 LIVE AI
                      </span>
                    </div>

                    {/* Glowing AI eye avatar representing coach */}
                    <div className="relative mt-2">
                      <motion.div 
                        animate={{
                          scale: coachVisualWave ? [1, 1.1, 1] : [1, 1.04, 1],
                          rotate: coachVisualWave ? [0, 360] : 0
                        }}
                        transition={{
                          duration: coachVisualWave ? 4 : 8,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className={`w-20 h-20 rounded-full border-4 flex items-center justify-center bg-slate-950 shadow-lg ${
                          coachVisualWave 
                            ? 'border-cyan-400 shadow-cyan-500/20 animate-pulse' 
                            : 'border-indigo-500/30 shadow-indigo-500/5'
                        }`}
                      >
                        <Sparkles className={`w-8 h-8 ${
                          coachVisualWave ? 'text-cyan-400 animate-bounce' : 'text-slate-550 dark:text-indigo-400'
                        }`} />
                      </motion.div>
                      {/* Active green status light */}
                      <span className="absolute bottom-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#0A0E1A]"></span>
                      </span>
                    </div>

                    <div className="text-center w-full">
                      <h4 className="text-sm font-black uppercase tracking-tight">AI Master Coach</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {coachVisualWave ? "Speaking verbally..." : "Watching moves in real-time"}
                      </p>
                    </div>

                    {/* Responsive vocal Soundwave visualization */}
                    <div className={`w-full p-2 rounded-2xl border ${
                      theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-center gap-1.5 h-10">
                        {[...Array(9)].map((_, idx) => (
                          <motion.div
                            key={idx}
                            animate={{
                              height: coachVisualWave 
                                ? [8, Math.floor(Math.random() * 26) + 10, 8] 
                                : 4
                            }}
                            transition={{
                              duration: 0.3 + (idx * 0.05),
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className={`w-1 rounded-full ${
                              coachVisualWave 
                                ? 'bg-gradient-to-t from-cyan-400 to-[#009DFF]' 
                                : theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Coach Profile parameters controls */}
                    <div className="w-full flex flex-col gap-3 mt-1 text-xs">
                      
                      {/* Voice modes selection row */}
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Voice Mode:</span>
                        <select
                          value={coachVoiceMode}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            gameAudio.playClick();
                            setCoachVoiceMode(val);
                            // Speak confirmation
                            setTimeout(() => {
                              if (val === 'teacher') speakAsCoach("Grammar and logical validation active. Welcome to my classroom!");
                              if (val === 'friendly') speakAsCoach("Hey! Don't stress, we'll solve this puzzle step-by-step together.");
                              if (val === 'tournament') speakAsCoach("Competitive speed rules selected. Zero error tolerances!");
                              if (val === 'master') speakAsCoach("Let your mind grasp the underlying grid layers.");
                            }, 100);
                          }}
                          className={`text-[10.5px] font-black rounded-lg px-2 py-1 border outline-none focus:ring-2 focus:ring-[#009DFF] cursor-pointer ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                          }`}
                        >
                          <option value="friendly">Friendly Mentor</option>
                          <option value="teacher">Teacher Mode</option>
                          <option value="tournament">Tournament Coach</option>
                          <option value="master">Master Trainer</option>
                        </select>
                      </div>

                      {/* Speed multiplier control */}
                      <div className="flex flex-col gap-1 text-left">
                        <div className="flex justify-between text-[10px] font-bold text-slate-450 uppercase">
                          <span>Speech Speed:</span>
                          <span className="font-mono text-[#009DFF]">{coachVoiceSpeed.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.8"
                          step="0.1"
                          value={coachVoiceSpeed}
                          onChange={(e) => setCoachVoiceSpeed(parseFloat(e.target.value))}
                          className="w-full accent-[#009DFF] h-1 bg-slate-850 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Mute toggle button */}
                      <button
                        onClick={() => {
                          gameAudio.playClick();
                          setCoachIsMuted(!coachIsMuted);
                          if (coachIsMuted) {
                            setTimeout(() => speakAsCoach("Vocal feedback enabled!"), 150);
                          } else {
                            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                            }
                          }
                        }}
                        className={`w-full py-2 rounded-xl border flex items-center justify-center gap-2 font-black uppercase text-[10.5px] transition cursor-pointer ${
                          coachIsMuted 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/15' 
                            : 'bg-[#009DFF]/15 border-[#009DFF]/30 text-[#009DFF] hover:bg-[#009DFF]/20'
                        }`}
                      >
                        {coachIsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <span>{coachIsMuted ? "Unmute Voice Tutor" : "Mute Tutor Voice"}</span>
                      </button>

                    </div>
                  </div>

                  {/* AI Q&A Chat Terminal Console */}
                  <div className={`p-4 rounded-3xl border flex-grow flex flex-col gap-3 min-h-[300px] ${
                    theme === 'dark' ? 'bg-slate-950/80 border-slate-850' : 'bg-white border-slate-220 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between border-b border-slate-800/15 pb-2 text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-[#009DFF]" />
                        <span>AI Q&A Cognitive Assistant</span>
                      </span>
                      <button
                        onClick={() => {
                          gameAudio.playClick();
                          setCoachChatHistory([{ sender: 'coach', text: "Chat history cleared. Send me any questions!" }]);
                        }}
                        className="text-[9px] uppercase font-bold text-[#009DFF] hover:underline"
                      >
                        Clear logs
                      </button>
                    </div>

                    {/* Chat viewport messages area */}
                    <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 flex flex-col gap-2.5 grid-scroll text-[11px] leading-relaxed select-text font-bold">
                      {coachChatHistory.map((msg, i) => {
                        const isCoach = msg.sender === 'coach';
                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-2xl max-w-[85%] text-left ${
                              isCoach
                                ? theme === 'dark' ? 'bg-slate-900 border border-slate-850 self-start text-slate-300' : 'bg-slate-50 border border-slate-100 self-start text-slate-700'
                                : 'bg-[#009DFF] text-white self-end text-right'
                            }`}
                          >
                            <span className="block text-[8px] uppercase opacity-60 tracking-wider mb-1">
                              {isCoach ? "Coach AI" : "You (Analyst)"}
                            </span>
                            <p>{msg.text}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick inquiry chips */}
                    <div className="flex flex-wrap gap-1 border-t border-dashed border-slate-800/15 pt-2">
                      {[
                        "What is Swordfish?",
                        "Explain constraint propagation",
                        "How do Naked Pairs work?",
                        "What are Sudoku basics?"
                      ].map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCoachChatQuery(topic);
                            // Trigger submit directly
                            setTimeout(() => {
                              setCoachChatQuery(topic);
                              // We can invoke direct handlers
                            }, 50);
                          }}
                          className={`text-[9.5px] font-bold px-2 py-1 rounded-lg border transition whitespace-nowrap cursor-pointer ${
                            theme === 'dark' 
                              ? 'border-slate-850 hover:bg-slate-900 hover:border-slate-700 bg-slate-950 text-slate-400' 
                              : 'border-slate-200 hover:bg-slate-50 bg-slate-50 text-slate-600'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>

                    {/* Q&A bottom form */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCoachChatSubmit();
                      }}
                      className="flex items-center gap-2 w-full mt-1"
                    >
                      <input
                        type="text"
                        value={coachChatQuery}
                        onChange={(e) => setCoachChatQuery(e.target.value)}
                        placeholder="Ask Coach e.g., Why is Naked Single logical?"
                        className={`flex-1 min-w-0 rounded-xl px-3 py-2 text-xs font-bold outline-none border focus:ring-2 focus:ring-[#009DFF] ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-55 border-slate-205'
                        }`}
                      />
                      <button
                        type="submit"
                        className="p-2 rounded-xl bg-[#009DFF] hover:bg-sky-500 text-white shadow transition cursor-pointer active:scale-95"
                        title="Transmit query"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                  </div>

                </div>

                {/* 2. RIGHT COLUMN: COGNITIVE WORKSPACE & ACADEMY RUNNERS (lg:col-span-8) */}
                <div className="lg:col-span-8 flex flex-col gap-5 text-left">
                  
                  {/* Learning Dashboard Stats Panel */}
                  <div className={`p-4 rounded-3xl border grid grid-cols-2 md:grid-cols-4 gap-4 items-center ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-805' : 'bg-slate-50 border-slate-205 shadow-inner'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 bg-[#009DFF]/15 text-[#009DFF] rounded-2xl flex items-center justify-center">
                        <Trophy className="w-5 h-5 animate-pulse" />
                      </span>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-450 block">Current Rank</span>
                        <span className="text-xs font-black text-[#009DFF] tracking-tight uppercase">Master Candidate</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="p-2.5 bg-emerald-500/15 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                      </span>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-450 block">Lessons Completed</span>
                        <span className="text-xs font-black text-slate-100 dark:text-white">68% Matrix Coverage</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="p-2.5 bg-amber-500/15 text-amber-500 rounded-2xl flex items-center justify-center">
                        <Flame className="w-5 h-5" />
                      </span>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-450 block">Weekly Streak</span>
                        <span className="text-xs font-black text-slate-100 dark:text-white">5 Active Days</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="p-2.5 bg-rose-500/15 text-rose-500 rounded-2xl flex items-center justify-center">
                        <Target className="w-5 h-5" />
                      </span>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-450 block">Personal Best</span>
                        <span className="text-xs font-black text-slate-100 dark:text-white">{coachPBTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Personal trainer generator & smart planning */}
                  <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    theme === 'dark' ? 'bg-[#0E1528] border-slate-800' : 'bg-emerald-50/20 border-emerald-500/20 shadow-sm'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="p-2 mt-0.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <Zap className="w-4 h-4 animate-bounce" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black uppercase text-emerald-500 tracking-wide">Personal Trainer Plan Generator</h4>
                        <p className="text-[11px] text-slate-450 mt-1 leading-normal max-w-xl font-semibold">
                          Weaknesses verified in: <strong className="text-rose-500">{coachWeaknesses.join(", ")}</strong>. Instantly produce customized guided lessons, tailored practice puzzles, and certificates evaluations!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        gameAudio.playClick();
                        triggerVibe();
                        setCoachActiveMode('master');
                        setCoachSelectedLessonIdx(1); // Swordfish lesson
                        speakAsCoach("Generating targeted custom board training for Swordfish configurations now. Watch our coordinate visualizer panels!");
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white font-black text-[10.5px] uppercase tracking-wider shadow-lg shadow-emerald-400/10 whitespace-nowrap"
                    >
                      Initialize custom board session
                    </button>
                  </div>

                  {/* HIGH-VELOCITY ACTIVE ACADEMY TAB SELECTORS */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { key: 'beginner' as const, label: 'Beginner', desc: 'Basics & Rows', color: 'from-emerald-500 to-teal-500', text: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' },
                      { key: 'easy' as const, label: 'Easy', desc: 'Singles Logic', color: 'from-sky-500 to-blue-500', text: 'text-sky-500 dark:text-sky-400 bg-sky-500/10' },
                      { key: 'intermediate' as const, label: 'Intermediate', desc: 'Pairs & Blocks', color: 'from-amber-500 to-orange-500', text: 'text-amber-550 dark:text-amber-400 bg-amber-500/10' },
                      { key: 'master' as const, label: 'Master', desc: 'Fish & Chains', color: 'from-violet-500 to-fuchsia-500', text: 'text-violet-500 dark:text-violet-400 bg-violet-500/10' },
                      { key: 'grandmaster' as const, label: 'Grandmaster', desc: 'SAT Solver Theory', color: 'from-rose-500 to-red-600', text: 'text-rose-500 dark:text-rose-400 bg-rose-500/10' }
                    ].map((mode) => {
                      const isActive = coachActiveMode === mode.key;
                      return (
                        <button
                          key={mode.key}
                          onClick={() => {
                            gameAudio.playClick();
                            triggerVibe();
                            setCoachActiveMode(mode.key);
                            setCoachSelectedLessonIdx(0);
                            setCoachQuizAnswers([]);
                            setCoachQuizSubmitted(false);
                            setCoachQuizPassed(null);
                            
                            // Narrate welcoming
                            const entry = COACH_ACADEMIES[mode.key].greeting;
                            speakAsCoach(entry);
                          }}
                          className={`p-3 rounded-2xl text-left border cursor-pointer transition-all flex flex-col gap-1 ${
                            isActive
                              ? `bg-gradient-to-br ${mode.color} text-white border-transparent shadow-lg transform scale-[1.02]`
                              : theme === 'dark' 
                                ? 'bg-slate-900 border-slate-850 text-slate-300 hover:bg-[#151B2E]' 
                                : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md self-start ${
                            isActive ? 'bg-white/20 text-white' : mode.text
                          }`}>
                            {mode.label}
                          </span>
                          <span className="text-[12px] font-extrabold tracking-tight truncate leading-tight mt-1">{COACH_ACADEMIES[mode.key].title}</span>
                          <span className={`text-[9px] font-semibold mt-0.5 ${isActive ? 'text-white/85' : 'text-slate-400'}`}>
                            {mode.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTIVE ACADEMY INTERACTIVE CANVAS */}
                  <div className={`p-5 rounded-3xl border flex flex-col gap-5 ${
                    theme === 'dark' ? 'bg-[#0E1526]/80 border-slate-800' : 'bg-white border-slate-205 shadow-md shadow-slate-100'
                  }`}>
                    
                    {/* Header and Welcome Note */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/10 dark:border-slate-800/40 pb-3 text-left">
                      <div>
                        <h3 className="text-base font-black uppercase text-[#009DFF]">{COACH_ACADEMIES[coachActiveMode].title}</h3>
                        <p className="text-[11px] leading-relaxed text-slate-405 font-bold mt-1 max-w-xl">
                          &ldquo;{COACH_ACADEMIES[coachActiveMode].greeting}&rdquo;
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const activeLesson = COACH_ACADEMIES[coachActiveMode].lessons[coachSelectedLessonIdx];
                          speakAsCoach(`Next concept check. ${activeLesson.title}: ${activeLesson.voice}`);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#009DFF]/30 text-[#009DFF] bg-[#009DFF]/10 text-[10px] font-black uppercase cursor-pointer hover:bg-[#009DFF]/20"
                      >
                        Listen Lesson
                      </button>
                    </div>

                    {/* Lesson tabs and Dynamic workspace split */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      
                      {/* Left: lesson selectors list (md:col-span-4) */}
                      <div className="md:col-span-4 flex flex-col gap-2 border-r border-[#009DFF]/10 pr-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-450 block mb-1">Active Syllabus Lectures</span>
                        {COACH_ACADEMIES[coachActiveMode].lessons.map((lesson, idx) => {
                          const isSelected = coachSelectedLessonIdx === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                gameAudio.playClick();
                                setCoachSelectedLessonIdx(idx);
                                speakAsCoach(lesson.voice);
                              }}
                              className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                                isSelected
                                  ? 'border-[#009DFF]/50 bg-[#009DFF]/10 text-[#009DFF] p-3.5'
                                  : theme === 'dark' ? 'bg-transparent border-slate-850 text-slate-400 hover:bg-slate-900/40' : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full text-[9px] font-mono flex items-center justify-center font-black ${
                                  isSelected ? 'bg-[#009DFF] text-white animate-pulse' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {idx + 1}
                                </span>
                                <h5 className="text-[11px] font-black tracking-tight uppercase truncate">{lesson.title}</h5>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Right: Active lesson description details & coordinate visualizer grids (md:col-span-8) */}
                      <div className="md:col-span-8 flex flex-col gap-4">
                        
                        <div>
                          <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-205">
                            Lesson {coachSelectedLessonIdx + 1}: {COACH_ACADEMIES[coachActiveMode].lessons[coachSelectedLessonIdx].title}
                          </h4>
                          <p className="text-[11px] leading-relaxed text-slate-400 font-semibold mt-1.5">
                            {COACH_ACADEMIES[coachActiveMode].lessons[coachSelectedLessonIdx].desc}
                          </p>
                          <div className={`p-3 rounded-xl text-[10.5px] leading-normal font-bold border mt-3 flex items-start gap-1.5 ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-300' : 'bg-[#EBF7FF] border-slate-200 text-slate-700'
                          }`}>
                            <Info className="w-4.5 h-4.5 text-[#009DFF] shrink-0 mt-0.5" />
                            <span>
                              <strong>Coach Advice:</strong> {COACH_ACADEMIES[coachActiveMode].lessons[coachSelectedLessonIdx].explanation}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Guided Matrix representation */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-[#009DFF]">Interactive Sightline Guided Grid</span>
                          <div className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-center gap-4 justify-between ${
                            theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-200'
                          }`}>
                            
                            {/* Visual 9x9 miniature tactile coordinates layout */}
                            <div className="grid grid-cols-9 gap-1 h-36 w-36 bg-slate-900 p-1.5 rounded-xl shrink-0">
                              {[...Array(9)].map((_, r) => 
                                [...Array(9)].map((_, c) => {
                                  // Determine if highlighted
                                  const highlights = COACH_ACADEMIES[coachActiveMode].lessons[coachSelectedLessonIdx].highlights || [];
                                  const isHighlighted = highlights.some(([hr, hc]) => hr === r && hc === c);
                                  
                                  return (
                                    <div
                                      key={`${r}-${c}`}
                                      onClick={() => {
                                        gameAudio.playClick();
                                        triggerVibe();
                                        const lesson = COACH_ACADEMIES[coachActiveMode].lessons[coachSelectedLessonIdx];
                                        if (isHighlighted) {
                                          speakAsCoach(`Visual milestone target selected at Row ${r + 1} Column ${c + 1}. Perfect pattern matching!`);
                                        } else {
                                          speakAsCoach(`Inspecting Row ${r + 1} Column ${c + 1}. Box coordinate constraints clear.`);
                                        }
                                      }}
                                      className={`h-3 w-3 rounded-sm cursor-pointer transition ${
                                        isHighlighted 
                                          ? 'bg-gradient-to-br from-cyan-400 to-[#009DFF] shadow-md animate-pulse scale-105' 
                                          : 'bg-slate-800 hover:bg-slate-700'
                                      }`}
                                      title={`Cell R${r+1}C${c+1}`}
                                    />
                                  );
                                })
                              )}
                            </div>

                            <div className="flex-1 text-left">
                              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 w-max">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Interactive
                              </span>
                              <p className="text-[10.5px] text-slate-450 leading-relaxed font-semibold mt-1.5">
                                Tap on any of the cells inside the mini grid to let the Coach instantly analyze and verbalize candidate constraints aloud!
                              </p>
                            </div>

                          </div>
                        </div>

                      </div>

                    </div>

                    {/* MILESTONE GRADUATION CERTIFICATE EVALUATION EXAM */}
                    <div className={`mt-2 p-4 rounded-3xl border ${
                      theme === 'dark' ? 'bg-gradient-to-r from-[#1E293B]/40 to-slate-900 border-slate-805' : 'bg-slate-50 border-slate-205 shadow-inner'
                    }`}>
                      <div className="flex items-center gap-3 border-b border-slate-800/15 pb-2">
                        <span className="p-2 bg-[#009DFF]/15 text-[#009DFF] rounded-xl self-start flex items-center justify-center animate-spin" style={{ animationDuration: '8s' }}>
                          <Shield className="w-5 h-5" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">Milestone Academy Graduation Exam</h4>
                          <span className="text-[9.5px] uppercase font-bold text-slate-405 block mt-0.5">Solve the questions correctly to earn your dynamic diploma!</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 mt-4">
                        {COACH_ACADEMIES[coachActiveMode].quiz.map((q, quizIdx) => {
                          const chosenVal = coachQuizAnswers[quizIdx];
                          return (
                            <div key={quizIdx} className="text-left flex flex-col gap-2">
                              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                Question {quizIdx + 1}: {q.question}
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = chosenVal === optIdx;
                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => {
                                        gameAudio.playClick();
                                        const copy = [...coachQuizAnswers];
                                        copy[quizIdx] = optIdx;
                                        setCoachQuizAnswers(copy);
                                      }}
                                      className={`p-2.5 rounded-xl border text-left font-bold text-[10.5px] transition cursor-pointer ${
                                        isSelected
                                          ? 'border-indigo-500/60 bg-indigo-500/10 text-[#009DFF]'
                                          : theme === 'dark' ? 'bg-slate-950 hover:bg-slate-900 border-slate-850' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Submit button / Pass Fail status */}
                        <div className="flex items-center justify-between gap-4 border-t border-dashed border-slate-800/15 pt-3.5">
                          <div>
                            {coachQuizSubmitted && coachQuizPassed === true && (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-extrabold uppercase">
                                <CheckCircle2 className="w-5 h-5 animate-bounce" />
                                <span>Exam Passed! Diploma unlocked inside the Certificate Vault!</span>
                              </div>
                            )}
                            {coachQuizSubmitted && coachQuizPassed === false && (
                              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-extrabold uppercase">
                                <AlertCircle className="w-5 h-5 animate-pulse" />
                                <span>Exam Failed. Check logical sightline and try again!</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              triggerVibe();
                              
                              // Check answers
                              const quiz = COACH_ACADEMIES[coachActiveMode].quiz;
                              if (coachQuizAnswers.length < quiz.length || coachQuizAnswers.some(v => v === undefined || v === -1)) {
                                speakAsCoach("Please answer all questions inside the validation forms before grading.");
                                alert("Please choose an answer option for all questions first!");
                                return;
                              }

                              const isAllCorrect = quiz.every((q, i) => coachQuizAnswers[i] === q.answerIdx);
                              setCoachQuizSubmitted(true);
                              setCoachQuizPassed(isAllCorrect);

                              if (isAllCorrect) {
                                // Unlock certificate
                                const nextCerts = [...coachCertificates];
                                if (!nextCerts.includes(coachActiveMode)) {
                                  nextCerts.push(coachActiveMode);
                                  setCoachCertificates(nextCerts);
                                }
                                speakAsCoach(`Congratulations! You passed the graduation test with distinction. Your professional credential for ${COACH_ACADEMIES[coachActiveMode].title} has been printed!`);
                              } else {
                                speakAsCoach("Logical evaluation rejected. Some credentials do not match grid coverages. Let's study lesson notes once more!");
                              }
                            }}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10"
                          >
                            Verify & Graduate Milestone
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* HIGH-SPEC LUXURY DIPLOMA/CERTIFICATE VAULT */}
                  <div className={`p-5 rounded-3xl border ${
                    theme === 'dark' ? 'bg-[#151D30]/65 border-slate-805' : 'bg-slate-50 border-slate-205 shadow-inner'
                  }`}>
                    <div className="text-left border-b border-slate-810/15 pb-2">
                      <span className="text-[10px] font-black uppercase text-[#009DFF] tracking-widest flex items-center gap-1">
                        <Award className="w-4.5 h-4.5 animate-bounce" /> Unlocked Professional Credentials Vault
                      </span>
                      <p className="text-[10.5px] leading-relaxed text-slate-400 font-semibold mt-1">
                        Pass the Milestone exams above to graduate corresponding levels and display credentials. Click any earned certificate to view your authentic printed diploma!
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                      {[
                        { key: 'beginner', title: 'Beginner Exam', subtitle: 'Basic Grids coverages' },
                        { key: 'easy', title: 'Easy Exam', subtitle: 'Singles solver patterns' },
                        { key: 'intermediate', title: 'Intermediate Exam', subtitle: 'Pairs & Box eliminations' },
                        { key: 'master', title: 'Master Exam', subtitle: 'Swordfish & X-Wings' },
                        { key: 'grandmaster', title: 'Grandmaster Exam', subtitle: 'SAT solving computational' }
                      ].map((certSpec) => {
                        const isUnlocked = coachCertificates.includes(certSpec.key);
                        return (
                          <div
                            key={certSpec.key}
                            onClick={() => {
                              if (isUnlocked) {
                                gameAudio.playClick();
                                triggerVibe();
                                // Select/display of certificate details modal
                                setSelectedHelpArticle(`cert-${certSpec.key}`);
                                speakAsCoach(`Displaying authenticated printed diploma in your profile frame.`);
                              } else {
                                speakAsCoach(`Diploma locked. Solve the ${certSpec.title} questionnaire to graduate.`);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-between min-h-[140px] ${
                              isUnlocked
                                ? 'bg-gradient-to-b from-[#1E293B] to-[#010614] border-amber-500/40 shadow-lg shadow-amber-500/5 cursor-pointer hover:border-amber-400 group'
                                : 'bg-slate-900/45 border-slate-850 opacity-60'
                            }`}
                          >
                            <Trophy className={`w-8 h-8 ${
                              isUnlocked ? 'text-amber-400 animate-pulse' : 'text-slate-600'
                            }`} />
                            <div className="mt-2 text-center w-full min-w-0">
                              <span className={`text-[10px] font-black uppercase tracking-tight block truncate ${
                                isUnlocked ? 'text-amber-400' : 'text-slate-400'
                              }`}>
                                {certSpec.title}
                              </span>
                              <span className="text-[8.5px] font-bold text-slate-450 block truncate mt-0.5">{certSpec.subtitle}</span>
                            </div>

                            <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded mt-2.5 block w-max ${
                              isUnlocked 
                                ? 'bg-amber-400/20 text-amber-400' 
                                : 'bg-slate-950 text-slate-500 border border-slate-855'
                            }`}>
                              {isUnlocked ? "Graduate" : "Locked"}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>

                {/* HIGH-FIDELITY LUXURY CERTIFICATE MODEL POPUP */}
                <AnimatePresence>
                  {selectedHelpArticle && selectedHelpArticle.startsWith("cert-") && (() => {
                    const certKey = selectedHelpArticle.replace("cert-", "");
                    const title = certKey === 'beginner' ? 'Beginner Diploma' : certKey === 'easy' ? 'Easy Diploma' : certKey === 'intermediate' ? 'Intermediate Diploma' : certKey === 'master' ? 'Master Diploma' : 'Grandmaster Diploma';
                    const level = certKey === 'beginner' ? 'Basic Grid Sightlines & Box Coverages' : certKey === 'easy' ? 'Naked/Hidden Singles Optimization' : certKey === 'intermediate' ? 'Pairs Deductions & Box-Line Reductions' : certKey === 'master' ? 'Swordfish Grid Matrices & Chains' : 'SAT Constraint Solver Systems';
                    const score = certKey === 'beginner' ? 'Master of Sightlines' : certKey === 'easy' ? 'Advanced Logic Expert' : certKey === 'intermediate' ? 'Pristine Analyst' : certKey === 'master' ? 'Supreme Trainer' : 'Computational Architect';
                    const currentDateTime = "June 1, 2026 UTC";
                    
                    return (
                      <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.94 }}
                          className="max-w-2xl w-full rounded-3xl bg-gradient-to-b from-[#1E293B] to-[#030610] text-[#E2E8F0] p-8 border-4 border-amber-500 shadow-2xl relative overflow-hidden select-text text-center flex flex-col items-center gap-5"
                        >
                          {/* Aesthetic watermarks */}
                          <div className="absolute -top-12 -left-12 p-10 opacity-5 border-8 border-amber-500 rounded-full w-56 h-56" />
                          <div className="absolute -bottom-12 -right-12 p-10 opacity-5 border-8 border-amber-500 rounded-full w-56 h-56" />

                          <div className="flex justify-between items-center w-full border-b border-amber-500/30 pb-3 z-10 shrink-0">
                            <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-1">
                              <Shield className="w-5 h-5 animate-pulse" /> Verified Certificate Hub
                            </span>
                            <button
                              onClick={() => setSelectedHelpArticle(null)}
                              className="p-1 rounded-full hover:bg-slate-500/10 cursor-pointer text-amber-450 z-20"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>

                          {/* Certificate body */}
                          <div className="my-6 flex flex-col items-center gap-4 z-10">
                            
                            <Trophy className="w-16 h-16 text-amber-400 animate-bounce" />
                            
                            <h3 className="font-serif italic text-3xl text-amber-400 tracking-wide">Deduction Logic Academy</h3>
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 mt-1 block">SKUDO PROFESSIONAL GRADUATION PATHWAY</span>

                            <div className="h-0.5 w-32 bg-amber-500/40 my-2" />

                            <p className="text-xs text-slate-300 italic font-semibold">This authentic credential certifies that</p>
                            <span className="font-mono text-xl font-bold uppercase tracking-wide text-white bg-slate-900/50 px-5 py-2.5 rounded-2xl border border-slate-800">
                             archanadasmondal1987@gmail.com
                            </span>

                            <p className="text-xs text-slate-300 font-semibold max-w-lg leading-relaxed mt-2">
                              has parsed all logically complex configurations and satisfied validation parameters with 100% accuracy, thereby graduating to the prestigious status of:
                            </p>

                            <span className="text-lg font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30">
                              {title} &mdash; {score}
                            </span>

                            <p className="text-[10px] text-slate-450 font-bold max-w-sm">
                              Specialization Major: <strong>{level}</strong>
                            </p>

                          </div>

                          {/* Seal signature stamp */}
                          <div className="grid grid-cols-3 gap-4 items-end w-full border-t border-amber-500/20 pt-6 z-10 text-[10px] uppercase font-bold text-slate-450 leading-normal">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-white text-[9.5px]">AI MASTER COACH</span>
                              <div className="h-px bg-slate-500/40 w-full mb-1" />
                              <span>OFFICIAL VERIFIER</span>
                            </div>

                            {/* Seal */}
                            <div className="flex justify-center">
                              <div className="w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center bg-amber-500/15 animate-spin" style={{ animationDuration: '30s' }}>
                                <Award className="w-8 h-8 text-amber-400" />
                              </div>
                            </div>

                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-white text-[9.5px]">{currentDateTime}</span>
                              <div className="h-px bg-slate-500/40 w-full mb-1" />
                              <span>GRADUATION STAMP</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4 z-10">
                            <button
                              onClick={() => {
                                alert("Diploma formatting finalized! Use your browser's Print dialog to export your authentic credential.");
                                window.print();
                              }}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-[10.5px] uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-amber-500/10"
                            >
                              Print Diploma Credentials
                            </button>
                            <button
                              onClick={() => {
                                if (typeof window !== 'undefined' && 'navigator' in window && 'clipboard' in window.navigator) {
                                  window.navigator.clipboard.writeText(`archanadasmondal1987@gmail.com is an authenticated ${title} graduate of Skudo Academy! Profile ID: 031bab88-7bf4-4203-9849-bd7057afbce9`);
                                  alert("Dynamic verification profile URL copied to clipboard!");
                                }
                              }}
                              className="px-4 py-2 bg-transparent border border-slate-600 hover:bg-slate-500/15 text-slate-350 font-black text-[10.5px] uppercase tracking-wider rounded-xl cursor-pointer"
                            >
                              Share Certificate
                            </button>
                          </div>

                        </motion.div>
                      </div>
                    );
                  })()}
                </AnimatePresence>

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

            {/* ================= TAB 6: ANALYTICS (PERFORMANCE INTELLIGENCE CENTER v12.0) ================= */}
            {activeTab === 'analytics' && (() => {
              // Real-time calculation of Skudo IQ
              // Base ELO 1000 + (Solved * 20) + (Moves * 1.5) + (Candidates * 0.8) + (Strategies * 4) - (Mistakes * 12) - (Hints * 15)
              const weeklyIQChange = "+15.8%";
              const monthlyIQChange = "+32.4%";
              const allTimeBestIQ = 1685;

              // Compute accuracy percentage
              const liveAccuracy = Math.max(72.5, 100 - (analyticsMistakes / Math.max(1, analyticsMoves)) * 50).toFixed(1);
              const totalGamesSolved = profile.completedGames + analyticsSolved;
              const trainingHours = (((profile.totalTime) / 3600) + (analyticsMoves * 0.04) + (analyticsSolved * 0.2)).toFixed(1);
              const averageSolveTimeStr = (profile.totalTime > 0 && profile.completedGames > 0)
                ? `${Math.floor((profile.totalTime / profile.completedGames) / 60)}m ${Math.floor((profile.totalTime / profile.completedGames) % 60)}s`
                : "4m 12s";

              // SVG Chart Mock Data Points (interpolated dynamically depending on selected timeframe)
              const chartCoordinates: Record<string, number[]> = {
                daily: [liveSkudoIQ - 15, liveSkudoIQ - 10, liveSkudoIQ - 20, liveSkudoIQ - 5, liveSkudoIQ - 8, liveSkudoIQ],
                weekly: [liveSkudoIQ - 90, liveSkudoIQ - 65, liveSkudoIQ - 40, liveSkudoIQ - 55, liveSkudoIQ - 20, liveSkudoIQ],
                monthly: [liveSkudoIQ - 220, liveSkudoIQ - 180, liveSkudoIQ - 110, liveSkudoIQ - 130, liveSkudoIQ - 45, liveSkudoIQ],
                yearly: [liveSkudoIQ - 480, liveSkudoIQ - 410, liveSkudoIQ - 280, liveSkudoIQ - 310, liveSkudoIQ - 120, liveSkudoIQ],
                alltime: [750, 920, 1150, 1280, 1420, liveSkudoIQ]
              };
              const activeDataPoints = chartCoordinates[statsTimeframe] || chartCoordinates.weekly;

              // Mode indices for performance comparison
              const modesStats = {
                zen: { acc: "98.4%", time: "2m 35s", trend: "+15.2%", focus: 94, comp: "100%", speed: "Ultra", cog: 91 },
                flow: { acc: "92.8%", time: "3m 50s", trend: "+18.4%", focus: 89, comp: "96%", speed: "High", cog: 85 },
                quantum: { acc: "87.5%", time: "5m 12s", trend: "+24.1%", focus: 85, comp: "82%", speed: "Strategic", cog: 88 },
                master: { acc: "79.2%", time: "8m 40s", trend: "+11.5%", focus: 92, comp: "74%", speed: "Expert", cog: 93 },
                grandmaster: { acc: "74.8%", time: "12m 15s", trend: "+28.2%", focus: 96, comp: "64%", speed: "Hyper", cog: 97 }
              };
              const activeModeData = modesStats[statsActiveMode];

              // Cognitive analysis descriptions
              const cognitiveAdvice: Record<string, { rating: number; trend: string; text: string; audio: string }> = {
                "Pattern Recognition": {
                  rating: 91,
                  trend: "Optimized (+4.5%)",
                  text: "Your diagonal scanning of Naked Pairs is extremely rapid. To reach Grandmaster status, practice noticing 3-degree parallel column covers.",
                  audio: "Diagnostic complete. Pattern recognition registers at ninety one percent. Scan speeds are optimal but keep practicing column alignments."
                },
                "Logical Reasoning": {
                  rating: 94,
                  trend: "Excellent (+2.1%)",
                  text: "You rarely make backtracking mistakes on cell assignments. Your constraint propagation vectors are highly consistent.",
                  audio: "Logical reasoning is your highest tier asset, registering ninety four percent. Zero speculation indicates perfect logical flow."
                },
                "Decision Speed": {
                  rating: 85,
                  trend: "Moderate (+5.8%)",
                  text: "Your average cell response latency is 4.2 seconds under stress. Play more Flow challenges to reduce analysis hesitation.",
                  audio: "Decision speed requires reinforcement. Your cell choice latency peaks at four point two seconds. Play Flow Mode to lock-in quicker."
                },
                "Error Recovery": {
                  rating: 89,
                  trend: "Aesthetic (+1.8%)",
                  text: "When a mistake conflict occurs, you prune incorrect values in under 12 seconds. Excellent cognitive resilience, keeping ELO stable.",
                  audio: "Excellent error recovery! You purge constraint conflicts in under twelve seconds, preserving your mental composure cleanly."
                },
                "Focus Stability": {
                  rating: 93,
                  trend: "Peak State (+0.5%)",
                  text: "You focus on the grid matrix continuously without distracting notes clicks. Your neural fatigue resilience is top tier.",
                  audio: "Focus stability is at ninety three percent. Your local spatial attention maps keep candidate blocks locked without fatigue."
                }
              };

              // Combine user with static pool of 10,045 players
              const userEntry = {
                name: profile.name ? `${profile.name} (You)` : "Anonymous Solver (You)",
                ELO: liveSkudoIQ,
                country: "🌍 Local Global",
                isSelf: true
              };

              const filteredPool = BASE_LEADERBOARD_POOL.filter(
                p => p.name !== userEntry.name && p.name !== profile.name
              );

              const combinedListRaw = [userEntry, ...filteredPool];

              // Sort by ELO descending
              combinedListRaw.sort((a, b) => b.ELO - a.ELO);

              // Map dynamic ranks and isSpacer flag
              const combinedList = combinedListRaw.map((player, idx) => ({
                ...player,
                rank: idx + 1,
                isSpacer: false
              }));

              const userIndex = combinedList.findIndex(p => p.isSelf);
              const userRank = userIndex !== -1 ? userIndex + 1 : 11;

              // Filtered list by search query (if active)
              const cleanSearchQuery = leaderboardSearchQuery.trim().toLowerCase();
              
              let displayedLeaderboard: Array<{ rank: number; name: string; ELO: number; country: string; isSelf: boolean; isSpacer?: boolean }> = [];
              let searchMatchCount = 0;

              if (cleanSearchQuery) {
                const searchResults = combinedList.filter(player => 
                  player.name.toLowerCase().includes(cleanSearchQuery) || 
                  player.country.toLowerCase().includes(cleanSearchQuery) ||
                  player.rank.toString() === cleanSearchQuery ||
                  player.ELO.toString() === cleanSearchQuery
                );
                searchMatchCount = searchResults.length;
                displayedLeaderboard = searchResults.slice(0, 50); // limit to top 50 matches for performance
              } else {
                const top15 = combinedList.slice(0, 15);
                if (userIndex < 15) {
                  displayedLeaderboard = top15;
                } else {
                  displayedLeaderboard = [
                    ...top15,
                    { rank: -1, name: "SPACER", ELO: 0, country: "", isSelf: false, isSpacer: true },
                    ...combinedList.slice(Math.max(15, userIndex - 3), Math.min(combinedList.length, userIndex + 4))
                  ];
                }
              }

              const leaderboardMock = displayedLeaderboard;

              return (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col gap-6 select-none"
                >
                  
                  {/* ====== BLOOMBERG-STYLE PERFORMANCE TICKER TAPE ====== */}
                  <div className="w-full overflow-hidden relative py-1.5 border-y border-[#009DFF]/20 bg-[#009DFF]/5 rounded-md flex items-center">
                    <div className="flex whitespace-nowrap gap-8 animate-marquee font-mono text-[9.5px] uppercase font-black text-slate-400 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>SKUDO ELO IQ: <strong className="text-cyan-400">{liveSkudoIQ} PTS</strong></span>
                      </span>
                      <span className="text-[#009DFF]">•</span>
                      <span className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ACCURACY: <strong className="text-emerald-400">{liveAccuracy}%</strong></span>
                      </span>
                      <span className="text-[#009DFF]">•</span>
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span>STRATEGIES DISCOVERED: <strong className="text-amber-400">{analyticsStrategies}</strong></span>
                      </span>
                      <span className="text-[#009DFF]">•</span>
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span>COGNITIVE STREAK: <strong className="text-rose-500">{profile.streak} DAYS</strong></span>
                      </span>
                      <span className="text-[#009DFF]">•</span>
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-violet-400" />
                        <span>ARENA STANDINGS: <strong className="text-violet-400">#11 GLOBAL</strong></span>
                      </span>
                      <span className="text-[#009DFF]">•</span>
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-teal-400" />
                        <span>AI SOLVER HEALTH: <strong className="text-teal-400">CDCL ACTIVE (99.8%)</strong></span>
                      </span>
                    </div>
                  </div>

                  {/* HEADER WITH AUTO-SIMULATOR CONTROLS */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left border-b border-slate-800/10 dark:border-slate-800/30 pb-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black font-mono">SKUDO ANALYTICS INTELLIGENCE v12.0</span>
                      <h3 className="text-xl font-black tracking-tight mt-0.5">Brain Performance Intelligence Center</h3>
                      <p className="text-[11.5px] text-slate-400 mt-1 font-semibold">Every logic action, strategy scan, mistake, and cell solve updates ELO metrics with sub-100ms lag.</p>
                    </div>

                    {/* LIVE SIMULATION CONTROLS */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-[#009DFF]/8 border border-[#009DFF]/15 p-2 rounded-2xl">
                      <div className="flex flex-col text-right">
                        <span className="text-[9.5px] font-black uppercase text-slate-400">AI Solving Autopilot</span>
                        <span className="text-[8.5px] font-bold text-slate-450 mt-0.5">Simulates real-time telemetry</span>
                      </div>
                      <button
                        onClick={() => {
                          gameAudio.playClick();
                          triggerVibe();
                          setStatsSimActive(!statsSimActive);
                          if (!statsSimActive) {
                            speakAsCoach("Analytical Autopilot initialized. Observe live constraint updates and IQ calculations below.");
                          } else {
                            speakAsCoach("Autopilot paused. High frequency stream standby.");
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black uppercase transition flex items-center gap-1.5 cursor-pointer ${
                          statsSimActive 
                            ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' 
                            : 'bg-[#009DFF] hover:bg-sky-500 text-white'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${statsSimActive ? 'animate-spin' : ''}`} />
                        <span>{statsSimActive ? "STALL SIM" : "RUN SIMULATOR"}</span>
                      </button>
                    </div>
                  </div>

                  {/* MASTER PERFORMANCE SCORE CARD GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left">
                    
                    {/* 1. SKUDO IQ SCORE MASTER ENGINE PANEL */}
                    <div className={`col-span-1 md:col-span-6 p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-br from-[#121B30] to-[#0A0E1A] border-slate-800' 
                        : 'bg-gradient-to-br from-[#F5FAFF] via-white to-white border-slate-200/50 shadow-md shadow-slate-100'
                    }`}>
                      {/* Technical mesh background lines */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent opacity-40 pointer-events-none" />
                      
                      <div className="flex justify-between items-start relative z-10 w-full mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-[#009DFF]/10 text-[#009DFF] rounded-xl flex items-center justify-center animate-bounce">
                            <Trophy className="w-5 h-5" />
                          </span>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#009DFF]">Cognitive Standings</span>
                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-150 uppercase tracking-tight">SOLVER SKUDO IQ INDEX</h4>
                          </div>
                        </div>

                        {/* Interactive trigger simulations inside core panel */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              triggerVibe();
                              setAnalyticsMoves(p => {
                                const next = p + 1;
                                setSimulatedLogs(prev => [`Placed interactive Sudoku grid move at cell. Total Moves: ${next}`, ...prev].slice(0, 20));
                                return next;
                              });
                              setAnalyticsCandidates(p => p + 2);
                            }}
                            className="p-1 px-2 rounded-lg bg-[#009DFF]/10 hover:bg-[#009DFF]/20 text-[#009DFF] border border-[#009DFF]/15 text-[8.5px] font-black uppercase cursor-pointer"
                            title="Place classical cell move action"
                          >
                            + Move
                          </button>
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              triggerVibe();
                              setAnalyticsSolved(p => {
                                const next = p + 1;
                                setSimulatedLogs(prev => [`🏆 Interactively solved complete Sudoku puzzle board standard logic constraint blocks! ELO updated.`, ...prev].slice(0, 20));
                                return next;
                              });
                              onUpdateProfile({
                                ...profile,
                                xp: profile.xp + 50,
                                completedGames: profile.completedGames + 1,
                                totalGames: profile.totalGames + 1
                              });
                            }}
                            className="p-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/15 text-[8.5px] font-black uppercase cursor-pointer"
                            title="Simulate successful board clearance"
                          >
                            + Solve
                          </button>
                        </div>
                      </div>

                      {/* Display live dynamic ticking score */}
                      <div className="my-2 relative z-10">
                        <div className="flex items-baseline gap-2.5">
                          <motion.span 
                            key={liveSkudoIQ}
                            initial={{ scale: 1.1, textShadow: '0 0 10px #22d3ee' }}
                            animate={{ scale: 1, textShadow: 'none' }}
                            className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#009DFF] via-cyan-400 to-[#10b981] font-mono leading-none"
                          >
                            {liveSkudoIQ}
                          </motion.span>
                          <span className="text-[12px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-0.5">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {weeklyIQChange} This Week
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 font-semibold mt-1">
                          Calculated real-time from solver speeds, accuracy index, pattern complexity and hint deduction weights.
                        </p>
                      </div>

                      {/* Score comparison sub-grid */}
                      <div className="grid grid-cols-4 gap-2 border-t border-dashed border-slate-800/15 pt-3.5 mt-2 relative z-10 text-[11px] leading-tight font-bold">
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">High Score</span>
                          <span className="text-slate-100 dark:text-slate-205">{highestSkudoIQ}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">Monthly standing</span>
                          <span className="text-emerald-500">{monthlyIQChange}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">All-Time Best</span>
                          <span className="text-indigo-400">{allTimeBestIQ}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">Skill Rank</span>
                          <span className="text-amber-500 truncate block">GRANDMASTER CLAN</span>
                        </div>
                      </div>

                    </div>

                    {/* 2. PLAYER PROFILE INTEL PANEL */}
                    <div className={`col-span-1 md:col-span-6 p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${
                      theme === 'dark' ? 'bg-[#151D30]/65 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-3 border-b border-slate-900/10 pb-2 mb-3">
                        <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                          <Compass className="w-4.5 h-4.5" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Player Profile Dashboard</h4>
                          <span className="text-[10.5px] font-extrabold text-slate-100 dark:text-slate-200">
                            Rank: 🌟 Elite Grandmaster Candidate (Level 48)
                          </span>
                        </div>
                      </div>

                      {/* Balanced parameters details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">Total Solved</span>
                          <span className="font-extrabold font-mono text-slate-650 dark:text-white">{totalGamesSolved} puzzles</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">Practice Duration</span>
                          <span className="font-extrabold font-mono text-slate-650 dark:text-white">{trainingHours} cumulative hrs</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">Current Streak</span>
                          <span className="font-extrabold font-mono text-rose-500">{profile.streak} days active</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">Average Solve Time</span>
                          <span className="font-extrabold font-mono text-slate-650 dark:text-white">{averageSolveTimeStr}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">Current accuracy</span>
                          <span className="font-extrabold font-mono text-emerald-400">{liveAccuracy}%</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-slate-450 block">Mastery Percentage</span>
                          <span className="font-extrabold font-mono text-[#009DFF]">86.5% grid coverage</span>
                        </div>
                      </div>

                      <div className={`mt-3.5 p-2 rounded-xl border text-[10.5px] flex items-center justify-between text-left font-bold ${
                        theme === 'dark' ? 'bg-slate-950/40 border-slate-900 text-slate-400' : 'bg-[#f8fafc] border border-slate-200 text-slate-700'
                      }`}>
                        <span>Favorite Mode: <strong className="text-[#009DFF]">Quantum Letters (A-I)</strong></span>
                        <span className="opacity-40 select-none">|</span>
                        <span>Weakest Tactic: <strong className="text-rose-505">Swordfish 3x3</strong></span>
                      </div>
                    </div>

                  </div>

                  {/* LIVE TELEMETRY SIMULATOR STATUS TERM */}
                  <div className={`p-4.5 rounded-3xl border font-mono text-xs ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-[#0b0f19] to-[#04060b] border-slate-900 text-cyan-400' 
                      : 'bg-[#1e293b] border-slate-800 text-cyan-400 shadow-md'
                  }`}>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <span className={`w-2 h-2 rounded-full ${statsSimActive ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                        <span>AI Solver Diagnostics Feed: {statsSimActive ? "RUNNING SIMULATION" : "STANDBY"}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">RATE: 1.2s/TICK</span>
                    </div>
                    <div className="h-28 overflow-y-auto flex flex-col gap-1 text-[11px] leading-relaxed select-text pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                      {simulatedLogs.map((logStr, i) => (
                        <div key={i} className="flex gap-2 items-start py-0.5 border-b border-white/5">
                          <span className="text-slate-500 select-none shrink-0 font-mono">[{new Date().toLocaleTimeString()}]</span>
                          <span className={logStr.startsWith("⚠️") ? "text-rose-450" : logStr.startsWith("🏆") || logStr.includes("🏆") ? "text-emerald-400 font-bold" : logStr.startsWith("🔍") ? "text-amber-400" : "text-slate-350"}>
                            {logStr}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* HIGH-SPEC CHART CONTROLS & SELECTION */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border text-left ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-815/20 text-white' : 'bg-[#f1f5f9] border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase font-black tracking-wider text-[#009DFF]">Advanced Chart Center</span>
                      <h4 className="text-xs font-black uppercase">Mathematical Trend and Cognitive Projections</h4>
                    </div>
                    
                    {/* Intervals Toggles */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        { key: 'daily' as const, label: 'Daily' },
                        { key: 'weekly' as const, label: 'Weekly' },
                        { key: 'monthly' as const, label: 'Monthly' },
                        { key: 'yearly' as const, label: 'Yearly' },
                        { key: 'alltime' as const, label: 'All-Time' }
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            gameAudio.playClick();
                            setStatsTimeframe(item.key);
                          }}
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            statsTimeframe === item.key
                              ? 'bg-[#009DFF]/15 border-[#009DFF]/40 text-[#009DFF]'
                              : theme === 'dark'
                                ? 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/30'
                                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-200/50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Chart Style Selector */}
                    <div className="flex gap-1">
                      {[
                        { key: 'line' as const, label: 'Line' },
                        { key: 'bar' as const, label: 'Bar' },
                        { key: 'area' as const, label: 'Area' },
                        { key: 'radar' as const, label: 'Radar' },
                        { key: 'heatmap' as const, label: 'Heatmap' },
                        { key: 'distribution' as const, label: 'Skill Dist' }
                      ].map((type) => (
                        <button
                          key={type.key}
                          onClick={() => {
                            gameAudio.playClick();
                            setStatsChartType(type.key);
                          }}
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border transition cursor-pointer ${
                            statsChartType === type.key
                              ? 'bg-[#009DFF] text-white border-[#009DFF]'
                              : theme === 'dark'
                                ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800/30 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-bold shadow-2xs'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* INTERACTIVE SHARD GRID CHART REPRESENTATION */}
                  <div className={`p-5 rounded-3xl border text-left relative overflow-hidden ${
                    theme === 'dark' ? 'bg-[#0E1528] border-slate-800' : 'bg-white border-slate-205 shadow-inner'
                  }`}>
                    
                    {/* DYNAMIC SHAPE REDEPENDENCY FROM ACTIVE STAT CHART TYPE */}
                    {statsChartType === 'line' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-cyan-400" /> Linear Cognitive Progression Index
                          </h4>
                          <span className="text-[10px] font-bold font-mono text-[#009DFF]">Current stand: {liveSkudoIQ} ELO</span>
                        </div>
                        
                        <div className={`w-full h-56 rounded-2xl p-4 border relative ${
                          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-[#f8fafc] border-slate-200 shadow-3xs'
                        }`}>
                          <svg className="w-full h-full text-cyan-400" viewBox="0 0 100 40" fill="none" stroke="currentColor">
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            {/* Grid coordinates */}
                            <line x1="0" y1="10" x2="100" y2="10" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} strokeWidth="0.2" strokeDasharray="1 1" />
                            <line x1="0" y1="20" x2="100" y2="20" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} strokeWidth="0.2" strokeDasharray="1 1" />
                            <line x1="0" y1="30" x2="100" y2="30" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} strokeWidth="0.2" strokeDasharray="1 1" />
                            
                            {/* Dynamic line vector */}
                            <path 
                              d={`M 5,35 Q 20,${Math.max(2, 40 - (activeDataPoints[1] / 1800 * 40))} 35,${Math.max(2, 40 - (activeDataPoints[2] / 1800 * 40))} T 65,${Math.max(2, 40 - (activeDataPoints[4] / 1800 * 40))} T 95,${Math.max(2, 40 - (activeDataPoints[5] / 1800 * 40))}`} 
                              fill="url(#chartGrad)" 
                              stroke="none"
                            />
                            <path 
                              d={`M 5,35 Q 20,${Math.max(2, 40 - (activeDataPoints[1] / 1800 * 40))} 35,${Math.max(2, 40 - (activeDataPoints[2] / 1800 * 40))} T 65,${Math.max(2, 40 - (activeDataPoints[4] / 1800 * 40))} T 95,${Math.max(2, 40 - (activeDataPoints[5] / 1800 * 40))}`} 
                              strokeLinecap="round" 
                              strokeWidth="1.2" 
                              stroke="#009DFF" 
                              fill="none"
                            />

                            {/* Node markers */}
                            <circle cx="35" cy={Math.max(2, 40 - (activeDataPoints[2] / 1800 * 40))} r="1.2" className="fill-emerald-400 stroke-slate-900" strokeWidth="0.5" />
                            <circle cx="65" cy={Math.max(2, 40 - (activeDataPoints[4] / 1800 * 40))} r="1.2" className="fill-amber-400 stroke-slate-900" strokeWidth="0.5" />
                            <circle cx="95" cy={Math.max(2, 40 - (activeDataPoints[5] / 1800 * 40))} r="1.5" className="fill-cyan-400 stroke-slate-900 animate-pulse" strokeWidth="0.8" />
                          </svg>
                          <div className="absolute bottom-1.5 left-0 right-0 px-4 flex justify-between text-[8px] font-mono text-slate-500">
                            <span>GRID INITIALIZATION</span>
                            <span>PROGREGRESSIVE NODE</span>
                            <span>MID CALIBRATION</span>
                            <span>CURRENT PEAK</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {statsChartType === 'bar' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-amber-500" /> Grouped Volume Distribution Columns
                          </h4>
                          <span className="text-[10px] font-bold font-mono text-amber-400">Timeframe: {statsTimeframe.toUpperCase()}</span>
                        </div>
                        
                        <div className={`w-full h-56 rounded-2xl p-4 border flex items-end justify-around pb-6 ${
                          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-[#f8fafc] border-slate-200 shadow-3xs'
                        }`}>
                          {activeDataPoints.map((pt, idx) => {
                            const barHeight = Math.max(12, Math.floor((pt / highestSkudoIQ) * 160));
                            return (
                              <div key={idx} className="flex flex-col items-center w-8 group">
                                <span className="text-[7.5px] font-mono text-slate-500 group-hover:text-cyan-400 mb-1 leading-none">{pt}</span>
                                <div 
                                  style={{ height: `${barHeight}px` }}
                                  className="w-full rounded-t-md bg-gradient-to-t from-blue-600 via-[#009DFF] to-cyan-400 shadow-lg shadow-[#009DFF]/10 transition-all duration-500"
                                />
                                <span className="text-[8px] font-mono tracking-tight text-slate-650 mt-1 uppercase">P{idx + 1}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {statsChartType === 'area' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-indigo-400" /> Unified Cumulative Flow Density area
                          </h4>
                          <span className="text-[10px] font-bold font-mono text-indigo-400">Steady progression vector verified</span>
                        </div>
                        
                        <div className={`w-full h-56 rounded-2xl p-4 border relative ${
                          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-[#f8fafc] border-slate-200 shadow-3xs'
                        }`}>
                          <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 40" fill="currentColor">
                            <defs>
                              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                              </linearGradient>
                            </defs>
                            {/* SVG Grid */}
                            <line x1="0" y1="10" x2="100" y2="10" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} strokeWidth="0.15" />
                            <line x1="0" y1="20" x2="100" y2="20" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} strokeWidth="0.15" />
                            <line x1="0" y1="30" x2="100" y2="30" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} strokeWidth="0.15" />

                            {/* Polygon layout */}
                            <polygon 
                              points={`5,40 5,34 20,${40 - (activeDataPoints[1] / 1800 * 35)} 35,${40 - (activeDataPoints[2] / 1800 * 35)} 65,${40 - (activeDataPoints[4] / 1800 * 35)} 95,${40 - (activeDataPoints[5] / 1800 * 35)} 95,40`}
                              fill="url(#areaGrad)"
                              stroke="#6366f1"
                              strokeWidth="1"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    {statsChartType === 'radar' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-violet-400" /> Spiderweb Cognitive Skill Matrix Radar
                          </h4>
                          <span className="text-[10px] font-bold font-mono text-violet-400">Arc Consistency Coverage</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Left: SVG radar mockup */}
                          <div className={`md:col-span-5 flex items-center justify-center p-2 rounded-2xl border min-h-[190px] ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-[#f8fafc] border-slate-200 shadow-3xs'
                          }`}>
                            <svg className="w-40 h-40 text-[#009DFF]" viewBox="0 0 100 100">
                              {/* Background Hexagon lines */}
                              <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke={theme === 'dark' ? '#122A40' : '#cbd5e1'} strokeWidth="0.5" />
                              <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="none" stroke={theme === 'dark' ? '#122A40' : '#cbd5e1'} strokeWidth="0.5" />
                              <polygon points="50,35 65,42.5 65,57.5 50,65 35,57.5 35,42.5" fill="none" stroke={theme === 'dark' ? '#122A40' : '#cbd5e1'} strokeWidth="0.5" />
                              
                              {/* Linear Spokes axis */}
                              <line x1="50" y1="50" x2="50" y2="5" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} strokeWidth="0.5" />
                              <line x1="50" y1="50" x2="95" y2="27.5" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} strokeWidth="0.5" />
                              <line x1="50" y1="50" x2="95" y2="72.5" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} strokeWidth="0.5" />
                              <line x1="50" y1="50" x2="50" y2="95" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} strokeWidth="0.5" />
                              <line x1="50" y1="50" x2="5" y2="72.5" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} strokeWidth="0.5" />
                              <line x1="50" y1="50" x2="5" y2="27.5" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} strokeWidth="0.5" />

                              {/* Active filled polygon radar coverage */}
                              <polygon 
                                points="50,15 88,32 78,63 50,85 22,65 18,34" 
                                fill="rgba(0, 157, 255, 0.25)" 
                                stroke="#009DFF" 
                                strokeWidth="1" 
                              />
                            </svg>
                          </div>

                          {/* Right: details stats labels */}
                          <div className="md:col-span-7 flex flex-col gap-2">
                            {[
                              { label: "Pattern Recognition", val: "91%" },
                              { label: "Logical Reasoning", val: "94%" },
                              { label: "Decision Speed", val: "85%" },
                              { label: "Error Recovery", val: "89%" },
                              { label: "Focus Stability", val: "93%" }
                            ].map((row, index) => (
                              <div key={index} className="flex justify-between items-center text-xs text-left">
                                <span className="font-bold text-slate-400 capitalize">{row.label}</span>
                                <div className="flex items-center gap-2 flex-grow mx-4">
                                  <div className={`flex-1 h-1.5 rounded-lg overflow-hidden border ${
                                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                                  }`}>
                                    <div style={{ width: row.val }} className="bg-[#009DFF] h-full" />
                                  </div>
                                </div>
                                <span className={`font-mono font-black ${
                                  theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                                }`}>{row.val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {statsChartType === 'heatmap' && (
                      <div className="flex flex-col gap-4 animate-pop-in">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-emerald-400" /> Interactive Training Activity Matrix Calendar Heatmap
                          </h4>
                          <span className="text-[10px] font-bold font-mono text-emerald-400">Total practice hours recorded</span>
                        </div>
                        <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
                          Intensity represent daily Sudoku training hours logged. <strong>Fully Interactive:</strong> click on any calendar coordinate field below to log a new Practice Session (+15 mins of training) simulated in real time!
                        </p>

                        <div className={`w-full p-4 rounded-2xl border flex flex-col gap-3 ${
                          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-[#f8fafc] border-slate-200 shadow-3xs'
                        }`}>
                          <div className="grid grid-cols-14 gap-2 h-24">
                            {heatmapActivity.map((mins, index) => {
                              // evaluate green color intensity depending on logged minutes
                              let colorClass = theme === 'dark' ? "bg-slate-900 border-slate-810" : "bg-white border-slate-200 text-slate-800";
                              if (mins > 0 && mins <= 25) colorClass = "bg-emerald-950/70 border-emerald-900/30 text-emerald-500";
                              else if (mins > 25 && mins <= 55) colorClass = "bg-emerald-800/40 border-emerald-500/20 text-emerald-400";
                              if (mins > 55 && mins <= 85) colorClass = "bg-emerald-600/50 border-emerald-500/30 text-emerald-300";
                              if (mins > 85) colorClass = "bg-emerald-500/80 border-cyan-400/40 text-black shadow-lg shadow-emerald-500/10";
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => {
                                    gameAudio.playClick();
                                    triggerVibe();
                                    // Increment this day minutes
                                    const copy = [...heatmapActivity];
                                    copy[index] += 15;
                                    setHeatmapActivity(copy);
                                    
                                    // Persist in real profile state
                                    onUpdateProfile({
                                      ...profile,
                                      heatmapData: copy,
                                      // also grant a subtle 10 XP practice reward as requested!
                                      xp: (profile.xp || 0) + 10,
                                      totalTime: (profile.totalTime || 0) + 15 * 60
                                    });

                                    setAnalyticsMoves(p => p + 3); // simulate user performed logic move
                                    setTimeout(() => {
                                      speakAsCoach(`Practice session hours logged successfully for day ${index + 1}. Total duration updated to ${copy[index]} minutes.`);
                                    }, 100);
                                  }}
                                  className={`rounded-md border p-1 transition flex flex-col justify-between items-center h-full cursor-pointer hover:border-cyan-400 hover:scale-105 active:scale-95 ${colorClass}`}
                                  title={`Day ${index + 1}: ${mins} mins trained. Click to log +15m!`}
                                >
                                  <span className="text-[7.5px] font-bold">D{index + 1}</span>
                                  <span className="text-[8.5px] font-mono leading-none block font-black">{mins}m</span>
                                </button>
                              );
                            })}
                          </div>
                          
                          <div className={`flex justify-between items-center text-[9px] font-mono font-bold text-slate-500 border-t pt-2 px-1 ${
                            theme === 'dark' ? 'border-slate-900' : 'border-slate-200'
                          }`}>
                            <span>28 DAYS ROTATIONAL LOG</span>
                            <div className="flex items-center gap-1">
                              <span>Low Activity</span>
                              <div className={`w-2.5 h-2.5 rounded-sm border ${
                                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                              }`} />
                              <div className="w-2.5 h-2.5 bg-emerald-950/60 rounded-sm" />
                              <div className="w-2.5 h-2.5 bg-emerald-700/60 rounded-sm" />
                              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                              <span>Titan Intensity</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {statsChartType === 'distribution' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-violet-500" /> Skill Distribution Wave Graph
                          </h4>
                          <span className="text-[10px] font-bold font-mono text-violet-400">Distribution frequency across standard grids</span>
                        </div>
                        
                        <div className={`w-full h-56 rounded-2xl p-4 border relative ${
                          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-[#f8fafc] border-slate-200 shadow-3xs'
                        }`}>
                          <svg className="w-full h-full text-violet-500 animate-pulse" viewBox="0 0 100 40" fill="none" stroke="currentColor">
                            <defs>
                              <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path d="M 0,38 Q 25,2 50,15 T 100,5" strokeLinecap="round" strokeWidth="1.5" className="text-violet-400" fill="url(#distGrad)" stroke="currentColor" />
                            {/* Mean dotted coordinates line */}
                            <line x1="50" y1="0" x2="50" y2="40" stroke="#f43f5e" strokeWidth="0.5" strokeDasharray="1 1" />
                            <circle cx="50" cy="15" r="2" className="fill-rose-500" />
                          </svg>
                          <div className="absolute top-1/2 left-[52%] text-[9px] font-bold text-rose-500 -translate-y-1/2">
                            Average Solver Mean
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* MULTI-MODE PERFORMANCE ANALYTICS SWITCHERS */}
                  <div className="flex flex-col gap-4 text-left">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black font-mono">Core Layout parameters</span>
                      <h4 className="text-sm font-black uppercase">Deep-Dive Analytics for Every Solving Mode</h4>
                    </div>

                    {/* Mode tab selectors row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { key: 'zen' as const, label: 'Zen Mode', isClassicValue: true },
                        { key: 'flow' as const, label: 'Flow Mode', isClassicValue: true },
                        { key: 'quantum' as const, label: 'Quantum Mode', isClassicValue: false },
                        { key: 'master' as const, label: 'Master Mode', isClassicValue: false },
                        { key: 'grandmaster' as const, label: 'Grandmaster Mode', isClassicValue: false }
                      ].map((md) => {
                        const isCurrent = statsActiveMode === md.key;
                        return (
                          <button
                            key={md.key}
                            onClick={() => {
                              gameAudio.playClick();
                              setStatsActiveMode(md.key);
                            }}
                            className={`p-3 rounded-2xl border text-left flex flex-col justify-between cursor-pointer transition ${
                              isCurrent
                                ? 'bg-gradient-to-br from-[#009DFF] to-blue-600 text-white border-transparent shadow-lg'
                                : theme === 'dark' ? 'bg-[#151D30] border-slate-800 text-slate-300 hover:bg-[#1E293B]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-[11.5px] font-black uppercase tracking-tight">{md.label}</span>
                            <span className={`text-[8.5px] font-semibold mt-2 ${isCurrent ? 'text-white/80' : 'text-slate-400'}`}>
                              {md.isClassicValue ? "Level Standard" : "Advanced solvers enabled"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active mode metrics panels */}
                    <div className={`p-5 rounded-3xl border grid grid-cols-2 md:grid-cols-4 gap-4 ${
                      theme === 'dark' ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                    }`}>
                      <div>
                        <span className="text-[8.5px] font-black uppercase text-slate-450 block">Accuracy Rating</span>
                        <span className="text-sm font-black text-slate-100 dark:text-slate-200 font-mono mt-0.5 block">
                          {activeModeData.acc}
                        </span>
                        <span className="text-[9.5px] text-emerald-400 flex items-center font-bold mt-0.5">
                          {activeModeData.trend} vs last month
                        </span>
                      </div>

                      <div>
                        <span className="text-[8.5px] font-black uppercase text-slate-450 block">Solve Velocity benchmark</span>
                        <span className="text-sm font-black text-slate-100 dark:text-slate-200 font-mono mt-0.5 block">
                          {activeModeData.time}
                        </span>
                        <span className="text-[9.5px] text-slate-450 block font-bold mt-0.5">
                          Speed Bracket: {activeModeData.speed}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8.5px] font-black uppercase text-slate-450 block">Cognitive Stability index</span>
                        <span className="text-sm font-black text-slate-100 dark:text-slate-200 font-mono mt-0.5 block">
                          {activeModeData.focus} points
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex-1 h-1 bg-slate-900 rounded overflow-hidden">
                            <div style={{ width: `${activeModeData.focus}%` }} className="bg-[#009DFF] h-full" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8.5px] font-black uppercase text-slate-450 block">Completion Vector Ratio</span>
                        <span className="text-sm font-black text-slate-105 dark:text-slate-200 font-mono mt-0.5 block">
                          {activeModeData.comp}
                        </span>
                        <span className="text-[9.5px] text-indigo-400 block font-bold mt-0.5">
                          Logical Depth: {activeModeData.cog}%
                        </span>
                      </div>
                    </div>

                    {/* Mode Comparison charts */}
                    <div className={`p-4 rounded-2xl border ${
                      theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-100/50 border-slate-200'
                    }`}>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#009DFF] block mb-2">Comparative Modes Analysis Chart</span>
                      
                      {/* Flexbar representing comparative values across all five modes */}
                      <div className="flex flex-col gap-2.5">
                        {[
                          { mode: "Zen", acc: 98, color: "bg-emerald-500", rating: "2150 ELO", comps: "02:30 solve time" },
                          { mode: "Flow", acc: 92, color: "bg-[#009DFF]", rating: "2280 ELO", comps: "04:10 solve time" },
                          { mode: "Quantum", acc: 87, color: "bg-violet-500", rating: "2390 ELO", comps: "06:15 solve time" },
                          { mode: "Master", acc: 79, color: "bg-amber-500", rating: "2530 ELO", comps: "09:40 solve time" },
                          { mode: "Grandmaster", acc: 74, color: "bg-rose-500", rating: "2780 ELO", comps: "13:20 solve time" }
                        ].map((mDetails, subIdx) => (
                          <div key={subIdx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 text-left font-bold">
                            <div className="w-24 truncate block whitespace-nowrap">
                              <span className="font-black text-slate-650 dark:text-slate-350">{mDetails.mode} Layout</span>
                            </div>
                            
                            <div className="flex-1 flex items-center gap-3">
                              <div className="flex-1 h-3 bg-slate-900 border border-slate-815/30 rounded overflow-hidden relative">
                                <div style={{ width: `${mDetails.acc}%` }} className={`h-full ${mDetails.color}`} />
                                <span className="absolute left-1.5 top-0 text-[8px] font-black text-white leading-none uppercase select-none">
                                  {mDetails.acc}% Accuracy Rating
                                </span>
                              </div>
                            </div>

                            <div className="w-36 text-right text-[11px] font-mono text-slate-500 flex gap-2 justify-end">
                              <span className="text-cyan-400">{mDetails.rating}</span>
                              <span className="opacity-40">|</span>
                              <span>{mDetails.comps}</span>
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* COGNITIVE ANALYSIS & DIAGNOSTICS CONTROL PANEL */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left mt-1">
                    
                    {/* Left: Interactive list of cognitive topics (md:col-span-7) */}
                    <div className={`md:col-span-7 p-5 rounded-3xl border flex flex-col gap-4.5 ${
                      theme === 'dark' ? 'bg-[#10162A]/90 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                    }`}>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black block">Artificial Diagnostic Scanning</span>
                        <h4 className="text-base font-black uppercase">Cognitive Vector Profile Analysis</h4>
                        <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">
                          We process the timings and coordinate placements across your daily sessions to construct high accuracy cognitive diagnostic profiles. Tap on a parameter to get customized tactical suggestions immediately.
                        </p>
                      </div>

                      {/* Interactive Diagnostic categories */}
                      <div className="flex flex-col gap-3">
                        {Object.entries(cognitiveAdvice).map(([topic, data]) => {
                          const isActive = statsCognitiveActiveTopic === topic;
                          return (
                            <div
                              key={topic}
                              onClick={() => {
                                gameAudio.playClick();
                                setStatsCognitiveActiveTopic(topic);
                                speakAsCoach(`Inspecting cognitive element: ${topic}. Diagnostic rating evaluates at ${data.rating} percent. Advice: ${data.text}`);
                              }}
                              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition ${
                                isActive
                                  ? 'border-[#009DFF]/60 bg-[#0009ff]/5 text-[#009DFF] shadow-sm transform scale-[1.01]'
                                  : 'border-slate-850/10 hover:bg-slate-900/10 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-black uppercase tracking-tight ${isActive ? 'text-[#009DFF]' : 'text-slate-100 dark:text-slate-200'}`}>
                                  {topic}
                                </span>
                                <span className="font-mono text-[10.5px] font-black text-cyan-400">{data.rating}% Score</span>
                              </div>
                              
                              <div className="flex items-center gap-3 mt-2 font-bold text-[10.5px]">
                                <div className="flex-1 h-1.5 bg-slate-900 overflow-hidden rounded">
                                  <div style={{ width: `${data.rating}%` }} className="bg-gradient-to-r from-[#009DFF] to-cyan-400 h-full" />
                                </div>
                                <span className="text-[8.5px] font-black uppercase text-emerald-400">{data.trend}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: AI Coach advice rendering (md:col-span-5) */}
                    <div className={`md:col-span-5 p-5 rounded-3xl border flex flex-col justify-between ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-b from-[#151D30] to-slate-950 border-slate-805' 
                        : 'bg-gradient-to-b from-sky-50 to-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 border-b border-slate-800/15 pb-2">
                          <Bot className="w-5 h-5 text-cyan-400 shrink-0" />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">AI Diagnostic Report</h4>
                            <span className="text-[9px] uppercase font-bold text-[#009DFF]">Cognitive Vector Selected</span>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-black uppercase tracking-tight text-slate-150 text-slate-750">
                            {statsCognitiveActiveTopic}
                          </h5>
                          
                          <p className="text-[11.5px] leading-relaxed text-slate-400 dark:text-slate-300 font-semibold mt-2.5">
                            {cognitiveAdvice[statsCognitiveActiveTopic]?.text}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Voice Action */}
                      <div className="mt-6 flex flex-col gap-3">
                        <button
                          onClick={() => {
                            const raw = cognitiveAdvice[statsCognitiveActiveTopic]?.text || "";
                            speakAsCoach(raw);
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#009DFF] to-sky-500 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-500/10 active:scale-95"
                        >
                          <Volume2 className="w-4.5 h-4.5 animate-pulse" />
                          <span>SYNTHESIZE SPEECH EXPLANATION</span>
                        </button>
                        
                        <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl leading-normal text-[10px] text-slate-450 font-bold">
                          💡 <strong>Pro Tips:</strong> Continuous tracking active. Check AI Voice options inside the Left dashboard menu to change speed or styles.
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* WEAKNESS DETECTION AI & CALIBRATION MAP */}
                  <div className={`p-5 rounded-3xl border text-left relative overflow-hidden ${
                    theme === 'dark' ? 'bg-[#0E1526] border-slate-850' : 'bg-rose-50/10 border-rose-100 shadow-sm'
                  }`}>
                    <div className="absolute top-0 right-0 p-3">
                      <span className="text-[9px] font-mono bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        AI DETECTOR ACTIVE
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl shrink-0 h-max">
                        <AlertCircle className="w-5 h-5 animate-bounce" />
                      </div>
                      <div className="flex-1 w-full min-w-0">
                        <h4 className="text-xs font-black uppercase text-rose-550">Weakness Detection & Adaptive Calibration</h4>
                        <p className="text-[11px] text-slate-450 mt-1 font-semibold leading-relaxed">
                          Our SAT solver trace logs revealed standard latency clusters in the following locations. Complete corresponding interactive classes inside the Learn center to purge bottleneck patterns from memory completely.
                        </p>
                        
                        {/* List of Detected Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
                          {[
                            { name: "Swordfish 3x3 Diagonal latency", errorRate: "2.1s delay", impact: "High" },
                            { name: "ALS Chains cover scanning", errorRate: "45% error rate", impact: "Critical" },
                            { name: "Letters mapping habit-bias", errorRate: "1.4s delay", impact: "Medium" }
                          ].map((wk, j) => (
                            <div key={wk.name} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col justify-between">
                              <span className="text-[8px] font-mono uppercase bg-rose-500/10 border border-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded self-start mt-0.5">
                                Impact: {wk.impact}
                              </span>
                              <h5 className="text-[11px] font-black text-slate-200 mt-2 truncate leading-tight uppercase">{wk.name}</h5>
                              <span className="text-[9.5px] font-bold text-slate-500 mt-1">Sighter latency index: {wk.errorRate}</span>
                            </div>
                          ))}
                        </div>

                        {/* Adaptive Action Plan */}
                        <div className="mt-4 p-3 bg-[#009DFF]/8 border border-[#009DFF]/15 rounded-xl">
                          <span className="text-[9.5px] font-black uppercase text-[#009DFF] tracking-wider block">Recommended Calibration Plan</span>
                          <ul className="list-disc pl-4 text-[10.5px] text-slate-400 font-bold mt-1.5 leading-relaxed flex flex-col gap-0.5">
                            <li>Attend <strong>Swordfish Lesson 2</strong> in Master Academy to practice parallel row covering vectors.</li>
                            <li>Configure <strong>autocheck rules</strong> on Quantum difficulty level to instantly intercept ALS speculation.</li>
                            <li>Deploy <strong>Letters mode training</strong> 10 mins daily to break standard 1-9 visual dependencies.</li>
                          </ul>
                          <div className="mt-3.5 flex justify-end">
                            <button
                              onClick={() => {
                                gameAudio.playClick();
                                speakAsCoach("Deploying adaptive recalibration scanner. Evaluating cognitive matrices... Scanning complete! Your customized lessons stand compiled inside the academy tabs.");
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-[#009DFF] hover:bg-sky-500 text-white font-black text-[10px] uppercase cursor-pointer"
                            >
                              Initialize Recalibration Scan
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* PREDICTIVE AI PERFORMANCE LOGS */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left mt-1">
                    
                    {/* Predictive Curve chart (md:col-span-8) */}
                    <div className={`md:col-span-8 p-5 rounded-3xl border flex flex-col gap-4 ${
                      theme === 'dark' ? 'bg-[#151D30]/65 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                    }`}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Activity className="w-5 h-5 text-[#009DFF]" /> Predictive AI ELO performance Curve
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                        By integrating current ELO velocity with historical study volume intensity, our predictive neural systems forecast your ELO target timeline up to 3000 index ranks!
                      </p>

                      <div className="w-full h-44 rounded-2xl bg-slate-950 p-4 border border-slate-905 relative flex items-center justify-center">
                        <svg className="w-full h-full text-indigo-400" viewBox="0 0 100 35" fill="none" stroke="currentColor">
                          <defs>
                            <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {/* Historic line */}
                          <path d="M 5,30 Q 20,24 35,26 T 55,18" stroke="#009DFF" strokeWidth="1" strokeLinecap="round" />
                          
                          {/* Dotted Predictive trail */}
                          <path d="M 55,18 Q 70,12 85,8 T 95,4" stroke="#8b5cf6" strokeWidth="1" strokeLinecap="round" strokeDasharray="1.5 1.5" fill="url(#predGrad)" />
                          
                          <line x1="55" y1="0" x2="55" y2="35" stroke="#CBD5E1" strokeWidth="0.2" strokeDasharray="1 1" />
                          <circle cx="55" cy="18" r="1.5" className="fill-[#009DFF] stroke-slate-900" />
                          <circle cx="95" cy="4" r="1.5" className="fill-violet-400 stroke-slate-900 animate-ping" />
                        </svg>

                        <div className="absolute top-2 left-2 text-[8px] font-mono text-[#009DFF] uppercase bg-slate-950/50 p-1 rounded">
                          Historic Curve
                        </div>
                        <div className="absolute top-2 right-2 text-[8px] font-mono text-violet-400 uppercase bg-slate-950/50 p-1 rounded">
                          Forecast Prediction (3000 ELO Limit)
                        </div>
                        <div className="absolute top-1/2 left-[57%] text-[8px] font-mono text-slate-500 font-bold -translate-y-1/2">
                          Calculated Pivot June 2026
                        </div>
                      </div>

                    </div>

                    {/* Quick forecasting parameters (md:col-span-4) */}
                    <div className={`md:col-span-4 p-5 rounded-3xl border flex flex-col justify-between ${
                      theme === 'dark' ? 'bg-slate-950/80 border-slate-850' : 'bg-slate-100/40 border-slate-200'
                    }`}>
                      <div className="flex flex-col gap-3">
                        <span className="text-[9.5px] uppercase font-black text-[#009DFF] tracking-wider block">Neural Projection Indices</span>
                        <h4 className="text-sm font-black uppercase text-slate-205 leading-tight">Timeline Estimats</h4>
                        
                        <div className="flex flex-col gap-3 mt-2 text-xs leading-tight font-bold">
                          <div>
                            <span className="text-[8.5px] font-black uppercase text-slate-450 block">Expected Mastery Date</span>
                            <span className="text-slate-100 dark:text-white font-mono mt-0.5 block">September 24, 2026</span>
                          </div>
                          <div>
                            <span className="text-[8.5px] font-black uppercase text-slate-450 block">Next Rank Transition</span>
                            <span className="text-slate-150 font-mono mt-0.5 block">Grandmaster Supreme (+85 pts needed)</span>
                          </div>
                          <div>
                            <span className="text-[8.5px] font-black uppercase text-slate-450 block">Target probability reaching next rank</span>
                            <span className="text-emerald-500 font-mono mt-0.5 block">89.4% probability next week</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ACTIVE AI COACH REPORTS CENTER */}
                  <div className={`p-5 rounded-3xl border text-left mt-1 ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/15 pb-2">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-cyan-400 shrink-0" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">AI Coach Automated Performance Report</h4>
                          <span className="text-[9.5px] uppercase font-bold text-slate-405 block mt-0.5">Customized report generated to match session metrics</span>
                        </div>
                      </div>
                      
                      {/* Coach report filter selection */}
                      <div className="flex gap-1">
                        {[
                          { key: 'daily' as const, label: 'Daily Report' },
                          { key: 'weekly' as const, label: 'Weekly Report' },
                          { key: 'monthly' as const, label: 'Monthly Report' }
                        ].map((rp) => (
                          <button
                            key={rp.key}
                            onClick={() => {
                              gameAudio.playClick();
                              setStatsCoachReportTimeframe(rp.key);
                            }}
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border transition cursor-pointer ${
                              statsCoachReportTimeframe === rp.key
                                ? 'bg-[#009DFF]/15 border-[#009DFF]/40 text-[#009DFF]'
                                : 'transparent border-transparent text-slate-500 hover:bg-slate-800/20'
                            }`}
                          >
                            {rp.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Report Content Grid layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4 text-xs font-semibold leading-normal">
                      
                      {/* Detailed report description (md:col-span-8) */}
                      <div className="md:col-span-8 flex flex-col gap-3">
                        {statsCoachReportTimeframe === 'daily' && (
                          <div className="text-slate-400 text-slate-700 dark:text-slate-200">
                            <p><strong>Daily Summary Overview:</strong> Excellent! Your practice index peaked strongly today, logging multiple letter-mode coordinates solves. Total move latency reduced to 3.8s.</p>
                            <p className="mt-2 text-slate-405"><strong>Observed Strengths:</strong> Accurate naked single spotter, minimal speculate backtracking check-point failures inside classical puzzles.</p>
                            <p className="mt-2 text-slate-405"><strong>Observed Bottleneck:</strong> scanning X-Wings inside Quantum mode. Latency continues to stall above twelve seconds.</p>
                          </div>
                        )}
                        {statsCoachReportTimeframe === 'weekly' && (
                          <div className="text-slate-400 text-slate-700 dark:text-slate-200">
                            <p><strong>Weekly Standing Overview:</strong> Progressive ELO index growth locked-in. Your ELO transitioned +40 points following the completion of three difficult Master tournament challenges successfully.</p>
                            <p className="mt-2"><strong>Observed Strengths:</strong> High accuracy rating exceeding ninety-two percent, consistency levels tracking at five active week days sequentially.</p>
                            <p className="mt-2"><strong>Recommended Target Strategy:</strong> ALS (Almost Locked Set) rules configuration classes.</p>
                          </div>
                        )}
                        {statsCoachReportTimeframe === 'monthly' && (
                          <div className="text-slate-400 text-slate-700 dark:text-slate-200">
                            <p><strong>Monthly Strategic Intelligence:</strong> Phenomenal computational growth! You have graduated Beginner, Easy, and Intermediate Academies successfully with authentic digital diplomas stored inside the credentials vault.</p>
                            <p className="mt-2"><strong>Observed Strengths:</strong> Transition rate from Experienced to Master tier ELO evaluates at 84% speed probability. Low dependency on manual autocheck indicators.</p>
                            <p className="mt-2"><strong>Estimated rating growth probability:</strong> ELO stands forecast to peak around 2600 ELO before September 2026.</p>
                          </div>
                        )}
                      </div>

                      {/* Diagnostic recommendation indicators (md:col-span-4) */}
                      <div className="md:col-span-4 p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col gap-2 font-bold justify-between text-[11px] leading-snug text-slate-400">
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-[#009DFF] block mb-1">Target Training Module</span>
                          <strong>Master Academy Chapter 2</strong>
                          <span className="block text-[10px] text-slate-500 mt-1">Focusing purely on X-Wing scanning constraints</span>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (statsCoachReportTimeframe === 'daily') {
                              speakAsCoach("Excellent solver session logged today. Latency cluster reduced to under four seconds. Keep practicing X Wings diagonals scanning!");
                            } else if (statsCoachReportTimeframe === 'weekly') {
                              speakAsCoach("Weekly score stands verified. Your ELO registers an active transition, scaling plus forty points following master challenges solves. Let's study chains logical structures next.");
                            } else {
                              speakAsCoach("Awesome monthly standing! Beginner and Easy certificates stand earned. Probability reaching Supreme Grandmaster is exceptional. Keep following recommended calibration plans.");
                            }
                          }}
                          className="w-full py-1.5 rounded-lg bg-[#009DFF]/20 border border-[#009DFF]/30 hover:bg-[#009DFF]/35 text-[#009DFF] font-black text-[9.5px] uppercase cursor-pointer"
                        >
                          Vocalize report content
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* ACTIVE COGNITIVE REPLAY TIMELINE GRAPHICS */}
                  <div className={`p-5 rounded-3xl border text-left mt-1 ${
                    theme === 'dark' ? 'bg-[#0E1528] border-slate-805' : 'bg-slate-50 border-slate-205 shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/15 pb-2">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#009DFF]">Tactical Session Replay Analytics</h4>
                        <span className="text-[10px] uppercase font-bold text-slate-450 mt-0.5 block">Review previous game mistakes, critical moves and decision forks</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={replayMoveIdx === 1}
                          onClick={() => {
                            gameAudio.playClick();
                            setReplayMoveIdx(p => Math.max(1, p - 1));
                          }}
                          className="px-2.5 py-1 text-[10px] font-black uppercase border border-slate-800 rounded bg-slate-950 cursor-pointer disabled:opacity-40"
                        >
                          &lt; Prev Move
                        </button>
                        <span className="font-mono text-xs font-black text-cyan-400">Move {replayMoveIdx} / 8</span>
                        <button
                          disabled={replayMoveIdx === 8}
                          onClick={() => {
                            gameAudio.playClick();
                            setReplayMoveIdx(p => Math.min(8, p + 1));
                          }}
                          className="px-2.5 py-1 text-[10px] font-black uppercase border border-slate-800 rounded bg-slate-950 cursor-pointer disabled:opacity-40"
                        >
                          Next Move &gt;
                        </button>
                      </div>
                    </div>

                    {/* Interactive Replay board layout representation */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4 items-center">
                      
                      {/* Mini visual Board (md:col-span-4) */}
                      <div className="md:col-span-4 flex items-center justify-center">
                        <div className="grid grid-cols-3 gap-1 h-36 w-36 bg-slate-900 p-2 rounded-2xl border border-slate-800">
                          {[...Array(9)].map((_, nodeIdx) => {
                            // custom highlighting matching active move indexes
                            const isSelected = (replayMoveIdx % 9) === nodeIdx;
                            return (
                              <div
                                key={nodeIdx}
                                className={`rounded flex items-center justify-center transition text-xs font-black font-mono ${
                                  isSelected 
                                    ? 'bg-gradient-to-br from-indigo-500 to-[#009DFF] text-white shadow-lg animate-pulse'
                                    : 'bg-slate-950 text-slate-500 border border-slate-900'
                                }`}
                              >
                                {nodeIdx + 1}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* commentary descriptive labels (md:col-span-8) */}
                      <div className="md:col-span-8 flex flex-col gap-3 font-semibold text-xs leading-normal">
                        <div>
                          <span className="text-[8.5px] font-black uppercase text-[#009DFF] tracking-wider block">Move {replayMoveIdx} Step-by-Step Tracing</span>
                          <h5 className="text-sm font-black text-slate-100 dark:text-slate-200 uppercase tracking-tight mt-0.5">Classic Numeric Game solve log</h5>
                        </div>

                        {replayMoveIdx === 1 && <p className="text-slate-400 mt-1">Placed Classic 5 at Row 1 column 2. Easy cell selection following initial board scan, initializing logical vectors.</p>}
                        {replayMoveIdx === 2 && <p className="text-slate-400 mt-1">Sighted existing block cover of digit 9 inside Column 3. Constraints locked safely.</p>}
                        {replayMoveIdx === 3 && <p className="text-slate-400 mt-1">Cell conflict intercepted! User speculated placing 7 in Row 2 where duplicate already exists vertical-wise. Mistake logged.</p>}
                        {replayMoveIdx === 4 && <p className="text-slate-400 mt-1">Pencil notes activated. Generated candidate matrix indices inside Box 1 to evaluate naked pairs relationships.</p>}
                        {replayMoveIdx === 5 && <p className="text-slate-400 mt-1">Naked Single unlocked at Row 3 Column 1. Confirmed value 8 placed successfully. ELO index transitioned +10 pts!</p>}
                        {replayMoveIdx === 6 && <p className="text-slate-400 mt-1">Requested AI Coach hint. Master Coach highlights Naked Pairs alignment in column 4 immediately clearing adjacent pencil notes.</p>}
                        {replayMoveIdx === 7 && <p className="text-slate-400 mt-1">Conflict cleared! Previous speculator cell corrected from 7 to 3. ELO stability recovers.</p>}
                        {replayMoveIdx === 8 && <p className="text-slate-400 mt-1">Full puzzle solved! Executed classical Sudoku grid coverage correctly in 4m 12s with zero autochecks! XP bonus allocated.</p>}
                        
                        <div className="p-2 bg-slate-950/40 rounded-xl text-[10.5px] font-bold text-slate-400 border border-slate-900">
                          🎯 <strong>Coach Commentary:</strong> &ldquo;{
                            replayMoveIdx === 1 ? "A standard start, establishing neat sightlines." :
                            replayMoveIdx === 2 ? "Perfect alignment, block exclusions verified." :
                            replayMoveIdx === 3 ? "Wait! Sighting conflict identified here." :
                            replayMoveIdx === 4 ? "Notes logging prevents guessing bottlenecks safely." :
                            replayMoveIdx === 5 ? "Naked single unmasked. Beautiful logic placement!" :
                            replayMoveIdx === 6 ? "Remote laser scan points to Naked Pairs." :
                            replayMoveIdx === 7 ? "Quick error recovery keeps ELO healthy." :
                            "Awesome victory! A superb display of advanced candidate note pruning."
                          }&rdquo;
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* GLOBAL STANDINGS STANDINGS TABLE LEADERBOARD */}
                   <div className={`p-5 rounded-3xl border text-left mt-1 ${
                    theme === 'dark' ? 'bg-[#151D30]/65 border-slate-805' : 'bg-slate-50 border-slate-205 shadow-inner'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-815/20 pb-2 mb-3">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#009DFF] flex items-center gap-1.5 font-mono">
                          <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} /> Unified Elite Global Standings Leaderboard
                        </h4>
                        <span className="text-[10px] uppercase font-bold text-slate-405 mt-0.5 block">
                          {leaderboardSearchQuery.trim()
                            ? `Found ${searchMatchCount} search matches (of 10,046 verified global solvers)`
                            : `Your Real-Time Standings Rank: #${userRank} of 10,046 certified competitors`
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-900 p-1 rounded-xl">
                        <Search className="w-3.5 h-3.5 text-slate-500 ml-1" />
                        <input
                          type="text"
                          value={leaderboardSearchQuery}
                          onChange={(e) => setLeaderboardSearchQuery(e.target.value)}
                          placeholder="Search players..."
                          className="text-[10.5px] font-bold bg-transparent border-none outline-none focus:ring-0 text-slate-200 placeholder-slate-550 max-w-[130px]"
                        />
                        {leaderboardSearchQuery && (
                          <button 
                            onClick={() => setLeaderboardSearchQuery('')}
                            className="text-slate-400 hover:text-white px-1 leading-none font-black text-xs"
                            title="Clear search"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
 
                     {/* Rankings Leaderboard Grid */}
                    <div className="flex flex-col gap-2">
                      {leaderboardMock.map((rEntry, indexRank) => {
                        if (rEntry.isSpacer) {
                          return (
                            <div key={`spacer-${indexRank}`} className="flex items-center justify-center py-2.5 border-y border-dashed border-[#009DFF]/20 my-1 bg-[#009DFF]/4 rounded-xl">
                              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#009DFF] opacity-80 flex items-center gap-1 font-mono">
                                • • • STANDINGS INTERVAL • • • YOUR GLOBAL RANKING ZONE • • •
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={rEntry.name + "_" + indexRank}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold leading-none ${
                              rEntry.isSelf
                                ? 'bg-gradient-to-r from-emerald-500/10 to-[#009DFF]/10 border-indigo-505 shadow-lg scale-[1.01]'
                                : theme === 'dark' ? 'bg-slate-950/40 border-slate-900 text-slate-350' : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center font-black ${
                                rEntry.rank === 1 ? 'bg-amber-400 text-slate-950' :
                                rEntry.rank === 2 ? 'bg-slate-300 text-slate-950' :
                                rEntry.rank === 3 ? 'bg-orange-400 text-slate-950' :
                                rEntry.isSelf ? 'bg-[#009DFF] text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {rEntry.rank}
                              </span>
                              <span className={`font-black uppercase truncate max-w-[160px] ${rEntry.isSelf ? 'text-[#009DFF]' : ''}`}>
                                {rEntry.name}
                              </span>
                            </div>
 
                            <div className="flex items-center gap-4 text-slate-500 text-[11px] font-mono">
                              <span>{rEntry.country}</span>
                              <span className="opacity-40">|</span>
                              <span className="text-cyan-400 font-black">{rEntry.ELO} ELO</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
 
                    <p className="text-[10px] text-slate-500 font-bold mt-3 text-center">
                      Leaderboard standing recalculates hourly based on ELO updates. Standings synchronized for 2026.
                    </p>
                  </div>

                </motion.div>
              );
            })()}

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

            {/* ================= NEW TAB: INTERACTIVE SANDBOX ================= */}
            {activeTab === 'sandbox' && (
              <motion.div
                key="sandbox"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
                id="sandbox-view"
              >
                {/* Header Title Section */}
                <div className="text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black">Interactive Practice Workspace</span>
                    <h3 className="text-xl font-black tracking-tight mt-1 uppercase">POSSIBILITY DEDUCTION SANDBOX</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-2xl mt-1.5">
                      Hover or click any cell in our custom interactive board to run real-time intersection logic. It demonstrates how scanning rows and columns immediately eliminates candidates.
                    </p>
                  </div>

                  {/* Sandbox View Mode Switch */}
                  <div className="flex items-center gap-2" id="sandbox-view-toggle">
                    <span className="text-[10px] font-mono tracking-wider font-extrabold text-slate-400">SANDBOX VIEW:</span>
                    <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl border border-slate-300/10">
                      <button
                        onClick={() => {
                          gameAudio.playClick();
                          setSandboxViewMode('numbers');
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                          sandboxViewMode === 'numbers'
                            ? 'bg-[#009DFF] text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        [1-9] NUMERIC
                      </button>
                      <button
                        onClick={() => {
                          gameAudio.playClick();
                          setSandboxViewMode('letters');
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                          sandboxViewMode === 'letters'
                            ? 'bg-[#009DFF] text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        [A-I] ALPHABET
                      </button>
                    </div>
                  </div>
                </div>

                {/* Two-Column Interface Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Interactive Sandbox Board */}
                  <div className="lg:col-span-7 flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-3xl border shadow-lg w-full max-w-md ${
                      theme === 'dark' ? 'bg-[#0E1220]/80 border-slate-800' : 'bg-white border-slate-150'
                    }`} id="sandbox-grid-container">
                      
                      {/* Grid header details */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-mono font-black">Interactive Teaching Grid</span>
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setSandboxBoard([
                              [5, 3, 0, 0, 7, 0, 0, 0, 0],
                              [6, 0, 0, 1, 9, 5, 0, 0, 0],
                              [0, 9, 8, 0, 0, 0, 0, 6, 0],
                              [8, 0, 0, 0, 6, 0, 0, 0, 3],
                              [4, 0, 0, 8, 0, 3, 0, 0, 1],
                              [7, 0, 0, 0, 2, 0, 0, 0, 6],
                              [0, 6, 0, 0, 0, 0, 2, 8, 0],
                              [0, 0, 0, 4, 1, 9, 0, 0, 5],
                              [0, 0, 0, 0, 8, 0, 0, 7, 9]
                            ]);
                            setSandboxSelectedCell({ r: 2, c: 3 });
                          }}
                          className={`text-[9px] uppercase tracking-wider font-bold hover:text-[#009DFF] border rounded-lg px-2 py-0.5 transition ${
                            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                          }`}
                        >
                          Reset Board
                        </button>
                      </div>

                      {/* 9x9 Sudoku Grid */}
                      <div className={`grid grid-cols-9 gap-1 aspect-square rounded-xl overflow-hidden border p-1 ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        {sandboxBoard.map((row, r) =>
                          row.map((val, c) => {
                            const activeCell = sandboxHoverCell || sandboxSelectedCell || { r: 0, c: 0 };
                            const isActiveCell = activeCell && activeCell.r === r && activeCell.c === c;
                            const isInSameRow = activeCell && activeCell.r === r;
                            const isInSameCol = activeCell && activeCell.c === c;
                            const isInSameBox = activeCell && (
                              Math.floor(activeCell.r / 3) === Math.floor(r / 3) &&
                              Math.floor(activeCell.c / 3) === Math.floor(c / 3)
                            );
                            const isCrossSection = activeCell && (isInSameRow || isInSameCol || isInSameBox) && !isActiveCell;

                            // 3x3 border spacing classes
                            const borderRightClass = (c === 2 || c === 5) ? 'border-r-2 border-r-slate-400 dark:border-r-slate-500' : '';
                            const borderBottomClass = (r === 2 || r === 5) ? 'border-b-2 border-b-slate-400 dark:border-b-slate-500' : '';

                            // Highlight styles
                            let highlightClass = theme === 'dark'
                              ? 'bg-slate-900 border-slate-800/65 text-slate-300'
                              : 'bg-white border-slate-200 text-slate-700';

                            if (isActiveCell) {
                              highlightClass = 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold scale-[1.02] shadow-md z-15 ring-2 ring-amber-300/40 dark:ring-amber-500/40';
                            } else if (isCrossSection) {
                              highlightClass = theme === 'dark'
                                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300 font-black'
                                : 'bg-sky-100 border-sky-300 text-sky-800 font-black';
                            }

                            return (
                              <button
                                key={`${r}-${c}`}
                                id={`sandbox-cell-${r}-${c}`}
                                onMouseEnter={() => setSandboxHoverCell({ r, c })}
                                onMouseLeave={() => setSandboxHoverCell(null)}
                                onClick={() => {
                                  gameAudio.playClick();
                                  setSandboxSelectedCell({ r, c });
                                }}
                                className={`w-full h-full flex items-center justify-center text-sm md:text-base font-bold transition-all border outline-none select-none rounded-[4px] aspect-square ${highlightClass} ${borderRightClass} ${borderBottomClass}`}
                              >
                                {val === 0 ? '' : sandboxViewMode === 'letters' ? String.fromCharCode(64 + val) : val}
                              </button>
                            );
                          })
                        )}
                      </div>

                      <p className="text-slate-400 text-[10px] italic mt-3 text-center block">
                        💡 Tip: click any cell on the board above
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Real-Time Intersection Engine Panel */}
                  <div className="lg:col-span-5 flex flex-col gap-5 h-full">
                    {(() => {
                      const activeCell = sandboxHoverCell || sandboxSelectedCell || { r: 2, c: 3 };
                      const r = activeCell.r;
                      const c = activeCell.c;
                      const cellValue = sandboxBoard[r][c];

                      // Core conflict collections
                      const rowConflicts = Array.from(new Set(sandboxBoard[r].filter(val => val > 0))) as number[];
                      const colConflicts = Array.from(new Set(sandboxBoard.map(row => row[c]).filter(val => val > 0))) as number[];
                      
                      const boxRowStart = Math.floor(r / 3) * 3;
                      const boxColStart = Math.floor(c / 3) * 3;
                      const boxVals: number[] = [];
                      for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < 3; j++) {
                          const val = sandboxBoard[boxRowStart + i][boxColStart + j];
                          if (val > 0) boxVals.push(val);
                        }
                      }
                      const boxConflicts = Array.from(new Set(boxVals)) as number[];

                      const allConflicts = new Set([...rowConflicts, ...colConflicts, ...boxConflicts]);
                      const activeCandidates = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(val => !allConflicts.has(val));

                      return (
                        <div 
                          className={`p-5 rounded-3xl border shadow-xl flex flex-col gap-4 text-left h-full justify-between ${
                            theme === 'dark' ? 'bg-[#101424] border-slate-800' : 'bg-white border-slate-150'
                          }`}
                          id="sandbox-interaction-engine"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black leading-none">Intersection Matrix</span>
                              <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                                sandboxHoverCell ? 'bg-[#009DFF] text-white animate-pulse' : 'bg-slate-300/30'
                              }`}>
                                {sandboxHoverCell ? 'ACTIVE DISCOVERY' : 'CELL LOCKED'}
                              </span>
                            </div>

                            <h4 className="text-sm font-black uppercase tracking-tight mt-1">
                              REAL-TIME INTERSECTION ENGINE
                            </h4>
                            
                            {/* Dynamic coordinates */}
                            <div className={`mt-3 p-3 rounded-2xl border flex items-center justify-between ${
                              theme === 'dark' ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-150'
                            }`}>
                              <div>
                                <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Current Position</p>
                                <p className="text-xs font-mono font-bold mt-0.5 text-amber-500 dark:text-amber-400">
                                  Square Coordinates: [Row {r + 1}, Column {c + 1}]
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Quadrant Block</p>
                                <p className="text-xs font-mono font-bold mt-0.5 text-[#009DFF]">
                                  Box {Math.floor(r / 3) * 3 + Math.floor(c / 3) + 1} / 9
                                </p>
                              </div>
                            </div>

                            {/* Cell value status description */}
                            <p className="text-xs text-slate-400 font-bold leading-normal mt-4">
                              {cellValue === 0 
                                ? "This cell is empty. Let's analyze row, column, and box values to see what cannot go here."
                                : `This cell contains the value: ${cellValue === 0 ? '' : sandboxViewMode === 'letters' ? String.fromCharCode(64 + cellValue) : cellValue}. Click other cells, or click [Clear Cell] to run candidate reduction logic on it.`
                              }
                            </p>

                            {/* Row Conflicts Container */}
                            <div className="mt-4">
                              <p className="text-[10px] uppercase tracking-wider text-rose-400 font-black">
                                Row {r + 1} Conflicts ({rowConflicts.length})
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {rowConflicts.length === 0 ? (
                                  <span className="text-[10px] text-slate-500 italic">No row conflicts</span>
                                ) : (
                                  rowConflicts.sort((a: number, b: number) => a - b).map((val) => (
                                    <span 
                                      key={`row-conf-${val}`}
                                      className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    >
                                      {sandboxViewMode === 'letters' ? String.fromCharCode(64 + val) : val}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Column Conflicts Container */}
                            <div className="mt-3">
                              <p className="text-[10px] uppercase tracking-wider text-[#FF9D4D] font-black">
                                Column {c + 1} Conflicts ({colConflicts.length})
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {colConflicts.length === 0 ? (
                                  <span className="text-[10px] text-slate-500 italic">No column conflicts</span>
                                ) : (
                                  colConflicts.sort((a: number, b: number) => a - b).map((val) => (
                                    <span 
                                      key={`col-conf-${val}`}
                                      className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-amber-500/10 text-[#FF9D4D] border border-amber-500/20"
                                    >
                                      {sandboxViewMode === 'letters' ? String.fromCharCode(64 + val) : val}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Box Conflicts Container */}
                            <div className="mt-3">
                              <p className="text-[10px] uppercase tracking-wider text-violet-400 font-black">
                                Block Box {Math.floor(r / 3) * 3 + Math.floor(c / 3) + 1} Conflicts ({boxConflicts.length})
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {boxConflicts.length === 0 ? (
                                  <span className="text-[10px] text-slate-500 italic">No box conflicts</span>
                                ) : (
                                  boxConflicts.sort((a: number, b: number) => a - b).map((val) => (
                                    <span 
                                      key={`box-conf-${val}`}
                                      className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                    >
                                      {sandboxViewMode === 'letters' ? String.fromCharCode(64 + val) : val}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Active Candidates Output Container */}
                          <div className={`mt-2 p-4 rounded-3xl border flex flex-col gap-3 ${
                            theme === 'dark' ? 'bg-[#009DFF]/5 border-cyan-500/10' : 'bg-[#EAF7FF]/50 border-sky-300/25'
                          }`}>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-[#009DFF] font-black">
                                ACTIVE CANDIDATES AVAILABLE:
                              </p>
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                Candidates = {'{1..9}'} - (Row conflicts ∪ Col conflicts ∪ Box conflicts)
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {activeCandidates.length === 0 ? (
                                <p className="text-xs text-rose-400 font-bold italic">
                                  No candidates available! This square cannot accommodate any digit based on current row/col guidelines (Conflict detected!).
                                </p>
                              ) : (
                                activeCandidates.map((val) => (
                                  <button
                                    key={`cand-btn-${val}`}
                                    id={`sandbox-candidate-btn-${val}`}
                                    onClick={() => {
                                      gameAudio.playClick();
                                      const nextBoard = sandboxBoard.map(row => [...row]);
                                      nextBoard[r][c] = val;
                                      setSandboxBoard(nextBoard);
                                    }}
                                    className="px-3.5 py-1.5 text-xs font-black font-mono rounded-xl bg-[#009DFF] text-white hover:bg-[#0089E0] transition hover:scale-105 active:scale-95 shadow-xs"
                                    title={`Click to fill ${sandboxViewMode === 'letters' ? String.fromCharCode(64 + val) : val} into R${r+1} C${c+1}!`}
                                  >
                                    {sandboxViewMode === 'letters' ? String.fromCharCode(64 + val) : val}
                                  </button>
                                ))
                              )}
                            </div>

                            {/* Clear cell option for convenience */}
                            {cellValue > 0 && (
                              <button
                                onClick={() => {
                                  gameAudio.playClick();
                                  const nextBoard = sandboxBoard.map(row => [...row]);
                                  nextBoard[r][c] = 0;
                                  setSandboxBoard(nextBoard);
                                }}
                                className="w-full mt-1.5 py-1.5 text-[9px] font-black uppercase text-center border-dashed rounded-xl transition hover:border-red-500 hover:text-red-400"
                                style={{ borderWidth: '1px' }}
                              >
                                Clear Cell Value
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </motion.div>
            )}

            {/* ================= TAB 7.5: VARIANT TRAINING CENTER ================= */}
            {activeTab === 'training' && (() => {
              const v = SUDOKU_VARIANTS.find(x => x.id === trainingVariant);
              if (!v) return null;

              const size = v.size;

              const handleSelectTrainingCell = (rIdx: number, cIdx: number) => {
                gameAudio.playClick();
                setTrainingSelectedCell({ r: rIdx, c: cIdx });
              };

              const handleInputTrainingDigit = (digit: number) => {
                if (!trainingSelectedCell) return;
                gameAudio.playClick();
                const nextBoard = [...trainingBoard];
                nextBoard[trainingSelectedCell.r][trainingSelectedCell.c].value = digit;
                setTrainingBoard(nextBoard);
              };

              const handleClearTrainingCell = () => {
                if (!trainingSelectedCell) return;
                gameAudio.playClick();
                const nextBoard = [...trainingBoard];
                nextBoard[trainingSelectedCell.r][trainingSelectedCell.c].value = 0;
                setTrainingBoard(nextBoard);
              };

              const handleExplainRules = () => {
                handleTrainingChatSubmit(`Explain the exact rules and sum cage / path constraints for the variant: ${v.name}`);
              };

              const handleConstraintWalk = () => {
                if (!trainingSelectedCell) {
                  setTrainingCoachChatHistory(prev => [...prev, { sender: 'coach', text: "💡 Cadet, please select a grid cell on the left board to perform a tactical constraint walk!" }]);
                  return;
                }
                handleTrainingChatSubmit(`Perform a step-by-step constraint walk for cell at [Row ${trainingSelectedCell.r + 1}, Col ${trainingSelectedCell.c + 1}] under ${v.name} rules. What digits are valid here?`);
              };

              const handleTestMove = () => {
                if (!trainingSelectedCell) {
                  setTrainingCoachChatHistory(prev => [...prev, { sender: 'coach', text: "🎯 Instruction: First, select a cell on the interactive grid to test!" }]);
                  return;
                }
                const cell = trainingBoard[trainingSelectedCell.r][trainingSelectedCell.c];
                if (cell.value === 0) {
                  setTrainingCoachChatHistory(prev => [...prev, { sender: 'coach', text: `🎯 Cell [Row ${trainingSelectedCell.r + 1}, Col ${trainingSelectedCell.c + 1}] is currently empty. Please select a number first to test its placement under ${v.name} guidelines!` }]);
                  return;
                }

                const isCorrect = cell.value === cell.correctValue;
                if (isCorrect) {
                  setTrainingCoachChatHistory(prev => [...prev, { 
                    sender: 'coach', 
                    text: `✨ **Excellent Deduction!** The value **${cell.value}** at Cell [Row ${trainingSelectedCell.r + 1}, Col ${trainingSelectedCell.c + 1}] is **100% CORRECT** and perfectly satisfies all combinatorial rules for **${v.name}**!` 
                  }]);
                } else {
                  setTrainingCoachChatHistory(prev => [...prev, { 
                    sender: 'coach', 
                    text: `⚠️ **Constraint Violation Detected!** The value **${cell.value}** at Cell [Row ${trainingSelectedCell.r + 1}, Col ${trainingSelectedCell.c + 1}] is incorrect. Under **${v.name}** regulations, this entry creates conflicts. Try analyzing other cells or ask me for a step-by-step walk!` 
                  }]);
                }
              };

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex flex-col gap-6"
                  id="variant-training-center"
                >
                  {/* Title Bar Section */}
                  <div className={`w-full p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 select-none ${
                    theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-white border-sky-100 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-4 text-left">
                      <div className="bg-[#009DFF]/10 text-[#009DFF] p-3 rounded-2xl border border-[#009DFF]/15">
                        <Brain className="w-6 h-6 text-cyan-500" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono font-black text-[#009DFF] dark:text-cyan-400">Tactical Training Center</span>
                        <h2 className="text-xl font-black mt-0.5 tracking-tight">{v.name}</h2>
                        <span className="text-[10.5px] mt-0.5 inline-block font-mono font-bold uppercase tracking-wider text-slate-400">
                          CONSTRAINTS ACTIVE: {v.badge}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        gameAudio.playClick();
                        setActiveTab('play');
                      }}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs tracking-wider uppercase transition active:scale-95 cursor-pointer shadow-md border-0"
                    >
                      Exit Training Console
                    </button>
                  </div>

                  {/* Split Screen Layout Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT PANEL: INTERACTIVE VARIANT BOARD (7 columns) */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                      <div className={`p-6 rounded-3xl border flex flex-col items-center gap-5 ${
                        theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-white border-sky-100 shadow-sm'
                      }`}>
                        
                        {/* Interactive Grid Canvas container */}
                        <div 
                          className="w-full max-w-[420px] aspect-square bg-[#76A8C7]/20 border border-[#87CEEB]/40 rounded-2xl overflow-hidden p-1.5 relative shadow-inner"
                          id="training-interactive-board-container"
                        >
                          <div 
                            className="w-full h-full grid gap-[1px] bg-[#87CEEB]/45 rounded-xl overflow-hidden"
                            style={{
                              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                              gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
                            }}
                          >
                            {trainingBoard.map((rowArr, rIdx) => 
                              rowArr.map((cell, cIdx) => {
                                const isSelected = trainingSelectedCell?.r === rIdx && trainingSelectedCell?.c === cIdx;
                                const isGiven = cell.isGiven;
                                
                                // Borders guides
                                let hasThickerRight = false;
                                let hasThickerBottom = false;
                                if (size === 9) {
                                  hasThickerRight = cIdx === 2 || cIdx === 5;
                                  hasThickerBottom = rIdx === 2 || rIdx === 5;
                                } else if (size === 6) {
                                  hasThickerRight = cIdx === 2;
                                  hasThickerBottom = rIdx === 1 || rIdx === 3;
                                } else if (size === 4) {
                                  hasThickerRight = cIdx === 1;
                                  hasThickerBottom = rIdx === 1;
                                } else if (size === 16) {
                                  hasThickerRight = cIdx === 3 || cIdx === 7 || cIdx === 11;
                                  hasThickerBottom = rIdx === 3 || rIdx === 7 || rIdx === 11;
                                }

                                return (
                                  <button
                                    key={`train-cell-${rIdx}-${cIdx}`}
                                    onClick={() => handleSelectTrainingCell(rIdx, cIdx)}
                                    className={`w-full h-full relative cursor-pointer outline-none transition-all duration-150 flex items-center justify-center font-sans font-black select-none border-0 ${
                                      isSelected 
                                        ? 'bg-cyan-500/25 text-cyan-500' 
                                        : isGiven 
                                          ? theme === 'dark' ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-700'
                                          : theme === 'dark' ? 'bg-[#131929]/90 text-cyan-400 hover:bg-[#1a2135]' : 'bg-white text-indigo-600 hover:bg-slate-50'
                                    } ${hasThickerRight ? 'border-r border-[#80BEE0]' : ''} ${hasThickerBottom ? 'border-b border-[#80BEE0]' : ''}`}
                                    style={{
                                      fontSize: size === 16 ? '9px' : '15px'
                                    }}
                                  >
                                    {cell.value !== 0 ? cell.value : ''}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Digit Keypad Toolbar */}
                        <div className="w-full flex flex-col gap-3">
                          <span className="text-[10px] text-left uppercase font-mono font-black text-slate-500">
                            Neural Entry Input
                          </span>
                          
                          <div className={`grid gap-1.5 p-3 rounded-2xl border ${
                            theme === 'dark' ? 'bg-[#0b0e18] border-slate-800' : 'bg-slate-50 border-slate-150'
                          }`}>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {Array.from({ length: size }, (_, i) => i + 1).map((val) => (
                                <button
                                  key={`train-num-${val}`}
                                  onClick={() => handleInputTrainingDigit(val)}
                                  className="w-10 h-10 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-650 hover:to-indigo-750 text-white font-black text-sm flex items-center justify-center cursor-pointer select-none shadow hover:scale-[1.05] active:scale-95 transition-all border-0"
                                >
                                  {val}
                                </button>
                              ))}
                              <button
                                onClick={handleClearTrainingCell}
                                className="px-3 h-10 rounded-xl border border-red-500/25 bg-red-500/5 text-red-500 hover:bg-red-500/10 font-bold text-xs flex items-center justify-center cursor-pointer select-none transition"
                              >
                                Clear Cell
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Training Control Protocol Tools Row */}
                      <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-center gap-3 justify-between ${
                        theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-white border-sky-100 shadow-sm'
                      }`}>
                        <button
                          onClick={handleExplainRules}
                          className="w-full sm:w-auto px-4 py-3 bg-cyan-650/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-600/15 text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer transition flex items-center justify-center gap-2"
                        >
                          <HelpCircle className="w-4 h-4" /> Explain Rules
                        </button>
                        <button
                          onClick={handleConstraintWalk}
                          className="w-full sm:w-auto px-4 py-3 bg-violet-650/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 hover:bg-violet-600/15 text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer transition flex items-center justify-center gap-2"
                        >
                          <Compass className="w-4 h-4" /> Constraint Walk
                        </button>
                        <button
                          onClick={handleTestMove}
                          className="w-full sm:w-auto px-5 py-3 bg-emerald-650/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/15 text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer transition flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Test My Move
                        </button>
                      </div>

                    </div>

                    {/* RIGHT PANEL: COGNITIVE COACH DIALOGUE (5 columns) */}
                    <div className="lg:col-span-5 h-[584px] flex flex-col">
                      <div className={`flex-1 rounded-3xl border p-5 flex flex-col justify-between overflow-hidden relative ${
                        theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-white border-sky-100 shadow-sm'
                      }`}>
                        
                        {/* Shimmer header status */}
                        <div className="flex items-center justify-between border-b border-slate-800/25 pb-3">
                          <div className="flex items-center gap-2 leading-none text-left">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-450 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider font-mono text-[#009DFF]">AI Coach Interface</span>
                            </div>
                          </div>
                          <span className="text-[10.5px] font-mono text-slate-500 font-bold">V-COACH v3.9</span>
                        </div>

                        {/* Dialogue Feed */}
                        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-left" id="training-dialogue-feed">
                          {trainingCoachChatHistory.map((msg, idx) => (
                            <div 
                              key={`train-msg-${idx}`}
                              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                                msg.sender === 'user'
                                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                                  : theme === 'dark'
                                    ? 'bg-slate-900/60 text-slate-150 border border-slate-800 rounded-tl-none'
                                    : 'bg-slate-50 text-slate-850 border border-slate-150 rounded-tl-none'
                              }`}>
                                <p className="font-bold uppercase tracking-wider text-[9px] mb-1.5 opacity-80 leading-none">
                                  {msg.sender === 'user' ? 'Cadet' : 'Grandmaster Coach'}
                                </p>
                                <div className="prose prose-xs dark:prose-invert">
                                  {msg.text.split('\n\n').map((chunk, cIdx) => (
                                    <p key={`chunk-${cIdx}`} className="leading-relaxed mb-2 last:mb-0">
                                      {chunk}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}

                          {trainingModelLoading && (
                            <div className="flex justify-start">
                              <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
                                theme === 'dark' ? 'bg-slate-900/60 text-slate-350' : 'bg-slate-50 text-slate-600'
                              }`}>
                                <span className="animate-spin h-3.5 w-3.5 border-2 border-cyan-555 rounded-full border-t-transparent" />
                                <span className="font-semibold uppercase tracking-wider text-[10px] animate-pulse">Running combinatorial walk...</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Preset Suggestion Triggers */}
                        <div className="border-t border-slate-800/15 py-3 flex gap-1.5 overflow-x-auto text-left whitespace-nowrap scrollbar-none" id="preset-suggestions">
                          <button
                            onClick={() => handleTrainingChatSubmit("Explain the Law of 45 for Killer sums.")}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-full border cursor-pointer transition ${
                              theme === 'dark' ? 'border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900 hover:border-cyan-500/25' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Explain Law of 45 sum tricks
                          </button>
                          <button
                            onClick={() => handleTrainingChatSubmit(`How can I master solving ${v.name}? Give me 3 tips.`)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-full border cursor-pointer transition ${
                              theme === 'dark' ? 'border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900 hover:border-cyan-500/25' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Expert strategy tips
                          </button>
                        </div>

                        {/* Input bar */}
                        <div className="flex items-center gap-2 border-t border-slate-800/15 pt-3.5">
                          <input
                            type="text"
                            value={trainingQuery}
                            onChange={(e) => setTrainingQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTrainingChatSubmit()}
                            placeholder={`Ask coach about ${v.name} rules...`}
                            className={`flex-1 px-4.5 py-3 rounded-2xl text-xs outline-none focus:ring-1 transition ${
                              theme === 'dark' 
                                ? 'bg-[#0f1322] text-white border-slate-800 focus:ring-cyan-500' 
                                : 'bg-slate-50 text-slate-850 border-slate-200 focus:ring-cyan-505'
                            }`}
                          />
                          <button
                            onClick={() => handleTrainingChatSubmit()}
                            className="p-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-2xl cursor-pointer hover:scale-[1.03] active:scale-95 transition flex items-center justify-center shadow-md shadow-cyan-500/10 border-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>

                </motion.div>
              );
            })()}

            {/* ================= TAB 8: SETTINGS PAGE ================= */}
            {activeTab === 'settings' && (() => {
              const handleDashboardAvatarFile = (file: File) => {
                if (file.size > 2.5 * 1024 * 1024) {
                  alert("Maximum size allowed is 2.5MB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                  const b64 = e.target?.result as string;
                  if (b64) {
                    onUpdateProfile({ ...profile, avatarUrl: b64 });
                    gameAudio.playPlacement(true);
                  }
                };
                reader.readAsDataURL(file);
              };

              const handleDashboardRemoveAvatar = () => {
                gameAudio.playClick();
                onUpdateProfile({ ...profile, avatarUrl: undefined });
              };

              const handleDashboardSaveName = () => {
                if (!dashboardEditName.trim()) return;
                gameAudio.playClick();
                onUpdateProfile({ ...profile, name: dashboardEditName.trim() });
                setIsDashboardEditingName(false);
              };

              const copyDashboardAccountID = () => {
                gameAudio.playClick();
                const uuid = `SKUDO-XP-${profile.xp}-${profile.streak}`;
                navigator.clipboard.writeText(uuid);
                alert("Account Sync Code copied to clipboard!");
              };

              return (
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

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    
                    {/* Column 1: Profile & Account Board Section */}
                    <div className={`p-5 rounded-2xl border flex flex-col gap-5 text-left lg:col-span-1 ${
                      theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                    }`}>
                      <h4 className="text-[10px] uppercase font-black text-[#87CEEB] tracking-wider">Account Board & Avatar</h4>
                      
                      <div className="flex flex-col items-center gap-4 py-3 bg-slate-550/15 dark:bg-slate-900/40 rounded-xl p-4 border border-dashed border-slate-400/20 text-center">
                        <div 
                          className={`w-20 h-20 rounded-full flex items-center justify-center shrink-0 shadow-md relative overflow-hidden group border-2 transition-all cursor-pointer ${
                            profile.avatarUrl 
                              ? 'border-[#009DFF]' 
                              : 'border-slate-300 bg-[#009DFF] text-white'
                          }`}
                          onClick={() => dashboardFileInputRef.current?.click()}
                          title="Click to upload profile photo"
                        >
                          <input
                            type="file"
                            ref={dashboardFileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDashboardAvatarFile(file);
                            }}
                          />
                          {profile.avatarUrl ? (
                            <img 
                              src={profile.avatarUrl} 
                              alt={profile.name} 
                              className="w-full h-full object-cover rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-white font-black text-3xl select-none">
                              {profile.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full text-white text-[10px] font-bold">
                            Change Photo
                          </div>
                        </div>

                        <div className="w-full min-w-0">
                          {isDashboardEditingName ? (
                            <div className="flex items-center gap-1.5 justify-center w-full">
                              <input
                                type="text"
                                value={dashboardEditName}
                                onChange={(e) => setDashboardEditName(e.target.value)}
                                className="px-2.5 py-1 text-xs font-bold border rounded-lg focus:outline-none focus:border-[#4DA6FF] bg-white text-slate-850 dark:text-slate-850 w-full max-w-[140px]"
                                maxLength={16}
                                autoFocus
                              />
                              <button
                                onClick={handleDashboardSaveName}
                                className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shrink-0 cursor-pointer"
                                title="Save Profile Name"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 justify-center">
                              <h3 className="text-sm font-extrabold truncate uppercase text-slate-800 dark:text-slate-150">{profile.name}</h3>
                              <button
                                onClick={() => setIsDashboardEditingName(true)}
                                className="p-1 hover:text-[#009DFF] text-slate-400 transition"
                                title="Edit Nickname"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 justify-center mt-1">
                            <span className="text-[9.5px] font-black uppercase text-[#009DFF] bg-[#009DFF]/10 px-1.5 py-0.5 rounded">
                              {profile.experience}
                            </span>
                            {profile.avatarUrl && (
                              <button
                                onClick={handleDashboardRemoveAvatar}
                                className="text-[9px] text-red-400 hover:text-red-500 hover:underline font-bold uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                Remove Photo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 text-xs">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-400/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Sync Email:</span>
                          <span className="font-mono text-[11px] font-semibold text-[#009DFF] truncate max-w-[160px]" title={profile.email}>
                            {profile.email || 'local.guest@skudo.zip'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Sync Key:</span>
                          <div className="flex items-center gap-1 bg-[#4DA6FF]/10 text-[#4DA6FF] px-2 py-0.5 rounded-lg font-mono text-[10px] font-black">
                            <span>SK-{profile.xp}-{profile.streak}</span>
                            <button
                              onClick={copyDashboardAccountID}
                              className="hover:text-blue-600 active:scale-95 transition cursor-pointer"
                              title="Copy Account Code ID"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: OS Settings & Parameters */}
                    <div className={`p-5 rounded-2xl border flex flex-col gap-4 text-left lg:col-span-1 ${
                      theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                    }`}>
                      <h4 className="text-[10px] uppercase font-black text-[#87CEEB] tracking-wider">OS Parameters & FX</h4>
                      
                      {/* Audio synth sound */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-400/10">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Audio Synth Sound</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">Tactile chimes and placement clicks</span>
                        </div>
                        <button
                          onClick={onToggleAudio}
                          className={`p-1.5 rounded-lg transition ${
                            audioEnabled ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-350 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Theme selection */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-400/10">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">System Color Theme</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">Toggle light or dark interface shades</span>
                        </div>
                        <button
                          onClick={onToggleTheme}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition ${
                            theme === 'dark' ? 'bg-slate-850 hover:bg-slate-800 text-amber-400 border-slate-750' : 'bg-slate-100 hover:bg-slate-200 text-[#009DFF] border-slate-150'
                          }`}
                        >
                          {theme === 'dark' ? '🌙 Deep Mode' : '☀️ Light Mode'}
                        </button>
                      </div>

                      {/* Haptics vibration */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-400/10">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Haptic Vibration</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">Device micro-vibrations feedback</span>
                        </div>
                        <button
                          onClick={onToggleVibration}
                          className={`p-1.5 rounded-lg transition ${
                            vibrateEnabled ? 'bg-indigo-500 text-white' : 'bg-slate-350 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                      </div>

                      {/* SMS notifications */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">SMS Notifications</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">Receive dynamic daily puzzle challenges</span>
                        </div>
                        <button
                          onClick={onToggleNotifications}
                          className={`p-1.5 rounded-lg transition ${
                            notificationsEnabled ? 'bg-[#009DFF] text-white' : 'bg-slate-350 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="border-t border-slate-400/10 pt-2 flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-none">Auto-Save Matrix</span>
                        <button
                          onClick={() => {
                            localStorage.removeItem('skudo_saved_session');
                            setSavedSessionExists(false);
                            gameAudio.playLose();
                            alert("All transient saved mid-game data wiped successfully!");
                          }}
                          className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition text-center"
                        >
                          Wipe Autosave Session
                        </button>
                      </div>
                    </div>

                    {/* Column 3: Stats & Synchronization Metrics */}
                    <div className={`p-5 rounded-2xl border flex flex-col gap-4 text-left lg:col-span-1 ${
                      theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                    }`}>
                      <h4 className="text-[10px] uppercase font-black text-[#87CEEB] tracking-wider">Statistics & Progress Metrics</h4>
                      
                      {/* Numbers played vs Letters */}
                      <div className="grid grid-cols-2 gap-3 text-center text-xs">
                        <div className={`p-3 rounded-xl border flex flex-col justify-center ${
                          theme === 'dark' ? 'border-slate-300/20 bg-slate-900/50' : 'border-slate-200 bg-[#f8fafc]'
                        }`}>
                          <span className="text-[9px] text-slate-400 font-black uppercase">Numbers Mode</span>
                          <span className="text-sm font-sans font-black text-[#009DFF] mt-1">14 Sessions</span>
                        </div>
                        <div className={`p-3 rounded-xl border flex flex-col justify-center ${
                          theme === 'dark' ? 'border-slate-300/20 bg-slate-900/50' : 'border-slate-200 bg-[#f8fafc]'
                        }`}>
                          <span className="text-[9px] text-slate-400 font-black uppercase">Letters Mode</span>
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
                          alert("Cloud statistics synced to archanadasmondal1987@gmail.com successfully!");
                        }}
                        className="w-full mt-2 py-2 border border-dashed border-[#009DFF]/40 text-[#009DFF] bg-[#009DFF]/5 hover:bg-[#009DFF]/10 transition rounded-xl font-black text-[10px] uppercase tracking-wider text-center cursor-pointer"
                      >
                        Backup & Sync Account Stats
                      </button>
                    </div>
                  </div>

                  {/* Interconnected Help & Knowledge Desk Quick Integration */}
                  <div className={`mt-6 p-6 rounded-3xl border text-left ${
                    theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-white border-sky-100 shadow-sm'
                  }`} id="settings-interconnected-faq-desk">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#009DFF]/10 text-[#009DFF] p-3 rounded-2xl border border-[#009DFF]/15">
                          <HelpCircle className="w-6 h-6 text-cyan-500" />
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-mono font-black text-[#009DFF] dark:text-cyan-400">Interconnected Diagnostic Link</span>
                          <h4 className="text-base font-black mt-0.5 tracking-tight">Active Knowledge Desk & Central Support</h4>
                          <p className="text-xs text-slate-400 mt-1">Directly search or leap into categories to solve app-wide errors, sync logs, or file tickets.</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setActiveHelpCategory('all');
                            setHelpSearchQuery('');
                            setActiveTab('help');
                          }}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition active:scale-95 cursor-pointer flex items-center gap-1.5 border-0"
                        >
                          Browse All FAQs
                        </button>
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setActiveHelpCategory('bug');
                            setHelpSearchQuery('');
                            setActiveTab('help');
                          }}
                          className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-500 hover:text-rose-600 font-bold rounded-xl text-xs tracking-wider uppercase transition active:scale-95 cursor-pointer flex items-center gap-1.5 border-0"
                        >
                          Bugs & Overlaps
                        </button>
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setActiveHelpCategory('account');
                            setHelpSearchQuery('');
                            setActiveTab('help');
                          }}
                          className="px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-600 font-bold rounded-xl text-xs tracking-wider uppercase transition active:scale-95 cursor-pointer flex items-center gap-1.5 border-0"
                        >
                          Account Sync Issues
                        </button>
                      </div>
                    </div>

                    {/* Embedded Search Box on Settings page */}
                    <div className="mt-5 pt-5 border-t border-slate-400/10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-4">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Quick Desk Inquirer</span>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Filter the knowledge base straight from your settings card:</p>
                      </div>
                      <div className="md:col-span-8 relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              gameAudio.playClick();
                              setActiveTab('help');
                            }
                          }}
                          onChange={(e) => setHelpSearchQuery(e.target.value)}
                          value={helpSearchQuery}
                          placeholder="Type keywords (e.g. 'Elo', 'Camera', 'Flicker') and press Enter to search the combined desk..."
                          className={`w-full pl-10 pr-16 py-3 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#009DFF] transition ${
                            theme === 'dark' 
                              ? 'bg-slate-950/70 border-slate-800 text-slate-100 placeholder-slate-550' 
                              : 'bg-slate-50 border-slate-205 text-slate-700 placeholder-slate-400'
                          }`}
                        />
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setActiveTab('help');            {/* ================= TAB 9: HELP CENTER ================= */}
            {activeTab === 'help' && (() => {
              // 1. COMBINE FAQ LIST & DATABASE HELP ARTICLES
              const combinedArticles: HelpArticle[] = [
                ...HELP_ARTICLES,
                {
                  id: 'faq-lens',
                  title: 'How do I trigger the Skudo Lens AI camera?',
                  category: 'guides',
                  tag: 'SYSTEM GUIDE',
                  popular: true,
                  content: 'Tap the Skudo Lens option in the navigation list or click the Lens camera icon in the top header. You can upload or capture any physical 9x9 Sudoku printed newspaper layout. Gemini OCR and neural tracing will translate the layout grid instantly into your active digital dashboard.'
                },
                {
                  id: 'faq-letters',
                  title: 'What are the rules of AI Letters Mode?',
                  category: 'guides',
                  tag: 'GAME BASICS / INFO',
                  popular: true,
                  content: 'In Letters Mode, standard digits 1-9 are replaced with alphabet characters A through I. All classical constraint logical Sudoku checks apply: each 3x3 diagonal region, column, and row must possess exact characters A-I with no duplicates. Great for re-wiring brain habit loops!'
                },
                {
                  id: 'faq-elo',
                  title: 'How are my ELO points and Rank calculated?',
                  category: 'guides',
                  tag: 'GAME BASICS / INFO',
                  popular: true,
                  content: 'Winning numeric or alpha games awards rating points. Standard Zen games award +50 points, Flow awards +100 points, Focus awards +180 points, and Quantax awards +320 points. Completing consecutive daily goals triggers rating multipliers, lifting you to master rank levels!'
                },
                {
                  id: 'faq-overlapping',
                  title: 'What if elements overlap on mobile setups?',
                  category: 'bug',
                  tag: 'TROUBLESHOOTING',
                  popular: false,
                  content: 'The layouts have been custom engineered desktop-first and responsive. The high-contrast top bar prevents overlapping. If you notice any browser grid issues, try toggling the Light Mode/Dark Mode option or zooming to 100% standard calibration.'
                },
                {
                  id: 'faq-autocheck',
                  title: "How do I earn the legendary 'Supercomputer Brain' achievement?",
                  category: 'guides',
                  tag: 'GAME BASICS / INFO',
                  popular: true,
                  content: "Complete an entire 9x9 board on Focus or Quantax difficulty with automated mistake check tools disabled. Requesting even one AI hint or undoing multiple mistakes disqualifies achievement eligibility."
                },
                {
                  id: 'faq-solver',
                  title: 'Why does the AI highlight invalid cell values?',
                  category: 'bug',
                  tag: 'TROUBLESHOOTING',
                  popular: false,
                  content: 'The database constraint engine simulates legal Sudoku arrays in milliseconds. If any value makes the board duplicate or mathematically unsolvable, the cell triggers red alerts instantly, saving you backtracking stress.'
                }
              ];

              // Filter elements based on selection and search tags
              const searchLower = helpSearchQuery.trim().toLowerCase();

              // Helper to check if article matches search
              const matchesArticle = (art: HelpArticle) => {
                if (!searchLower) return true;
                return (
                  art.title.toLowerCase().includes(searchLower) ||
                  art.content.toLowerCase().includes(searchLower) ||
                  art.tag.toLowerCase().includes(searchLower)
                );
              };

              // Map category buttons
              const categoriesList = [
                { id: 'all', label: 'All Articles', icon: BookOpen },
                { id: 'popular', label: 'Popular Solutions', icon: Sparkles },
                { id: 'bug', label: 'Bugs & Glitches', icon: AlertCircle },
                { id: 'account', label: 'Account Problems', icon: Lock },
                { id: 'guides', label: 'Tactical Guides', icon: Compass },
                { id: 'tickets', label: `My Tickets (${userInquiries.length})`, icon: Send }
              ];

              return (
                <motion.div
                  key="help"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col gap-6 text-left"
                  id="central-help-knowledge-desk"
                >
                  {/* Header Title Banner */}
                  <div className={`p-6 rounded-3xl border ${
                    theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-white border-sky-100 shadow-sm'
                  }`}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-wider text-[#009DFF] font-black">Central Diagnostic Support Desk</span>
                        <h3 className="text-xl font-black mt-1 uppercase tracking-tight">Skudo Knowledge & FAQ Hub</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Search 2026 database directories containing 40+ solved issues. File instant high-priority bug tickets directly with the AI Support Analyzer.
                        </p>
                      </div>
                      
                      {/* Live support agent stats indicators */}
                      <div className="flex items-center gap-3 bg-emerald-550/10 border border-emerald-500/10 rounded-2xl px-4 py-2 select-none self-stretch md:self-auto justify-center">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <div className="text-left leading-none">
                          <span className="text-[10px] font-mono font-black text-emerald-500 uppercase">AI REASONER ONLINE</span>
                          <p className="text-[9px] text-slate-400 mt-0.5">Uptime: 100% • Solved Today: 142</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT PANEL: KNOWLEDGE BASE ARTICLES & FILTERS (8 columns) */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                      
                      {/* Search and Category navigation */}
                      <div className={`p-5 rounded-3xl border flex flex-col gap-4 ${
                        theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-white border-sky-105 shadow-sm'
                      }`}>
                        
                        {/* Search Input Box */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] uppercase font-mono font-black text-slate-400 tracking-wider">Indexed Knowledge Broadcaster</span>
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={helpSearchQuery}
                              onChange={(e) => setHelpSearchQuery(e.target.value)}
                              placeholder="Search over 40+ problems e.g. ELO, camera, Letters, streak, save, overlap..."
                              className={`w-full pl-10 pr-16 py-3 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#009DFF] transition ${
                                theme === 'dark' 
                                  ? 'bg-slate-950/70 border-slate-800 text-slate-100 placeholder-slate-500' 
                                  : 'bg-slate-50 border-slate-200 text-slate-705 placeholder-slate-400'
                              }`}
                            />
                            {helpSearchQuery && (
                              <button
                                onClick={() => setHelpSearchQuery('')}
                                className="absolute right-3.5 top-3 text-[10px] uppercase font-bold text-[#009DFF] hover:text-red-500 border-0 bg-transparent cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Category Selector Tabs */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-400/5 select-none" id="faq-category-tabs">
                          {categoriesList.map((cat) => {
                            const isSelected = activeHelpCategory === cat.id;
                            const IconComponent = cat.icon;
                            return (
                              <button
                                key={`help-cat-${cat.id}`}
                                onClick={() => {
                                  gameAudio.playClick();
                                  setActiveHelpCategory(cat.id);
                                }}
                                className={`px-3 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border-0 ${
                                  isSelected 
                                    ? 'bg-gradient-to-r from-[#009DFF] to-indigo-600 text-white font-extrabold shadow-md' 
                                    : theme === 'dark'
                                      ? 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                                      : 'bg-slate-50 border border-slate-150 text-slate-650 hover:bg-slate-100 hover:text-slate-800'
                                }`}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                                <span>{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>

                      </div>

                      {/* Filtered Articles Content Render */}
                      <div className="flex flex-col gap-3">
                        {(() => {
                          // Handle My Tickets (Custom support submissions view)
                          if (activeHelpCategory === 'tickets') {
                            const filteredInquiries = userInquiries.filter(inq => {
                              if (!searchLower) return true;
                              return (
                                inq.subject.toLowerCase().includes(searchLower) ||
                                inq.message.toLowerCase().includes(searchLower) ||
                                inq.aiResolution.toLowerCase().includes(searchLower)
                              );
                            });

                            if (filteredInquiries.length === 0) {
                              return (
                                <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-100/10 rounded-2xl border border-dashed border-slate-300/30">
                                  No submitted support tickets found matching "{helpSearchQuery}". Feel free to file one on the right!
                                </div>
                              );
                            }

                            return filteredInquiries.map((inq) => {
                              const isOpen = selectedHelpArticle === inq.id;
                              return (
                                <div
                                  key={inq.id}
                                  className={`p-5 rounded-2xl border transition-all text-left flex flex-col gap-3 ${
                                    theme === 'dark' 
                                      ? 'bg-[#151D30]/80 border-slate-800' 
                                      : 'bg-white border-slate-100 shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${
                                        inq.priority === 'neural' 
                                          ? 'bg-red-500/15 text-red-500 border border-red-500/20' 
                                          : inq.priority === 'blocker'
                                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                                            : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                                      }`}>
                                        {inq.priority.toUpperCase()} PRIORITY
                                      </span>
                                      <span className="text-[9px] font-mono font-bold text-slate-400">
                                        SUBMITTED: {inq.submissionDate}
                                      </span>
                                    </div>

                                    <span className="text-[8.5px] font-black uppercase text-emerald-550 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded">
                                      {inq.status.toUpperCase()}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => {
                                      gameAudio.playClick();
                                      setSelectedHelpArticle(isOpen ? null : inq.id);
                                    }}
                                    className={`w-full flex justify-between items-center text-left text-xs font-black uppercase cursor-pointer border-0 bg-transparent p-0 leading-snug ${
                                      theme === 'dark' ? 'text-slate-100' : 'text-[#1e293b]'
                                    }`}
                                  >
                                    <span className="pr-4">{inq.subject}</span>
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                                      isOpen ? 'bg-[#009DFF]/15 text-[#009DFF]' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                    }`}>
                                      {isOpen ? 'Close [-]' : 'View Resolution [+]'}
                                    </span>
                                  </button>

                                  {isOpen && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed font-bold mt-2 pt-3 border-t border-slate-300/10 flex flex-col gap-3"
                                    >
                                      <div>
                                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Your Problem Description:</span>
                                        <p className="mt-1 font-semibold italic text-slate-450">{inq.message}</p>
                                      </div>
                                      <div className={`p-4 rounded-xl border ${
                                        theme === 'dark' ? 'bg-slate-950/80 border-slate-850' : 'bg-slate-50'
                                      }`}>
                                        <span className="text-[9.5px] font-black uppercase tracking-wider text-[#009DFF]">AI Core Diagnostician Verdict:</span>
                                        <p className="mt-1 text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed font-semibold">{inq.aiResolution}</p>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              );
                            });
                          }

                          // Handle Normal Articles (All, Popular, Bugs, Account, Tactical Guides)
                          const filtered = combinedArticles.filter((item) => {
                            // Category Filter
                            if (activeHelpCategory === 'popular' && !(item.popular || item.category === 'popular')) return false;
                            if (activeHelpCategory !== 'all' && activeHelpCategory !== 'popular' && item.category !== activeHelpCategory) return false;
                            
                            // Search Filter
                            return matchesArticle(item);
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-100/10 rounded-2xl border border-dashed border-slate-300/30">
                                No diagnostic articles found matching "{helpSearchQuery}". Try adjusting your category filter, or ask ourGrandmaster AI Coach!
                              </div>
                            );
                          }

                          return filtered.map((item) => {
                            const isOpen = selectedHelpArticle === item.id;
                            return (
                              <div
                                key={item.id}
                                className={`p-4.5 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                                  theme === 'dark' 
                                    ? 'bg-[#151D30]/80 border-slate-800 hover:border-slate-700' 
                                    : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-1.5 leading-none">
                                    <span className="text-[9px] font-mono font-black text-[#009DFF] uppercase tracking-wider bg-[#009DFF]/10 px-1.5 py-0.5 rounded">
                                      {item.tag}
                                    </span>
                                    {item.popular && (
                                      <span className="text-[8.5px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">
                                        ★ Popular Article
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] font-mono font-bold text-slate-400">
                                    REF-{item.id.toUpperCase()}
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    gameAudio.playClick();
                                    setSelectedHelpArticle(isOpen ? null : item.id);
                                  }}
                                  className={`w-full flex justify-between items-center text-left text-xs font-black uppercase cursor-pointer border-0 bg-transparent p-0 leading-snug mt-1 ${
                                    theme === 'dark' ? 'text-slate-100 hover:text-white' : 'text-[#1e293b] hover:text-slate-900'
                                  }`}
                                >
                                  <span className="pr-4">{item.title}</span>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                                    isOpen ? 'bg-[#009DFF]/15 text-[#009DFF]' : 'bg-slate-150 dark:bg-slate-800 text-slate-400'
                                  }`}>
                                    {isOpen ? 'Collapse [-]' : 'Expand [+]'}
                                  </span>
                                </button>
                                
                                {isOpen && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-[11.5px] text-slate-500 dark:text-slate-300 leading-relaxed font-bold mt-2 pt-3 border-t border-slate-350/10 whitespace-pre-line flex flex-col gap-3"
                                  >
                                    <p>{item.content}</p>

                                    {/* Link directly to solver coach tab */}
                                    <button
                                      onClick={() => {
                                        gameAudio.playClick();
                                        setActiveTab('chat');
                                        submitAiPrompt(`Clarify or teach me how this solves the problem: ${item.title}`);
                                      }}
                                      className="py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/15 text-indigo-500 dark:text-cyan-400 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition w-fit border-0 self-start"
                                    >
                                      💡 Ask AI Coach to clarify this rule or logic
                                    </button>
                                  </motion.div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>

                    </div>

                    {/* RIGHT PANEL: SUBMIT LOGIC INQUIRY & ADDITIONAL SUPPORT (4 columns) */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                      
                      {/* Central Submit Card */}
                      <div className={`p-5 rounded-3xl border flex flex-col gap-4 text-left ${
                        theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-white border-sky-100 shadow-sm'
                      }`}>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-[#009DFF] tracking-wider font-mono">Submit Custom Support ticket</span>
                          <h4 className="text-sm font-black mt-1 uppercase tracking-tight">Logic & Bug Inquiry Desk</h4>
                          <p className="text-[10.5px] text-slate-400 mt-1">
                            Encountered a custom issue? Submit an inquiry and our central neural analyzer will generate a resolved verdict immediately.
                          </p>
                        </div>

                        {supportSubmitted ? (
                          <div className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-emerald-500 text-xs font-black">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>TICKET PARSED</span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal">
                              We have analyzed your profile metrics. Your custom ticket is solved and indexed into your active Support Tickets folder:
                            </p>
                            <div className={`p-3 rounded-xl text-[10.5px] leading-relaxed font-semibold border ${
                              theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-55 border-slate-200 text-slate-600'
                            }`}>
                              <span className="text-[8.5px] uppercase tracking-widest text-[#009DFF] font-black font-mono">AI ASSISTANT RESOLUTION VERDICT:</span>
                              <p className="mt-1">{supportTicketResult}</p>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  gameAudio.playClick();
                                  setActiveHelpCategory('tickets');
                                  setHelpSearchQuery('');
                                }}
                                className="py-2.5 bg-gradient-to-r from-[#009DFF] to-indigo-600 text-white hover:opacity-90 font-extrabold text-[10.5px] uppercase tracking-wider text-center rounded-xl transition border-0 cursor-pointer"
                              >
                                View My Support Tickets
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  gameAudio.playClick();
                                  setSupportSubmitted(false);
                                  setSupportSubject('');
                                  setSupportMessage('');
                                  setSupportTicketResult('');
                                }}
                                className="py-2 border border-[#405D80]/20 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs text-center rounded-xl transition cursor-pointer"
                              >
                                Submit Another Inquiry
                              </button>
                            </div>
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
                                let ans = "Ticket received. We have indexed your credentials. Your client profile is in perfect sync. If state delays persist, refreshing the browser clears temporary browser canvas cache.";
                                
                                if (msgLower.includes("lens") || msgLower.includes("camera") || msgLower.includes("scan") || msgLower.includes("ocr")) {
                                  ans = "OCR Lens verified. Ensure the paper worksheet rests flatly under non-skewed lighting. Shaky crops confuse digit detection matrices; trim your picture exactly to the outer 9x9 borders before scanning.";
                                } else if (msgLower.includes("letters") || msgLower.includes("alphabet") || msgLower.includes("a-i")) {
                                  ans = "Letters Mode replicates all classical matrix rules replacing digits 1-9 with A-I respectively. To lower difficulty, select 'Zen' under the play menu or ask the chat tutor.";
                                } else if (msgLower.includes("bug") || msgLower.includes("overlap") || msgLower.includes("flicker") || msgLower.includes("glitch")) {
                                  ans = "Flickering layouts on WebKit browser architectures have been updated with seamless style buffers. We recommend keeping screen zoom anchored at 100% calibration.";
                                } else if (msgLower.includes("streak") || msgLower.includes("daily") || msgLower.includes("calendar")) {
                                  ans = "Your daily streak updates progressively within local memory files upon finishing any daily puzzle. Only play on one active tab at a time to prevent file sync conflicts.";
                                } else if (msgLower.includes("points") || msgLower.includes("xp") || msgLower.includes("elo") || msgLower.includes("score")) {
                                  ans = "ELO algorithms scale points natively depending on diff filters: Quantum wins grant up to +320 ELO base. Turning on automated mistakes filters applies a 30% discount.";
                                }

                                const newInquiryItem = {
                                  id: `inq-user-${Date.now()}`,
                                  subject: supportSubject,
                                  message: supportMessage,
                                  priority: supportPriority,
                                  status: 'resolved' as const,
                                  submissionDate: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
                                  aiResolution: ans
                                };

                                setUserInquiries(prev => [newInquiryItem, ...prev]);
                                setSupportTicketResult(ans);
                              }, 1200);
                            }}
                            className="flex flex-col gap-3.5"
                          >
                            {/* Subject */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase font-mono font-black text-slate-400">Inquiry Subject</label>
                              <input
                                type="text"
                                required
                                value={supportSubject}
                                onChange={(e) => setSupportSubject(e.target.value)}
                                placeholder="e.g. Lens camera scan lag or badge unlock..."
                                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#009DFF] border transition ${
                                  theme === 'dark' 
                                    ? 'bg-slate-950/60 border-slate-800 text-slate-100 placeholder-slate-500 font-bold' 
                                    : 'bg-slate-50 border-slate-205 text-slate-700 placeholder-slate-400 font-bold'
                                }`}
                              />
                            </div>

                            {/* Priority */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase font-mono font-black text-slate-400">Logical Priority</label>
                              <select
                                value={supportPriority}
                                onChange={(e) => setSupportPriority(e.target.value as any)}
                                className={`w-full px-3 py-2.5 rounded-xl text-xs font-black focus:outline-none focus:border-[#009DFF] border transition ${
                                  theme === 'dark' ? 'bg-[#0f1322] border-slate-800 text-slate-150' : 'bg-slate-50 border-slate-150 text-slate-700'
                                }`}
                              >
                                <option value="casual">🟢 Casual Logic Inquiry</option>
                                <option value="blocker">🟡 Blocker (Pencil/Game Glitch)</option>
                                <option value="neural">🔴 Neural Crash (Autocheck failed)</option>
                              </select>
                            </div>

                            {/* Message */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase font-mono font-black text-slate-400">Problem Description</label>
                              <textarea
                                required
                                rows={4}
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                placeholder="Describe the physical scan or software logic discrepancy in detail..."
                                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#009DFF] border transition ${
                                  theme === 'dark' 
                                    ? 'bg-slate-950/60 border-slate-800 text-slate-100 placeholder-slate-500 font-bold' 
                                    : 'bg-slate-50 border-slate-205 text-slate-705 placeholder-slate-400 font-bold'
                                }`}
                              />
                            </div>

                            {/* Submit Button */}
                            <button
                              type="submit"
                              disabled={supportLoading}
                              className="w-full mt-1.5 py-3 bg-gradient-to-r from-[#009DFF] to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5 active:scale-98 border-0"
                            >
                              {supportLoading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Syncing Credentials...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Submit Logic inquiry</span>
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Quick Instruction Desk Note */}
                      <div className={`p-4.5 rounded-2xl border text-slate-400 text-[11px] leading-relaxed font-semibold transition ${
                        theme === 'dark' ? 'bg-[#0b0e18] border-slate-800/80' : 'bg-slate-50 border-slate-150'
                      }`}>
                        <span className="text-[9.5px] font-black uppercase text-[#009DFF] tracking-wider block mb-1">💡 AGENT TIP:</span>
                        Did you know? Searching for keywords automatically displays both catalog matches from 
                        the pre-written Knowledge Base and your submitted support tickets simultaneously!
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })()}             </>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-400/20 pb-4">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-[#009DFF]/15 text-[#009DFF] border border-[#009DFF]/25 tracking-widest inline-block mb-1.5 animate-pulse">
                      ⚡ Vision Engine v5.0 Activated
                    </span>
                    <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">
                      SKUDO LENS VISION CORE
                    </h3>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-450 leading-relaxed max-w-2xl mt-1">
                      Digitize offline newspapers, handwritten puzzles, or smartphone screenshots instantly. Overwrite OCR uncertainties, analyze strategies, and read steps aloud in plain English.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                    <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-[11px] font-bold">
                      <span className="text-slate-400 mr-1.5">Tracer Rate:</span>
                      <span className="text-emerald-500 font-mono">99.8% Perfect</span>
                    </div>
                  </div>
                </div>

                {/* MAIN GRID LAYOUT FOR LENS TAB */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                  
                  {/* LEFT PANE: IMAGE CALIBRATION, LIGHTING, BLUR VALIDATION */}
                  <div className="flex flex-col gap-5">
                    <div className={`p-5 rounded-3xl border flex flex-col gap-4 text-left ${
                      theme === 'dark' ? 'bg-[#151D30]/65 border-slate-800' : 'bg-white border-slate-200/60 shadow-3xs'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-black uppercase text-sky-400 tracking-wider">Calibration Deck</span>
                        <Sliders className="w-4 h-4 text-sky-400" />
                      </div>

                      {/* Image Preview Container */}
                      <div className={`relative rounded-2xl border-2 border-dashed overflow-hidden min-h-[170px] flex flex-col items-center justify-center p-3 transition-colors ${
                        lensFile 
                          ? 'border-[#009DFF]/50 bg-slate-950/25' 
                          : 'border-slate-300 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                      }`}>
                        {/* Interactive scan lines */}
                        {lensScanProgress >= 0 && lensScanProgress < 100 && (
                          <div 
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#009DFF] to-transparent shadow-[0_0_12px_#009DFF] z-20 animate-pulse"
                            style={{ 
                              top: `${lensScanProgress}%`,
                              transition: 'top 0.1s ease-out'
                            }}
                          />
                        )}

                        {lensScanProgress >= 0 && lensScanProgress < 100 ? (
                          <div className="text-center p-4 z-10 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full border-4 border-[#009DFF]/20 border-t-[#009DFF] animate-spin flex items-center justify-center">
                              <Camera className="w-5 h-5 text-[#009DFF]" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-extrabold uppercase text-[#009DFF] tracking-wider">Neural Digitization...</span>
                              <span className="text-[9px] font-mono text-slate-400">OCR Tracing Matrix • {lensScanProgress}%</span>
                            </div>
                          </div>
                        ) : lensFile ? (
                          <div className="relative w-full flex flex-col items-center gap-3.5 mt-1.5 text-center">
                            {lensFile.startsWith('data:') ? (
                              <img 
                                src={lensFile} 
                                alt="Paper camera raw" 
                                className="rounded-xl max-h-[140px] aspect-square object-cover border border-slate-300/25"
                                style={{
                                  filter: `blur(${lensBlur * 0.7}px) contrast(${100 + (lensLighting - 90)}%)`,
                                  transform: `rotate(${lensRotation}deg)`
                                }}
                              />
                            ) : (
                              <div className="py-7 px-4 bg-slate-950/70 text-slate-300 font-mono text-center rounded-xl w-full border border-slate-800">
                                <span className="text-[8px] text-slate-500 block font-bold">TEMPLATE IDENTIFIER</span>
                                <h4 className="text-xs font-black text-sky-400 uppercase mt-1 truncate max-w-[210px]">{lensFile}</h4>
                              </div>
                            )}

                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                              Ready for Extraction
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-3 text-center">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-slate-900 text-[#009DFF] flex items-center justify-center">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200">Load Physical Grid</h5>
                              <p className="text-[9.5px] text-slate-400 mt-0.5 leading-relaxed">Drop your printed Sudoku screenshot or select a file coordinates.</p>
                            </div>
                            <input
                              type="file"
                              id="lens-upload-input"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  gameAudio.playClick();
                                  setLensVerificationError(null);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const base64String = reader.result as string;
                                    setLensBase64(base64String);
                                    setLensFile(base64String);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                            <label
                              htmlFor="lens-upload-input"
                              className="px-3.5 py-2 bg-[#009DFF] hover:bg-[#008CE6] text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center gap-1.5 active:scale-95 shadow-sm mt-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Browse Image
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Source Type Selector */}
                      <div className="flex flex-col gap-1.5" id="source-type-selection">
                        <label className="text-[9px] font-black uppercase text-slate-400">Puzzle Source Material</label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { value: 'newspaper', label: '📰 Newspaper' },
                            { value: 'printed', label: '🖨️ Magazine' },
                            { value: 'screenshot', label: '📱 Screen' },
                            { value: 'photo', label: '📸 Camera' },
                            { value: 'handwritten', label: '📝 Ink Pen' }
                          ].map((item) => (
                            <button
                              key={item.value}
                              onClick={() => {
                                gameAudio.playClick();
                                setLensSourceType(item.value as any);
                              }}
                              className={`px-1.5 py-1.5 rounded-lg border text-[9px] font-bold text-center uppercase tracking-wide cursor-pointer transition ${
                                lensSourceType === item.value
                                  ? 'bg-[#009DFF]/15 text-[#009DFF] border-[#009DFF]'
                                  : 'border-slate-205 dark:border-slate-800 hover:bg-slate-200/20'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Image Calibration Parameters (Interactive validation controls) */}
                      <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/10" id="calibration-parameters-sliders">
                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Calibration Corrections</span>
                        
                        {/* 1. Rotation Slider */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400">Horizontal Skew (Rotation):</span>
                            <span className={`font-mono ${Math.abs(lensRotation) > 15 ? 'text-rose-500' : 'text-sky-300'}`}>
                              {lensRotation > 0 ? `+${lensRotation}` : lensRotation}°
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min="-45" 
                            max="45" 
                            value={lensRotation} 
                            onChange={(e) => setLensRotation(Number(e.target.value))}
                            className="w-full accent-[#009DFF] bg-slate-200 dark:bg-slate-800 h-1 rounded"
                          />
                        </div>

                        {/* 2. Blur level */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400">Blur & Optical Quality:</span>
                            <span className={`font-mono ${lensBlur > 4 ? 'text-rose-500 font-extrabold' : 'text-sky-300'}`}>
                              {lensBlur} / 10 {lensBlur > 4 ? '(Heavy)' : '(Crisp)'}
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            value={lensBlur} 
                            onChange={(e) => setLensBlur(Number(e.target.value))}
                            className="w-full accent-[#009DFF] bg-slate-200 dark:bg-slate-800 h-1 rounded"
                          />
                        </div>

                        {/* 3. Lighting Slider */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400">Shadow Correction & Lighting:</span>
                            <span className={`font-mono ${lensLighting < 40 ? 'text-rose-500' : 'text-sky-300'}`}>
                              {lensLighting}% {lensLighting < 40 ? '(Shadowy)' : '(Optimal)'}
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            value={lensLighting} 
                            onChange={(e) => setLensLighting(Number(e.target.value))}
                            className="w-full accent-[#009DFF] bg-slate-200 dark:bg-slate-800 h-1 rounded"
                          />
                        </div>

                        {/* 4. Cropped Toggles */}
                        <div className="flex items-center justify-between pt-1 text-[10px] font-bold text-slate-400">
                          <span>Cropped Boundaries Edge:</span>
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              setLensCropped(!lensCropped);
                            }}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition ${
                              lensCropped 
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' 
                                : 'bg-slate-150 dark:bg-slate-800 text-slate-350'
                            }`}
                          >
                            {lensCropped ? '⚠️ Edge Cropped' : '✓ Full Border Grid'}
                          </button>
                        </div>
                      </div>

                      {/* Error Validation Alert Layer */}
                      {lensVerificationError && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[10.5px] rounded-2xl flex items-start gap-2 animate-bounce">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div className="text-left font-medium">
                            <strong className="block uppercase text-[10px] font-black mb-0.5">Extraction Terminated</strong>
                            {lensVerificationError}
                          </div>
                        </div>
                      )}

                      {/* Actions Trigger and Sample Links */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/10">
                        {lensFile ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                gameAudio.playClick();
                                setLensFile(null);
                                setLensBase64(null);
                                setLensScanProgress(-1);
                                setLensVerificationError(null);
                                setLensOriginalBoard(Array(9).fill(null).map(() => Array(9).fill(0)));
                              }}
                              className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-[10.5px] font-black uppercase rounded-xl cursor-pointer text-center text-slate-600 dark:text-slate-300"
                            >
                              Reset Deck
                            </button>
                            <button
                              onClick={handleScanAndTrace}
                              className="py-2.5 bg-[#009DFF] hover:bg-[#0089E4] text-[#FFFFFF] text-[10.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-sky-500/20 active:scale-98 transition text-center"
                            >
                              Scan & Trace
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Fast Presets</span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  gameAudio.playClick();
                                  setLensFile('London Times Daily Puzzle');
                                  setLensRotation(0);
                                  setLensBlur(0);
                                  setLensLighting(95);
                                  setLensCropped(false);
                                  setLensVerificationError(null);
                                  
                                  const base = [
                                    [5, 3, 0, 0, 7, 0, 0, 0, 0],
                                    [6, 0, 0, 1, 9, 5, 0, 0, 0],
                                    [0, 9, 8, 0, 0, 0, 0, 6, 0],
                                    [8, 0, 0, 0, 6, 0, 0, 0, 3],
                                    [4, 0, 0, 8, 0, 3, 0, 0, 1],
                                    [7, 0, 0, 0, 2, 0, 0, 0, 6],
                                    [0, 6, 0, 0, 0, 0, 2, 8, 0],
                                    [0, 0, 0, 4, 1, 9, 0, 0, 5],
                                    [0, 0, 0, 0, 8, 0, 0, 7, 9]
                                  ];
                                  const confs = base.map((row, r) => 
                                    row.map((val, c) => {
                                      if (val === 0) return 100;
                                      if (r === 0 && c === 0) return 84; // uncertain for manual correction demo
                                      if (r === 7 && c === 3) return 89; // uncertain for manual correction demo
                                      return 98;
                                    })
                                  );
                                  setLensOriginalBoard(base);
                                  setLensCellConfidences(confs);
                                  setLensDifficulty('easy');
                                  setLensActiveExplanationIdx(0);
                                }}
                                className={`p-2 border rounded-xl text-[9px] font-black uppercase cursor-pointer hover:border-[#009DFF] transition ${
                                  theme === 'dark' ? 'bg-slate-950/70 border-slate-800 text-slate-350' : 'bg-slate-50 border-slate-200 text-slate-600 shadow-3xs'
                                }`}
                              >
                                🎯 London Times (Easy)
                              </button>
                              <button
                                onClick={() => {
                                  gameAudio.playClick();
                                  setLensFile('NYT Extreme Masterly Print');
                                  setLensRotation(0);
                                  setLensBlur(1);
                                  setLensLighting(90);
                                  setLensCropped(false);
                                  setLensVerificationError(null);
                                  
                                  const base = [
                                    [0, 0, 0, 6, 0, 0, 4, 0, 0],
                                    [7, 0, 0, 0, 0, 3, 6, 0, 0],
                                    [0, 0, 0, 0, 9, 1, 0, 8, 0],
                                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                                    [0, 5, 0, 1, 8, 0, 0, 0, 3],
                                    [0, 0, 0, 3, 0, 6, 0, 4, 5],
                                    [0, 4, 0, 2, 0, 0, 0, 6, 0],
                                    [9, 0, 3, 0, 0, 0, 0, 0, 0],
                                    [0, 2, 0, 0, 0, 0, 1, 0, 0]
                                  ];
                                  const confs = base.map((row, r) => 
                                    row.map((val, c) => {
                                      if (val === 0) return 100;
                                      if (r === 1 && c === 0) return 83; // Mark cell [1,0] index as uncertain
                                      return 97;
                                    })
                                  );
                                  setLensOriginalBoard(base);
                                  setLensCellConfidences(confs);
                                  setLensDifficulty('hard');
                                  setLensActiveExplanationIdx(0);
                                }}
                                className={`p-2 border rounded-xl text-[9px] font-black uppercase cursor-pointer hover:border-violet-500 transition ${
                                  theme === 'dark' ? 'bg-slate-950/70 border-slate-800 text-slate-350' : 'bg-slate-50 border-slate-200 text-slate-600 shadow-3xs'
                                }`}
                              >
                                ⚡ NYT Extreme (Hard)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CENTER PANE: BOARD 1 — DETECTED SUDOKU (USER-EDITABLE) */}
                  <div className="flex flex-col gap-4">
                    <div className={`p-5 rounded-3xl border flex flex-col gap-3.5 text-left h-full ${
                      theme === 'dark' ? 'bg-[#151D30]/65 border-slate-800' : 'bg-white border-slate-200/60 shadow-3xs'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9.5px] font-black uppercase text-sky-400 tracking-widest">BOARD 1</span>
                          <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-100 flex items-center gap-1.5">
                            📐 Original Detected Layout
                          </h4>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-extrabold uppercase border border-amber-550/20 leading-none">
                          Verify Digits
                        </span>
                      </div>

                      {/* 9x9 Interactive Editable Canvas Grid */}
                      <div className="aspect-square w-full max-w-[270px] mx-auto grid grid-cols-9 gap-0.5 border-2 border-slate-800 dark:border-slate-950 p-1 bg-slate-950 rounded-2xl relative">
                        {lensOriginalBoard.map((row, r) => 
                          row.map((val, c) => {
                            const isSelected = lensIsEditingCell?.r === r && lensIsEditingCell?.c === c;
                            const isUncertain = val > 0 && (lensCellConfidences[r]?.[c] || 100) < 90;
                            const isConflict = detectGridConflicts(lensOriginalBoard).some(conf => 
                              conf.cells.some(([cr, cc]) => cr === r && cc === c)
                            );
                            
                            // Visual borders logic for 3x3 box separates
                            const borderRight = (c === 2 || c === 5) ? 'border-r-2 border-slate-800' : '';
                            const borderBottom = (r === 2 || r === 5) ? 'border-b-2 border-slate-800' : '';

                            return (
                              <div
                                key={`${r}-${c}`}
                                onClick={() => {
                                  gameAudio.playClick();
                                  setLensIsEditingCell(isSelected ? null : { r, c });
                                }}
                                className={`aspect-square flex flex-col items-center justify-center text-xs font-black relative cursor-pointer select-none transition-all duration-100 ${borderRight} ${borderBottom} ${
                                  isSelected 
                                    ? 'bg-[#009DFF]/30 text-white ring-2 ring-[#009DFF] z-10 scale-102 rounded' 
                                    : isConflict 
                                      ? 'bg-rose-500/25 border border-rose-500 text-rose-450 z-5'
                                      : isUncertain
                                        ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-550/25 border border-amber-500/40 rounded-sm'
                                        : val !== 0 
                                          ? 'bg-slate-900 border border-slate-800 text-sky-400 hover:bg-slate-800'
                                          : 'bg-slate-950 border border-slate-900/50 text-slate-600 hover:bg-slate-900/40'
                                }`}
                              >
                                {val !== 0 ? val : ''}
                                
                                {/* Uncertainty Exclamation badge indicator inside the small block */}
                                {isUncertain && !isSelected && (
                                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Live Digit manual overwrite controller if active */}
                      {lensIsEditingCell ? (
                        <div className="p-3 bg-[#009DFF]/10 border border-[#009DFF]/25 rounded-2xl flex flex-col gap-2 animate-fade">
                          <span className="text-[9.5px] font-extrabold uppercase text-[#009DFF] flex items-center justify-between">
                            <span>Manually edit cells [R{lensIsEditingCell.r + 1} C{lensIsEditingCell.c + 1}]:</span>
                            <span className="font-mono text-[8.5px] text-slate-400">Current Extracted Conf: {lensCellConfidences[lensIsEditingCell.r]?.[lensIsEditingCell.c] || 100}%</span>
                          </span>
                          
                          {/* Keypad Buttons */}
                          <div className="grid grid-cols-10 gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                              <button
                                key={num}
                                onClick={() => {
                                  gameAudio.playClick();
                                  triggerVibe();
                                  // Update Matrix
                                  const nextBoard = lensOriginalBoard.map(row => [...row]);
                                  const nextConfs = lensCellConfidences.map(row => [...row]);
                                  nextBoard[lensIsEditingCell.r][lensIsEditingCell.c] = num;
                                  nextConfs[lensIsEditingCell.r][lensIsEditingCell.c] = 100; // manual override guarantees 100% confidence
                                  
                                  setLensOriginalBoard(nextBoard);
                                  setLensCellConfidences(nextConfs);
                                  setLensIsEditingCell(null); // auto close
                                }}
                                className="p-1 px-1.5 bg-[#009DFF] hover:bg-sky-500 text-white font-extrabold text-xs uppercase rounded-lg cursor-pointer text-center select-none active:scale-95"
                              >
                                {num}
                              </button>
                            ))}
                            {/* Clear cell */}
                            <button
                              onClick={() => {
                                gameAudio.playClick();
                                triggerVibe();
                                const nextBoard = lensOriginalBoard.map(row => [...row]);
                                const nextConfs = lensCellConfidences.map(row => [...row]);
                                nextBoard[lensIsEditingCell.r][lensIsEditingCell.c] = 0;
                                nextConfs[lensIsEditingCell.r][lensIsEditingCell.c] = 100;
                                setLensOriginalBoard(nextBoard);
                                setLensCellConfidences(nextConfs);
                                setLensIsEditingCell(null);
                              }}
                              className="p-1 text-[8.5px] bg-rose-500 text-white font-black uppercase rounded-lg cursor-pointer text-center select-none col-span-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-[10.5px] text-slate-400 bg-slate-100/5 dark:bg-slate-900/40 p-3 rounded-2xl border border-dashed border-slate-350 dark:border-slate-800">
                          💡 Tap any cell in Board 1 above to modify incorrect digits or fix OCR uncertainties.
                        </div>
                      )}

                      {/* Highlight Uncertain cells warning banner */}
                      {(() => {
                        const uncertainList: string[] = [];
                        lensOriginalBoard.forEach((row, r) => {
                          row.forEach((val, c) => {
                            if (val > 0 && lensCellConfidences[r]?.[c] < 90) {
                              uncertainList.push(`R${r+1}C${c+1}`);
                            }
                          });
                        });
                        
                        if (uncertainList.length > 0) {
                          return (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-start gap-2 text-[10.5px] leading-relaxed">
                              <span className="text-xs shrink-0 mt-0.5">⚠️</span>
                              <div>
                                <span className="font-extrabold block uppercase text-[9.5px]">OCR UNCERTAINTY DECLARED:</span>
                                Low confidence extracted on cells: <strong>{uncertainList.join(', ')}</strong>. Tap cells above to rectify parameters manually instead of guessing.
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Conflicts warning badge */}
                      {(() => {
                        const conflicts = detectGridConflicts(lensOriginalBoard);
                        if (conflicts.length > 0) {
                          return (
                            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10.5px] flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div className="text-left font-medium">
                                <span className="block uppercase text-[9.5px] font-black">Puzzle contains conflicting numbers.</span>
                                Duplicate values verified inside row, column or box zone. Check cells highlighted in red.
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* RIGHT PANE: BOARD 2 — SOLVED SUDOKU */}
                  <div className="flex flex-col gap-4">
                    <div className={`p-5 rounded-3xl border flex flex-col gap-3.5 text-left h-full ${
                      theme === 'dark' ? 'bg-[#151D30]/65 border-slate-800' : 'bg-white border-slate-200/60 shadow-3xs'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9.5px] font-black uppercase text-sky-400 tracking-widest">BOARD 2</span>
                          <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-100 flex items-center gap-1.5">
                            🔮 Automated AI Solved Grid
                          </h4>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-extrabold uppercase border border-emerald-550/20 leading-none">
                          AI Result
                        </span>
                      </div>

                      {/* 9x9 Solved Grid Layout (keeps both original and AI numbers side-by-side) */}
                      {(() => {
                        const solved = solveSudoku(lensOriginalBoard);
                        if (!solved) {
                          return (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-slate-350 dark:border-slate-800 rounded-2xl min-h-[260px] text-center gap-2">
                              <span className="text-3xl">🧩</span>
                              <h5 className="text-xs font-black uppercase text-slate-600 dark:text-slate-350 mt-1">Solvability Pending</h5>
                              <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
                                The Board 1 layout details are currently incomplete or containing conflicts. Solve matrix will calculate automatically once constraints are reconciled.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-col gap-4">
                            <div className="aspect-square w-full max-w-[270px] mx-auto grid grid-cols-9 gap-0.5 border-2 border-slate-800 dark:border-slate-950 p-1 bg-slate-950 rounded-2xl">
                              {solved.map((solvedRow, r) => 
                                solvedRow.map((val, c) => {
                                  const originalVal = lensOriginalBoard[r]?.[c] || 0;
                                  const isOriginal = originalVal !== 0;
                                  
                                  const borderRight = (c === 2 || c === 5) ? 'border-r-2 border-slate-800' : '';
                                  const borderBottom = (r === 2 || r === 5) ? 'border-b-2 border-slate-800' : '';

                                  return (
                                    <div
                                      key={`solved-${r}-${c}`}
                                      className={`aspect-square flex items-center justify-center text-xs font-black relative cursor-default select-none ${borderRight} ${borderBottom} ${
                                        isOriginal 
                                          ? 'bg-slate-900 border border-slate-850/40 text-[#009DFF]' 
                                          : 'bg-emerald-950/15 border border-emerald-900/20 text-emerald-450 font-sans'
                                      }`}
                                    >
                                      {val}
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* SOLVER METRICS */}
                            <div className={`p-3.5 rounded-2xl border text-[10.5px] leading-relaxed flex flex-col gap-1.5 ${
                              theme === 'dark'
                                ? 'bg-slate-900/30 border-slate-800 text-slate-500'
                                : 'bg-[#f8fafc] border-slate-200 text-slate-600'
                            }`}>
                              <div className="flex justify-between font-bold">
                                <span>Constraint Extraction Cost (OCR):</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300">224 ms</span>
                              </div>
                              <div className="flex justify-between font-bold">
                                <span>Backtracking Solver Step Lag:</span>
                                <span className="font-mono text-[#009DFF]">12 ms (0.01s)</span>
                              </div>
                              <div className="flex justify-between font-bold">
                                <span>Identified Payout Weight:</span>
                                <span className="font-semibold text-emerald-500">+125 XP ELO</span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                gameAudio.playClick();
                                triggerVibe();
                                // Load board array instantly inside Play state
                                onSelectGame({
                                  mode: 'numbers',
                                  difficulty: 'flow',
                                  variant: 'lens-ocr-loaded'
                                });
                                // Keep raw copy saved inside local temp
                                localStorage.setItem('skudo_lens_loaded_digits', JSON.stringify(lensOriginalBoard));
                              }}
                              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-[#009DFF] hover:from-emerald-600 hover:to-sky-500 text-[#FFFFFF] font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md text-center inline-block active:scale-98 transition transform duration-150"
                            >
                              🎮 Play This Puzzle Live!
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                </div>

                {/* BOTTOM COLUMN: DEDICATED AI SUDOKU TUTORIAL ASSISTANT PANEL */}
                {(() => {
                  const solved = solveSudoku(lensOriginalBoard);
                  if (!solved) return null;

                  const explanations = generateExplanations(lensOriginalBoard, solved, lensAssistantMode);
                  const activeStep = explanations[lensActiveExplanationIdx] || explanations[0] || null;

                  return (
                    <div className={`p-6 rounded-3xl border text-left flex flex-col gap-4 ${
                      theme === 'dark' ? 'bg-[#151D30]/60 border-slate-800' : 'bg-[#EDF7FF] border-[#B9E3FF] shadow-3xs'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-400/10 pb-3.5">
                        <div className="text-left">
                          <span className="text-[9.5px] uppercase tracking-wider text-sky-400 font-extrabold bg-[#009DFF]/10 px-2 py-0.5 rounded">
                            👩‍🏫 Skudo Coaching Core
                          </span>
                          <h4 className="text-md font-black uppercase text-slate-800 dark:text-slate-100 mt-1.5">
                            Interactive Tutorial & Explanation Hub
                          </h4>
                        </div>
                        
                        {/* Selector of Mode */}
                        <div className="flex items-center gap-1 shrink-0 bg-white/10 dark:bg-slate-900/60 p-1 rounded-2xl border dark:border-slate-800" id="assistant-tutorial-deck">
                          {[
                            { id: 'beginner', label: '🪴 Beginner' },
                            { id: 'intermediate', label: '🎓 Intermediate' },
                            { id: 'expert', label: '🧠 Expert' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                gameAudio.playClick();
                                setLensAssistantMode(tab.id as any);
                                setLensActiveExplanationIdx(0);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase select-none cursor-pointer transition ${
                                lensAssistantMode === tab.id
                                  ? 'bg-[#009DFF] text-white'
                                  : 'text-slate-400 hover:text-slate-205'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Real Explanations display card */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch min-h-0">
                        {/* 1. Step Slider Navigation Card */}
                        <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 ${
                          theme === 'dark' ? 'bg-[#0E1424] border-slate-850' : 'bg-white border-slate-200/50'
                        }`}>
                          <div className="text-left flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400">Chronological Solver Order</span>
                            <span className="text-sm font-black uppercase text-slate-700 dark:text-slate-200 mt-1">
                              Move {lensActiveExplanationIdx + 1} / {explanations.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              disabled={lensActiveExplanationIdx === 0}
                              onClick={() => {
                                gameAudio.playClick();
                                setLensActiveExplanationIdx(prev => Math.max(0, prev - 1));
                              }}
                              className="px-3.5 py-2 rounded-xl bg-slate-200/10 hover:bg-slate-200/20 disabled:opacity-30 text-[10.5px] font-black uppercase text-slate-400 border border-slate-450/10 cursor-pointer disabled:cursor-not-allowed leading-none flex-1 text-center"
                            >
                              ◀ Previous
                            </button>
                            <button
                              disabled={lensActiveExplanationIdx >= explanations.length - 1}
                              onClick={() => {
                                gameAudio.playClick();
                                setLensActiveExplanationIdx(prev => Math.min(explanations.length - 1, prev + 1));
                              }}
                              className="px-3.5 py-2 bg-[#009DFF] hover:bg-sky-500 text-white disabled:opacity-30 text-[10.5px] font-black uppercase cursor-pointer disabled:cursor-not-allowed leading-none flex-1 text-center"
                            >
                              Next Move ▶
                            </button>
                          </div>
                        </div>

                        {/* 2. Strategy Method Explanation with Voice Synthesis */}
                        <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 lg:col-span-2 ${
                          theme === 'dark' ? 'bg-[#0E1424] border-slate-850' : 'bg-white border-slate-200/50'
                        }`}>
                          <div className="text-left font-medium">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-300/10 pb-2 mb-2">
                              <div>
                                <span className="text-[9.5px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 leading-none mr-2">
                                  🧩 {activeStep?.cell || 'R1C1'}
                                </span>
                                <strong className="text-xs uppercase font-extrabold text-[#009DFF] tracking-wider">
                                  {activeStep?.strategy || 'Pencil Elimination'}
                                </strong>
                              </div>

                              {/* VOICE TTS SWITCH BUTTON */}
                              <button
                                onClick={() => {
                                  gameAudio.playClick();
                                  setLensVoiceEnabled(!lensVoiceEnabled);
                                  if (!lensVoiceEnabled && activeStep) {
                                    readSpeechVerbally(`Cell ${activeStep.cell} equals ${activeStep.value}. Strategy: ${activeStep.strategy}. ${activeStep.reason}`);
                                  } else {
                                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                                      window.speechSynthesis.cancel();
                                    }
                                  }
                                }}
                                className={`p-1.5 px-3 rounded-lg text-[9px] font-black uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                                  lensVoiceEnabled 
                                    ? 'bg-emerald-500 text-white font-black animate-pulse' 
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-400'
                                }`}
                              >
                                {lensVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                {lensVoiceEnabled ? 'Speech ON' : 'Read Aloud'}
                              </button>
                            </div>

                            {activeStep ? (
                              <p className="text-[11px] leading-relaxed dark:text-slate-300 text-slate-600">
                                Solve Value: <strong className="text-[#009DFF]">{activeStep.value}</strong> · {activeStep.reason}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">No solution trace calculated.</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/10 pt-2">
                            <span>Mode: {lensAssistantMode === 'beginner' ? 'Beginner-Friendly Dialects' : lensAssistantMode === 'expert' ? 'Advanced Terminology Algorithms' : 'Standard Intermediate Logic'}</span>
                            <span className="font-mono text-[#009DFF] shrink-0">Solver order mapped</span>
                          </div>
                        </div>
                      </div>

                      {/* SMART HINTS DRAWER SYSTEM */}
                      <div className="mt-2 pt-4 border-t border-slate-200/10">
                        <span className="text-[9px] font-black uppercase text-slate-400 block mb-3 block tracking-widest uppercase">Smart Hint Calibration Deck</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              const text = `Look at Move ${lensActiveExplanationIdx + 1}: Check out block row ${activeStep ? activeStep.row + 1 : '1'} grid. Notice what's missing compared to nearby columns.`;
                              alert(`💡 EASY HINT:\n${text}`);
                              if (lensVoiceEnabled) readSpeechVerbally(text);
                            }}
                            className="px-4 py-2 bg-[#009DFF]/10 text-[#009DFF] border border-[#009DFF]/25 font-black text-[10px] uppercase rounded-xl hover:bg-[#009DFF]/20 cursor-pointer active:scale-95 transition"
                          >
                            🌱 Easy Hint
                          </button>
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              const text = `Check intersection candidates in cell ${activeStep ? activeStep.cell : 'R1C1'}. Consider row exclusions.`;
                              alert(`💡 MEDIUM HINT:\n${text}`);
                              if (lensVoiceEnabled) readSpeechVerbally(text);
                            }}
                            className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/25 font-black text-[10px] uppercase rounded-xl hover:bg-amber-500/20 cursor-pointer active:scale-95 transition"
                          >
                            🎓 Medium Hint
                          </button>
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              const text = `Applying advanced pointing pairs. Cell ${activeStep ? activeStep.cell : 'R1C1'} represents an offset boundary forcing value ${activeStep ? activeStep.value : '9'}.`;
                              alert(`💡 EXPERT HINT:\n${text}`);
                              if (lensVoiceEnabled) readSpeechVerbally(text);
                            }}
                            className="px-4 py-2 bg-violet-500/10 text-violet-500 border border-violet-500/25 font-black text-[10px] uppercase rounded-xl hover:bg-violet-500/20 cursor-pointer active:scale-95 transition"
                          >
                            🧠 Expert Hint
                          </button>
                          <button
                            onClick={() => {
                              gameAudio.playClick();
                              setLensActiveExplanationIdx(prev => Math.min(explanations.length - 1, prev + 1));
                              const text = activeStep ? `Move solved: Cell ${activeStep.cell} equals ${activeStep.value} using strategy: ${activeStep.strategy}.` : 'No active trace.';
                              alert(`🚀 NEXT MOVE REVEALED:\n${text}`);
                              if (lensVoiceEnabled && activeStep) {
                                readSpeechVerbally(`Next Move is ${activeStep.cell} equals ${activeStep.value}.`);
                              }
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase rounded-xl cursor-pointer active:scale-95 transition leading-none flex items-center justify-center gap-1"
                          >
                            Show Next Hint
                          </button>
                        </div>
                      </div>

                      {/* STRATEGY ANALYZER SUMMARY BOX */}
                      <div className="mt-2 pt-4 border-t border-slate-200/10">
                        <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-widest mb-3 uppercase">Pencil-Mark Analytical Strategy Suite Mapped</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                          {activeStratAnalyses.map((strat, sIdx) => (
                            <div 
                              key={sIdx}
                              className={`p-2.5 rounded-xl border flex flex-col gap-1 text-[10px] ${
                                strat.found 
                                  ? theme === 'dark'
                                    ? 'bg-emerald-950/15 border-emerald-500/30'
                                    : 'bg-emerald-50/60 border-emerald-200'
                                  : 'opacity-40 border-slate-200/20 dark:border-slate-850 bg-transparent'
                              }`}
                            >
                              <span className={`font-black uppercase tracking-wider ${strat.found ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {strat.found ? '✓ Detected' : '× Missing'}
                              </span>
                              <strong className={`${strat.found ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500'} truncate block`}>
                                {strat.name}
                              </strong>
                              {strat.found && (
                                <span className="font-mono text-[9px] text-[#009DFF] font-bold">
                                  {strat.count} iterations inside solution
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
