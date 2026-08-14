import { useEffect, useState } from 'react'
import api from '../../api'
import { Button, Card, Input, Money, PageHeader, Select, Spinner, StatCard, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function StockMovementsReport() {
  const { t } = useLocale()
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/products', { params: { per_page: 100 } }).then((res) => setProducts(res.data.data))
    api.get('/warehouses').then((res) => setWarehouses(res.data))
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/reports/stock-movements', {
        params: { product_id: productId || undefined, warehouse_id: warehouseId || undefined, type: type || undefined, from, to },
      })
      setData(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [productId, warehouseId, type, from, to])

  if (loading || !data) return <Spinner />

  return (
    <div>
      <PageHeader
        title={t('stock_movements_report')}
        actions={
          <>
            <Select
              options={[{ value: '', label: t('all_products') }, ...products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name_th}` }))]}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-64"
            />
            <Select
              options={[{ value: '', label: t('all') }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-40"
            />
            <Select
              options={[{ value: '', label: t('all') }, { value: 'in', label: t('in_qty') }, { value: 'out', label: t('out_qty') }]}
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-36"
            />
            <Input label={t('from')} type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <Input label={t('to')} type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={() => window.print()}>🖨 {t('print')}</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('items')} value={data.summary.count} color="text-gray-700" />
        <StatCard label={t('in_qty')} value={data.summary.total_in} color="text-green-600" />
        <StatCard label={t('out_qty')} value={data.summary.total_out} color="text-red-600" />
        <StatCard label={t('total_value')} value={<Money value={data.summary.total_value} />} color="text-blue-600" />
      </div>

      <Card>
        <Table
          columns={[
            { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
            { key: 'ref_label', label: t('document') },
            { key: 'product', label: t('product'), render: (r) => `${r.product_code} - ${r.product_name}` },
            { key: 'warehouse', label: t('warehouse'), render: (r) => r.warehouse_name || '-' },
            { key: 'in', label: t('in_qty'), align: 'right', render: (r) => r.in > 0 ? <span className="text-green-600 tabular-nums">{r.in}</span> : <span className="tabular-nums">-</span> },
            { key: 'out', label: t('out_qty'), align: 'right', render: (r) => r.out > 0 ? <span className="text-red-600 tabular-nums">{r.out}</span> : <span className="tabular-nums">-</span> },
            { key: 'unit_cost', label: t('unit_cost'), align: 'right', render: (r) => <Money value={r.unit_cost} /> },
            { key: 'value', label: t('valuation'), align: 'right', render: (r) => <Money value={r.value} /> },
            { key: 'note', label: t('note'), render: (r) => r.note || '-' },
          ]}
          data={data.items}
          empty={t('no_data')}
        />
      </Card>
    </div>
  )
}
