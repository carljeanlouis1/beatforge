import * as Tone from 'tone'
import { audioEngine } from '@/engine/AudioEngine'
import type { InstrumentType } from '@/types'

type ToneInstrument =
  | Tone.PolySynth<Tone.Synth>
  | Tone.PolySynth<Tone.FMSynth>
  | Tone.MonoSynth
  | Tone.PluckSynth

interface InstrumentEntry {
  instrument: ToneInstrument
  channel: Tone.Channel
  effects: Tone.ToneAudioNode[]
}

class PianoEngine {
  private instruments: Map<InstrumentType, InstrumentEntry> = new Map()
  private currentInstrument: InstrumentType = 'piano'
  private octave = 4
  private initialized = false

  private ensureInitialized(): void {
    if (this.initialized) return

    if (!audioEngine.isInitialized) {
      throw new Error('AudioEngine must be initialized before PianoEngine')
    }

    const masterChannel = audioEngine.getMasterChannel()
    this.createInstruments(masterChannel)
    this.initialized = true
  }

  private createInstruments(masterChannel: Tone.Channel): void {
    // Piano: triangle oscillator with subtle chorus
    {
      const channel = new Tone.Channel(-6, 0).connect(masterChannel)
      const chorus = new Tone.Chorus(1.5, 3.5, 0.25).connect(channel)
      chorus.wet.value = 0.15
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 1.2, sustain: 0.3, release: 1.5 },
      })
      synth.maxPolyphony = 16
      synth.connect(chorus)
      this.instruments.set('piano', { instrument: synth, channel, effects: [chorus] })
    }

    // Electric Piano: FM bell-like sound
    {
      const channel = new Tone.Channel(-6, 0).connect(masterChannel)
      const synth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3.01,
        modulationIndex: 14,
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.8 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 },
      })
      synth.maxPolyphony = 16
      synth.connect(channel)
      this.instruments.set('electric-piano', { instrument: synth, channel, effects: [] })
    }

    // Synth Pad: sawtooth with slow attack, chorus + reverb
    {
      const channel = new Tone.Channel(-8, 0).connect(masterChannel)
      const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).connect(channel)
      const chorus = new Tone.Chorus(0.5, 5, 0.5).connect(reverb)
      chorus.wet.value = 0.5
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.3, decay: 1.0, sustain: 0.8, release: 3.0 },
      })
      synth.maxPolyphony = 8
      synth.connect(chorus)
      this.instruments.set('synth-pad', { instrument: synth, channel, effects: [reverb, chorus] })
    }

    // Organ: square wave, classic organ behavior
    {
      const channel = new Tone.Channel(-8, 0).connect(masterChannel)
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0, sustain: 1, release: 0.01 },
      })
      synth.maxPolyphony = 16
      synth.connect(channel)
      this.instruments.set('organ', { instrument: synth, channel, effects: [] })
    }

    // Strings: sawtooth with reverb
    {
      const channel = new Tone.Channel(-6, 0).connect(masterChannel)
      const reverb = new Tone.Reverb({ decay: 3, wet: 0.35 }).connect(channel)
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.2, decay: 0.8, sustain: 0.7, release: 2.0 },
      })
      synth.maxPolyphony = 12
      synth.connect(reverb)
      this.instruments.set('strings', { instrument: synth, channel, effects: [reverb] })
    }

    // Bass: MonoSynth with sine oscillator, plays one octave lower
    {
      const channel = new Tone.Channel(-4, 0).connect(masterChannel)
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.5,
          release: 0.2,
          baseFrequency: 200,
          octaves: 2,
        },
      }).connect(channel)
      this.instruments.set('bass', { instrument: synth, channel, effects: [] })
    }

    // Pluck: PluckSynth
    {
      const channel = new Tone.Channel(-4, 0).connect(masterChannel)
      const synth = new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 4000,
        resonance: 0.9,
      }).connect(channel)
      this.instruments.set('pluck', { instrument: synth, channel, effects: [] })
    }

    // Mute all channels except the current instrument
    for (const [type, entry] of this.instruments) {
      entry.channel.mute = type !== this.currentInstrument
    }
  }

  noteOn(note: string, velocity = 0.8): void {
    this.ensureInitialized()

    const entry = this.instruments.get(this.currentInstrument)
    if (!entry) return

    const playNote =
      this.currentInstrument === 'bass' ? this.transposeDown(note) : note

    const { instrument } = entry

    if (instrument instanceof Tone.MonoSynth) {
      instrument.triggerAttack(playNote, Tone.now(), velocity)
    } else if (instrument instanceof Tone.PluckSynth) {
      instrument.triggerAttack(playNote, Tone.now())
    } else {
      instrument.triggerAttack([playNote], Tone.now(), velocity)
    }
  }

  noteOff(note: string): void {
    if (!this.initialized) return

    const entry = this.instruments.get(this.currentInstrument)
    if (!entry) return

    const playNote =
      this.currentInstrument === 'bass' ? this.transposeDown(note) : note

    const { instrument } = entry

    if (instrument instanceof Tone.PluckSynth) {
      // PluckSynth has no triggerRelease
      return
    }

    if (instrument instanceof Tone.MonoSynth) {
      instrument.triggerRelease(Tone.now())
    } else {
      instrument.triggerRelease([playNote], Tone.now())
    }
  }

  setInstrument(type: InstrumentType): void {
    if (type === this.currentInstrument) return

    // Release all notes on current instrument before switching
    if (this.initialized) {
      const current = this.instruments.get(this.currentInstrument)
      if (current) {
        const { instrument } = current
        if (
          !(instrument instanceof Tone.PluckSynth) &&
          !(instrument instanceof Tone.MonoSynth)
        ) {
          instrument.releaseAll(Tone.now())
        } else if (instrument instanceof Tone.MonoSynth) {
          instrument.triggerRelease(Tone.now())
        }
      }
    }

    const prev = this.currentInstrument
    this.currentInstrument = type

    if (this.initialized) {
      const prevEntry = this.instruments.get(prev)
      const nextEntry = this.instruments.get(type)
      if (prevEntry) prevEntry.channel.mute = true
      if (nextEntry) nextEntry.channel.mute = false
    }
  }

  getInstrument(): InstrumentType {
    return this.currentInstrument
  }

  setOctave(octave: number): void {
    this.octave = Math.max(2, Math.min(6, octave))
  }

  getOctave(): number {
    return this.octave
  }

  private transposeDown(note: string): string {
    const match = note.match(/^([A-G]#?)(\d+)$/)
    if (!match) return note
    const [, name, octStr] = match
    const oct = parseInt(octStr, 10) - 1
    return `${name}${Math.max(0, oct)}`
  }

  dispose(): void {
    for (const [, entry] of this.instruments) {
      entry.instrument.dispose()
      for (const fx of entry.effects) fx.dispose()
      entry.channel.dispose()
    }
    this.instruments.clear()
    this.initialized = false
  }
}

export const pianoEngine = new PianoEngine()
