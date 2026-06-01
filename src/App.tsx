/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Sparkles, Trophy, Info, LogOut, ArrowLeft, MoreVertical, X, 
  Globe, Calendar, Check, Copy, Edit2, Volume2, VolumeX, Smartphone, 
  Bell, Moon, Sun, BookOpen, HelpCircle, Activity, Award, XCircle, 
  Shield, TrendingUp, Share2, Compass, CheckCircle, Save, SmartphoneCharging,
  ChevronDown, ChevronRight, Camera, Upload, Search, Bug
} from 'lucide-react';
import { PlayerProfile, GameMode, DifficultyLevel } from './types';
import BackgroundStars from './components/BackgroundStars';
import ProfileSetup from './components/ProfileSetup';
import WelcomeScreen from './components/WelcomeScreen';
import FuturisticDashboard from './components/FuturisticDashboard';
import ComplexityPanel from './components/ComplexityPanel';
import GameInterface from './components/GameInterface';
import { gameAudio } from './utils/audio';
import StrategyAcademy from './components/StrategyAcademy';

// 22 functional languages support mapping
const LANGUAGES_LIST = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Ind.' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' },
  { code: 'tl', name: 'Tagalog', native: 'Tagalog' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ms', name: 'Malay', native: 'Melayu' }
];

// Rich translations vocabulary
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    slogan: 'minimalist daytime daydreams',
    player: 'Player',
    back: 'Back to Welcome',
    start: 'Start Playing',
    welcome: 'Welcome',
    skillTier: 'Skill Tier',
    settingsTitle: 'Settings & Account Board',
    editProfile: 'Your Profile & Account Manager',
    rename: 'Type nickname...',
    copySuccess: 'Copied to Clipboard!',
    basicRules: 'Basic Sudoku Rules',
    rulesDesc1: 'Fill grid so every row contains digits 1-9 without repetition.',
    rulesDesc2: 'Every column must contain digits 1-9 uniquely.',
    rulesDesc3: 'Every mini 3x3 block must hold digits 1-9 without duplicate.',
    statsTitle: 'Separated Statistics & Progress',
    strategiesTitle: 'Interactive Strategies Guide',
    langTitle: 'Select Language Option',
    ambientDark: 'Ambient Dark Theme Mode',
    soundsLabel: 'Audio Game Sound Effects',
    vibrationLabel: 'Tactile Navigation Vibration',
    notifLabel: 'SMS Challenges notification',
    aboutTitle: 'Product Software Specifications',
    shareTitle: 'Share Progress & Score',
    logoutBtn: 'Sync & Logout Account',
    saveText: 'Save',
    activeEmail: 'Synced Email ID:',
  },
  es: {
    slogan: 'ensueños diurnos minimalistas',
    player: 'Jugador',
    back: 'Volver a la Bienvenida',
    start: 'Comenzar a Jugar',
    welcome: 'Bienvenido',
    skillTier: 'Nivel de Habilidad',
    settingsTitle: 'Panel de Cuenta y Ajustes',
    editProfile: 'Tu Perfil y Gestor de Cuenta',
    rename: 'Escribe apodo...',
    copySuccess: 'Copiado al Portapapeles!',
    basicRules: 'Reglas Básicas de Sudoku',
    rulesDesc1: 'Llena la rejilla de modo que cada fila contenga dígitos 1-9 sin repetición.',
    rulesDesc2: 'Cada columna debe contener los dígitos 1-9 de manera única.',
    rulesDesc3: 'Cada mini bloque de 3x3 debe contener dígitos 1-9 sin duplicados.',
    statsTitle: 'Estadísticas Separadas y Progreso',
    strategiesTitle: 'Guía Interactiva de Estrategias',
    langTitle: 'Seleccionar Opción de Idioma',
    ambientDark: 'Modo de Tema Oscuro Ambiental',
    soundsLabel: 'Efectos de Sonido del Juego',
    vibrationLabel: 'Vibración de Navegación Táctil',
    notifLabel: 'Notificaciones de Retos SMS',
    aboutTitle: 'Especificaciones del Software',
    shareTitle: 'Compartir Progreso y Puntuación',
    logoutBtn: 'Sincronizar y Cerrar Sesión',
    saveText: 'Guardar',
    activeEmail: 'Correo Sincronizado:',
  },
  fr: {
    slogan: 'rêveries de jour minimalistes',
    player: 'Joueur',
    back: 'Retour à l\'Accueil',
    start: 'Commencer à Jouer',
    welcome: 'Bienvenue',
    skillTier: 'Niveau de Compétence',
    settingsTitle: 'Paramètres & Tableau de Compte',
    editProfile: 'Votre Profil & Gestion de Compte',
    rename: 'Changer de nom...',
    copySuccess: 'Copié dans le presse-papiers!',
    basicRules: 'Règles de Base du Sudoku',
    rulesDesc1: 'Remplir la grille pour que chaque ligne contienne les chiffres 1 à 9 sans répétition.',
    rulesDesc2: 'Chaque colonne doit contenir de manière unique les chiffres 1 à 9.',
    rulesDesc3: 'Chaque mini bloc 3x3 doit contenir les chiffres 1 à 9 sans doublon.',
    statsTitle: 'Statistiques Séparées & Progrès',
    strategiesTitle: 'Guide Interactif des Stratégies',
    langTitle: 'Sélectionner la Langue',
    ambientDark: 'Mode Sombre Ambiant',
    soundsLabel: 'Effets Sonores de Jeu',
    vibrationLabel: 'Vibrations Tactiles App',
    notifLabel: 'Alertes SMS Défis',
    aboutTitle: 'Spécifications Logicielles',
    shareTitle: 'Partager le Score & Compte',
    logoutBtn: 'Sync & Déconnexion',
    saveText: 'Enregistrer',
    activeEmail: 'E-mail Synchronisé:',
  },
  de: {
    slogan: 'minimalistische tagträume',
    player: 'Spieler',
    back: 'Zurück zum Hauptmenü',
    start: 'Jetzt Spielen',
    welcome: 'Willkommen',
    skillTier: 'Könnenstufe',
    settingsTitle: 'Einstellungen & Kontoverwaltung',
    editProfile: 'Ihr Profil & Account-Manager',
    rename: 'Spitzname eingeben...',
    copySuccess: 'In die Zwischenablage kopiert!',
    basicRules: 'Grundlegende Sudoku-Regeln',
    rulesDesc1: 'Füllen Sie das Gitter so aus, dass jede Zeile die Ziffern 1-9 ohne Wiederholung enthält.',
    rulesDesc2: 'Jede Spalte muss die Ziffern 1-9 eindeutig enthalten.',
    rulesDesc3: 'Jeder kleine 3x3-Block muss die Ziffern 1-9 ohne Duplikate enthalten.',
    statsTitle: 'Getrennte Statistiken & Fortschritt',
    strategiesTitle: 'Interaktiver Strategieführer',
    langTitle: 'Sprache Option Auswählen',
    ambientDark: 'Dunkles Raum-Design aktivieren',
    soundsLabel: 'Spiel-Soundeffekte aktivieren',
    vibrationLabel: 'Taktiles Vibrations-Feedback',
    notifLabel: 'SMS-Herausforderungen Alerts',
    aboutTitle: 'Produktspezifikationen & Build',
    shareTitle: 'Erfolge & Spiel-ID teilen',
    logoutBtn: 'Sync & Abmelden',
    saveText: 'Speichern',
    activeEmail: 'Synchronisierte E-Mail:',
  },
  it: {
    slogan: 'sogni a occhi aperti minimalisti',
    player: 'Giocatore',
    back: 'Torna al Benvenuto',
    start: 'Inizia a Giocare',
    welcome: 'Benvenuto',
    skillTier: 'Livello di Abilità',
    settingsTitle: 'Impostazioni & Profilo Account',
    editProfile: 'Il tuo Profilo & Gestione Conto',
    rename: 'Digita soprannome...',
    copySuccess: 'Copiato negli appunti!',
    basicRules: 'Regole Base del Sudoku',
    rulesDesc1: 'Riempi la griglia in modo che ogni riga contenga i numeri da 1 a 9 senza ripetizioni.',
    rulesDesc2: 'Ogni colonna deve contenere i numeri da 1 a 9 in modo unico.',
    rulesDesc3: 'Ogni mini blocco 3x3 deve contenere i numeri da 1 a 9 senza duplicati.',
    statsTitle: 'Statistiche Separate & Progresso',
    strategiesTitle: 'Guida Strategica Interattiva',
    langTitle: 'Seleziona Lingua del Gioco',
    ambientDark: 'Modalità Tema Scuro Ambientale',
    soundsLabel: 'Effetti Sonori Gameplay',
    vibrationLabel: 'Feedback Vibrazione Tattile',
    notifLabel: 'Notifiche Sfide SMS',
    aboutTitle: 'Specifiche Software Prodotto',
    shareTitle: 'Condividi Progresso & Conto',
    logoutBtn: 'Sincronizza e Disconnetti',
    saveText: 'Salva',
    activeEmail: 'Email Sincronizzata:',
  },
  ja: {
    slogan: 'ミニマリストの白昼夢パズル',
    player: 'プレイヤー',
    back: 'ウェルカムへ戻る',
    start: 'ゲームを始める',
    welcome: 'ようこそ',
    skillTier: 'スキルティア',
    settingsTitle: '設定とアカウント管理',
    editProfile: 'プロフィールとアカウント情報',
    rename: 'ニックネームを入力...',
    copySuccess: 'クリップボードにコピーしました！',
    basicRules: '数独の基本ルール',
    rulesDesc1: 'すべての行に1から9までの数字が重複なく入るようにグリッドを埋めます。',
    rulesDesc2: 'すべての列に1から9までの数字がユニークに入る必要があります。',
    rulesDesc3: 'すべての3x3ブロックに重複のない1から9の数字が入ります。',
    statsTitle: 'モード別統計と記録グラフ',
    strategiesTitle: '数独の戦略・テクニック解説',
    langTitle: '言語を切り替える',
    ambientDark: 'ダークテーマを有効にする',
    soundsLabel: 'オーディオ効果音 (クリック音)',
    vibrationLabel: '触覚バイブレーションフィードバック',
    notifLabel: 'デイリー課題SMS通知を有効にする',
    aboutTitle: 'システム製品情報とビルド仕様',
    shareTitle: 'プレイヤー進捗とIDをシェアする',
    logoutBtn: '保存してログアウト',
    saveText: '保存',
    activeEmail: '同期中のメールアカウント:',
  },
  hi: {
    slogan: 'न्यूनतम दिन का सपना पहेली',
    player: 'खिलाड़ी',
    back: 'स्वागत स्क्रीन पर जाएं',
    start: 'खेलना शुरू करें',
    welcome: 'स्वागत हे',
    skillTier: 'कौशल स्तर',
    settingsTitle: 'सेटिंग्स और खाता बोर्ड',
    editProfile: 'आपका प्रोफ़ाइल और खाता प्रबंधक',
    rename: 'उपनाम दर्ज करें...',
    copySuccess: 'क्लिपबोर्ड पर कॉपी किया गया!',
    basicRules: 'सुडोकू के बुनियादी नियम',
    rulesDesc1: 'ग्रिड भरें ताकि प्रत्येक पंक्ति में बिना दोहराव के 1-9 अंक हों।',
    rulesDesc2: 'प्रत्येक कॉलम में विशिष्ट रूप से 1-9 अंक होने चाहिए।',
    rulesDesc3: 'प्रत्येक मिनी 3x3 ब्लॉक में बिना दोहराव के 1-9 अंक होने चाहिए।',
    statsTitle: 'अलग-अलग सांख्यिकी और प्रगति',
    strategiesTitle: 'इंटरैक्टिव रणनीतियों गाइड',
    langTitle: 'भाषा विकल्प का चयन करें',
    ambientDark: 'डार्क थीम मोड',
    soundsLabel: 'ऑडियो गेम ध्वनि प्रभाव',
    vibrationLabel: 'कंपन नेविगेशन प्रतिक्रिया',
    notifLabel: 'एसएमएस चुनौतियों की अधिसूचना',
    aboutTitle: 'सॉफ्टवेयर विनिर्देश विवरण',
    shareTitle: 'प्रगति और स्कोर साझा करें',
    logoutBtn: 'सिंक करें और लॉगआउट करें',
    saveText: 'सहेजें',
    activeEmail: 'सिंक किया गया ईमेल आईडी:',
  },
  bn: {
    slogan: 'ন্যূনতম দিনের স্বপ্ন ধাঁধা',
    player: 'খেলোয়াড়',
    back: 'স্বাগতম স্ক্রিনে ফিরে যান',
    start: 'খেলা শুরু করুন',
    welcome: 'স্বাগতম',
    skillTier: 'দক্ষতার স্তর',
    settingsTitle: 'সেটিংস এবং অ্যাকাউন্ট বোর্ড',
    editProfile: 'আপনার প্রোফাইল এবং অ্যাকাউন্ট ম্যানেজার',
    rename: 'ডাকনাম লিখুন...',
    copySuccess: 'ক্লিপবোর্ডে কপি করা হয়েছে!',
    basicRules: 'সুডোকুর সাধারণ নিয়মাবলী',
    rulesDesc1: 'গ্রিডটি এমনভাবে পূরণ করুন যাতে প্রতিটি সারিতে পুনরাবৃত্তি ছাড়াই ১-৯ সংখ্যা থাকে।',
    rulesDesc2: 'প্রতিটি কলামে অনন্যভাবে ১-৯ সংখ্যা থাকতে হবে।',
    rulesDesc3: 'প্রতিটি ৩x৩ ব্লকে পুনরাবৃত্তি ছাড়া ১-৯ সংখ্যা থাকতে হবে।',
    statsTitle: 'আলাদা পরিসংখ্যান এবং অগ্রগতি',
    strategiesTitle: 'কৌশল ও কৌশল নির্দেশিকা',
    langTitle: 'ভাষা পরিবর্তন করুন',
    ambientDark: 'ডার্ক মোড পরিবর্তন করুন',
    soundsLabel: 'খেলার শব্দ প্রভাব',
    vibrationLabel: 'স্পর্শ ভাইব্রেশন প্রতিক্রিয়া',
    notifLabel: 'এসএমএস চ্যালেঞ্জ নোটিফিকেশন',
    aboutTitle: 'সফটওয়্যার বিবরণ এবং সংস্করণ',
    shareTitle: 'অগ্রগতি এবং স্কোর শেয়ার করুন',
    logoutBtn: 'সিঙ্ক এবং লগ আউট',
    saveText: 'সংরক্ষণ',
    activeEmail: 'সিঙ্ক করা ইমেল আইডি:',
  }
};




const drawInstagramCard = (
  canvas: HTMLCanvasElement,
  format: 'story' | 'feed',
  design: 'sunset' | 'neon' | 'slate' | 'emerald',
  profile: any
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = format === 'story' ? 540 : 800;
  const h = format === 'story' ? 960 : 800;
  canvas.width = w;
  canvas.height = h;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // 1. Draw Background Gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  if (design === 'sunset') {
    grad.addColorStop(0, '#f12711');
    grad.addColorStop(1, '#f5af19');
  } else if (design === 'neon') {
    grad.addColorStop(0, '#8514F5');
    grad.addColorStop(1, '#F107A3');
  } else if (design === 'emerald') {
    grad.addColorStop(0, '#10B981');
    grad.addColorStop(1, '#059669');
  } else { // slate
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E293B');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  
  // 2. Decorative elements
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // 3. Main Glassmorphism Frame
  const marginX = w * 0.08;
  const marginY = format === 'story' ? h * 0.15 : h * 0.12;
  const cardW = w - marginX * 2;
  const cardH = h - marginY * 2;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2.5;

  const drawRoundRect = (x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  drawRoundRect(marginX, marginY, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  // 4. Header Branding
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 8;
  
  ctx.font = '900 28px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SKUDO.ZIP', w / 2, marginY + 60);
  
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#CCCCCC';
  ctx.fillText('MIN_SUDOKU_FLOW_CONSOLE', w / 2, marginY + 84);
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(marginX + 30, marginY + 110);
  ctx.lineTo(marginX + cardW - 30, marginY + 110);
  ctx.stroke();
  ctx.shadowBlur = 0; // reset

  // 5. Hero Initials/Avatar Circle
  const avatarY = marginY + 175;
  const avatarR = 40;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(w / 2, avatarY, avatarR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  let initial = '🏆';
  if (profile && profile.name) {
    initial = profile.name.charAt(0).toUpperCase();
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px "Space Grotesk", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(initial, w / 2, avatarY);
  ctx.textBaseline = 'alphabetic'; // reset

  // Name & Rank
  const name = profile && profile.name ? profile.name : 'Anonymous Master';
  ctx.font = '900 24px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(name, w / 2, avatarY + avatarR + 32);

  const rank = profile && profile.experience ? profile.experience : 'Beginner';
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  ctx.fillStyle = '#C7D2FE'; // light indigo accent
  ctx.fillText(`CONSOLE_RANK: ${rank.toUpperCase()}`, w / 2, avatarY + avatarR + 54);

  // Stats Grid Setup
  const statsY = avatarY + avatarR + 95;
  const xpValue = profile ? profile.xp : 0;
  const streakValue = profile ? profile.streak : 0;
  
  // Compute wins
  const diffs: ('zen' | 'flow' | 'focus' | 'quantum')[] = ['zen', 'flow', 'focus', 'quantum'];
  const defaultStats: Record<'zen' | 'flow' | 'focus' | 'quantum', { wins: number }> = {
    zen: { wins: 0 },
    flow: { wins: 0 },
    focus: { wins: 0 },
    quantum: { wins: 0 },
  };
  const cStats = { ...defaultStats };
  if (profile && profile.difficultyStats) {
    diffs.forEach(d => {
      if (profile.difficultyStats && profile.difficultyStats[d]) {
        cStats[d] = { wins: profile.difficultyStats[d].wins || 0 };
      }
    });
  } else if (profile) {
    let completedRemaining = profile.completedGames;
    cStats.zen.wins = Math.floor(completedRemaining * 0.4);
    cStats.flow.wins = Math.floor(completedRemaining * 0.3);
    cStats.focus.wins = Math.floor(completedRemaining * 0.2);
    cStats.quantum.wins = Math.max(0, completedRemaining - cStats.zen.wins - cStats.flow.wins - cStats.focus.wins);
  }
  const winsValue = Object.values(cStats).reduce((acc, curr) => acc + curr.wins, 0);
  const bestLevel = profile && profile.highestScore ? profile.highestScore : 0;

  // DrawStatBox helper
  const boxW = (cardW - 60 - 15) / 2;
  const boxH = 65;
  const row1Y = statsY;
  const row2Y = statsY + boxH + 15;

  const drawStatBox = (x: number, y: number, label: string, value: string | number, colCode: string) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    drawRoundRect(x, y, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#CCCCCC';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label.toUpperCase(), x + boxW / 2, y + 22);

    ctx.fillStyle = colCode;
    ctx.font = '900 21px "Space Grotesk", sans-serif';
    ctx.fillText(String(value), x + boxW / 2, y + 49);
  };

  drawStatBox(marginX + 30, row1Y, 'XP Rating', `${xpValue}`, '#FFDF00');
  drawStatBox(marginX + 30 + boxW + 15, row1Y, 'Daily Streak', `${streakValue} days`, '#ff7e5f');
  drawStatBox(marginX + 30, row2Y, 'Wins Count', `${winsValue} puzzles`, '#10B981');
  drawStatBox(marginX + 30 + boxW + 15, row2Y, 'Highest Score', `${bestLevel}`, '#38BDF8');

  // Bottom CTA
  const bottomY = row2Y + boxH + 34;
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText('JOIN THE SUDOKU FLOW CLUB', w / 2, bottomY);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  const inviteCodeW = 240;
  const inviteCodeH = 32;
  drawRoundRect(w / 2 - inviteCodeW / 2, bottomY + 12, inviteCodeW, inviteCodeH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = '900 13px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`INVITE: SK-${xpValue}-${streakValue}`, w / 2, bottomY + 32);

  ctx.font = 'bold 10px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('skudo.zip', w / 2, marginY + cardH - 22);
};

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [view, setView] = useState<'setup' | 'welcome' | 'mode_select' | 'game'>('setup');
  const [selectedMode, setSelectedMode] = useState<GameMode>('numbers');
  const [showComplexity, setShowComplexity] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('flow');
  const [selectedSpecialGame, setSelectedSpecialGame] = useState<'daily' | 'weekly' | null>(null);
  const [selectedBoss, setSelectedBoss] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('classic');
  const [showStrategyAcademy, setShowStrategyAcademy] = useState(false);

  // High-fidelity options drawers state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Avatar upload states in settings sidebar
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  const handleSidebarAvatarFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG/JPG/WEBP).');
      return;
    }
    // Limit file size to 1.5MB for safe localStorage capacity
    if (file.size > 1.5 * 1024 * 1024) {
      setAvatarError('Image is too large. Max size is 1.5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && profile) {
        const updated = { ...profile, avatarUrl: reader.result };
        setProfile(updated);
        localStorage.setItem('skudo_profile', JSON.stringify(updated));
        if (updated.email) {
          localStorage.setItem(`skudo_profile_${updated.email.toLowerCase()}`, JSON.stringify(updated));
        }
        setAvatarError(null);
      }
    };
    reader.onerror = () => {
      setAvatarError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    if (!profile) return;
    const updated = { ...profile, avatarUrl: undefined };
    setProfile(updated);
    localStorage.setItem('skudo_profile', JSON.stringify(updated));
    if (updated.email) {
      localStorage.setItem(`skudo_profile_${updated.email.toLowerCase()}`, JSON.stringify(updated));
    }
    setAvatarError(null);
  };

  // System States (Persistent in local storage, loaded on mount)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [language, setLanguage] = useState('en');

  // Interactive visual stats adapter breakdown
  const [statsBreakdown, setStatsBreakdown] = useState<Record<string, Record<string, number>>>({
    numbers: { zen: 0, flow: 0, focus: 0, quantum: 0 },
    letters: { zen: 0, flow: 0, focus: 0, quantum: 0 },
  });

  // Accordion status inside strategy panel
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);

  // Advanced stats and custom Instagram sharing states
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [activeStatsTab, setActiveStatsTab] = useState<DifficultyLevel>('zen');
  const [selectedStatsMetric, setSelectedStatsMetric] = useState<'wins' | 'losses' | 'perfectWins' | 'bestScore' | 'bestTime' | 'perfectBestTime'>('wins');
  const [instagramFeedback, setInstagramFeedback] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [instagramLayout, setInstagramLayout] = useState<'story' | 'feed'>('story');
  const [instagramDesign, setInstagramDesign] = useState<'sunset' | 'neon' | 'slate' | 'emerald'>('sunset');
  
  // Custom toast push simulation alert
  const [smsToast, setSmsToast] = useState<{ text: string; show: boolean }>({ text: '', show: false });

  // Helper to retrieve difficulty level analytics
  const getNormalizedDifficultyStats = () => {
    const diffs: ('zen' | 'flow' | 'focus' | 'quantum')[] = ['zen', 'flow', 'focus', 'quantum'];
    
    const defaultStats: Record<'zen' | 'flow' | 'focus' | 'quantum', {
      wins: number;
      losses: number;
      perfectWins: number;
      bestTime?: number;
      perfectBestTime?: number;
      bestScore?: number;
    }> = {
      zen: { wins: 0, losses: 0, perfectWins: 0 },
      flow: { wins: 0, losses: 0, perfectWins: 0 },
      focus: { wins: 0, losses: 0, perfectWins: 0 },
      quantum: { wins: 0, losses: 0, perfectWins: 0 },
    };

    if (profile && profile.difficultyStats) {
      // Create copy and populate missing keys
      const stats = { ...defaultStats };
      diffs.forEach(d => {
        if (profile.difficultyStats && profile.difficultyStats[d]) {
          stats[d] = { ...profile.difficultyStats[d] };
        }
      });
      return stats;
    }

    if (profile) {
      // Distribute total games logically for players who already have historic wins
      let completedRemaining = profile.completedGames;
      let totalRemaining = profile.totalGames;
      let lossesRemaining = Math.max(0, totalRemaining - completedRemaining);

      defaultStats.zen.wins = Math.min(completedRemaining, Math.max(0, Math.floor(profile.completedGames * 0.4)));
      completedRemaining -= defaultStats.zen.wins;
      
      defaultStats.flow.wins = Math.min(completedRemaining, Math.max(0, Math.floor(profile.completedGames * 0.3)));
      completedRemaining -= defaultStats.flow.wins;

      defaultStats.focus.wins = Math.min(completedRemaining, Math.max(0, Math.floor(profile.completedGames * 0.2)));
      completedRemaining -= defaultStats.focus.wins;

      defaultStats.quantum.wins = Math.max(0, completedRemaining);

      // Distribute defeats
      defaultStats.zen.losses = Math.min(lossesRemaining, Math.floor(lossesRemaining * 0.2));
      lossesRemaining -= defaultStats.zen.losses;

      defaultStats.flow.losses = Math.min(lossesRemaining, Math.floor(lossesRemaining * 0.3));
      lossesRemaining -= defaultStats.flow.losses;

      defaultStats.focus.losses = Math.min(lossesRemaining, Math.floor(lossesRemaining * 0.3));
      lossesRemaining -= defaultStats.focus.losses;

      defaultStats.quantum.losses = Math.max(0, lossesRemaining);

      diffs.forEach(d => {
        // Approximate historic perfect completions
        defaultStats[d].perfectWins = Math.floor(defaultStats[d].wins * 0.6);
        if (defaultStats[d].wins > 0) {
          const baseTime = d === 'zen' ? 140 : d === 'flow' ? 240 : d === 'focus' ? 380 : 540;
          defaultStats[d].bestTime = baseTime;
          defaultStats[d].bestScore = Math.round(1000 - baseTime + (d === 'quantum' ? 300 : d === 'focus' ? 200 : d === 'flow' ? 100 : 50));
          if (defaultStats[d].perfectWins > 0) {
            defaultStats[d].perfectBestTime = Math.round(baseTime * 0.85);
          }
        }
      });
    }

    return defaultStats;
  };



  const formatSeconds = (sec?: number) => {
    if (sec === undefined) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Load existing profile, settings & statistical breakdowns from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('skudo_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PlayerProfile;
        setProfile(parsed);
        setEditedName(parsed.name);
        setView('welcome');

        // Restore custom configuration keys
        const savedTheme = localStorage.getItem('skudo_theme') as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);

        const savedAudio = localStorage.getItem('skudo_audio');
        if (savedAudio) {
          const isAudioOn = savedAudio === 'true';
          setAudioEnabled(isAudioOn);
          gameAudio.setMute(!isAudioOn);
        }

        const savedVibe = localStorage.getItem('skudo_vibe');
        if (savedVibe) setVibrateEnabled(savedVibe === 'true');

        const savedNotif = localStorage.getItem('skudo_notif');
        if (savedNotif) setNotificationsEnabled(savedNotif === 'true');

        const savedLang = localStorage.getItem('skudo_lang');
        if (savedLang) setLanguage(savedLang);

        // Restore active fine-grained statistical breakdown
        const emailKey = parsed.email ? parsed.email : 'local.guest';
        const savedStats = localStorage.getItem(`skudo_stats_${emailKey}`);
        if (savedStats) {
          setStatsBreakdown(JSON.parse(savedStats));
        } else {
          // Initialize mock start stats to display graph nicely on new login
          const defaultStats = {
            numbers: { zen: parsed.completedGames, flow: Math.max(0, parsed.totalGames - parsed.completedGames), focus: 0, quantum: 1 },
            letters: { zen: 1, flow: 0, focus: 0, quantum: 0 }
          };
          setStatsBreakdown(defaultStats);
        }
      } catch (err) {
        console.warn('Failed to parse saved profile:', err);
      }
    }
  }, []);

  // Sync dark mode class on HTML document tag for full component responsiveness
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleProfileComplete = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
    setEditedName(newProfile.name);
    localStorage.setItem('skudo_profile', JSON.stringify(newProfile));
    
    const emailKey = newProfile.email ? newProfile.email : 'local.guest';
    const initStats = {
      numbers: { zen: 3, flow: 2, focus: 1, quantum: 0 },
      letters: { zen: 1, flow: 1, focus: 0, quantum: 0 }
    };
    setStatsBreakdown(initStats);
    localStorage.setItem(`skudo_stats_${emailKey}`, JSON.stringify(initStats));
    setView('welcome');
  };

  const updateProfileStats = (updatedProfile: PlayerProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('skudo_profile', JSON.stringify(updatedProfile));
    
    // Increment stats metrics dynamically
    const emailKey = updatedProfile.email ? updatedProfile.email : 'local.guest';
    const currentStats = { ...statsBreakdown };
    currentStats[selectedMode][selectedDifficulty] = (currentStats[selectedMode]?.[selectedDifficulty] || 0) + 1;
    setStatsBreakdown(currentStats);
    localStorage.setItem(`skudo_stats_${emailKey}`, JSON.stringify(currentStats));

    // Persist profile to search mapping lookup by email
    if (updatedProfile.email) {
      localStorage.setItem(`skudo_profile_${updatedProfile.email.toLowerCase()}`, JSON.stringify(updatedProfile));
    }
  };

  const handleSelectMode = (mode: GameMode) => {
    setSelectedSpecialGame(null);
    setSelectedMode(mode);
    setShowComplexity(true);
  };

  const handleStartSpecialGame = (type: 'daily' | 'weekly') => {
    triggerVibe();
    setSelectedSpecialGame(type);
    setSelectedMode('numbers');
    setSelectedDifficulty(type === 'daily' ? 'focus' : 'quantum');
    setView('game');
  };

  const handleStartGame = (difficulty: DifficultyLevel) => {
    triggerVibe();
    setSelectedSpecialGame(null);
    setSelectedDifficulty(difficulty);
    setShowComplexity(false);
    setView('game');
  };

  const handleLogout = () => {
    gameAudio.playClick();
    if (window.confirm("Do you accept logging out? All local stats are stored under your synced email account.")) {
      localStorage.removeItem('skudo_profile');
      setProfile(null);
      setMenuOpen(false);
      setView('setup');
    }
  };

  // Sound and Tactile helper parameters
  const toggleSound = () => {
    const nextVal = !audioEnabled;
    setAudioEnabled(nextVal);
    gameAudio.setMute(!nextVal);
    localStorage.setItem('skudo_audio', String(nextVal));
    gameAudio.playClick();
  };

  const triggerVibe = () => {
    if (vibrateEnabled && typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(60);
      } catch (e) {
        // Safe check
      }
    }
  };

  const toggleVibration = () => {
    const nextVal = !vibrateEnabled;
    setVibrateEnabled(nextVal);
    localStorage.setItem('skudo_vibe', String(nextVal));
    if (nextVal) triggerVibe();
    else gameAudio.playClick();
  };

  const toggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    localStorage.setItem('skudo_notif', String(nextVal));
    gameAudio.playClick();

    if (nextVal) {
      // Simulate asking permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          Notification.requestPermission();
        } catch(e) {}
      }
      
      // Push an interactive SMS mock toast
      setTimeout(() => {
        setSmsToast({
          text: `💬 SMS Alert: Welcome and thank you for activating SKUDO notices! New Daily Solitaire Challenge has unlocked. Start playing to earn 350 XP! 🔥`,
          show: true
        });
      }, 1000);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('skudo_theme', nextTheme);
    gameAudio.playClick();
  };

  const handleSelectLanguage = (code: string) => {
    setLanguage(code);
    localStorage.setItem('skudo_lang', code);
    gameAudio.playClick();
  };

  // Safe dictionary translator
  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const saveProfileName = () => {
    if (!profile || !editedName.trim()) return;
    gameAudio.playClick();
    const updated = { ...profile, name: editedName.trim() };
    setProfile(updated);
    localStorage.setItem('skudo_profile', JSON.stringify(updated));
    if (updated.email) {
      localStorage.setItem(`skudo_profile_${updated.email.toLowerCase()}`, JSON.stringify(updated));
    }
    setIsEditingName(false);
  };

  // Copies the Game Account ID card
  const copyAccountID = () => {
    gameAudio.playClick();
    triggerVibe();
    const uuid = profile ? `SKUDO-XP-${profile.xp}-${profile.streak}` : 'SKUDO-XP-00000';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(uuid);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // Calculate sum metric total play counts
  const totalGamesMet = (statsBreakdown.numbers?.zen || 0) + (statsBreakdown.numbers?.flow || 0) + (statsBreakdown.numbers?.focus || 0) + (statsBreakdown.numbers?.quantum || 0) +
                        (statsBreakdown.letters?.zen || 0) + (statsBreakdown.letters?.flow || 0) + (statsBreakdown.letters?.focus || 0) + (statsBreakdown.letters?.quantum || 0);

  // Mock Strategies Checklist definitions
  const SUDOKU_STRATEGIES = [
    {
      title: '1. Last Free Cell (Beginner)',
      desc: 'When a row, column, or 3x3 block has 8 cells filled. The only missing digit (1-9) is guaranteed to occupy the final white coordinate, leaving absolutely no alternative.',
      hint: 'Row scanning coordinate: (Row 3, Cols 1-8 are filled containing 1,2,3,4,5,6,7,8; Col 9 must be 9)'
    },
    {
      title: '2. Last Possible Number (Beginner)',
      desc: 'A single cell inside the entire grid has exactly one candidate remaining. All other eight digits are eliminated by scanning surrounding intersection lines. (Also called Naked Single).',
      hint: 'Cell Focus: Column contains 1-5, Row occupies 6-8. Block contains nothing else. Coordinates accepts only 9.'
    },
    {
      title: '3. Cross-Hatching Number (Beginner)',
      desc: 'Project solid horizontal and vertical boundaries across a 3x3 grid sector using matching digits existing on adjacent lines. This wipes out candidate slots, instantly locking the digit to a single leftover cell.',
      hint: 'Focus technique: Eliminating rows to place a 7 in Box 5 sector.'
    },
    {
      title: '4. Naked Pair (Intermediate)',
      desc: 'Two coordinates within the same unit (row/col) contain exactly the same pair of candidate values (e.g. 2,5). Since those two values must occupy those two cells, they can be erased from all other cells in that line.',
      hint: 'Effect: Wipe pencil candidates 2 and 5 out of all surrounding unit sectors.'
    },
    {
      title: '5. Hidden Pair (Intermediate)',
      desc: 'When two digits show up in only two cells within a unit, together with other candidates. Because those digits cannot be placed elsewhere, all other notes in those two cells are eliminated.',
      hint: 'Effect: Erase other competing candidates, keeping only the hidden pairing lock.'
    },
    {
      title: '6. XY-Wing (Advanced)',
      desc: 'An advanced branching scheme using a pivot cell (XY) and two pincer cells (XZ, YZ) sharing units with the pivot. Whichever value (X or Y) the pivot takes, one of the pincers is forced to contain Z. Hence, any cell overlapping both pincers can have candidate Z deleted.',
      hint: 'Coordinates lock: Pivot at R1C1 (values 1,2), pincers at R1C5 (values 2,3) & R5C1 (values 1,3). Delete 3 from R5C5.'
    },
    {
      title: '7. Jellyfish (Expert Master)',
      desc: 'A complex grid-based strategy. If exactly four rows have candidates for a number in at most four columns, that number is locked in those coordinates, allowing the deletion of that candidate elsewhere in those four columns.',
      hint: 'Analysis: Formidable 4x4 matrix alignment targeting expert tournament grids.'
    }
  ];

  return (
    <div className={`relative min-h-screen w-full font-sans transition-colors duration-300 flex flex-col overflow-x-hidden ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0F1423] via-[#1A1F36] to-[#0A0C16] text-[#E2E8F0] dark' 
        : 'bg-gradient-to-br from-[#FFFFFF] via-[#F4FAFF] to-[#EAF7FF] text-[#4A5568]'
    }`}>
      {/* Global Shooters sky stars overlay */}
      <BackgroundStars />

      {/* Dynamic SMS alert preview toast */}
      <AnimatePresence>
        {smsToast.show && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-4 left-6 right-6 mx-auto max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 flex items-start gap-3.5"
            id="simulated-sms-toast"
          >
            <div className="p-2 bg-sky-500 rounded-full text-white shrink-0 mt-0.5 animate-bounce">
              <SmartphoneCharging className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Simulated Push SMS Alert</span>
              <p className="text-xs text-white font-medium pr-6 mt-1.5 leading-relaxed">{smsToast.text}</p>
            </div>
            <button
              onClick={() => setSmsToast({ text: '', show: false })}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Unified Header HUD Navigation Bar */}
      <header className={`w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between rounded-2xl border transition-colors z-20 mt-4 shadow-sm ${
        theme === 'dark' ? 'bg-[#1E2540]/60 border-slate-700/60' : 'bg-white/40 border-white/60'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-[38px] h-[38px] rounded-[11px] bg-gradient-to-br from-[#38BDF8] to-[#009DFF] flex items-center justify-center shadow-xs select-none animate-logo-float border border-white/30 will-change-transform">
            <span className="text-white font-sans text-2xl font-black tracking-tighter select-none leading-none">S</span>
          </div>
          <div>
            <h1 className={`font-sans text-lg font-extrabold tracking-tight leading-none mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#4A5568]'}`}>
              SKUDO<span className="text-[#009DFF]">.ZIP</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.06em] text-[#87CEEB] font-black leading-none">
              {t('slogan')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <div className={`hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 border rounded-lg ${
              theme === 'dark' ? 'bg-[#141B30]/80 border-slate-700/65 text-[#CBD5E1]' : 'bg-white/70 border-white text-[#4A5568]'
            }`}>
              <span className="text-[#87CEEB] font-bold">{t('player')}:</span>
              <span className="text-[#4DA6FF] font-bold">{profile.name}</span>
            </div>
          )}

          {profile && view !== 'setup' && (
            <button
              onClick={() => {
                gameAudio.playClick();
                setMenuOpen(true);
              }}
              className={`p-2 border transition rounded-xl cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 text-slate-300' 
                  : 'bg-white/60 hover:bg-[#E0F4FF]/50 border-white text-slate-500'
              }`}
              title={t('settingsTitle')}
              id="global-options-dots-btn"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 3. Main Central Router Render Zone */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 flex items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {view === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
            >
              <ProfileSetup onComplete={handleProfileComplete} />
            </motion.div>
          )}

          {view === 'welcome' && profile && (
            <WelcomeScreen
              profile={profile}
              onNext={() => {
                setView('mode_select');
              }}
            />
          )}

          {view === 'mode_select' && profile && (
            <FuturisticDashboard
              profile={profile}
              theme={theme}
              onUpdateProfile={updateProfileStats}
              onSelectGame={(config) => {
                setSelectedMode(config.mode);
                setSelectedDifficulty(config.difficulty);
                setSelectedSpecialGame(config.special || null);
                setSelectedBoss(config.boss || null);
                setSelectedVariant(config.variant || 'classic');
                setView('game');
              }}
              onOpenLegacyAcademy={() => {
                gameAudio.playClick();
                triggerVibe();
                setShowStrategyAcademy(true);
              }}
              onToggleTheme={() => {
                setTheme(prev => prev === 'light' ? 'dark' : 'light');
              }}
              onToggleAudio={() => {
                setAudioEnabled(!audioEnabled);
              }}
              audioEnabled={audioEnabled}
            />
          )}

          {view === 'game' && profile && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full animate-pop-in"
            >
              <div className={`${theme === 'dark' ? 'dark' : ''}`}>
                <GameInterface
                  profile={profile}
                  initialMode={selectedMode}
                  initialDifficulty={selectedDifficulty}
                  initialSpecialGame={selectedSpecialGame}
                  initialBoss={selectedBoss}
                  initialVariant={selectedVariant}
                  onUpdateProfile={updateProfileStats}
                  onExitToMenu={() => {
                    gameAudio.playClick();
                    setSelectedSpecialGame(null);
                    setSelectedBoss(null);
                    setSelectedVariant('classic');
                    setView('mode_select');
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Slide-up bottom sheet difficulty panel overlay */}
      <AnimatePresence>
        {showComplexity && (
          <ComplexityPanel
            selectedMode={selectedMode}
            onSelect={handleStartGame}
            onClose={() => setShowComplexity(false)}
          />
        )}
      </AnimatePresence>

      {/* RIGHT SIDE OPTIONS DRAWER SIDEBAR - FROSTED GORGEOUS GLASS */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-out White/Cosmic Shade Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`relative w-full max-w-lg h-screen shadow-2xl flex flex-col z-20 border-l overflow-hidden ${
                theme === 'dark' 
                  ? 'bg-[#101524]/95 border-slate-800 text-slate-100' 
                  : 'bg-white/95 border-slate-200 text-[#4A5568]'
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-5 border-b flex items-center justify-between shrink-0 border-slate-300/20">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#4DA6FF] animate-spin" />
                  <span className="font-extrabold text-sm uppercase tracking-wider">{t('settingsTitle')}</span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-red-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                {/* SECTION 1: PROFILE ACCOUNT MANAGER */}
                {profile && (
                  <div className={`p-5 rounded-2xl border ${
                    theme === 'dark' ? 'bg-[#182038]/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden group cursor-pointer transition-all border-2 ${
                          isDraggingAvatar 
                            ? 'border-[#009DFF]' 
                            : profile.avatarUrl 
                            ? 'border-emerald-500' 
                            : 'border-white/25 bg-[#009DFF]'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingAvatar(true);
                        }}
                        onDragLeave={() => setIsDraggingAvatar(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingAvatar(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleSidebarAvatarFile(file);
                        }}
                        onClick={() => sidebarFileInputRef.current?.click()}
                        title="Upload profile picture (Drop or Click)"
                      >
                        <input
                          type="file"
                          ref={sidebarFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSidebarAvatarFile(file);
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
                          <span className="text-white font-black text-lg select-none">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditingName ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="px-2 py-1 text-xs font-bold border rounded-lg focus:outline-none focus:border-[#4DA6FF] bg-white text-slate-800 w-32"
                              maxLength={16}
                            />
                            <button
                              onClick={saveProfileName}
                              className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shrink-0 cursor-pointer"
                              title="Save"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-extrabold truncate uppercase">{profile.name}</h3>
                            <button
                              onClick={() => setIsEditingName(true)}
                              className="p-1 hover:text-[#009DFF] text-slate-400 transition"
                              title="Rename Nickname"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-[#87CEEB] font-bold uppercase tracking-wider leading-none">
                            {t('skillTier')}: <span className="text-[#009DFF] font-black">{profile.experience}</span>
                          </p>
                          {profile.avatarUrl && (
                            <button
                              onClick={handleRemoveAvatar}
                              className="text-[9px] text-red-400 hover:text-red-500 hover:underline font-bold uppercase tracking-wider transition-colors cursor-pointer leading-none"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {avatarError && (
                      <p className="text-[9px] text-red-500 font-bold mt-1.5 text-center">{avatarError}</p>
                    )}

                    <div className="mt-4 pt-3.5 border-t border-slate-300/20 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{t('activeEmail')}</span>
                        <span className="font-mono text-[11px] font-semibold text-[#009DFF] truncate max-w-[180px]" title={profile.email}>
                          {profile.email || 'local.guest@skudo.zip'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Account Sync Key:</span>
                        <div className="flex items-center gap-1 bg-[#4DA6FF]/10 text-[#4DA6FF] px-2 py-0.5 rounded-lg font-mono text-[10px] font-black">
                          <span>SK-{profile.xp}-{profile.streak}</span>
                          <button
                            onClick={copyAccountID}
                            className="hover:text-blue-600 active:scale-95 transition cursor-pointer"
                            title="Copy Account Code ID"
                          >
                            {copyFeedback ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      </div>
                      {copyFeedback && (
                        <div className="text-[9.5px] text-emerald-500 font-bold text-right leading-none transition-all">
                          {t('copySuccess')}
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* SECTION 2: SYSTEM TOGGLES */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-[#87CEEB]">{t('ambientDark')} & FX</h4>
                  
                  {/* Toggle: Dark Mode */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? <Moon className="w-4.5 h-4.5 text-indigo-400" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
                      <span className="text-xs font-bold">{t('ambientDark')}</span>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`w-11 h-6 rounded-full p-1 transition-colors outline-none cursor-pointer duration-200 ${
                        theme === 'dark' ? 'bg-[#4DA6FF]' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle: Audio FX */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {audioEnabled ? <Volume2 className="w-4.5 h-4.5 text-emerald-500 animate-pulse" /> : <VolumeX className="w-4.5 h-4.5 text-red-400" />}
                      <span className="text-xs font-bold">{t('soundsLabel')}</span>
                    </div>
                    <button
                      onClick={toggleSound}
                      className={`w-11 h-6 rounded-full p-1 transition-colors outline-none cursor-pointer duration-200 ${
                        audioEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        audioEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle: Vibration */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Smartphone className={`w-4.5 h-4.5 ${vibrateEnabled ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">{t('vibrationLabel')}</span>
                    </div>
                    <button
                      onClick={toggleVibration}
                      className={`w-11 h-6 rounded-full p-1 transition-colors outline-none cursor-pointer duration-200 ${
                        vibrateEnabled ? 'bg-indigo-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        vibrateEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle: Notifications */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Bell className={`w-4.5 h-4.5 ${notificationsEnabled ? 'text-[#009DFF]' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">{t('notifLabel')}</span>
                    </div>
                    <button
                      onClick={toggleNotifications}
                      className={`w-11 h-6 rounded-full p-1 transition-colors outline-none cursor-pointer duration-200 ${
                        notificationsEnabled ? 'bg-[#009DFF]' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* SECTION 3: CHOOSE LANGUAGE (20+ LANGUAGE SUPPORT EFFECTIVE) */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-[#87CEEB]">{t('langTitle')}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {LANGUAGES_LIST.map((lang) => {
                      const isActive = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`px-3 py-2 text-left rounded-xl text-[11px] font-bold border transition flex items-center justify-between cursor-pointer ${
                            isActive
                              ? 'border-[#009DFF] bg-[#E0F4FF]/50 text-[#009DFF]'
                              : theme === 'dark' ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800' : 'border-slate-100 bg-white hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{lang.native}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#009DFF] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 4: BASIC SUDOKU RULES */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-[#87CEEB]">{t('basicRules')}</h4>
                  <div className={`p-4 rounded-2xl border text-xs flex flex-col gap-3 ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <input type="checkbox" defaultChecked className="mt-0.5" />
                      <p className="leading-normal">{t('rulesDesc1')}</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <input type="checkbox" defaultChecked className="mt-0.5" />
                      <p className="leading-normal">{t('rulesDesc2')}</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <input type="checkbox" defaultChecked className="mt-0.5" />
                      <p className="leading-normal">{t('rulesDesc3')}</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: PLAY STATISTICS OF ALL DIFFICULTIES & SEPARATE GRAPH */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-[#87CEEB]">{t('statsTitle')}</h4>
                  <div className={`p-4.5 rounded-2xl border flex flex-col gap-4 ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    {/* Numerical Data Grid separated */}
                    <div className="grid grid-cols-2 gap-3 text-center text-xs">
                      <div 
                        onClick={() => {
                          gameAudio.playClick();
                          setShowDetailedStats(true);
                        }}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-300/10 flex flex-col gap-1 cursor-pointer hover:border-[#009DFF]/65 hover:scale-[1.03] transition duration-200"
                        title="Click to view detailed difficulty statistics"
                      >
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase">Numbers Played</span>
                        <span className="font-mono font-black text-[#4DA6FF]">
                          {(statsBreakdown.numbers?.zen || 0) + (statsBreakdown.numbers?.flow || 0) + (statsBreakdown.numbers?.focus || 0) + (statsBreakdown.numbers?.quantum || 0)}
                        </span>
                      </div>
                      <div 
                        onClick={() => {
                          gameAudio.playClick();
                          setShowDetailedStats(true);
                        }}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-300/10 flex flex-col gap-1 cursor-pointer hover:border-emerald-500/65 hover:scale-[1.03] transition duration-200"
                        title="Click to view detailed difficulty statistics"
                      >
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase">Letters Played</span>
                        <span className="font-mono font-black text-[#08b7f8]">
                          {(statsBreakdown.letters?.zen || 0) + (statsBreakdown.letters?.flow || 0) + (statsBreakdown.letters?.focus || 0) + (statsBreakdown.letters?.quantum || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Highly responsive custom animated SVG line and progression wave representation graph */}
                    <div 
                      onClick={() => {
                        gameAudio.playClick();
                        setShowDetailedStats(true);
                      }}
                      className="flex flex-col gap-1 cursor-pointer group"
                      title="Click to open detailed statistics"
                    >
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase ml-1 flex items-center gap-1.5 group-hover:text-[#009DFF] transition-colors">
                        <TrendingUp className="w-3 h-3 text-[#009DFF]" />
                        Score Wave Trendline (Tap to Inspect)
                      </span>
                      <div className="w-full h-[120px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-center relative overflow-hidden group-hover:border-[#009DFF]/40 transition-colors">
                        {/* Custom visual grid overlay */}
                        <svg viewBox="0 0 100 40" className="w-full h-full text-[#4DA6FF]" fill="none" stroke="currentColor">
                          <defs>
                            <linearGradient id="svgGraphGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4DA6FF" stopOpacity="0.32" />
                              <stop offset="100%" stopColor="#4DA6FF" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Grid horizontal markers */}
                          <line x1="0" y1="10" x2="100" y2="10" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                          <line x1="0" y1="20" x2="100" y2="20" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                          <line x1="0" y1="30" x2="100" y2="30" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />

                          {/* Dynamic SVG Wave paths */}
                          <path
                            d="M 5,35 Q 20,12 35,28 T 65,10 T 95,15"
                            fill="url(#svgGraphGrad)"
                            className="transition-all duration-700"
                          />
                          <path
                            d="M 5,35 Q 20,12 35,28 T 65,10 T 95,15"
                            fill="none"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            className="transition-all duration-700 animate-pulse text-[#4DA6FF]"
                          />

                          {/* Pulsing indicator dots */}
                          <circle cx="35" cy="28" r="1.5" className="fill-emerald-500 cursor-pointer text-white animate-pulse" />
                          <circle cx="65" cy="10" r="1.5" className="fill-amber-500 cursor-pointer animate-pulse" />
                          <circle cx="95" cy="15" r="1.5" className="fill-[#009DFF]" />
                        </svg>
                        
                        <div className="absolute bottom-1 right-2 font-mono text-[8px] text-slate-400">
                          Games: {profile ? (profile.totalGames || 5) : 5} • Wins: {profile ? profile.completedGames : 0}
                        </div>
                      </div>
                    </div>

                    {/* View detailed statistics click button */}
                    <button
                      onClick={() => {
                        gameAudio.playClick();
                        setShowDetailedStats(true);
                      }}
                      className="w-full py-2.5 bg-[#4DA6FF]/10 hover:bg-[#4DA6FF]/20 text-[#009DFF] border border-[#4DA6FF]/25 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>📊 Open Advanced Analytics Pages</span>
                    </button>
                  </div>
                </div>

                {/* SECTION 6: TOURNAMENT / STRATEGIES ACCORDION (Interactive Academy Hub) */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-[#87CEEB]">{t('strategiesTitle')}</h4>
                  <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                    theme === 'dark' ? 'bg-[#151B2E]/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="p-2.5 bg-gradient-to-br from-[#009DFF] to-[#3BA7FF] rounded-xl flex items-center justify-center text-white shadow-md">
                        <BookOpen className="w-5 h-5" />
                      </span>
                      <div className="text-left mr-1">
                        <h4 className="text-xs font-black uppercase tracking-wider">SKUDO STRATEGY ACADEMY</h4>
                        <p className="text-[11.5px] font-bold text-slate-400 leading-relaxed mt-0.5">
                          Unleash deductive mastery. Review all **95 strategies** organized from absolute beginner up to computer-level SAT Solvers step-by-step with interactive examples.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">🟢 Beginner</span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-500">🔵 Easy</span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500">🟡 Intermediate</span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500">🟠 Advanced</span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500">🔴 Expert</span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-100">🔥 Extreme</span>
                    </div>

                    <button
                      onClick={() => {
                        gameAudio.playClick();
                        triggerVibe();
                        setShowStrategyAcademy(true);
                      }}
                      className="w-full py-2.5 mt-1 bg-[#009DFF] hover:opacity-95 text-white font-black text-[11px] uppercase tracking-wider rounded-xl cursor-pointer shadow flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-white" />
                      <span>Open Strategy Academy Hub (95/95 System)</span>
                    </button>
                  </div>
                </div>

                {/* SECTION 7: SHARE CARD */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-[#87CEEB]">{t('shareTitle')}</h4>
                  <div className={`p-4 rounded-2xl border text-xs flex flex-col gap-3.5 items-stretch ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <p className="text-slate-400 font-medium text-center">Share your incredible Sudoku high scorer milestones instantly across device systems & media apps!</p>
                    <div className="flex items-center justify-center flex-wrap gap-2" id="social-share-quick-clicks">
                      {[
                        { title: 'WhatsApp', color: '#128C7E', url: 'https://api.whatsapp.com/send/' },
                        { title: 'Facebook', color: '#3B5998', url: 'https://www.facebook.com/sharer/' },
                        { title: 'Telegram', color: '#0088cc', url: 'https://telegram.me/share/' },
                        { title: 'X', color: '#000000', url: 'https://twitter.com/intent/tweet' },
                        { 
                          title: 'Instagram', 
                          color: '#E1306C', 
                          action: () => {
                            setShowInstagramModal(true);
                          }
                        }
                      ].map((item) => (
                        <button
                          key={item.title}
                          onClick={() => {
                            gameAudio.playClick();
                            triggerVibe();
                            if ('action' in item && item.action) {
                              item.action();
                            } else if ('url' in item && item.url) {
                              const msg = encodeURIComponent(`I am playing SKUDO.ZIP - Dynamic minimal daily Sudoku with ${profile ? profile.xp : 0} XP! Invite code is SK-${profile ? profile.xp : 0}-${profile ? profile.streak : ''}`);
                              window.open(`${item.url}?text=${msg}`, '_blank');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-white font-extrabold text-[10.5px] cursor-pointer hover:scale-105 active:scale-95 transition"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 8: ABOUT BOX */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-[#87CEEB]">{t('aboutTitle')}</h4>
                  <div className={`p-4 rounded-xl border text-xs flex flex-col gap-2 ${
                    theme === 'dark' ? 'bg-[#151B2E]/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    <div className="flex justify-between">
                      <span className="font-bold">Launch Schedule Date:</span>
                      <span className="font-mono">2026-05-30</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Version:</span>
                      <span className="font-mono">v1.5.0-Release</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Core Engine Specs:</span>
                      <span className="font-mono">Vite + React + TSX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Telemetry Health:</span>
                      <div className="flex items-center gap-1.5 font-bold text-emerald-500 text-[10px]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>OPERATIONAL LIVE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LOGOUT OPTION BUTTON CARD */}
                <button
                  onClick={handleLogout}
                  className="w-full py-4.5 bg-red-600/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 mb-4"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logoutBtn')}</span>
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE DETAILED STATS POPUP/SHEET */}
      <AnimatePresence>
        {showDetailedStats && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className={`rounded-3xl border w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col ${
                theme === 'dark' ? 'bg-[#111A2E]' : 'bg-white'
              }`}
              style={{
                borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0',
                color: theme === 'dark' ? '#FFF' : '#1E293B'
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200/40 dark:border-slate-800 bg-gradient-to-r from-sky-50 to-[#009DFF]/10 dark:from-[#111A2E] dark:to-[#182542] flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#009DFF]/10 text-[#009DFF] rounded-lg">
                      <Activity className="w-5 h-5 animate-pulse" />
                    </span>
                    <h3 className="text-base font-black uppercase tracking-tight">
                      Detailed Difficulty Analytics & Charts
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Live performance metrics, mistake ratios & visual speedometers per difficulty level.
                  </p>
                </div>
                <button
                  onClick={() => { gameAudio.playClick(); setShowDetailedStats(false); }}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Tabs Selector */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-start gap-2 overflow-x-auto bg-slate-50 dark:bg-slate-950/40">
                {[
                  { key: 'zen' as const, name: 'Zen Solver', icon: '🧘‍♂️' },
                  { key: 'flow' as const, name: 'Flow State', icon: '🌊' },
                  { key: 'focus' as const, name: 'Focus Master', icon: '🎯' },
                  { key: 'quantum' as const, name: 'Quantum Logic', icon: '🌌' },
                ].map((tab) => {
                  const isActive = activeStatsTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        gameAudio.playClick();
                        setActiveStatsTab(tab.key);
                      }}
                      className={`px-4 py-2.5 border-2 rounded-full text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isActive
                          ? 'border-[#0B1E40] bg-[#0B1E40] text-white shadow-md'
                          : 'border-slate-250 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 shadow-sm'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modal Core Content Scrollable Tab Dashboard Grid */}
              <div className="p-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
                {(() => {
                  const stats = getNormalizedDifficultyStats();
                  const dStat = stats[activeStatsTab];
                  const totalDGames = dStat.wins + dStat.losses;
                  const dWinRate = totalDGames > 0 ? Math.round((dStat.wins / totalDGames) * 100) : 0;
                  
                  // Config elements depending on selected active option
                  const themeColor = activeStatsTab === 'zen' ? 'text-emerald-500' :
                             activeStatsTab === 'flow' ? 'text-cyan-500' :
                             activeStatsTab === 'focus' ? 'text-amber-500' :
                             'text-purple-500';

                  const progressGradStart = activeStatsTab === 'zen' ? '#10B981' :
                                    activeStatsTab === 'flow' ? '#06B6D4' :
                                    activeStatsTab === 'focus' ? '#F59E0B' :
                                    '#8B5CF6';

                  return (
                    <div className="flex flex-col gap-6">
                      {/* Numeric Metrics Cards with Inline Graphical Sparkline Charts */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-slate-800 dark:text-slate-105">
                        
                        {/* 1. Wins Card */}
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setSelectedStatsMetric('wins');
                          }}
                          className={`p-3 relative rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between items-center text-center overflow-hidden h-[95px] select-none ${
                            selectedStatsMetric === 'wins'
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-200/50 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/20 hover:border-slate-350 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Wins (Completions)</span>
                          <p className="font-mono font-black text-emerald-500 text-lg mt-0.5 z-10">{dStat.wins}</p>
                          
                          {/* Mini inline graphical chart for Wins */}
                          <div className="w-full h-6 mt-1 relative z-0">
                            <svg viewBox="0 0 100 24" className="w-full h-full text-emerald-500 fill-none" stroke="currentColor">
                              <path
                                d={`M 5,20 Q 25,${Math.max(4, 18 - dStat.wins * 1.5)} 50,${Math.max(4, 15 - dStat.wins * 2.5)} T 95,${Math.max(3, 12 - dStat.wins * 4)}`}
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <circle cx="95" cy={Math.max(3, 12 - dStat.wins * 4)} r="1.5" className="fill-emerald-400" />
                            </svg>
                          </div>
                        </button>

                        {/* 2. Losses Card */}
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setSelectedStatsMetric('losses');
                          }}
                          className={`p-3 relative rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between items-center text-center overflow-hidden h-[95px] select-none ${
                            selectedStatsMetric === 'losses'
                              ? 'border-red-500 bg-red-550/10'
                              : 'border-slate-200/50 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/20 hover:border-slate-350 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Losses (Abandoned/Fail)</span>
                          <p className="font-mono font-black text-red-500 text-lg mt-0.5 z-10">{dStat.losses}</p>
                          
                          {/* Mini inline graphical chart for Losses */}
                          <div className="w-full h-6 mt-1 relative z-0">
                            <svg viewBox="0 0 100 24" className="w-full h-full text-red-500 fill-none" stroke="currentColor">
                              <path
                                d={`M 5,6 Q 35,${Math.min(20, 8 + dStat.losses * 2)} 65,${Math.min(22, 10 + dStat.losses * 3.5)} T 95,${Math.min(23, 12 + dStat.losses * 5.5)}`}
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <circle cx="95" cy={Math.min(23, 12 + dStat.losses * 5.5)} r="1.5" className="fill-red-400" />
                            </svg>
                          </div>
                        </button>

                        {/* 3. Perfect Games Card */}
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setSelectedStatsMetric('perfectWins');
                          }}
                          className={`p-3 relative rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between items-center text-center overflow-hidden h-[95px] select-none col-span-2 md:col-span-1 ${
                            selectedStatsMetric === 'perfectWins'
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-slate-200/50 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/20 hover:border-slate-350 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Perfect Games (0 Mistakes)</span>
                          <p className="font-mono font-black text-amber-500 text-lg mt-0.5 z-10">⭐ {dStat.perfectWins}</p>
                          
                          {/* Mini inline graphical chart for Perfect Wins */}
                          <div className="w-full h-6 mt-1 relative z-0">
                            <svg viewBox="0 0 100 24" className="w-full h-full text-amber-500 fill-none" stroke="currentColor">
                              <path
                                d={`M 5,20 C 25,21 55,${Math.max(6, 18 - dStat.perfectWins * 2.5)} 90,${Math.max(4, 10 - dStat.perfectWins * 5.5)}`}
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <circle cx="90" cy={Math.max(4, 10 - dStat.perfectWins * 5.5)} r="1.5" className="fill-amber-400" />
                            </svg>
                          </div>
                        </button>

                        {/* 4. Best Score Card */}
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setSelectedStatsMetric('bestScore');
                          }}
                          className={`p-3 relative rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between items-center text-center overflow-hidden h-[95px] select-none ${
                            selectedStatsMetric === 'bestScore'
                              ? 'border-sky-500 bg-sky-500/10'
                              : 'border-slate-200/50 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/20 hover:border-slate-350 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Best Played Score</span>
                          <p className={`font-mono font-black text-lg mt-0.5 z-10 ${themeColor}`}>{dStat.bestScore || '—'}</p>
                          
                          {/* Mini inline graphical chart for Best Score */}
                          <div className="w-full h-6 mt-1 relative z-0">
                            <svg viewBox="0 0 100 24" className="w-full h-full text-sky-500 fill-none" stroke="currentColor">
                              {dStat.bestScore ? (
                                <path
                                  d={`M 5,18 Q 30,16 55,${Math.max(4, 20 - (dStat.bestScore / 1300) * 16)} T 95,${Math.max(3, 18 - (dStat.bestScore / 1300) * 16)}`}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              ) : (
                                <line x1="5" y1="12" x2="95" y2="12" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
                              )}
                            </svg>
                          </div>
                        </button>

                        {/* 5. Best Standard Time Card */}
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setSelectedStatsMetric('bestTime');
                          }}
                          className={`p-3 relative rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between items-center text-center overflow-hidden h-[95px] select-none ${
                            selectedStatsMetric === 'bestTime'
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-slate-200/50 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/20 hover:border-slate-350 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Best Speed Record</span>
                          <p className="font-mono font-black text-[#009DFF] text-lg mt-0.5 z-10">{formatSeconds(dStat.bestTime)}</p>
                          
                          {/* Mini inline graphical chart for Best Time */}
                          <div className="w-full h-6 mt-1 relative z-0">
                            <svg viewBox="0 0 100 24" className="w-full h-full text-indigo-500 fill-none" stroke="currentColor">
                              {dStat.bestTime ? (
                                <path
                                  d={`M 5,8 C 25,12 55,${Math.min(22, 10 + (dStat.bestTime / 1000) * 10)} 95,${Math.min(22, 12 + (dStat.bestTime / 1000) * 10)}`}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              ) : (
                                <line x1="5" y1="12" x2="95" y2="12" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
                              )}
                            </svg>
                          </div>
                        </button>

                        {/* 6. Perfect Best Time Card */}
                        <button
                          onClick={() => {
                            gameAudio.playClick();
                            setSelectedStatsMetric('perfectBestTime');
                          }}
                          className={`p-3 relative rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between items-center text-center overflow-hidden h-[95px] select-none col-span-2 md:col-span-1 ${
                            selectedStatsMetric === 'perfectBestTime'
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-slate-200/50 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/20 hover:border-slate-350 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Lucky Perfect Best Time</span>
                          <p className="font-mono font-black text-amber-500 text-lg mt-0.5 z-10">{formatSeconds(dStat.perfectBestTime)}</p>
                          
                          {/* Mini inline graphical chart for Perfect Best Time */}
                          <div className="w-full h-6 mt-1 relative z-0">
                            <svg viewBox="0 0 100 24" className="w-full h-full text-amber-500 fill-none" stroke="currentColor">
                              {dStat.perfectBestTime ? (
                                <path
                                  d={`M 5,6 Q 35,${Math.min(20, 8 + (dStat.perfectBestTime / 1000) * 10)} 95,${Math.min(22, 10 + (dStat.perfectBestTime / 1000) * 12)}`}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              ) : (
                                <line x1="5" y1="12" x2="95" y2="12" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
                              )}
                            </svg>
                          </div>
                        </button>
                      </div>

                      {/* Detailed Expanded Dynamic Chart Section */}
                      <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-left flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-[#009DFF] animate-pulse" />
                            <span>Detailed Live Graph: {
                              selectedStatsMetric === 'wins' ? 'Wins & Growth Curve' :
                              selectedStatsMetric === 'losses' ? 'Defeat Ratio & Stability Rate' :
                              selectedStatsMetric === 'perfectWins' ? 'Flawless Deduction Success' :
                              selectedStatsMetric === 'bestScore' ? 'Solve Rating Progression Curve' :
                              selectedStatsMetric === 'bestTime' ? 'Speed Optimization & Velocity' :
                              'Apex Perfect Timer Record'
                            }</span>
                          </h4>
                          <span className="text-[8.5px] bg-[#009DFF]/15 text-[#009DFF] px-2 py-0.5 rounded font-black font-mono uppercase">
                            ACTIVE: {activeStatsTab}
                          </span>
                        </div>

                        <div className="w-full h-[145px] bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden shadow-inner">
                          {selectedStatsMetric === 'wins' && (
                            <>
                              <svg viewBox="0 0 100 40" className="w-full h-full text-emerald-500 fill-none" stroke="currentColor">
                                <defs>
                                  <linearGradient id="winsChartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <line x1="0" y1="10" x2="100" y2="10" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="20" x2="100" y2="20" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="30" x2="100" y2="30" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <path
                                  d={`M 5,35 H 100 V 40 H 5 Z`}
                                  fill="url(#winsChartGrad)"
                                  stroke="none"
                                />
                                <path
                                  d={`M 5,35 Q 25,${Math.max(5, 30 - dStat.wins * 2.2)} 50,${Math.max(5, 23 - dStat.wins * 4.5)} T 95,${Math.max(3, 18 - dStat.wins * 6.8)}`}
                                  stroke="#10B981"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <circle cx="5" cy="35" r="2.5" className="fill-emerald-500" />
                                <circle cx="50" cy={Math.max(5, 23 - dStat.wins * 4.5)} r="2" className="fill-white stroke-emerald-500 stroke-2" />
                                <circle cx="95" cy={Math.max(3, 18 - dStat.wins * 6.8)} r="2.5" className="fill-white stroke-emerald-500 stroke-2 animate-ping" />
                                <circle cx="95" cy={Math.max(3, 18 - dStat.wins * 6.8)} r="2.5" className="fill-white stroke-emerald-500 stroke-2" />
                              </svg>
                              <div className="flex justify-between font-mono text-[7.5px] text-slate-400 uppercase font-black px-1 mt-1 leading-none select-none">
                                <span>Initial solver</span>
                                <span>Consid progress</span>
                                <span>Peak tier ({dStat.wins} Wins)</span>
                              </div>
                            </>
                          )}

                          {selectedStatsMetric === 'losses' && (
                            <>
                              <svg viewBox="0 0 100 40" className="w-full h-full text-red-500 fill-none" stroke="currentColor">
                                <defs>
                                  <linearGradient id="lossesChartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <line x1="0" y1="10" x2="100" y2="10" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="20" x2="100" y2="20" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="30" x2="100" y2="30" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <path
                                  d={`M 5,10 Q 25,${Math.min(35, 12 + dStat.losses * 3)} 50,${Math.min(35, 15 + dStat.losses * 5.2)} T 95,${Math.min(38, 20 + dStat.losses * 7.8)}`}
                                  stroke="#EF4444"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <circle cx="5" cy="10" r="2.5" className="fill-red-500" />
                                <circle cx="50" cy={Math.min(35, 15 + dStat.losses * 5.2)} r="2" className="fill-white stroke-red-500 stroke-2" />
                                <circle cx="95" cy={Math.min(38, 20 + dStat.losses * 7.8)} r="2.5" className="fill-white stroke-red-500 stroke-2" />
                              </svg>
                              <div className="flex justify-between font-mono text-[7.5px] text-slate-400 uppercase font-black px-1 mt-1 leading-none select-none">
                                <span>Baseline safe</span>
                                <span>Stability Index</span>
                                <span>Surrenders ({dStat.losses})</span>
                              </div>
                            </>
                          )}

                          {selectedStatsMetric === 'perfectWins' && (
                            <>
                              <svg viewBox="0 0 100 40" className="w-full h-full text-amber-500 fill-none" stroke="currentColor">
                                <line x1="0" y1="10" x2="100" y2="10" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="20" x2="100" y2="20" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="30" x2="100" y2="30" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <path
                                  d={`M 5,35 C 20,38 40,${Math.max(12, 35 - dStat.perfectWins * 4.2)} 60,${Math.max(8, 28 - dStat.perfectWins * 6.5)} T 95,${Math.max(4, 22 - dStat.perfectWins * 9.5)}`}
                                  stroke="#F59E0B"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <circle cx="5" cy="35" r="2.5" className="fill-amber-500" />
                                <circle cx="95" cy={Math.max(4, 22 - dStat.perfectWins * 9.5)} r="2.5" className="fill-white stroke-amber-500 stroke-2" />
                              </svg>
                              <div className="flex justify-between font-mono text-[7.5px] text-slate-400 uppercase font-black px-1 mt-1 leading-none select-none">
                                <span>Aspirant tier</span>
                                <span>Elite rating solver</span>
                                <span>Flawless games ({dStat.perfectWins})</span>
                              </div>
                            </>
                          )}

                          {selectedStatsMetric === 'bestScore' && (
                            <>
                              <svg viewBox="0 0 100 40" className="w-full h-full text-sky-500 fill-none" stroke="currentColor">
                                <line x1="0" y1="10" x2="100" y2="10" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="20" x2="100" y2="20" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="30" x2="100" y2="30" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                {dStat.bestScore ? (
                                  <>
                                    <path
                                      d={`M 5,35 Q 25,32 50,${Math.max(8, 35 - (dStat.bestScore / 1300) * 22)} H 95`}
                                      stroke="#4DA6FF"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                    <circle cx="50" cy={Math.max(8, 35 - (dStat.bestScore / 1300) * 22)} r="2.5" className="fill-[#009DFF]" />
                                    <circle cx="95" cy={Math.max(8, 35 - (dStat.bestScore / 1300) * 22)} r="2" className="fill-white stroke-[#009DFF] stroke-2" />
                                  </>
                                ) : (
                                  <path d="M 5,35 H 95" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                                )}
                              </svg>
                              <div className="flex justify-between font-mono text-[7.5px] text-slate-400 uppercase font-black px-1 mt-1 leading-none select-none">
                                <span>unrated score</span>
                                <span>mid rating solving</span>
                                <span>High record ({dStat.bestScore || '—'})</span>
                              </div>
                            </>
                          )}

                          {selectedStatsMetric === 'bestTime' && (
                            <>
                              <svg viewBox="0 0 100 40" className="w-full h-full text-indigo-500 fill-none" stroke="currentColor">
                                <line x1="0" y1="10" x2="100" y2="10" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="20" x2="100" y2="20" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="30" x2="100" y2="30" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                {dStat.bestTime ? (
                                  <>
                                    <path
                                      d={`M 5,12 C 25,12 45,${Math.min(34, 15 + (dStat.bestTime / 1200) * 14)} 95,${Math.min(38, 12 + (dStat.bestTime / 1200) * 18)}`}
                                      stroke="#6366F1"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                    <circle cx="5" cy="12" r="2.5" className="fill-[#6366F1]" />
                                    <circle cx="95" cy={Math.min(38, 12 + (dStat.bestTime / 1200) * 18)} r="2.5" className="fill-white stroke-[#6366F1] stroke-2" />
                                  </>
                                ) : (
                                  <path d="M 5,20 H 95" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                                )}
                              </svg>
                              <div className="flex justify-between font-mono text-[7.5px] text-slate-400 uppercase font-black px-1 mt-1 leading-none select-none">
                                <span>elite clock limit</span>
                                <span>avg completion seconds</span>
                                <span>Record ({formatSeconds(dStat.bestTime)})</span>
                              </div>
                            </>
                          )}

                          {selectedStatsMetric === 'perfectBestTime' && (
                            <>
                              <svg viewBox="0 0 100 40" className="w-full h-full text-amber-500 fill-none" stroke="currentColor">
                                <line x1="0" y1="10" x2="100" y2="10" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="20" x2="100" y2="20" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                <line x1="0" y1="30" x2="100" y2="30" stroke="#CBD5E1" strokeWidth="0.1" strokeDasharray="1 1" />
                                {dStat.perfectBestTime ? (
                                  <>
                                    <path
                                      d={`M 5,10 Q 35,${Math.min(30, 11 + (dStat.perfectBestTime / 1000) * 11)} 95,${Math.min(35, 11 + (dStat.perfectBestTime / 1000) * 16)}`}
                                      stroke="#F59E0B"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                    <circle cx="5" cy="10" r="2" className="fill-amber-550" />
                                    <circle cx="95" cy={Math.min(35, 11 + (dStat.perfectBestTime / 1000) * 16)} r="2.5" className="fill-white stroke-amber-500 stroke-2" />
                                  </>
                                ) : (
                                  <path d="M 5,25 H 95" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                                )}
                              </svg>
                              <div className="flex justify-between font-mono text-[7.5px] text-slate-400 uppercase font-black px-1 mt-1 leading-none select-none">
                                <span>God speed record</span>
                                <span>unblemished tempo flow</span>
                                <span>flawless best ({formatSeconds(dStat.perfectBestTime)})</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Visual Graphical Representations Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Comparison bar chart comparing Wins, Losses, and Perfect Runs */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl text-slate-800 dark:text-slate-100">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-[#009DFF]" />
                            Volume Distribution Chart
                          </h4>
                          <div className="w-full h-[140px] flex items-end justify-around pb-2 border-b border-slate-200 dark:border-slate-800 px-4">
                            {/* Win Column */}
                            <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                              <span className="font-mono text-[9px] font-bold text-emerald-500">{dStat.wins}</span>
                              <div 
                                className="w-full bg-emerald-500/80 rounded-t-lg transition-all duration-500 cursor-pointer hover:bg-emerald-400"
                                style={{ height: `${dStat.wins > 0 ? Math.max(10, Math.min(100, (dStat.wins / Math.max(1, dStat.wins + dStat.losses + dStat.perfectWins)) * 100)) : 4}px` }}
                                title={`${dStat.wins} Wins`}
                              />
                              <span className="text-[8px] font-extrabold text-slate-450 uppercase">Wins</span>
                            </div>

                            {/* Loss Column */}
                            <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                              <span className="font-mono text-[9px] font-bold text-red-500">{dStat.losses}</span>
                              <div 
                                className="w-full bg-red-500/80 rounded-t-lg transition-all duration-500 cursor-pointer hover:bg-red-400"
                                style={{ height: `${dStat.losses > 0 ? Math.max(10, Math.min(100, (dStat.losses / Math.max(1, dStat.wins + dStat.losses + dStat.perfectWins)) * 100)) : 4}px` }}
                                title={`${dStat.losses} Defeats`}
                              />
                              <span className="text-[8px] font-extrabold text-slate-450 uppercase">Losses</span>
                            </div>

                            {/* Perfect Run Column */}
                            <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                              <span className="font-mono text-[9px] font-bold text-amber-500">{dStat.perfectWins}</span>
                              <div 
                                className="w-full bg-amber-500/80 rounded-t-lg transition-all duration-500 cursor-pointer hover:bg-amber-400"
                                style={{ height: `${dStat.perfectWins > 0 ? Math.max(10, Math.min(100, (dStat.perfectWins / Math.max(1, dStat.wins + dStat.losses + dStat.perfectWins)) * 100)) : 4}px` }}
                                title={`${dStat.perfectWins} Perfect Runs`}
                              />
                              <span className="text-[8px] font-extrabold text-slate-450 uppercase">Perfect</span>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 text-center mt-2.5 font-bold uppercase tracking-wider">
                            Total Games Logged: {totalDGames} Games
                          </p>
                        </div>

                        {/* 2. Donut Gauge circular progress widget showing win percentage */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col items-center justify-between text-slate-800 dark:text-slate-100">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full text-left mb-1">
                            Victory Coefficient Gauge
                          </h4>
                          <div className="relative w-28 h-28 flex items-center justify-center mt-2">
                            {/* SVG Donut Dial */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              {/* Background empty trail */}
                              <path
                                className="text-slate-200 dark:text-slate-800"
                                strokeWidth="3"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              {/* Glowing Active Ring indicating win percentage */}
                              <path
                                className="transition-all duration-1000 ease-out"
                                strokeDasharray={`${dWinRate}, 100`}
                                strokeWidth="3"
                                strokeLinecap="round"
                                stroke={progressGradStart}
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            {/* Centered textual statistics feedback */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="font-mono font-black text-xl leading-none text-slate-800 dark:text-white">{dWinRate}%</span>
                              <span className="text-[7.5px] uppercase text-slate-400 font-extrabold mt-0.5 tracking-wider font-mono">Win Rate</span>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 text-center mt-2 font-bold uppercase tracking-wider">
                            Perfected Ratio: {totalDGames > 0 ? Math.round((dStat.perfectWins / totalDGames) * 100) : 0}% of runs
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Stats Footer bar */}
              <div className="p-4 border-t border-slate-200/30 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1524] flex items-center justify-between shrink-0">
                <p className="text-[9px] tracking-wider text-slate-400 dark:text-slate-500 font-bold uppercase">
                  Skudo Core Stats Engine &bull; Auto-sync
                </p>
                <button
                  onClick={() => { gameAudio.playClick(); setShowDetailedStats(false); }}
                  className="px-5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-black text-xs uppercase tracking-wide rounded-xl cursor-pointer shadow-sm transition"
                >
                  Close Insights
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE INSTAGRAM SHARE MODAL */}
      <AnimatePresence>
        {showInstagramModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 25 }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className={`rounded-3xl border w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row ${
                theme === 'dark' ? 'bg-[#0f1524] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => { gameAudio.playClick(); setShowInstagramModal(false); }}
                className="absolute right-4 top-4 z-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Close"
              >
                <X className="w-5.5 h-5.5" />
              </button>

              {/* Left Side: Live Render Preview */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 font-semibold text-slate-500">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#009DFF] mb-3">Live Story Preview</span>
                
                {/* Simulated Device Frame for Story Aspect Ratio */}
                <div 
                  className={`relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-850 flex items-center justify-center ${
                    instagramLayout === 'story' ? 'aspect-[9/16] w-[210px] h-[373px]' : 'aspect-square w-[220px] h-[220px]'
                  }`}
                >
                  <canvas 
                    ref={(el) => {
                      if (el) {
                        drawInstagramCard(el, instagramLayout, instagramDesign, profile);
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[9.5px] text-slate-450 mt-2.5 font-bold uppercase tracking-wider">Rendered via canvas</p>
              </div>

              {/* Right Side: Options & Interactive Actions */}
              <div className="flex-1 p-6 flex flex-col justify-between gap-4 text-left">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-pink-500 animate-pulse" />
                    <span>Instagram Share Studio</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Design a gorgeous high-fidelity graphic banner to share your Sudoku milestones directly on Instagram Stories or Feed.
                  </p>

                  {/* 1. Layout Selection */}
                  <div className="mt-4 flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">1. Select Frame Layout</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { gameAudio.playClick(); setInstagramLayout('story'); }}
                        className={`px-3 py-2 border rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          instagramLayout === 'story'
                            ? 'border-[#009DFF] bg-[#009DFF]/10 text-[#009DFF]'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="text-sm">📱</span>
                        <span>9:16 Story Format</span>
                      </button>
                      <button
                        onClick={() => { gameAudio.playClick(); setInstagramLayout('feed'); }}
                        className={`px-3 py-2 border rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          instagramLayout === 'feed'
                            ? 'border-[#009DFF] bg-[#009DFF]/10 text-[#009DFF]'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="text-sm">🔳</span>
                        <span>1:1 Square Feed</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Color Scheme Picker */}
                  <div className="mt-4 flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">2. Customize Background Design</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'sunset' as const, name: '🌅 Sunset Gold', bg: 'bg-gradient-to-r from-red-500 to-amber-500' },
                        { id: 'neon' as const, name: '🔮 Royal Cyber', bg: 'bg-gradient-to-r from-[#8514F5] to-[#F107A3]' },
                        { id: 'emerald' as const, name: '🍃 Emerald Flow', bg: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
                        { id: 'slate' as const, name: '🕶️ Cosmic Slate', bg: 'bg-gradient-to-r from-slate-950 to-slate-800 border shelf-border' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { gameAudio.playClick(); setInstagramDesign(item.id); }}
                          className={`w-full p-2 rounded-xl transition flex items-center gap-2 cursor-pointer border text-left ${
                            instagramDesign === item.id
                              ? 'border-[#009DFF] ring-2 ring-[#009DFF]/30 rgb-acc'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-350'
                          } bg-white dark:bg-slate-900`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full ${item.bg} shrink-0`} />
                          <span className="text-[10px] font-bold truncate">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Customizable Caption Templates */}
                  <div className="mt-4 flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">3. Media Caption (Copied automatically)</span>
                    <div className="p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col gap-2">
                      <p className="text-[10px] font-mono leading-relaxed select-all text-slate-500 dark:text-slate-400">
                        {`🧠 Deciphered mind calibration on SKUDO.ZIP! Streak: ${profile ? profile.streak : 0} days, XP: ${profile ? profile.xp : 0}. Invite link: SK-${profile ? profile.xp : 0}-${profile ? profile.streak : 0} #SkudoSudoku #FlowState #SudokuZen`}
                      </p>
                      <button
                        onClick={() => {
                          gameAudio.playClick();
                          triggerVibe();
                          const msg = `🧠 Deciphered mind calibration on SKUDO.ZIP! Streak: ${profile ? profile.streak : 0} days, XP: ${profile ? profile.xp : 0}. Invite link: SK-${profile ? profile.xp : 0}-${profile ? profile.streak : 0} #SkudoSudoku #FlowState #SudokuZen`;
                          navigator.clipboard.writeText(msg);
                          setInstagramFeedback(true);
                          setTimeout(() => setInstagramFeedback(false), 3000);
                        }}
                        className="self-end px-2.5 py-1 bg-slate-800 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-[9px] font-extrabold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {instagramFeedback ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>{instagramFeedback ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary download and direct share triggers */}
                <div className="flex flex-col gap-2 mt-2 shrink-0">
                  <button
                    onClick={() => {
                      gameAudio.playClick();
                      triggerVibe();
                      const canvas = document.createElement('canvas');
                      drawInstagramCard(canvas, instagramLayout, instagramDesign, profile);
                      const url = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = `skudo_instagram_${instagramLayout}_${Date.now()}.png`;
                      link.href = url;
                      link.click();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span>📥</span>
                    <span>Download Sharing Graphic</span>
                  </button>

                  <button
                    onClick={() => {
                      gameAudio.playClick();
                      triggerVibe();
                      const canvas = document.createElement('canvas');
                      drawInstagramCard(canvas, instagramLayout, instagramDesign, profile);
                      canvas.toBlob(async (blob) => {
                        if (!blob) return;
                        try {
                          const file = new File([blob], 'skudo_stats.png', { type: 'image/png' });
                          if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                              files: [file],
                              title: 'My SKUDO.ZIP Stats Card',
                              text: 'Check out my Sudoku score on SKUDO.ZIP!'
                            });
                          } else {
                            window.open('https://instagram.com', '_blank');
                          }
                        } catch (err) {
                          window.open('https://instagram.com', '_blank');
                        }
                      }, 'image/png');
                    }}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-[10.5px] uppercase tracking-wide rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <span>📷</span>
                    <span>Navigate to Instagram</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStrategyAcademy && (
          <StrategyAcademy
            onClose={() => setShowStrategyAcademy(false)}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Footer copyright and minimalist INSPIRE wordmark */}
      <footer className="w-full text-center flex flex-col items-center justify-center gap-1 mt-auto select-none pointer-events-none z-20 pb-2">
        <p className="text-[9.5px] tracking-[0.08em] font-bold uppercase text-slate-400">
          SKUDO.ZIP • Flat 2D Daydream Puzzle Canvas
        </p>
        <p className="text-[10px] tracking-[0.35em] font-extrabold text-[#009DFF]/60 uppercase ml-[0.35em]">
          INSPIRE
        </p>
      </footer>
    </div>
  );
}
