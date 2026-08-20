import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api'
import { Button, Card, Input, Modal, Money, PageHeader, Select, Spinner, StatusBadge } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function PurchaseOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLocale()
  const [doc, setDoc] = useState(null)
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [invForm, setInvForm] = useState({ date: '', due_date: '', vat_rate: 7, wht_rate: 0 })

  const load = () => {
    api.get(`/purchase-orders/${id}`).then((res) => setDoc(res.data))
  }

  useEffect(() => { load() }, [id])

  const doAction = async (fn, msg) => {
    try {
      await fn()
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  if (!doc) return <Spinner />

  const createInvoice = async () => {
    try {
      const { data } = await api.post('/invoices', {
        type: 'purchase',
        partner_id: doc.partner_id,
        ref_type: 'purchase_order',
        ref_id: doc.id,
        date: invForm.date || doc.date,
        due_date: invForm.due_date || null,
        vat_rate: Number(invForm.vat_rate),
        wht_rate: Number(invForm.wht_rate),
        note: `จาก ${doc.number}`,
        items: doc.items.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price, vat_rate: i.vat_rate })),
      })
      setInvoiceModal(false)
      navigate(`/invoices/${data.id}`)
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  return (
    <div>
      <PageHeader
        title={doc.number}
        subtitle={`${t('supplier')}: ${doc.partner?.name}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>{t('back')}</Button>
            <Button variant="secondary" onClick={() => window.open(`/print/purchase-order/${doc.id}`, '_blank')}>🖨 {t('print')}</Button>
            {doc.status === 'draft' && (
              <>
                <Button variant="secondary" onClick={() => navigate(`/purchase-orders/${doc.id}/edit`)}>{t('edit')}</Button>
                <Button onClick={() => doAction(() => api.post(`/purchase-orders/${doc.id}/confirm`))}>{t('confirm_doc')}</Button>
              </>
            )}
            {doc.status === 'confirmed' && (
              <Button variant="success" onClick={() => doAction(() => api.post(`/purchase-orders/${doc.id}/receive`))}>📦 {t('receive')}</Button>
            )}
            {doc.status === 'received' && (
              <Button onClick={() => setInvoiceModal(true)}>🧾 {t('create_invoice')}</Button>
            )}
            {['draft', 'confirmed'].includes(doc.status) && (
              <Button variant="danger" onClick={() => doAction(() => api.post(`/purchase-orders/${doc.id}/cancel`))}>{t('cancel')}</Button>
            )}
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title={t('document')} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><p className="text-gray-500 dark:text-gray-400">{t('number')}</p><p className="font-medium text-gray-800 dark:text-gray-100">{doc.number}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">{t('date')}</p><p className="text-gray-700 dark:text-gray-300">{fmtDate(doc.date)}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">{t('supplier')}</p><p className="font-medium text-gray-800 dark:text-gray-100">{doc.partner?.name}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">{t('status')}</p><StatusBadge status={doc.status} /></div>
            {doc.warehouse && <div><p className="text-gray-500 dark:text-gray-400">{t('warehouse')}</p><p className="text-gray-700 dark:text-gray-300">{doc.warehouse.name}</p></div>}
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

      <Modal
        open={invoiceModal}
        onClose={() => setInvoiceModal(false)}
        title={`${t('create_invoice')} (${t('purchase')})`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInvoiceModal(false)}>{t('cancel')}</Button>
            <Button onClick={createInvoice}>{t('create_invoice')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('date')} type="date" value={invForm.date || doc.date} onChange={(e) => setInvForm({ ...invForm, date: e.target.value })} />
          <Input label={t('due_date')} type="date" value={invForm.due_date} onChange={(e) => setInvForm({ ...invForm, due_date: e.target.value })} />
          <Input label={t('vat_rate')} type="number" value={invForm.vat_rate} onChange={(e) => setInvForm({ ...invForm, vat_rate: e.target.value })} />
          <Input label={t('wht_rate')} type="number" value={invForm.wht_rate} onChange={(e) => setInvForm({ ...invForm, wht_rate: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
