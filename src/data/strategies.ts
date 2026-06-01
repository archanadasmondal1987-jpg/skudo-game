export interface SudokuStrategy {
  id: string;
  index: number;
  name: string;
  category: 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master' | 'Grandmaster' | 'Extreme' | 'Computer';
  badgeColor: string;
  shortDesc: string;
  explanation: string;
  steps: string[];
  example: string;
}

export const SUDOKU_STRATEGIES: SudokuStrategy[] = [
  // 🟢 Beginner Strategies (1-4)
  {
    id: 's1',
    index: 1,
    name: 'Naked Single',
    category: 'Beginner',
    badgeColor: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
    shortDesc: 'Only one possible number can fit in a specific cell when you cross-reference its row, column, and 3x3 box.',
    explanation: 'A Naked Single occurs when a cell has all candidate digits but one eliminated because those other 8 digits already exist in its row, column, or box. It is the absolute core of Sudoku scanning.',
    steps: [
      'Focus on a single empty cell.',
      'List all numbers already present in its row, column, and 3x3 box.',
      'If 8 different digits are present, the remaining digit must be placed in this cell.'
    ],
    example: 'Cell R3C4 (Row 3, Col 4):\n• Row 3 has: 1, 2, , 4, 5, 6, , 8, 9\n• Col 4 has: 3, , 4, , 7, 8, 2, 5, 1\n• Box 2 has: 1, 2, 8, 9, 5, 6, 4, 3\n• Combined eliminated: {1, 2, 3, 4, 5, 6, 7, 8, 9} excluding {4}\n• Result: R3C4 must be 4!'
  },
  {
    id: 's2',
    index: 2,
    name: 'Hidden Single',
    category: 'Beginner',
    badgeColor: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
    shortDesc: 'A candidate number can only physically fit in one cell within a given row, column, or 3x3 box, even if that cell has other candidate notes written in it.',
    explanation: 'Even if a cell is filled with multiple candidate pencil marks, if a specific digit (e.g. 5) has only one legal cell inside that entire unit (row, col, or box), then it MUST go there.',
    steps: [
      'Select a unit (e.g., Row 5).',
      'Scan every empty cell in that unit and examine where candidate digit "x" can go.',
      'If only one cell has candidate "x" listed, lock it in immediately, discarding other drafts!'
    ],
    example: 'In Row 7:\n• R7C1 candidates: {1, 2, 6}\n• R7C2 candidates: {2, 6, 9}\n• R7C5 candidates: {3} (Only place for 3 in Row 7!)\n• Result: Place 3 at R7C5.'
  },
  {
    id: 's3',
    index: 3,
    name: 'Full House',
    category: 'Beginner',
    badgeColor: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
    shortDesc: 'When a row, column, or 3x3 box is entirely filled except for one single empty cell.',
    explanation: 'This is the easiest strategy. You are one cell away from completing a complete row, column, or box. The missing number can be found immediately by checking which of the digits 1-9 is absent.',
    steps: [
      'Identify a column or row with exactly one white coordinate remaining.',
      'Count existing digits 1 through 9 inside that set.',
      'The missing single digit is instantly written in.'
    ],
    example: 'Box 9 has:\n• Cells: 1, 2, 3, 4, 5, 6, 7, 8, [ ]\n• Missing: 9\n• Result: Place 9 in the remaining cell.'
  },
  {
    id: 's4',
    index: 4,
    name: 'Last Remaining Cell',
    category: 'Beginner',
    badgeColor: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
    shortDesc: 'A basic elimination technique in boxes where adjacent rows and columns block a digit from all but one cell.',
    explanation: 'By scanning parallel line entries of a number in neighboring boxes, you can cross-hatch or rule out cells in the target box, leaving exactly one valid place left.',
    steps: [
      'Look at digit x in Box 1 and Box 2.',
      'Notice how their rows block those entire rows in Box 3.',
      'Verify that only one slot is left in Box 3 for digit x.'
    ],
    example: 'For digit 8 in Box 3:\n• Row 1 has 8 (blocks R1 in Box 3)\n• Row 2 has 8 (blocks R2 in Box 3)\n• Col 7 has 8 (blocks C7 in Box 3)\n• Result: Place 8 in remaining empty slot R3C8.'
  },

  // 🔵 Easy Strategies (5-7)
  {
    id: 's5',
    index: 5,
    name: 'Locked Candidate (Pointing)',
    category: 'Easy',
    badgeColor: 'border-sky-500 bg-sky-500/10 text-sky-500',
    shortDesc: 'When all candidates for a digit inside a 3x3 box lie strictly within a single row or column.',
    explanation: 'Since the digit MUST be placed in that box, and can only go along that line, that absolute number can be safety erased as a candidate from the rest of that entire row or column outside the box.',
    steps: [
      'Look at Box 4. Let candidate 6 appear only in Row 4 cells inside that box.',
      'State that 6 MUST go in Box 4 in Row 4.',
      'Erase candidate 6 from Row 4 cells in Box 5 and Box 6.'
    ],
    example: 'In Box 1, candidate 7 is only in R2C2 and R2C3:\n• Therefore, 7 must be in Row 2 within Box 1.\n• Elimination: Clean candidate 7 from R2C4, R2C5, R2C9!'
  },
  {
    id: 's6',
    index: 6,
    name: 'Locked Candidate (Claiming)',
    category: 'Easy',
    badgeColor: 'border-sky-500 bg-sky-500/10 text-sky-500',
    shortDesc: 'Within a row or column, all occurrences of a candidate digit are confined to a single 3x3 box.',
    explanation: 'This is the inverse of Pointing. If a candidate in a row only appears inside one box, that digit must occupy that box on that line, and can be removed from all other cells in that same box.',
    steps: [
      'Scan Row 2 for candidate 9.',
      'Notice that all cells in Row 2 containing 9 reside in Box 2.',
      'Delete 9 from all other cells in Box 2 that are not in Row 2.'
    ],
    example: 'Row 3 has candidate 2 only in R3C7 and R3C8 (which is in Box 3):\n• Result: Erase candidate 2 from R1C7, R2C8, and R2C9 in Box 3.'
  },
  {
    id: 's7',
    index: 7,
    name: 'Box-Line Reduction',
    category: 'Easy',
    badgeColor: 'border-sky-500 bg-sky-500/10 text-sky-500',
    shortDesc: 'A general formulation of line-box interactions to prune candidate clutter early on.',
    explanation: 'When a candidate is restricted to a line segment in a box, block-cell exclusion triggers. This allows the removal of candidates in connected lines across adjacent blocks.',
    steps: [
      'Observe overlapping lines between adjacent box groups.',
      'Highlight candidate occurrences in matching quadrants.',
      'Wipeout outstanding notes on parallel axis vectors.'
    ],
    example: 'R4C1 and R5C1 contain the only spots for 4 in Column 1.\n• Result: Remove 4 from all other spots inside Box 4.'
  },

  // 🟡 Intermediate Strategies (8-17)
  {
    id: 's8',
    index: 8,
    name: 'Naked Pair',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'Two cells in the same row, column, or box contain exactly the same two candidates and no others.',
    explanation: 'Because those two digits must fill those two specific cells (in some order), those two candidates cannot exist anywhere else in that row, column, or box unit.',
    steps: [
      'Locate two cells in a column that only contain candidate notes {2, 7}.',
      'Confirm they contain no other candidates.',
      'Safely discard 2 and 7 from all other cells in that column.'
    ],
    example: 'In Box 5:\n• R5C4 has {3, 5}\n• R5C6 has {3, 5}\n• Result: Clean candidates 3 and 5 from R4C4, R4C5, R6C6, etc.'
  },
  {
    id: 's9',
    index: 9,
    name: 'Hidden Pair',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'Two digits appear only in two cells within a unit, but are buried under other candidate numbers.',
    explanation: 'Since the two hidden numbers must occupy these two cells, you can safely eliminate all other candidates from these two specific cells, leaving only the pristine pair.',
    steps: [
      'Scan Row 9 for occurrences of digits 4 and 8.',
      'Notice they only can go in cells R9C3 and R9C7 (which also have candidates 1, 2, 5).',
      'Clean 1, 2, and 5 from R9C3 and R9C7. Only {4, 8} remains.'
    ],
    example: 'Row 1 cells R1C4 and R1C9 have many candidates, but 5 and 7 appear ONLY in those two cells.\n• Elimination: Remove other candidates from R1C4 and R1C9.'
  },
  {
    id: 's10',
    index: 10,
    name: 'Naked Triple',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'Three cells in a unit contain a total of three candidates grouped across them.',
    explanation: 'The three cells can have combinations like {1,2}, {2,3}, {1,3} or {1,2,3}. Since these three numbers are locked within three cells, you can delete them from all other cells in that unit.',
    steps: [
      'Find three cells in Row 1 having values within {1, 5, 8}.',
      'Check that no other cell contains these three digits.',
      'Erase candidates 1, 5, and 8 from all other cells in Row 1.'
    ],
    example: 'R4C1 has {4, 7}, R4C2 has {7, 9}, R4C3 has {4, 9}:\n• Notice the collective set is {4, 7, 9} inside Box 4.\n• Elimination: Erase 4, 7, 9 from all other Box 4 cells!'
  },
  {
    id: 's11',
    index: 11,
    name: 'Hidden Triple',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'Three digits appear in only three cells within a unit, disguised by other candidates.',
    explanation: 'Since the three digits must occupy those three cells, you can discard all other candidates from those three cells, locking them down to the hidden trio.',
    steps: [
      'Scan a unit for three digits that appear only in three cells.',
      'Validate that these three numbers do not occur anywhere else in the unit.',
      'Eliminate all other candidate numbers from these three cells.'
    ],
    example: 'In Column 3, digits 2, 5, 9 appear only in R1C3, R4C3, R7C3.\n• Result: Strip all other candidates from these three coordinates.'
  },
  {
    id: 's12',
    index: 12,
    name: 'Naked Quad',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'Four cells in a unit contain combinations of the same four candidate digits.',
    explanation: 'Similar to triples, if four cells in a row/col/box have candidates subsetting from {1,3,5,6}, you can erase those four candidates from the rest of that unit.',
    steps: [
      'Find four cells in Column 6 containing subsets of {2, 4, 7, 8}.',
      'Verify they are restricted to those four coordinates.',
      'Erase candidates 2, 4, 7, and 8 from Column 6.'
    ],
    example: 'R1C6 {2,4}, R2C6 {4,7}, R3C6 {7,8}, R5C6 {2,8}.\n• Elimination: Remove 2, 4, 7, 8 from Column 6.'
  },
  {
    id: 's13',
    index: 13,
    name: 'Hidden Quad',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'Four digits appear only in four cells inside a row, column, or box, hidden under other candidates.',
    explanation: 'By proving that four numbers can only go in four coordinates, you can clear all other notes from those four cells.',
    steps: [
      'Locate four distinct numbers appearing only in four cells of a unit.',
      'Ensure they have no presence in other cells of that unit.',
      'Erase all accompanying candidates from those four cells.'
    ],
    example: 'In Box 1, numbers {1, 3, 6, 8} appear only in R1C1, R1C2, R2C1, R2C2.\n• Result: Clear all other drafts from these four cells immediately.'
  },
  {
    id: 's14',
    index: 14,
    name: 'X-Wing',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'Four cells forming a rectangle across two rows and two columns contain a specific candidate.',
    explanation: 'If a candidate exists only twice in Row 2 (at columns 3 and 8) and only twice in Row 7 (at columns 3 and 8), the candidate MUST fall in opposite corners of the rectangle. Hence, you can erase that candidate from all other cells in Column 3 and Column 8.',
    steps: [
      'Look for candidate x appearing exactly twice in Row A at Col C1 and Col C2.',
      'Look for the same candidate x appearing exactly twice in Row B at Col C1 and Col C2.',
      'Erase candidate x from all other cells in columns C1 and C2.'
    ],
    example: 'Candidate 5 is in R2C2, R2C7 and R8C2, R8C7.\n• Result: Columns 2 and 7 must hold 5s strictly on these rows. Clear 5s from R3C2, R4C2, R5C7, etc.'
  },
  {
    id: 's15',
    index: 15,
    name: 'Simple Coloring',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'Coloring candidates in conjugate pairs (only two in a unit) with two alternating colors to find contradictions.',
    explanation: 'By alternate-coloring a single candidate digit across dual paths (A and B), we scan for cells that see both styles or rows with overlapping identical colors, triggering logical elimination.',
    steps: [
      'Identify a candidate digit that has "strong links" (occurs exactly twice in a unit).',
      'Assign alternating colors (e.g. blue and green) to connected nodes.',
      'If any uncolored cell sees both colors, or two of cell color see each other, delete that candidate.'
    ],
    example: 'Coloring candidate 4. R1C1 is Blue, R1C5 is Green:\n• Cell R4C1 sees Blue (via R1C1) and Green (via R4C5).\n• Result: Erase candidate 4 from R4C1!'
  },
  {
    id: 's16',
    index: 16,
    name: 'Multi-Coloring',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'An extension of Coloring where multiple separate chains of conjugate pairs are linked together.',
    explanation: 'If multiple disconnected chains for a specific digit exist, they can be merged by finding cells that link the colored sets, exposing wider grid-wide contradictions.',
    steps: [
      'Create multiple color maps (Blue/Green, Yellow/Red).',
      'Look for weak links bridging the networks.',
      'Validate state overlapping to delete redundant values.'
    ],
    example: 'Chain 1 has Blue node, Chain 2 has Red node. If they overlap at R9C9, execute deletion.'
  },
  {
    id: 's17',
    index: 17,
    name: 'Remote Pairs',
    category: 'Intermediate',
    badgeColor: 'border-amber-500 bg-amber-500/10 text-amber-500',
    shortDesc: 'A chain of cells containing the exact same pair of candidates linked across rows and columns.',
    explanation: 'If you have a path of identical pairs (e.g. {3, 8}) of even lengths (4, 6, 8...), the first and last cells in the line MUST have opposite values. Thus, any coordinate seeing both ends cannot contain either 3 or 8.',
    steps: [
      'Trace cells with identical pairs (e.g. R1C1 {2,9} -> R1C9 {2,9} -> R9C9 {2,9} -> R9C1 {2,9}).',
      'Count the links. If it is an even chain (4 steps), the terminals are opposite.',
      'Erase 2 and 9 from any cell that intersects both terminals.'
    ],
    example: 'Terminals are R1C1 {2,5} and R4C4 {2,5} (chain length 4).\n• Result: Delete 2 and 5 from R1C4 and R4C1.'
  },

  // 🟠 Advanced Strategies (18-30)
  {
    id: 's18',
    index: 18,
    name: 'Swordfish',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'A three-dimensional extension of X-Wing, where a candidate occurs in at most three rows and three matching columns.',
    explanation: 'When exactly three columns (or rows) have candidates for a number in at most three rows (or columns) in total, that number is locked into those intersections. All other instances in those rows/cols can be purged.',
    steps: [
      'Locate three columns having candidates for a digit on identical three rows.',
      'Assert that the digit must fall on the intersections.',
      'Clean candidates from all other cells in those three rows.'
    ],
    example: 'For candidate 3, Columns {2, 5, 8} have 3s only in Rows {1, 4, 9}:\n• Result: Delete 3 from all other cells in Rows 1, 4, and 9!'
  },
  {
    id: 's19',
    index: 19,
    name: 'Jellyfish',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'A four-dimensional candidate grid alignment over four matching rows and columns.',
    explanation: 'If exactly four rows are restricted to having a candidate inside the same matching four columns, those digits are mathematically locked. Candidates outside those sets can be wiped.',
    steps: [
      'Find 4 lines with candidates bounded in 4 cross-lines.',
      'Check alignment integrity.',
      'Erase candidate occurrences outside intersection quadrants.'
    ],
    example: 'Columns {1,3,5,7} matched with Rows {2,4,6,8} over candidate 6.\n• Result: Clean all other 6s along the column vectors.'
  },
  {
    id: 's20',
    index: 20,
    name: 'Finned X-Wing',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'An X-Wing strategy where one corner has "fins" (extra candidates) inside the same 3x3 box.',
    explanation: 'If the fins are true, they eliminate candidates. If they are false, the standard X-Wing triggers and eliminates them. Either way, any cell that sees both the fins and the opposite pincer row can have the value removed.',
    steps: [
      'Establish a standard X-Wing grid pattern.',
      'Identify 1 or 2 extra candidates (fins) in one sector box.',
      'Delete the target candidate from cells seeing both the fin cells and the baseline pincer.'
    ],
    example: 'X-Wing corners are R1C1, R1C8, R8C1, R8C8, with a fin at R1C2.\n• Result: Safe to delete the value from R8C2.'
  },
  {
    id: 's21',
    index: 21,
    name: 'Finned Swordfish',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'A Swordfish pattern with additional extra candidate "fins" in a box corner.',
    explanation: 'By using finned logic on a 3x3 alignment, you solve complex layout locks without guessing, keeping deductive structures perfectly sound.',
    steps: [
      'Find a 3x3 Swordfish framework.',
      'Identify the cluster of fin cells complicating the outline.',
      'Perform targeted candidate cleaning in matching cell views.'
    ],
    example: 'A 3-column swordfish has extra candidate 9 at R4C4 in Box 5.\n• Result: Erase 9 from other Box 5 cells seeing both R4C4 and the pincers.'
  },
  {
    id: 's22',
    index: 22,
    name: 'Sashimi X-Wing',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'A modified Finned X-Wing where a critical corner of the rectangle is missing its native candidate.',
    explanation: 'Sashimi logic checks if removing the corner element completely still forces the elimination via the fin cell box, showing how isolated notes impact adjacent regions.',
    steps: [
      'Identify an X-Wing outline where a vertex cell does not have the candidate.',
      'Confirm the presence of a fin block nearby.',
      'Clean target candidates intersecting both the Sashimi fin and the opposing side.'
    ],
    example: 'X-Wing with missing corner at R1C8, with fin at R1C2.\n• Result: Remove candidate from R8C2.'
  },
  {
    id: 's23',
    index: 23,
    name: 'Sashimi Swordfish',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'A Sashimi-style Swordfish with incomplete corner components but active fin cells.',
    explanation: 'By proving that the underlying Swordfish is still active through external chains, you can unlock grid lockouts in extreme settings.',
    steps: [
      'Trace Swordfish segments having missing intersection points.',
      'Locate compensating candidate groupings.',
      'Apply subtraction rules on the target axis.'
    ],
    example: 'Sashimi Swordfish for digit 4. Deduct 4 from intersecting cells.'
  },
  {
    id: 's24',
    index: 24,
    name: 'Skyscraper',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'Two parallel lines have exactly two candidates for a digit, where one side is aligned and the other side is offset.',
    explanation: 'Because one pair of candidates aligns perfectly, and the other does not, either one of the offset endpoints must contain that digit. Therefore, any cell seeing BOTH endpoints cannot contain that digit.',
    steps: [
      'Find two columns having only two occurrences of candidate x.',
      'Verify they align on one row (e.g., Row 1) but are offset on another row (e.g., Row 4 and Row 5).',
      'Erase candidate x from any cell that sees both offset cells.'
    ],
    example: 'Columns 3 and 7 have candidate 8 at R2C3 & R5C3, and R2C7 & R6C7:\n• R2C3 and R2C7 align. Offset nodes are R5C3 and R6C7.\n• Result: Delete 8 from R5C7 and R6C3 (cells in view of both!).'
  },
  {
    id: 's25',
    index: 25,
    name: 'Two-String Kite',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'A dual line-branch strategy linking a row, column, and a single box.',
    explanation: 'Inside a box (e.g. Box 1), a candidate appears twice in Row A and twice in Col B. This creates a virtual kite shape. At the ends of these "strings", one must contain the digit, allowing clean deletions.',
    steps: [
      'Select a box where candidate x appears only in one row segment and one column segment.',
      'Trace those paths down the row and column lines outside the box.',
      'Erase candidate x from the cell where the row string and column string intersect.'
    ],
    example: 'Box 1 has candidate 1 at R3C1 & R3C3, and R1C3 & R3C3.\n• Row string goes down Row 3; Col string goes along Column 3.\n• Result: Delete 1 at the intersection cell R3C9 or matching coordinates.'
  },
  {
    id: 's26',
    index: 26,
    name: 'Empty Rectangle',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'Using the bounding box of a 3x3 sector to prove candidate distributions across intersected rows.',
    explanation: 'By scanning a 3x3 box where a candidate is confined to a horizontal and vertical line (forming an L-shape or cross), you can project an elimination onto external cells.',
    steps: [
      'Locate a box with candidate x in L-shape formation.',
      'Trace a conjugate link from another column pointing into the box.',
      'Delete the candidate at the intersection of the conjugate line and the box-row.'
    ],
    example: 'Box 2 holds candidates for 9 in a L-shape. Conjugate link at Column 8.\n• Result: Remove 9 from R1C8.'
  },
  {
    id: 's27',
    index: 27,
    name: 'Turbot Fish',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'A 5-link single-digit loop that uses three strong links and two weak links.',
    explanation: 'This chain forces a logical contradiction. If either endpoint is true, the target cells must be false. You can eliminate the candidate at the overlap.',
    steps: [
      'Track a candidate with exact coordinate chains.',
      'Verify the alternating link structure (Strong -> Weak -> Strong -> Weak -> Strong).',
      'Remove the candidate from the node closing the loop.'
    ],
    example: 'Candidate 7 in loop R2C2 -> R2C8 -> R6C8 -> R6C1 -> R2C2.\n• Result: Erase 7 from R6C2.'
  },
  {
    id: 's28',
    index: 28,
    name: 'W-Wing',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'Two identical pairs (e.g. {2,5}) are connected by a strong link of one of their candidates in an external unit.',
    explanation: 'Because of the strong link, one of those identical cells must contain the other digit. Therefore, you can erase that other digit from any cell that sees both identical cells.',
    steps: [
      'Find two identical cells containing {3, 9}.',
      'Locate a strong link on candidate 3 in an unrelated unit connecting them.',
      'Erase candidate 9 from any cell in direct view of both {3, 9} cells.'
    ],
    example: 'Identical cells at R1C1 and R5C5. Column 8 has a strong link on 3 at R1C8 and R5C8.\n• Result: Delete 9 from any coordinate that intersects both R1C1 and R5C5 (like R5C1).'
  },
  {
    id: 's29',
    index: 29,
    name: 'M-Wing',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'A variant of W-Wing that links an identical pair with an active pointing candidate.',
    explanation: 'Uses a mix of strong conjugates and line-box pointing to create elimination zones for the wing candidate.',
    steps: [
      'Locate identical {4,8} cells.',
      'Map pointing vectors from Row A.',
      'Cut conflicting 8s along the pincer paths.'
    ],
    example: 'Elimination of candidate 8 from R1C4 using M-Wing links.'
  },
  {
    id: 's30',
    index: 30,
    name: 'Split Wing',
    category: 'Advanced',
    badgeColor: 'border-orange-500 bg-orange-500/10 text-orange-500',
    shortDesc: 'Three bi-value cells form a branching chain where one central cell acts as a hinge.',
    explanation: 'By splitting candidate links on the hinge cell, you assert that at least one wing must contain a shared value. Thus, you can prune that value in mutual locations.',
    steps: [
      'Find bi-value cells with overlapping numbers.',
      'Verify the central coordinate hinge connects both wings.',
      'Perform deduction on overlapping vectors.'
    ],
    example: 'Wings {2,3} at R1C1 and {3,4} at R1C9 and hinge {2,4} at R9C1.\n• Result: Remove 3 from R9C9.'
  },

  // 🔴 Expert Strategies (31-43)
  {
    id: 's31',
    index: 31,
    name: 'XY-Wing',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'A triangle of three bi-value cells sharing one pivot cell (XY) and two pincer cells (XZ, YZ).',
    explanation: 'Whichever value (X or Y) the pivot cell takes, one of the two pincer cells is forced to be Z. Therefore, any cell that can see both pincers can safely have candidate Z deleted.',
    steps: [
      'Find pivot cell with candidates {5, 8}.',
      'Find pincer A with {5, 9} and pincer B with {8, 9} in line of sight.',
      'Delete candidate 9 from all cells seeing both pincer cells.'
    ],
    example: 'Pivot R1C1 {1,2}, Pincers at R1C9 {1,3} & R9C1 {2,3}:\n• Common digit in pincers is 3.\n• Result: Delete 3 from R9C9 (which sees both R1C9 and R9C1!).'
  },
  {
    id: 's32',
    index: 32,
    name: 'XYZ-Wing',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'Similar to XY-Wing, but the pivot cell has three candidates {X, Y, Z} instead of two.',
    explanation: 'Since the pivot has three candidates, if it takes Z, the target cell is false. If it takes X or Y, one of the pincers is forced to be Z. Therefore, cells seeing both the pivot and both pincers cannot contain Z.',
    steps: [
      'Find pivot with {2, 3, 5}.',
      'Find pincer A with {2, 5} and pincer B with {3, 5}.',
      'Remove candidate 5 from cells seeing all three cells.'
    ],
    example: 'Pivot {1,2,3} at R1C1, Pincers at R1C2 {1,3} and R2C1 {2,3}.\n• Result: Clear 3 from R2C2.'
  },
  {
    id: 's33',
    index: 33,
    name: 'WXYZ-Wing',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'A 4-cell wing strategy involving four shared candidates.',
    explanation: 'Uses a group of four cells having combinations of W, X, Y, Z to isolate and eliminate the Z candidate in overlapping regions.',
    steps: [
      'Locate 4 cells having subsets of {1, 2, 3, 4}.',
      'Isolate strong links on the pivot coordinates.',
      'Erase candidate 4 in mutual cells.'
    ],
    example: 'WXYZ nodes at R1C1, R1C2, R3C1, R3C3.\n• Result: Remove 1 from R1C3.'
  },
  {
    id: 's34',
    index: 34,
    name: 'VWXYZ-Wing',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'A massive 5-cell wing strategy that locks five candidates in mutual balance.',
    explanation: 'A highly complex expert technique where 5 bi-value or tri-value cells form a network that eliminates candidates in multiple boxes.',
    steps: [
      'Collect five coordinates representing five integers.',
      'Validate alignment.',
      'Perform systemic subtraction.'
    ],
    example: 'VWXYZ elements at Box 1 cells. Erase 7 from R2C3.'
  },
  {
    id: 's35',
    index: 35,
    name: 'ALS-XZ',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'Almost Locked Sets (ALS) linked by a restricted candidate (X) and an elimination candidate (Z).',
    explanation: 'An Almost Locked Set is a group of N cells with exactly N+1 candidates. If you link two ALS groups with matching logic, you can perform extreme candidate deletions.',
    steps: [
      'Find two separate Almost Locked Sets (ALS A and ALS B).',
      'Locate the "restricted" digit X linking them together.',
      'Clean Z candidates in overlapping cells seeing all targets.'
    ],
    example: 'ALS A {1,2,3} at R1C1-R1C2; ALS B {3,4,5} at R5C3-R5C4.\n• Result: Clear 3 or 5 from intersecting vectors.'
  },
  {
    id: 's36',
    index: 36,
    name: 'ALS-XY Wing',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'A wing structure where standard bi-value cells are replaced by entire ALS sets.',
    explanation: 'By treating whole sets of cells in a virtual state as a single "Super Cell", you scale the wing elimination to handle quantum-level boards.',
    steps: [
      'Identify three Almost Locked Sets acting as Pivot, Pincer A, and Pincer B.',
      'Assert connections between the sets.',
      'Deduct core values from cells seeing the pincer borders.'
    ],
    example: 'ALS XY-Wing for candidate 2. Clear 2 from R9C9.'
  },
  {
    id: 's37',
    index: 37,
    name: 'Death Blossom',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'An advanced ALS structure branching off a single stem cell containing several candidates.',
    explanation: 'If a cell has multiple candidates {A, B, C}, connecting an ALS to each candidate branches options. Since one must be true, you eliminate overlapping candidates seen by all branch endpoints.',
    steps: [
      'Find a stem cell with candidates (e.g. R4C4 with {3, 5}).',
      'For candidate 3, map ALS A. For candidate 5, map ALS B.',
      'Discard common values from any cell that sees all terminal digits.'
    ],
    example: 'Stem cell contains {1,4}. Branching ALS chains overlap over 7.\n• Result: Eliminate 7 from R4C1.'
  },
  {
    id: 's38',
    index: 38,
    name: 'Sue de Coq',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'A highly specialized intersection technique locking candidates in a line-box intersection.',
    explanation: 'When cells in the intersection of a row/col and a box contain candidates that align in exact symmetry with other cells in that line and box, a multi-set lock is triggered.',
    steps: [
      'Locate cells in a box-line intersection.',
      'Add cells from that box and that line to form a matching lock.',
      'Clean intersecting candidates from both that line and box.'
    ],
    example: 'Sue de Coq pattern in Box 2 and Row 2.\n• Result: Safe to delete extra candidates {1, 5, 8} from surrounding cells.'
  },
  {
    id: 's39',
    index: 39,
    name: 'Aligned Pair Exclusion',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'Excluding combinations of pairs inside two cells by analyzing box logic integrations.',
    explanation: 'By proving that certain dual digit combinations (e.g., placing 4 at R1C1 and 5 at R1C2) are impossible, you prune individual cell possibilities.',
    steps: [
      'Examine two unfilled aligned cells.',
      'Validate if combination XY causes instant grid failure in adjacent units.',
      'Remove the faulty numbers from candidate drafts.'
    ],
    example: 'Pair {1,3} at R1C1 and R1C2 cannot be {1,3} simultaneously.\n• Result: Erase candidates accordingly.'
  },
  {
    id: 's40',
    index: 40,
    name: 'Aligned Triple Exclusion',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'Scaling the pair exclusion to block tri-value arrangements across three coordinates.',
    explanation: 'An extremely calculation-heavy human solver method where placing three specific values causes an overlapping box collision, forcing the elimination of individual notes.',
    steps: [
      'Track 3 cells in matching quadrants.',
      'Simulate placement outcomes.',
      'Delete impossible combinations.'
    ],
    example: 'Erase 9 from R5C5 after simulating tri-exclusions.'
  },
  {
    id: 's41',
    index: 41,
    name: 'Almost Locked Sets (ALS)',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'A collection of N cells containing N+1 candidates in a closed unit.',
    explanation: 'This is the basic foundation of high-level expert deductive chains. An ALS behaves like a loaded gun—if any candidate is chosen, the rest form a locked chain.',
    steps: [
      'Find 3 cells having 4 candidates total.',
      'Confirm they occur inside a single row/col/box.',
      'Use this set as a pivot node in alternating chains.'
    ],
    example: 'ALS found at R2C2, R2C3 containing {1, 3, 5}.'
  },
  {
    id: 's42',
    index: 42,
    name: 'Grouped ALS',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'A variation of ALS involving grouped cells acting as a singular block.',
    explanation: 'Allows branching connections by linking ALS groups which share dual pointing properties.',
    steps: [
      'Map standard ALS groups.',
      'Connect them with pointing cells.',
      'Perform multi-candidate reduction on intersecting slots.'
    ],
    example: 'Clear candidate 4 from R4C1.'
  },
  {
    id: 's43',
    index: 43,
    name: 'ALS Chains',
    category: 'Expert',
    badgeColor: 'border-red-500 bg-red-500/10 text-red-500',
    shortDesc: 'Linking multiple Almost Locked Sets together to create a massive ring of eliminations.',
    explanation: 'Alternates options across several ALS clusters. Deciding any starting cell ripples a complete elimination across the entire board.',
    steps: [
      'Plot ALS sets as vertices.',
      'Link vertices with conjugate links.',
      'Discard candidate elements from overlap zones.'
    ],
    example: 'Complex network of 3 ALS nodes allows deletion of 6 from R9C9.'
  },

  // 🟣 Master Strategies (44-55)
  {
    id: 's44',
    index: 44,
    name: 'Nice Loops',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'A set of cells connected by alternating strong and weak links forming a closed circular loop.',
    explanation: 'In a Nice Loop, you map candidate outcomes. If a loop is fully consistent, any external candidates breaching strong link limits are dynamically deleted.',
    steps: [
      'Map candidate notes using directional links.',
      'Form a closed loop with alternating line segments.',
      'Clean excess candidates at loop intersection points.'
    ],
    example: 'Nice Loop formed: R1C1 -> R1C9 -> R5C9 -> R5C1 -> R1C1.\n• Result: Remove 5 from R5C5.'
  },
  {
    id: 's45',
    index: 45,
    name: 'Continuous Nice Loop',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'A perfect Nice Loop where every weak link is effectively promoted to a strong link.',
    explanation: 'Allows wide-scale multi-cell candidate wiping, because selecting any cell triggers a complete binary system of equations across all coordinates.',
    steps: [
      'Construct a Nice Loop.',
      'Ensure every link is fully conjugate on both ends.',
      'Wipeout candidates on all containing columns.'
    ],
    example: 'Continuous cycle deletes 8 from R7C7.'
  },
  {
    id: 's46',
    index: 46,
    name: 'Discontinuous Nice Loop',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'A Nice Loop where the alternating pattern breaks at a single cell (the offset node).',
    explanation: 'This break of pattern reveals a solid state. If it says "if A is true, then A is false", then A MUST be false! It is the ultimate loop contradiction solver.',
    steps: [
      'Trace link loops.',
      'Locate the offset node where the loop link styles conflict.',
      'Lock in the cell\'s value or eliminate its candidates immediately.'
    ],
    example: 'Discontinuous conflict at R1C1. Lock R1C1 to 3!'
  },
  {
    id: 's47',
    index: 47,
    name: 'AIC (Alternating Inference Chains)',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'The general master solver technique grouping multi-candidate interactions across several boxes.',
    explanation: 'AIC works on truth evaluations: if a link is false, the next is true. By linking cells where candidates are bi-value, you create logical bridges that span the whole grid.',
    steps: [
      'Locate strong and weak chains across different digits.',
      'Verify chain continuity rules.',
      'Check endpoints and delete matching values from overlapping areas.'
    ],
    example: 'AIC path has endpoints with digit 5. Erase 5 from overlapping cells.'
  },
  {
    id: 's48',
    index: 48,
    name: 'Grouped AIC',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'Alternating Inference Chains where some nodes are entire groups/lines of cells.',
    explanation: 'By incorporating L-shapes or boxes as nodes in the chain, you create group links that skip over blank zones.',
    steps: [
      'Model AIC coordinates.',
      'Introduce boxed regions as single nodes.',
      'Erase candidate occurrences.'
    ],
    example: 'Erase 8 from R4C4.'
  },
  {
    id: 's49',
    index: 49,
    name: 'Dynamic Chains',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'Chains that dynamically update valid candidates as simulation paths branch.',
    explanation: 'By calculating conditional steps, you build a tree of states to prove deep exclusions.',
    steps: [
      'Select a cell candidate.',
      'Trace branching effects.',
      'Delete candidates that fail to support any branches.'
    ],
    example: 'Erase 3 from R1C1.'
  },
  {
    id: 's50',
    index: 50,
    name: 'Forcing Chains',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'Proving that a specific cell candidate leads to the same exact outcome regardless of which path is taken.',
    explanation: 'If a bi-value cell {3, 9} is processed. If it is 3, R9C9 is 5. If it is 9, R9C9 is still 5. Thus, R9C9 is guaranteed to be 5!',
    steps: [
      'Select pivot cell.',
      'Calculate paths for all its candidates.',
      'Any coordinate that evaluates to the same value on all paths is instantly solved.'
    ],
    example: 'Lock cell R5C6 to 2 using forcing chains.'
  },
  {
    id: 's51',
    index: 51,
    name: 'Nishio',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'A simplified form of Forcing Chains targeting a single candidate.',
    explanation: 'Ask: "If I place candidate x in this cell, does it make it impossible to place digit x in another box?". If yes, candidate x is deleted from the source cell.',
    steps: [
      'Assume a candidate is placed.',
      'Scan the board to see if that digit is completely locked out of a neighboring unit.',
      'Erase that candidate from the source cell if a conflict is triggered.'
    ],
    example: 'Delete 4 from R1C1 because placing it forces a contradiction in Box 5.'
  },
  {
    id: 's52',
    index: 52,
    name: 'Cell Forcing Chains',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-555/10 text-fuchsia-500',
    shortDesc: 'A forcing chain branching off several candidate values in a single cell.',
    explanation: 'By proving that every single candidate in a target cell forces another cell to take a specific state, you solve the latter.',
    steps: [
      'Select a tri-value cell.',
      'Branch forcing paths.',
      'Resolve the target cell.'
    ],
    example: 'Solve cells inside Box 9.'
  },
  {
    id: 's53',
    index: 53,
    name: 'Region Forcing Chains',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'Forcing chains starting from all possible configurations of a digit in a region.',
    explanation: 'Instead of focusing on a cell, you verify all cells in a row/col where digit x can go. If they all force one result, lock it.',
    steps: [
      'Select Column 2 which has 2 spots for 7.',
      'Trace paths from both options.',
      'Solve coordinates where both lines agree.'
    ],
    example: 'Lock R9C9 to 8.'
  },
  {
    id: 's54',
    index: 54,
    name: 'Digit Forcing Chains',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'Chains proving digit-locking dependencies across the grid.',
    explanation: 'A highly complex looping mechanism that evaluates digit linkages to resolve expert-level bottlenecks.',
    steps: [
      'Trace linkages of digit x.',
      'Evaluate strong and weak paths.',
      'Erase invalid candidates.'
    ],
    example: 'Delete 3 from R1C1.'
  },
  {
    id: 's55',
    index: 55,
    name: 'Bidirectional Cycles',
    category: 'Master',
    badgeColor: 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500',
    shortDesc: 'Closed cycles where logical implications can flow both clockwise and counter-clockwise.',
    explanation: 'This high synergy proves the absolute states of all nodes in the cycle, solving entire circles of cells in one go.',
    steps: [
      'Locate closed loops.',
      'Verify dual clockwise/counterclockwise implications.',
      'Lock in the values for all cells in the path.'
    ],
    example: 'Solve R2C2, R2C8, and R8C2 in one cyclic sweep.'
  },

  // ⚫ Grandmaster Strategies (56-68)
  {
    id: 's56',
    index: 56,
    name: 'Kraken Fish',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Linking a standard multi-row Fish strategy (like Swordfish) with external AIC chains.',
    explanation: 'When a Fish strategy is almost perfect but blocked, you connect the overlapping cell with an external alternating chain. Since one of them must be true, you eliminate candidates from the overlap zone.',
    steps: [
      'Find a Fish skeleton (e.g. Swordfish) that is incomplete.',
      'Map external AIC lines starting from the anomalous block.',
      'Deduct matching values where the fish limbs and the chain intersect.'
    ],
    example: 'Kraken Swordfish on candidate 1. Delete 1 from R4C4.'
  },
  {
    id: 's57',
    index: 57,
    name: 'Kraken X-Wing',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'An X-Wing connected to a logical Kraken chain.',
    explanation: 'Integrates pincer cells via external branching paths to resolve locked candidates on expert boards.',
    steps: [
      'Locate X-Wing base.',
      'Chain out of the fin node.',
      'Erase candidates on overlapping sections.'
    ],
    example: 'Deduct 4 from R6C2.'
  },
  {
    id: 's58',
    index: 58,
    name: 'Kraken Swordfish',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'A massive 3-row Kraken alignment for grandmaster deductions.',
    explanation: 'Allows wide-scale candidate pruning on multiple lines concurrently.',
    steps: [
      'Map 3-line Swordfish coordinates.',
      'Link external chains to resolve the gills.',
      'Verify deductions.'
    ],
    example: 'Eliminate 6 from R1C1.'
  },
  {
    id: 's59',
    index: 59,
    name: 'Kraken Jellyfish',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'A 4-row Kraken grid linkage of extreme difficulty.',
    explanation: 'One of the ultimate classic Sudoku strategies before computer brute forcing.',
    steps: [
      'Align 4 columns and rows.',
      'Launch Kraken analysis branches.',
      'Erase redundant items.'
    ],
    example: 'Erase 9 from R8C8.'
  },
  {
    id: 's60',
    index: 60,
    name: 'Kraken Finned Fish',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Solving finned geometries by linking them with Kraken AIC nodes.',
    explanation: 'Uses a mix of fins and Kraken loops to handle extremely dense candidate grids.',
    steps: [
      'Identify finned layouts.',
      'Chain across regions.',
      'Remove candidates.'
    ],
    example: 'Remove 5 from R4C4.'
  },
  {
    id: 's61',
    index: 61,
    name: 'Dynamic Forcing Nets',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Nets that trace multi-candidate implications across multiple rows/cols simultaneously.',
    explanation: 'Instead of linear chains, you model a complete network of implications to isolate contradictions.',
    steps: [
      'Map multi-linking clusters.',
      'Build validation state logic arrays.',
      'Eliminate failure pathways.'
    ],
    example: 'Prune 2 from R5C5.'
  },
  {
    id: 's62',
    index: 62,
    name: 'Contradiction Chains',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Long chains designed strictly to force a logical collapse in a remote box.',
    explanation: 'Allows players to trace a path of logic. If placing 4 at R1C1 means 4 is also forced into R9C9 when R9C9 already has a 4, R1C1 cannot be 3!',
    steps: [
      'Select branch element.',
      'Trace implications.',
      'Delete starting candidate if a collision occurs.'
    ],
    example: 'Delete 7 from R3C3.'
  },
  {
    id: 's63',
    index: 63,
    name: 'Nested Chains',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Chains where individual links are itself entire sub-chains.',
    explanation: 'A highly advanced logical recursion method mapping dependencies inside dependencies.',
    steps: [
      'Establish baseline chain.',
      'Integrate internal branch sub-chains.',
      'Perform deduction.'
    ],
    example: 'Lock cell R1C4 to 5.'
  },
  {
    id: 's64',
    index: 64,
    name: 'Multi-Color Nets',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Simultaneous overlapping color maps covering all 9 digits to find a global lock.',
    explanation: 'Unifies individual simple coloring tracks into a single matrix mapping grid connections.',
    steps: [
      'Map coloring lines across multiple digits.',
      'Validate overlaps.',
      'Prune target candidates.'
    ],
    example: 'Erase 8 from R7C1.'
  },
  {
    id: 's65',
    index: 65,
    name: 'Grouped Nets',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Grouped cells interconnected to make dynamic forcing networks.',
    explanation: 'Complex multi-unit reduction technique used to crack the hardest human tournament grids.',
    steps: [
      'Map grouped cells.',
      'Trace link nets.',
      'Unlock blocked cells.'
    ],
    example: 'Lock R9C1 to 9.'
  },
  {
    id: 's66',
    index: 66,
    name: 'Pattern Overlay Method (POM)',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Analyzing all remaining possible templates of a digit to find intersections of truth.',
    explanation: 'If a digit has only 6 possible layout combinations for the remaining unfilled cells, and 5 of them have 4 at R1C1, you can prune the remaining candidates.',
    steps: [
      'Draft all possible templates.',
      'Find overlap trends.',
      'Remove non-conforming items.'
    ],
    example: 'Clean 3 from Column 3 cells.'
  },
  {
    id: 's67',
    index: 67,
    name: 'Template Elimination',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Excluding candidate configurations that fail to support a complete grid template.',
    explanation: 'By proving that certain locations fail to support any valid grid configurations, you delete them.',
    steps: [
      'Model template permutations.',
      'Find coordinates with 0 support.',
      'Clear their drafts.'
    ],
    example: 'Eliminate 6 from R1C1.'
  },
  {
    id: 's68',
    index: 68,
    name: 'Template Set Analysis',
    category: 'Grandmaster',
    badgeColor: 'border-slate-500 bg-slate-500/10 text-slate-400',
    shortDesc: 'Comparing templates across multiple digits to find linked constraints.',
    explanation: 'Maps inter-digit dependencies representing the ultimate peak of grandmaster logic.',
    steps: [
      'Cross reference templates.',
      'Calculate intersections.',
      'Erase candidates.'
    ],
    example: 'Clear values along Row 5.'
  },

  // 🔥 Extreme / Human Solver Elite (69-85)
  {
    id: 's69',
    index: 69,
    name: 'Exocet',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Double-cell configurations in Box 1 and Box 2 mirroring candidates across target columns.',
    explanation: 'Exocet locks candidates using complex geometry to perform multi-digit elimination at the end boundaries.',
    steps: [
      'Locate base cells in Box A.',
      'Map target lines pointing into Box B.',
      'Clean candidates from non-mirror cells.'
    ],
    example: 'Exocet active. Erase 4 from R9C9.'
  },
  {
    id: 's70',
    index: 70,
    name: 'Junior Exocet',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'A simplified Exocet pattern mapping 3 core columns.',
    explanation: 'LocksMirror targets inside box boundaries.',
    steps: [
      'Identify junior exocet base.',
      'Pencil in mirror coordinates.',
      'Erase candidates.'
    ],
    example: 'Wipe values on R2C2.'
  },
  {
    id: 's71',
    index: 71,
    name: 'Senior Exocet',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'A massive exocet layout incorporating multi-candidate mirrors.',
    explanation: 'The peak of advanced geometry in human Sudoku solving.',
    steps: [
      'Form complete exocet lines.',
      'Track mirroring cells.',
      'Clean drafts on Column 1.'
    ],
    example: 'Erase 1 from R1C1.'
  },
  {
    id: 's72',
    index: 72,
    name: 'Franken Fish',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'A fish strategy where some rows/columns are replaced by 3x3 boxes.',
    explanation: 'Extends simple fish theory into 3D space by blending lines and boxes in the candidate equation.',
    steps: [
      'Map mixed line and box sets.',
      'Confirm alignment.',
      'Erase outer candidate items.'
    ],
    example: 'Franken Swordfish on 9. Clean 9 in Box 5.'
  },
  {
    id: 's73',
    index: 73,
    name: 'Mutant Fish',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'An asymmetric fish geometry mixing rows, columns, and boxes.',
    explanation: 'Extremely rare and complex technique used to prune candidate clutter on elite boards.',
    steps: [
      'Establish mutant alignments.',
      'Chart base dimensions.',
      'Deduct invalid values.'
    ],
    example: 'Erase 1 from R4C1.'
  },
  {
    id: 's74',
    index: 74,
    name: 'Franken X-Wing',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'X-Wing where one axis has been morphed into a 3x3 box.',
    explanation: 'Solves complex region gaps where traditional lines do not align.',
    steps: [
      'Setup Franken framework.',
      'Identify box hinge.',
      'Perform reduction.'
    ],
    example: 'Clean 6 from Column 2.'
  },
  {
    id: 's75',
    index: 75,
    name: 'Franken Swordfish',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Franken geometry over 3 rows using mixed layouts.',
    explanation: 'Forces elimination of overlapping digits where normal Swordfish logic is blocked.',
    steps: [
      'Configure fish segments.',
      'Link tracking boxes.',
      'Perform targeted deletions.'
    ],
    example: 'Erase 2 from R1C4.'
  },
  {
    id: 's76',
    index: 76,
    name: 'Mutant Swordfish',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Asymmetric 3-step mutant fish structure.',
    explanation: 'A highly creative, calculation-intensive deduction path.',
    steps: [
      'Track base mutant lines.',
      'Connect target corners.',
      'Confirm elimination.'
    ],
    example: 'Wipe 7 from R9C9.'
  },
  {
    id: 's77',
    index: 77,
    name: 'Franken Jellyfish',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Extreme 4x4 Franken alignment.',
    explanation: 'Forces large block deletions under extreme quantum difficulties.',
    steps: [
      'Coordinate Franken lines.',
      'Assert intersection zones.',
      'Remove redundant drafts.'
    ],
    example: 'Clean 5 from Column 5.'
  },
  {
    id: 's78',
    index: 78,
    name: 'Mutant Jellyfish',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Asymmetric 4x4 mutant fish layout.',
    explanation: 'Highly complex pattern representing the utter peak of human logical scanning.',
    steps: [
      'Trace mutant base columns.',
      'Cross reference row sets.',
      'Subtract outer cells.'
    ],
    example: 'Wipe 3 from R5C5.'
  },
  {
    id: 's79',
    index: 79,
    name: 'ALS Death Blossom',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Almost Locked Sets mapped into stem cells to form massive blossom deletions.',
    explanation: 'Locks bi-value terminals in complete logical synchrony across the whole grid.',
    steps: [
      'Draft stem cells.',
      'Map ALS petals.',
      'Prune target candidates from overlapping areas.'
    ],
    example: 'Clear candidate 6 from R3C3.'
  },
  {
    id: 's80',
    index: 80,
    name: 'ALS Forcing Chains',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Forcing chains spanning entire Almost Locked Sets.',
    explanation: 'By proving that every single option inside an ALS forces a value down the line, we resolve remote cells.',
    steps: [
      'Select starting ALS.',
      'Trace imply chain loops.',
      'Verify the destination lock.'
    ],
    example: 'Solve cell R2C2.'
  },
  {
    id: 's81',
    index: 81,
    name: 'Complex AIC Networks',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'A massive web of alternating chains grouping several different digits.',
    explanation: 'A highly advanced web that handles complex cases by mapping multi-digit constraints.',
    steps: [
      'Plot multi-digit connections.',
      'Map paths.',
      'Clean intersecting values.'
    ],
    example: 'Prune 8 from R1C1.'
  },
  {
    id: 's82',
    index: 82,
    name: 'Digit Templates',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Analyzing overlapping templates to isolate candidate locks.',
    explanation: 'A human solver method mapping out grid-wide patterns for a single number.',
    steps: [
      'Examine digit layout models.',
      'Identify template collisions.',
      'Delete conflicting items.'
    ],
    example: 'Clear 4 from Box 7.'
  },
  {
    id: 's83',
    index: 83,
    name: 'Cell Templates',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Mapping template constraints on cell-centered values.',
    explanation: 'Traces multi-cell relations to find clean deductive paths.',
    steps: [
      'Trace cell parameters.',
      'Build templates.',
      'Perform pruning.'
    ],
    example: 'Erase 6 from R2C2.'
  },
  {
    id: 's84',
    index: 84,
    name: 'Region Templates',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Proving regional limitations to accelerate deduction.',
    explanation: 'Unifies multiple box and line rules into a single structural deduction.',
    steps: [
      'Coordinate regions.',
      'Map templates.',
      'Clean candidates.'
    ],
    example: 'Wipe values on Row 9.'
  },
  {
    id: 's85',
    index: 85,
    name: 'Advanced Exclusion Logic',
    category: 'Extreme',
    badgeColor: 'border-rose-500 bg-rose-500/10 text-rose-500',
    shortDesc: 'Complex grid-wide deduction resolving candidate bottlenecks.',
    explanation: 'Aligns several expert and master theories to solve high-difficulty boards.',
    steps: [
      'Map grid bottlenecks.',
      'Deploy custom exclusion filters.',
      'Perform complete grid pruning.'
    ],
    example: 'Solve cells inside Box 5.'
  },

  // 🤖 Computer-Level Techniques (86-95)
  {
    id: 's86',
    index: 86,
    name: 'Dancing Links (Algorithm X)',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'Donald Knuth\'s elegant algorithm translating Sudoku into an Exact Cover matrix solved via double-linked lists.',
    explanation: 'Algorithm X operates by representing cell row, column, block, and value choices as a massive sparse binary grid, then using backtracking and pointer removals (Dancing Links) to find exact covers instantly.',
    steps: [
      'Transform the 9x9 Sudoku into a 729 x 324 Exact Cover matrix.',
      'Deploy four intersecting constraint rules.',
      'Run Knuth\'s Algorithm X using circular DLL pointers (up, down, left, right) to prune nodes.'
    ],
    example: 'Computer processing takes 0.05 milliseconds.\n• Matrix dimensions: 729 rows, 324 columns \n• Result: Instantly delivers a single unique solution!'
  },
  {
    id: 's87',
    index: 87,
    name: 'Backtracking',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'A systematic trial-and-error search algorithm that tests digit placements and backtracks on failure.',
    explanation: 'Classic recursive DFS search. It fills cells one by one. If it breaks a rule, it steps back and tries the next number, guaranteeing a solution through complete tree traversal.',
    steps: [
      'Focus on the first empty coordinate.',
      'Attempt to place digit 1. If valid, recursively proceed to next cell.',
      'If a duplicate is hit down the line, revert (backtrack) and try digit 2.'
    ],
    example: 'Simulation tree:\n• Try 1 at R1C1 (success) -> Try 2 at R1C2 (success) -> Try 3 at R1C3 (fail!)\n• Backtrack R1C2 -> try 4 and continue!'
  },
  {
    id: 's88',
    index: 88,
    name: 'Recursive Search',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'A DFS traversal approach that breaks the board into smaller matrix segments.',
    explanation: 'Similar to backtracking, but optimized using branch-and-bound logic to solve boards extremely fast.',
    steps: [
      'Formulate recursive search states.',
      'Deploy quick pruning filters to cut dead branches early.',
      'Deliver final resolved array.'
    ],
    example: 'DFS tree depth: 81 levels.'
  },
  {
    id: 's89',
    index: 89,
    name: 'Constraint Propagation',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'Solving cells by continually propagation of constraint rules to shrink search space.',
    explanation: 'By treating each cell as a variable with a domain {1-9}, the system runs arc-consistency algorithms (like AC-3) to propagate exclusions.',
    steps: [
      'Model cells as domain variables.',
      'Propagate row, column, and box constraints dynamically.',
      'Solve variables when domains shrink to size 1.'
    ],
    example: 'AC-3 solver loops: 4 iterations. Resolved domains.'
  },
  {
    id: 's90',
    index: 90,
    name: 'Exact Cover Matrix',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'The mathematical grid model representing exact-subset covering criteria.',
    explanation: 'The foundation model for high speed digital solving, mapping cell-and-digit states to columns to prove uniqueness.',
    steps: [
      'Set columns for the 4 constraint types.',
      'Populate matrix rows with the 729 choices.',
      'Examine orthogonal spaces.'
    ],
    example: 'Sparse matrix containing 2,916 entries.'
  },
  {
    id: 's91',
    index: 91,
    name: 'SAT Solver Methods',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'Converting the Sudoku grid into Boolean Satisfiability clauses solved via modern DPLL engines.',
    explanation: 'Translate cell constraints into CNF formulas. If a cell contains x, it is represented as a true/false literal, compiling the game into logic gates.',
    steps: [
      'Convert 9x9 board into CNF formulas with boolean variables.',
      'Load statements into a SAT engine (like MiniSAT).',
      'Engine resolves clause states instantly.'
    ],
    example: 'Variables: 729. Clauses: ~8,000. Resolved in 0.002 seconds.'
  },
  {
    id: 's92',
    index: 92,
    name: 'Graph Theory Analysis',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'Representing Sudoku as a vertex coloring problem over an 81-node graph.',
    explanation: 'By building a graph where every cell is a node, and edges connect cells in the same row/col/box. The puzzle is solved when the graph gets a valid 9-coloring.',
    steps: [
      'Build graph of 81 vertices.',
      'Draw edges between connected slots.',
      'Solve graph 9-coloring constraints.'
    ],
    example: 'Vertices: 81. Edges: 810. Colored.'
  },
  {
    id: 's93',
    index: 93,
    name: 'Brute Force Search',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'Pure computing search evaluating all numerical array permutations.',
    explanation: 'Tests every number without intelligent logic. Extremely fast on computers but impossible for humans.',
    steps: [
      'Start at R1C1.',
      'Test numbers sequentially.',
      'Backtrack immediately on edge failures.'
    ],
    example: 'Evaluates millions of states in microseconds.'
  },
  {
    id: 's94',
    index: 94,
    name: 'Probabilistic Search',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'Using Monte Carlo or simulated annealing algorithms to converge onto a solution.',
    explanation: 'By defining an energy function based on duplicates, the computer starts with randomized fully populated boards, then swaps cells to minimize grid energy to zero.',
    steps: [
      'Initialize randomized completed blocks.',
      'Define an energy score checking duplication levels.',
      'Apply temperature annealing swaps to reach zero duplications.'
    ],
    example: 'Iterations: 450. Temp: 0.05. Energy: 0. Successfully resolved.'
  },
  {
    id: 's95',
    index: 95,
    name: 'Hybrid Human-AI Solving',
    category: 'Computer',
    badgeColor: 'border-purple-500 bg-purple-500/10 text-purple-500',
    shortDesc: 'Mixing human-friendly heuristics (like Swordfish) with raw computer speed search.',
    explanation: 'A balanced solver that attempts to solve the board using human techniques first, and only falls back to backtracking when extreme bottlenecks are hit.',
    steps: [
      'Scan current grid for Naked Singles and Pointing groups.',
      'Apply high-level chains if blocked.',
      'Use light recursive search to resolve complex cells.'
    ],
    example: 'Pristine blend of elegant heuristics and high-speed algorithms.'
  }
];
