import * as Tone from 'tone'
import { audioEngine } from '@/engine/AudioEngine'

interface DrumVoice {
  synth: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth | Tone.MonoSynth | Tone.Player
  channel: Tone.Channel
  triggerNote?: string
}

class DrumEngine {
  private voices: Map<string, DrumVoice> = new Map()
  private initialized = false

  get isInitialized() {
    return this.initialized
  }

  init() {
    if (this.initialized) return
    if (!audioEngine.isInitialized) {
      throw new Error('AudioEngine must be initialized before DrumEngine')
    }

    const master = audioEngine.getMasterChannel()

    // --- Kick ---
    this.createVoice('kick', () => {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
      })
      return { synth, triggerNote: 'C1' }
    }, master)

    // --- Deep Kick ---
    this.createVoice('kick-deep', () => {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 8,
        envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.1 },
      })
      return { synth, triggerNote: 'A0' }
    }, master)

    // --- Snare (noise + membrane layered) ---
    this.createLayeredSnare(master)

    // --- Snare Rim ---
    this.createVoice('snare-rim', () => {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
      })
      return { synth, triggerNote: 'G5' }
    }, master)

    // --- Clap ---
    this.createVoice('clap', () => {
      const synth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
      })
      const filter = new Tone.Filter(2000, 'bandpass')
      synth.connect(filter)
      return { synth, filterNode: filter }
    }, master)

    // --- Hi-Hat Closed ---
    this.createVoice('hihat-closed', () => {
      const synth = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
        envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
      })
      synth.frequency.value = 200
      return { synth }
    }, master)

    // --- Hi-Hat Open ---
    this.createVoice('hihat-open', () => {
      const synth = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
        envelope: { attack: 0.001, decay: 0.3, release: 0.05 },
      })
      synth.frequency.value = 200
      return { synth }
    }, master)

    // --- Tom Low ---
    this.createVoice('tom-low', () => {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 },
      })
      return { synth, triggerNote: 'B1' }
    }, master)

    // --- Tom Mid ---
    this.createVoice('tom-mid', () => {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      })
      return { synth, triggerNote: 'G2' }
    }, master)

    // --- Tom High ---
    this.createVoice('tom-high', () => {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      })
      return { synth, triggerNote: 'D3' }
    }, master)

    // --- Crash ---
    this.createVoice('crash', () => {
      const synth = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 40,
        resonance: 8000,
        octaves: 1.5,
        envelope: { attack: 0.001, decay: 1.5, release: 0.3 },
      })
      synth.frequency.value = 300
      return { synth }
    }, master)

    // --- Ride ---
    this.createVoice('ride', () => {
      const synth = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 20,
        resonance: 6000,
        octaves: 1.5,
        envelope: { attack: 0.001, decay: 0.6, release: 0.1 },
      })
      synth.frequency.value = 300
      return { synth }
    }, master)

    // --- Cowbell ---
    this.createVoice('cowbell', () => {
      const synth = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 16,
        resonance: 4000,
        octaves: 0.5,
        envelope: { attack: 0.001, decay: 0.08, release: 0.03 },
      })
      synth.frequency.value = 800
      return { synth }
    }, master)

    // --- 808 Bass ---
    this.createVoice('808-bass', () => {
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        filter: { Q: 1, type: 'lowpass', rolloff: -24 },
        envelope: { attack: 0.001, decay: 0.8, sustain: 0.3, release: 0.4 },
        filterEnvelope: {
          attack: 0.001,
          decay: 0.1,
          sustain: 0.5,
          release: 0.2,
          baseFrequency: 50,
          octaves: 2.6,
        },
      })
      return { synth, triggerNote: 'C1' }
    }, master)

    // --- Snap ---
    this.createVoice('snap', () => {
      const synth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
      })
      const filter = new Tone.Filter(5000, 'highpass')
      synth.connect(filter)
      return { synth, filterNode: filter }
    }, master)

    // --- Shaker ---
    this.createVoice('shaker', () => {
      const synth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 },
      })
      const filter = new Tone.Filter(8000, 'bandpass')
      synth.connect(filter)
      return { synth, filterNode: filter }
    }, master)

    this.initialized = true
  }

  private createVoice(
    id: string,
    factory: () => {
      synth: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth | Tone.MonoSynth
      triggerNote?: string
      filterNode?: Tone.Filter
    },
    master: Tone.Channel
  ) {
    const channel = new Tone.Channel(0, 0).connect(master)
    const { synth, triggerNote, filterNode } = factory()

    if (filterNode) {
      // synth -> filter -> channel (synth.connect(filter) already done in factory)
      filterNode.connect(channel)
    } else {
      synth.connect(channel)
    }

    this.voices.set(id, { synth, channel, triggerNote })
  }

  private createLayeredSnare(master: Tone.Channel) {
    const channel = new Tone.Channel(0, 0).connect(master)

    const noiseSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
    }).connect(channel)

    const membraneSynth = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
    }).connect(channel)

    // Store as a special compound voice — we'll handle triggering both in trigger()
    this.voices.set('snare', {
      synth: noiseSynth,
      channel,
      triggerNote: 'G4',
    })
    // Store the membrane part separately for reference
    this.voices.set('snare__membrane', {
      synth: membraneSynth,
      channel,
      triggerNote: 'G4',
    })
  }

  trigger(soundId: string, volume?: number) {
    if (!this.initialized) return

    const voice = this.voices.get(soundId)
    if (!voice) return

    if (volume !== undefined) {
      voice.channel.volume.value = volume
    }

    const now = Tone.now()

    // Special handling for layered snare
    if (soundId === 'snare') {
      const membraneVoice = this.voices.get('snare__membrane')
      if (membraneVoice) {
        ;(membraneVoice.synth as Tone.MembraneSynth).triggerAttackRelease('G4', '16n', now)
      }
      ;(voice.synth as Tone.NoiseSynth).triggerAttackRelease('16n', now)
      return
    }

    if (voice.synth instanceof Tone.Player) {
      if (voice.synth.state === 'started') {
        voice.synth.stop()
      }
      voice.synth.start(now)
    } else if (voice.synth instanceof Tone.NoiseSynth) {
      voice.synth.triggerAttackRelease('16n', now)
    } else if (voice.synth instanceof Tone.MetalSynth) {
      voice.synth.triggerAttackRelease('16n', now)
    } else if (voice.synth instanceof Tone.MembraneSynth || voice.synth instanceof Tone.MonoSynth) {
      const note = voice.triggerNote ?? 'C2'
      voice.synth.triggerAttackRelease(note, '8n', now)
    }
  }

  setVolume(soundId: string, db: number) {
    const voice = this.voices.get(soundId)
    if (voice) {
      voice.channel.volume.value = db
    }
  }

  async loadCustomSound(soundId: string, audioBuffer: AudioBuffer) {
    const master = audioEngine.getMasterChannel()
    const channel = new Tone.Channel(0, 0).connect(master)

    const toneBuffer = new Tone.ToneAudioBuffer()
    // Copy the raw AudioBuffer data into a ToneAudioBuffer
    toneBuffer.fromArray(audioBuffer.getChannelData(0))

    const player = new Tone.Player(toneBuffer).connect(channel)

    // Dispose old voice if it exists
    const old = this.voices.get(soundId)
    if (old) {
      old.synth.dispose()
      old.channel.dispose()
    }

    this.voices.set(soundId, { synth: player, channel })
  }

  dispose() {
    this.voices.forEach((voice) => {
      voice.synth.dispose()
      voice.channel.dispose()
    })
    // Also dispose the snare membrane layer
    const snareMembrane = this.voices.get('snare__membrane')
    if (snareMembrane) {
      snareMembrane.synth.dispose()
      // channel shared with snare noise, already disposed above
    }
    this.voices.clear()
    this.initialized = false
  }
}

export const drumEngine = new DrumEngine()
