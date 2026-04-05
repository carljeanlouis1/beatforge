import { Sparkles, Library } from 'lucide-react'
import { PromptInput } from '@/components/AIForge/PromptInput'
import { PromptSuggestions } from '@/components/AIForge/PromptSuggestions'
import { GenerationControls } from '@/components/AIForge/GenerationControls'
import { SoundPreview } from '@/components/AIForge/SoundPreview'
import { SoundLibrary } from '@/components/AIForge/SoundLibrary'

export function AIForge() {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Main generation card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500
            flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">AI Sound Forge</h2>
            <p className="text-xs text-slate-400">Describe any sound and bring it to life</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          <PromptInput />
          <PromptSuggestions />

          <div className="border-t border-slate-100 pt-4">
            <GenerationControls />
          </div>

          <SoundPreview />
        </div>
      </div>

      {/* Sound library card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center gap-2">
          <Library className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Sound Library</h3>
        </div>
        <div className="px-5 pb-5">
          <SoundLibrary />
        </div>
      </div>
    </div>
  )
}
