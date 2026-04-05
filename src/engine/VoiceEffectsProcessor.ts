import * as Tone from 'tone'

export interface VoiceEffectsState {
  pitch: number
  reverbEnabled: boolean
  reverbWet: number
  delayEnabled: boolean
  delayWet: number
  filterEnabled: boolean
  filterFrequency: number
  filterType: BiquadFilterType
}

class VoiceEffectsProcessor {
  private player: Tone.Player | null = null
  private pitchShift: Tone.PitchShift
  private reverb: Tone.Reverb
  private delay: Tone.FeedbackDelay
  private filter: Tone.Filter
  private recorder: Tone.Recorder
  private output: Tone.Channel
  private _isPlaying = false
  private _isLoaded = false

  constructor() {
    this.pitchShift = new Tone.PitchShift({ pitch: 0 })
    this.reverb = new Tone.Reverb({ decay: 2, wet: 0 })
    this.delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0 })
    this.filter = new Tone.Filter({ frequency: 2000, type: 'lowpass' })
    this.filter.set({ wet: 0 } as Partial<Tone.FilterOptions>)
    this.recorder = new Tone.Recorder()
    // Connect to Tone.getDestination() directly, NOT master channel
    this.output = new Tone.Channel({ volume: 0 }).connect(Tone.getDestination())

    // Chain: pitchShift -> reverb -> delay -> filter -> output
    this.pitchShift.connect(this.reverb)
    this.reverb.connect(this.delay)
    this.delay.connect(this.filter)
    this.filter.connect(this.output)
  }

  get isPlaying(): boolean {
    return this._isPlaying
  }

  get isLoaded(): boolean {
    return this._isLoaded
  }

  async loadRecording(audioUrl: string): Promise<void> {
    await Tone.start()

    if (this.player) {
      this.player.stop()
      this.player.disconnect()
      this.player.dispose()
      this.player = null
    }

    this.player = new Tone.Player({
      url: audioUrl,
      onload: () => {
        this._isLoaded = true
      },
    })
    this.player.connect(this.pitchShift)

    // Wait for player to load
    await Tone.loaded()
    this._isLoaded = true
  }

  play(): void {
    if (!this.player || !this._isLoaded) return
    if (this._isPlaying) {
      this.stop()
    }
    this.player.start()
    this._isPlaying = true

    // Auto-stop when playback ends
    const duration = this.player.buffer.duration
    setTimeout(() => {
      this._isPlaying = false
    }, duration * 1000 + 200)
  }

  stop(): void {
    if (!this.player) return
    this.player.stop()
    this._isPlaying = false
  }

  setPitch(semitones: number): void {
    this.pitchShift.pitch = Math.max(-12, Math.min(12, semitones))
  }

  setReverb(enabled: boolean, wet: number): void {
    this.reverb.wet.value = enabled ? Math.max(0, Math.min(1, wet)) : 0
  }

  setDelay(enabled: boolean, wet: number): void {
    this.delay.wet.value = enabled ? Math.max(0, Math.min(1, wet)) : 0
  }

  setFilter(enabled: boolean, frequency: number, type: BiquadFilterType): void {
    this.filter.frequency.value = Math.max(20, Math.min(20000, frequency))
    this.filter.type = type

    // When filter is disabled, set to pass-through (full range lowpass)
    if (!enabled) {
      this.filter.frequency.value = 20000
      this.filter.type = 'lowpass'
    }
  }

  async renderWithEffects(): Promise<Blob> {
    if (!this.player || !this._isLoaded) {
      throw new Error('No recording loaded')
    }

    // Connect the output to the recorder for capture
    this.output.connect(this.recorder)

    const duration = this.player.buffer.duration

    this.recorder.start()
    this.player.start()

    // Wait for the full playback duration plus a short tail for reverb/delay
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, (duration + 1.5) * 1000)
    })

    this.player.stop()
    const blob = await this.recorder.stop()

    // Disconnect recorder from output after capture
    this.output.disconnect(this.recorder)

    return blob
  }

  dispose(): void {
    this._isPlaying = false
    this._isLoaded = false

    if (this.player) {
      this.player.stop()
      this.player.disconnect()
      this.player.dispose()
      this.player = null
    }

    this.pitchShift.dispose()
    this.reverb.dispose()
    this.delay.dispose()
    this.filter.dispose()
    this.recorder.dispose()
    this.output.dispose()
  }
}

export const voiceEffectsProcessor = new VoiceEffectsProcessor()
