import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Button, Card, Input, Modal, PageHeader, Spinner, Table } from '../../components/ui'
import { useLocale } from '../../i18n'

const empty = { code: '', name: '', description: '', is_active: true }

export default function Categories() {
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
      const { data } = await api.get('/categories')
      setRows(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(empty); setError(''); setModal(true) }
  const openEdit = (row) => { setEditing(row); setForm({ ...row }); setError(''); setModal(true) }

  const save = async () => {
    setError('')
    try {
      if (editing) await api.put(`/categories/${editing.id}`, form)
      else await api.post('/categories', form)
      setModal(false)
      load()
    } catch (e) { setError(getErrorMessage(e)) }
  }

  const remove = async (row) => {
    if (!confirm(t('delete') + '?')) return
    try {
      await api.delete(`/categories/${row.id}`)
      load()
    } catch (e) { alert(getErrorMessage(e)) }
  }

  return (
    <div>
      <PageHeader
        title={t('categories')}
        actions={<Button onClick={openNew}>+ {t('add')}</Button>}
      />
      <Card>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: 'code', label: t('code') },
              { key: 'name', label: t('name') },
              { key: 'description', label: t('description') },
              {
                key: 'is_active', label: t('status'),
                render: (r) => (
                  <span className={r.is_active ? 'text-green-600' : 'text-red-600'}>
                    {r.is_active ? t('active') : t('inactive')}
                  </span>
                ),
              },
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
        title={editing ? t('edit') : `${t('add')} ${t('categories')}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button onClick={save}>{t('save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="col-span-2">
            <Input label={t('description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </Modal>
    </div>
  )
}
