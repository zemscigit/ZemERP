import { useEffect, useState } from 'react'
import api from '../../api'
import { Button, Card, Input, Money, PageHeader, Spinner, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function Receipts() {
  const { t } = useLocale()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      api.get('/receipts', { params: { search } })
        .then((res) => setRows(res.data.data))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const columns = [
    {
      key: 'number', label: t('number'),
      render: (r) => <button onClick={() => window.open(`/print/receipt/${r.id}`, '_blank')} className="text-blue-600 dark:text-blue-400 hover:underline">{r.number}</button>,
    },
    { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
    { key: 'partner', label: t('customer'), render: (r) => r.partner?.name },
    { key: 'amount', label: t('amount'), align: 'right', render: (r) => <Money value={r.amount} /> },
    {
      key: 'print', label: t('print'),
      render: (r) => <Button variant="ghost" size="sm" onClick={() => window.open(`/print/receipt/${r.id}`, '_blank')}>🖨 {t('print')}</Button>,
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('receipts')}
        actions={<Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />}
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={rows} />}
      </Card>
    </div>
  )
}
