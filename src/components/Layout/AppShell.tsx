import { useState, useCallback } from 'react'
import { TransportBar } from './TransportBar'
import { Navigation } from './Navigation'
import { AudioInitOverlay } from './AudioInitOverlay'
import { audioEngine } from '@/engine/AudioEngine'
import type { AppSection } from '@/types'

interface AppShellProps {
  /** Mobile: render-prop receives the active section. */
  children: (activeSection: AppSection) => React.ReactNode
  /** Desktop: all-sections layout rendered below the transport bar. */
  desktopContent?: React.ReactNode
}

export function AppShell({ children, desktopContent }: AppShellProps) {
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

      {/* Mobile layout: tab-based, one section at a time */}
      <main className="flex-1 p-3 pb-20 animate-fade-in md:hidden">
        {children(activeSection)}
      </main>

      {/* Desktop layout: all sections visible */}
      <main className="hidden md:block flex-1 p-4 animate-fade-in">
        {desktopContent}
      </main>

      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      <footer className="hidden md:block text-center py-3 text-xs text-slate-400">
        Made with love &middot; BeatForge
      </footer>
    </div>
  )
}
