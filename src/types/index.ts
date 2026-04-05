export type GridSize = 4 | 6 | 8

export type PadMode = 'one-shot' | 'hold' | 'toggle'

export interface PadConfig {
  id: string
  soundId: string
  label: string
  color: string
  volume: number
  mode: PadMode
  customAudioId?: string
}

export interface PadBank {
  id: string
  name: string
  pads: PadConfig[]
}

export type InstrumentType =
  | 'piano'
  | 'electric-piano'
  | 'synth-pad'
  | 'organ'
  | 'strings'
  | 'bass'
  | 'pluck'

export interface StoredSound {
  id: string
  name: string
  prompt: string
  category: string
  audioBlob: Blob
  duration: number
  isLoop: boolean
  createdAt: number
}

export interface SequencerPattern {
  id: string
  name: string
  bpm: number
  stepCount: 16 | 32
  tracks: SequencerTrack[]
}

export interface SequencerTrack {
  soundId: string
  label: string
  steps: boolean[]
  volume: number
  muted: boolean
}

export interface MixerChannel {
  id: string
  label: string
  volume: number
  pan: number
  muted: boolean
  soloed: boolean
  effects: ChannelEffects
}

export interface ChannelEffects {
  reverb: { enabled: boolean; decay: number; wet: number }
  delay: { enabled: boolean; time: string; feedback: number; wet: number }
  filter: { enabled: boolean; frequency: number; type: BiquadFilterType }
}

export interface PresetBeat {
  id: string
  name: string
  genre: string
  bpm: number
  pads: PadConfig[]
  pattern: boolean[][]
}

export type AppSection = 'pads' | 'keys' | 'forge' | 'sequencer' | 'mixer' | 'loops' | 'voice'

// Loop Recording
export interface LoopTrack {
  id: string
  name: string
  audioUrl: string
  duration: number
  measures: number
  bpm: number
  muted: boolean
  volume: number
  createdAt: number
}

export interface LoopSession {
  id: string
  name: string
  bpm: number
  measures: number
  tracks: LoopTrack[]
  createdAt: number
}

// Voice Recording
export interface VoiceRecording {
  id: string
  name: string
  audioBlob: Blob
  audioUrl: string
  duration: number
  pitchShift: number
  isTransformed: boolean
  transformedBlob?: Blob
  transformedUrl?: string
  createdAt: number
}

// Custom Drum Kit
export interface CustomDrumKit {
  id: string
  name: string
  sounds: KitSound[]
  createdAt: number
}

export interface KitSound {
  padIndex: number
  soundId: string
  label: string
  color: string
  sourceType: 'builtin' | 'ai-generated' | 'recorded'
  storedSoundId?: string
}
