import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api'
import { Button, Card, Money, PageHeader, Spinner, StatusBadge } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function SalesOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLocale()
  const [doc, setDoc] = useState(null)

  const load = () => {
    api.get(`/sales-orders/${id}`).then((res) => setDoc(res.data))
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

  const createDelivery = async () => {
    try {
      const { data } = await api.post('/deliveries', {
        sales_order_id: doc.id,
        partner_id: doc.partner_id,
        warehouse_id: doc.warehouse_id,
        date: new Date().toISOString().slice(0, 10),
        items: doc.items.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price })),
      })
      navigate(`/deliveries/${data.id}`)
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const createInvoice = async () => {
    try {
      const { data } = await api.post('/invoices', {
        type: 'sale',
        partner_id: doc.partner_id,
        ref_type: 'sales_order',
        ref_id: doc.id,
        date: new Date().toISOString().slice(0, 10),
        vat_rate: 7,
        note: `จาก ${doc.number}`,
        items: doc.items.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price, vat_rate: i.vat_rate })),
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
            <Button variant="secondary" onClick={() => navigate('/sales-orders')}>{t('back')}</Button>
            <Button variant="secondary" onClick={() => window.open(`/print/sales-order/${doc.id}`, '_blank')}>🖨 {t('print')}</Button>
            {doc.status === 'draft' && (
              <>
                <Button variant="secondary" onClick={() => navigate(`/sales-orders/${doc.id}/edit`)}>{t('edit')}</Button>
                <Button onClick={() => doAction(() => api.post(`/sales-orders/${doc.id}/confirm`))}>{t('confirm_doc')}</Button>
              </>
            )}
            {['confirmed'].includes(doc.status) && (
              <Button variant="success" onClick={createDelivery}>📦 {t('deliver')}</Button>
            )}
            {['confirmed', 'delivered'].includes(doc.status) && (
              <Button onClick={createInvoice}>🧾 {t('create_invoice')}</Button>
            )}
            {['draft', 'confirmed'].includes(doc.status) && (
              <Button variant="danger" onClick={() => doAction(() => api.post(`/sales-orders/${doc.id}/cancel`))}>{t('cancel')}</Button>
            )}
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title={t('document')} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><p className="text-gray-500 dark:text-gray-400">{t('number')}</p><p className="font-medium text-gray-800 dark:text-gray-100">{doc.number}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">{t('date')}</p><p className="text-gray-700 dark:text-gray-300">{fmtDate(doc.date)}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">{t('customer')}</p><p className="font-medium text-gray-800 dark:text-gray-100">{doc.partner?.name}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">{t('status')}</p><StatusBadge status={doc.status} /></div>
            {doc.warehouse && <div><p className="text-gray-500 dark:text-gray-400">{t('warehouse')}</p><p className="text-gray-700 dark:text-gray-300">{doc.warehouse.name}</p></div>}
            {doc.deliveries?.length > 0 && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('deliveries')}</p>
                {doc.deliveries.map((d) => (
                  <button key={d.id} onClick={() => navigate(`/deliveries/${d.id}`)} className="text-blue-600 dark:text-blue-400 hover:underline block">{d.number}</button>
                ))}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">{t('product')}</th>
                  <th className="px-3 py-2 text-right">{t('qty')}</th>
                  <th className="px-3 py-2 text-right">{t('unit_price')}</th>
                  <th className="px-3 py-2 text-right">{t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{it.product?.name_th}</td>
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
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('subtotal')}</span><Money value={doc.subtotal} /></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('discount')}</span><Money value={doc.discount_amount} /></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('vat')}</span><Money value={doc.vat_amount} /></div>
              <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2"><span className="text-gray-800 dark:text-gray-100">{t('total')}</span><Money value={doc.total} /></div>
            </div>
          </Card>
          {doc.note && <Card title={t('note')}><p className="text-sm text-gray-600 dark:text-gray-400">{doc.note}</p></Card>}
        </div>
      </div>
    </div>
  )
}
