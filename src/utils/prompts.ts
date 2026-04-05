export interface PromptSuggestion {
  label: string
  prompt: string
  category: string
  duration: number
}

export const PROMPT_CATEGORIES = [
  { id: 'drums', label: 'Drums' },
  { id: 'bass', label: 'Bass' },
  { id: 'ambient', label: 'Ambient' },
  { id: 'musical', label: 'Musical' },
  { id: 'fun', label: 'Fun' },
] as const

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  // Drums & Percussion
  { label: 'Punchy Kick', prompt: 'Punchy analog kick drum with tight low end', category: 'drums', duration: 1 },
  { label: 'Crispy Snare', prompt: 'Crispy layered snare with bright transient', category: 'drums', duration: 1 },
  { label: 'Trap Hi-Hat', prompt: 'Crispy trap hi-hat with slight reverb tail', category: 'drums', duration: 0.5 },
  { label: 'Clap Stack', prompt: 'Layered clap with room reverb and snap', category: 'drums', duration: 1 },
  { label: 'Rim Shot', prompt: 'Tight acoustic rim shot with short decay', category: 'drums', duration: 0.5 },
  { label: 'Floor Tom', prompt: 'Deep floor tom hit with natural resonance', category: 'drums', duration: 2 },

  // Bass & Melodic
  { label: '808 Sub', prompt: 'Deep 808 kick with long sub bass tail', category: 'bass', duration: 3 },
  { label: 'Synth Bass', prompt: 'Fat analog synth bass stab in C', category: 'bass', duration: 2 },
  { label: 'Pluck', prompt: 'Short plucky synth note with quick decay', category: 'bass', duration: 1 },
  { label: 'Chord Stab', prompt: 'Major chord stab with detuned saw oscillators', category: 'bass', duration: 2 },
  { label: 'Reese Bass', prompt: 'Dark reese bass with slow filter movement', category: 'bass', duration: 3 },

  // Ambient & FX
  { label: 'Rain', prompt: 'Gentle rain ambience with distant thunder', category: 'ambient', duration: 10 },
  { label: 'Vinyl Crackle', prompt: 'Vinyl crackle ambient loop with warm tone', category: 'ambient', duration: 5 },
  { label: 'Riser', prompt: 'White noise riser building tension over time', category: 'ambient', duration: 4 },
  { label: 'Sweep', prompt: 'Filter sweep with resonant peak descending', category: 'ambient', duration: 3 },
  { label: 'Impact', prompt: 'Cinematic impact hit with deep reverb tail', category: 'ambient', duration: 3 },
  { label: 'Wind', prompt: 'Soft wind blowing through trees', category: 'ambient', duration: 8 },

  // Musical
  { label: 'Brass Stab', prompt: 'Bright brass section stab chord', category: 'musical', duration: 2 },
  { label: 'String Hit', prompt: 'Orchestral string section short hit', category: 'musical', duration: 2 },
  { label: 'Piano Chord', prompt: 'Warm upright piano chord with sustain', category: 'musical', duration: 3 },
  { label: 'Organ Swell', prompt: 'Hammond organ swell with leslie speaker', category: 'musical', duration: 4 },
  { label: 'Choir Pad', prompt: 'Ethereal choir pad in D minor', category: 'musical', duration: 5 },

  // Fun & Creative
  { label: 'Laser', prompt: 'Retro sci-fi laser zap sound', category: 'fun', duration: 1 },
  { label: 'Explosion', prompt: '8-bit explosion with cascading debris', category: 'fun', duration: 2 },
  { label: 'Cartoon Bounce', prompt: 'Cartoon spring bounce boing effect', category: 'fun', duration: 1 },
  { label: 'Glitch', prompt: 'Digital glitch with buffer stutter and artifacts', category: 'fun', duration: 1 },
  { label: 'Airhorn', prompt: 'Classic airhorn sound effect', category: 'fun', duration: 2 },
  { label: 'Coin Pickup', prompt: 'Retro arcade coin pickup sound', category: 'fun', duration: 0.5 },
]

export const PLACEHOLDER_PROMPTS = [
  'Crispy trap hi-hat with slight reverb',
  'Deep 808 kick with long sub bass tail',
  'Vinyl crackle ambient loop',
  'Retro arcade coin pickup sound',
  'Ethereal choir pad in D minor',
]
