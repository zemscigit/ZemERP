import { useEffect, useState } from 'react'
import api from '../../api'
import { Button, Card, Money, PageHeader, Select, Spinner, StatCard, Table } from '../../components/ui'
import { useLocale } from '../../i18n'

export default function StockReport() {
  const { t } = useLocale()
  const [warehouses, setWarehouses] = useState([])
  const [warehouseId, setWarehouseId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/warehouses').then((res) => setWarehouses(res.data))
  }, [])

  const load = async (wid) => {
    setLoading(true)
    try {
      const { data } = await api.get('/reports/stock', { params: { warehouse_id: wid } })
      setData(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(warehouseId) }, [warehouseId])

  if (loading || !data) return <Spinner />

  return (
    <div>
      <PageHeader
        title={t('stock_report')}
        actions={
          <>
            <Select
              options={[{ value: '', label: t('all') }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-48"
            />
            <Button variant="secondary" onClick={() => window.print()}>🖨 {t('print')}</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label={t('product_qty_total')} value={data.summary.total_qty} color="text-blue-600" />
        <StatCard label={t('total_value')} value={<Money value={data.summary.total_value} />} color="text-green-600" />
      </div>

      <Card>
        <Table
          columns={[
            { key: 'code', label: t('code') },
            { key: 'name', label: t('product') },
            { key: 'category', label: t('category') },
            { key: 'unit', label: t('unit') },
            { key: 'qty', label: t('stock_on_hand'), align: 'right', render: (r) => <span className={r.qty <= 0 ? 'text-red-600' : ''}>{r.qty}</span> },
            { key: 'avg_cost', label: t('avg_cost'), align: 'right', render: (r) => <Money value={r.avg_cost} /> },
            { key: 'valuation', label: t('valuation'), align: 'right', render: (r) => <Money value={r.valuation} /> },
          ]}
          data={data.items}
        />
      </Card>
    </div>
  )
}
