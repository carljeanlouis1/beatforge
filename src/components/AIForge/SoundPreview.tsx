import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, RefreshCw, Save, Grid3X3 } from 'lucide-react'
import * as Tone from 'tone'
import { useSoundForgeStore } from '@/stores/useSoundForgeStore'
import { useSoundLibraryStore } from '@/stores/useSoundLibraryStore'
import { usePadStore } from '@/stores/usePadStore'
import { drumEngine } from '@/engine/DrumEngine'
import { audioEngine } from '@/engine/AudioEngine'
import { PAD_COLOR_HEX } from '@/utils/constants'

export function SoundPreview() {
  const generatedAudioUrl = useSoundForgeStore((s) => s.generatedAudioUrl)
  const generatedBlob = useSoundForgeStore((s) => s.generatedBlob)
  const prompt = useSoundForgeStore((s) => s.prompt)
  const category = useSoundForgeStore((s) => s.category)
  const duration = useSoundForgeStore((s) => s.duration)
  const loop = useSoundForgeStore((s) => s.loop)
  const isGenerating = useSoundForgeStore((s) => s.isGenerating)
  const generate = useSoundForgeStore((s) => s.generate)

  const addSound = useSoundLibraryStore((s) => s.addSound)

  const pads = usePadStore((s) => s.pads)
  const setPadSound = usePadStore((s) => s.setPadSound)

  const [isPlaying, setIsPlaying] = useState(false)
  const [showPadGrid, setShowPadGrid] = useState(false)
  const [saved, setSaved] = useState(false)
  const [assignedPadId, setAssignedPadId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Reset saved/assigned state when a new sound is generated
  useEffect(() => {
    setSaved(false)
    setAssignedPadId(null)
    setShowPadGrid(false)
  }, [generatedAudioUrl])

  const handlePlayPause = useCallback(() => {
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

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleRegenerate = useCallback(() => {
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    void generate()
  }, [generate])

  const handleSaveToLibrary = useCallback(async () => {
    if (!generatedBlob) return
    await addSound({
      name: prompt.slice(0, 50) || 'Untitled Sound',
      prompt,
      category,
      audioBlob: generatedBlob,
      duration,
      isLoop: loop,
    })
    setSaved(true)
  }, [generatedBlob, prompt, category, duration, loop, addSound])

  const handleAssignToPad = useCallback(async (padId: string) => {
    if (!generatedBlob) return

    // Ensure audio engine is initialized
    if (!audioEngine.isInitialized) {
      await audioEngine.init()
    }
    if (!drumEngine.isInitialized) {
      drumEngine.init()
    }

    // Decode the blob into an AudioBuffer
    const arrayBuffer = await generatedBlob.arrayBuffer()
    const audioContext = Tone.getContext().rawContext
    let audioBuffer: AudioBuffer

    if (audioContext instanceof AudioContext) {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    } else {
      // Fallback: create a temporary AudioContext
      const tempCtx = new AudioContext()
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer)
      await tempCtx.close()
    }

    // Create a unique sound ID for this custom sound
    const customSoundId = `ai-${crypto.randomUUID().slice(0, 8)}`

    // Load into the drum engine
    await drumEngine.loadCustomSound(customSoundId, audioBuffer)

    // Update the pad store
    setPadSound(padId, customSoundId)

    // Also update the pad label
    const label = prompt.slice(0, 12) || 'AI Sound'
    usePadStore.setState((state) => ({
      pads: state.pads.map((p) =>
        p.id === padId ? { ...p, soundId: customSoundId, label, customAudioId: customSoundId } : p
      ),
    }))

    setAssignedPadId(padId)
    setShowPadGrid(false)
  }, [generatedBlob, prompt, setPadSound])

  if (!generatedAudioUrl || isGenerating) return null

  // Get a 4x4 grid (first 16 pads)
  const gridPads = pads.slice(0, 16)

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={generatedAudioUrl}
        onEnded={handleAudioEnded}
        preload="auto"
      />

      {/* Preview card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="flex items-center gap-3">
          {/* Play/pause */}
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full bg-white border border-indigo-200
              flex items-center justify-center shadow-sm
              hover:bg-indigo-50 active:scale-95 transition-all duration-150"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-indigo-600" />
            ) : (
              <Play className="w-4 h-4 text-indigo-600 ml-0.5" />
            )}
          </button>

          {/* Sound info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">
              {prompt || 'Generated Sound'}
            </p>
            <p className="text-xs text-slate-500">
              {duration}s &middot; {category}
              {loop ? ' \u00B7 loop' : ''}
            </p>
          </div>

          {/* Sound wave animation (when playing) */}
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-5">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="w-1 bg-indigo-400 rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.random() * 12}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.4 + Math.random() * 0.3}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="flex-1 py-2 px-3 rounded-lg text-xs font-medium
            bg-white border border-slate-200 text-slate-600
            hover:bg-slate-50 active:scale-[0.98] transition-all duration-150
            flex items-center justify-center gap-1.5
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </button>

        <button
          onClick={() => setShowPadGrid(!showPadGrid)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium
            transition-all duration-150
            flex items-center justify-center gap-1.5
            active:scale-[0.98]
            ${assignedPadId
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          {assignedPadId ? 'Assigned' : 'Add to Pad'}
        </button>

        <button
          onClick={() => void handleSaveToLibrary()}
          disabled={saved}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium
            transition-all duration-150
            flex items-center justify-center gap-1.5
            active:scale-[0.98]
            ${saved
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }
            disabled:cursor-default`}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Pad assignment grid */}
      {showPadGrid && (
        <div className="p-3 rounded-xl bg-white border border-slate-200 animate-slide-up">
          <p className="text-xs text-slate-500 mb-2 font-medium">
            Select a pad to assign this sound:
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {gridPads.map((pad) => {
              const hex = PAD_COLOR_HEX[pad.color] ?? '#94a3b8'
              const isAssigned = assignedPadId === pad.id
              return (
                <button
                  key={pad.id}
                  onClick={() => void handleAssignToPad(pad.id)}
                  className={`aspect-square rounded-lg text-[10px] font-medium
                    flex items-center justify-center transition-all duration-150
                    hover:scale-105 active:scale-95
                    ${isAssigned
                      ? 'ring-2 ring-indigo-500 ring-offset-1'
                      : ''
                    }`}
                  style={{
                    backgroundColor: `${hex}20`,
                    borderWidth: 2,
                    borderColor: hex,
                    color: hex,
                  }}
                >
                  {pad.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
