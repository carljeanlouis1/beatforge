import { get, set, del, keys, entries } from 'idb-keyval'
import type { StoredSound, CustomDrumKit } from '@/types'

const PREFIX = 'sound:'
const KIT_PREFIX = 'kit:'

function soundKey(id: string): string {
  return `${PREFIX}${id}`
}

export async function saveSound(sound: StoredSound): Promise<void> {
  await set(soundKey(sound.id), sound)
}

export async function getSound(id: string): Promise<StoredSound | undefined> {
  return get<StoredSound>(soundKey(id))
}

export async function getAllSounds(): Promise<StoredSound[]> {
  const allEntries = await entries<string, StoredSound>()
  return allEntries
    .filter(([key]) => key.startsWith(PREFIX))
    .map(([, value]) => value)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteSound(id: string): Promise<void> {
  await del(soundKey(id))
}

export async function renameSound(id: string, newName: string): Promise<void> {
  const sound = await getSound(id)
  if (!sound) {
    throw new Error(`Sound with id "${id}" not found`)
  }
  await set(soundKey(id), { ...sound, name: newName })
}

export async function getSoundIds(): Promise<string[]> {
  const allKeys = await keys<string>()
  return allKeys
    .filter((key) => key.startsWith(PREFIX))
    .map((key) => key.slice(PREFIX.length))
}

// --- Kit Storage ---

function kitKey(id: string): string {
  return `${KIT_PREFIX}${id}`
}

export async function saveKit(kit: CustomDrumKit): Promise<void> {
  await set(kitKey(kit.id), kit)
}

export async function getKit(id: string): Promise<CustomDrumKit | undefined> {
  return get<CustomDrumKit>(kitKey(id))
}

export async function getAllKits(): Promise<CustomDrumKit[]> {
  const allEntries = await entries<string, CustomDrumKit>()
  return allEntries
    .filter(([key]) => key.startsWith(KIT_PREFIX))
    .map(([, value]) => value)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteKit(id: string): Promise<void> {
  await del(kitKey(id))
}
