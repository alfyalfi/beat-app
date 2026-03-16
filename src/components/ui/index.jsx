import { X } from 'lucide-react'

export function Btn({ children, variant='primary', size='md', className='', ...props }) {
  const base = 'inline-flex items-center gap-2 font-body font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' }
  const variants = {
    primary: 'bg-beat-cyan text-beat-bg font-semibold hover:shadow-glow-cyan active:scale-95',
    yellow:  'bg-beat-yellow text-beat-bg font-semibold hover:shadow-glow-yellow active:scale-95',
    ghost:   'card-glass text-beat-text hover:border-beat-cyan/30 active:scale-95',
    danger:  'bg-beat-coral/10 text-beat-coral border border-beat-coral/30 hover:bg-beat-coral/20',
    yellow:  'bg-beat-yellow text-beat-bg font-semibold hover:shadow-glow-yellow active:scale-95',
    outline: 'border border-beat-border text-beat-sub hover:text-beat-text hover:border-beat-bordhi',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Badge({ label, color='gray' }) {
  const colors = {
    cyan:   'text-beat-cyan   bg-beat-cyan/10   border-beat-cyan/30',
    yellow: 'text-beat-yellow bg-beat-yellow/10 border-beat-yellow/30',
    purple: 'text-beat-purple bg-beat-purple/10 border-beat-purple/30',
    coral:  'text-beat-coral  bg-beat-coral/10  border-beat-coral/30',
    green:  'text-beat-green  bg-beat-green/10  border-beat-green/30',
    teal:   'text-beat-cyan   bg-beat-cyan/10   border-beat-cyan/30',
    amber:  'text-beat-yellow bg-beat-yellow/10 border-beat-yellow/30',
    gray:   'text-beat-sub    bg-beat-surface    border-beat-border',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-body ${colors[color] || colors.gray}`}>
      {label}
    </span>
  )
}

export function Modal({ open, onClose, title, children, width='max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"/>
      <div className={`relative w-full ${width} card-glass rounded-t-2xl sm:rounded-2xl animate-slide-up max-h-[90vh] overflow-y-auto border-beat-cyan/20`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-beat-border sticky top-0 bg-beat-card/90 backdrop-blur z-10">
          <h2 className="font-display text-xs tracking-widest text-beat-cyan uppercase">{title}</h2>
          <button onClick={onClose} className="text-beat-muted hover:text-beat-cyan transition-colors p-1 rounded">
            <X size={16}/>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Card({ children, className='', glow=false }) {
  return (
    <div className={`card-glass rounded-xl ${glow ? 'neon-border-cyan' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function Input({ label, error, className='', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-medium text-beat-sub font-body uppercase tracking-wider">{label}</label>}
      <input
        className={`w-full bg-beat-surface border border-beat-border rounded-lg px-3 py-2.5 text-sm text-beat-text font-body placeholder-beat-muted focus:outline-none focus:border-beat-cyan focus:shadow-glow-sm transition-all ${error ? 'border-beat-coral' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-beat-coral">{error}</span>}
    </div>
  )
}

export function Select({ label, children, className='', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-medium text-beat-sub font-body uppercase tracking-wider">{label}</label>}
      <select
        className={`w-full bg-beat-surface border border-beat-border rounded-lg px-3 py-2.5 text-sm text-beat-text font-body focus:outline-none focus:border-beat-cyan transition-all ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export function Textarea({ label, className='', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-medium text-beat-sub font-body uppercase tracking-wider">{label}</label>}
      <textarea
        className={`w-full bg-beat-surface border border-beat-border rounded-lg px-3 py-2.5 text-sm text-beat-text font-body placeholder-beat-muted focus:outline-none focus:border-beat-cyan transition-all resize-none ${className}`}
        rows={3}
        {...props}
      />
    </div>
  )
}

export function Slider({ label, value, onChange, color = '#00e5ff' }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-body text-beat-sub uppercase tracking-wider">{label}</span>
        <span className="text-sm font-display font-bold" style={{ color, textShadow: `0 0 8px ${color}` }}>{value}</span>
      </div>
      <div className="relative">
        <input
          type="range" min={0} max={100} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: color }}
        />
        <div className="absolute top-0 left-0 h-1 rounded-full pointer-events-none transition-all"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}`, opacity: 0.7 }}/>
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="text-4xl opacity-20">{icon}</div>
      <p className="text-beat-text font-body font-medium">{title}</p>
      {subtitle && <p className="text-beat-sub font-body text-sm max-w-xs">{subtitle}</p>}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-beat-border border-t-beat-cyan rounded-full animate-spin"
           style={{ boxShadow: '0 0 12px rgba(0,229,255,0.4)' }}/>
    </div>
  )
}

export function SectionTitle({ children }) {
  return (
    <h2 className="font-display text-[10px] text-beat-cyan uppercase tracking-[0.2em] mb-3 neon-text-cyan opacity-80">
      {children}
    </h2>
  )
}
