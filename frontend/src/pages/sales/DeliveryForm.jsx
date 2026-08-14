import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api'
import ItemLines from '../../components/ItemLines'
import { Button, Card, Input, PageHeader, Select } from '../../components/ui'
import { useLocale } from '../../i18n'

export default function DeliveryForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useLocale()
  const [partners, setPartners] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [form, setForm] = useState({
    sales_order_id: '', partner_id: '', warehouse_id: '', date: new Date().toISOString().slice(0, 10),
    note: '', items: [{ product_id: '', qty: 1, unit_price: 0, amount: 0 }],
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/partners', { params: { type: 'customer', per_page: 100 } }).then((res) => setPartners(res.data.data))
    api.get('/products', { params: { per_page: 100 } }).then((res) => setProducts(res.data.data))
    api.get('/warehouses').then((res) => setWarehouses(res.data))
    api.get('/sales-orders', { params: { status: 'confirmed', per_page: 100 } }).then((res) => setSalesOrders(res.data.data))

    if (id) {
      api.get(`/deliveries/${id}`).then((res) => {
        const d = res.data
        setForm({
          sales_order_id: d.sales_order_id || '', partner_id: d.partner_id, warehouse_id: d.warehouse_id || '',
          date: d.date.slice(0, 10), note: d.note || '',
          items: d.items.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price, amount: i.amount })),
        })
      })
    } else if (searchParams.get('sales_order_id')) {
      api.get(`/sales-orders/${searchParams.get('sales_order_id')}`).then((res) => {
        const d = res.data
        setForm({
          sales_order_id: d.id, partner_id: d.partner_id, warehouse_id: d.warehouse_id || '',
          date: new Date().toISOString().slice(0, 10), note: '',
          items: d.items.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price, amount: i.amount })),
        })
      })
    }
  }, [id, searchParams])

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, items: form.items.filter((i) => i.product_id) }
      if (id) await api.put(`/deliveries/${id}`, payload)
      else await api.post('/deliveries', payload)
      navigate(id ? `/deliveries/${id}` : '/deliveries')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handleSO = (soId) => {
    const so = salesOrders.find((s) => s.id === Number(soId))
    if (!so) {
      setForm({ ...form, sales_order_id: '' })
      return
    }
    setForm({
      ...form,
      sales_order_id: so.id,
      partner_id: so.partner_id,
      warehouse_id: so.warehouse_id || '',
      items: so.items.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price, amount: i.amount })),
    })
  }

  return (
    <div>
      <PageHeader
        title={id ? t('edit') : `${t('new')} ${t('delivery_note')}`}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}>{t('back')}</Button>}
      />
      <Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select
            label={t('sales_orders')}
            options={salesOrders.map((s) => ({ value: s.id, label: `${s.number} - ${s.partner?.name}` }))}
            value={form.sales_order_id}
            onChange={(e) => handleSO(e.target.value)}
            placeholder="-"
          />
          <Select
            label={t('customer')}
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
        </div>

        <ItemLines items={form.items} onChange={(items) => setForm({ ...form, items })} products={products} priceLabel="sale_price" />

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
