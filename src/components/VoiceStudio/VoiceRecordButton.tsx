import { useState, useEffect, useCallback } from 'react'
import { Mic } from 'lucide-react'
import { useVoiceStore } from '@/stores/useVoiceStore'

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`
}

export function VoiceRecordButton() {
  const isRecording = useVoiceStore((s) => s.isRecording)
  const micPermission = useVoiceStore((s) => s.micPermission)
  const startRecording = useVoiceStore((s) => s.startRecording)
  const stopRecording = useVoiceStore((s) => s.stopRecording)

  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isRecording) {
      setElapsed(0)
      return
    }

    const start = performance.now()
    const interval = setInterval(() => {
      setElapsed((performance.now() - start) / 1000)
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording])

  const handlePointerDown = useCallback(() => {
    if (isRecording) {
      void stopRecording()
    } else {
      void startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Record button */}
      <button
        onPointerDown={handlePointerDown}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-200 active:scale-95 no-select
          ${isRecording
            ? 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2),0_0_24px_rgba(239,68,68,0.4)]'
            : 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg hover:shadow-xl hover:scale-105'
          }`}
      >
        {/* Pulse ring when recording */}
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"
            style={{ animationDuration: '1.5s' }}
          />
        )}
        <Mic className={`w-8 h-8 text-white ${isRecording ? 'animate-pulse' : ''}`} />
      </button>

      {/* Label */}
      <div className="text-center">
        {isRecording ? (
          <>
            <p className="text-sm font-semibold text-red-600">Recording...</p>
            <p className="text-xs text-slate-500 tabular-nums font-mono mt-0.5">
              {formatDuration(elapsed)}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Tap to start recording</p>
        )}
      </div>

      {/* Permission denied message */}
      {micPermission === 'denied' && (
        <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 max-w-xs text-center">
          <p className="text-xs text-amber-700">
            Microphone access was denied. Please allow microphone access in your
            browser settings and try again.
          </p>
        </div>
      )}
    </div>
  )
}
