import { AppShell } from '@/components/Layout/AppShell'
import { PadGrid } from '@/components/PadGrid/PadGrid'
import { InstrumentSelector } from '@/components/Piano/InstrumentSelector'
import { PianoKeyboard } from '@/components/Piano/PianoKeyboard'
import { OctaveControl } from '@/components/Piano/OctaveControl'
import { AIForge } from '@/components/AIForge/AIForge'
import { StepSequencer } from '@/components/Sequencer/StepSequencer'
import { MixerPanel } from '@/components/Mixer/MixerPanel'
import { PresetSelector } from '@/components/Presets/PresetSelector'
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
      return <AIForge />
    case 'sequencer':
      return (
        <div className="space-y-4">
          <PresetSelector />
          <StepSequencer />
        </div>
      )
    case 'mixer':
      return <MixerPanel />
  }
}

function DesktopLayout() {
  useKeyboardInput(true)

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top row: Pad Grid + AI Forge side by side */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <PadGrid />
        </div>
        <div className="col-span-2">
          <AIForge />
        </div>
      </div>

      {/* Piano keyboard full width */}
      <div className="space-y-4">
        <InstrumentSelector />
        <PianoKeyboard />
        <OctaveControl />
      </div>

      {/* Preset Selector + Step Sequencer */}
      <PresetSelector />
      <StepSequencer />

      {/* Mixer */}
      <MixerPanel />
    </div>
  )
}

function App() {
  return (
    <AppShell desktopContent={<DesktopLayout />}>
      {(activeSection) => <SectionContent section={activeSection} />}
    </AppShell>
  )
}

export default App
