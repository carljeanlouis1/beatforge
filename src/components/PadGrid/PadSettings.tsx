import { useCallback, useEffect, useRef, useState } from 'react'
import { DRUM_SOUNDS, PAD_COLORS, PAD_COLOR_HEX } from '@/utils/constants'
import { usePadStore } from '@/stores/usePadStore'
import { generateSound } from '@/services/elevenlabs'
import { drumEngine } from '@/engine/DrumEngine'
import { audioEngine } from '@/engine/AudioEngine'
import * as Tone from 'tone'
import type { PadMode } from '@/types'
import { X, Sparkles, Play, Pause, Check, Loader2 } from 'lucide-react'

interface PadSettingsProps {
  padId: string
  anchorRect: DOMRect
  onClose: () => void
}

const MODES: { value: PadMode; label: string }[] = [
  { value: 'one-shot', label: 'One-Shot' },
  { value: 'hold', label: 'Hold' },
  { value: 'toggle', label: 'Toggle' },
]

/** Maps built-in sound IDs to descriptive base prompts for AI editing */
const SOUND_BASE_PROMPTS: Record<string, string> = {
  'kick': 'punchy kick drum',
  'kick-deep': 'deep sub kick drum',
  'snare': 'crisp snare drum',
  'snare-rim': 'tight rimshot',
  'clap': 'sharp hand clap',
  'hihat-closed': 'closed hi-hat cymbal',
  'hihat-open': 'open hi-hat cymbal',
  'tom-low': 'deep floor tom',
  'tom-mid': 'mid rack tom',
  'tom-high': 'high rack tom',
  'crash': 'crash cymbal',
  'ride': 'ride cymbal',
  'cowbell': 'metallic cowbell',
  '808-bass': '808 bass hit',
  'snap': 'finger snap',
  'shaker': 'shaker percussion',
}

function getBasePrompt(soundId: string, padLabel: string): string {
  return SOUND_BASE_PROMPTS[soundId] ?? padLabel
}

function getSoundCategory(soundId: string): string {
  const sound = DRUM_SOUNDS.find((s) => s.id === soundId)
  return sound?.category ?? 'drums'
}

export function PadSettings({ padId, anchorRect, onClose }: PadSettingsProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const pads = usePadStore((s) => s.pads)
  const setPadSound = usePadStore((s) => s.setPadSound)
  const setPadVolume = usePadStore((s) => s.setPadVolume)
  const setPadColor = usePadStore((s) => s.setPadColor)
  const setPadMode = usePadStore((s) => s.setPadMode)

  const pad = pads.find((p) => p.id === padId)

  // AI Edit state
  const [editPrompt, setEditPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Clean up generated URL on unmount
  useEffect(() => {
    return () => {
      if (generatedUrl) {
        URL.revokeObjectURL(generatedUrl)
      }
    }
  }, [generatedUrl])

  const handleSoundChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPadSound(padId, e.target.value)
    },
    [padId, setPadSound]
  )

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPadVolume(padId, Number(e.target.value))
    },
    [padId, setPadVolume]
  )

  const handleModeChange = useCallback(
    (mode: PadMode) => {
      setPadMode(padId, mode)
    },
    [padId, setPadMode]
  )

  const handleGenerate = useCallback(async () => {
    if (!pad || !editPrompt.trim()) return

    // Clean up previous
    if (generatedUrl) {
      URL.revokeObjectURL(generatedUrl)
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }

    setIsGenerating(true)
    setAiError(null)
    setGeneratedBlob(null)
    setGeneratedUrl(null)
    setIsPreviewing(false)

    try {
      const baseDesc = getBasePrompt(pad.soundId, pad.label)
      const text = `A ${baseDesc} that is ${editPrompt.trim()}`
      const category = getSoundCategory(pad.soundId)

      const result = await generateSound({
        text,
        duration_seconds: 1,
        category,
      })

      setGeneratedBlob(result.audioBlob)
      setGeneratedUrl(result.audioUrl)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [pad, editPrompt, generatedUrl])

  const handlePreviewToggle = useCallback(() => {
    if (!generatedUrl) return

    if (isPreviewing && previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
      setIsPreviewing(false)
      return
    }

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(generatedUrl)
      previewAudioRef.current.onended = () => setIsPreviewing(false)
    }
    void previewAudioRef.current.play()
    setIsPreviewing(true)
  }, [generatedUrl, isPreviewing])

  const handleApply = useCallback(async () => {
    if (!generatedBlob || !pad) return

    // Ensure engines are initialized
    if (!audioEngine.isInitialized) {
      await audioEngine.init()
    }
    if (!drumEngine.isInitialized) {
      drumEngine.init()
    }

    // Decode blob to AudioBuffer
    const arrayBuffer = await generatedBlob.arrayBuffer()
    const audioContext = Tone.getContext().rawContext
    let audioBuffer: AudioBuffer

    if (audioContext instanceof AudioContext) {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    } else {
      const tempCtx = new AudioContext()
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer)
      await tempCtx.close()
    }

    const customSoundId = `ai-edit-${crypto.randomUUID().slice(0, 8)}`
    await drumEngine.loadCustomSound(customSoundId, audioBuffer)

    // Build label: first few words of the edit prompt
    const shortPrompt = editPrompt.trim().split(/\s+/).slice(0, 3).join(' ')
    const newLabel = `${pad.label} (${shortPrompt})`

    usePadStore.setState((state) => ({
      pads: state.pads.map((p) =>
        p.id === padId
          ? { ...p, soundId: customSoundId, label: newLabel.slice(0, 20), customAudioId: customSoundId }
          : p
      ),
    }))

    // Clean up
    setGeneratedBlob(null)
    if (generatedUrl) URL.revokeObjectURL(generatedUrl)
    setGeneratedUrl(null)
    setEditPrompt('')
    setIsPreviewing(false)
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
  }, [generatedBlob, pad, padId, editPrompt, generatedUrl])

  const handleDiscard = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    if (generatedUrl) URL.revokeObjectURL(generatedUrl)
    setGeneratedBlob(null)
    setGeneratedUrl(null)
    setIsPreviewing(false)
    setAiError(null)
  }, [generatedUrl])

  if (!pad) return null

  // Position the panel near the anchor pad
  const top = anchorRect.bottom + 8
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 280))

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-4 animate-slide-up max-h-[80vh] overflow-y-auto"
        style={{ top, left }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Pad Settings</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Sound selector */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-slate-500 mb-1 block">Sound</span>
          <select
            value={pad.soundId}
            onChange={handleSoundChange}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {DRUM_SOUNDS.map((sound) => (
              <option key={sound.id} value={sound.id}>
                {sound.label}
              </option>
            ))}
          </select>
        </label>

        {/* Volume slider */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-slate-500 mb-1 block">
            Volume: {pad.volume}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={pad.volume}
            onChange={handleVolumeChange}
            className="w-full accent-indigo-500"
          />
        </label>

        {/* Color picker */}
        <div className="mb-3">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Color</span>
          <div className="grid grid-cols-8 gap-1.5">
            {PAD_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setPadColor(padId, color)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: PAD_COLOR_HEX[color],
                  borderColor: pad.color === color ? '#334155' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div className="mb-4">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Mode</span>
          <div className="flex gap-1">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                  pad.mode === mode.value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 mb-3" />

        {/* AI Sound Edit */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-semibold text-slate-700">AI Sound Edit</span>
          </div>

          {/* Base sound label */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] text-slate-400">Base:</span>
            <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {pad.label}
            </span>
          </div>

          {/* Edit prompt input */}
          <input
            type="text"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editPrompt.trim() && !isGenerating) {
                void handleGenerate()
              }
            }}
            placeholder="Make it more reverby and snappy..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2
              text-slate-700 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 mb-2"
          />

          {/* Generate button */}
          <button
            onClick={() => void handleGenerate()}
            disabled={!editPrompt.trim() || isGenerating}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white
              bg-gradient-to-r from-indigo-500 to-purple-500
              shadow-sm hover:shadow-md active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate Edited Sound
              </>
            )}
          </button>

          {/* Error message */}
          {aiError && (
            <p className="text-[11px] text-red-500 mt-1.5">{aiError}</p>
          )}

          {/* Preview + Apply/Discard */}
          {generatedBlob && generatedUrl && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                {/* Preview play button */}
                <button
                  onClick={handlePreviewToggle}
                  className="w-7 h-7 rounded-full bg-white border border-indigo-200
                    flex items-center justify-center shadow-sm
                    hover:bg-indigo-50 active:scale-95 transition-all duration-150"
                >
                  {isPreviewing ? (
                    <Pause className="w-3 h-3 text-indigo-600" />
                  ) : (
                    <Play className="w-3 h-3 text-indigo-600 ml-0.5" />
                  )}
                </button>
                <span className="text-[11px] text-slate-600 font-medium flex-1 truncate">
                  Preview edited sound
                </span>
                {/* Playing animation */}
                {isPreviewing && (
                  <div className="flex items-end gap-0.5 h-4">
                    {[...Array(4)].map((_, i) => (
                      <span
                        key={i}
                        className="w-0.5 bg-indigo-400 rounded-full animate-pulse"
                        style={{
                          height: `${6 + Math.random() * 10}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: `${0.4 + Math.random() * 0.3}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => void handleApply()}
                  className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-white
                    bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]
                    transition-all duration-150 flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Apply
                </button>
                <button
                  onClick={handleDiscard}
                  className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold
                    text-slate-600 bg-white border border-slate-200
                    hover:bg-slate-50 active:scale-[0.98]
                    transition-all duration-150 flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
