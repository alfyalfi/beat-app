import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend
} from 'recharts'
import { SKILL_VARS } from '../../utils/constants'

export function MemberRadar({ latest, previous }) {
  if (!latest?.scores) {
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
        <RadarChart data={data} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
          <PolarGrid stroke="rgba(0,229,255,0.12)" strokeWidth={0.8}/>
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: '#8888aa', fontSize: 11, fontFamily: 'DM Sans' }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: '#44445a', fontSize: 9 }}
            axisLine={false}
            tickCount={5}
          />
          {previous && (
            <Radar name="Sesi lalu" dataKey="Sesi lalu"
              stroke="rgba(255,230,0,0.4)" fill="rgba(255,230,0,0.06)"
              strokeWidth={1.5} strokeDasharray="4 3"/>
          )}
          <Radar name="Terkini" dataKey="Terkini"
            stroke="#00e5ff" fill="rgba(0,229,255,0.1)"
            strokeWidth={2} dot={{ fill: '#00e5ff', r: 3, filter: 'drop-shadow(0 0 4px #00e5ff)' }}/>
          <Tooltip
            contentStyle={{
              background: 'rgba(13,13,20,0.95)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'DM Sans',
              boxShadow: '0 0 20px rgba(0,229,255,0.15)',
            }}
            itemStyle={{ color: '#e8e8f0' }}
          />
          {previous && (
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans', color: '#8888aa' }}/>
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScoreCards({ scores, prevScores }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {SKILL_VARS.map(v => {
        const val   = scores?.[v.key]  ?? 0
        const prev  = prevScores?.[v.key] ?? val
        const delta = val - prev
        return (
          <div key={v.key} className="bg-beat-surface rounded-xl p-2 text-center border border-beat-border">
            <div className="text-[9px] font-body text-beat-muted mb-1 truncate">{v.label}</div>
            <div className="text-sm font-display font-bold"
              style={{ color: v.color, textShadow: `0 0 8px ${v.color}60` }}>{val}</div>
            {delta !== 0 && (
              <div className={`text-[9px] font-body mt-0.5 ${delta > 0 ? 'text-beat-green' : 'text-beat-coral'}`}>
                {delta > 0 ? '+' : ''}{delta}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
