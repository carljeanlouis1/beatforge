import * as Tone from 'tone'
import { audioEngine } from '@/engine/AudioEngine'

class VoiceEngine {
  private mic: Tone.UserMedia | null = null
  private recorder: Tone.Recorder | null = null
  private pitchShift: Tone.PitchShift | null = null
  private micChannel: Tone.Channel | null = null
  private monitorEnabled = false
  private _isRecording = false
  private recordingStartTime = 0

  get isRecording(): boolean {
    return this._isRecording
  }

  async init(): Promise<void> {
    if (this.mic) return

    await Tone.start()

    this.mic = new Tone.UserMedia()
    this.pitchShift = new Tone.PitchShift({ pitch: 0 })
    this.micChannel = new Tone.Channel({ volume: -Infinity }).connect(
      audioEngine.getMasterChannel()
    )
    this.recorder = new Tone.Recorder()

    // Audio chain: mic -> pitchShift -> recorder (always)
    // Audio chain: mic -> pitchShift -> micChannel -> master (when monitoring)
    this.mic.connect(this.pitchShift)
    this.pitchShift.connect(this.recorder)
    this.pitchShift.connect(this.micChannel)

    await this.mic.open()
  }

  async startRecording(): Promise<void> {
    if (!this.recorder || !this.mic) {
      await this.init()
    }

    if (this._isRecording) return

    this._isRecording = true
    this.recordingStartTime = performance.now()
    this.recorder!.start()
  }

  async stopRecording(): Promise<{ blob: Blob; url: string; duration: number }> {
    if (!this.recorder || !this._isRecording) {
      throw new Error('Not currently recording')
    }

    this._isRecording = false
    const elapsed = (performance.now() - this.recordingStartTime) / 1000

    const blob = await this.recorder.stop()
    const url = URL.createObjectURL(blob)

    return { blob, url, duration: elapsed }
  }

  setPitchShift(semitones: number): void {
    if (this.pitchShift) {
      this.pitchShift.pitch = Math.max(-12, Math.min(12, semitones))
    }
  }

  setMonitor(enabled: boolean): void {
    this.monitorEnabled = enabled
    if (this.micChannel) {
      this.micChannel.volume.value = enabled ? 0 : -Infinity
    }
  }

  getMonitorEnabled(): boolean {
    return this.monitorEnabled
  }

  dispose(): void {
    this._isRecording = false

    if (this.mic) {
      this.mic.close()
      this.mic.dispose()
      this.mic = null
    }

    if (this.pitchShift) {
      this.pitchShift.dispose()
      this.pitchShift = null
    }

    if (this.micChannel) {
      this.micChannel.dispose()
      this.micChannel = null
    }

    if (this.recorder) {
      this.recorder.dispose()
      this.recorder = null
    }
  }
}

export const voiceEngine = new VoiceEngine()
