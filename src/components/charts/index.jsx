import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend
} from 'recharts'
import { SKILL_VARS } from '../../utils/constants'

function buildData(scores) {
  return SKILL_VARS.map(v => ({
    label:  v.label,
    value:  scores?.[v.key] ?? 0,
  }))
}

export function MemberRadar({ latest, previous }) {
  const hasData = latest?.scores
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-56 text-beat-muted text-sm font-body">
        Belum ada data penilaian
      </div>
    )
  }

  const data = SKILL_VARS.map(v => ({
    label:    v.label,
    Terkini:  latest.scores[v.key]  ?? 0,
    ...(previous ? { 'Sesi lalu': previous.scores[v.key] ?? 0 } : {}),
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="#2a2a2a" strokeWidth={0.8}/>
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: '#a3a3a3', fontSize: 11, fontFamily: 'DM Sans' }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: '#525252', fontSize: 9 }}
            axisLine={false}
            tickCount={5}
          />
          {previous && (
            <Radar
              name="Sesi lalu"
              dataKey="Sesi lalu"
              stroke="#2dd4bf"
              fill="#2dd4bf"
              fillOpacity={0.08}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )}
          <Radar
            name="Terkini"
            dataKey="Terkini"
            stroke="#c8f53d"
            fill="#c8f53d"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: 10, fontSize: 12, fontFamily: 'DM Sans'
            }}
            itemStyle={{ color: '#e5e5e5' }}
          />
          {previous && <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans', color: '#a3a3a3' }}/>}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScoreCards({ scores, prevScores }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {SKILL_VARS.map(v => {
        const val  = scores?.[v.key]  ?? 0
        const prev = prevScores?.[v.key] ?? val
        const delta = val - prev
        return (
          <div key={v.key} className="bg-beat-surface rounded-xl p-2 text-center border border-beat-border">
            <div className="text-[10px] font-body text-beat-muted mb-1 truncate">{v.label}</div>
            <div className="text-base font-display" style={{ color: v.color }}>{val}</div>
            {delta !== 0 && (
              <div className={`text-[9px] font-body ${delta > 0 ? 'text-beat-teal' : 'text-beat-coral'}`}>
                {delta > 0 ? '+' : ''}{delta}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
