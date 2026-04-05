import { useEffect, useCallback } from 'react'
import {
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  AudioLines,
  ChevronDown,
} from 'lucide-react'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { VoiceRecordButton } from '@/components/VoiceStudio/VoiceRecordButton'
import { RecordingCard } from '@/components/VoiceStudio/RecordingCard'

export function VoiceStudio() {
  const pitchShift = useVoiceStore((s) => s.pitchShift)
  const setPitchShift = useVoiceStore((s) => s.setPitchShift)
  const monitorEnabled = useVoiceStore((s) => s.monitorEnabled)
  const toggleMonitor = useVoiceStore((s) => s.toggleMonitor)
  const recordings = useVoiceStore((s) => s.recordings)
  const selectedRecordingId = useVoiceStore((s) => s.selectedRecordingId)
  const selectedVoiceId = useVoiceStore((s) => s.selectedVoiceId)
  const setSelectedVoice = useVoiceStore((s) => s.setSelectedVoice)
  const availableVoices = useVoiceStore((s) => s.availableVoices)
  const loadVoices = useVoiceStore((s) => s.loadVoices)
  const isTransforming = useVoiceStore((s) => s.isTransforming)
  const transformVoice = useVoiceStore((s) => s.transformVoice)
  const isolateAudio = useVoiceStore((s) => s.isolateAudio)

  useEffect(() => {
    void loadVoices()
  }, [loadVoices])

  const handleTransformSelected = useCallback(() => {
    if (selectedRecordingId && selectedVoiceId) {
      void transformVoice(selectedRecordingId)
    }
  }, [selectedRecordingId, selectedVoiceId, transformVoice])

  const handleIsolateSelected = useCallback(() => {
    if (selectedRecordingId) {
      void isolateAudio(selectedRecordingId)
    }
  }, [selectedRecordingId, isolateAudio])

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Main recording card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500
            flex items-center justify-center"
          >
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Voice Studio
            </h2>
            <p className="text-xs text-slate-400">
              Record, pitch shift, and transform your voice
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-5">
          {/* Record button */}
          <VoiceRecordButton />

          {/* Pitch shift slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600">
                Pitch Shift
              </label>
              <span className="text-xs text-slate-500 tabular-nums font-mono">
                {pitchShift > 0 ? '+' : ''}
                {pitchShift} semitones
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-medium w-6 text-right">
                -12
              </span>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={pitchShift}
                onChange={(e) => setPitchShift(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer
                  bg-slate-200 accent-indigo-500
                  [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
              />
              <span className="text-[10px] text-slate-400 font-medium w-6">
                +12
              </span>
            </div>
          </div>

          {/* Monitor toggle */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              {monitorEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-sm text-slate-600">
                Monitor (hear yourself)
              </span>
            </div>
            <button
              onClick={toggleMonitor}
              className={`relative w-10 h-6 rounded-full transition-colors duration-200
                ${monitorEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm
                  transition-transform duration-200
                  ${monitorEnabled ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {monitorEnabled && (
            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
              Monitoring adds some latency. Use headphones to avoid feedback.
            </p>
          )}
        </div>
      </div>

      {/* AI Voice Transform card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-slate-700">
            AI Voice Transform
          </h3>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {/* Voice selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Voice</label>
            <div className="relative">
              <select
                value={selectedVoiceId ?? ''}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 rounded-lg
                  bg-slate-50 border border-slate-200 text-sm text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                  cursor-pointer"
              >
                <option value="" disabled>
                  Select a voice...
                </option>
                {availableVoices.map((voice) => {
                  const labelParts: string[] = []
                  if (voice.labels.accent) labelParts.push(voice.labels.accent)
                  if (voice.labels.gender) labelParts.push(voice.labels.gender)
                  const labelStr =
                    labelParts.length > 0
                      ? ` (${labelParts.join(', ')})`
                      : ''
                  return (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}{labelStr}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleTransformSelected}
              disabled={
                !selectedRecordingId || !selectedVoiceId || isTransforming
              }
              className="flex-1 py-2.5 px-3 rounded-lg text-xs font-medium
                bg-gradient-to-r from-purple-500 to-indigo-500 text-white
                hover:from-purple-600 hover:to-indigo-600
                active:scale-[0.98] transition-all duration-150
                flex items-center justify-center gap-1.5
                disabled:opacity-40 disabled:cursor-not-allowed
                shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Transform Voice
            </button>

            <button
              onClick={handleIsolateSelected}
              disabled={!selectedRecordingId || isTransforming}
              className="flex-1 py-2.5 px-3 rounded-lg text-xs font-medium
                bg-white border border-slate-200 text-slate-600
                hover:bg-slate-50 active:scale-[0.98] transition-all duration-150
                flex items-center justify-center gap-1.5
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <AudioLines className="w-3.5 h-3.5" />
              Clean Audio
            </button>
          </div>

          {!selectedRecordingId && recordings.length > 0 && (
            <p className="text-[11px] text-slate-400 text-center">
              Select a recording below to transform it
            </p>
          )}
        </div>
      </div>

      {/* Recordings list card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center gap-2">
          <AudioLines className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">
            Your Recordings
          </h3>
          {recordings.length > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
              {recordings.length}
            </span>
          )}
        </div>

        <div className="px-5 pb-5">
          {recordings.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                No recordings yet. Hit the record button to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recordings.map((recording) => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
