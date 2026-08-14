import { useEffect, useState } from 'react'
import api from '../../api'
import { Button, Card, Input, Money, PageHeader, Spinner, StatCard, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function PurchaseReport() {
  const { t } = useLocale()
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/reports/purchases', { params: { from, to } })
      setData(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [from, to])

  if (loading || !data) return <Spinner />

  return (
    <div>
      <PageHeader
        title={t('purchase_report')}
        actions={
          <>
            <Input label={t('from')} type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <Input label={t('to')} type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={() => window.print()}>🖨 {t('print')}</Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label={`${t('total_amount')} (${t('purchase')})`} value={<Money value={data.summary.total} />} color="text-orange-600" />
        <StatCard label={t('items')} value={data.summary.count} color="text-blue-600" />
        <StatCard label={t('vat')} value={<Money value={data.summary.vat} />} color="text-purple-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={`${t('daily')} (${fmtDate(from)} - ${fmtDate(to)})`}>
          <Table
            columns={[
              { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
              { key: 'count', label: t('items'), align: 'right' },
              { key: 'vat', label: t('vat'), align: 'right', render: (r) => <Money value={r.vat} /> },
              { key: 'total', label: t('total'), align: 'right', render: (r) => <Money value={r.total} /> },
            ]}
            data={data.daily}
          />
        </Card>

        <Card title={t('by_partner')}>
          <Table
            columns={[
              { key: 'name', label: t('partner'), render: (r) => r.partner?.name },
              { key: 'count', label: t('items'), align: 'right' },
              { key: 'total', label: t('total'), align: 'right', render: (r) => <Money value={r.total} /> },
            ]}
            data={data.byPartner}
          />
        </Card>
      </div>
    </div>
  )
}
