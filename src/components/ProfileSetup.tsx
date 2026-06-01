/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShieldAlert, Navigation, Mail, Chrome, ArrowLeft, RefreshCw, Key, Camera, Upload, XCircle } from 'lucide-react';
import { ExperienceLevel, PlayerProfile } from '../types';
import { gameAudio } from '../utils/audio';

interface ProfileSetupProps {
  onComplete: (profile: PlayerProfile) => void;
}

const EXPERIENCE_OPTIONS: { level: ExperienceLevel; desc: string; label: string }[] = [
  { level: 'Never Played', label: '1. Never Played', desc: 'New to Sudoku, teach me basic rules' },
  { level: 'Beginner', label: '2. Beginner', desc: 'Know standard rules but want helpful hints' },
  { level: 'Casual Player', label: '3. Casual Player', desc: 'Enjoy relaxing, casual daily games' },
  { level: 'Experienced', label: '4. Experienced', desc: 'Can handle tricky row-column eliminations' },
  { level: 'Expert', label: '5. Expert', desc: 'Enjoy complex backtracking & candidate notes' },
  { level: 'Master', label: '6. Master', desc: 'Flawless puzzles with no mistake margin' },
];

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  // Wizard steps: 'auth' (email/google) -> 'setup' (name/experience)
  const [step, setStep] = useState<'auth' | 'setup'>('auth');
  const [emailInput, setEmailInput] = useState('');
  const [isGoogleLogin, setIsGoogleLogin] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  
  // Custom nickname and skill tier setup variables
  const [name, setName] = useState('');
  const [selectedExp, setSelectedExp] = useState<ExperienceLevel | null>(null);
  const [errorText, setErrorText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Avatar Upload States
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorText('Please select a valid image file (PNG, JPG, WEBP).');
      gameAudio.playError();
      return;
    }
    // Limit file size to ~1.5MB to stay within safe localStorage bounds
    if (file.size > 1.5 * 1024 * 1024) {
      setErrorText('Image is too large. Please select an image under 1.5 MB.');
      gameAudio.playError();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setErrorText('');
      }
    };
    reader.onerror = () => {
      setErrorText('Failed to read image file.');
      gameAudio.playError();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectExp = (level: ExperienceLevel) => {
    gameAudio.playClick();
    setSelectedExp(level);
    setErrorText('');
  };

  // Step 1: Process email address or Google click
  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    gameAudio.playClick();

    const email = emailInput.trim().toLowerCase();
    if (!email) {
      setErrorText('Please enter your email is required to login.');
      gameAudio.playError();
      return;
    }

    // Basic email format check
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorText('Please enter a valid email address.');
      gameAudio.playError();
      return;
    }

    proceedWithEmail(email, false);
  };

  // Handle restoring or proceeding with checked email
  const proceedWithEmail = (email: string, isGoog: boolean) => {
    setStatusMessage('Syncing cloud database stats...');
    setErrorText('');

    setTimeout(() => {
      const savedKey = `skudo_profile_${email}`;
      const savedData = localStorage.getItem(savedKey);

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData) as PlayerProfile;
          // Successfully restored account! Keep track of active email
          parsed.email = email;
          parsed.isGoogle = isGoog;
          setStatusMessage('Welcome back! Loading account backup...');
          gameAudio.playWin();
          setTimeout(() => {
            onComplete(parsed);
          }, 1000);
          return;
        } catch (err) {
          console.error('Failed to parse saved profile:', err);
        }
      }

      // No profile found: create new profile flow
      setEmailInput(email);
      setIsGoogleLogin(isGoog);
      // Derive default name from email
      const proposedName = email.split('@')[0];
      setName(proposedName.charAt(0).toUpperCase() + proposedName.slice(1));
      setStep('setup');
      setStatusMessage('');
    }, 800);
  };

  // Simulate Google Account pop-up choice list
  const handleSelectGoogleAccount = (email: string) => {
    gameAudio.playClick();
    setShowGoogleModal(false);
    proceedWithEmail(email, true);
  };

  // Step 2: Create new profile for this email
  const handleSetupSubmit = (e: FormEvent) => {
    e.preventDefault();
    gameAudio.playClick();

    if (!name.trim()) {
      gameAudio.playError();
      setErrorText('Please enter your nickname.');
      return;
    }

    if (!selectedExp) {
      gameAudio.playError();
      setErrorText('Please select your experience skill level.');
      return;
    }

    const email = emailInput.trim().toLowerCase() || 'local.guest@skudo.zip';

    const defaultProfile: PlayerProfile = {
      name: name.trim(),
      experience: selectedExp,
      totalGames: 0,
      completedGames: 0,
      highestScore: 0,
      totalTime: 0,
      streak: 0,
      xp: 0,
      achievements: ['First Steps'],
      email: email,
      isGoogle: isGoogleLogin,
      avatarUrl: avatarUrl || undefined,
    };

    // Store in global lookup so we sync progress cleanly
    localStorage.setItem(`skudo_profile_${email}`, JSON.stringify(defaultProfile));
    
    // Also set current active profile
    localStorage.setItem('skudo_profile', JSON.stringify(defaultProfile));

    onComplete(defaultProfile);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {step === 'auth' ? (
          <motion.div
            key="auth-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 shadow-xl flex flex-col gap-6 relative"
            id="profile-auth-card"
          >
            <div className="text-center flex flex-col gap-1.5">
              <div className="mx-auto w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-[#E0F4FF] to-[#BEE3F8] border border-white/50 flex items-center justify-center text-[#2B6CB0] mb-2 shadow-xs">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="font-sans text-2xl.5 font-extrabold tracking-tight text-[#4A5568]" id="profile-auth-title">
                Enter your Email to Play
              </h2>
              <p className="text-xs text-[#4A5568]/60 font-medium leading-relaxed px-4">
                We safely save all your levels, streak milestones, and custom settings directly keyed to your account email to sync progress.
              </p>
            </div>

            {statusMessage ? (
              <div className="p-5 bg-white/60 border border-emerald-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-center text-xs text-slate-600 font-semibold shadow-xs">
                <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
                {/* Email Address */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase text-[#87CEEB] tracking-wider ml-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#4DA6FF]" />
                    Email Account Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (errorText) setErrorText('');
                    }}
                    placeholder="e.g. archanadasmondal1987@gmail.com"
                    className="w-full px-4 py-3.5 bg-white/60 border border-white rounded-xl focus:outline-none focus:border-[#4DA6FF] focus:ring-2 focus:ring-[#87CEEB]/20 text-[#4A5568] transition placeholder:text-slate-400 font-medium text-sm"
                    id="profile-email-input"
                  />
                </div>

                {errorText && (
                  <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-500 font-medium animate-shake">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    {errorText}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-[#4DA6FF] hover:bg-[#3BA7FF] active:scale-[0.98] text-white font-bold rounded-2xl shadow-md transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                  id="profile-email-submit-btn"
                >
                  <span>Sync & Continue</span>
                  <Navigation className="w-4 h-4 rotate-90" />
                </button>

                {/* Divider line */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-300/30"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or sign in with</span>
                  <div className="flex-grow border-t border-slate-300/30"></div>
                </div>

                {/* Simulated Google SSO Auth btn */}
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playClick();
                    setShowGoogleModal(true);
                  }}
                  className="w-full py-3.5 bg-white/70 hover:bg-white border border-slate-300/40 hover:border-slate-300/80 rounded-2xl text-xs font-bold text-slate-600 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  id="profile-google-btn"
                >
                  <Chrome className="w-4 h-4 text-red-500" />
                  <span>Continue with Google Account</span>
                </button>
              </form>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="setup-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 shadow-xl flex flex-col gap-6 relative"
            id="nickname-setup-card"
          >
            {/* Nav Back Button */}
            <button
              onClick={() => {
                gameAudio.playClick();
                setStep('auth');
                setErrorText('');
              }}
              className="absolute top-6 left-6 p-1.5 bg-white/60 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-500 rounded-lg cursor-pointer transition flex items-center gap-1"
              id="back-to-auth-step-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <div className="text-center mt-6">
              <span className="text-[10px] font-bold uppercase text-amber-500 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                New Player Profile Register
              </span>
              <h2 className="font-sans text-2xl.5 font-extrabold tracking-tight text-[#4A5568] mt-3" id="setup-welcome-title">
                Complete your Profile
              </h2>
              <p className="text-xs text-[#4A5568]/60 mt-1 font-medium">
                Setting up profile for <span className="text-[#009DFF] font-semibold">{emailInput}</span>
              </p>
            </div>

            <form onSubmit={handleSetupSubmit} className="flex flex-col gap-6">
              {/* Profile Picture Upload Section (With Drag & Drop) */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-[#87CEEB] tracking-wider ml-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#4DA6FF]" />
                  Profile Photo (Optional)
                </label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all min-h-[110px] cursor-pointer ${
                    isDragging 
                      ? 'border-[#009DFF] bg-[#009DFF]/10 scale-[1.01]' 
                      : avatarUrl 
                      ? 'border-emerald-500/50 bg-emerald-50/20' 
                      : 'border-slate-300/60 hover:border-[#4DA6FF] bg-white/40 hover:bg-white/60'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  
                  {avatarUrl ? (
                    <div className="flex items-center gap-4 w-full" onClick={(e) => e.stopPropagation()}>
                      <div className="relative shrink-0">
                        <img 
                          src={avatarUrl} 
                          alt="Avatar Preview" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition scale-90"
                          title="Remove Photo"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          ✓ Photo uploaded
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Drag a new photo or <span className="text-[#009DFF] font-semibold cursor-pointer underline" onClick={() => fileInputRef.current?.click()}>click to replace</span>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center gap-1.5 pointer-events-none">
                      <div className="p-2 bg-slate-100 rounded-full text-slate-500">
                        <Upload className="w-5 h-5 text-slate-400 transition-colors" />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-[#4A5568]">Drag & drop your photo</span> or <span className="text-[#009DFF] font-bold">browse</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium">Supports PNG, JPG, WEBP (Max 1.5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nickname input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-[#87CEEB] tracking-wider ml-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#4DA6FF]" />
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorText) setErrorText('');
                  }}
                  placeholder="e.g. Archana"
                  className="w-full px-4 py-3 bg-white/60 border border-white rounded-xl focus:outline-none focus:border-[#4DA6FF] focus:ring-2 focus:ring-[#87CEEB]/20 text-[#4A5568] transition"
                  maxLength={16}
                  id="profile-name-input"
                />
              </div>

              {/* Experience Selector */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase text-[#87CEEB] tracking-wider ml-1">
                  How experienced are you with Sudoku?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[170px] overflow-y-auto pr-1" id="experience-options-grid">
                  {EXPERIENCE_OPTIONS.map((opt) => {
                    const active = selectedExp === opt.level;
                    return (
                      <button
                        key={opt.level}
                        type="button"
                        onClick={() => handleSelectExp(opt.level)}
                        className={`p-2.5 text-left rounded-xl border text-xs transition-all duration-200 flex flex-col gap-0.5 cursor-pointer outline-none ${
                          active
                            ? 'border-[#4DA6FF] bg-[#E0F4FF]/50 shadow-xs'
                            : 'border-white/40 bg-white/40 hover:bg-white/60 hover:border-white'
                        }`}
                        id={`exp-opt-${opt.level.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <span className={`font-bold ${active ? 'text-[#4DA6FF]' : 'text-[#4A5568]'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-[#4A5568]/60 font-normal leading-tight">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorText && (
                <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-500 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                  {errorText}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-[#4DA6FF] hover:bg-[#3BA7FF] active:scale-[0.98] text-white font-bold rounded-2xl shadow-md transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                id="profile-continue-btn"
              >
                <span>Save Profile & Start</span>
                <Navigation className="w-4 h-4 rotate-90" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Sign-In pop-up chooser modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6.5 max-w-sm w-full border border-slate-100 shadow-2xl flex flex-col gap-5 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#4285F4] font-black tracking-tight">
                  <Chrome className="w-5 h-5 text-red-500" />
                  <span>Choose an Account</span>
                </div>
                <button
                  onClick={() => setShowGoogleModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[11px] text-slate-500 -mt-1 leading-normal font-medium max-w-xs">
                Select your pre-detected profile account which syncs with SKUDO.ZIP servers.
              </p>

              {/* Account list */}
              <div className="flex flex-col gap-2">
                {[
                  { name: 'Archana Mondal', email: 'archanadasmondal1987@gmail.com', avatar: 'AM' },
                  { name: 'Skudo Solver Pro', email: 'skudo.master@gmail.com', avatar: 'SS' },
                  { name: 'Casual Guest Player', email: 'guest.solver@gmail.com', avatar: 'CG' }
                ].map((acct) => (
                  <button
                    key={acct.email}
                    onClick={() => handleSelectGoogleAccount(acct.email)}
                    className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 flex items-center gap-3 transition cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-extrabold text-sm flex items-center justify-center shrink-0">
                      {acct.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-700 truncate leading-none">{acct.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 truncate mt-1 leading-none">{acct.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
