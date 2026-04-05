interface Env {
  ELEVENLABS_API_KEY: string
  ALLOWED_ORIGIN: string
}

interface GenerateRequest {
  text: string
  duration_seconds?: number
  prompt_influence?: number
  loop?: boolean
  category?: string
}

function corsHeaders(env: Env, request?: Request): Record<string, string> {
  const allowedOrigins = (env.ALLOWED_ORIGIN || '*').split(',').map(o => o.trim())
  const requestOrigin = request?.headers.get('Origin') || ''
  const origin = allowedOrigins.includes('*')
    ? '*'
    : allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0]
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonResponse(body: unknown, status: number, env: Env, request?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env, request),
    },
  })
}

function enhancePrompt(text: string, category?: string, loop?: boolean): string {
  let enhanced = text

  const lower = text.toLowerCase()
  const isDrums =
    category === 'drums' ||
    /\b(drum|kick|snare|hihat|hi-hat|clap)\b/.test(lower)
  const isAmbient = category === 'ambient' || loop === true
  const isBass =
    category === 'bass' || /\b(bass|808|sub)\b/.test(lower)

  if (isDrums) {
    enhanced += ', single isolated hit, clean attack, studio quality'
  } else if (isAmbient) {
    enhanced += ', smooth atmospheric texture, high fidelity'
  } else if (isBass) {
    enhanced += ', deep clean bass, punchy, studio quality'
  } else if (!lower.includes('quality')) {
    enhanced += ', high quality audio'
  }

  return enhanced
}

function validateRequest(body: unknown): { valid: true; data: GenerateRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const req = body as Record<string, unknown>

  if (typeof req.text !== 'string' || req.text.length < 1 || req.text.length > 500) {
    return { valid: false, error: '`text` is required and must be 1-500 characters' }
  }

  if (req.duration_seconds !== undefined) {
    if (typeof req.duration_seconds !== 'number' || req.duration_seconds < 0.5 || req.duration_seconds > 30) {
      return { valid: false, error: '`duration_seconds` must be a number between 0.5 and 30' }
    }
  }

  if (req.prompt_influence !== undefined) {
    if (typeof req.prompt_influence !== 'number' || req.prompt_influence < 0 || req.prompt_influence > 1) {
      return { valid: false, error: '`prompt_influence` must be a number between 0 and 1' }
    }
  }

  if (req.loop !== undefined && typeof req.loop !== 'boolean') {
    return { valid: false, error: '`loop` must be a boolean' }
  }

  if (req.category !== undefined && typeof req.category !== 'string') {
    return { valid: false, error: '`category` must be a string' }
  }

  return {
    valid: true,
    data: {
      text: req.text,
      duration_seconds: req.duration_seconds as number | undefined,
      prompt_influence: req.prompt_influence as number | undefined,
      loop: req.loop as boolean | undefined,
      category: req.category as string | undefined,
    },
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env, request),
      })
    }

    // Route: POST /api/generate-sound
    if (request.method === 'POST' && url.pathname === '/api/generate-sound') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400, env, request)
      }

      const validation = validateRequest(body)
      if (!validation.valid) {
        return jsonResponse({ error: validation.error }, 400, env, request)
      }

      const { text, duration_seconds, prompt_influence, loop, category } = validation.data
      const enhancedText = enhancePrompt(text, category, loop)

      const elevenLabsBody: Record<string, unknown> = {
        text: enhancedText,
        prompt_influence: prompt_influence ?? 0.4,
        model_id: 'eleven_text_to_sound_v2',
      }

      if (duration_seconds !== undefined) {
        elevenLabsBody.duration_seconds = duration_seconds
      }

      if (loop !== undefined) {
        elevenLabsBody.loop = loop
      }

      let elevenLabsResponse: Response
      try {
        elevenLabsResponse = await fetch(
          'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',
          {
            method: 'POST',
            headers: {
              'xi-api-key': env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(elevenLabsBody),
          }
        )
      } catch {
        return jsonResponse(
          { error: 'Failed to connect to sound generation service' },
          502,
          env,
          request
        )
      }

      if (!elevenLabsResponse.ok) {
        let errorBody: unknown
        try {
          errorBody = await elevenLabsResponse.json()
        } catch {
          errorBody = { message: 'Unknown error from sound generation service' }
        }
        return jsonResponse(
          { error: 'Sound generation failed', details: errorBody },
          elevenLabsResponse.status,
          env,
          request
        )
      }

      // Stream the audio response back
      return new Response(elevenLabsResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          ...corsHeaders(env, request),
        },
      })
    }

    // Route: POST /api/text-to-speech
    if (request.method === 'POST' && url.pathname === '/api/text-to-speech') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400, env, request)
      }

      const req = body as Record<string, unknown>

      if (typeof req.text !== 'string' || req.text.length < 1 || req.text.length > 500) {
        return jsonResponse({ error: '`text` is required and must be 1-500 characters' }, 400, env, request)
      }

      if (typeof req.voice_id !== 'string' || req.voice_id.length === 0) {
        return jsonResponse({ error: '`voice_id` is required' }, 400, env, request)
      }

      const stability = typeof req.stability === 'number' ? req.stability : 0.5
      const similarityBoost = typeof req.similarity_boost === 'number' ? req.similarity_boost : 0.75

      let elevenLabsResponse: Response
      try {
        elevenLabsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${req.voice_id}?output_format=mp3_44100_128`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: req.text,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability,
                similarity_boost: similarityBoost,
              },
            }),
          }
        )
      } catch {
        return jsonResponse(
          { error: 'Failed to connect to text-to-speech service' },
          502,
          env,
          request
        )
      }

      if (!elevenLabsResponse.ok) {
        let errorBody: unknown
        try {
          errorBody = await elevenLabsResponse.json()
        } catch {
          errorBody = { message: 'Unknown error from text-to-speech service' }
        }
        return jsonResponse(
          { error: 'Text-to-speech failed', details: errorBody },
          elevenLabsResponse.status,
          env,
          request
        )
      }

      return new Response(elevenLabsResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          ...corsHeaders(env, request),
        },
      })
    }

    // Route: POST /api/voice-transform
    if (request.method === 'POST' && url.pathname === '/api/voice-transform') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400, env, request)
      }

      const req = body as Record<string, unknown>

      if (typeof req.audio !== 'string' || req.audio.length === 0) {
        return jsonResponse({ error: '`audio` is required (base64 encoded)' }, 400, env, request)
      }

      if (typeof req.voice_id !== 'string' || req.voice_id.length === 0) {
        return jsonResponse({ error: '`voice_id` is required' }, 400, env, request)
      }

      const audioBytes = Uint8Array.from(atob(req.audio as string), (c) => c.charCodeAt(0))
      const audioFile = new File([audioBytes], 'audio.mp3', { type: 'audio/mpeg' })

      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('model_id', 'eleven_english_sts_v2')

      let elevenLabsResponse: Response
      try {
        elevenLabsResponse = await fetch(
          `https://api.elevenlabs.io/v1/speech-to-speech/${req.voice_id}?output_format=mp3_44100_128`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': env.ELEVENLABS_API_KEY,
            },
            body: formData,
          }
        )
      } catch {
        return jsonResponse(
          { error: 'Failed to connect to voice transformation service' },
          502,
          env,
          request
        )
      }

      if (!elevenLabsResponse.ok) {
        let errorBody: unknown
        try {
          errorBody = await elevenLabsResponse.json()
        } catch {
          errorBody = { message: 'Unknown error from voice transformation service' }
        }
        return jsonResponse(
          { error: 'Voice transformation failed', details: errorBody },
          elevenLabsResponse.status,
          env,
          request
        )
      }

      return new Response(elevenLabsResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          ...corsHeaders(env, request),
        },
      })
    }

    // Route: POST /api/audio-isolate
    if (request.method === 'POST' && url.pathname === '/api/audio-isolate') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400, env, request)
      }

      const req = body as Record<string, unknown>

      if (typeof req.audio !== 'string' || req.audio.length === 0) {
        return jsonResponse({ error: '`audio` is required (base64 encoded)' }, 400, env, request)
      }

      const audioBytes = Uint8Array.from(atob(req.audio as string), (c) => c.charCodeAt(0))
      const audioFile = new File([audioBytes], 'audio.mp3', { type: 'audio/mpeg' })

      const formData = new FormData()
      formData.append('audio', audioFile)

      let elevenLabsResponse: Response
      try {
        elevenLabsResponse = await fetch(
          'https://api.elevenlabs.io/v1/audio-isolation',
          {
            method: 'POST',
            headers: {
              'xi-api-key': env.ELEVENLABS_API_KEY,
            },
            body: formData,
          }
        )
      } catch {
        return jsonResponse(
          { error: 'Failed to connect to audio isolation service' },
          502,
          env,
          request
        )
      }

      if (!elevenLabsResponse.ok) {
        let errorBody: unknown
        try {
          errorBody = await elevenLabsResponse.json()
        } catch {
          errorBody = { message: 'Unknown error from audio isolation service' }
        }
        return jsonResponse(
          { error: 'Audio isolation failed', details: errorBody },
          elevenLabsResponse.status,
          env,
          request
        )
      }

      return new Response(elevenLabsResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          ...corsHeaders(env, request),
        },
      })
    }

    // Route: GET /api/voices
    if (request.method === 'GET' && url.pathname === '/api/voices') {
      let elevenLabsResponse: Response
      try {
        elevenLabsResponse = await fetch(
          'https://api.elevenlabs.io/v1/voices',
          {
            method: 'GET',
            headers: {
              'xi-api-key': env.ELEVENLABS_API_KEY,
            },
          }
        )
      } catch {
        return jsonResponse(
          { error: 'Failed to connect to voices service' },
          502,
          env,
          request
        )
      }

      if (!elevenLabsResponse.ok) {
        let errorBody: unknown
        try {
          errorBody = await elevenLabsResponse.json()
        } catch {
          errorBody = { message: 'Unknown error from voices service' }
        }
        return jsonResponse(
          { error: 'Failed to fetch voices', details: errorBody },
          elevenLabsResponse.status,
          env,
          request
        )
      }

      const data = await elevenLabsResponse.json() as { voices: Array<{ voice_id: string; name: string; labels: Record<string, string>; preview_url: string }> }
      const voices = data.voices.map((v) => ({
        voice_id: v.voice_id,
        name: v.name,
        labels: v.labels ?? {},
        preview_url: v.preview_url ?? '',
      }))

      return jsonResponse(voices, 200, env, request)
    }

    // 404 for all other routes
    return jsonResponse({ error: 'Not found' }, 404, env, request)
  },
} satisfies ExportedHandler<Env>
