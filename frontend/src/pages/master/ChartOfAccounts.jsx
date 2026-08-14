import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { useLocale } from '../../i18n'

const empty = { code: '', name_th: '', name_en: '', type: 'asset', parent_code: '', is_active: true }

const typeColors = { asset: 'blue', liability: 'purple', equity: 'yellow', income: 'green', expense: 'red' }

export default function ChartOfAccounts() {
  const { t } = useLocale()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/chart-of-accounts', { params: { search } })
      setRows(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search])

  const typeOptions = [
    { value: 'asset', label: 'สินทรัพย์ / Asset' },
    { value: 'liability', label: 'หนี้สิน / Liability' },
    { value: 'equity', label: 'ส่วนของเจ้าของ / Equity' },
    { value: 'income', label: 'รายได้ / Income' },
    { value: 'expense', label: 'ค่าใช้จ่าย / Expense' },
  ]

  const openNew = () => {
    setEditing(null)
    setForm(empty)
    setError('')
    setModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ ...row })
    setError('')
    setModal(true)
  }

  const save = async () => {
    setError('')
    try {
      if (editing) {
        await api.put(`/chart-of-accounts/${editing.id}`, form)
      } else {
        await api.post('/chart-of-accounts', form)
      }
      setModal(false)
      load()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const remove = async (row) => {
    if (!confirm(t('delete') + '?')) return
    try {
      await api.delete(`/chart-of-accounts/${row.id}`)
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const columns = [
    { key: 'code', label: t('account_code'), render: (r) => <span className="font-mono font-medium">{r.code}</span> },
    { key: 'name_th', label: `${t('account_name')} (ไทย)` },
    { key: 'name_en', label: `${t('account_name')} (EN)` },
    { key: 'type', label: t('type'), render: (r) => <Badge color={typeColors[r.type]}>{r.type}</Badge> },
    {
      key: 'actions',
      label: t('actions'),
      render: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(r) }}>{t('edit')}</Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={(e) => { e.stopPropagation(); remove(r) }}>{t('delete')}</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('chart_of_accounts')}
        actions={
          <>
            <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            <Button onClick={openNew}>+ {t('add')}</Button>
          </>
        }
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={rows} />}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? t('edit') : `${t('add')} ${t('account')}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button onClick={save}>{t('save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('account_code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Select label={t('type')} options={typeOptions} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input label={`${t('account_name')} (ไทย)`} value={form.name_th} onChange={(e) => setForm({ ...form, name_th: e.target.value })} required />
          <Input label={`${t('account_name')} (EN)`} value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required />
          <Input label="Parent Code" value={form.parent_code} onChange={(e) => setForm({ ...form, parent_code: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </Modal>
    </div>
  )
}
