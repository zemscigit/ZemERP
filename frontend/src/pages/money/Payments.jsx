import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Button, Card, Input, Modal, Money, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

const emptyForm = { date: '', amount: 0, wht_amount: 0, method: 'cash', reference: '', note: '' }

export default function Payments() {
  const { t } = useLocale()
  const [type, setType] = useState('in')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [partners, setPartners] = useState([])
  const [invoices, setInvoices] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/payments', { params: { type } })
      setRows(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [type])

  const openNew = async () => {
    setError('')
    const invType = type === 'in' ? 'sale' : 'purchase'
    const partnerType = type === 'in' ? 'customer' : 'supplier'
    const [p, i] = await Promise.all([
      api.get('/partners', { params: { type: partnerType, per_page: 100 } }),
      api.get('/invoices', { params: { type: invType, per_page: 100 } }),
    ])
    setPartners(p.data.data)
    setInvoices(i.data.data.filter((inv) => ['issued', 'partial'].includes(inv.status)))
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await api.post('/payments', {
        type,
        partner_id: Number(form.partner_id),
        invoice_id: form.invoice_id ? Number(form.invoice_id) : null,
        date: form.date,
        amount: Number(form.amount),
        wht_amount: Number(form.wht_amount) || 0,
        method: form.method,
        reference: form.reference,
        note: form.note,
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
      await api.delete(`/payments/${row.id}`)
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const columns = [
    { key: 'number', label: t('number') },
    { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
    { key: 'partner', label: t('partner'), render: (r) => r.partner?.name },
    { key: 'invoice', label: t('invoice_doc'), render: (r) => r.invoice?.number || '-' },
    { key: 'amount', label: t('amount'), align: 'right', render: (r) => <Money value={r.amount} /> },
    { key: 'wht_amount', label: t('wht'), align: 'right', render: (r) => <Money value={r.wht_amount} /> },
    { key: 'method', label: t('payment_method'), render: (r) => t(r.method) },
    {
      key: 'actions', label: t('actions'),
      render: (r) => (
        <div className="flex gap-1">
          {type === 'in' && r.receipt && (
            <Button variant="ghost" size="sm" onClick={() => window.open(`/print/receipt/${r.receipt.id}`, '_blank')}>🖨</Button>
          )}
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(r)}>{t('delete')}</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('payments')}
        actions={
          <>
            <Select
              options={[{ value: 'in', label: t('in') }, { value: 'out', label: t('out') }]}
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-40"
            />
            <Button onClick={openNew}>+ {t('record_payment')}</Button>
          </>
        }
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={rows} />}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`${t('record_payment')} (${type === 'in' ? t('in') : t('out')})`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button variant="success" onClick={save} disabled={saving}>{saving ? '...' : t('save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Select
            label={t('partner')}
            options={partners.map((p) => ({ value: p.id, label: p.name }))}
            value={form.partner_id}
            onChange={(e) => setForm({ ...form, partner_id: Number(e.target.value) })}
          />
          <Select
            label={t('invoice_doc')}
            options={invoices.map((i) => ({ value: i.id, label: `${i.number} (${t('balance')}: ${Math.max(0, i.net_payable - i.paid_amount)})` }))}
            value={form.invoice_id}
            onChange={(e) => {
              const inv = invoices.find((i) => i.id === Number(e.target.value))
              setForm({
                ...form,
                invoice_id: Number(e.target.value),
                amount: inv ? Math.max(0, inv.net_payable - inv.paid_amount) : form.amount,
                wht_amount: inv ? inv.wht_amount : form.wht_amount,
              })
            }}
            placeholder="-"
          />
          <Input label={t('date')} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select
            label={t('payment_method')}
            options={[
              { value: 'cash', label: t('cash') },
              { value: 'bank', label: t('bank') },
              { value: 'transfer', label: t('transfer') },
            ]}
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          />
          <Input label={t('amount')} type="number" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          {type === 'out' && (
            <Input label={t('wht_amount')} type="number" step="any" value={form.wht_amount} onChange={(e) => setForm({ ...form, wht_amount: e.target.value })} />
          )}
          <div className="col-span-2">
            <Input label={t('reference')} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Input label={t('note')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </Modal>
    </div>
  )
}
