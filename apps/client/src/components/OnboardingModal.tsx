import React, { useState, useEffect } from 'react';
import { X, PenTool, BarChart3, Code2, Briefcase, Sparkles, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface DynamicOption {
  id: string;
  type: 'ROLE' | 'CHALLENGE';
  label: string;
  description?: string;
  iconName?: string;
  sortOrder: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  PenTool,
  BarChart3,
  Code2,
  Briefcase,
  Sparkles,
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('Product Designer');
  const [selectedChallenge, setSelectedChallenge] = useState<string>('Proving design decisions with real benchmarks');
  const [selectedAvatarId, setSelectedAvatarId] = useState<number>(() => Math.floor(Math.random() * 380) + 1);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  // Debounced check for username uniqueness
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (clean.length < 2) {
      setIsUsernameAvailable(null);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (user?.id) headers['x-user-id'] = user.id;

        const res = await fetch(`${API_URL}/api/v1/onboarding/check-username?username=${encodeURIComponent(clean)}`, { headers });
        const json = await res.json();
        setIsUsernameAvailable(json.available);
      } catch (err) {
        setIsUsernameAvailable(true); // fallback
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, user?.id]);

  // Dynamic options loaded from API
  const [roles, setRoles] = useState<DynamicOption[]>([
    { id: '1', type: 'ROLE', label: 'Product Designer', iconName: 'PenTool', sortOrder: 1 },
    { id: '2', type: 'ROLE', label: 'Product Manager', iconName: 'BarChart3', sortOrder: 2 },
    { id: '3', type: 'ROLE', label: 'Developer', iconName: 'Code2', sortOrder: 3 },
    { id: '4', type: 'ROLE', label: 'CEO/CTO', iconName: 'Briefcase', sortOrder: 4 },
  ]);

  const [challenges, setChallenges] = useState<string[]>([
    'Proving design decisions with real benchmarks',
    'Aligning stakeholders on product flow trade-offs',
    'Gathering competitor references quickly',
    'Communicating UI decisions to engineers',
  ]);

  useEffect(() => {
    // Fetch dynamic onboarding options from backend
    fetch(`${API_URL}/api/v1/onboarding/options`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.roles && data.data.roles.length > 0) {
            setRoles(data.data.roles);
            if (!selectedRole || !data.data.roles.find((r: any) => r.label === selectedRole)) {
              setSelectedRole(data.data.roles[0].label);
            }
          }
          if (data.data.challenges && data.data.challenges.length > 0) {
            const challengeLabels = data.data.challenges.map((c: any) => c.label);
            setChallenges(challengeLabels);
            if (!selectedChallenge || !challengeLabels.includes(selectedChallenge)) {
              setSelectedChallenge(challengeLabels[0]);
            }
          }
        }
      })
      .catch((err) => console.warn('Using default onboarding options:', err));
  }, []);

  // Helper to generate a clean random set of 18 unique avatar IDs
  const generateRandomSet = () => {
    const set = new Set<number>();
    while (set.size < 18) {
      set.add(Math.floor(Math.random() * 380) + 1);
    }
    return Array.from(set);
  };

  const [visibleAvatars, setVisibleAvatars] = useState<number[]>(() => generateRandomSet());

  if (!isOpen) return null;

  const handleShuffleSet = () => {
    setVisibleAvatars(generateRandomSet());
  };

  const handleRerollAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAvatarId(Math.floor(Math.random() * 380) + 1);
  };

  const handleSaveAndFinish = async (skipRemaining = false) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const finalRole = skipRemaining ? (selectedRole || null) : selectedRole;
      const finalChallenge = skipRemaining ? null : selectedChallenge;
      const avatarUrl = `/Avatars/${selectedAvatarId}.svg`;

      // 1. Submit to Backend PostgreSQL API
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const res = await fetch(`${API_URL}/api/v1/onboarding/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: cleanUsername,
          avatarUrl,
          role: finalRole,
          biggestChallenge: finalChallenge,
          isSkipped: skipRemaining,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to complete onboarding');
      }

      // 2. Mirror into Supabase Auth Metadata for client session consistency
      await supabase.auth.updateUser({
        data: {
          username: cleanUsername,
          role: finalRole,
          onboarding_challenge: finalChallenge,
          avatar_url: avatarUrl,
          onboarding_completed: true,
        },
      });

      localStorage.setItem(`zibo_onboarding_${user?.id || 'guest'}`, 'completed');
      if (onComplete) onComplete();
      onClose();
    } catch (err: any) {
      console.error('Failed to save onboarding metadata:', err);
      setErrorMessage(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      // Step 1 is strictly mandatory: user MUST explicitly enter a username
      if (!username.trim()) {
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      await handleSaveAndFinish(false);
    }
  };

  const handleSkip = async () => {
    if (step === 2) {
      // On step 2, skip advances to step 3 (challenges)
      setSelectedRole('');
      setStep(3);
    } else if (step === 3) {
      // On step 3, skip finishes onboarding without challenge selected
      setSelectedChallenge('');
      await handleSaveAndFinish(true);
    }
  };

  const handleClose = () => {
    localStorage.setItem(`zibo_onboarding_${user?.id || 'guest'}`, 'dismissed');
    onClose();
  };

  const isStep1Valid = username.trim().length >= 2 && isUsernameAvailable !== false;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Outer Layout: Frame 2147230708 (546px wide card + 10px gap + 48px close button = 604px total) */}
      <div className="relative flex flex-row items-start gap-[10px] isolate">
        
        {/* Main Card: Frame 2147227913 */}
        <div className="relative w-[546px] h-[693px] bg-[#181818] rounded-[19.5px] border border-[#2B2B2B] flex flex-col items-center justify-between shadow-2xl p-0 overflow-hidden shrink-0 z-0">
          
          {/* Top Progress Track: (Rectangle 1321321414 & 1321321415) */}
          <div className="w-full flex justify-center pt-[46px] shrink-0">
            <div className="relative w-[125.19px] h-[4.73px] bg-[#303030] rounded-[19px] overflow-hidden">
              <div
                className="h-full bg-white rounded-[19px] transition-all duration-300"
                style={{
                  width: step === 1 ? '35.55px' : step === 2 ? '77.29px' : '125.19px',
                }}
              />
            </div>
          </div>

          {/* STEP 1: Desktop - 240 (Set up your Zibo profile) */}
          {step === 1 && (
            <div className="w-full flex flex-col items-center flex-1 px-8 pt-4">
              {/* Header Titles */}
              <div className="w-full max-w-[396px] text-center flex flex-col gap-[7px]">
                <h2 className="font-['Instrument_Serif'] text-[32px] leading-[40px] font-normal text-white">
                  Set up your Zibo profile
                </h2>
                <p className="font-['Inter'] text-[15px] leading-[20px] font-normal text-[#868686]">
                  Collaborate with teammates, create collections, and manage screens & apps
                </p>
              </div>

              {/* Profile Card Illustration (Frame 2147230883) with generous breathing room */}
              <div className="relative mt-16 mb-8 flex items-center justify-center">
                <div className="relative w-[202px] h-[127px] bg-[#272727] rounded-[12px] border border-[#333333] flex flex-col items-center justify-end pb-4 pt-10 px-4">
                  {/* Avatar Badge overlapping top with no text collision */}
                  <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div 
                      onClick={() => setIsPickerOpen(true)}
                      className="relative w-[82px] h-[82px] rounded-full bg-[#1E1D1D] p-[4.6px] flex items-center justify-center shadow-lg group cursor-pointer hover:ring-2 hover:ring-white/40 transition-all"
                      title="Click to pick an avatar"
                    >
                      <img
                        src={`/Avatars/${selectedAvatarId}.svg`}
                        alt="Avatar"
                        className="w-[72px] h-[72px] rounded-full object-cover bg-[#BA96E6] shadow-inner transition-transform group-hover:scale-105"
                      />

                      {/* Quick Reroll Dice Button */}
                      <button
                        type="button"
                        onClick={handleRerollAvatar}
                        title="Shuffle Avatar"
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#353434] border border-[#4B4B4B] text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-md cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Pick Avatar Pill Link */}
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="whitespace-nowrap text-[12px] font-medium text-[#A3A3A3] hover:text-white hover:border-[#555] mt-2 transition-colors cursor-pointer flex items-center justify-center bg-[#222222] px-3.5 py-1 rounded-full border border-[#383838]"
                    >
                      Pick an avatar
                    </button>
                  </div>

                  {/* Skeleton mock lines inside card */}
                  <div className="w-[152.85px] h-[13px] bg-[#353434] rounded-[4px] mb-2" />
                  <div className="w-[98.9px] h-[13px] bg-[#353434] rounded-[4px]" />
                </div>
              </div>

              {/* Username Input Container (Frame 2147230884) */}
              <div className="w-full max-w-[396px] flex flex-col gap-[7px] mt-3">
                <div className={`w-full h-[53px] bg-[#252424] border rounded-[8px] px-[12px] py-[17px] flex items-center justify-between transition-colors ${
                  isUsernameAvailable === false
                    ? 'border-red-500/80'
                    : isUsernameAvailable === true
                    ? 'border-emerald-500/60'
                    : username.trim()
                    ? 'border-[#4B4B4B] focus-within:border-white'
                    : 'border-[#313131] focus-within:border-white/60'
                }`}>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Username (e.g. alexdesign)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())}
                    className="w-full bg-transparent text-white placeholder-[#949494] font-['Inter'] text-[14px] leading-[17px] outline-none"
                  />
                  {isCheckingUsername && (
                    <RefreshCw className="w-3.5 h-3.5 text-[#888888] animate-spin shrink-0" />
                  )}
                  {!isCheckingUsername && isUsernameAvailable === true && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-between px-1">
                  <p className="font-['Inter'] text-[13px] leading-[17px] text-[#949494]">
                    zibo.design/@{username.trim() || 'username'}
                  </p>
                  {isUsernameAvailable === false ? (
                    <span className="text-[11.5px] text-red-400 font-medium">
                      Username already taken
                    </span>
                  ) : !username.trim() ? (
                    <span className="text-[11.5px] text-[#A3A3A3]">
                      Username required to continue
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Desktop - 241 (Which role describes you the best?) */}
          {step === 2 && (
            <div className="w-full flex flex-col items-center flex-1 px-8 pt-6">
              {/* Header Title */}
              <div className="w-full max-w-[396px] text-center mb-9">
                <h2 className="font-['Instrument_Serif'] text-[32px] leading-[42px] font-normal text-white">
                  Which role describes you the best?
                </h2>
              </div>

              {/* 2x2 Roles Grid (Frame 2147231020) */}
              <div className="w-full max-w-[390px] grid grid-cols-2 gap-[16px]">
                {roles.map((r) => {
                  const IconComponent = (r.iconName && ICON_MAP[r.iconName]) || PenTool;
                  const isSelected = selectedRole === r.label;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.label)}
                      className={`relative w-[187px] h-[104px] bg-[#252424] rounded-[9px] p-[14px] flex flex-col justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                          : 'border border-[#313131] hover:border-[#4B4B4B]'
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#9C9C9C]'}`} />
                      <span className="font-['Inter'] text-[14px] leading-[17px] font-normal text-white">
                        {r.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Desktop - 242 (What’s your biggest challenge?) */}
          {step === 3 && (
            <div className="w-full flex flex-col items-center flex-1 px-8 pt-6">
              {/* Header Title */}
              <div className="w-full max-w-[396px] text-center mb-6">
                <h2 className="font-['Instrument_Serif'] text-[32px] leading-[42px] font-normal text-white">
                  What’s your biggest challenge?
                </h2>
              </div>

              {/* Challenge Options List (Frame 2147231021) */}
              <div className="w-full max-w-[396px] flex flex-col gap-[14px]">
                <p className="font-['Inter'] text-[14px] sm:text-[15px] leading-[22px] font-normal text-[#E0E0E0] mb-1">
                  What’s the biggest challenge you face when getting designs approved by stakeholders or clients?
                </p>

                {challenges.map((c) => {
                  const isSelected = selectedChallenge === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedChallenge(c)}
                      className={`w-full min-h-[52px] bg-[#252424] rounded-[9px] px-[14px] py-3 flex items-center text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                          : 'border border-[#313131] hover:border-[#4B4B4B]'
                      }`}
                    >
                      <span className="font-['Inter'] text-[13.5px] leading-[18px] font-normal text-white">
                        {c}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Action Section: Continue / Done + Skip button for Step 2 & 3 */}
          <div className="w-full flex flex-col items-center pb-[40px] px-8 shrink-0 gap-2.5">
            {errorMessage && (
              <div className="w-full max-w-[396px] bg-red-950/80 border border-red-500/40 rounded-lg p-2.5 flex items-center gap-2 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isSubmitting || (step === 1 && !isStep1Valid)}
              onClick={handleNext}
              className="w-full max-w-[396px] h-[48px] bg-white hover:bg-[#F2F2F2] active:scale-[0.99] text-[#1A1A1A] font-['Inter'] font-medium text-[14px] leading-[17px] tracking-[-0.02em] rounded-[8px] border border-[#313131] transition-all flex items-center justify-center cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : step === 3 ? 'Done' : 'Continue'}
            </button>

            {/* Skip Button: Only displayed on Step 2 and Step 3 (Step 1 is strictly mandatory) */}
            {step > 1 ? (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-[13px] text-[#868686] hover:text-white transition-colors cursor-pointer py-1 font-['Inter']"
              >
                Skip for now
              </button>
            ) : (
              <div className="h-[25px]" /> // Placeholder height to prevent layout jump
            )}
          </div>

          {/* Pick an Avatar Modal Overlay */}
          {isPickerOpen && (
            <div className="absolute inset-0 bg-[#181818]/95 backdrop-blur-md z-40 p-6 flex flex-col justify-between animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2C2C]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E1D1D] p-1 border border-white/20">
                    <img
                      src={`/Avatars/${selectedAvatarId}.svg`}
                      alt="Selected"
                      className="w-full h-full rounded-full object-cover bg-[#BA96E6]"
                    />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">Pick an avatar</h3>
                    <p className="text-xs text-[#888888]">Select from 18 suggestions or roll a new set</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="p-1 rounded-full text-[#888888] hover:text-white hover:bg-[#252525] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid of 18 avatars (3 rows x 6 columns) */}
              <div className="grid grid-cols-6 gap-3 py-4 pr-1">
                {visibleAvatars.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatarId(id);
                      setIsPickerOpen(false);
                    }}
                    className={`relative w-[68px] h-[68px] rounded-full p-1 border-2 transition-all flex items-center justify-center cursor-pointer hover:scale-105 ${
                      selectedAvatarId === id
                        ? 'border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                        : 'border-[#333333] hover:border-[#666666]'
                    }`}
                  >
                    <img
                      src={`/Avatars/${id}.svg`}
                      alt={`Avatar ${id}`}
                      className="w-full h-full rounded-full object-cover bg-[#BA96E6]"
                    />
                    {selectedAvatarId === id && (
                      <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Footer with Randomize / Re-roll all 18 avatars + Close */}
              <div className="pt-3 border-t border-[#2C2C2C] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleShuffleSet}
                  className="text-xs text-white hover:bg-[#303030] active:scale-95 flex items-center gap-2 py-2 px-3.5 rounded-md bg-[#252525] border border-[#3A3A3A] transition-all cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Randomize 18 avatars</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="text-xs font-medium text-black px-4 py-2 rounded-md bg-white hover:bg-[#E5E5E5] active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
