import { Knob } from '@/components/shared/Knob'
import { Slider } from '@/components/shared/Slider'
import type { MixerChannel } from '@/types'
import { PAD_COLOR_HEX } from '@/utils/constants'

interface ChannelStripProps {
  channel: MixerChannel
  padColor?: string
  onVolumeChange: (volume: number) => void
  onPanChange: (pan: number) => void
  onToggleMute: () => void
  onToggleSolo: () => void
  onToggleEffect: (effect: 'reverb' | 'delay' | 'filter') => void
  onEffectParamChange: (effect: string, param: string, value: number | string) => void
}

function dbDisplay(volume: number): string {
  if (volume <= 0) return '-inf'
  const db = -60 + (volume / 100) * 60
  return `${db >= 0 ? '+' : ''}${db.toFixed(0)} dB`
}

export function ChannelStrip({
  channel,
  padColor,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onToggleEffect,
  onEffectParamChange,
}: ChannelStripProps) {
  const colorHex = padColor ? PAD_COLOR_HEX[padColor] ?? '#94a3b8' : '#94a3b8'

  return (
    <div className="flex flex-col items-center gap-2 w-20 shrink-0 rounded-xl bg-white border border-slate-200 shadow-sm p-2 pt-3">
      {/* Label + color dot */}
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: colorHex }}
        />
        <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[50px]">
          {channel.label}
        </span>
      </div>

      {/* Volume fader */}
      <div className="h-28 flex items-center justify-center">
        <Slider
          value={channel.volume}
          min={0}
          max={100}
          step={1}
          onChange={onVolumeChange}
          orientation="vertical"
        />
      </div>

      {/* dB display */}
      <span className="text-[9px] font-mono text-slate-400 tabular-nums">
        {dbDisplay(channel.volume)}
      </span>

      {/* Pan knob */}
      <Knob
        value={channel.pan}
        min={-100}
        max={100}
        onChange={(v) => onPanChange(Math.round(v))}
        size={30}
        label="Pan"
        displayValue={
          channel.pan === 0
            ? 'C'
            : channel.pan < 0
              ? `L${Math.abs(channel.pan)}`
              : `R${channel.pan}`
        }
      />

      {/* Mute / Solo */}
      <div className="flex gap-1 mt-1">
        <button
          onClick={onToggleMute}
          className={`w-7 h-6 rounded text-[10px] font-bold transition-colors ${
            channel.muted
              ? 'bg-amber-400 text-white shadow-sm'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          M
        </button>
        <button
          onClick={onToggleSolo}
          className={`w-7 h-6 rounded text-[10px] font-bold transition-colors ${
            channel.soloed
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          S
        </button>
      </div>

      {/* Effect toggles */}
      <div className="flex gap-1 mt-1">
        <button
          onClick={() => onToggleEffect('reverb')}
          className={`w-6 h-5 rounded text-[8px] font-bold transition-colors ${
            channel.effects.reverb.enabled
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
          title="Reverb"
        >
          R
        </button>
        <button
          onClick={() => onToggleEffect('delay')}
          className={`w-6 h-5 rounded text-[8px] font-bold transition-colors ${
            channel.effects.delay.enabled
              ? 'bg-violet-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
          title="Delay"
        >
          D
        </button>
        <button
          onClick={() => onToggleEffect('filter')}
          className={`w-6 h-5 rounded text-[8px] font-bold transition-colors ${
            channel.effects.filter.enabled
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
          title="Filter"
        >
          F
        </button>
      </div>

      {/* Effect parameters — shown when enabled */}
      {channel.effects.reverb.enabled && (
        <div className="w-full flex flex-col items-center gap-0.5 pt-1 border-t border-slate-100">
          <span className="text-[8px] font-semibold text-indigo-500">REVERB</span>
          <Knob
            value={channel.effects.reverb.decay}
            min={0.1}
            max={10}
            onChange={(v) => onEffectParamChange('reverb', 'decay', Number(v.toFixed(1)))}
            size={24}
            label="Decay"
            displayValue={`${channel.effects.reverb.decay.toFixed(1)}s`}
          />
          <Knob
            value={channel.effects.reverb.wet}
            min={0}
            max={1}
            onChange={(v) => onEffectParamChange('reverb', 'wet', Number(v.toFixed(2)))}
            size={24}
            label="Wet"
            displayValue={`${Math.round(channel.effects.reverb.wet * 100)}%`}
          />
        </div>
      )}

      {channel.effects.delay.enabled && (
        <div className="w-full flex flex-col items-center gap-0.5 pt-1 border-t border-slate-100">
          <span className="text-[8px] font-semibold text-violet-500">DELAY</span>
          <Knob
            value={channel.effects.delay.feedback}
            min={0}
            max={0.9}
            onChange={(v) => onEffectParamChange('delay', 'feedback', Number(v.toFixed(2)))}
            size={24}
            label="Fdbk"
            displayValue={`${Math.round(channel.effects.delay.feedback * 100)}%`}
          />
          <Knob
            value={channel.effects.delay.wet}
            min={0}
            max={1}
            onChange={(v) => onEffectParamChange('delay', 'wet', Number(v.toFixed(2)))}
            size={24}
            label="Wet"
            displayValue={`${Math.round(channel.effects.delay.wet * 100)}%`}
          />
        </div>
      )}

      {channel.effects.filter.enabled && (
        <div className="w-full flex flex-col items-center gap-0.5 pt-1 border-t border-slate-100">
          <span className="text-[8px] font-semibold text-sky-500">FILTER</span>
          <Knob
            value={channel.effects.filter.frequency}
            min={20}
            max={20000}
            onChange={(v) => onEffectParamChange('filter', 'frequency', Math.round(v))}
            size={24}
            label="Freq"
            displayValue={
              channel.effects.filter.frequency >= 1000
                ? `${(channel.effects.filter.frequency / 1000).toFixed(1)}k`
                : `${channel.effects.filter.frequency}`
            }
          />
          <div className="flex gap-0.5 mt-0.5">
            {(['lowpass', 'highpass', 'bandpass'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onEffectParamChange('filter', 'type', t)}
                className={`px-1 py-0.5 rounded text-[7px] font-bold transition-colors ${
                  channel.effects.filter.type === t
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {t === 'lowpass' ? 'LP' : t === 'highpass' ? 'HP' : 'BP'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
