import { memo } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts'
import { SKILL_VARS } from '../../utils/constants'

const TIP = {
  contentStyle: {
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 10,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    color: '#0f1117',
  },
  itemStyle: { color: '#4a5568' },
  labelStyle: { color: '#9aa0ad', fontWeight: 600 },
}

export const MemberRadar = memo(function MemberRadar({ latest, previous }) {
  if (!latest?.scores) return (
    <div className="flex items-center justify-center h-56 text-m-muted text-sm font-body">
      Belum ada data penilaian
    </div>
  )
  const data = SKILL_VARS.map(v => ({
    label: v.label,
    Terkini: latest.scores[v.key] ?? 0,
    ...(previous ? { 'Sesi lalu': previous.scores[v.key] ?? 0 } : {}),
  }))
  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
          <PolarGrid stroke="rgba(0,0,0,0.08)" strokeWidth={0.8}/>
          <PolarAngleAxis dataKey="label" tick={{ fill: '#4a5568', fontSize: 11, fontFamily: 'Inter' }}/>
          <PolarRadiusAxis domain={[0,100]} tick={{ fill: '#9aa0ad', fontSize: 9 }} axisLine={false} tickCount={4}/>
          {previous && (
            <Radar name="Sesi lalu" dataKey="Sesi lalu"
              stroke="rgba(245,166,35,0.5)" fill="rgba(245,166,35,0.08)"
              strokeWidth={1.5} strokeDasharray="4 3"/>
          )}
          <Radar name="Terkini" dataKey="Terkini"
            stroke="var(--accent, #00b4d8)" fill="rgba(0,180,216,0.08)"
            strokeWidth={2} dot={{ fill: 'var(--accent, #00b4d8)', r: 3 }}/>
          <Tooltip {...TIP}/>
          {previous && <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Inter', color: '#9aa0ad' }}/>}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
})

export const ScoreCards = memo(function ScoreCards({ scores, prevScores }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {SKILL_VARS.map(v => {
        const val   = scores?.[v.key] ?? 0
        const prev  = prevScores?.[v.key] ?? val
        const delta = val - prev
        return (
          <div key={v.key} className="bg-white rounded-xl p-2 text-center border border-m-border">
            <div className="text-[9px] font-body text-m-muted mb-1 truncate">{v.label}</div>
            <div className="text-sm font-display font-bold" style={{ color: v.color }}>{val}</div>
            {delta !== 0 && (
              <div className={`text-[9px] font-body mt-0.5 ${delta > 0 ? 'text-m-green' : 'text-m-coral'}`}>
                {delta > 0 ? '+' : ''}{delta}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

export const AttendanceTrendChart = memo(function AttendanceTrendChart({ data }) {
  if (!data?.length) return (
    <div className="flex items-center justify-center h-48 text-m-muted text-sm font-body">
      Belum ada data absensi
    </div>
  )
  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -22 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false}/>
          <XAxis dataKey="label" tick={{ fill: '#9aa0ad', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fill: '#9aa0ad', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false} allowDecimals={false}/>
          <Tooltip {...TIP}/>
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Inter', color: '#9aa0ad', paddingTop: 8 }}/>
          <Bar dataKey="Hadir" fill="#00b4d8" radius={[3,3,0,0]}/>
          <Bar dataKey="Izin"  fill="#f5a623" radius={[3,3,0,0]}/>
          <Bar dataKey="Sakit" fill="#8b5cf6" radius={[3,3,0,0]}/>
          <Bar dataKey="Alpha" fill="#f05252" radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

export const AttendanceRateChart = memo(function AttendanceRateChart({ data }) {
  if (!data?.length) return null
  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false}/>
          <XAxis dataKey="label" tick={{ fill: '#9aa0ad', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} unit="%" tick={{ fill: '#9aa0ad', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false}/>
          <Tooltip {...TIP} formatter={v => [`${v}%`, '% Hadir']}/>
          <Line type="monotone" dataKey="pctHadir" stroke="#00b4d8" strokeWidth={2}
            dot={{ fill: '#00b4d8', r: 3 }} activeDot={{ r: 5 }} name="% Hadir"/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

export const MemberRankingChart = memo(function MemberRankingChart({ data, color = '#00b4d8', valueLabel = 'Nilai' }) {
  if (!data?.length) return null
  const h = Math.max(160, data.length * 34 + 40)
  return (
    <div className="w-full" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false}/>
          <XAxis type="number" domain={[0,100]} tick={{ fill: '#9aa0ad', fontSize: 10, fontFamily: 'Inter' }} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="name" width={80}
            tick={{ fill: '#4a5568', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false}/>
          <Tooltip {...TIP} formatter={v => [v, valueLabel]}/>
          <Bar dataKey="value" fill={color} radius={[0,4,4,0]}
            label={{ position: 'right', fill: color, fontSize: 11, fontFamily: 'Inter', fontWeight: 600 }}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})
