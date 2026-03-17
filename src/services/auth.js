// Google OAuth2 menggunakan Google Identity Services (GIS)
// Tidak butuh backend — token langsung di browser

const CLIENT_ID  = import.meta.env.VITE_OAUTH_CLIENT_ID || ''
const SCOPES     = 'https://www.googleapis.com/auth/spreadsheets'
const TOKEN_KEY  = 'mentor_oauth_token'
const EXPIRY_KEY = 'mentor_oauth_expiry'
const USER_KEY   = 'mentor_oauth_user'

let tokenClient = null

// Load GIS script sekali saja
function loadGIS() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    const existing = document.getElementById('gis-script')
    if (existing) { existing.addEventListener('load', resolve); return }
    const script = document.createElement('script')
    script.id  = 'gis-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload  = resolve
    script.onerror = () => reject(new Error('Gagal memuat Google Sign-In'))
    document.head.appendChild(script)
  })
}

// Minta access token dari Google
export async function requestToken() {
  if (!CLIENT_ID) throw new Error('VITE_OAUTH_CLIENT_ID belum diisi di .env')
  await loadGIS()
  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     SCOPES,
      callback:  (response) => {
        if (response.error) { reject(new Error(response.error)); return }
        const expiry = Date.now() + (response.expires_in - 60) * 1000
        localStorage.setItem(TOKEN_KEY,  response.access_token)
        localStorage.setItem(EXPIRY_KEY, String(expiry))
        resolve(response.access_token)
      },
    })
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

// Ambil token yang masih valid
export function getToken() {
  const token  = localStorage.getItem(TOKEN_KEY)
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0)
  if (!token || Date.now() > expiry) return null
  return token
}

// Simpan info user (dari Google People API atau decode token)
export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') }
  catch { return null }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)
  localStorage.removeItem(USER_KEY)
  if (window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(localStorage.getItem(TOKEN_KEY) || '', () => {})
  }
}

export function isLoggedIn() {
  return !!getToken()
}

export const isConfigured = () => !!CLIENT_ID
