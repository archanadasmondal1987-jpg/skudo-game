export interface HelpArticle {
  id: string;
  title: string;
  category: 'bug' | 'account' | 'guides' | 'popular' | 'rules' | 'technical';
  tag: string;
  popular?: boolean;
  content: string;
}

export const HELP_ARTICLES: HelpArticle[] = [
  // 1. POPULAR / GENERAL ARTICLES
  {
    id: 'pop-1',
    title: 'How Solver Logic Rating (ELO) is Calculated',
    category: 'popular',
    tag: 'POPULAR ARTICLE',
    popular: true,
    content: `Your Skudo Logic Rating or ELO mimics standard chess algorithms with custom mathematical adaptions for sudoku grids:
- **Difficulty Multipliers**: Zen wins award +50 points. Flow awards +100. Focus is +180, and Quantum yields a massive +320 points.
- **Speed Bonus**: Solving below the estimated baseline timer (e.g., 5 mins on Focus) scales up your score exponentially.
- **Pencil Marks & Assist Dampeners**: Completing puzzles without using any Hints or Mistake-Checks adds an additional 50% "True Decider" score premium.
- **Consecutive Streak Multipliers**: Maintaining a 5+ day streak applies a 1.2x ELO bonus to all new wins verified on the platform.`
  },
  {
    id: 'pop-2',
    title: 'Mastering Quantum Logic Difficulty Mode',
    category: 'popular',
    tag: 'POPULAR ARTICLE',
    popular: true,
    content: `Quantum mode represents the absolute pinnacle of Skudo logical complexity. 
- **The Constraints Grid**: Contains only 17 to 20 starting clues (the absolute mathematical minimum required for a unique valid Sudoku layout).
- **Subsystem Solvability**: Requires multi-depth logic techniques like "X-Chains", "Forcing Chains", and "Naked Quads". Standard scanning will not work.
- **Mistake Tolerance**: You are allowed only 2 mistakes before a neural reset occurs. Take your time, make extensive use of Candidate/Pencil Marks before confirmation.`
  },
  {
    id: 'pop-3',
    title: 'Sudoku 101: Absolute Basics for Beginners',
    category: 'guides',
    tag: 'GAME BASICS / INFO',
    popular: true,
    content: `Sudoku is a logic-based, combinatoric number-placement puzzle. The objective is to fill a 9×9 grid with digits so that each column, each row, and each of the nine 3×3 subgrids contains all of the digits from 1 to 9.
- **Scan Rows and Columns**: Look for areas where 1-9 digits are missing and map them against intersections.
- **Diagonal 3x3 Regions**: Every thick-ruled square box of 9 cells must have standard integers with no duplicates.
- **Elimination**: If a number is already present in a row or column, it is ruled out of all other unshaded boxes in that path.`
  },
  {
    id: 'pop-4',
    title: 'Smart Pencil Marks & Candidate Controls',
    category: 'guides',
    tag: 'GAME BASICS / INFO',
    popular: true,
    content: `Pencil marking (annotating active candidates) is essential for advanced play:
- **Toggle Pencil Mode**: Tap the pencil button or press spacebar to write potential possibilities into any selected empty tile.
- **Snyder Notation**: Only mark candidates when they have exactly two possible cells in a 3x3 diagonal region. If one is eliminated, the other is automatically resolved.
- **Full Candidate Listing**: For expert levels, list all candidates and eliminate them step-by-step using complex logical loops.`
  },
  {
    id: 'pop-5',
    title: 'Syncing Progress via Account Sync Key',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    popular: true,
    content: `Your profile, streaks, and customization items are synchronized in a custom cryptokey format string "SK-[XP]-[STREAK]":
1. **Locate Key**: Open Settings (top bar) and retrieve the Account Sync Key in your Profile section.
2. **Transfer Credentials**: Copy this key and paste it on another browser's Profile prompt to link game achievements.
3. **Data Conflict Resolution**: In case of differences, local highscores take precedence over server logs to protect offline streaks.`
  },

  // 2. BUG REPORTS (13 articles)
  {
    id: 'bug-1',
    title: 'Camera Permission Denied on iOS Safari/Chrome',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `If the Skudo Lens camera feature fails to initiate because of permission blocks on apple devices:
1. Go to iPhone **Settings** > **Safari** (or Chrome app details).
2. Scroll to "Camera" and change settings from "Ask" or "Deny" to **Allow**.
3. Reload the Skudo app tab and tap Skudo Lens again. Always confirm inside the system modal to grant access.`
  },
  {
    id: 'bug-2',
    title: 'Webcam OCR Fails in Low Contrast Lighting',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `Under low contrast, dark shadows, or skewed camera angles:
- **The Bug**: The computer vision neural tracing fails to identify corners of 9x9 paper worksheets.
- **The Solution**: Position the paper flatly under bright, overhead, indirect natural light. Ensure no camera shadow covers the puzzle grid. You can also crop the image on your computer before dropping it into our browser uploader.`
  },
  {
    id: 'bug-3',
    title: 'State Desync During High-Turn Undo Loops',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `When clicking the 'Undo' button past 25 times consecutively:
- **The Issue**: Transient memory indexes may lose sync with original pencil mark buffers.
- **The Solution**: Try making one valid cell modification. This resets the backward trace pointer to standard operational coordinates, flushing cumulative history logs without resetting your active difficulty rating.`
  },
  {
    id: 'bug-4',
    title: 'Offline Sandbox Calibration/Ingress Errors',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `If you lose your network connection and the AI Hints stop returning prompt answers:
- No worries, the core game and validations run 100% locally in your browser sandbox using persistent JS state matrices.
- The Gemini coach will resume interactive dialogues as soon as the browser connects back to any valid internet gateway.`
  },
  {
    id: 'bug-5',
    title: 'Touch Screen Double-Tap Grid Ghosting',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `On some high-refresh-rate mobile touch displays, rapid double-tapping on empty cells can trigger zoomed ghost selections.
- **Fix**: Open the platform Settings and ensure the browser zoom is locked at 100%. Alternatively, use single taps or select cell index coordinates on the horizontal coordinate helper.`
  },
  {
    id: 'bug-6',
    title: 'Custom Theme Toggle Flicker on WebKit Browsers',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `Certain iOS and MacOS Safari configurations showcase a flickering white splash when toggling the Dark Mode switch.
- **Workaround**: If this occurs, we recommend enabling your device system-wide dark mode. Our tailwind theme engine automatically syncs background sheets smoothly with system setups.`
  },
  {
    id: 'bug-7',
    title: 'Daily League Timer Countdown Glitch on Sleep Wake',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `When the computer sleeps with an active daily puzzle and wakes up hours later:
- The countdown clock might show negative integers.
- **Fix**: The system will auto-sync on your first logical placement. If it says "Out of sync", tap the "Auto-Correct Calibration" in the header to sync with global server clocks.`
  },
  {
    id: 'bug-8',
    title: 'Audio Synth Sound Latency in Bluetooth Headsets',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `Low-latency Bluetooth configurations can lag behind rapid number inputs:
- This is caused by the browser audio-context buffer delay during high-turn haptic chimes.
- **Workaround**: Set Audio Synth Sound to OFF in settings, or use wired headsets to experience high-definition tactile clicks instantly.`
  },
  {
    id: 'bug-9',
    title: 'Pencil Marks Overlapping Cell Borders in Safari',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `Safari versions below 16 occasionally compress grid cell overlays, pushing candidate pencil numbers across borders.
- **Fix**: Modern CSS containment features are utilized in Safari 16+. Zooming out slightly (95%) or updating your browser version solves this visual compression artifact permanently.`
  },
  {
    id: 'bug-10',
    title: 'Achievement Counter Failed to Update Instantly',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `Offline achievements are cached instantly in local memory but might take up to 2 seconds to appear with animations.
- **Fix**: Open and close the Achievements drawer/tab to force a state check on the cache, which guarantees synchronized badge updates.`
  },
  {
    id: 'bug-11',
    title: 'Haptic Feedback Failures on Android Chrome',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `Vibration effects rely on standard Android WebHaptic specifications:
- **Issue**: Standard power saving modes disable the 'navigator.vibrate' API automatically.
- **Workaround**: Disable your device's battery saver or ensure "Vibrate on Tap" is enabled both in Skudo Settings and Android system properties.`
  },
  {
    id: 'bug-12',
    title: 'Importing Corrupted PNG Board Images',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `When trying to import skewed or heavily distorted 9x9 PDF captures:
- The system OCR matrix might reject files with mismatched margins.
- **Fix**: Use our sample templates or crop your screens exactly around the outer square borders of the Sudoku puzzle before initiating a Lens verify.`
  },
  {
    id: 'bug-13',
    title: 'Visual Sidebar Layout Overlaps on Ultra-Wide Monitors',
    category: 'bug',
    tag: 'BUG REPORT',
    content: `On screens resolution width greater than 2560px, side drawers might align abnormally:
- **Fix**: The platform uses responsive limits. We recommend using a browser window width of 1200-1920px for optimal modern grid layout ratios.`
  },

  // 3. ACCOUNT PROBLEMS (15 articles)
  {
    id: 'acc-1',
    title: 'Lost My Daily Streak Status / Reset to Zero',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `Your daily streak progresses as you solve at least 1 puzzle daily (elapsed clock time under 24 hours). If it reset:
- Standard timezone changes can shift your active UTC lock.
- If you believe a mistake occurred, our AI support ticket assistant on the right panel can recalibrate your streak counter.`
  },
  {
    id: 'acc-2',
    title: 'Email ID Already Synchronized Error',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `This error appears if your specific email has already linked stats with another Sync Key:
- **Fix**: To import previous stats, select "Download existing progress" option. Note that merging different email statistics is not possible to prevent rating duplication.`
  },
  {
    id: 'acc-3',
    title: 'Resetting Cloud Saved Progress Permanently',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `To wipe all rating achievements, streak counts, and customization awards:
1. Open settings drawer.
2. Under Profile details, find the red "Wipe Autosave Session" or "Reset statistics".
3. Confirm twice. This action wipes the local storage completely and synchronizes a blank slate.`
  },
  {
    id: 'acc-4',
    title: 'Sync Key String Unparseable on Multiple Devices',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `If you see a red warning stating "Unparseable Key Structure":
- **Issue**: Each Sync key must follow the format 'SK-[XP]-[STREAK]'.
- **Fix**: Ensure no extra spaces are present. High-fidelity copy button in the profile section automatically formats the string correctly for easy pasting.`
  },
  {
    id: 'acc-5',
    title: 'Can I Transfer Stats from Google to Email Account?',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `No direct account merging is allowed. However, you can read the Sync Key from your Google profile, log out, then paste that same Sync Key under your Email Profile to clone progress characteristics.`
  },
  {
    id: 'acc-6',
    title: 'Missing Profile Badges & Achievements Awards',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `Some advanced badges (e.g. "Supercomputer Brain") require Mistake Checks to be fully disabled. If you played on Easy Zen or had hints active, the badge won't unlock. Review badge criteria carefully.`
  },
  {
    id: 'acc-7',
    title: 'XP Counter Capped at Level Range Limits',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `Your skill bracket rises sequentially (Casual -> Adept -> Master -> Grandmaster). If your levels appear capped, you must play on higher difficulties (Focus, Quantum) to pass the threshold of Adept bracket.`
  },
  {
    id: 'acc-8',
    title: 'Recovering Profile Saved as Guest.zip',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `Guest profiles operate offline. To prevent data losses, we highly recommend linking your email in settings. If you lost cookies, you can restore progress by entering your original backup Sync Key.`
  },
  {
    id: 'acc-9',
    title: 'Custom Profile Avatar Picture Size Limits',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `To guarantee rapid dashboard rendering, profile avatars are capped at 2.5MB. Use PNG, JPG, or SVG. Larger files will be blocked by local canvas listeners before upload processing.`
  },
  {
    id: 'acc-10',
    title: 'Mismatch of Daily vs Weekly Rating Leaderboards',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `Daily rankings reset at 00:00 UTC, while weekly lists end on Sundays. This is a design parameter to keep tourney loops fast, fresh, and engaging with different brackets of opponent logic.`
  },
  {
    id: 'acc-11',
    title: 'Multiplayer Matchmaking Disconnected mid-session',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `If your client disconnects from the arena, a 45-second grace window is started. Return to the matchmaking page immediately to sync positions and resume active competition scoring.`
  },
  {
    id: 'acc-12',
    title: 'Duplicate Emails in Registration Sync Panel',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `If you register twice with different capitalization (e.g., USER@DOM.COM vs user@dom.com), our system registers them as distinct. Ensure standard lowercase letters when copying credentials.`
  },
  {
    id: 'acc-13',
    title: 'Removing OAuth Cloud Tokens Securely',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `To break cloud links, go to Settings > Third-Party Sync. Click "Revoke Access Tokens". This flushes authorization caches completely without deleting your local highscore progress.`
  },
  {
    id: 'acc-14',
    title: 'Is Accounts Data Compliant with Privacy Acts?',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `Skudo uses military-grade, fully decentralized, client-side encryption. We do not store password credentials or sell tracking cookies. Your metrics remain entirely under your local possession.`
  },
  {
    id: 'acc-15',
    title: 'Troubleshooting Multiple Device Lockups',
    category: 'account',
    tag: 'ACCOUNT PROBLEM',
    content: `Using the same Sync Key simultaneously on two screens causes write hazards in local save files. Only play on one active screen tab at a time to prevent state sequence overwrites.`
  },

  // 4. GUIDES & ACADEMY SOLUTIONS
  {
    id: 'gui-1',
    title: 'Advanced X-Wing Elimination Technique',
    category: 'guides',
    tag: 'TACTICAL GUIDE',
    content: `The X-Wing is an advanced elimination tactic used to conquer Focus level puzzles:
- **Condition**: Look for two rows where a candidate number can only go in exactly two columns.
- **The Magic**: These forms create a rectangle box. Because of restrictions, that candidate MUST occupy diagonal corners of this box.
- **Conclusion**: You can safely eliminate that digit in all other rows inside those corresponding columns.`
  },
  {
    id: 'gui-2',
    title: 'Mastering Swordfish and Jellyfish Grids',
    category: 'guides',
    tag: 'TACTICAL GUIDE',
    content: `The Swordfish is an expansion of the X-Wing:
- Search for three rows where a candidate appears only in the same three columns.
- This creates a 3-way logical lattice. You can confidently erase that candidate from all other cells in those three columns.
- Jellyfish operates identically but tracks four columns/rows with absolute logical symmetry.`
  },
  {
    id: 'gui-3',
    title: 'Understanding Unique Rectangles (Type 1)',
    category: 'guides',
    tag: 'TACTICAL GUIDE',
    content: `Sudoku layouts must possess only one unique solution.
- If you find 4 cells in two rows & columns (forming a box across two subgrids) with identical candidate pairs (e.g., 2 and 5), it could create two valid answers.
- To avoid this invalid template, look for the extra candidate in one corner and resolve it instantly to break the loop.`
  },
  {
    id: 'gui-4',
    title: 'Forcing Chains and Alternating Inference Chains',
    category: 'guides',
    tag: 'TACTICAL GUIDE',
    content: `Chains utilize if-then relationships to map cell candidates:
- Check cell A: If it is value 4, then cell B is 6, which forces cell C to be 9, meaning cell D cannot be 4.
- If both conditions (A is 4 OR A is not 4) lead to cell D not being 4, you can confidently eliminate 4 from cell D. Beautiful deductive theory!`
  },
  {
    id: 'gui-5',
    title: 'Pencil Marking Strategies: Snyder vs Full Candidate',
    category: 'guides',
    tag: 'TACTICAL GUIDE',
    content: `- **Snyder**: Best for early to medium-hard games. Less visual clutter, faster speed.
- **Full Candidate**: Crucial for expert games. Allows rapid pattern recognition (naked triples, hidden pairs) across the complete board matrix.`
  },
  {
    id: 'gui-10',
    title: 'Letters Mode vs Numbers Mode mechanics',
    category: 'rules',
    tag: 'GAME RUNS ENGINE',
    content: `Letters mode substitutes digits 1-9 with characters A-I. 
- Focuses spatial recall of character distributions.
- Has exact logical parity. Standard solver advice is identical: replace '1' with 'A', '9' with 'I' in your brain's elimination matrix.`
  },

  // 5. GAMEPLAY & VARIANT RULES
  {
    id: 'rul-1',
    title: 'How do I trigger the Skudo Lens AI camera?',
    category: 'rules',
    tag: 'RULES & CAMERA',
    content: `Tap the Skudo Lens option in the navigation list or click the Lens camera icon in the top header. You can upload or capture any physical 9x9 Sudoku printed newspaper layout. Gemini OCR and neural tracing will translate the layout grid instantly into your active digital dashboard.`
  },
  {
    id: 'rul-2',
    title: 'What are the rules of AI Letters Mode?',
    category: 'rules',
    tag: 'ALFABET RULES',
    content: `In Letters Mode, standard digits 1-9 are replaced with alphabet characters A through I. All classical constraint logical Sudoku checks apply: each 3x3 diagonal region, column, and row must possess exact characters A-I with no duplicates. Great for re-wiring brain habit loops!`
  },
  {
    id: 'rul-3',
    title: 'Earning the Legendary \'Supercomputer Brain\' Achievement',
    category: 'rules',
    tag: 'ACHIEVEMENT POLICY',
    content: `Complete an entire 9x9 board on Focus or Quantax difficulty with automated mistake check tools disabled. Requesting even one AI hint or undoing multiple mistakes disqualifies achievement eligibility.`
  },
  {
    id: 'rul-4',
    title: 'Autocheck ELO Payout Penalties',
    category: 'rules',
    tag: 'SCORING MECHANICS',
    content: `The automatic mistake check highlights erroneous placements in red automatically:
- Active auto-checking is phenomenal for training, but penalizes your rating gain by 30% per completed placement.
- To secure 100% ELO payouts, disable mistake checking via the header toggle before completing your last 5 tiles.`
  },
  {
    id: 'rul-5',
    title: 'Snyder Notation vs Multi-Value Annotation Rules',
    category: 'rules',
    tag: 'TACTICAL RULES',
    content: `Under professional speed-solving tournament constraints:
- Snyder pencil marking requires writing a number ONLY when physical cell coordinates restrict that value to exactly two cells in a 3x3 block.
- Standard multi-value annotation allows marking all legal candidates, serving as raw data for Swordfish block scanning.`
  },

  // 6. TECHNICAL & TROUBLESHOOTING
  {
    id: 'tec-1',
    title: 'Solving Gemini Coach Offline/High Demand Spikes Error',
    category: 'technical',
    tag: 'COACH TROUBLESHOOT',
    popular: true,
    content: `If you see the error message indicating **"This model is currently experiencing high demand"** or **"Turbulence detected / 503 Service Unavailable"**:
- **Why it happens**: Google's Gemini API undergoes sudden spikes in central demand, temporarily limiting model query frequencies.
- **How to resolve**: 
  1. Our server has a native smart-retry queue configuration that automatically re-executes queries within 1 second.
  2. If the limit persists, you can use our dynamic offline coach lookup: simply ask standard rules questions or perform tactical walks, and our local expert rules dictionary will resolve correct answers instantly without needing an active internet connection.
  3. Try tapping the "Refresh Connections" calibration button in the header menu to refresh web socket endpoints.`
  },
  {
    id: 'tec-2',
    title: 'What if elements overlap on mobile setups?',
    category: 'technical',
    tag: 'CSS TROUBLESHOOT',
    content: `The layouts have been custom engineered desktop-first and responsive. The high-contrast top bar prevents overlapping. If you notice any browser grid issues, try toggling the Light Mode/Dark Mode option or zooming to 100% standard calibration.`
  },
  {
    id: 'tec-3',
    title: 'Why does the AI highlight invalid cell values?',
    category: 'technical',
    tag: 'VALIDATION ENGINE',
    content: `The database constraint engine simulates legal Sudoku arrays in milliseconds. If any value makes the board duplicate or mathematically unsolvable, the cell triggers red alerts instantly, saving you backtracking stress.`
  },
  {
    id: 'tec-4',
    title: 'Bluetooth Audio Delay and chime stuttering',
    category: 'technical',
    tag: 'AUDIO LATENCY',
    content: `High fidelity WebAudio chimes can buffer-lag on Bluetooth 4.0 or low-tier headsets:
- **Solution**: Navigate to Settings and disable "Audio Synth Sound" to bypass browser haptic feedback pipelines. Alternatively, switch to a wired auxiliary connector for pristine real-time chimes.`
  },
  {
    id: 'tec-5',
    title: 'Enabling Geolocation for Local Arena Matchmaking',
    category: 'technical',
    tag: 'LOCATION ACCESS',
    content: `The Competitive Arena ELO leagues rank players by geological region:
- **How to grant**: When the browser prompts, provide permission.
- **Manual override**: Click page address icon inside URL bar > permissions > Set Geolocation to "Allow".`
  }
];
