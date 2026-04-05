import { useState, useCallback } from 'react'
import { TransportBar } from './TransportBar'
import { Navigation } from './Navigation'
import { AudioInitOverlay } from './AudioInitOverlay'
import { audioEngine } from '@/engine/AudioEngine'
import type { AppSection } from '@/types'

interface AppShellProps {
  children: (activeSection: AppSection) => React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [audioReady, setAudioReady] = useState(false)
  const [activeSection, setActiveSection] = useState<AppSection>('pads')

  const handleAudioInit = useCallback(async () => {
    await audioEngine.init()
    setAudioReady(true)
  }, [])

  if (!audioReady) {
    return <AudioInitOverlay onInit={handleAudioInit} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TransportBar />
      <main className="flex-1 p-3 md:p-4 pb-20 md:pb-4 animate-fade-in">
        {children(activeSection)}
      </main>
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      <footer className="hidden md:block text-center py-3 text-xs text-slate-400">
        Made with love &middot; BeatForge
      </footer>
    </div>
  )
}
