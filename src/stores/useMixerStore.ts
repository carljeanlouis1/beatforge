import { create } from 'zustand'
import * as Tone from 'tone'
import { drumEngine } from '@/engine/DrumEngine'
import { audioEngine } from '@/engine/AudioEngine'
import { createReverb, createDelay, createFilter, REVERB_DEFAULTS, DELAY_DEFAULTS, FILTER_DEFAULTS } from '@/engine/effects'
import type { MixerChannel, ChannelEffects } from '@/types'

interface EffectNodes {
  reverb: Tone.Reverb | null
  delay: Tone.FeedbackDelay | null
  filter: Tone.Filter | null
}

// Keep track of live Tone.js effect nodes per channel
const effectNodesMap = new Map<string, EffectNodes>()

function getEffectNodes(id: string): EffectNodes {
  let nodes = effectNodesMap.get(id)
  if (!nodes) {
    nodes = { reverb: null, delay: null, filter: null }
    effectNodesMap.set(id, nodes)
  }
  return nodes
}

function volumeToDb(volume: number): number {
  if (volume <= 0) return -Infinity
  return -60 + (volume / 100) * 60
}

function defaultEffects(): ChannelEffects {
  return {
    reverb: { enabled: false, decay: REVERB_DEFAULTS.decay, wet: REVERB_DEFAULTS.wet },
    delay: { enabled: false, time: DELAY_DEFAULTS.time, feedback: DELAY_DEFAULTS.feedback, wet: DELAY_DEFAULTS.wet },
    filter: { enabled: false, frequency: FILTER_DEFAULTS.frequency, type: FILTER_DEFAULTS.type },
  }
}

function reconnectAllEffects(soundId: string, nodes: EffectNodes) {
  const channel = drumEngine.getChannel(soundId)
  if (!channel) return
  const master = audioEngine.getMasterChannel()

  // Disconnect channel from everything
  channel.disconnect()

  // Build chain: channel -> [active effects...] -> master
  const activeEffects: Tone.ToneAudioNode[] = []
  if (nodes.reverb) activeEffects.push(nodes.reverb)
  if (nodes.delay) activeEffects.push(nodes.delay)
  if (nodes.filter) activeEffects.push(nodes.filter)

  if (activeEffects.length === 0) {
    channel.connect(master)
    return
  }

  // Disconnect all effects first
  for (const fx of activeEffects) {
    fx.disconnect()
  }

  // channel -> first effect
  channel.connect(activeEffects[0])

  // chain effects together
  for (let i = 0; i < activeEffects.length - 1; i++) {
    activeEffects[i].connect(activeEffects[i + 1])
  }

  // last effect -> master
  activeEffects[activeEffects.length - 1].connect(master)
}

interface MixerState {
  channels: MixerChannel[]
  masterVolume: number

  initChannels: (pads: { id: string; soundId: string; label: string }[]) => void
  setChannelVolume: (id: string, volume: number) => void
  setChannelPan: (id: string, pan: number) => void
  toggleMute: (id: string) => void
  toggleSolo: (id: string) => void
  toggleEffect: (id: string, effect: 'reverb' | 'delay' | 'filter') => void
  setEffectParam: (id: string, effect: string, param: string, value: number | string) => void
  setMasterVolume: (volume: number) => void
}

export const useMixerStore = create<MixerState>()((set, get) => ({
  channels: [],
  masterVolume: 80,

  initChannels: (pads) => {
    const existing = get().channels
    // Only re-init if channel count differs
    if (existing.length === pads.length) return

    const channels: MixerChannel[] = pads.map((pad) => ({
      id: pad.soundId,
      label: pad.label,
      volume: 80,
      pan: 0,
      muted: false,
      soloed: false,
      effects: defaultEffects(),
    }))
    set({ channels })
  },

  setChannelVolume: (id, volume) => {
    const { channels } = get()
    const anySoloed = channels.some((ch) => ch.soloed)

    set({
      channels: channels.map((ch) => (ch.id === id ? { ...ch, volume } : ch)),
    })

    // Apply to engine unless muted or solo-silenced
    const channel = channels.find((ch) => ch.id === id)
    if (!channel) return
    const isSilenced = channel.muted || (anySoloed && !channel.soloed)
    if (!isSilenced) {
      drumEngine.setVolume(id, volumeToDb(volume))
    }
  },

  setChannelPan: (id, pan) => {
    set({
      channels: get().channels.map((ch) => (ch.id === id ? { ...ch, pan } : ch)),
    })
    const toneChannel = drumEngine.getChannel(id)
    if (toneChannel) {
      toneChannel.pan.value = pan / 100
    }
  },

  toggleMute: (id) => {
    const { channels } = get()
    const anySoloed = channels.some((ch) => ch.soloed)
    const updated = channels.map((ch) => (ch.id === id ? { ...ch, muted: !ch.muted } : ch))
    set({ channels: updated })

    const ch = updated.find((c) => c.id === id)
    if (!ch) return

    if (anySoloed) {
      // Solo takes priority, only unmuted + soloed channels play
      const shouldPlay = !ch.muted && ch.soloed
      drumEngine.setVolume(id, shouldPlay ? volumeToDb(ch.volume) : -Infinity)
    } else {
      drumEngine.setVolume(id, ch.muted ? -Infinity : volumeToDb(ch.volume))
    }
  },

  toggleSolo: (id) => {
    const { channels } = get()
    const updated = channels.map((ch) => (ch.id === id ? { ...ch, soloed: !ch.soloed } : ch))
    set({ channels: updated })

    const anySoloed = updated.some((ch) => ch.soloed)

    // Apply solo/mute logic to all channels
    for (const ch of updated) {
      if (ch.muted) {
        drumEngine.setVolume(ch.id, -Infinity)
      } else if (anySoloed && !ch.soloed) {
        drumEngine.setVolume(ch.id, -Infinity)
      } else {
        drumEngine.setVolume(ch.id, volumeToDb(ch.volume))
      }
    }
  },

  toggleEffect: (id, effect) => {
    const { channels } = get()
    const ch = channels.find((c) => c.id === id)
    if (!ch) return

    const wasEnabled = ch.effects[effect].enabled
    const nodes = getEffectNodes(id)

    if (wasEnabled) {
      // Remove effect
      const node = nodes[effect]
      if (node) {
        node.disconnect()
        node.dispose()
        nodes[effect] = null
        reconnectAllEffects(id, nodes)
      }
    } else {
      // Create and insert effect
      if (effect === 'reverb') {
        nodes.reverb = createReverb(ch.effects.reverb.decay, ch.effects.reverb.wet)
      } else if (effect === 'delay') {
        nodes.delay = createDelay(ch.effects.delay.time, ch.effects.delay.feedback, ch.effects.delay.wet)
      } else if (effect === 'filter') {
        nodes.filter = createFilter(ch.effects.filter.frequency, ch.effects.filter.type)
      }
      reconnectAllEffects(id, nodes)
    }

    set({
      channels: channels.map((c) =>
        c.id === id
          ? {
              ...c,
              effects: {
                ...c.effects,
                [effect]: { ...c.effects[effect], enabled: !wasEnabled },
              },
            }
          : c,
      ),
    })
  },

  setEffectParam: (id, effect, param, value) => {
    const { channels } = get()
    const ch = channels.find((c) => c.id === id)
    if (!ch) return

    // Update state
    set({
      channels: channels.map((c) =>
        c.id === id
          ? {
              ...c,
              effects: {
                ...c.effects,
                [effect]: { ...c.effects[effect as keyof ChannelEffects], [param]: value },
              },
            }
          : c,
      ),
    })

    // Apply to live Tone.js node if the effect is active
    const nodes = getEffectNodes(id)
    if (effect === 'reverb' && nodes.reverb) {
      if (param === 'decay') nodes.reverb.decay = value as number
      if (param === 'wet') nodes.reverb.wet.value = value as number
    } else if (effect === 'delay' && nodes.delay) {
      if (param === 'time') nodes.delay.delayTime.value = value as string & number
      if (param === 'feedback') nodes.delay.feedback.value = value as number
      if (param === 'wet') nodes.delay.wet.value = value as number
    } else if (effect === 'filter' && nodes.filter) {
      if (param === 'frequency') nodes.filter.frequency.value = value as number
      if (param === 'type') nodes.filter.type = value as BiquadFilterType
    }
  },

  setMasterVolume: (volume) => {
    set({ masterVolume: volume })
    audioEngine.masterVolume = volumeToDb(volume)
  },
}))
