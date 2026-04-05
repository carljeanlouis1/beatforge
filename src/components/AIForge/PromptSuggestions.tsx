import { useState } from 'react'
import { useSoundForgeStore } from '@/stores/useSoundForgeStore'
import { PROMPT_CATEGORIES, PROMPT_SUGGESTIONS } from '@/utils/prompts'
import type { PromptSuggestion } from '@/utils/prompts'

export function PromptSuggestions() {
  const [activeCategory, setActiveCategory] = useState('drums')
  const setPrompt = useSoundForgeStore((s) => s.setPrompt)
  const setCategory = useSoundForgeStore((s) => s.setCategory)
  const setDuration = useSoundForgeStore((s) => s.setDuration)
  const isGenerating = useSoundForgeStore((s) => s.isGenerating)

  const filteredSuggestions = PROMPT_SUGGESTIONS.filter(
    (s) => s.category === activeCategory
  )

  function handleSuggestionClick(suggestion: PromptSuggestion) {
    setPrompt(suggestion.prompt)
    setCategory(suggestion.category)
    setDuration(suggestion.duration)
  }

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-select">
        {PROMPT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            disabled={isGenerating}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150
              ${activeCategory === cat.id
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100 hover:text-slate-700'
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Suggestion pills */}
      <div className="flex flex-wrap gap-2">
        {filteredSuggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-full text-xs font-medium
              bg-white border border-slate-200 text-slate-600
              hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50
              active:scale-95 transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  )
}
