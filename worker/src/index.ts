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

function corsHeaders(env: Env): Record<string, string> {
  const origin = env.ALLOWED_ORIGIN || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonResponse(body: unknown, status: number, env: Env): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
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
        headers: corsHeaders(env),
      })
    }

    // Route: POST /api/generate-sound
    if (request.method === 'POST' && url.pathname === '/api/generate-sound') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400, env)
      }

      const validation = validateRequest(body)
      if (!validation.valid) {
        return jsonResponse({ error: validation.error }, 400, env)
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
          env
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
          env
        )
      }

      // Stream the audio response back
      return new Response(elevenLabsResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          ...corsHeaders(env),
        },
      })
    }

    // 404 for all other routes
    return jsonResponse({ error: 'Not found' }, 404, env)
  },
} satisfies ExportedHandler<Env>
