/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellState, DifficultyLevel } from '../types';

// Converts numeric value (1-9) to character based on game mode
export function getCellDisplay(value: number, isLetterMode: boolean): string {
  if (value === 0) return '';
  if (isLetterMode) {
    return String.fromCharCode(64 + value); // 1 -> A, 9 -> I
  }
  return String(value);
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
  for (let r = 0; r < 9; r++) {
    const rowCells: CellState[] = [];
    for (let c = 0; c < 9; c++) {
      const val = puzzle[r][c];
      rowCells.push({
        row: r,
        col: c,
        value: val,
        correctValue: solved[r][c],
        isGiven: val !== 0,
        candidates: [],
        hasError: false,
      });
    }
    board.push(rowCells);
  }
  return board;
}
