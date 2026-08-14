import { useEffect, useState } from 'react'
import api from '../../api'
import { Badge, Button, Card, Input, Modal, Money, PageHeader, Spinner, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function TrialBalance() {
  const { t } = useLocale()
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [ledger, setLedger] = useState(null)
  const [ledgerRows, setLedgerRows] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/reports/trial-balance', { params: { to } })
      setRows(data.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [to])

  const openLedger = async (account) => {
    const { data } = await api.get('/reports/ledger', { params: { account_id: account.id, to } })
    setLedger(account)
    setLedgerRows(data.data)
  }

  const typeColors = { asset: 'blue', liability: 'purple', equity: 'yellow', income: 'green', expense: 'red' }

  const columns = [
    { key: 'code', label: t('account_code'), render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name_th', label: t('account_name'), render: (r) => (
      <button onClick={() => openLedger(r)} className="text-blue-600 hover:underline text-left">{r.name_th}</button>
    ) },
    { key: 'type', label: t('type'), render: (r) => <Badge color={typeColors[r.type]}>{r.type}</Badge> },
    { key: 'debit', label: t('debit'), align: 'right', render: (r) => <Money value={r.debit} /> },
    { key: 'credit', label: t('credit'), align: 'right', render: (r) => <Money value={r.credit} /> },
    { key: 'balance', label: t('balance'), align: 'right', render: (r) => <span className={`font-medium ${r.balance < 0 ? 'text-red-600' : ''}`}><Money value={r.balance} /></span> },
  ]

  return (
    <div>
      <PageHeader
        title={t('trial_balance')}
        actions={
          <>
            <Input label={t('to')} type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={() => window.print()}>🖨 {t('print')}</Button>
          </>
        }
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={rows} />}
      </Card>

      <Modal open={!!ledger} onClose={() => setLedger(null)} title={`${t('account')}: ${ledger?.code} ${ledger?.name_th}`} wide>
        <Table
          columns={[
            { key: 'journal_entry_number', label: t('entry_number'), render: (r) => <span className="font-mono text-xs">{r.journal_entry?.entry_number}</span> },
            { key: 'journal_entry_date', label: t('date'), render: (r) => fmtDate(r.journal_entry?.date) },
            { key: 'journal_entry_description', label: t('description'), render: (r) => r.journal_entry?.description },
            { key: 'debit', label: t('debit'), align: 'right', render: (r) => <Money value={r.debit} /> },
            { key: 'credit', label: t('credit'), align: 'right', render: (r) => <Money value={r.credit} /> },
          ]}
          data={ledgerRows}
        />
      </Modal>
    </div>
  )
}
