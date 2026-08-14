import { useEffect, useState } from 'react'
import api from '../../api'
import { Button, Card, Input, Money, PageHeader, Spinner, StatCard, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function WhtReport() {
  const { t } = useLocale()
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/reports/wht', { params: { from, to } })
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
        title={t('wht_report')}
        actions={
          <>
            <Input label={t('from')} type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <Input label={t('to')} type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={() => window.print()}>🖨 {t('print')}</Button>
          </>
        }
      />

      <StatCard label={`${t('wht_amount')} (${fmtDate(from)} - ${fmtDate(to)})`} value={<Money value={data.total_wht} />} color="text-orange-600" className="mb-6" />

      <Card>
        <Table
          columns={[
            { key: 'number', label: t('number') },
            { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
            { key: 'partner', label: t('partner'), render: (r) => r.partner?.name },
            { key: 'type', label: t('type'), render: (r) => <span>{r.type === 'out' ? t('out') : t('in')}</span> },
            { key: 'amount', label: t('amount'), align: 'right', render: (r) => <Money value={r.amount} /> },
            { key: 'wht_amount', label: t('wht_amount'), align: 'right', render: (r) => <Money value={r.wht_amount} /> },
          ]}
          data={data.items}
        />
      </Card>
    </div>
  )
}
