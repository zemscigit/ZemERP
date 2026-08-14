import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api'
import { Button, Card, Money, PageHeader, Spinner, StatusBadge } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function DeliveryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLocale()
  const [doc, setDoc] = useState(null)

  const load = () => {
    api.get(`/deliveries/${id}`).then((res) => setDoc(res.data))
  }

  useEffect(() => { load() }, [id])

  const doAction = async (fn) => {
    try {
      await fn()
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const createInvoice = async () => {
    try {
      const { data } = await api.post('/invoices', {
        type: 'sale',
        partner_id: doc.partner_id,
        ref_type: 'delivery',
        ref_id: doc.id,
        date: new Date().toISOString().slice(0, 10),
        vat_rate: 7,
        note: `จาก ${doc.number}`,
        items: doc.items.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price, vat_rate: 7 })),
      })
      navigate(`/invoices/${data.id}`)
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  if (!doc) return <Spinner />

  return (
    <div>
      <PageHeader
        title={doc.number}
        subtitle={`${t('customer')}: ${doc.partner?.name}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/deliveries')}>{t('back')}</Button>
            <Button variant="secondary" onClick={() => window.open(`/print/delivery/${doc.id}`, '_blank')}>🖨 {t('print')}</Button>
            {doc.status === 'draft' && (
              <>
                <Button variant="secondary" onClick={() => navigate(`/deliveries/${doc.id}/edit`)}>{t('edit')}</Button>
                <Button variant="success" onClick={() => doAction(() => api.post(`/deliveries/${doc.id}/complete`))}>📦 {t('deliver')}</Button>
              </>
            )}
            {doc.status === 'delivered' && (
              <Button onClick={createInvoice}>🧾 {t('create_invoice')}</Button>
            )}
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title={t('document')} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><p className="text-gray-500">{t('number')}</p><p className="font-medium">{doc.number}</p></div>
            <div><p className="text-gray-500">{t('date')}</p><p>{fmtDate(doc.date)}</p></div>
            <div><p className="text-gray-500">{t('customer')}</p><p className="font-medium">{doc.partner?.name}</p></div>
            <div><p className="text-gray-500">{t('status')}</p><StatusBadge status={doc.status} /></div>
            {doc.warehouse && <div><p className="text-gray-500">{t('warehouse')}</p><p>{doc.warehouse.name}</p></div>}
            {doc.sales_order && (
              <div>
                <p className="text-gray-500">{t('sales_orders')}</p>
                <button onClick={() => navigate(`/sales-orders/${doc.sales_order.id}`)} className="text-blue-600 hover:underline">{doc.sales_order.number}</button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">{t('product')}</th>
                  <th className="px-3 py-2 text-right">{t('qty')}</th>
                  <th className="px-3 py-2 text-right">{t('unit_price')}</th>
                  <th className="px-3 py-2 text-right">{t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{it.product?.name_th}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{it.qty}</td>
                    <td className="px-3 py-2 text-right tabular-nums"><Money value={it.unit_price} /></td>
                    <td className="px-3 py-2 text-right tabular-nums"><Money value={it.amount} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title={t('summary')}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('items')}</span><span>{doc.items.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('total_amount')}</span><Money value={doc.items.reduce((s, i) => s + i.amount, 0)} /></div>
            </div>
          </Card>
          {doc.note && <Card title={t('note')}><p className="text-sm text-gray-600">{doc.note}</p></Card>}
        </div>
      </div>
    </div>
  )
}
