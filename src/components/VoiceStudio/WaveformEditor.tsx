import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Play, Square, Scissors } from 'lucide-react'
import * as Tone from 'tone'

interface WaveformEditorProps {
  audioUrl: string
  audioBlob: Blob
  onTrimmed?: (blob: Blob, url: string) => void
}

/** Number of bars to render in the waveform SVG */
const BAR_COUNT = 250
/** SVG viewBox height */
const SVG_HEIGHT = 120
/** Max bar height (half, since symmetric) */
const HALF_HEIGHT = SVG_HEIGHT / 2

/**
 * Encode a Float32Array (mono PCM) into a WAV Blob.
 */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = samples.length * (bitsPerSample / 8)
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  // Write PCM samples (clamp to 16-bit range)
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    const val = s < 0 ? s * 0x8000 : s * 0x7fff
    view.setInt16(offset, val, true)
    offset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}

export function WaveformEditor({ audioUrl, audioBlob, onTrimmed }: WaveformEditorProps) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [trimStart, setTrimStart] = useState(0) // 0-1 percentage
  const [trimEnd, setTrimEnd] = useState(1)     // 0-1 percentage
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadPos, setPlayheadPos] = useState(0) // 0-1 percentage

  const svgContainerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<'start' | 'end' | null>(null)
  const playerRef = useRef<Tone.Player | null>(null)
  const animFrameRef = useRef<number>(0)
  const playStartTimeRef = useRef(0)
  const playOffsetRef = useRef(0)

  // Decode audio and generate waveform
  useEffect(() => {
    let cancelled = false

    async function decode() {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer()
        const ctx = Tone.getContext().rawContext
        const decoded = await ctx.decodeAudioData(arrayBuffer)
        if (cancelled) return

        setAudioBuffer(decoded)

        // Downsample to BAR_COUNT bars
        const channelData = decoded.getChannelData(0)
        const chunkSize = Math.floor(channelData.length / BAR_COUNT)
        const bars: number[] = []

        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0
          const start = i * chunkSize
          const end = Math.min(start + chunkSize, channelData.length)
          for (let j = start; j < end; j++) {
            sum += Math.abs(channelData[j])
          }
          bars.push(sum / (end - start))
        }

        // Normalize
        const max = Math.max(...bars, 0.001)
        const normalized = bars.map((v) => v / max)
        if (!cancelled) {
          setWaveformData(normalized)
        }
      } catch {
        // Decoding failed silently
      }
    }

    void decode()
    return () => {
      cancelled = true
    }
  }, [audioBlob])

  // Reset trim handles when audio changes
  useEffect(() => {
    setTrimStart(0)
    setTrimEnd(1)
    setPlayheadPos(0)
  }, [audioUrl])

  const duration = audioBuffer?.duration ?? 0
  const trimStartTime = trimStart * duration
  const trimEndTime = trimEnd * duration

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.stop()
        playerRef.current.dispose()
      }
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const stopPlayback = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop()
      playerRef.current.dispose()
      playerRef.current = null
    }
    cancelAnimationFrame(animFrameRef.current)
    setIsPlaying(false)
  }, [])

  const handlePreview = useCallback(() => {
    if (isPlaying) {
      stopPlayback()
      return
    }

    if (!audioBuffer) return

    stopPlayback()

    const player = new Tone.Player(audioBuffer).toDestination()
    playerRef.current = player

    const regionDuration = trimEndTime - trimStartTime
    player.start(Tone.now(), trimStartTime, regionDuration)

    playStartTimeRef.current = Tone.now()
    playOffsetRef.current = trimStart
    setIsPlaying(true)

    const tick = () => {
      const elapsed = Tone.now() - playStartTimeRef.current
      const progress = elapsed / duration
      const pos = playOffsetRef.current + progress

      if (pos >= trimEnd) {
        stopPlayback()
        setPlayheadPos(trimStart)
        return
      }

      setPlayheadPos(pos)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [isPlaying, audioBuffer, trimStartTime, trimEndTime, trimStart, trimEnd, duration, stopPlayback])

  const handleApplyTrim = useCallback(async () => {
    if (!audioBuffer || !onTrimmed) return

    const startSample = Math.floor(trimStart * audioBuffer.length)
    const endSample = Math.floor(trimEnd * audioBuffer.length)
    const trimmedLength = endSample - startSample

    if (trimmedLength <= 0) return

    const sampleRate = audioBuffer.sampleRate
    const numChannels = audioBuffer.numberOfChannels
    const offlineCtx = new OfflineAudioContext(numChannels, trimmedLength, sampleRate)
    const newBuffer = offlineCtx.createBuffer(numChannels, trimmedLength, sampleRate)

    for (let ch = 0; ch < numChannels; ch++) {
      const srcData = audioBuffer.getChannelData(ch)
      const destData = newBuffer.getChannelData(ch)
      for (let i = 0; i < trimmedLength; i++) {
        destData[i] = srcData[startSample + i]
      }
    }

    // Encode as WAV from mono channel
    const monoData = newBuffer.getChannelData(0)
    const wavBlob = encodeWav(monoData, sampleRate)
    const url = URL.createObjectURL(wavBlob)

    onTrimmed(wavBlob, url)
  }, [audioBuffer, trimStart, trimEnd, onTrimmed])

  // Drag handlers
  const handlePointerDown = useCallback((handle: 'start' | 'end') => {
    draggingRef.current = handle
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current || !svgContainerRef.current) return

      const rect = svgContainerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const clamped = Math.max(0, Math.min(1, x))

      if (draggingRef.current === 'start') {
        setTrimStart(Math.min(clamped, trimEnd - 0.01))
      } else {
        setTrimEnd(Math.max(clamped, trimStart + 0.01))
      }
    },
    [trimStart, trimEnd]
  )

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null
  }, [])

  // Memoize SVG bars
  const barWidth = useMemo(() => {
    // Total bar area is the SVG width; each bar + gap
    const totalWidth = 800 // viewBox width
    return (totalWidth / BAR_COUNT) * 0.8
  }, [])

  const barGap = useMemo(() => {
    const totalWidth = 800
    return (totalWidth / BAR_COUNT) * 0.2
  }, [])

  if (waveformData.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-xs text-slate-400">
        Loading waveform...
      </div>
    )
  }

  const svgWidth = 800

  return (
    <div className="space-y-3">
      {/* Header with duration */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">Waveform</span>
        <span className="text-xs font-mono text-slate-400">{formatTime(duration)}</span>
      </div>

      {/* Waveform SVG with trim handles */}
      <div
        ref={svgContainerRef}
        className="relative select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
          className="w-full h-24 rounded-lg bg-slate-50 border border-slate-200"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Dimmed left region */}
          <rect
            x={0}
            y={0}
            width={trimStart * svgWidth}
            height={SVG_HEIGHT}
            fill="white"
            fillOpacity={0.7}
          />

          {/* Dimmed right region */}
          <rect
            x={trimEnd * svgWidth}
            y={0}
            width={(1 - trimEnd) * svgWidth}
            height={SVG_HEIGHT}
            fill="white"
            fillOpacity={0.7}
          />

          {/* Waveform bars */}
          {waveformData.map((amp, i) => {
            const x = i * (barWidth + barGap) + barGap / 2
            const barH = Math.max(2, amp * HALF_HEIGHT * 0.9)
            const y = HALF_HEIGHT - barH

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={barH * 2}
                rx={barWidth / 2}
                fill="url(#waveGrad)"
              />
            )
          })}

          {/* Playhead */}
          {isPlaying && (
            <line
              x1={playheadPos * svgWidth}
              y1={0}
              x2={playheadPos * svgWidth}
              y2={SVG_HEIGHT}
              stroke="#f43f5e"
              strokeWidth={2}
            />
          )}

          {/* Trim start handle line */}
          <line
            x1={trimStart * svgWidth}
            y1={0}
            x2={trimStart * svgWidth}
            y2={SVG_HEIGHT}
            stroke="#6366f1"
            strokeWidth={2}
          />

          {/* Trim end handle line */}
          <line
            x1={trimEnd * svgWidth}
            y1={0}
            x2={trimEnd * svgWidth}
            y2={SVG_HEIGHT}
            stroke="#6366f1"
            strokeWidth={2}
          />
        </svg>

        {/* Draggable trim start handle */}
        <div
          className="absolute top-0 w-4 h-full cursor-ew-resize flex items-center justify-center"
          style={{ left: `calc(${trimStart * 100}% - 8px)` }}
          onPointerDown={(e) => {
            e.preventDefault()
            handlePointerDown('start')
          }}
        >
          <div className="w-3 h-8 rounded-full bg-indigo-500 shadow-md border-2 border-white" />
        </div>

        {/* Draggable trim end handle */}
        <div
          className="absolute top-0 w-4 h-full cursor-ew-resize flex items-center justify-center"
          style={{ left: `calc(${trimEnd * 100}% - 8px)` }}
          onPointerDown={(e) => {
            e.preventDefault()
            handlePointerDown('end')
          }}
        >
          <div className="w-3 h-8 rounded-full bg-indigo-500 shadow-md border-2 border-white" />
        </div>
      </div>

      {/* Time markers */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Start: {formatTime(trimStartTime)}</span>
        <span>End: {formatTime(trimEndTime)}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handlePreview}
          disabled={!audioBuffer}
          className="flex-1 py-2 px-3 rounded-lg text-xs font-medium
            bg-white border border-slate-200 text-slate-600
            hover:bg-slate-50 active:scale-[0.98] transition-all duration-150
            flex items-center justify-center gap-1.5
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Preview Trimmed
            </>
          )}
        </button>

        <button
          onClick={() => void handleApplyTrim()}
          disabled={!audioBuffer || (trimStart === 0 && trimEnd === 1)}
          className="flex-1 py-2 px-3 rounded-lg text-xs font-medium
            bg-gradient-to-r from-indigo-500 to-purple-500 text-white
            hover:from-indigo-600 hover:to-purple-600
            active:scale-[0.98] transition-all duration-150
            flex items-center justify-center gap-1.5
            disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Scissors className="w-3.5 h-3.5" />
          Apply Trim
        </button>
      </div>
    </div>
  )
}
