# BEAT — Band Entry & Attendance Tracker

Aplikasi PWA untuk mencatat absensi latihan band dan perkembangan skill anggota.

## Tech Stack

- React 18 + Vite
- TailwindCSS (dark theme)
- Recharts (radar chart)
- Dexie (IndexedDB wrapper)
- XLSX (import/export Excel)
- Vite PWA Plugin (manifest + service worker)
- Google Sheets API (cloud sync)

## Cara Menjalankan

### 1. Install dependencies

```bash
cd beat
npm install
```

### 2. Setup environment variables

```bash
cp .env.example .env
```

Isi `.env` dengan:
```
VITE_SHEETS_API_KEY=your_api_key
VITE_SPREADSHEET_ID=your_spreadsheet_id
```

> **Catatan:** Aplikasi berjalan 100% offline tanpa API key.
> Google Sheets sync hanya aktif jika keduanya diisi.

### 3. Jalankan dev server

```bash
npm run dev
```

Buka http://localhost:5173

### 4. Build untuk produksi

```bash
npm run build
npm run preview
```

---

## Setup Google Sheets (Opsional)

### A. Buat Spreadsheet
1. Buka Google Sheets, buat spreadsheet baru
2. Buat 5 sheet dengan nama persis:
   - `groups`
   - `members`
   - `sessions`
   - `attendance`
   - `stats_history`
3. Pada setiap sheet, tambahkan header di baris pertama (lihat kolom di `src/services/sheets.js`)

### B. Aktifkan Sheets API
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru
3. Enable "Google Sheets API"
4. Buat API Key (Credentials → Create Credentials → API Key)
5. Salin Spreadsheet ID dari URL: `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

---

## Struktur Project

```
src/
├── components/
│   ├── ui/          # Button, Badge, Modal, Card, Slider, dll.
│   ├── layout/      # Navbar, BottomNav
│   └── charts/      # MemberRadar, ScoreCards
├── pages/
│   ├── Dashboard.jsx
│   ├── Sessions.jsx  # + AttendancePage
│   ├── Members.jsx
│   ├── Stats.jsx
│   └── Settings.jsx  # Data management panel
├── services/
│   ├── indexeddb.js  # Dexie DB + semua operasi
│   ├── sheets.js     # Google Sheets API
│   ├── sync.js       # Offline sync queue
│   └── importExport.js # Excel + JSON backup
├── hooks/
│   └── index.js      # useMembers, useSessions, useAttendance, useStats
├── context/
│   └── AppContext.jsx # GroupContext + SyncContext
└── utils/
    ├── constants.js   # Status, instruments, skill vars
    └── helpers.js     # ID generator, formatters, helpers
```

## Fitur Utama

- **Quick Attendance Mode** — semua anggota default Hadir, trainer hanya mengubah yang perlu
- **Anti-duplikat** — attendance_id deterministik (`session_id + member_id`)
- **Radar Chart** — visualisasi 5 variabel skill per anggota (Recharts)
- **Offline-first** — semua data tersimpan di IndexedDB
- **Sync queue** — perubahan offline disinkronkan otomatis saat online
- **Import Excel** — onboarding anggota dari spreadsheet
- **Backup/Restore JSON** — cadangan data per grup
- **Multi-grup** — data terpisah sempurna per `group_id`

## Import Template Excel

Buat file `.xlsx` dengan kolom:

| name | instrument | angkatan | notes |
|------|-----------|----------|-------|
| Andi Pratama | Gitar | 2023 | |
| Budi Santoso | Drum  | 2022 | |
