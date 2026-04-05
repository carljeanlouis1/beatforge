import { useState, useCallback } from 'react'
import { Pad } from '@/components/PadGrid/Pad'
import { PadSettings } from '@/components/PadGrid/PadSettings'
import { usePadStore } from '@/stores/usePadStore'
import { usePadKeyboard } from '@/hooks/usePadKeyboard'
import type { GridSize } from '@/types'
import { Grid2x2 } from 'lucide-react'
import clsx from 'clsx'

const GRID_SIZES: { size: GridSize; label: string }[] = [
  { size: 4, label: '4 x 4' },
  { size: 6, label: '6 x 6' },
  { size: 8, label: '8 x 8' },
]

const GRID_COLS: Record<GridSize, string> = {
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  8: 'grid-cols-8',
}

export function PadGrid() {
  const pads = usePadStore((s) => s.pads)
  const gridSize = usePadStore((s) => s.gridSize)
  const activePadIds = usePadStore((s) => s.activePadIds)
  const triggerPad = usePadStore((s) => s.triggerPad)
  const setGridSize = usePadStore((s) => s.setGridSize)

  const { pressedKeys, getKeyForPad } = usePadKeyboard()

  const [settingsTarget, setSettingsTarget] = useState<{
    padId: string
    rect: DOMRect
  } | null>(null)

  const handleTrigger = useCallback(
    (padId: string) => {
      triggerPad(padId)
    },
    [triggerPad]
  )

  const handleContextMenu = useCallback((padId: string, rect: DOMRect) => {
    setSettingsTarget({ padId, rect })
  }, [])

  const handleCloseSettings = useCallback(() => {
    setSettingsTarget(null)
  }, [])

  const visiblePads = pads.slice(0, gridSize * gridSize)

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Grid size selector */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
          <Grid2x2 size={16} className="text-slate-400" />
          Beat Pads
        </h2>
        <div className="flex gap-1">
          {GRID_SIZES.map(({ size, label }) => (
            <button
              key={size}
              onClick={() => setGridSize(size)}
              className={clsx(
                'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors',
                gridSize === size
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pad grid */}
      <div
        className={clsx(
          'grid gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm',
          GRID_COLS[gridSize]
        )}
      >
        {visiblePads.map((pad, index) => {
          const shortcut = getKeyForPad(index)
          const isKeyPressed = shortcut ? pressedKeys.has(shortcut) : false
          const isActive = activePadIds.includes(pad.id) || isKeyPressed

          return (
            <Pad
              key={pad.id}
              padConfig={pad}
              isActive={isActive}
              keyboardShortcut={shortcut}
              onTrigger={handleTrigger}
              onContextMenu={handleContextMenu}
            />
          )
        })}
      </div>

      {/* Keyboard hint */}
      {gridSize === 4 && (
        <p className="text-center text-[11px] text-slate-400 mt-2">
          Use keyboard keys <span className="font-mono">1-4</span>, <span className="font-mono">Q-R</span>, <span className="font-mono">A-F</span>, <span className="font-mono">Z-V</span> to play &middot; Right-click a pad to edit
        </p>
      )}

      {/* Pad settings popover */}
      {settingsTarget && (
        <PadSettings
          padId={settingsTarget.padId}
          anchorRect={settingsTarget.rect}
          onClose={handleCloseSettings}
        />
      )}
    </div>
  )
}
