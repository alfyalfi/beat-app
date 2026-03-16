import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { requestToken, getToken, getUser, saveUser, logout, isLoggedIn, isConfigured } from '../services/auth'
import { initSheetHeaders } from '../services/sheets'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(getUser)
  const [loggedIn, setLoggedIn] = useState(isLoggedIn)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [synced,   setSynced]   = useState(false)

  // Cek token masih valid saat mount
  useEffect(() => {
    const token = getToken()
    if (!token && loggedIn) {
      setLoggedIn(false)
      setUser(null)
    }
  }, [])

  const login = useCallback(async () => {
    if (!isConfigured()) {
      setError('OAuth Client ID belum dikonfigurasi')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const token = await requestToken()
      // Ambil info user dari tokeninfo endpoint
      const infoRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`)
      const info    = await infoRes.json()
      const userData = { email: info.email, name: info.email?.split('@')[0] }
      saveUser(userData)
      setUser(userData)
      setLoggedIn(true)

      // Inisialisasi header sheets jika belum ada
      try {
        await initSheetHeaders()
        setSynced(true)
      } catch (e) {
        console.warn('Header init failed:', e.message)
      }
    } catch (e) {
      setError(e.message || 'Login gagal')
    }
    setLoading(false)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    setUser(null)
    setLoggedIn(false)
    setSynced(false)
  }, [])

  return (
    <AuthCtx.Provider value={{ user, loggedIn, loading, error, synced, login, logout: handleLogout, isConfigured: isConfigured() }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
