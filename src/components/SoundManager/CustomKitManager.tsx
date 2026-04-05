import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Save,
  FolderOpen,
  Trash2,
  Pencil,
  Check,
  X,
  RotateCcw,
  Drum,
  Music,
} from 'lucide-react'
import { useCustomKitStore } from '@/stores/useCustomKitStore'
import { clsx } from 'clsx'
import type { CustomDrumKit } from '@/types'

function KitRow({ kit }: { kit: CustomDrumKit }) {
  const loadKit = useCustomKitStore((s) => s.loadKit)
  const deleteKit = useCustomKitStore((s) => s.deleteKit)
  const renameKit = useCustomKitStore((s) => s.renameKit)
  const activeKitId = useCustomKitStore((s) => s.activeKitId)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(kit.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const isActive = activeKitId === kit.id

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleRename = useCallback(async () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== kit.name) {
      await renameKit(kit.id, trimmed)
    }
    setIsEditing(false)
  }, [editName, kit.id, kit.name, renameKit])

  const handleDelete = useCallback(async () => {
    await deleteKit(kit.id)
  }, [kit.id, deleteKit])

  const dateStr = new Date(kit.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  const builtinCount = kit.sounds.filter((s) => s.sourceType === 'builtin').length
  const customCount = kit.sounds.length - builtinCount

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150',
        isActive
          ? 'bg-indigo-50 border-indigo-200'
          : 'bg-white border-slate-200 hover:border-slate-300'
      )}
    >
      {/* Kit icon */}
      <div
        className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
          isActive
            ? 'bg-indigo-100 text-indigo-600'
            : 'bg-slate-100 text-slate-400'
        )}
      >
        <Drum className="w-4 h-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleRename()
                if (e.key === 'Escape') setIsEditing(false)
              }}
              className="flex-1 text-sm font-medium text-slate-700 bg-slate-50
                border border-slate-200 rounded px-1.5 py-0.5
                focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={() => void handleRename()}
              className="p-1 rounded hover:bg-emerald-50 text-emerald-600"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-700 truncate">
            {kit.name}
            {isActive && (
              <span className="ml-1.5 text-[10px] font-semibold text-indigo-500">
                ACTIVE
              </span>
            )}
          </p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-400">
            {kit.sounds.length} sounds
          </span>
          {customCount > 0 && (
            <span className="text-[10px] text-purple-500 font-medium">
              {customCount} custom
            </span>
          )}
          <span className="text-[10px] text-slate-400">{dateStr}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => loadKit(kit.id)}
          className={clsx(
            'p-1.5 rounded-lg transition-colors duration-150',
            isActive
              ? 'text-indigo-400'
              : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'
          )}
          title="Load kit"
        >
          <FolderOpen className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setEditName(kit.name)
            setIsEditing(true)
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400
            hover:text-slate-600 transition-colors duration-150"
          title="Rename"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={() => void handleDelete()}
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400
            hover:text-red-500 transition-colors duration-150"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export function CustomKitManager() {
  const kits = useCustomKitStore((s) => s.kits)
  const activeKitId = useCustomKitStore((s) => s.activeKitId)
  const saveCurrentAsKit = useCustomKitStore((s) => s.saveCurrentAsKit)
  const restoreDefaults = useCustomKitStore((s) => s.restoreDefaults)
  const initDefaultKit = useCustomKitStore((s) => s.initDefaultKit)
  const loadKitsFromStorage = useCustomKitStore((s) => s.loadKitsFromStorage)

  const [showNameInput, setShowNameInput] = useState(false)
  const [kitName, setKitName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initDefaultKit()
    void loadKitsFromStorage()
  }, [initDefaultKit, loadKitsFromStorage])

  useEffect(() => {
    if (showNameInput && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [showNameInput])

  const handleSave = useCallback(async () => {
    const trimmed = kitName.trim()
    if (!trimmed) return

    setIsSaving(true)
    try {
      await saveCurrentAsKit(trimmed)
      setKitName('')
      setShowNameInput(false)
    } finally {
      setIsSaving(false)
    }
  }, [kitName, saveCurrentAsKit])

  const activeKit = kits.find((k) => k.id === activeKitId)

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Custom Drum Kits</h2>
            {activeKit && (
              <p className="text-[10px] text-indigo-500 font-medium">
                Active: {activeKit.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={restoreDefaults}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
              text-slate-500 bg-slate-50 border border-slate-200
              hover:bg-slate-100 hover:text-slate-700 transition-all duration-150"
            title="Restore default sounds"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Defaults</span>
          </button>
          <button
            onClick={() => setShowNameInput(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
              text-white bg-gradient-to-r from-indigo-500 to-purple-500
              shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-300
              active:scale-[0.98] transition-all duration-150"
          >
            <Save className="w-3 h-3" />
            <span className="hidden sm:inline">Save Kit</span>
          </button>
        </div>
      </div>

      {/* Save name input */}
      {showNameInput && (
        <div className="mb-3 flex items-center gap-2 animate-slide-up">
          <input
            ref={nameInputRef}
            value={kitName}
            onChange={(e) => setKitName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSave()
              if (e.key === 'Escape') {
                setShowNameInput(false)
                setKitName('')
              }
            }}
            placeholder="Kit name..."
            className="flex-1 text-sm text-slate-700 bg-slate-50 border border-slate-200
              rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300
              focus:border-indigo-300 placeholder:text-slate-400"
          />
          <button
            onClick={() => void handleSave()}
            disabled={!kitName.trim() || isSaving}
            className="px-3 py-2 rounded-lg text-sm font-medium text-white
              bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50
              disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setShowNameInput(false)
              setKitName('')
            }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Kit list */}
      {kits.length === 0 ? (
        <div className="text-center py-6">
          <Drum className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            Save your first custom kit to switch between sound setups!
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {kits.map((kit) => (
            <KitRow key={kit.id} kit={kit} />
          ))}
        </div>
      )}
    </div>
  )
}
