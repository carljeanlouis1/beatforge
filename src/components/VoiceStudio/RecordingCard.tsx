import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Sparkles,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useVoiceStore } from '@/stores/useVoiceStore'
import type { VoiceRecording } from '@/types'

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`
}

interface RecordingCardProps {
  recording: VoiceRecording
}

export function RecordingCard({ recording }: RecordingCardProps) {
  const isTransforming = useVoiceStore((s) => s.isTransforming)
  const selectedRecordingId = useVoiceStore((s) => s.selectedRecordingId)
  const selectedVoiceId = useVoiceStore((s) => s.selectedVoiceId)
  const availableVoices = useVoiceStore((s) => s.availableVoices)
  const transformVoice = useVoiceStore((s) => s.transformVoice)
  const deleteRecording = useVoiceStore((s) => s.deleteRecording)
  const addRecordingToSoundLibrary = useVoiceStore(
    (s) => s.addRecordingToSoundLibrary
  )
  const selectRecording = useVoiceStore((s) => s.selectRecording)

  const [isPlaying, setIsPlaying] = useState(false)
  const [savedToLibrary, setSavedToLibrary] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isSelected = selectedRecordingId === recording.id
  const isThisTransforming = isTransforming && isSelected

  const playbackUrl = recording.transformedUrl ?? recording.audioUrl

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(playbackUrl)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      // Recreate if URL changed (e.g. after transformation)
      if (audioRef.current.src !== playbackUrl) {
        audioRef.current.pause()
        audioRef.current = new Audio(playbackUrl)
        audioRef.current.onended = () => setIsPlaying(false)
      }
      void audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying, playbackUrl])

  const handleTransform = useCallback(() => {
    if (!selectedVoiceId) return
    selectRecording(recording.id)
    void transformVoice(recording.id)
  }, [selectedVoiceId, recording.id, transformVoice, selectRecording])

  const handleAddToLibrary = useCallback(async () => {
    await addRecordingToSoundLibrary(recording.id)
    setSavedToLibrary(true)
  }, [recording.id, addRecordingToSoundLibrary])

  const handleDelete = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    deleteRecording(recording.id)
  }, [recording.id, deleteRecording])

  // Find the voice name if transformed
  const voiceName = recording.isTransformed
    ? availableVoices.find((v) => v.voice_id === selectedVoiceId)?.name ??
      'AI Voice'
    : null

  return (
    <div
      className={`relative p-3 rounded-xl border transition-all duration-150
        ${isSelected
          ? 'bg-indigo-50/50 border-indigo-200'
          : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
    >
      {/* Transforming overlay */}
      {isThisTransforming && (
        <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-sm
          flex items-center justify-center z-10">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            <span className="text-sm font-medium text-indigo-600">
              Transforming...
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {/* Play button */}
        <button
          onClick={handlePlayPause}
          disabled={isThisTransforming}
          className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200
            flex items-center justify-center flex-shrink-0
            hover:bg-indigo-50 hover:border-indigo-200 active:scale-95
            transition-all duration-150 disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 text-indigo-600" />
          ) : (
            <Play className="w-3 h-3 text-indigo-600 ml-0.5" />
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">
            {recording.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-slate-400 tabular-nums font-mono">
              {formatDuration(recording.duration)}
            </span>
            {recording.isTransformed ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                Transformed{voiceName ? ` \u00B7 ${voiceName}` : ''}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                Original
              </span>
            )}
            {recording.pitchShift !== 0 && (
              <span className="text-[10px] text-slate-400">
                {recording.pitchShift > 0 ? '+' : ''}
                {recording.pitchShift} st
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={handleTransform}
            disabled={!selectedVoiceId || isThisTransforming}
            className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400
              hover:text-purple-600 transition-colors duration-150
              disabled:opacity-30 disabled:cursor-not-allowed"
            title="Transform voice"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => void handleAddToLibrary()}
            disabled={savedToLibrary}
            className={`p-1.5 rounded-lg transition-colors duration-150
              ${savedToLibrary
                ? 'bg-emerald-50 text-emerald-600'
                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
              }
              disabled:cursor-default`}
            title={savedToLibrary ? 'Saved to library' : 'Add to Sound Library'}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isThisTransforming}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400
              hover:text-red-500 transition-colors duration-150
              disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
