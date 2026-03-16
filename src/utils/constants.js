export const ATTENDANCE_STATUS = [
  { key: 'hadir',  label: 'Hadir',  color: 'teal'   },
  { key: 'izin',   label: 'Izin',   color: 'amber'  },
  { key: 'sakit',  label: 'Sakit',  color: 'purple' },
  { key: 'alpha',  label: 'Alpha',  color: 'coral'  },
]

export const MEMBER_STATUS = [
  { key: 'active',   label: 'Active'   },
  { key: 'inactive', label: 'Inactive' },
  { key: 'alumni',   label: 'Alumni'   },
  { key: 'on_leave', label: 'On Leave' },
]

export const INSTRUMENTS = [
  'Vokal', 'Gitar', 'Bass', 'Drum', 'Keyboard',
  'Rhythm Guitar', 'Lead Guitar', 'Backing Vocal', 'Perkusi', 'Lainnya'
]

export const SKILL_VARS = [
  { key: 'loyalitas',   label: 'Loyalitas',   color: '#c8f53d' },
  { key: 'skill',       label: 'Skill',       color: '#a78bfa' },
  { key: 'kreativitas', label: 'Kreativitas', color: '#2dd4bf' },
  { key: 'attitude',    label: 'Attitude',    color: '#fbbf24' },
  { key: 'synergy',     label: 'Synergy',     color: '#fb7185' },
]

export const DEFAULT_SCORES = {
  loyalitas: 50, skill: 50, kreativitas: 50, attitude: 50, synergy: 50
}

export const STATUS_COLOR = {
  hadir:  'text-beat-teal  bg-beat-teal/10  border-beat-teal/30',
  izin:   'text-beat-amber bg-beat-amber/10 border-beat-amber/30',
  sakit:  'text-beat-purple bg-beat-purple/10 border-beat-purple/30',
  alpha:  'text-beat-coral bg-beat-coral/10  border-beat-coral/30',
}

export const SHEETS_TABLES = ['groups','members','sessions','attendance','stats_history']
