import { useEffect, useCallback } from 'react'
import {
  Grid3X3,
  Piano,
  Sparkles,
  ListMusic,
  Sliders,
  Play,
  Music,
  Heart,
  Disc3,
  Rocket,
  Repeat,
  Mic,
  Drum,
} from 'lucide-react'
import { useWalkthroughStore } from '@/stores/useWalkthroughStore'
import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface TourStep {
  icon: LucideIcon
  iconColor: string
  title: string
  body: string
}

const STEPS: TourStep[] = [
  {
    icon: Heart,
    iconColor: 'text-pink-500 bg-pink-50 border-pink-100',
    title: 'Welcome to BeatForge!',
    body: "Hey Avery! This is your personal music studio. Let's walk through everything so you can start making beats right away. It only takes a minute!",
  },
  {
    icon: Grid3X3,
    iconColor: 'text-violet-500 bg-violet-50 border-violet-100',
    title: 'Beat Pads',
    body: 'These colorful pads are your drum machine. Tap any pad to play a sound \u2014 kicks, snares, hi-hats, and more. You can also use your keyboard: keys 1\u20134, Q\u2013R, A\u2013F, and Z\u2013V map to the 16 pads. Try tapping a few! Right-click any pad to customize its sound, volume, or color.',
  },
  {
    icon: Piano,
    iconColor: 'text-indigo-500 bg-indigo-50 border-indigo-100',
    title: 'Piano Keyboard',
    body: 'This is your piano! Click the keys or use your physical keyboard to play. The bottom row (Z through M) plays one octave, and the top row (Q through U) plays the octave above. Switch instruments up top \u2014 try Piano, Synth Pad, or Strings for different vibes.',
  },
  {
    icon: Sparkles,
    iconColor: 'text-amber-500 bg-amber-50 border-amber-100',
    title: 'AI Sound Forge',
    body: "This is the magic part. Type any sound you can imagine \u2014 like \u201Cdreamy lo-fi rain loop\u201D or \u201Cpunchy trap snare\u201D \u2014 and AI will create it for you. You can then assign it to any pad. Try the suggestion buttons for inspiration!",
  },
  {
    icon: ListMusic,
    iconColor: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    title: 'Step Sequencer',
    body: "This is where you build patterns. Each row is a different drum sound, and each column is a beat. Click the cells to turn sounds on or off, then press Play to hear your pattern loop. Try loading a preset pattern first to see how it works!",
  },
  {
    icon: Repeat,
    iconColor: 'text-teal-500 bg-teal-50 border-teal-100',
    title: 'Loop Station',
    body: "Want to build a beat layer by layer? The Loop Station is your jam! Set how many measures you want, hit Record, and play some pads. When it stops, your beat loops automatically. Hit Record again to add another layer on top \u2014 drums, then bass, then hi-hats. Stack as many layers as you want!",
  },
  {
    icon: Mic,
    iconColor: 'text-rose-500 bg-rose-50 border-rose-100',
    title: 'Voice Studio',
    body: "Here\u2019s where it gets really fun \u2014 you can record your own voice! Sing, beatbox, or make any sound into the mic. Use the Pitch Shift slider to tune your voice up or down (instant autotune vibes). You can even use AI to transform your voice into something completely different. Add your recordings to pads and loop them!",
  },
  {
    icon: Drum,
    iconColor: 'text-violet-500 bg-violet-50 border-violet-100',
    title: 'Custom Drum Kits',
    body: "Made the perfect combination of sounds? Save it as a custom drum kit so you can switch between different setups. Mix AI-generated sounds, voice recordings, and built-in drums to create something totally unique. You can always restore the defaults if you want to start fresh.",
  },
  {
    icon: Disc3,
    iconColor: 'text-cyan-500 bg-cyan-50 border-cyan-100',
    title: 'Presets',
    body: "Not sure where to start? Pick a preset pattern \u2014 Trap, Lo-Fi, House, or Boom Bap \u2014 to instantly load a beat. Then tweak it to make it your own!",
  },
  {
    icon: Play,
    iconColor: 'text-indigo-500 bg-indigo-50 border-indigo-100',
    title: 'Transport Controls',
    body: "The top bar is your control center. Hit Play to start your pattern, adjust the BPM (speed) with the arrows, and click the number to tap out a tempo. The loop button keeps your beat repeating.",
  },
  {
    icon: Sliders,
    iconColor: 'text-purple-500 bg-purple-50 border-purple-100',
    title: 'Mixer',
    body: "The mixer lets you fine-tune each sound\u2019s volume. You can also add effects like reverb (for space), delay (for echo), or filter (for tone shaping). Use Mute (M) and Solo (S) to focus on specific sounds.",
  },
  {
    icon: Rocket,
    iconColor: 'text-orange-500 bg-orange-50 border-orange-100',
    title: 'Your First Beat',
    body: "Ready to make your first beat? Here\u2019s a quick recipe:\n1) Pick a preset pattern to start.\n2) Hit Play and listen.\n3) Tap some pads to add extra hits.\n4) Try the AI Forge to create a unique sound.\n5) Mix it up in the Mixer.\nHave fun!",
  },
  {
    icon: Music,
    iconColor: 'text-pink-500 bg-pink-50 border-pink-100',
    title: "You're All Set!",
    body: "BeatForge is yours to explore. There are no rules \u2014 just have fun creating. You can always reopen this tour from the \u201C?\u201D button in the top bar.\n\nMade with love, for you.",
  },
]

export function Walkthrough() {
  const { isOpen, currentStep, next, prev, skipToEnd } = useWalkthroughStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') skipToEnd()
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') prev()
    },
    [isOpen, next, prev, skipToEnd]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === STEPS.length - 1
  const StepIcon = step.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={skipToEnd}
      />

      {/* Card */}
      <div
        key={currentStep}
        className="relative w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl shadow-indigo-500/10 animate-slide-up"
      >
        {/* Skip link */}
        {!isLast && (
          <button
            onClick={skipToEnd}
            className="absolute top-4 right-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip tour
          </button>
        )}

        {/* Content */}
        <div className="px-8 pt-8 pb-6 flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={clsx(
              'w-16 h-16 rounded-2xl border flex items-center justify-center mb-5',
              step.iconColor
            )}
          >
            <StepIcon size={28} />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            {step.title}
          </h2>

          {/* Body */}
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {step.body}
          </p>
        </div>

        {/* Footer: nav + progress */}
        <div className="px-8 pb-6 flex flex-col items-center gap-4">
          {/* Buttons */}
          <div className="flex items-center gap-3 w-full">
            {!isFirst ? (
              <button
                onClick={prev}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors px-4 py-2"
              >
                Back
              </button>
            ) : (
              <div className="px-4 py-2" />
            )}

            <button
              onClick={next}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 active:scale-[0.98] transition-all"
            >
              {isLast ? "Let's Go!" : 'Next'}
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'rounded-full transition-all duration-300',
                  i === currentStep
                    ? 'w-5 h-2 bg-gradient-to-r from-indigo-500 to-purple-500'
                    : i < currentStep
                      ? 'w-2 h-2 bg-indigo-300'
                      : 'w-2 h-2 bg-slate-200'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
