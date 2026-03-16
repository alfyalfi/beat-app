import { X } from 'lucide-react'

export function Btn({ children, variant='primary', size='md', className='', ...props }) {
  const base = 'inline-flex items-center gap-2 font-body font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }
  const variants = {
    primary:  'bg-beat-accent text-beat-bg hover:bg-beat-accent/90 active:scale-95',
    ghost:    'bg-beat-surface text-beat-text hover:bg-beat-border border border-beat-border',
    danger:   'bg-beat-coral/10 text-beat-coral hover:bg-beat-coral/20 border border-beat-coral/30',
    outline:  'border border-beat-border text-beat-sub hover:text-beat-text hover:border-beat-muted',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Badge({ label, color='gray' }) {
  const colors = {
    teal:   'text-beat-teal bg-beat-teal/10 border-beat-teal/30',
    amber:  'text-beat-amber bg-beat-amber/10 border-beat-amber/30',
    purple: 'text-beat-purple bg-beat-purple/10 border-beat-purple/30',
    coral:  'text-beat-coral bg-beat-coral/10 border-beat-coral/30',
    accent: 'text-beat-bg bg-beat-accent border-beat-accent',
    gray:   'text-beat-sub bg-beat-surface border-beat-border',
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>
      <div className={`relative w-full ${width} bg-beat-card border border-beat-border rounded-t-2xl sm:rounded-2xl animate-slide-up max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-beat-border sticky top-0 bg-beat-card z-10">
          <h2 className="font-display text-sm text-beat-text">{title}</h2>
          <button onClick={onClose} className="text-beat-muted hover:text-beat-text transition-colors p-1">
            <X size={18}/>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Card({ children, className='' }) {
  return (
    <div className={`bg-beat-card border border-beat-border rounded-xl ${className}`}>
      {children}
    </div>
  )
}

export function Input({ label, error, className='', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-beat-sub font-body">{label}</label>}
      <input
        className={`w-full bg-beat-surface border border-beat-border rounded-lg px-3 py-2.5 text-sm text-beat-text font-body placeholder-beat-muted focus:outline-none focus:border-beat-accent transition-colors ${error ? 'border-beat-coral' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-beat-coral">{error}</span>}
    </div>
  )
}

export function Select({ label, children, className='', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-beat-sub font-body">{label}</label>}
      <select
        className={`w-full bg-beat-surface border border-beat-border rounded-lg px-3 py-2.5 text-sm text-beat-text font-body focus:outline-none focus:border-beat-accent transition-colors ${className}`}
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
      {label && <label className="text-xs font-medium text-beat-sub font-body">{label}</label>}
      <textarea
        className={`w-full bg-beat-surface border border-beat-border rounded-lg px-3 py-2.5 text-sm text-beat-text font-body placeholder-beat-muted focus:outline-none focus:border-beat-accent transition-colors resize-none ${className}`}
        rows={3}
        {...props}
      />
    </div>
  )
}

export function Slider({ label, value, onChange, color = '#c8f53d' }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-body text-beat-sub">{label}</span>
        <span className="text-sm font-display text-beat-text" style={{ color }}>{value}</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="text-4xl opacity-30">{icon}</div>
      <p className="text-beat-text font-body font-medium">{title}</p>
      {subtitle && <p className="text-beat-sub font-body text-sm max-w-xs">{subtitle}</p>}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-beat-border border-t-beat-accent rounded-full animate-spin"/>
    </div>
  )
}

export function SectionTitle({ children }) {
  return <h2 className="font-display text-xs text-beat-muted uppercase tracking-widest mb-3">{children}</h2>
}
