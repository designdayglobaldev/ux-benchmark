import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FeedbackModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  messageId?: string;
  userId?: string;
  initialRating?: number;
  initialFeedbackText?: string;
  title?: string;
  subtitle?: string;
  ratingQuestion?: string;
  feedbackLabel?: string;
  feedbackPlaceholder?: string;
  submitButtonText?: string;
  onSubmitSuccess?: (data: { rating: number; feedbackText: string }) => void;
}

// 5 rating levels with labels and expressions
interface RatingOption {
  score: number;
  label: string;
  emojiType: 'terrible' | 'bad' | 'okay' | 'good' | 'amazing';
}

const RATINGS: RatingOption[] = [
  { score: 1, label: 'Very Bad', emojiType: 'terrible' },
  { score: 2, label: 'Poor', emojiType: 'bad' },
  { score: 3, label: 'Okay', emojiType: 'okay' },
  { score: 4, label: 'Good', emojiType: 'good' },
  { score: 5, label: 'Great', emojiType: 'amazing' },
];

/**
 * Custom vector emojis crafted to match the exact aesthetic in Figma
 */
function FeedbackFace({ type, size = 38 }: { type: RatingOption['emojiType']; size?: number }) {
  const strokeWidth = size > 40 ? 2.5 : 2.2;
  const eyeR = size > 40 ? 2.8 : 2.2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 select-none"
    >
      {/* Head Circle */}
      <circle cx="24" cy="24" r="21" fill="#FACC15" />
      {/* Soft inner highlight / gradient feel */}
      <circle cx="24" cy="24" r="21" fill="url(#face-grad)" />

      {/* Eyes & Mouth per mood */}
      {type === 'terrible' && (
        <>
          {/* Angled sad/angry eyebrows & down eyes */}
          <circle cx="16" cy="21" r={eyeR} fill="#78350F" />
          <circle cx="32" cy="21" r={eyeR} fill="#78350F" />
          {/* Deep frown mouth */}
          <path
            d="M17 33C18.5 28.5 29.5 28.5 31 33"
            stroke="#78350F"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </>
      )}

      {type === 'bad' && (
        <>
          <circle cx="16" cy="20" r={eyeR} fill="#78350F" />
          <circle cx="32" cy="20" r={eyeR} fill="#78350F" />
          {/* Slight frown mouth */}
          <path
            d="M18 31C20 28 28 28 30 31"
            stroke="#78350F"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </>
      )}

      {type === 'okay' && (
        <>
          {/* Neutral face: straight eyes & straight line mouth */}
          <circle cx="16.5" cy="20" r={eyeR} fill="#78350F" />
          <circle cx="31.5" cy="20" r={eyeR} fill="#78350F" />
          {/* Neutral horizontal straight mouth */}
          <line
            x1="18"
            y1="30"
            x2="30"
            y2="30"
            stroke="#78350F"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </>
      )}

      {type === 'good' && (
        <>
          <circle cx="16" cy="19" r={eyeR} fill="#78350F" />
          <circle cx="32" cy="19" r={eyeR} fill="#78350F" />
          {/* Gentle pleasant smile */}
          <path
            d="M17 28C19 32.5 29 32.5 31 28"
            stroke="#78350F"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </>
      )}

      {type === 'amazing' && (
        <>
          {/* Joyful squint eyes */}
          <path
            d="M13.5 19C15 16 18 16 19.5 19"
            stroke="#78350F"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d="M28.5 19C30 16 33 16 34.5 19"
            stroke="#78350F"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Open big happy grin */}
          <path
            d="M16 26C16 32 32 32 32 26Z"
            fill="#78350F"
          />
          <path
            d="M19 26C19 28.5 29 28.5 29 26"
            fill="#FFFFFF"
          />
        </>
      )}

      <defs>
        <radialGradient
          id="face-grad"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(18 15) rotate(50) scale(26)"
        >
          <stop stopColor="#FFFBEB" stopOpacity="0.4" />
          <stop offset="1" stopColor="#D97706" stopOpacity="0.15" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function FeedbackModal({
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  messageId,
  userId,
  initialRating = 3,
  initialFeedbackText = '',
  title = "Help us improve Zibo",
  subtitle = "We're currently in closed beta. Your feedback directly shapes our benchmark dataset and features.",
  ratingQuestion = "How would you rate your experience with Zibo so far?",
  feedbackLabel = "What’s working well, or what feels missing?",
  feedbackPlaceholder = "Share any bugs, missing flows/apps, or general thoughts...",
  submitButtonText = "Submit Feedback",
  onSubmitSuccess,
}: FeedbackModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;

  // Selected rating (default to initialRating or 3 = "Okay" as per Figma specs)
  const [selectedScore, setSelectedScore] = useState<number>(initialRating);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState(initialFeedbackText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if initialRating changes when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialRating) setSelectedScore(initialRating);
      if (initialFeedbackText) setFeedbackText(initialFeedbackText);
    }
  }, [isOpen, initialRating, initialFeedbackText]);

  const activeScore = hoveredScore ?? selectedScore;
  const currentRatingObj = RATINGS.find((r) => r.score === activeScore) || RATINGS[2];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
      const baseApi = rawApiUrl.replace(/\/$/, "");
      const prefix = baseApi.includes("/api/v1") ? baseApi : `${baseApi}/api/v1`;

      // If messageId is provided, submit to AI feedback endpoint
      if (messageId) {
        await fetch(`${prefix}/ai/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            userId,
            // Convert score 1-5 to rating (-1 for negative, 1 for positive, or raw score)
            rating: selectedScore <= 2 ? -1 : 1,
            feedbackReason: `Rating: ${selectedScore}/5 - ${currentRatingObj.label}`,
            correctionText: feedbackText.trim(),
          }),
        });
      } else {
        // Fallback generic submission
        await fetch(`${prefix}/app-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: selectedScore,
            feedbackText: feedbackText.trim(),
            source: 'zibo_feedback_modal',
          }),
        }).catch(() => {});
      }

      if (onSubmitSuccess) {
        onSubmitSuccess({ rating: selectedScore, feedbackText: feedbackText.trim() });
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setFeedbackText('');
        setSelectedScore(3);
      }, 1600);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent
        className="max-w-[546px] w-[92vw] sm:w-[546px] p-0 border-none bg-transparent overflow-visible shadow-none gap-0 [&>button:last-child]:hidden focus:outline-none"
      >
        {/* Frame 2147231091 - Relative Container */}
        <div className="relative w-full max-w-[546px] mx-auto select-none">
          {/* Close Button: Frame 2147227829 (Circular 48x48 on top right) */}
          <DialogPrimitive.Close
            type="button"
            aria-label="Close feedback modal"
            className="absolute -top-3 -right-3 md:-right-14 md:top-0 z-50 w-12 h-12 rounded-full bg-[#27272A] hover:bg-[#323238] active:scale-95 transition-all flex items-center justify-center text-white border border-[#3A3A3E]/60 shadow-lg cursor-pointer focus:outline-none"
          >
            <X className="w-[18px] h-[18px] stroke-[2.2] text-white" />
          </DialogPrimitive.Close>

          {/* Main Card: Frame 2147227913 (546px x 737px, #181818, border-radius 19.5px) */}
          <div className="relative w-full min-h-[690px] md:h-[737px] bg-[#181818] rounded-[19.5px] border border-[#262626] shadow-2xl overflow-hidden flex flex-col items-center px-6 sm:px-[75px] pt-10 pb-8 box-border">

            {/* Frame 2147228007: Title & Subtitle */}
            <div className="flex flex-col items-center text-center gap-[9px] w-full max-w-[416px]">
              <h2
                className="text-white text-[32px] leading-[42px] font-normal tracking-normal"
                style={{ fontFamily: "'Instrument Serif', ui-serif, Georgia, serif" }}
              >
                {title}
              </h2>
              <p className="text-[#868686] text-[15px] sm:text-[16px] leading-[19px] font-normal font-sans text-center">
                {subtitle}
              </p>
            </div>

            {/* Frame 2147231021: Rating section */}
            <div className="relative flex flex-col items-center w-full max-w-[396px] mt-8">
              {/* Question */}
              <p className="text-white text-[16px] leading-[24px] font-normal text-center font-sans">
                {ratingQuestion}
              </p>

              {/* Emoji Icons Bar: Frame 2147231123 */}
              <div className="relative w-full h-[88px] flex items-center justify-center mt-3">
                {/* Fixed Concentric Glow Rings (Group 2134283889) centered permanently on the middle (3rd) item */}
                <div
                  className="absolute pointer-events-none left-1/2 -translate-x-1/2 -translate-y-1 z-0"
                  aria-hidden="true"
                >
                  <div className="relative w-[133.3px] h-[133.3px] flex items-center justify-center opacity-38">
                    {/* Ellipse 12880: 133.3px */}
                    <div className="absolute w-[133.3px] h-[133.3px] rounded-full border border-yellow-400/25" />
                    {/* Ellipse 12879: 113.1px */}
                    <div className="absolute w-[113.1px] h-[113.1px] rounded-full border border-yellow-400/35" />
                    {/* Ellipse 12878: 88.87px */}
                    <div className="absolute w-[88.87px] h-[88.87px] rounded-full border border-yellow-400/45 bg-amber-500/10 blur-[1px]" />
                  </div>
                </div>

                {/* Rating Emojis Row (5 icons: Frame 2147231123) */}
                <div className="relative z-10 flex items-center justify-between w-full max-w-[340px] px-2">
                  {RATINGS.map((item) => {
                    const isSelected = selectedScore === item.score;
                    const isHovered = hoveredScore === item.score;
                    const isActive = isHovered || (!hoveredScore && isSelected);

                    return (
                      <button
                        key={item.score}
                        type="button"
                        onClick={() => setSelectedScore(item.score)}
                        onMouseEnter={() => setHoveredScore(item.score)}
                        onMouseLeave={() => setHoveredScore(null)}
                        className={cn(
                          "relative rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none",
                          isActive
                            ? "w-[72px] h-[72px] p-1.5 shadow-[0_0_28px_rgba(250,204,21,0.4)] scale-110"
                            : "w-[42px] h-[42px] opacity-75 hover:opacity-100 hover:scale-105"
                        )}
                        style={
                          isActive
                            ? {
                                background:
                                  "linear-gradient(180deg, rgba(255, 249, 143, 0.52) 0%, rgba(221, 135, 11, 0.52) 100%)",
                                borderRadius: "78px",
                              }
                            : { borderRadius: "78px" }
                        }
                        aria-label={item.label}
                      >
                        <FeedbackFace
                          type={item.emojiType}
                          size={isActive ? 48 : 38}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Gradient edge-fade mask (Rectangle 1321321466) */}
                <div
                  className="pointer-events-none absolute inset-y-0 inset-x-0 bg-gradient-to-r from-[#181818] via-transparent to-[#181818] opacity-60 z-20"
                  aria-hidden="true"
                />
              </div>

              {/* Rating Label Tooltip Tag: Frame 2147231018 (with tiny triangle indicator) */}
              <div className="relative mt-2 flex flex-col items-center">
                {/* Vector pointer notch */}
                <div className="w-0 h-0 border-x-[6px] border-x-transparent border-b-[6px] border-b-[#252424] -mb-[1px]" />
                <div className="px-3.5 py-1 bg-[#252424] rounded-[9px] border border-[#313131]/60 text-white text-[13px] font-sans font-medium tracking-wide">
                  {currentRatingObj.label}
                </div>
              </div>
            </div>

            {/* Frame 2147231022: Feedback Text Area */}
            <div className="flex flex-col items-start w-full max-w-[396px] mt-6 gap-2.5">
              <label
                htmlFor="zibo-feedback-textarea"
                className="text-white text-[16px] leading-[24px] font-normal font-sans"
              >
                {feedbackLabel}
              </label>

              {/* Textarea Box: Frame 2147228008 */}
              <div className="w-full h-[153px] bg-[#252424] border border-[#313131] rounded-[8px] p-3 transition-colors focus-within:border-[#4B4B4B]">
                <textarea
                  id="zibo-feedback-textarea"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={feedbackPlaceholder}
                  rows={5}
                  className="w-full h-full bg-transparent text-white placeholder:text-[#949494] placeholder:italic placeholder:text-[14px] text-[14px] leading-[20px] resize-none outline-none font-sans"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-400 text-xs mt-2 text-center max-w-[396px]">
                {error}
              </p>
            )}

            {/* Frame 2147228012: Submit Feedback Button */}
            <div className="w-full max-w-[396px] mt-auto pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isSuccess}
                className={cn(
                  "w-full h-[48px] bg-white hover:bg-neutral-200 active:scale-[0.99] transition-all rounded-[8px] border border-[#313131] flex items-center justify-center font-sans font-medium text-[14px] tracking-[-0.02em] text-[#1A1A1A] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1A1A1A]" />
                    Submitting...
                  </span>
                ) : isSuccess ? (
                  <span className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Check className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                    Thank you for your feedback!
                  </span>
                ) : (
                  submitButtonText
                )}
              </button>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackModal;

