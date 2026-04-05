import { useEffect, useCallback, useState, useRef } from 'react'
import {
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  AudioLines,
  ChevronDown,
  Play,
  Square,
  Save,
  SlidersHorizontal,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { VoiceRecordButton } from '@/components/VoiceStudio/VoiceRecordButton'
import { RecordingCard } from '@/components/VoiceStudio/RecordingCard'
import { WaveformEditor } from '@/components/VoiceStudio/WaveformEditor'

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

  // Effects state
  const effectPitch = useVoiceStore((s) => s.effectPitch)
  const effectReverb = useVoiceStore((s) => s.effectReverb)
  const effectReverbEnabled = useVoiceStore((s) => s.effectReverbEnabled)
  const effectDelay = useVoiceStore((s) => s.effectDelay)
  const effectDelayEnabled = useVoiceStore((s) => s.effectDelayEnabled)
  const effectFilterFreq = useVoiceStore((s) => s.effectFilterFreq)
  const effectFilterEnabled = useVoiceStore((s) => s.effectFilterEnabled)
  const effectFilterType = useVoiceStore((s) => s.effectFilterType)
  const isPreviewingEffects = useVoiceStore((s) => s.isPreviewingEffects)
  const isRenderingEffects = useVoiceStore((s) => s.isRenderingEffects)
  const updateRecordingAudio = useVoiceStore((s) => s.updateRecordingAudio)
  const setEffectPitch = useVoiceStore((s) => s.setEffectPitch)
  const setEffectReverb = useVoiceStore((s) => s.setEffectReverb)
  const setEffectDelay = useVoiceStore((s) => s.setEffectDelay)
  const setEffectFilter = useVoiceStore((s) => s.setEffectFilter)
  const previewWithEffects = useVoiceStore((s) => s.previewWithEffects)
  const stopEffectsPreview = useVoiceStore((s) => s.stopEffectsPreview)
  const saveWithEffects = useVoiceStore((s) => s.saveWithEffects)

  // TTS state
  const ttsText = useVoiceStore((s) => s.ttsText)
  const ttsStability = useVoiceStore((s) => s.ttsStability)
  const ttsSimilarity = useVoiceStore((s) => s.ttsSimilarity)
  const isGeneratingTTS = useVoiceStore((s) => s.isGeneratingTTS)
  const ttsResult = useVoiceStore((s) => s.ttsResult)
  const setTtsText = useVoiceStore((s) => s.setTtsText)
  const setTtsStability = useVoiceStore((s) => s.setTtsStability)
  const setTtsSimilarity = useVoiceStore((s) => s.setTtsSimilarity)
  const generateTTS = useVoiceStore((s) => s.generateTTS)
  const saveTtsToLibrary = useVoiceStore((s) => s.saveTtsToLibrary)

  const [ttsSavedToLibrary, setTtsSavedToLibrary] = useState(false)
  const [isTtsPlaying, setIsTtsPlaying] = useState(false)
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    void loadVoices()
  }, [loadVoices])

  // Reset saved state when tts result changes
  useEffect(() => {
    setTtsSavedToLibrary(false)
  }, [ttsResult])

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

  const handlePreviewEffects = useCallback(() => {
    if (isPreviewingEffects) {
      stopEffectsPreview()
    } else {
      void previewWithEffects()
    }
  }, [isPreviewingEffects, previewWithEffects, stopEffectsPreview])

  const handleSaveWithEffects = useCallback(() => {
    void saveWithEffects()
  }, [saveWithEffects])

  const handleGenerateTTS = useCallback(() => {
    void generateTTS()
  }, [generateTTS])

  const handlePlayTTS = useCallback(() => {
    if (!ttsResult) return

    if (isTtsPlaying && ttsAudioRef.current) {
      ttsAudioRef.current.pause()
      ttsAudioRef.current.currentTime = 0
      setIsTtsPlaying(false)
      return
    }

    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause()
    }
    ttsAudioRef.current = new Audio(ttsResult.url)
    ttsAudioRef.current.onended = () => setIsTtsPlaying(false)
    void ttsAudioRef.current.play()
    setIsTtsPlaying(true)
  }, [ttsResult, isTtsPlaying])

  const handleSaveTTS = useCallback(async () => {
    await saveTtsToLibrary()
    setTtsSavedToLibrary(true)
  }, [saveTtsToLibrary])

  // Get selected recording name
  const selectedRecording = selectedRecordingId
    ? recordings.find((r) => r.id === selectedRecordingId)
    : null

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

      {/* Recording Effects card */}
      {selectedRecording && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-700">
              Recording Effects
            </h3>
          </div>

          <div className="px-5 pb-5 space-y-4">
            {/* Selected recording indicator */}
            <div className="px-3 py-2 rounded-lg bg-indigo-50/60 border border-indigo-100">
              <p className="text-xs text-indigo-600 font-medium">
                Selected: {selectedRecording.name}
              </p>
            </div>

            {/* Waveform Editor */}
            <WaveformEditor
              audioUrl={selectedRecording.audioUrl}
              audioBlob={selectedRecording.audioBlob}
              onTrimmed={(blob, url) => {
                // Compute duration from the blob
                const audio = new Audio(url)
                audio.onloadedmetadata = () => {
                  updateRecordingAudio(selectedRecording.id, blob, url, audio.duration || selectedRecording.duration)
                }
                audio.onerror = () => {
                  updateRecordingAudio(selectedRecording.id, blob, url, selectedRecording.duration)
                }
              }}
            />

            {/* Pitch effect */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">Pitch</label>
                <span className="text-xs text-slate-500 tabular-nums font-mono">
                  {effectPitch > 0 ? '+' : ''}{effectPitch} semitones
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-medium w-6 text-right">-12</span>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={effectPitch}
                  onChange={(e) => setEffectPitch(Number(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer
                    bg-slate-200 accent-indigo-500
                    [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
                />
                <span className="text-[10px] text-slate-400 font-medium w-6">+12</span>
              </div>
            </div>

            {/* Reverb */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600">Reverb</label>
                  <span className="text-xs text-slate-400 tabular-nums font-mono">
                    {Math.round(effectReverb * 100)}%
                  </span>
                </div>
                <button
                  onClick={() => setEffectReverb(!effectReverbEnabled, effectReverb)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200
                    ${effectReverbEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                      transition-transform duration-200
                      ${effectReverbEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={effectReverb}
                onChange={(e) => setEffectReverb(effectReverbEnabled, Number(e.target.value))}
                disabled={!effectReverbEnabled}
                className="w-full h-2 rounded-full appearance-none cursor-pointer
                  bg-slate-200 accent-indigo-500 disabled:opacity-40
                  [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>

            {/* Delay */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600">Delay</label>
                  <span className="text-xs text-slate-400 tabular-nums font-mono">
                    {Math.round(effectDelay * 100)}%
                  </span>
                </div>
                <button
                  onClick={() => setEffectDelay(!effectDelayEnabled, effectDelay)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200
                    ${effectDelayEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                      transition-transform duration-200
                      ${effectDelayEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={effectDelay}
                onChange={(e) => setEffectDelay(effectDelayEnabled, Number(e.target.value))}
                disabled={!effectDelayEnabled}
                className="w-full h-2 rounded-full appearance-none cursor-pointer
                  bg-slate-200 accent-indigo-500 disabled:opacity-40
                  [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>

            {/* Filter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600">Filter</label>
                  <span className="text-xs text-slate-400 tabular-nums font-mono">
                    {effectFilterFreq >= 1000
                      ? `${(effectFilterFreq / 1000).toFixed(1)}kHz`
                      : `${effectFilterFreq}Hz`}
                  </span>
                </div>
                <button
                  onClick={() => setEffectFilter(!effectFilterEnabled, effectFilterFreq, effectFilterType)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200
                    ${effectFilterEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                      transition-transform duration-200
                      ${effectFilterEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={20}
                  max={20000}
                  step={1}
                  value={effectFilterFreq}
                  onChange={(e) => setEffectFilter(effectFilterEnabled, Number(e.target.value), effectFilterType)}
                  disabled={!effectFilterEnabled}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer
                    bg-slate-200 accent-indigo-500 disabled:opacity-40
                    [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
                />
                <select
                  value={effectFilterType}
                  onChange={(e) => setEffectFilter(effectFilterEnabled, effectFilterFreq, e.target.value as BiquadFilterType)}
                  disabled={!effectFilterEnabled}
                  className="appearance-none px-2 py-1 rounded-md bg-slate-50 border border-slate-200
                    text-[11px] text-slate-600 font-medium
                    focus:outline-none focus:ring-2 focus:ring-indigo-400
                    disabled:opacity-40 cursor-pointer w-14 text-center"
                >
                  <option value="lowpass">LP</option>
                  <option value="highpass">HP</option>
                  <option value="bandpass">BP</option>
                </select>
              </div>
            </div>

            {/* Preview & Save buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handlePreviewEffects}
                disabled={isRenderingEffects}
                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-medium
                  bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                  hover:from-indigo-600 hover:to-purple-600
                  active:scale-[0.98] transition-all duration-150
                  flex items-center justify-center gap-1.5
                  disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {isPreviewingEffects ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Preview with Effects
                  </>
                )}
              </button>

              <button
                onClick={handleSaveWithEffects}
                disabled={isRenderingEffects || isPreviewingEffects}
                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-medium
                  bg-white border border-slate-200 text-slate-600
                  hover:bg-slate-50 active:scale-[0.98] transition-all duration-150
                  flex items-center justify-center gap-1.5
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRenderingEffects ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save as New Sound
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text-to-Sound card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-slate-700">
            Text-to-Sound
          </h3>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <p className="text-[11px] text-slate-400">
            Speak text in any voice to create vocal sounds
          </p>

          {/* Voice selector (reuses the same voice list) */}
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

          {/* Text input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Text</label>
            <input
              type="text"
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Yeah!  /  Let's go!  /  Drop the beat"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200
                text-sm text-slate-700 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          {/* Style sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-500">Stability</label>
                <span className="text-[10px] text-slate-400 tabular-nums font-mono">
                  {Math.round(ttsStability * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={ttsStability}
                onChange={(e) => setTtsStability(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                  bg-slate-200 accent-emerald-500
                  [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
              />
              <div className="flex justify-between">
                <span className="text-[9px] text-slate-300">Expressive</span>
                <span className="text-[9px] text-slate-300">Stable</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-500">Similarity</label>
                <span className="text-[10px] text-slate-400 tabular-nums font-mono">
                  {Math.round(ttsSimilarity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={ttsSimilarity}
                onChange={(e) => setTtsSimilarity(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                  bg-slate-200 accent-emerald-500
                  [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
              />
              <div className="flex justify-between">
                <span className="text-[9px] text-slate-300">Low</span>
                <span className="text-[9px] text-slate-300">High</span>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateTTS}
            disabled={!ttsText.trim() || !selectedVoiceId || isGeneratingTTS}
            className="w-full py-2.5 px-3 rounded-lg text-xs font-medium
              bg-gradient-to-r from-emerald-500 to-teal-500 text-white
              hover:from-emerald-600 hover:to-teal-600
              active:scale-[0.98] transition-all duration-150
              flex items-center justify-center gap-1.5
              disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {isGeneratingTTS ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                Generate Speech
              </>
            )}
          </button>

          {/* TTS Result */}
          {ttsResult && (
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-2">
              <p className="text-xs font-medium text-emerald-700">
                Generated: &ldquo;{ttsText.slice(0, 40)}{ttsText.length > 40 ? '...' : ''}&rdquo;
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePlayTTS}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-medium
                    bg-white border border-emerald-200 text-emerald-700
                    hover:bg-emerald-50 active:scale-[0.98] transition-all duration-150
                    flex items-center justify-center gap-1.5"
                >
                  {isTtsPlaying ? (
                    <>
                      <Square className="w-3 h-3" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      Preview
                    </>
                  )}
                </button>
                <button
                  onClick={() => void handleSaveTTS()}
                  disabled={ttsSavedToLibrary}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium
                    transition-all duration-150 flex items-center justify-center gap-1.5
                    active:scale-[0.98]
                    ${ttsSavedToLibrary
                      ? 'bg-emerald-100 text-emerald-600 cursor-default'
                      : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                >
                  <Save className="w-3 h-3" />
                  {ttsSavedToLibrary ? 'Saved!' : 'Save to Library'}
                </button>
              </div>
            </div>
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
