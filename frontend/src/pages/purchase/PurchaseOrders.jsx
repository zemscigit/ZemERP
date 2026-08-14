import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'
import { Button, Card, Input, Money, PageHeader, Select, Spinner, StatusBadge, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function PurchaseOrders() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/purchase-orders', { params: { status, search } })
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
    { key: 'number', label: t('number'), render: (r) => <Link to={`/purchase-orders/${r.id}`} className="text-blue-600 hover:underline">{r.number}</Link> },
    { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
    { key: 'partner', label: t('supplier'), render: (r) => r.partner?.name },
    { key: 'total', label: t('total'), align: 'right', render: (r) => <Money value={r.total} /> },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title={t('purchase_orders')}
        actions={
          <>
            <Select
              options={[{ value: '', label: t('all_status') }, ...['draft', 'confirmed', 'received', 'cancelled'].map((s) => ({ value: s, label: t(s) }))]}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-44"
            />
            <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
            <Button onClick={() => navigate('/purchase-orders/new')}>+ {t('new')}</Button>
          </>
        }
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={rows} onRowClick={(r) => navigate(`/purchase-orders/${r.id}`)} />}
      </Card>
    </div>
  )
}
