import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useSoundForgeStore } from '@/stores/useSoundForgeStore'
import { PLACEHOLDER_PROMPTS } from '@/utils/prompts'

export function PromptInput() {
  const prompt = useSoundForgeStore((s) => s.prompt)
  const setPrompt = useSoundForgeStore((s) => s.setPrompt)
  const isGenerating = useSoundForgeStore((s) => s.isGenerating)

  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_PROMPTS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const maxLength = 500

  return (
    <div className="relative">
      <div className="flex items-start gap-3">
        <div className="mt-3 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, maxLength))}
            placeholder={PLACEHOLDER_PROMPTS[placeholderIndex]}
            disabled={isGenerating}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800
              placeholder:text-slate-400 resize-none
              focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 text-sm leading-relaxed"
          />
          <div className="absolute bottom-2 right-3 text-xs text-slate-400">
            {prompt.length}/{maxLength}
          </div>
        </div>
      </div>
    </div>
  )
}
