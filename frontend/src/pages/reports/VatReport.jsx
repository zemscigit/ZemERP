import { useEffect, useState } from 'react'
import api from '../../api'
import { Button, Card, Input, Money, PageHeader, Spinner, StatCard, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function VatReport() {
  const { t } = useLocale()
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/reports/vat', { params: { from, to } })
      setData(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [from, to])

  if (loading || !data) return <Spinner />

  const itemCols = [
    { key: 'number', label: t('number') },
    { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
    { key: 'partner', label: t('partner'), render: (r) => r.partner?.name },
    { key: 'subtotal', label: t('base_amount'), align: 'right', render: (r) => <Money value={r.subtotal} /> },
    { key: 'vat_amount', label: t('vat'), align: 'right', render: (r) => <Money value={r.vat_amount} /> },
    { key: 'total', label: t('total'), align: 'right', render: (r) => <Money value={r.total} /> },
  ]

  return (
    <div>
      <PageHeader
        title={t('vat_report')}
        actions={
          <>
            <Input label={t('from')} type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <Input label={t('to')} type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={() => window.print()}>🖨 {t('print')}</Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label={t('output_vat')} value={<Money value={data.output.vat} />} color="text-purple-600" />
        <StatCard label={t('input_vat')} value={<Money value={data.input.vat} />} color="text-orange-600" />
        <StatCard label={t('net_vat')} value={<Money value={data.net_vat} />} color={data.net_vat >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>

      <div className="space-y-6">
        <Card title={`${t('output_vat')} (${t('sale')}) - ${fmtDate(from)} ถึง ${fmtDate(to)}`}>
          <Table columns={itemCols} data={data.output.items} />
          <div className="flex justify-end gap-6 mt-3 text-sm font-semibold">
            <span>{t('base_amount')}: <Money value={data.output.base} /></span>
            <span>{t('vat')}: <Money value={data.output.vat} /></span>
            <span>{t('total')}: <Money value={data.output.total} /></span>
          </div>
        </Card>

        <Card title={`${t('input_vat')} (${t('purchase')}) - ${fmtDate(from)} ถึง ${fmtDate(to)}`}>
          <Table columns={itemCols} data={data.input.items} />
          <div className="flex justify-end gap-6 mt-3 text-sm font-semibold">
            <span>{t('base_amount')}: <Money value={data.input.base} /></span>
            <span>{t('vat')}: <Money value={data.input.vat} /></span>
            <span>{t('total')}: <Money value={data.input.total} /></span>
          </div>
        </Card>
      </div>
    </div>
  )
}
