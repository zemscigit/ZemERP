import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api'
import { Button, Card, Input, Modal, Money, PageHeader, Select, Spinner, StatusBadge, Table } from '../../components/ui'
import { fmtDate, useLocale } from '../../i18n'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLocale()
  const [doc, setDoc] = useState(null)
  const [payModal, setPayModal] = useState(false)
  const [payForm, setPayForm] = useState({ amount: 0, wht_amount: 0, method: 'cash', reference: '', date: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    api.get(`/invoices/${id}`).then((res) => {
      setDoc(res.data)
      const wht = res.data.wht_amount || 0
      setPayForm({
        amount: Math.max(0, (res.data.net_payable || 0) - (res.data.paid_amount || 0)),
        wht_amount: wht,
        method: 'cash',
        reference: '',
        date: new Date().toISOString().slice(0, 10),
      })
    })
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

  const savePayment = async () => {
    setSaving(true)
    try {
      await api.post('/payments', {
        type: doc.type === 'sale' ? 'in' : 'out',
        partner_id: doc.partner_id,
        invoice_id: doc.id,
        date: payForm.date,
        amount: Number(payForm.amount),
        wht_amount: Number(payForm.wht_amount) || 0,
        method: payForm.method,
        reference: payForm.reference,
      })
      setPayModal(false)
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (!doc) return <Spinner />

  const balance = Math.max(0, doc.net_payable - doc.paid_amount)
  const canPay = ['issued', 'partial'].includes(doc.status)

  return (
    <div>
      <PageHeader
        title={doc.number}
        subtitle={`${doc.type === 'sale' ? t('customer') : t('supplier')}: ${doc.partner?.name}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/invoices?type=${doc.type}`)}>{t('back')}</Button>
            <Button variant="secondary" onClick={() => window.open(`/print/invoice/${doc.id}`, '_blank')}>🖨 {t('print')}</Button>
            {doc.status === 'draft' && (
              <Button onClick={() => doAction(() => api.post(`/invoices/${doc.id}/issue`))}>{t('issue')}</Button>
            )}
            {canPay && (
              <Button variant="success" onClick={() => setPayModal(true)}>💵 {t('record_payment')}</Button>
            )}
            {doc.status === 'issued' && (
              <Button variant="danger" onClick={() => doAction(() => api.post(`/invoices/${doc.id}/cancel`))}>{t('cancel')}</Button>
            )}
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title={t('document')} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><p className="text-gray-500">{t('number')}</p><p className="font-medium">{doc.number}</p></div>
            <div><p className="text-gray-500">{t('date')}</p><p>{fmtDate(doc.date)}</p></div>
            <div><p className="text-gray-500">{t('due_date')}</p><p>{fmtDate(doc.due_date)}</p></div>
            <div><p className="text-gray-500">{t('status')}</p><StatusBadge status={doc.status} /></div>
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
                    <td className="px-3 py-2">{it.product ? it.product.name_th : it.description}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{it.qty}</td>
                    <td className="px-3 py-2 text-right tabular-nums"><Money value={it.unit_price} /></td>
                    <td className="px-3 py-2 text-right tabular-nums"><Money value={it.amount} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {doc.payments?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-700 mb-2">{t('payments')}</h4>
              <Table
                columns={[
                  { key: 'number', label: t('number') },
                  { key: 'date', label: t('date'), render: (r) => fmtDate(r.date) },
                  { key: 'amount', label: t('amount'), align: 'right', render: (r) => <Money value={r.amount} /> },
                  { key: 'wht_amount', label: t('wht'), align: 'right', render: (r) => <Money value={r.wht_amount} /> },
                  { key: 'method', label: t('payment_method'), render: (r) => t(r.method) },
                ]}
                data={doc.payments}
              />
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card title={t('summary')}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('subtotal')}</span><Money value={doc.subtotal} /></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('vat')} ({doc.vat_rate}%)</span><Money value={doc.vat_amount} /></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('total')}</span><Money value={doc.total} /></div>
              {doc.wht_amount > 0 && (
                <div className="flex justify-between text-red-600"><span>{t('wht')} ({doc.wht_rate}%)</span><Money value={doc.wht_amount} /></div>
              )}
              <div className="flex justify-between font-bold border-t border-gray-200 pt-2"><span>{t('net_payable')}</span><Money value={doc.net_payable} /></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('paid_amount')}</span><Money value={doc.paid_amount} /></div>
              <div className="flex justify-between font-semibold text-green-600"><span>{t('balance')}</span><Money value={balance} /></div>
            </div>
          </Card>
          {doc.note && <Card title={t('note')}><p className="text-sm text-gray-600">{doc.note}</p></Card>}
        </div>
      </div>

      <Modal
        open={payModal}
        onClose={() => setPayModal(false)}
        title={`${t('record_payment')} - ${doc.number}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayModal(false)}>{t('cancel')}</Button>
            <Button variant="success" onClick={savePayment} disabled={saving}>{saving ? '...' : t('save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('date')} type="date" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} />
          <Select
            label={t('payment_method')}
            options={[
              { value: 'cash', label: t('cash') },
              { value: 'bank', label: t('bank') },
              { value: 'transfer', label: t('transfer') },
            ]}
            value={payForm.method}
            onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
          />
          <Input label={t('amount')} type="number" step="any" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
          {doc.type === 'purchase' && (
            <Input label={t('wht_amount')} type="number" step="any" value={payForm.wht_amount} onChange={(e) => setPayForm({ ...payForm, wht_amount: e.target.value })} />
          )}
          <div className="col-span-2">
            <Input label={t('reference')} value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
