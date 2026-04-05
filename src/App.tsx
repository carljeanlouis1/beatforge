import { AppShell } from '@/components/Layout/AppShell'
import { PadGrid } from '@/components/PadGrid/PadGrid'
import { InstrumentSelector } from '@/components/Piano/InstrumentSelector'
import { PianoKeyboard } from '@/components/Piano/PianoKeyboard'
import { OctaveControl } from '@/components/Piano/OctaveControl'
import { useKeyboardInput } from '@/hooks/useKeyboardInput'
import type { AppSection } from '@/types'

function KeysSection() {
  useKeyboardInput(true)

  return (
    <div className="space-y-4">
      <InstrumentSelector />
      <PianoKeyboard />
      <OctaveControl />
    </div>
  )
}

function SectionContent({ section }: { section: AppSection }) {
  switch (section) {
    case 'pads':
      return <PadGrid />
    case 'keys':
      return <KeysSection />
    case 'forge':
      return (
        <div className="flex items-center justify-center h-64 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-400 font-medium">AI Sound Forge — Coming soon</p>
        </div>
      )
    case 'sequencer':
      return (
        <div className="flex items-center justify-center h-64 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-400 font-medium">Step Sequencer — Coming soon</p>
        </div>
      )
    case 'mixer':
      return (
        <div className="flex items-center justify-center h-64 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-400 font-medium">Mixer — Coming soon</p>
        </div>
      )
  }
}

function App() {
  return (
    <AppShell>
      {(activeSection) => <SectionContent section={activeSection} />}
    </AppShell>
  )
}

export default App
