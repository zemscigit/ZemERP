import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Badge, Button, Card, Input, Modal, Money, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

const emptyLine = { account_id: '', description: '', debit: 0, credit: 0 }

export default function JournalEntries() {
  const { t } = useLocale()
  const [rows, setRows] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), description: '', lines: [{ ...emptyLine }, { ...emptyLine }] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/journal-entries')
      setRows(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    api.get('/chart-of-accounts').then((res) => setAccounts(res.data))
  }, [])

  const totalDebit = form.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = form.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  const save = async () => {
    setError('')
    if (!balanced) {
      setError('ยอดเดบิตและเครดิตไม่เท่ากัน')
      return
    }
    setSaving(true)
    try {
      await api.post('/journal-entries', {
        date: form.date,
        description: form.description,
        lines: form.lines.filter((l) => l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0)),
      })
      setModal(false)
      load()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!confirm(t('delete') + '?')) return
    try {
      await api.delete(`/journal-entries/${row.id}`)
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const accountOptions = accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name_th}` }))
  const typeColors = { sales: 'blue', purchase: 'orange', payment_in: 'green', payment_out: 'red', delivery: 'purple', receipt: 'green', general: 'gray' }

  const columns = [
    { key: 'entry_number', label: t('entry_number'), render: (r) => <span className="font-mono text-xs">{r.entry_number}</span> },
    { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
    { key: 'description', label: t('description') },
    { key: 'type', label: t('journal_type'), render: (r) => <Badge color={typeColors[r.type]}>{t(r.type)}</Badge> },
    { key: 'debit', label: t('debit'), align: 'right', render: (r) => <Money value={r.total_debit} /> },
    { key: 'credit', label: t('credit'), align: 'right', render: (r) => <Money value={r.total_credit} /> },
    {
      key: 'actions', label: t('actions'),
      render: (r) => r.ref_type === null && (
        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(r)}>{t('delete')}</Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('journal_entries')}
        actions={<Button onClick={() => { setForm({ date: new Date().toISOString().slice(0, 10), description: '', lines: [{ ...emptyLine }, { ...emptyLine }] }); setError(''); setModal(true) }}>+ {t('add')}</Button>}
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={rows} />}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`${t('add')} ${t('journal_entries')}`}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button onClick={save} disabled={saving}>{saving ? '...' : t('save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label={t('date')} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label={t('description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                <th className="px-2 py-2 font-medium">{t('account')}</th>
                <th className="px-2 py-2 font-medium w-48">{t('description')}</th>
                <th className="px-2 py-2 font-medium w-32 text-right">{t('debit')}</th>
                <th className="px-2 py-2 font-medium w-32 text-right">{t('credit')}</th>
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="px-2 py-1.5 min-w-64">
                    <Select options={accountOptions} value={line.account_id} onChange={(e) => {
                      const next = [...form.lines]
                      next[idx] = { ...line, account_id: Number(e.target.value) }
                      setForm({ ...form, lines: next })
                    }} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input value={line.description} onChange={(e) => {
                      const next = [...form.lines]
                      next[idx] = { ...line, description: e.target.value }
                      setForm({ ...form, lines: next })
                    }} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" step="any" value={line.debit} className="text-right" onChange={(e) => {
                      const next = [...form.lines]
                      next[idx] = { ...line, debit: Number(e.target.value) }
                      setForm({ ...form, lines: next })
                    }} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" step="any" value={line.credit} className="text-right" onChange={(e) => {
                      const next = [...form.lines]
                      next[idx] = { ...line, credit: Number(e.target.value) }
                      setForm({ ...form, lines: next })
                    }} />
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) })} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-lg leading-none">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan="2" className="px-2 py-2 text-gray-800 dark:text-gray-200">{t('total')}</td>
                <td className="px-2 py-2 text-right tabular-nums"><Money value={totalDebit} /></td>
                <td className="px-2 py-2 text-right tabular-nums"><Money value={totalCredit} /></td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => setForm({ ...form, lines: [...form.lines, { ...emptyLine }] })}>+ {t('items')}</Button>
        {!balanced && <p className="text-xs text-red-500 mt-2">เดบิต {totalDebit.toFixed(2)} ≠ เครดิต {totalCredit.toFixed(2)}</p>}
        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </Modal>
    </div>
  )
}
