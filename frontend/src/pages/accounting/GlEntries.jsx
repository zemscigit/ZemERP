import { useEffect, useState } from 'react'
import api from '../../api'
import { Badge, Button, Card, Input, Money, PageHeader, Select, Spinner, StatCard, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

const typeColors = { sales: 'blue', purchase: 'orange', payment_in: 'green', payment_out: 'red', delivery: 'purple', receipt: 'green', general: 'gray' }

export default function GlEntries() {
  const { t } = useLocale()
  const [accounts, setAccounts] = useState([])
  const [accountId, setAccountId] = useState('')
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [search, setSearch] = useState('')
  const [docRef, setDocRef] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/chart-of-accounts').then((res) => setAccounts(res.data))
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/reports/gl-entries', {
        params: { account_id: accountId || undefined, from, to, search: search || undefined, doc_ref: docRef || undefined },
      })
      setData(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [accountId, from, to, search, docRef])

  if (loading || !data) return <Spinner />

  const balanced = Math.abs(data.summary.total_debit - data.summary.total_credit) < 0.01

  return (
    <div>
      <PageHeader
        title={t('gl_entries')}
        actions={
          <>
            <Select
              options={[{ value: '', label: t('all') }, ...accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name_th}` }))]}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-64"
            />
            <Input label={t('from')} type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <Input label={t('to')} type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            <Input label={t('entry_number')} placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-44" />
            <Input label={t('doc_ref')} placeholder={t('search')} value={docRef} onChange={(e) => setDocRef(e.target.value)} className="w-44" />
            <Button variant="secondary" onClick={() => window.print()}>🖨 {t('print')}</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('items')} value={data.summary.count} color="text-gray-700 dark:text-gray-300" />
        <StatCard label={t('debit')} value={<Money value={data.summary.total_debit} />} color="text-blue-600" />
        <StatCard label={t('credit')} value={<Money value={data.summary.total_credit} />} color="text-orange-600" />
        <StatCard
          label={balanced ? t('balanced') : t('unbalanced')}
          value={balanced ? '✓' : '✕'}
          color={balanced ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      <Card>
        <Table
          columns={[
            { key: 'entry_number', label: t('entry_number'), render: (r) => <span className="font-mono text-xs">{r.entry_number}</span> },
            { key: 'ref_label', label: t('document'), render: (r) => r.ref_label ? <span className="text-xs text-gray-500">{r.ref_label}</span> : '-' },
            { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
            { key: 'type', label: t('journal_type'), render: (r) => <Badge color={typeColors[r.type]}>{t(r.type)}</Badge> },
            { key: 'description', label: t('description'), render: (r) => <span className="text-xs">{r.line_description || r.description}</span> },
            { key: 'account', label: t('account_code'), render: (r) => <span className="font-mono text-xs">{r.account_code}</span> },
            { key: 'account_name', label: t('account_name') },
            { key: 'debit', label: t('debit'), align: 'right', render: (r) => r.debit > 0 ? <Money value={r.debit} /> : <span className="text-gray-300">-</span> },
            { key: 'credit', label: t('credit'), align: 'right', render: (r) => r.credit > 0 ? <Money value={r.credit} /> : <span className="text-gray-300">-</span> },
          ]}
          data={data.items}
          empty={t('no_data')}
        />
      </Card>
    </div>
  )
}
