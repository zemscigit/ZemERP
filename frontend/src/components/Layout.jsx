import { useState, useEffect, useCallback, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLocale } from '../i18n'
import { Select } from './ui'

const COLLAPSED_KEY = 'zemerp_sidebar_collapsed'

const menu = (t) => [
  { to: '/', label: t('dashboard'), icon: '📊', end: true },
  {
    label: t('master_data'),
    icon: '🗂️',
    children: [
      { to: '/products', label: t('products') },
      { to: '/partners', label: t('partners') },
      { to: '/chart-of-accounts', label: t('chart_of_accounts') },
      { to: '/warehouses', label: t('warehouses') },
      { to: '/tax-rates', label: t('tax_rates') },
      { to: '/categories', label: t('categories') },
      { to: '/units', label: t('units') },
    ],
  },
  {
    label: t('purchasing'),
    icon: '🛒',
    children: [
      { to: '/purchase-orders', label: t('purchase_orders') },
      { to: '/invoices?type=purchase', label: t('purchase_invoices'), query: { type: 'purchase' } },
    ],
  },
  {
    label: t('sales'),
    icon: '💼',
    children: [
      { to: '/pos', label: '🛒 POS (ขายหน้าร้าน)' },
      { to: '/sales-orders', label: t('sales_orders') },
      { to: '/deliveries', label: t('deliveries') },
      { to: '/invoices?type=sale', label: t('sales_invoices'), query: { type: 'sale' } },
      { to: '/receipts', label: t('receipts') },
    ],
  },
  {
    label: t('money'),
    icon: '💰',
    children: [{ to: '/payments', label: t('payments') }],
  },
  {
    label: t('accounting'),
    icon: '📒',
    children: [
      { to: '/journal-entries', label: t('journal_entries') },
      { to: '/gl-entries', label: t('gl_entries') },
      { to: '/trial-balance', label: t('trial_balance') },
    ],
  },
  {
    label: t('reports'),
    icon: '📈',
    children: [
      { to: '/reports/sales', label: t('sales_report') },
      { to: '/reports/purchases', label: t('purchase_report') },
      { to: '/reports/vat', label: t('vat_report') },
      { to: '/reports/stock', label: t('stock_report') },
      { to: '/reports/stock-movements', label: t('stock_movements_report') },
      { to: '/reports/stock-card', label: t('stock_card') },
      { to: '/reports/wht', label: t('wht_report') },
    ],
  },
  {
    label: t('settings'),
    icon: '⚙️',
    children: [
      { to: '/settings', label: t('company_settings') },
      { to: '/users', label: t('users') },
    ],
  },
]

/* ── Tooltip wrapper (ใช้ตอน sidebar หุบ) ── */
function Tip({ text, side = 'right', children }) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ top: 0 })
  const ref = useCallback((el) => {
    if (el) {
      const r = el.getBoundingClientRect()
      setPos({ top: r.top + r.height / 2 })
    }
  }, [])

  return (
    <span
      className="relative"
      ref={ref}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="fixed z-[100] px-2.5 py-1 rounded-md bg-gray-800 text-white text-xs font-medium whitespace-nowrap pointer-events-none shadow-lg"
          style={{ top: pos.top, left: '100%', transform: 'translateY(-50%)', marginLeft: 10 }}
        >
          {text}
        </span>
      )}
    </span>
  )
}

/* ── Menu Items ── */
function MenuItemSingle({ item, collapsed, onNavigate }) {
  const inner = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl text-sm transition-all duration-200
        ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5'}
        ${isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <span className={`text-lg shrink-0 ${collapsed ? '' : ''}`}>{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )

  return collapsed ? <Tip text={item.label}>{inner}</Tip> : inner
}

function MenuItemGroup({ item, collapsed, onNavigate, groupIndex = null, openIndex = null, setOpenIndex = () => {} }) {
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (collapsed) setExpanded(false)
  }, [collapsed])

  if (collapsed) {
    return (
      <CollapsedGroup item={item} onNavigate={onNavigate} index={groupIndex} openIndex={openIndex} setOpenIndex={setOpenIndex} />
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
      >
        <span className="text-lg shrink-0">{item.icon}</span>
        <span className="flex-1 text-left truncate">{item.label}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? `${item.children.length * 40 + 12}px` : '0' }}
      >
        <div className="ml-4 pl-4 border-l border-gray-700/50 mt-1 mb-2 space-y-0.5">
          {item.children.map((c) => (
            <NavLink
              key={c.label}
              to={c.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `block px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`
              }
            >
              {c.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Collapsed floating submenu ── */
function CollapsedGroup({ item, onNavigate, index, openIndex, setOpenIndex }) {
  const open = openIndex === index
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const calcPos = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.top, left: r.right + 4 })
    }
  }

  /* recalculate position every time the submenu opens */
  useEffect(() => {
    if (open) calcPos()
  }, [open])

  /* keep position in sync if window resizes (e.g. sidebar collapse animation) */
  useEffect(() => {
    if (!open) return
    const recalc = () => calcPos()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = () => setOpenIndex(null)
    const timer = setTimeout(() => {
      document.addEventListener('click', close)
      document.addEventListener('scroll', close, true)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [open, setOpenIndex])

  const toggle = (e) => {
    e.stopPropagation()
    setOpenIndex(open ? null : index)
  }

  return (
    <span className="relative">
      <Tip text={item.label}>
        <button
          ref={btnRef}
          onClick={toggle}
          className="w-full flex items-center justify-center px-2 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <span className="text-lg">{item.icon}</span>
        </button>
      </Tip>
      {open && (
        <div
          className="fixed z-[100] w-52 py-1.5 bg-gray-900 dark:bg-gray-800 border border-gray-700/60 rounded-xl shadow-2xl shadow-black/40"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-700/40 mb-1">
            {item.label}
          </div>
          {item.children.map((c) => (
            <NavLink
              key={c.label}
              to={c.to}
              onClick={(e) => { e.stopPropagation(); onNavigate?.(); setOpenIndex(null) }}
              className={({ isActive }) =>
                `block px-3 py-2 text-sm transition-colors rounded-lg mx-1.5 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </span>
  )
}

/* ── Theme Toggle Button ── */
function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={dark ? 'Light Mode' : 'Dark Mode'}
    >
      {dark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

/* ── Main Layout ── */
export default function Layout() {
  const { user, logout } = useAuth()
  const { t, locale, setLocale } = useLocale()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true' } catch { return false }
  })
  const [openIndex, setOpenIndex] = useState(null)

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(COLLAPSED_KEY, next) } catch {}
      return next
    })
    setOpenIndex(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const onNavigate = () => setSidebarOpen(false)

  const SIDEBAR_W = collapsed ? 'w-[72px]' : 'w-64'

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* ─── Desktop Sidebar ─── */}
      <aside
        className={`
          hidden lg:flex flex-col shrink-0
          ${SIDEBAR_W}
          bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          text-white transition-all duration-300 ease-in-out
          border-r border-gray-800/60
        `}
      >
        {/* Logo */}
        <div className={`px-4 h-16 flex items-center border-b border-gray-800/60 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                {t('app_name')}
              </h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">ERP System</p>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-4.5 h-4.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ width: 18, height: 18 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
          {menu(t).map((item, i) =>
            item.children ? (
              <MenuItemGroup key={i} item={item} collapsed={collapsed} onNavigate={onNavigate} groupIndex={i} openIndex={openIndex} setOpenIndex={setOpenIndex} />
            ) : (
              <MenuItemSingle key={i} item={item} collapsed={collapsed} onNavigate={onNavigate} />
            )
          )}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-gray-800/60 shrink-0">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 px-2 w-full hover:bg-white/5 rounded-lg py-1 transition-colors"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </button>
          </div>
        )}
      </aside>

      {/* ─── Mobile Sidebar (overlay) ─── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          text-white transition-transform duration-300 ease-in-out lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="px-4 h-16 flex items-center justify-between border-b border-gray-800/60">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t('app_name')}
            </h1>
            <p className="text-[10px] text-gray-500 tracking-wider uppercase">ERP System</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="overflow-y-auto py-3 px-2 space-y-1" style={{ height: 'calc(100vh - 64px)' }}>
          {menu(t).map((item, i) =>
            item.children ? (
              <MenuItemGroup key={i} item={item} collapsed={false} onNavigate={onNavigate} />
            ) : (
              <MenuItemSingle key={i} item={item} collapsed={false} onNavigate={onNavigate} />
            )
          )}
        </nav>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 flex items-center justify-between shrink-0 no-print transition-colors">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop collapse button */}
          <button
            className="hidden lg:flex p-2 -ml-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={toggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            <Select
              options={[{ value: 'th', label: '🇹🇭 ไทย' }, { value: 'en', label: '🌐 English' }]}
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-36"
            />
            <button
              onClick={() => navigate('/profile')}
              className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors"
              title={t('edit_profile')}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{user?.name}</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {t('logout')}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
