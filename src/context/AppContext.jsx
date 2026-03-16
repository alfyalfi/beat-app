import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { groupsDB, syncQueueDB } from '../services/indexeddb'
import { initSync, runSync } from '../services/sync'

// ── Group Context ──────────────────────────────────────────
const GroupCtx = createContext(null)

export function GroupProvider({ children }) {
  const [groups,      setGroups]      = useState([])
  const [activeGroup, setActiveGroupState] = useState(null)
  const [loading,     setLoading]     = useState(true)

  const loadGroups = useCallback(async () => {
    const gs = await groupsDB.getAll()
    setGroups(gs)
    // Restore last active group
    const lastId = localStorage.getItem('beat_active_group')
    const found  = gs.find(g => g.group_id === lastId) ?? gs[0] ?? null
    setActiveGroupState(found)
    setLoading(false)
  }, [])

  useEffect(() => { loadGroups() }, [loadGroups])

  const setActiveGroup = useCallback((g) => {
    setActiveGroupState(g)
    if (g) localStorage.setItem('beat_active_group', g.group_id)
  }, [])

  const refreshGroups = useCallback(async () => {
    const gs = await groupsDB.getAll()
    setGroups(gs)
    // If active group was updated, refresh it
    if (activeGroup) {
      const updated = gs.find(g => g.group_id === activeGroup.group_id)
      if (updated) setActiveGroupState(updated)
    }
  }, [activeGroup])

  return (
    <GroupCtx.Provider value={{ groups, activeGroup, setActiveGroup, loading, refreshGroups }}>
      {children}
    </GroupCtx.Provider>
  )
}

export const useGroup = () => useContext(GroupCtx)

// ── Sync Context ───────────────────────────────────────────
const SyncCtx = createContext(null)

export function SyncProvider({ children }) {
  const [isOnline,     setIsOnline]     = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing,    setIsSyncing]    = useState(false)

  useEffect(() => {
    initSync()
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      const c = await syncQueueDB.countPending()
      setPendingCount(c)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const syncNow = useCallback(async () => {
    setIsSyncing(true)
    await runSync()
    setIsSyncing(false)
    const c = await syncQueueDB.countPending()
    setPendingCount(c)
  }, [])

  return (
    <SyncCtx.Provider value={{ isOnline, pendingCount, isSyncing, syncNow }}>
      {children}
    </SyncCtx.Provider>
  )
}

export const useSync = () => useContext(SyncCtx)
