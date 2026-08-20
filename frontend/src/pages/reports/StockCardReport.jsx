import { useEffect, useState } from 'react'
import api from '../../api'
import { Button, Card, Input, Money, PageHeader, Select, Spinner, StatCard, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function StockCardReport() {
  const { t } = useLocale()
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/products', { params: { per_page: 100 } }).then((res) => setProducts(res.data.data))
    api.get('/warehouses').then((res) => setWarehouses(res.data))
  }, [])

  const load = async (pid) => {
    if (!pid) return
    setLoading(true)
    try {
      const { data } = await api.get('/reports/stock-card', {
        params: { product_id: pid, warehouse_id: warehouseId || undefined, from, to },
      })
      setData(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(productId) }, [productId, warehouseId, from, to])

  return (
    <div>
      <PageHeader
        title={t('stock_card')}
        actions={
          <>
            <Select
              options={[{ value: '', label: t('choose_product') }, ...products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name_th}` }))]}
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
            <Input label={t('from')} type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <Input label={t('to')} type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={() => window.print()}>🖨 {t('print')}</Button>
          </>
        }
      />

      {!productId && (
        <Card>
          <p className="text-center text-gray-400 py-10">{t('choose_product')}</p>
        </Card>
      )}

      {loading && <Spinner />}

      {!loading && data && (
        <>
          <Card className="mb-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <span className="font-semibold text-gray-800 dark:text-gray-100">{data.product.code} - {data.product.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('unit')}: {data.product.unit}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('date')}: {fmtDate(from)} - {fmtDate(to)}</span>
            </div>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('opening_balance')} value={data.opening} color="text-gray-700 dark:text-gray-300" />
            <StatCard label={t('in_qty')} value={data.total_in} color="text-green-600" />
            <StatCard label={t('out_qty')} value={data.total_out} color="text-red-600" />
            <StatCard label={t('closing_balance')} value={data.closing} color="text-blue-600" />
          </div>

          <Card>
            <Table
              columns={[
                { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
                { key: 'ref_label', label: t('document') },
                { key: 'in', label: t('in_qty'), align: 'right', render: (r) => r.in > 0 ? <span className="text-green-600 tabular-nums">{r.in}</span> : <span className="tabular-nums">-</span> },
                { key: 'out', label: t('out_qty'), align: 'right', render: (r) => r.out > 0 ? <span className="text-red-600 tabular-nums">{r.out}</span> : <span className="tabular-nums">-</span> },
                { key: 'balance', label: t('balance'), align: 'right', render: (r) => <span className="font-medium tabular-nums">{r.balance}</span> },
                { key: 'unit_cost', label: t('unit_cost'), align: 'right', render: (r) => <Money value={r.unit_cost} /> },
                { key: 'note', label: t('note'), render: (r) => r.note || '-' },
              ]}
              data={data.items}
              empty={t('no_data')}
            />
          </Card>
        </>
      )}
    </div>
  )
}
