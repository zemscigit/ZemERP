import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api'
import ItemLines from '../../components/ItemLines'
import { Button, Card, Input, PageHeader, Select } from '../../components/ui'
import { Money } from '../../components/ui'
import { useLocale } from '../../i18n'

export default function PurchaseOrderForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLocale()
  const [partners, setPartners] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [form, setForm] = useState({
    partner_id: '', warehouse_id: '', date: new Date().toISOString().slice(0, 10),
    expected_date: '', discount_amount: 0, note: '', items: [{ product_id: '', qty: 1, unit_price: 0, vat_rate: 7, amount: 0 }],
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/partners', { params: { type: 'supplier', per_page: 100 } }).then((res) => setPartners(res.data.data))
    api.get('/products', { params: { per_page: 100 } }).then((res) => setProducts(res.data.data))
    api.get('/warehouses').then((res) => setWarehouses(res.data))
    if (id) {
      api.get(`/purchase-orders/${id}`).then((res) => {
        const d = res.data
        setForm({
          partner_id: d.partner_id, warehouse_id: d.warehouse_id || '', date: d.date.slice(0, 10),
          expected_date: d.expected_date?.slice(0, 10) || '', discount_amount: d.discount_amount,
          note: d.note || '', items: d.items.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price, vat_rate: i.vat_rate, amount: i.amount })),
        })
      })
    }
  }, [id])

  const subtotal = form.items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const vatRate = form.items[0]?.vat_rate ?? 7
  const discount = Number(form.discount_amount) || 0
  const vat = Math.round((subtotal - discount) * vatRate) / 100
  const total = subtotal - discount + vat

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, items: form.items.filter((i) => i.product_id) }
      if (id) await api.put(`/purchase-orders/${id}`, payload)
      else await api.post('/purchase-orders', payload)
      navigate('/purchase-orders')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={id ? t('edit') : `${t('new')} ${t('purchase_order_doc')}`}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}>{t('back')}</Button>}
      />
      <Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select
            label={t('supplier')}
            options={partners.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
            value={form.partner_id}
            onChange={(e) => setForm({ ...form, partner_id: Number(e.target.value) })}
          />
          <Select
            label={t('warehouse')}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            value={form.warehouse_id}
            onChange={(e) => setForm({ ...form, warehouse_id: Number(e.target.value) || '' })}
          />
          <Input label={t('date')} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label={t('expected_date')} type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
        </div>

        <ItemLines items={form.items} onChange={(items) => setForm({ ...form, items })} products={products} priceLabel="purchase_price" />

        <div className="mt-6 flex flex-col items-end gap-2">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t('subtotal')}</span><Money value={subtotal} /></div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">{t('discount')}</span>
              <Input type="number" min="0" step="any" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} className="w-32 text-right" />
            </div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t('vat')} ({vatRate}%)</span><Money value={vat} /></div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2"><span>{t('total')}</span><Money value={total} /></div>
          </div>
        </div>

        <div className="mt-4">
          <Input label={t('note')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>

        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>{t('cancel')}</Button>
          <Button onClick={save} disabled={saving}>{saving ? '...' : t('save')}</Button>
        </div>
      </Card>
    </div>
  )
}
