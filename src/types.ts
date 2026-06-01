/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExperienceLevel =
  | 'Never Played'
  | 'Beginner'
  | 'Casual Player'
  | 'Experienced'
  | 'Expert'
  | 'Master';

export interface DifficultyStats {
  wins: number;
  losses: number;
  perfectWins: number;
  bestTime?: number; // in seconds
  perfectBestTime?: number; // in seconds
  bestScore?: number;
}

export interface PlayerProfile {
  name: string;
  experience: ExperienceLevel;
  totalGames: number;
  completedGames: number;
  highestScore: number;
  totalTime: number; // in seconds
  streak: number;
  xp: number;
  achievements: string[];
  email?: string;
  isGoogle?: boolean;
  avatarUrl?: string;
  difficultyStats?: Record<DifficultyLevel, DifficultyStats>;
}

export type GameMode = 'numbers' | 'letters';

export type DifficultyLevel = 'zen' | 'flow' | 'focus' | 'quantum';

export interface CellState {
  row: number;
  col: number;
  value: number; // Current value displayed (0 = empty, 1-9)
  correctValue: number; // Solution value (1-9)
  isGiven: boolean; // Initial cell?
  candidates: number[]; // Pencil marks/notes (1-9)
  hasError: boolean; // Flagged as incorrect input
}

export interface GameStats {
  score: number;
  level: number;
  timer: number; // in seconds
  mistakes: number;
  maxMistakes: number;
  progress: number; // completion % (correct placements / total blank cells)
  completionPercentage: number;
}

export interface HistoryState {
  board: CellState[][];
  mistakes: number;
  score: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  time: number;
  difficulty: DifficultyLevel;
  mode: GameMode;
  date: string;
}

export interface DailyChallenge {
  date: string;
  completed: boolean;
  score: number;
  difficulty: DifficultyLevel;
  mode: GameMode;
}
