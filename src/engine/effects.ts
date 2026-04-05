import * as Tone from 'tone'

export const REVERB_DEFAULTS = { decay: 1.5, wet: 0.3 }
export const DELAY_DEFAULTS = { time: '8n' as string, feedback: 0.3, wet: 0.2 }
export const FILTER_DEFAULTS = { frequency: 2000, type: 'lowpass' as BiquadFilterType }

export function createReverb(decay: number = REVERB_DEFAULTS.decay, wet: number = REVERB_DEFAULTS.wet): Tone.Reverb {
  const reverb = new Tone.Reverb({ decay, wet })
  return reverb
}

export function createDelay(
  time: string = DELAY_DEFAULTS.time,
  feedback: number = DELAY_DEFAULTS.feedback,
  wet: number = DELAY_DEFAULTS.wet,
): Tone.FeedbackDelay {
  const delay = new Tone.FeedbackDelay({ delayTime: time, feedback, wet })
  return delay
}

export function createFilter(
  frequency: number = FILTER_DEFAULTS.frequency,
  type: BiquadFilterType = FILTER_DEFAULTS.type,
): Tone.Filter {
  const filter = new Tone.Filter({ frequency, type })
  return filter
}
