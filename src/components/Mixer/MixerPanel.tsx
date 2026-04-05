import { useEffect } from 'react'
import { useMixerStore } from '@/stores/useMixerStore'
import { usePadStore } from '@/stores/usePadStore'
import { ChannelStrip } from '@/components/Mixer/ChannelStrip'
import { Slider } from '@/components/shared/Slider'

function dbDisplay(volume: number): string {
  if (volume <= 0) return '-inf'
  const db = -60 + (volume / 100) * 60
  return `${db >= 0 ? '+' : ''}${db.toFixed(0)} dB`
}

export function MixerPanel() {
  const pads = usePadStore((s) => s.pads)
  const {
    channels,
    masterVolume,
    initChannels,
    setChannelVolume,
    setChannelPan,
    toggleMute,
    toggleSolo,
    toggleEffect,
    setEffectParam,
    setMasterVolume,
  } = useMixerStore()

  // Auto-init channels from pad store on mount
  useEffect(() => {
    const padInput = pads.map((p) => ({
      id: p.soundId,
      soundId: p.soundId,
      label: p.label,
    }))
    initChannels(padInput)
  }, [pads, initChannels])

  // Build a lookup from soundId to pad color
  const colorMap = new Map<string, string>()
  for (const pad of pads) {
    if (!colorMap.has(pad.soundId)) {
      colorMap.set(pad.soundId, pad.color)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Master section */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider w-14">
            Master
          </span>
          <div className="flex-1 max-w-md">
            <Slider
              value={masterVolume}
              min={0}
              max={100}
              step={1}
              onChange={setMasterVolume}
              orientation="horizontal"
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 tabular-nums w-14 text-right">
            {dbDisplay(masterVolume)}
          </span>
        </div>
      </div>

      {/* Channel strips */}
      <div className="rounded-2xl bg-surface-sunken border border-slate-200 shadow-sm p-4">
        {channels.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-slate-400 text-sm font-medium">
              No channels — play a pad to initialize the mixer
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {channels.map((channel) => (
              <ChannelStrip
                key={channel.id}
                channel={channel}
                padColor={colorMap.get(channel.id)}
                onVolumeChange={(v) => setChannelVolume(channel.id, v)}
                onPanChange={(v) => setChannelPan(channel.id, v)}
                onToggleMute={() => toggleMute(channel.id)}
                onToggleSolo={() => toggleSolo(channel.id)}
                onToggleEffect={(fx) => toggleEffect(channel.id, fx)}
                onEffectParamChange={(fx, param, val) =>
                  setEffectParam(channel.id, fx, param, val)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
