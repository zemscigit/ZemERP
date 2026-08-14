import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../i18n'
import { Select } from './ui'

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

function MenuItem({ item, isOpen, setIsOpen }) {
  const [expanded, setExpanded] = useState(true)
  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 rounded-lg"
        >
          <span>{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          <span className={`text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expanded && (
          <div className="ml-4 pl-3 border-l border-gray-700">
            {item.children.map((c) => (
              <NavLink
                key={c.label}
                to={c.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-1.5 text-sm rounded-lg mb-0.5 ${
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                {c.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={() => setIsOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
        }`
      }
    >
      <span>{item.icon}</span>
      {item.label}
    </NavLink>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { t, locale, setLocale } = useLocale()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-400">{t('app_name')}</h1>
            <p className="text-xs text-gray-400">ERP System</p>
          </div>
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
          {menu(t).map((item, i) => (
            <MenuItem key={i} item={item} setIsOpen={setSidebarOpen} />
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between no-print">
          <button className="lg:hidden text-xl text-gray-600" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="flex items-center gap-3 ml-auto">
            <Select
              options={[{ value: 'th', label: 'ไทย' }, { value: 'en', label: 'English' }]}
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">
              {t('logout')}
            </button>
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
