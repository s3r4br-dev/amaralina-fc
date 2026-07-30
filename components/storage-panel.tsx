"use client"

// DEPRECATED - Storage is now managed by Supabase
// This stub exists only for backwards compatibility

export function getStorageStats() {
  return { used: 0, total: 100, percentage: 0, isNearFull: false }
}

export function canSaveData() {
  return true
}

export function StoragePanel() {
  return null
}

export default StoragePanel
