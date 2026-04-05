import { API_URL } from '@/utils/constants'

interface GenerateSoundParams {
  text: string
  duration_seconds?: number
  prompt_influence?: number
  loop?: boolean
  category?: string
}

interface GenerateSoundResult {
  audioBlob: Blob
  audioUrl: string
}

export async function generateSound(
  params: GenerateSoundParams
): Promise<GenerateSoundResult> {
  const response = await fetch(`${API_URL}/api/generate-sound`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    let message = 'Sound generation failed'
    try {
      const err = (await response.json()) as { error?: string; details?: unknown }
      if (err.error) {
        message = err.error
      }
    } catch {
      // response wasn't JSON — use default message
    }
    throw new Error(message)
  }

  const audioBlob = await response.blob()

  if (audioBlob.size === 0) {
    throw new Error('Received empty audio response')
  }

  const audioUrl = URL.createObjectURL(audioBlob)

  return { audioBlob, audioUrl }
}
