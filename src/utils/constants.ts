export const PAD_COLORS = [
  'pad-rose', 'pad-orange', 'pad-amber', 'pad-lime',
  'pad-emerald', 'pad-teal', 'pad-cyan', 'pad-sky',
  'pad-blue', 'pad-indigo', 'pad-violet', 'pad-purple',
  'pad-fuchsia', 'pad-pink', 'pad-slate', 'pad-stone',
] as const

export const PAD_COLOR_HEX: Record<string, string> = {
  'pad-rose': '#fb7185',
  'pad-orange': '#fb923c',
  'pad-amber': '#fbbf24',
  'pad-lime': '#a3e635',
  'pad-emerald': '#34d399',
  'pad-teal': '#2dd4bf',
  'pad-cyan': '#22d3ee',
  'pad-sky': '#38bdf8',
  'pad-blue': '#60a5fa',
  'pad-indigo': '#818cf8',
  'pad-violet': '#a78bfa',
  'pad-purple': '#c084fc',
  'pad-fuchsia': '#e879f9',
  'pad-pink': '#f472b6',
  'pad-slate': '#94a3b8',
  'pad-stone': '#a8a29e',
}

export const DEFAULT_BPM = 120

export const PAD_KEYBOARD_MAP_4x4: string[][] = [
  ['1', '2', '3', '4'],
  ['q', 'w', 'e', 'r'],
  ['a', 's', 'd', 'f'],
  ['z', 'x', 'c', 'v'],
]

export const PIANO_KEY_MAP_LOWER: Record<string, string> = {
  z: 'C', x: 'D', c: 'E', v: 'F', b: 'G', n: 'A', m: 'B',
  s: 'C#', d: 'D#', g: 'F#', h: 'G#', j: 'A#',
}

export const PIANO_KEY_MAP_UPPER: Record<string, string> = {
  q: 'C', w: 'D', e: 'E', r: 'F', t: 'G', y: 'A', u: 'B',
  '2': 'C#', '3': 'D#', '5': 'F#', '6': 'G#', '7': 'A#',
}

export const DRUM_SOUNDS = [
  { id: 'kick', label: 'Kick', category: 'drums' },
  { id: 'kick-deep', label: 'Deep Kick', category: 'drums' },
  { id: 'snare', label: 'Snare', category: 'drums' },
  { id: 'snare-rim', label: 'Rim', category: 'drums' },
  { id: 'clap', label: 'Clap', category: 'drums' },
  { id: 'hihat-closed', label: 'HH Closed', category: 'drums' },
  { id: 'hihat-open', label: 'HH Open', category: 'drums' },
  { id: 'tom-low', label: 'Tom Lo', category: 'drums' },
  { id: 'tom-mid', label: 'Tom Mid', category: 'drums' },
  { id: 'tom-high', label: 'Tom Hi', category: 'drums' },
  { id: 'crash', label: 'Crash', category: 'drums' },
  { id: 'ride', label: 'Ride', category: 'drums' },
  { id: 'cowbell', label: 'Cowbell', category: 'drums' },
  { id: '808-bass', label: '808 Bass', category: 'bass' },
  { id: 'snap', label: 'Snap', category: 'drums' },
  { id: 'shaker', label: 'Shaker', category: 'drums' },
] as const

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
