import { useEffect, useRef, useState } from 'react'
import { fmtMoney, useLocale } from '../i18n'

export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors ${className}`}>
      {(title || actions) && (
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          {title && <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    ghost: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
  }
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  }
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ label, error, className = '', type, step, inputMode, ...props }) {
  const isNumber = type === 'number'
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</span>}
      <input
        type={type}
        step={isNumber ? (step ?? 'any') : step}
        inputMode={isNumber ? (inputMode ?? 'decimal') : inputMode}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        {...props}
      />
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  )
}

export function Select({ label, options = [], className = '', placeholder, value, onChange, disabled }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const rootRef = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value))
  const shownPlaceholder = placeholder || (locale === 'th' ? '— เลือก —' : '— Select —')

  const computePos = () => {
    const r = btnRef.current.getBoundingClientRect()
    const up = window.innerHeight - r.bottom < 300
    return {
      left: r.left,
      width: r.width,
      top: up ? undefined : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : undefined,
    }
  }

  const toggle = () => {
    if (disabled) return
    if (open) {
      setOpen(false)
      return
    }
    setPos(computePos())
    setOpen(true)
  }

  useEffect(() => {
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    if (!open) return
    const onMove = () => setPos(computePos())
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = q ? options.filter((o) => String(o.label || '').toLowerCase().includes(q)) : options

  const pick = (o) => {
    onChange?.({ target: { value: o.value } })
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label && <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</span>}
      <button
        type="button"
        ref={btnRef}
        disabled={disabled}
        onClick={toggle}
        aria-expanded={open}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selected?.image && <img src={selected.image} alt="" className="w-6 h-6 rounded object-cover shrink-0" />}
        <span className={`truncate ${selected ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
          {selected ? selected.label : shownPlaceholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && pos && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg overflow-hidden flex flex-col"
          style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, maxHeight: 288 }}
        >
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              placeholder={t('search')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <ul className="overflow-y-auto">
            {filtered.length === 0 && <li className="px-3 py-2.5 text-sm text-gray-400 dark:text-gray-500">{t('no_data')}</li>}
            {filtered.map((o) => {
              const active = String(o.value) === String(value)
              return (
                <li key={String(o.value)}>
                  <button
                    type="button"
                    onClick={() => pick(o)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 ${active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {o.image ? (
                        <img src={o.image} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                      ) : (
                        <span className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xs shrink-0">📦</span>
                      )}
                      <span className="truncate">{o.label}</span>
                    </span>
                    {active && <span className="text-blue-600 dark:text-blue-400 shrink-0">✓</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] flex flex-col transition-colors`}>
        {title && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">×</button>
          </div>
        )}
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Badge({ color = 'gray', children }) {
  const colors = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const { t } = useLocale()
  const colors = {
    draft: 'gray',
    confirmed: 'blue',
    delivered: 'green',
    received: 'green',
    issued: 'blue',
    partial: 'yellow',
    paid: 'green',
    cancelled: 'red',
  }
  return <Badge color={colors[status] || 'gray'}>{t(status)}</Badge>
}

export function Table({ columns, data, onRowClick, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2.5 font-medium whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2.5 whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                {empty || 'ไม่มีข้อมูล'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, color = 'text-gray-800', icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        {icon && <div className="text-3xl opacity-20">{icon}</div>}
      </div>
    </div>
  )
}

export function Money({ value, className = '' }) {
  const { locale } = useLocale()
  return <span className={`tabular-nums ${className}`}>{fmtMoney(value, locale)}</span>
}

export function Spinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function EmptyState({ message }) {
  return <div className="text-center py-10 text-gray-400 dark:text-gray-500">{message}</div>
}
