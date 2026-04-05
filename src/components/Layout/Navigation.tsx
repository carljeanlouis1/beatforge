import { Grid3X3, Piano, Sparkles, ListMusic, Sliders, Repeat, Mic } from 'lucide-react'
import type { AppSection } from '@/types'
import { clsx } from 'clsx'

const tabs: { id: AppSection; label: string; icon: React.ReactNode }[] = [
  { id: 'pads', label: 'Pads', icon: <Grid3X3 size={18} /> },
  { id: 'keys', label: 'Keys', icon: <Piano size={18} /> },
  { id: 'forge', label: 'Forge', icon: <Sparkles size={18} /> },
  { id: 'loops', label: 'Loops', icon: <Repeat size={18} /> },
  { id: 'voice', label: 'Voice', icon: <Mic size={18} /> },
  { id: 'sequencer', label: 'Seq', icon: <ListMusic size={18} /> },
  { id: 'mixer', label: 'Mix', icon: <Sliders size={18} /> },
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
              'flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-all min-w-0 flex-1',
              activeSection === tab.id
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {tab.icon}
            <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
