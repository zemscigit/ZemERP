import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Card, StatCard, Spinner, StatusBadge, Money, Badge, Button } from '../components/ui'
import { fmtDate, useLocale } from '../i18n'

const CHART_DAYS_OPTIONS = [7, 14, 30, 60, 90]
const CHART_HEIGHT = 160

export default function Dashboard() {
  const { t } = useLocale()
  const [data, setData] = useState(null)
  const [chartDays, setChartDays] = useState(30)
  const [activeTab, setActiveTab] = useState('sales')

  useEffect(() => {
    api.get('/reports/dashboard', { params: { chart_days: chartDays } })
      .then((res) => setData(res.data))
      .catch(() => {})
  }, [chartDays])

  const chartMax = useMemo(() => {
    if (!data?.chart) return 1
    return Math.max(...data.chart.sales, ...data.chart.purchases, 1)
  }, [data])

  if (!data) return <Spinner />

  const todayTx = [
    ...(data.today.sales || []).map((r) => ({ ...r, _type: 'sale' })),
    ...(data.today.purchases || []).map((r) => ({ ...r, _type: 'purchase' })),
    ...(data.today.receipts || []).map((r) => ({ ...r, _type: 'receipt', total: r.amount })),
    ...(data.today.payments || []).map((r) => ({ ...r, _type: 'payment', total: r.amount })),
  ].sort((a, b) => b.id - a.id)

  const barHeight = (val) => Math.max((val / chartMax) * CHART_HEIGHT, val > 0 ? 4 : 0)

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5">{t('dashboard')}</h1>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('today_sales')} value={<Money value={data.sales_today} />} color="text-blue-600 dark:text-blue-400" icon="💰" />
        <StatCard label={t('today_purchases')} value={<Money value={data.purchases_today} />} color="text-orange-600 dark:text-orange-400" icon="🛒" />
        <StatCard label={t('month_sales')} value={<Money value={data.sales_month} />} color="text-green-600 dark:text-green-400" icon="📈" />
        <StatCard label={t('month_purchases')} value={<Money value={data.purchase_month} />} color="text-purple-600 dark:text-purple-400" icon="📊" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label={t('receivable')} value={<Money value={data.receivable} />} color="text-red-600 dark:text-red-400" icon="⏳" />
        <StatCard label={t('payable')} value={<Money value={data.payable} />} color="text-yellow-600 dark:text-yellow-400" icon="🧾" />
      </div>

      {/* ── Daily Chart (SVG) ── */}
      <Card
        title={`${t('daily_sales_purchases')} (${chartDays} ${t('days')})`}
        actions={
          <div className="flex gap-1">
            {CHART_DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setChartDays(d)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  chartDays === d
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {d} {t('days')}
              </button>
            ))}
          </div>
        }
      >
        {(() => {
          const labels = data.chart.labels
          const salesData = data.chart.sales
          const purchasesData = data.chart.purchases
          const n = labels.length
          const barGap = 2
          const groupWidth = 20
          const svgWidth = n * (groupWidth + barGap)
          const svgHeight = CHART_HEIGHT + 30
          const showEvery = Math.ceil(n / 10)

          return (
            <div className="overflow-x-auto pb-2">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full"
                style={{ minWidth: svgWidth * 0.5, height: svgHeight * 2.5 }}
              >
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <line
                    key={pct}
                    x1="0" y1={CHART_HEIGHT * (1 - pct)}
                    x2={svgWidth} y2={CHART_HEIGHT * (1 - pct)}
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="0.5"
                    strokeDasharray="4 2"
                  />
                ))}

                {/* Bars */}
                {labels.map((label, i) => {
                  const x = i * (groupWidth + barGap)
                  const sH = barHeight(salesData[i])
                  const pH = barHeight(purchasesData[i])
                  const bw = (groupWidth - 2) / 2

                  return (
                    <g key={i}>
                      {/* Sale bar */}
                      {salesData[i] > 0 && (
                        <rect
                          x={x}
                          y={CHART_HEIGHT - sH}
                          width={bw}
                          height={sH}
                          rx="2"
                          className="fill-blue-500 hover:fill-blue-400"
                        >
                          <title>{`${label}\n${t('sales')}: ${salesData[i].toLocaleString()}`}</title>
                        </rect>
                      )}
                      {/* Purchase bar */}
                      {purchasesData[i] > 0 && (
                        <rect
                          x={x + bw + 2}
                          y={CHART_HEIGHT - pH}
                          width={bw}
                          height={pH}
                          rx="2"
                          className="fill-orange-400 hover:fill-orange-300"
                        >
                          <title>{`${label}\n${t('purchases')}: ${purchasesData[i].toLocaleString()}`}</title>
                        </rect>
                      )}
                      {/* Label */}
                      {(i % showEvery === 0 || i === n - 1) && (
                        <text
                          x={x + groupWidth / 2}
                          y={CHART_HEIGHT + 16}
                          textAnchor="middle"
                          className="fill-gray-500 dark:fill-gray-400"
                          fontSize="9"
                        >
                          {label}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>
          )
        })()}

        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-blue-500 rounded-sm inline-block" /> {t('sales')}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-orange-400 rounded-sm inline-block" /> {t('purchases')}</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* ── Today's Transactions ── */}
        <Card
          title={`${t('today_transactions')} (${new Date().toLocaleDateString('th-TH')})`}
          className="lg:col-span-2"
          actions={
            <div className="flex gap-1">
              {['all', 'sale', 'purchase', 'receipt', 'payment'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(tab)}
                </button>
              ))}
            </div>
          }
        >
          {todayTx.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">{t('no_data')}</p>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2 font-medium">{t('type')}</th>
                    <th className="px-3 py-2 font-medium">{t('number')}</th>
                    <th className="px-3 py-2 font-medium">{t('partner')}</th>
                    <th className="px-3 py-2 font-medium text-right">{t('amount')}</th>
                    <th className="px-3 py-2 font-medium">{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTx
                    .filter((r) => activeTab === 'all' || r._type === activeTab)
                    .map((r) => {
                      const typeConfig = {
                        sale: { label: t('sale'), color: 'blue', link: `/invoices/${r.id}` },
                        purchase: { label: t('purchase'), color: 'orange', link: `/invoices/${r.id}` },
                        receipt: { label: t('receipt'), color: 'green', link: null },
                        payment: { label: t('payment'), color: 'red', link: null },
                      }
                      const cfg = typeConfig[r._type]
                      return (
                        <tr key={`${r._type}-${r.id}`} className="border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200">
                          <td className="px-3 py-2"><Badge color={cfg.color}>{cfg.label}</Badge></td>
                          <td className="px-3 py-2">
                            {cfg.link ? (
                              <Link to={cfg.link} className="text-blue-600 dark:text-blue-400 hover:underline">{r.number}</Link>
                            ) : (
                              <span className="font-medium">{r.number}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">{r.partner?.name || '-'}</td>
                          <td className="px-3 py-2 text-right tabular-nums"><Money value={r.total} /></td>
                          <td className="px-3 py-2">{r.status ? <StatusBadge status={r.status} /> : '-'}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Top Products Today + Low Stock ── */}
        <div className="space-y-6">
          <Card title={`${t('top_products_today')}`}>
            {(data.today.top_products || []).length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm py-6 text-center">{t('no_data')}</p>
            ) : (
              <div className="space-y-3">
                {(data.today.top_products || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-5 text-center">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name_th}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{p.code} · {p.qty} ชิ้น</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums"><Money value={p.total} /></span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={t('low_stock')}>
            {data.low_stock.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm py-6 text-center">{t('no_data')}</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.low_stock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{p.code}</p>
                    </div>
                    <Badge color={p.stock <= 0 ? 'red' : 'yellow'}>{t('stock')}: {p.stock}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
