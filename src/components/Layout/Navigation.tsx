import { Grid3X3, Piano, Sparkles, ListMusic, Sliders } from 'lucide-react'
import type { AppSection } from '@/types'
import { clsx } from 'clsx'

const tabs: { id: AppSection; label: string; icon: React.ReactNode }[] = [
  { id: 'pads', label: 'Pads', icon: <Grid3X3 size={20} /> },
  { id: 'keys', label: 'Keys', icon: <Piano size={20} /> },
  { id: 'forge', label: 'AI Forge', icon: <Sparkles size={20} /> },
  { id: 'sequencer', label: 'Sequence', icon: <ListMusic size={20} /> },
  { id: 'mixer', label: 'Mixer', icon: <Sliders size={20} /> },
]

interface NavigationProps {
  activeSection: AppSection
  onSectionChange: (section: AppSection) => void
}

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="glass-strong fixed bottom-0 left-0 right-0 z-50 px-2 py-1 md:hidden border-t border-slate-200/50">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSectionChange(tab.id)}
            className={clsx(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]',
              activeSection === tab.id
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
