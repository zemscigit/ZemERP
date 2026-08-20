import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'
import { Button, Card, Input, PageHeader, Select, Spinner, StatusBadge, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function Deliveries() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/deliveries', { params: { status, search } })
      setRows(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [status, search])

  const columns = [
    { key: 'number', label: t('number'), render: (r) => <Link to={`/deliveries/${r.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">{r.number}</Link> },
    { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
    { key: 'partner', label: t('customer'), render: (r) => r.partner?.name },
    { key: 'salesOrder', label: t('sales_orders'), render: (r) => r.sales_order ? <Link to={`/sales-orders/${r.sales_order.id}`} className="text-blue-600">{r.sales_order.number}</Link> : '-' },
    { key: 'items', label: t('items'), render: (r) => r.items.length },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title={t('deliveries')}
        actions={
          <>
            <Select
              options={[{ value: '', label: t('all_status') }, ...['draft', 'delivered', 'cancelled'].map((s) => ({ value: s, label: t(s) }))]}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-44"
            />
            <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
            <Button onClick={() => navigate('/deliveries/new')}>+ {t('new')}</Button>
          </>
        }
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={rows} onRowClick={(r) => navigate(`/deliveries/${r.id}`)} />}
      </Card>
    </div>
  )
}
