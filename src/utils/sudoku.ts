/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellState, DifficultyLevel } from '../types';

// Converts numeric value (1-9) to character based on game mode with dynamic character set localization
export function getCellDisplay(value: number, isLetterMode: boolean): string {
  if (value === 0) return '';
  const lang = typeof localStorage !== 'undefined' ? (localStorage.getItem('skudo_lang') || 'en') : 'en';

  if (lang === 'bn') {
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const bnLetters = ['', 'ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ'];
    return isLetterMode ? bnLetters[value] : bnNums[value];
  }
  if (lang === 'hi') {
    const hiNums = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const hiLetters = ['', 'क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ'];
    return isLetterMode ? hiLetters[value] : hiNums[value];
  }
  if (lang === 'ar') {
    const arNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const arLetters = ['', 'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د'];
    return isLetterMode ? arLetters[value] : arNums[value];
  }
  if (lang === 'ja') {
    const jaNums = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
    const jaLetters = ['', 'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク'];
    return isLetterMode ? jaLetters[value] : jaNums[value];
  }
  if (lang === 'zh') {
    const zhNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const zhLetters = ['', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬'];
    return isLetterMode ? zhLetters[value] : zhNums[value];
  }

  if (isLetterMode) {
    return String.fromCharCode(64 + value); // 1 -> A, 9 -> I
  }
  return String(value);
}

// Localize any number or compound numeric string (like '4/9' or 'ELO: 1200') to targeted languages
export function localizeNumber(num: number | string): string {
  const str = String(num);
  const lang = typeof localStorage !== 'undefined' ? (localStorage.getItem('skudo_lang') || 'en') : 'en';

  if (lang === 'bn') {
    const bnNums: Record<string, string> = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return str.split('').map(char => bnNums[char] || char).join('');
  }
  if (lang === 'hi') {
    const hiNums: Record<string, string> = {
      '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
    };
    return str.split('').map(char => hiNums[char] || char).join('');
  }
  if (lang === 'ar') {
    const arNums: Record<string, string> = {
      '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤', '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };
    return str.split('').map(char => arNums[char] || char).join('');
  }
  if (lang === 'ja') {
    const jaNums: Record<string, string> = {
      '0': '０', '1': '１', '2': '２', '3': '３', '4': '４', '5': '５', '6': '６', '7': '７', '8': '８', '9': '９'
    };
    return str.split('').map(char => jaNums[char] || char).join('');
  }
  if (lang === 'zh') {
    const zhNums: Record<string, string> = {
      '0': '零', '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九'
    };
    return str.split('').map(char => zhNums[char] || char).join('');
  }
  return str;
}

// Generate a valid, completely solved Sudoku board
function solveSudokuHelper(grid: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        // Shuffle numbers 1-9 for randomized board generation
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const num of nums) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudokuHelper(grid)) {
              return true;
            }
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function isValidPlacement(grid: number[][], row: number, col: number, val: number): boolean {
  for (let i = 0; i < 9; i++) {
    // Check row conflict
    if (grid[row][i] === val && i !== col) return false;
    // Check column conflict
    if (grid[i][col] === val && i !== row) return false;
  }

  // Check 3x3 box conflict
  const boxRowStart = Math.floor(row / 3) * 3;
  const boxColStart = Math.floor(col / 3) * 3;
  for (let r = boxRowStart; r < boxRowStart + 3; r++) {
    for (let c = boxColStart; c < boxColStart + 3; c++) {
      if (grid[r][c] === val && (r !== row || c !== col)) {
        return false;
      }
    }
  }

  return true;
}

// Generates a fully solved Sudoku board
export function generateSolvedBoard(): number[][] {
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudokuHelper(grid);
  return grid;
}

// Generates an interactive game grid based on difficulty level
export function generatePuzzle(difficulty: DifficultyLevel): {
  solved: number[][];
  puzzle: number[][];
} {
  const solved = generateSolvedBoard();
  
  // Create copy of solved board
  const puzzle = solved.map(row => [...row]);

  // Determine number of clues/cells to keep
  // Standard Sudoku has 81 total cells
  let cluesToRemove = 30; // default for Zen
  switch (difficulty) {
    case 'zen':
      cluesToRemove = 22; // very easy (about 59 clues left)
      break;
    case 'flow':
      cluesToRemove = 38; // easy-medium (about 43 clues left)
      break;
    case 'focus':
      cluesToRemove = 50; // medium-hard (about 31 clues left)
      break;
    case 'quantum':
      cluesToRemove = 58; // expert challenge (about 23 clues left)
      break;
  }

  // Randomly remove clues while ensuring a responsive generation
  let removed = 0;
  // We can choose positions randomly and clear them
  const cellPositions: { r: number; c: number }[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cellPositions.push({ r, c });
    }
  }
  
  // Shuffle positions
  cellPositions.sort(() => Math.random() - 0.5);

  for (let i = 0; i < cluesToRemove && i < cellPositions.length; i++) {
    const { r, c } = cellPositions[i];
    puzzle[r][c] = 0;
  }

  return { solved, puzzle };
}

// Converts a primitive double array puzzle to detailed state cells
export function initializeBoard(
  puzzle: number[][],
  solved: number[][]
): CellState[][] {
  const board: CellState[][] = [];
  const size = puzzle.length;
  for (let r = 0; r < size; r++) {
    const rowCells: CellState[] = [];
    for (let c = 0; c < size; c++) {
      const val = puzzle[r][c];
      rowCells.push({
        row: r,
        col: c,
        value: val,
        correctValue: solved[r] ? solved[r][c] : 0,
        isGiven: val !== 0,
        candidates: [],
        hasError: false,
      });
    }
    board.push(rowCells);
  }
  return board;
}

export function isValidPlacementForVariant(
  grid: number[][],
  row: number,
  col: number,
  val: number,
  variant: string
): boolean {
  const size = grid.length;

  // 1. Standard Row/Col check
  for (let i = 0; i < size; i++) {
    if (grid[row][i] === val && i !== col) return false;
    if (grid[i][col] === val && i !== row) return false;
  }

  // 2. Regional / Block check
  if (variant === 'jigsaw' && size === 9) {
    const JIGSAW_REGIONS = [
      [0, 0, 0, 1, 1, 1, 2, 2, 2],
      [0, 3, 3, 3, 1, 4, 4, 4, 2],
      [0, 3, 5, 5, 5, 5, 5, 4, 2],
      [0, 3, 6, 6, 6, 7, 5, 4, 2],
      [8, 8, 8, 6, 7, 7, 7, 7, 2],
      [8, 1, 8, 6, 6, 7, 3, 3, 3],
      [8, 1, 1, 1, 6, 4, 3, 5, 5],
      [8, 8, 4, 4, 4, 4, 3, 3, 5],
      [8, 7, 7, 7, 5, 5, 5, 5, 5]
    ];
    const regionId = JIGSAW_REGIONS[row][col];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (JIGSAW_REGIONS[r][c] === regionId && (r !== row || c !== col)) {
          if (grid[r][c] === val) return false;
        }
      }
    }
  } else {
    // Standard modular blocks based on sizes
    let blockH = 3;
    let blockW = 3;
    if (size === 6) {
      blockH = 2;
      blockW = 3;
    } else if (size === 4) {
      blockH = 2;
      blockW = 2;
    } else if (size === 16) {
      blockH = 4;
      blockW = 4;
    }

    const startR = Math.floor(row / blockH) * blockH;
    const startC = Math.floor(col / blockW) * blockW;
    for (let r = startR; r < startR + blockH; r++) {
      for (let c = startC; c < startC + blockW; c++) {
        if (grid[r][c] === val && (r !== row || c !== col)) return false;
      }
    }
  }

  // 3. Diagonal / Sudoku X constraint
  if (variant === 'xsudoku' || variant === 'diagonal') {
    if (row === col) {
      // Main diagonal
      for (let i = 0; i < size; i++) {
        if (grid[i][i] === val && i !== row) return false;
      }
    }
    if (row + col === size - 1) {
      // Anti diagonal
      for (let i = 0; i < size; i++) {
        if (grid[i][size - 1 - i] === val && i !== row) return false;
      }
    }
  }

  // 4. Overlap / Windoku constraint
  if (variant === 'windoku' || variant === 'hyper') {
    // Helper to evaluate if in standard Windoku regions
    const getWindokuBox = (r: number, c: number): number => {
      if (r >= 1 && r <= 3 && c >= 1 && c <= 3) return 1;
      if (r >= 1 && r <= 3 && c >= 5 && c <= 7) return 2;
      if (r >= 5 && r <= 7 && c >= 1 && c <= 3) return 3;
      if (r >= 5 && r <= 7 && c >= 5 && c <= 7) return 4;
      return 0;
    };

    const wBox = getWindokuBox(row, col);
    if (wBox > 0) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (getWindokuBox(r, c) === wBox && (r !== row || c !== col)) {
            if (grid[r][c] === val) return false;
          }
        }
      }
    }
  }

  // 5. Anti-Knight Chess constraint
  if (variant === 'anti_knight') {
    const knightOffsets = [
      [-1, -2], [-2, -1], [-2, 1], [-1, 2],
      [1, -2], [2, -1], [2, 1], [1, 2]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (grid[nr][nc] === val) return false;
      }
    }
  }

  // 6. Anti-King adjacency constraint
  if (variant === 'anti_king') {
    const kingOffsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    for (const [dr, dc] of kingOffsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (grid[nr][nc] === val) return false;
      }
    }
  }

  return true;
}

export function generateVariantPuzzle(variant: string, difficulty: DifficultyLevel): {
  solved: number[][];
  puzzle: number[][];
} {
  // Determine grid size
  let size = 9;
  if (variant === 'mini') size = 6;
  if (variant === 'mega') size = 16;

  const solved = Array.from({ length: size }, () => Array(size).fill(0));

  // Backtracking solver helper for the given size and constraints
  function solve(grid: number[][]): boolean {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) {
          const nums = Array.from({ length: size }, (_, idx) => idx + 1).sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValidPlacementForVariant(grid, r, c, num, variant)) {
              grid[r][c] = num;
              if (solve(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // Pre-fill some cells to ensure rapid solving and diversity
  solve(solved);

  // Copy solved board
  const puzzle = solved.map(row => [...row]);

  // Determine clues to remove based on difficulty
  let cluesToRemove = 30;
  if (variant === 'mini') {
    cluesToRemove = difficulty === 'zen' ? 10 : difficulty === 'flow' ? 14 : difficulty === 'focus' ? 18 : 22;
  } else if (variant === 'mega') {
    cluesToRemove = difficulty === 'zen' ? 100 : difficulty === 'flow' ? 130 : difficulty === 'focus' ? 160 : 180;
  } else {
    // 9x9 size
    cluesToRemove = difficulty === 'zen' ? 22 : difficulty === 'flow' ? 38 : difficulty === 'focus' ? 50 : 58;
  }

  const cellPositions: { r: number; c: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      cellPositions.push({ r, c });
    }
  }
  cellPositions.sort(() => Math.random() - 0.5);

  let removedCount = 0;
  for (let i = 0; i < cellPositions.length; i++) {
    const { r, c } = cellPositions[i];
    // Keep enough clues for playability
    puzzle[r][c] = 0;
    removedCount++;
    if (removedCount >= cluesToRemove) {
      break;
    }
  }

  return { solved, puzzle };
}
