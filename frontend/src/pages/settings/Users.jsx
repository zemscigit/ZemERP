import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { useLocale } from '../../i18n'

const empty = { name: '', email: '', password: '', role: 'staff', locale: 'th' }

export default function Users() {
  const { t } = useLocale()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setRows(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(empty); setError(''); setModal(true) }
  const openEdit = (row) => { setEditing(row); setForm({ name: row.name, email: row.email, password: '', role: row.role, locale: row.locale }); setError(''); setModal(true) }

  const save = async () => {
    setError('')
    try {
      if (editing) await api.put(`/users/${editing.id}`, form)
      else await api.post('/users', form)
      setModal(false)
      load()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const remove = async (row) => {
    if (!confirm(t('delete') + '?')) return
    try {
      await api.delete(`/users/${row.id}`)
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('users')}
        actions={<Button onClick={openNew}>+ {t('add')}</Button>}
      />
      <Card>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: 'name', label: t('name') },
              { key: 'email', label: 'Email' },
              { key: 'role', label: t('role'), render: (r) => <Badge color={r.role === 'admin' ? 'purple' : 'blue'}>{t(r.role)}</Badge> },
              { key: 'locale', label: t('language'), render: (r) => r.locale === 'th' ? 'ไทย' : 'English' },
              {
                key: 'actions', label: t('actions'),
                render: (r) => (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>{t('edit')}</Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(r)}>{t('delete')}</Button>
                  </div>
                ),
              },
            ]}
            data={rows}
          />
        )}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? t('edit') : `${t('add')} ${t('users')}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button onClick={save}>{t('save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label={t('password')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? '(ไม่เปลี่ยน)' : ''} required={!editing} />
          <Select
            label={t('role')}
            options={[{ value: 'admin', label: t('admin') }, { value: 'staff', label: t('staff') }]}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </Modal>
    </div>
  )
}
