import { API_URL } from '@/utils/constants'

export interface VoiceInfo {
  voice_id: string
  name: string
  labels: Record<string, string>
  preview_url: string
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function transformVoice(
  audioBlob: Blob,
  voiceId: string
): Promise<{ audioBlob: Blob; audioUrl: string }> {
  const audio = await blobToBase64(audioBlob)

  const response = await fetch(`${API_URL}/api/voice-transform`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio, voice_id: voiceId }),
  })

  if (!response.ok) {
    let message = 'Voice transformation failed'
    try {
      const err = (await response.json()) as { error?: string }
      if (err.error) {
        message = err.error
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(message)
  }

  const resultBlob = await response.blob()
  if (resultBlob.size === 0) {
    throw new Error('Received empty audio response')
  }

  const audioUrl = URL.createObjectURL(resultBlob)
  return { audioBlob: resultBlob, audioUrl }
}

export async function isolateAudio(
  audioBlob: Blob
): Promise<{ audioBlob: Blob; audioUrl: string }> {
  const audio = await blobToBase64(audioBlob)

  const response = await fetch(`${API_URL}/api/audio-isolate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio }),
  })

  if (!response.ok) {
    let message = 'Audio isolation failed'
    try {
      const err = (await response.json()) as { error?: string }
      if (err.error) {
        message = err.error
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(message)
  }

  const resultBlob = await response.blob()
  if (resultBlob.size === 0) {
    throw new Error('Received empty audio response')
  }

  const audioUrl = URL.createObjectURL(resultBlob)
  return { audioBlob: resultBlob, audioUrl }
}

export async function listVoices(): Promise<VoiceInfo[]> {
  const response = await fetch(`${API_URL}/api/voices`, {
    method: 'GET',
  })

  if (!response.ok) {
    let message = 'Failed to fetch voices'
    try {
      const err = (await response.json()) as { error?: string }
      if (err.error) {
        message = err.error
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(message)
  }

  const voices = (await response.json()) as VoiceInfo[]
  return voices
}
