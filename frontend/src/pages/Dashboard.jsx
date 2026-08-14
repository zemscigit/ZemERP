import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Card, StatCard, Spinner, StatusBadge, Money, Badge } from '../components/ui'
import { fmtDate, useLocale } from '../i18n'

export default function Dashboard() {
  const { t } = useLocale()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/reports/dashboard').then((res) => setData(res.data)).catch(() => {})
  }, [])

  if (!data) return <Spinner />

  const max = Math.max(...data.chart.values, 1)

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">{t('dashboard')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label={t('today_sales')} value={<Money value={data.sales_today} />} color="text-blue-600" icon="💰" />
        <StatCard label={t('month_sales')} value={<Money value={data.sales_month} />} color="text-green-600" icon="📈" />
        <StatCard label={t('month_purchases')} value={<Money value={data.purchase_month} />} color="text-orange-600" icon="🛒" />
        <StatCard label={t('receivable')} value={<Money value={data.receivable} />} color="text-red-600" icon="⏳" />
        <StatCard label={t('payable')} value={<Money value={data.payable} />} color="text-purple-600" icon="🧾" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={t('monthly_sales_chart')}>
          <div className="flex items-end gap-2 h-48">
            {data.chart.values.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-600">{v > 0 ? Math.round(v).toLocaleString() : ''}</span>
                <div
                  className="w-full bg-blue-500 rounded-t-lg min-h-1"
                  style={{ height: `${Math.max((v / max) * 160, 4)}px` }}
                />
                <span className="text-[10px] text-gray-500">{data.chart.labels[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('low_stock')}>
          {data.low_stock.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">{t('no_data')}</p>
          ) : (
            <div className="space-y-2">
              {data.low_stock.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.code}</p>
                  </div>
                  <Badge color={p.stock <= 0 ? 'red' : 'yellow'}>{t('stock')}: {p.stock}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={t('recent_invoices')} className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-3 py-2 font-medium">{t('number')}</th>
                  <th className="px-3 py-2 font-medium">{t('date')}</th>
                  <th className="px-3 py-2 font-medium">{t('partner')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('total')}</th>
                  <th className="px-3 py-2 font-medium">{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">{inv.number}</Link>
                    </td>
                    <td className="px-3 py-2">{fmtDate(inv.date)}</td>
                    <td className="px-3 py-2">{inv.partner?.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums"><Money value={inv.total} /></td>
                    <td className="px-3 py-2"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
