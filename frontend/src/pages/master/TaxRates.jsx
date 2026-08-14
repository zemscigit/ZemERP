import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { useLocale } from '../../i18n'

const empty = { name: '', rate: 3, type: 'service', is_active: true }

export default function TaxRates() {
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
      const { data } = await api.get('/tax-rates')
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
      if (editing) await api.put(`/tax-rates/${editing.id}`, form)
      else await api.post('/tax-rates', form)
      setModal(false)
      load()
    } catch (e) { setError(getErrorMessage(e)) }
  }

  const remove = async (row) => {
    if (!confirm(t('delete') + '?')) return
    try {
      await api.delete(`/tax-rates/${row.id}`)
      load()
    } catch (e) { alert(getErrorMessage(e)) }
  }

  return (
    <div>
      <PageHeader
        title={t('tax_rates')}
        actions={<Button onClick={openNew}>+ {t('add')}</Button>}
      />
      <Card>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: 'name', label: t('name') },
              { key: 'rate', label: t('wht_rate'), render: (r) => <span className="font-medium">{r.rate}%</span> },
              { key: 'type', label: t('type'), render: (r) => <Badge color={r.type === 'goods' ? 'blue' : 'purple'}>{r.type === 'goods' ? t('purchase') : t('sale')}</Badge> },
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
        title={editing ? t('edit') : `${t('add')} ${t('tax_rates')}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button onClick={save}>{t('save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('wht_rate')} type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required />
          <Select
            label={t('type')}
            options={[{ value: 'goods', label: t('purchase') }, { value: 'service', label: t('sale') }]}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </Modal>
    </div>
  )
}
