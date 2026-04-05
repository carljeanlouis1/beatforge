import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Save,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Volume2,
  Sparkles,
  Mic,
  Music,
  Package,
} from 'lucide-react'
import * as Tone from 'tone'
import { clsx } from 'clsx'
import { DRUM_SOUNDS, PAD_COLOR_HEX } from '@/utils/constants'
import { usePadStore } from '@/stores/usePadStore'
import { useSoundLibraryStore } from '@/stores/useSoundLibraryStore'
import { useCustomKitStore } from '@/stores/useCustomKitStore'
import { drumEngine } from '@/engine/DrumEngine'
import { audioEngine } from '@/engine/AudioEngine'
import type { StoredSound } from '@/types'

type FilterType = 'all' | 'builtin' | 'ai' | 'recorded' | 'voice'

interface LibraryItem {
  id: string
  name: string
  sourceType: FilterType
  isBuiltin: boolean
  storedSound?: StoredSound
  builtinSoundId?: string
  category: string
}

const FILTER_OPTIONS: { id: FilterType; label: string; icon: typeof Sparkles }[] = [
  { id: 'all', label: 'All', icon: Volume2 },
  { id: 'builtin', label: 'Built-in', icon: Package },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'recorded', label: 'Recorded', icon: Music },
  { id: 'voice', label: 'Voice', icon: Mic },
]

function getStoredSoundSourceType(sound: StoredSound): 'ai' | 'recorded' | 'voice' {
  if (sound.category === 'voice') return 'voice'
  if (sound.prompt?.toLowerCase().includes('voice') || sound.prompt?.toLowerCase().includes('vocal')) return 'voice'
  if (sound.category === 'recorded') return 'recorded'
  return 'ai'
}

function buildLibraryItems(storedSounds: StoredSound[]): LibraryItem[] {
  const builtinItems: LibraryItem[] = DRUM_SOUNDS.map((sound) => ({
    id: `builtin-${sound.id}`,
    name: sound.label,
    sourceType: 'builtin' as FilterType,
    isBuiltin: true,
    builtinSoundId: sound.id,
    category: sound.category,
  }))

  const storedItems: LibraryItem[] = storedSounds.map((sound) => ({
    id: `stored-${sound.id}`,
    name: sound.name,
    sourceType: getStoredSoundSourceType(sound) as FilterType,
    isBuiltin: false,
    storedSound: sound,
    category: sound.category,
  }))

  return [...builtinItems, ...storedItems]
}

const SOURCE_BADGE_STYLES: Record<string, { label: string; cls: string }> = {
  builtin: { label: 'Built-in', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  ai: { label: 'AI', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  recorded: { label: 'Rec', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  voice: { label: 'Voice', cls: 'bg-violet-50 text-violet-600 border-violet-200' },
}

interface PadBuilderProps {
  onClose: () => void
}

export function PadBuilder({ onClose }: PadBuilderProps) {
  const pads = usePadStore((s) => s.pads)
  const saveCurrentAsKit = useCustomKitStore((s) => s.saveCurrentAsKit)
  const restoreDefaults = useCustomKitStore((s) => s.restoreDefaults)

  const sounds = useSoundLibraryStore((s) => s.sounds)
  const loadSounds = useSoundLibraryStore((s) => s.loadSounds)

  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedPadId, setSelectedPadId] = useState<string | null>(null)
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null)
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [kitName, setKitName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadSounds()
  }, [loadSounds])

  useEffect(() => {
    if (showSaveInput && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [showSaveInput])

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  const libraryItems = buildLibraryItems(sounds)
  const filteredItems = filter === 'all'
    ? libraryItems
    : libraryItems.filter((item) => item.sourceType === filter)

  // Pad grid (4x4 = first 16 pads)
  const gridPads = pads.slice(0, 16)

  const handlePlaySound = useCallback((item: LibraryItem) => {
    // Stop current
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }

    if (playingSoundId === item.id) {
      setPlayingSoundId(null)
      return
    }

    if (item.isBuiltin && item.builtinSoundId) {
      // Trigger built-in sound via drum engine
      if (!drumEngine.isInitialized) {
        void audioEngine.init().then(() => {
          drumEngine.init()
          drumEngine.trigger(item.builtinSoundId!)
        })
      } else {
        drumEngine.trigger(item.builtinSoundId)
      }
      setPlayingSoundId(item.id)
      setTimeout(() => setPlayingSoundId(null), 500)
      return
    }

    if (item.storedSound) {
      const url = URL.createObjectURL(item.storedSound.audioBlob)
      audioUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setPlayingSoundId(null)
      }
      void audio.play()
      setPlayingSoundId(item.id)
    }
  }, [playingSoundId])

  const handleAssignToPad = useCallback(async (item: LibraryItem) => {
    if (!selectedPadId) return

    if (item.isBuiltin && item.builtinSoundId) {
      // Built-in: just update the sound ID
      const sound = DRUM_SOUNDS.find((s) => s.id === item.builtinSoundId)
      usePadStore.setState((state) => ({
        pads: state.pads.map((p) =>
          p.id === selectedPadId
            ? {
                ...p,
                soundId: item.builtinSoundId!,
                label: sound?.label ?? item.name,
                customAudioId: undefined,
              }
            : p
        ),
      }))
      setSelectedPadId(null)
      return
    }

    if (item.storedSound) {
      // Library sound: decode and load into drum engine
      if (!audioEngine.isInitialized) {
        await audioEngine.init()
      }
      if (!drumEngine.isInitialized) {
        drumEngine.init()
      }

      const arrayBuffer = await item.storedSound.audioBlob.arrayBuffer()
      const audioContext = Tone.getContext().rawContext
      let audioBuffer: AudioBuffer

      if (audioContext instanceof AudioContext) {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      } else {
        const tempCtx = new AudioContext()
        audioBuffer = await tempCtx.decodeAudioData(arrayBuffer)
        await tempCtx.close()
      }

      const customSoundId = `lib-${item.storedSound.id.slice(0, 8)}`
      await drumEngine.loadCustomSound(customSoundId, audioBuffer)

      usePadStore.setState((state) => ({
        pads: state.pads.map((p) =>
          p.id === selectedPadId
            ? {
                ...p,
                soundId: customSoundId,
                label: item.name.slice(0, 14),
                customAudioId: customSoundId,
              }
            : p
        ),
      }))
      setSelectedPadId(null)
    }
  }, [selectedPadId])

  const handleSaveKit = useCallback(async () => {
    const trimmed = kitName.trim()
    if (!trimmed) return
    setIsSaving(true)
    try {
      await saveCurrentAsKit(trimmed)
      setKitName('')
      setShowSaveInput(false)
    } finally {
      setIsSaving(false)
    }
  }, [kitName, saveCurrentAsKit])

  const handleReset = useCallback(() => {
    restoreDefaults()
    setSelectedPadId(null)
  }, [restoreDefaults])

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200 p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Pad Builder</h2>
            <p className="text-[10px] text-slate-400">Click a pad, then a sound to assign</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
              text-slate-500 bg-slate-50 border border-slate-200
              hover:bg-slate-100 hover:text-slate-700 transition-all duration-150"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={() => setShowSaveInput(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
              text-white bg-gradient-to-r from-indigo-500 to-purple-500
              shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-300
              active:scale-[0.98] transition-all duration-150"
          >
            <Save className="w-3 h-3" />
            Save as Kit
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Close"
          >
            <span className="text-xs font-bold">X</span>
          </button>
        </div>
      </div>

      {/* Save input */}
      {showSaveInput && (
        <div className="mb-4 flex items-center gap-2 animate-slide-up">
          <input
            ref={nameInputRef}
            value={kitName}
            onChange={(e) => setKitName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSaveKit()
              if (e.key === 'Escape') {
                setShowSaveInput(false)
                setKitName('')
              }
            }}
            placeholder="Kit name..."
            className="flex-1 text-sm text-slate-700 bg-slate-50 border border-slate-200
              rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300
              focus:border-indigo-300 placeholder:text-slate-400"
          />
          <button
            onClick={() => void handleSaveKit()}
            disabled={!kitName.trim() || isSaving}
            className="px-3 py-2 rounded-lg text-sm font-medium text-white
              bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50
              disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setShowSaveInput(false)
              setKitName('')
            }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <span className="text-sm">&times;</span>
          </button>
        </div>
      )}

      {/* Main layout: Library + Pad Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Sound Library */}
        <div>
          <h3 className="text-xs font-semibold text-slate-600 mb-2">Sound Library</h3>

          {/* Filter dropdown */}
          <div className="flex items-center gap-1 mb-2 p-0.5 rounded-lg bg-slate-100">
            {FILTER_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  className={clsx(
                    'flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-150 flex-1 justify-center',
                    filter === opt.id
                      ? 'bg-white text-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Sound list */}
          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {filteredItems.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No sounds found.</p>
            ) : (
              filteredItems.map((item) => {
                const badge = SOURCE_BADGE_STYLES[item.sourceType]
                const isPlaying = playingSoundId === item.id
                return (
                  <div
                    key={item.id}
                    className={clsx(
                      'flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-150 cursor-pointer',
                      'hover:border-indigo-200 hover:bg-indigo-50/50'
                    )}
                    style={{ borderColor: '#e2e8f0' }}
                    onClick={() => {
                      if (selectedPadId) {
                        void handleAssignToPad(item)
                      }
                    }}
                  >
                    {/* Play button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlaySound(item)
                      }}
                      className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200
                        flex items-center justify-center flex-shrink-0
                        hover:bg-indigo-50 hover:border-indigo-200 active:scale-95
                        transition-all duration-150"
                    >
                      {isPlaying ? (
                        <Pause className="w-2.5 h-2.5 text-indigo-600" />
                      ) : (
                        <Play className="w-2.5 h-2.5 text-indigo-600 ml-0.5" />
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-slate-700 truncate">{item.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {badge && (
                          <span className={`inline-flex items-center px-1 py-px rounded border text-[9px] font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400">{item.category}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Pad Grid */}
        <div>
          <h3 className="text-xs font-semibold text-slate-600 mb-2">Your Custom Pads</h3>
          {selectedPadId && (
            <p className="text-[10px] text-indigo-500 font-medium mb-2 animate-slide-up">
              Now click a sound from the library to assign it
            </p>
          )}
          <div className="grid grid-cols-4 gap-1.5">
            {gridPads.map((pad) => {
              const hex = PAD_COLOR_HEX[pad.color] ?? '#94a3b8'
              const isSelected = selectedPadId === pad.id
              return (
                <button
                  key={pad.id}
                  onClick={() =>
                    setSelectedPadId(isSelected ? null : pad.id)
                  }
                  className={clsx(
                    'aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-150',
                    'hover:scale-105 active:scale-95',
                    isSelected && 'ring-2 ring-indigo-500 ring-offset-2 scale-105'
                  )}
                  style={{
                    backgroundColor: `${hex}20`,
                    borderWidth: 2,
                    borderColor: hex,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full mb-1"
                    style={{ backgroundColor: hex }}
                  />
                  <span
                    className="text-[9px] font-semibold leading-tight text-center px-0.5 truncate w-full"
                    style={{ color: hex }}
                  >
                    {pad.label || 'Empty'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 text-[10px] text-slate-400 space-y-1">
            <p>1. Click a pad to select it (highlighted)</p>
            <p>2. Click a sound from the library to assign</p>
          </div>
        </div>
      </div>
    </div>
  )
}
