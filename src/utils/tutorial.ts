/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TutorialLesson {
  id: string;
  title: string;
  difficulty: string;
  desc: string;
  steps: string[];
}

export const TUTORIALS: TutorialLesson[] = [
  {
    id: 'scanning',
    title: 'Row and Column Scanning',
    difficulty: 'Novice',
    desc: 'The single most important technique. Narrow down where a number can go by checking the lines that cross your 3x3 box.',
    steps: [
      'Focus on a number (e.g. 5) that appears multiple times in nearby 3x3 grids.',
      'Check the rows and columns that already contain that number - it cannot reappear in those lines.',
      'Look at the blank cells in your target 3x3 box that do not sit on those lines.',
      'If only one blank cell remains, place your number there!'
    ],
  },
  {
    id: 'single_candidate',
    title: 'Naked Singles',
    difficulty: 'Casual',
    desc: 'Sometimes, looking inside a grid cell reveals that there is exactly ONE number remaining that does not conflict with its row, column, or box.',
    steps: [
      'Select a blank cell next to mostly-completed regions.',
      'Examine its row: see what numbers are already written (e.g., 1, 2, 4, 5, 8).',
      'Examine its column: look for numbers written there (e.g. 3, 6, 9).',
      'Examine its box: look for any missing values (e.g. 7).',
      'If 1 to 9 except 7 are already visible, then 7 is a "Naked Single" and must be placed here!'
    ],
  },
  {
    id: 'pencil_marking',
    title: 'Pencil Marks / Notes Mode',
    difficulty: 'Experienced',
    desc: 'Toggle Candidate notes key to scribble possibilities in blank cells. Crucial for expert difficulty where numbers cannot be guessed.',
    steps: [
      'Turn on the [Notes Mode] (pencil indicator) at the bottom toolbar.',
      'Pick a blank cell and click candidate numbers representing possibilities.',
      'As you place other numbers on the board, candidate notes will update.',
      'Erase candidates once you deduce they are invalid, keeping the grid clean.'
    ],
  },
  {
    id: 'naked_pairs',
    title: 'Symmetrical Naked Pairs',
    difficulty: 'Expert',
    desc: 'When two cells in the same row, column, or box can only contain the exact same two candidates, those two values can be eliminated from all other cells in that zone.',
    steps: [
      'Find two cells in a row/box that contain ONLY [2, 5] as candidates.',
      'Therefore, 2 and 5 must occupy those two cells in some order.',
      'Therefore, no other cells in that same row or box can possibly contain 2 or 5.',
      'Scribble out 2 and 5 from any other notes in that row/box to simplify your board.'
    ],
  },
];
