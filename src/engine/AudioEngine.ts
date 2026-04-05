import * as Tone from 'tone'

class AudioEngine {
  private initialized = false
  private masterChannel: Tone.Channel | null = null
  private limiter: Tone.Limiter | null = null

  get isInitialized() {
    return this.initialized
  }

  get masterVolume() {
    return this.masterChannel?.volume.value ?? 0
  }

  set masterVolume(db: number) {
    if (this.masterChannel) {
      this.masterChannel.volume.value = db
    }
  }

  async init() {
    if (this.initialized) return

    await Tone.start()

    this.limiter = new Tone.Limiter(-1).toDestination()
    this.masterChannel = new Tone.Channel(0, 0).connect(this.limiter)

    this.initialized = true
  }

  getMasterChannel(): Tone.Channel {
    if (!this.masterChannel) {
      throw new Error('AudioEngine not initialized. Call init() first.')
    }
    return this.masterChannel
  }

  getBpm(): number {
    return Tone.getTransport().bpm.value
  }

  setBpm(bpm: number) {
    Tone.getTransport().bpm.value = bpm
  }

  startTransport() {
    Tone.getTransport().start()
  }

  stopTransport() {
    Tone.getTransport().stop()
  }

  getTransportPosition(): string {
    return Tone.getTransport().position as string
  }

  dispose() {
    this.masterChannel?.dispose()
    this.limiter?.dispose()
    this.initialized = false
  }
}

export const audioEngine = new AudioEngine()
