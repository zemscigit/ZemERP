import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api'
import { Badge, Button, Card, Input, Money, PageHeader, Select, Spinner, StatusBadge, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function Invoices() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || 'sale'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/invoices', { params: { type, status, search } })
      setRows(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [type, status, search])

  const columns = [
    { key: 'number', label: t('number'), render: (r) => <Link to={`/invoices/${r.id}`} className="text-blue-600 hover:underline">{r.number}</Link> },
    { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
    { key: 'partner', label: t('partner'), render: (r) => r.partner?.name },
    { key: 'total', label: t('total'), align: 'right', render: (r) => <Money value={r.total} /> },
    { key: 'wht', label: t('wht'), align: 'right', render: (r) => <Money value={r.wht_amount} /> },
    { key: 'balance', label: t('balance'), align: 'right', render: (r) => <Money value={Math.max(0, r.net_payable - r.paid_amount)} /> },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'vat', label: t('vat'), render: (r) =>
        <Badge color={type === 'sale' ? 'purple' : 'orange'}>{r.vat_rate}%</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title={type === 'sale' ? t('sales_invoices') : t('purchase_invoices')}
        actions={
          <div className="flex gap-2">
            <Select
              options={[{ value: 'sale', label: t('sales_invoices') }, { value: 'purchase', label: t('purchase_invoices') }]}
              value={type}
              onChange={(e) => navigate(`/invoices?type=${e.target.value}`)}
              className="w-52"
            />
            <Select
              options={[{ value: '', label: t('all_status') }, ...['draft', 'issued', 'partial', 'paid', 'cancelled'].map((s) => ({ value: s, label: t(s) }))]}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-44"
            />
            <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          </div>
        }
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={rows} onRowClick={(r) => navigate(`/invoices/${r.id}`)} />}
      </Card>
    </div>
  )
}
