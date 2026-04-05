import type { PresetBeat, PadConfig, PadMode } from '@/types'
import { DRUM_SOUNDS, PAD_COLORS } from '@/utils/constants'

function makePad(index: number, soundId: string): PadConfig {
  const sound = DRUM_SOUNDS.find((s) => s.id === soundId)
  return {
    id: `pad-${index}`,
    soundId,
    label: sound?.label ?? soundId,
    color: PAD_COLORS[index % PAD_COLORS.length],
    volume: 80,
    mode: 'one-shot' as PadMode,
  }
}

/** Build a 16-step boolean pattern from 1-based step positions */
function steps(...active: number[]): boolean[] {
  return Array.from({ length: 16 }, (_, i) => active.includes(i + 1))
}

export const PRESET_BEATS: PresetBeat[] = [
  // 1. Trap
  {
    id: 'trap',
    name: 'Trap',
    genre: 'Trap',
    bpm: 140,
    pads: [
      makePad(0, 'kick'),
      makePad(1, 'snare'),
      makePad(2, 'hihat-closed'),
      makePad(3, '808-bass'),
    ],
    pattern: [
      // Kick: 1, 8, 11
      steps(1, 8, 11),
      // Snare: 5, 13
      steps(5, 13),
      // Hi-hat: every 8th note with some removed
      steps(1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15),
      // 808 bass: 1, 5
      steps(1, 5),
    ],
  },

  // 2. Boom Bap
  {
    id: 'boom-bap',
    name: 'Boom Bap',
    genre: 'Hip-Hop',
    bpm: 90,
    pads: [
      makePad(0, 'kick'),
      makePad(1, 'snare'),
      makePad(2, 'hihat-closed'),
      makePad(3, 'hihat-open'),
    ],
    pattern: [
      // Kick: 1, 4, 11
      steps(1, 4, 11),
      // Snare: 5, 13
      steps(5, 13),
      // Hi-hat closed: every beat (1,3,5,7,9,11,13,15)
      steps(1, 3, 5, 7, 9, 11, 13, 15),
      // Hi-hat open: offbeats (2, 6, 10, 14)
      steps(2, 6, 10, 14),
    ],
  },

  // 3. Lo-Fi
  {
    id: 'lo-fi',
    name: 'Lo-Fi',
    genre: 'Lo-Fi',
    bpm: 75,
    pads: [
      makePad(0, 'kick'),
      makePad(1, 'snare-rim'),
      makePad(2, 'hihat-closed'),
      makePad(3, 'shaker'),
    ],
    pattern: [
      // Kick: 1, 7
      steps(1, 7),
      // Snare/rim: 5, 13
      steps(5, 13),
      // Hi-hat: sparse (1, 5, 9, 13)
      steps(1, 5, 9, 13),
      // Shaker: steady 8th notes
      steps(1, 3, 5, 7, 9, 11, 13, 15),
    ],
  },

  // 4. House
  {
    id: 'house',
    name: 'House',
    genre: 'House',
    bpm: 128,
    pads: [
      makePad(0, 'kick'),
      makePad(1, 'clap'),
      makePad(2, 'hihat-closed'),
      makePad(3, 'hihat-open'),
    ],
    pattern: [
      // Kick: four on the floor (1,5,9,13)
      steps(1, 5, 9, 13),
      // Clap: 5, 13
      steps(5, 13),
      // Hi-hat closed: every step
      steps(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
      // Hi-hat open: off-beats (3, 7, 11, 15)
      steps(3, 7, 11, 15),
    ],
  },

  // 5. EDM / Electro
  {
    id: 'edm',
    name: 'EDM',
    genre: 'Electro',
    bpm: 130,
    pads: [
      makePad(0, 'kick'),
      makePad(1, 'clap'),
      makePad(2, 'hihat-closed'),
      makePad(3, 'crash'),
    ],
    pattern: [
      // Kick: 1,5,9,13
      steps(1, 5, 9, 13),
      // Clap: 5, 13
      steps(5, 13),
      // Hi-hat: busy pattern
      steps(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
      // Crash: downbeat only
      steps(1),
    ],
  },

  // 6. Reggaeton
  {
    id: 'reggaeton',
    name: 'Reggaeton',
    genre: 'Reggaeton',
    bpm: 95,
    pads: [
      makePad(0, 'kick'),
      makePad(1, 'snare'),
      makePad(2, 'hihat-closed'),
      makePad(3, 'cowbell'),
    ],
    pattern: [
      // Kick (dembow): 1, 4
      steps(1, 4, 9, 12),
      // Snare (dembow): 4, 8, 12, 16
      steps(4, 8, 12, 16),
      // Hi-hat: constant 8th notes
      steps(1, 3, 5, 7, 9, 11, 13, 15),
      // Cowbell: accents
      steps(1, 5, 9, 13),
    ],
  },

  // 7. Drill
  {
    id: 'drill',
    name: 'Drill',
    genre: 'Drill',
    bpm: 145,
    pads: [
      makePad(0, 'kick'),
      makePad(1, 'snare'),
      makePad(2, 'hihat-closed'),
      makePad(3, '808-bass'),
    ],
    pattern: [
      // Kick: 1, 8
      steps(1, 8),
      // Snare: 5, 13
      steps(5, 13),
      // Hi-hat: triplet feel (every other + ghost notes)
      steps(1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16),
      // 808 bass: following kick pattern
      steps(1, 8),
    ],
  },

  // 8. Ambient
  {
    id: 'ambient',
    name: 'Ambient',
    genre: 'Ambient',
    bpm: 80,
    pads: [
      makePad(0, 'kick'),
      makePad(1, 'ride'),
      makePad(2, 'shaker'),
      makePad(3, 'snap'),
    ],
    pattern: [
      // Kick: very sparse
      steps(1, 9),
      // Ride: gentle pattern
      steps(1, 5, 9, 13),
      // Shaker: steady but sparse
      steps(3, 7, 11, 15),
      // Snap: texture accents
      steps(5, 13),
    ],
  },
]

/** Genre badge colors for the preset selector UI */
export const GENRE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Trap: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  'Hip-Hop': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Lo-Fi': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  House: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  Electro: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  Reggaeton: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  Drill: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  Ambient: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
}
