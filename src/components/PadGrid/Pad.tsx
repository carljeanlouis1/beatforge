import { useCallback, useRef } from 'react'
import { PAD_COLOR_HEX } from '@/utils/constants'
import type { PadConfig } from '@/types'
import clsx from 'clsx'

interface PadProps {
  padConfig: PadConfig
  isActive: boolean
  keyboardShortcut?: string
  onTrigger: (padId: string) => void
  onContextMenu: (padId: string, rect: DOMRect) => void
}

export function Pad({ padConfig, isActive, keyboardShortcut, onTrigger, onContextMenu }: PadProps) {
  const padRef = useRef<HTMLButtonElement>(null)
  const rippleRef = useRef<HTMLSpanElement>(null)

  const bgColor = PAD_COLOR_HEX[padConfig.color] ?? '#94a3b8'

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      onTrigger(padConfig.id)

      // Ripple effect
      if (rippleRef.current) {
        const el = rippleRef.current
        el.classList.remove('animate-pad-pulse')
        // Force reflow
        void el.offsetWidth
        el.classList.add('animate-pad-pulse')
      }
    },
    [padConfig.id, onTrigger]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (padRef.current) {
        const rect = padRef.current.getBoundingClientRect()
        onContextMenu(padConfig.id, rect)
      }
    },
    [padConfig.id, onContextMenu]
  )

  return (
    <button
      ref={padRef}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      className={clsx(
        'relative aspect-square rounded-2xl no-select cursor-pointer',
        'flex flex-col items-center justify-center gap-0.5',
        'transition-shadow duration-100',
        'outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400',
        isActive && 'animate-pad-press'
      )}
      style={{
        backgroundColor: bgColor,
        touchAction: 'none',
        boxShadow: isActive
          ? `0 0 20px ${bgColor}80, 0 4px 12px ${bgColor}40`
          : `0 2px 8px ${bgColor}30`,
      }}
    >
      {/* White overlay gradient for light theme look */}
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, transparent 60%)',
        }}
      />

      {/* Ripple element */}
      <span
        ref={rippleRef}
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ color: bgColor }}
      />

      {/* Content */}
      <span className="relative text-white font-semibold text-xs sm:text-sm leading-tight drop-shadow-sm truncate max-w-[90%]">
        {padConfig.label}
      </span>
      {keyboardShortcut && (
        <span className="relative text-white/70 text-[10px] font-mono uppercase leading-none">
          {keyboardShortcut}
        </span>
      )}
    </button>
  )
}
