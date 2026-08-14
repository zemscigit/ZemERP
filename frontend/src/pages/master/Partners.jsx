import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { useLocale } from '../../i18n'

const empty = { type: 'customer', code: '', name: '', tax_id: '', address: '', phone: '', email: '', contact_person: '', is_active: true }

export default function Partners() {
  const { t } = useLocale()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/partners', { params: { search, type: typeFilter, per_page: 100 } })
      setRows(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search, typeFilter])

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
        await api.put(`/partners/${editing.id}`, form)
      } else {
        await api.post('/partners', form)
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
      await api.delete(`/partners/${row.id}`)
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const typeOptions = [
    { value: 'customer', label: t('customer') },
    { value: 'supplier', label: t('supplier') },
    { value: 'both', label: t('both') },
  ]

  const columns = [
    { key: 'code', label: t('code') },
    { key: 'name', label: t('name') },
    { key: 'type', label: t('type'), render: (r) => <Badge color={r.type === 'supplier' ? 'purple' : 'blue'}>{t(r.type)}</Badge> },
    { key: 'tax_id', label: t('tax_id') },
    { key: 'phone', label: t('phone') },
    { key: 'email', label: 'Email' },
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
        title={t('partners')}
        actions={
          <>
            <Select
              options={[{ value: '', label: t('all') }, ...typeOptions]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-40"
            />
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
        title={editing ? t('edit') : `${t('add')} ${t('partners')}`}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button onClick={save}>{t('save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Select label={t('type')} options={typeOptions} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input label={t('code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('tax_id')} value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
          <Input label={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label={t('contact')} value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          <div className="col-span-2">
            <Input label={t('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </Modal>
    </div>
  )
}
