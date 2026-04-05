import { useEffect, useState, useRef, useCallback } from 'react'
import { Play, Pause, Trash2, Pencil, Check, X, Grid3X3, Sparkles, Mic, Music } from 'lucide-react'
import * as Tone from 'tone'
import { useSoundLibraryStore } from '@/stores/useSoundLibraryStore'
import { usePadStore } from '@/stores/usePadStore'
import { drumEngine } from '@/engine/DrumEngine'
import { audioEngine } from '@/engine/AudioEngine'
import { PAD_COLOR_HEX } from '@/utils/constants'
import { clsx } from 'clsx'
import type { StoredSound } from '@/types'

type FilterTab = 'all' | 'ai' | 'recorded' | 'voice'

const CATEGORY_COLORS: Record<string, string> = {
  drums: 'bg-orange-100 text-orange-700',
  bass: 'bg-purple-100 text-purple-700',
  ambient: 'bg-sky-100 text-sky-700',
  musical: 'bg-emerald-100 text-emerald-700',
  fun: 'bg-pink-100 text-pink-700',
  fx: 'bg-amber-100 text-amber-700',
  voice: 'bg-violet-100 text-violet-700',
}

const SOURCE_BADGES: Record<string, { label: string; class: string; icon: typeof Sparkles }> = {
  ai: { label: 'AI', class: 'bg-amber-50 text-amber-600 border-amber-200', icon: Sparkles },
  recorded: { label: 'Rec', class: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: Music },
  voice: { label: 'Voice', class: 'bg-violet-50 text-violet-600 border-violet-200', icon: Mic },
}

function getSoundSourceType(sound: StoredSound): 'ai' | 'recorded' | 'voice' {
  if (sound.category === 'voice') return 'voice'
  // Sounds created via voice recording often have "voice" or "vocal" in prompt
  if (sound.prompt?.toLowerCase().includes('voice') || sound.prompt?.toLowerCase().includes('vocal')) return 'voice'
  // Sounds with "recorded" category
  if (sound.category === 'recorded') return 'recorded'
  return 'ai'
}

function SoundCard({ sound }: { sound: StoredSound }) {
  const removeSound = useSoundLibraryStore((s) => s.removeSound)
  const renameSound = useSoundLibraryStore((s) => s.renameSound)
  const pads = usePadStore((s) => s.pads)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(sound.name)
  const [showPadGrid, setShowPadGrid] = useState(false)
  const [assignedPadId, setAssignedPadId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Create and clean up object URL
  useEffect(() => {
    const url = URL.createObjectURL(sound.audioBlob)
    audioUrlRef.current = url
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [sound.audioBlob])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current && audioUrlRef.current) {
      audioRef.current = new Audio(audioUrlRef.current)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      void audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleRename = useCallback(async () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== sound.name) {
      await renameSound(sound.id, trimmed)
    }
    setIsEditing(false)
  }, [editName, sound.id, sound.name, renameSound])

  const handleDelete = useCallback(async () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    await removeSound(sound.id)
  }, [sound.id, removeSound])

  const handleAssignToPad = useCallback(async (padId: string) => {
    if (!audioEngine.isInitialized) {
      await audioEngine.init()
    }
    if (!drumEngine.isInitialized) {
      drumEngine.init()
    }

    const arrayBuffer = await sound.audioBlob.arrayBuffer()
    const audioContext = Tone.getContext().rawContext
    let audioBuffer: AudioBuffer

    if (audioContext instanceof AudioContext) {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    } else {
      const tempCtx = new AudioContext()
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer)
      await tempCtx.close()
    }

    const customSoundId = `ai-${sound.id.slice(0, 8)}`
    await drumEngine.loadCustomSound(customSoundId, audioBuffer)

    const label = sound.name.slice(0, 12)
    usePadStore.setState((state) => ({
      pads: state.pads.map((p) =>
        p.id === padId ? { ...p, soundId: customSoundId, label, customAudioId: customSoundId } : p
      ),
    }))

    setAssignedPadId(padId)
    setShowPadGrid(false)
  }, [sound])

  const categoryClass = CATEGORY_COLORS[sound.category] ?? 'bg-slate-100 text-slate-600'
  const dateStr = new Date(sound.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  const gridPads = pads.slice(0, 16)

  return (
    <div className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors duration-150">
      <div className="flex items-start gap-2.5">
        {/* Play button */}
        <button
          onClick={handlePlayPause}
          className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200
            flex items-center justify-center flex-shrink-0 mt-0.5
            hover:bg-indigo-50 hover:border-indigo-200 active:scale-95
            transition-all duration-150"
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 text-indigo-600" />
          ) : (
            <Play className="w-3 h-3 text-indigo-600 ml-0.5" />
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleRename()
                  if (e.key === 'Escape') setIsEditing(false)
                }}
                className="flex-1 text-sm font-medium text-slate-700 bg-slate-50
                  border border-slate-200 rounded px-1.5 py-0.5
                  focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                onClick={() => void handleRename()}
                className="p-1 rounded hover:bg-emerald-50 text-emerald-600"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-700 truncate">
              {sound.name}
            </p>
          )}
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {sound.prompt}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {(() => {
              const srcType = getSoundSourceType(sound)
              const badge = SOURCE_BADGES[srcType]
              if (!badge) return null
              const BadgeIcon = badge.icon
              return (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-medium ${badge.class}`}>
                  <BadgeIcon className="w-2.5 h-2.5" />
                  {badge.label}
                </span>
              )
            })()}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryClass}`}>
              {sound.category}
            </span>
            <span className="text-[10px] text-slate-400">{sound.duration}s</span>
            <span className="text-[10px] text-slate-400">{dateStr}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => {
              setEditName(sound.name)
              setIsEditing(true)
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400
              hover:text-slate-600 transition-colors duration-150"
            title="Rename"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowPadGrid(!showPadGrid)}
            className={`p-1.5 rounded-lg transition-colors duration-150
              ${assignedPadId
                ? 'bg-emerald-50 text-emerald-600'
                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
              }`}
            title="Assign to pad"
          >
            <Grid3X3 className="w-3 h-3" />
          </button>
          <button
            onClick={() => void handleDelete()}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400
              hover:text-red-500 transition-colors duration-150"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Pad assignment grid */}
      {showPadGrid && (
        <div className="mt-3 pt-3 border-t border-slate-100 animate-slide-up">
          <p className="text-[10px] text-slate-500 mb-2 font-medium">
            Select a pad:
          </p>
          <div className="grid grid-cols-4 gap-1">
            {gridPads.map((pad) => {
              const hex = PAD_COLOR_HEX[pad.color] ?? '#94a3b8'
              const isAssigned = assignedPadId === pad.id
              return (
                <button
                  key={pad.id}
                  onClick={() => void handleAssignToPad(pad.id)}
                  className={`aspect-square rounded text-[9px] font-medium
                    flex items-center justify-center transition-all duration-150
                    hover:scale-105 active:scale-95
                    ${isAssigned ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                  style={{
                    backgroundColor: `${hex}20`,
                    borderWidth: 1,
                    borderColor: hex,
                    color: hex,
                  }}
                >
                  {pad.label.slice(0, 6)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const FILTER_TABS: { id: FilterTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'all', label: 'All', icon: Music },
  { id: 'ai', label: 'AI Generated', icon: Sparkles },
  { id: 'recorded', label: 'Recorded', icon: Music },
  { id: 'voice', label: 'Voice', icon: Mic },
]

export function SoundLibrary() {
  const sounds = useSoundLibraryStore((s) => s.sounds)
  const isLoading = useSoundLibraryStore((s) => s.isLoading)
  const loadSounds = useSoundLibraryStore((s) => s.loadSounds)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  useEffect(() => {
    void loadSounds()
  }, [loadSounds])

  const filteredSounds = sounds.filter((sound) => {
    if (activeFilter === 'all') return true
    return getSoundSourceType(sound) === activeFilter
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      {sounds.length > 0 && (
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100">
          {FILTER_TABS.map((tab) => {
            const TabIcon = tab.icon
            const count = tab.id === 'all'
              ? sounds.length
              : sounds.filter((s) => getSoundSourceType(s) === tab.id).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 flex-1 justify-center',
                  activeFilter === tab.id
                    ? 'bg-white text-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <TabIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={clsx(
                    'text-[9px] px-1 py-px rounded-full',
                    activeFilter === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Sound list */}
      {filteredSounds.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">
            {sounds.length === 0
              ? 'No sounds yet. Create your first sound above!'
              : `No ${activeFilter === 'all' ? '' : activeFilter + ' '}sounds found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSounds.map((sound) => (
            <SoundCard key={sound.id} sound={sound} />
          ))}
        </div>
      )}
    </div>
  )
}
