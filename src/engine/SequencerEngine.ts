import * as Tone from 'tone'
import { drumEngine } from '@/engine/DrumEngine'

interface SequencerTrackData {
  soundId: string
  steps: boolean[]
  volume: number
  muted: boolean
}

type StepCallback = (step: number) => void

class SequencerEngine {
  private sequence: Tone.Sequence | null = null
  private tracks: SequencerTrackData[] = []
  private stepCount: 16 | 32 = 16
  private currentStep = 0
  private stepCallbacks: StepCallback[] = []

  setPattern(tracks: SequencerTrackData[]) {
    this.tracks = tracks
    // If the sequence is already running, we don't need to recreate it —
    // the callback reads from this.tracks on each step.
  }

  setStepCount(count: 16 | 32) {
    this.stepCount = count
    // If the sequence exists, recreate it with the new step count
    const wasPlaying = Tone.getTransport().state === 'started'
    if (this.sequence) {
      this.dispose()
      this.createSequence()
      if (wasPlaying) {
        this.start()
      }
    }
  }

  getCurrentStep(): number {
    return this.currentStep
  }

  onStep(callback: StepCallback) {
    this.stepCallbacks.push(callback)
  }

  removeStepCallback(callback: StepCallback) {
    this.stepCallbacks = this.stepCallbacks.filter((cb) => cb !== callback)
  }

  start() {
    if (!drumEngine.isInitialized) {
      drumEngine.init()
    }

    if (!this.sequence) {
      this.createSequence()
    }

    this.sequence?.start(0)
    Tone.getTransport().loop = true
    Tone.getTransport().loopStart = 0
    Tone.getTransport().loopEnd = `${this.stepCount}*16n`
    Tone.getTransport().start()
  }

  stop() {
    Tone.getTransport().stop()
    this.sequence?.stop()
    this.currentStep = 0
    this.notifyStep(0)
  }

  dispose() {
    if (this.sequence) {
      this.sequence.stop()
      this.sequence.dispose()
      this.sequence = null
    }
    this.currentStep = 0
  }

  private createSequence() {
    const steps = Array.from({ length: this.stepCount }, (_, i) => i)

    this.sequence = new Tone.Sequence(
      (time, stepIndex) => {
        this.currentStep = stepIndex

        // Trigger active tracks for this step
        for (const track of this.tracks) {
          if (!track.muted && track.steps[stepIndex]) {
            const db = track.volume <= 0 ? -Infinity : -60 + (track.volume / 100) * 60
            drumEngine.trigger(track.soundId, db, time)
          }
        }

        // Notify UI of current step — use Tone.getDraw() for visual sync
        Tone.getDraw().schedule(() => {
          this.notifyStep(stepIndex)
        }, time)
      },
      steps,
      '16n'
    )
  }

  private notifyStep(step: number) {
    for (const cb of this.stepCallbacks) {
      cb(step)
    }
  }
}

export const sequencerEngine = new SequencerEngine()
