import { AppShell } from '@/components/Layout/AppShell'
import type { AppSection } from '@/types'

function SectionContent({ section }: { section: AppSection }) {
  switch (section) {
    case 'pads':
      return (
        <div className="flex items-center justify-center h-64 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-400 font-medium">Pad Grid — Coming next</p>
        </div>
      )
    case 'keys':
      return (
        <div className="flex items-center justify-center h-64 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-400 font-medium">Piano Keyboard — Coming soon</p>
        </div>
      )
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
