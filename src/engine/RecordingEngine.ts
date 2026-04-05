import * as Tone from 'tone'
import { audioEngine } from '@/engine/AudioEngine'

type ProgressCallback = (progress: number, elapsed: number, total: number) => void

class RecordingEngine {
  private recorder: Tone.Recorder | null = null
  private loopPlayers: Map<string, Tone.Player> = new Map()
  private loopChannels: Map<string, Tone.Channel> = new Map()
  private autoStopId: ReturnType<typeof setTimeout> | null = null
  private progressInterval: ReturnType<typeof setInterval> | null = null
  private recordingStartTime = 0
  private recordingDuration = 0
  private onProgress: ProgressCallback | null = null
  private onAutoStop: (() => void) | null = null
  private _isRecording = false

  get isRecording(): boolean {
    return this._isRecording
  }

  init(): void {
    if (this.recorder) return

    const master = audioEngine.getMasterChannel()
    this.recorder = new Tone.Recorder()
    master.connect(this.recorder)
  }

  setProgressCallback(cb: ProgressCallback | null): void {
    this.onProgress = cb
  }

  setAutoStopCallback(cb: (() => void) | null): void {
    this.onAutoStop = cb
  }

  startRecording(measures: number, bpm: number): void {
    if (!this.recorder) {
      this.init()
    }

    // Calculate loop duration: measures * beatsPerMeasure * secondsPerBeat
    const duration = measures * 4 * (60 / bpm)
    this.recordingDuration = duration
    this.recordingStartTime = performance.now()
    this._isRecording = true

    // Start the recorder
    void this.recorder!.start()

    // Start progress updates
    this.progressInterval = setInterval(() => {
      if (!this._isRecording) return
      const elapsed = (performance.now() - this.recordingStartTime) / 1000
      const progress = Math.min(elapsed / this.recordingDuration, 1)
      this.onProgress?.(progress, elapsed, this.recordingDuration)
    }, 50)

    // Schedule auto-stop
    this.autoStopId = setTimeout(() => {
      this.onAutoStop?.()
    }, duration * 1000)
  }

  async stopRecording(): Promise<{ blob: Blob; url: string; duration: number }> {
    if (!this.recorder || !this._isRecording) {
      throw new Error('Not currently recording')
    }

    this._isRecording = false

    // Clear auto-stop timer
    if (this.autoStopId !== null) {
      clearTimeout(this.autoStopId)
      this.autoStopId = null
    }

    // Clear progress interval
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }

    const blob = await this.recorder.stop()
    const url = URL.createObjectURL(blob)
    const duration = this.recordingDuration

    return { blob, url, duration }
  }

  createLoopTrack(id: string, audioUrl: string, duration: number): void {
    const master = audioEngine.getMasterChannel()
    const channel = new Tone.Channel(0, 0).connect(master)

    const player = new Tone.Player({
      url: audioUrl,
      loop: true,
      loopStart: 0,
      loopEnd: duration,
      fadeIn: 0.005,
      fadeOut: 0.005,
    }).connect(channel)

    // Sync player to the transport so it stays in time
    player.sync().start(0)

    this.loopPlayers.set(id, player)
    this.loopChannels.set(id, channel)
  }

  setTrackVolume(id: string, db: number): void {
    const channel = this.loopChannels.get(id)
    if (channel) {
      channel.volume.value = db
    }
  }

  setTrackMute(id: string, muted: boolean): void {
    const channel = this.loopChannels.get(id)
    if (channel) {
      channel.mute = muted
    }
  }

  removeTrack(id: string): void {
    const player = this.loopPlayers.get(id)
    const channel = this.loopChannels.get(id)

    if (player) {
      player.unsync()
      player.stop()
      player.dispose()
      this.loopPlayers.delete(id)
    }

    if (channel) {
      channel.dispose()
      this.loopChannels.delete(id)
    }
  }

  stopAll(): void {
    for (const player of this.loopPlayers.values()) {
      player.unsync()
      player.stop()
    }
  }

  startAll(): void {
    for (const player of this.loopPlayers.values()) {
      player.sync().start(0)
    }
  }

  dispose(): void {
    this._isRecording = false

    if (this.autoStopId !== null) {
      clearTimeout(this.autoStopId)
      this.autoStopId = null
    }

    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }

    for (const player of this.loopPlayers.values()) {
      player.unsync()
      player.stop()
      player.dispose()
    }

    for (const channel of this.loopChannels.values()) {
      channel.dispose()
    }

    this.loopPlayers.clear()
    this.loopChannels.clear()

    if (this.recorder) {
      this.recorder.dispose()
      this.recorder = null
    }
  }
}

export const recordingEngine = new RecordingEngine()
