import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api'
import { Button, Spinner } from '../../components/ui'
import { fmtDate, fmtMoney, thaiBahtText, useLocale } from '../../i18n'

const titleMap = {
  'purchase-order': 'ใบสั่งซื้อ / PURCHASE ORDER',
  'sales-order': 'ใบสั่งขาย / SALES ORDER',
  delivery: 'ใบส่งสินค้า / DELIVERY NOTE',
  invoice: 'ใบแจ้งหนี้ / ใบกำกับภาษี / INVOICE & TAX INVOICE',
  receipt: 'ใบเสร็จรับเงิน / RECEIPT',
  'pos-receipt': 'ใบเสร็จรับเงิน / RECEIPT',
}

export default function PrintDocument() {
  const { type, id } = useParams()
  const { locale } = useLocale()
  const [company, setCompany] = useState(null)
  const [doc, setDoc] = useState(null)

  useEffect(() => {
    api.get('/settings').then((res) => setCompany(res.data.company))
    const endpoints = {
      'purchase-order': `/purchase-orders/${id}`,
      'sales-order': `/sales-orders/${id}`,
      delivery: `/deliveries/${id}`,
      invoice: `/invoices/${id}`,
      receipt: `/receipts/${id}`,
      'pos-receipt': `/invoices/${id}`,
    }
    api.get(endpoints[type]).then((res) => setDoc(res.data))
  }, [type, id])

  if (!company || !doc) return <Spinner />

  // ── POS Receipt (thermal 80mm) ──
  if (type === 'pos-receipt') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 print-area">
        <div className="mx-auto bg-white shadow-lg rounded-lg p-6 print-area" style={{ maxWidth: '80mm' }}>
          <div className="no-print flex justify-end gap-2 mb-4">
            <Button variant="secondary" onClick={() => window.close()}>Close</Button>
            <Button onClick={() => window.print()}>🖨 Print</Button>
          </div>

          <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
            <p className="text-lg font-bold">{company.name}</p>
            <p className="text-xs whitespace-pre-line mt-1">{company.address}</p>
            {company.phone && <p className="text-xs">Tel: {company.phone}</p>}
            {company.tax_id && <p className="text-xs">Tax ID: {company.tax_id}</p>}
          </div>

          <div className="text-center mb-2">
            <p className="text-sm font-bold">ใบเสร็จรับเงิน</p>
          </div>

          <div className="text-xs border-b border-dashed border-gray-400 pb-2 mb-2">
            <p>เลขที่: {doc.number}</p>
            <p>วันที่: {fmtDate(doc.date, locale)}</p>
            {doc.creator && <p>พนักงาน: {doc.creator.name}</p>}
          </div>

          <table className="w-full text-xs mb-2">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1">สินค้า</th>
                <th className="text-right py-1">จำนวน</th>
                <th className="text-right py-1">ราคา</th>
                <th className="text-right py-1">รวม</th>
              </tr>
            </thead>
            <tbody>
              {(doc.items || []).map((it, i) => (
                <tr key={i} className="border-b border-dashed border-gray-200">
                  <td className="py-1 pr-1">
                    <p className="truncate max-w-[120px]">{it.product?.name_th || it.description}</p>
                    <p className="text-gray-500">{fmtMoney(it.unit_price, locale)}</p>
                  </td>
                  <td className="text-right py-1 tabular-nums">{it.qty}</td>
                  <td className="text-right py-1 tabular-nums">{fmtMoney(it.unit_price, locale)}</td>
                  <td className="text-right py-1 tabular-nums">{fmtMoney(it.amount, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-xs space-y-1 border-t border-dashed border-gray-400 pt-2 mb-2">
            <div className="flex justify-between"><span>รวมเงิน</span><span className="tabular-nums">{fmtMoney(doc.subtotal, locale)}</span></div>
            {doc.discount_amount > 0 && (
              <div className="flex justify-between"><span>ส่วนลด</span><span className="tabular-nums">({fmtMoney(doc.discount_amount, locale)})</span></div>
            )}
            <div className="flex justify-between"><span>VAT {doc.vat_rate}%</span><span className="tabular-nums">{fmtMoney(doc.vat_amount, locale)}</span></div>
            <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1">
              <span>รวมทั้งสิ้น</span>
              <span className="tabular-nums">{fmtMoney(doc.total, locale)}</span>
            </div>
          </div>

          {doc.payments?.length > 0 && (
            <div className="text-xs space-y-1 border-t border-dashed border-gray-400 pt-2 mb-2">
              {doc.payments.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span>{p.method === 'cash' ? 'เงินสด' : p.method === 'bank' ? 'โอนเงิน' : p.method}</span>
                  <span className="tabular-nums">{fmtMoney(p.amount, locale)}</span>
                </div>
              ))}
              {doc.total < (doc.payments[0]?.amount || 0) && (
                <div className="flex justify-between font-bold">
                  <span>เงินทอน</span>
                  <span className="tabular-nums">{fmtMoney(doc.payments[0].amount - doc.total, locale)}</span>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-xs pt-2 border-t border-dashed border-gray-400">
            <p>ขอบคุณที่ใช้บริการ</p>
            <p className="text-gray-500 mt-1">Thank you for your purchase!</p>
            {company.document_footer && <p className="text-gray-500 mt-1">{company.document_footer}</p>}
          </div>
        </div>
      </div>
    )
  }

  const money = (n) => fmtMoney(n, locale)
  const date = (d) => fmtDate(d, locale)
  const title = titleMap[type] || ''

  const isInvoice = type === 'invoice'
  const isReceipt = type === 'receipt'
  const isDelivery = type === 'delivery'
  const isPO = type === 'purchase-order'
  const isSO = type === 'sales-order'

  const partner = isReceipt ? doc.partner : doc.partner
  const items = isReceipt ? [] : (isInvoice ? doc.items : doc.items)
  const total = isInvoice ? doc.total : (isPO || isSO ? doc.total : (isDelivery ? doc.items.reduce((s, i) => s + i.amount, 0) : doc.amount))

  const subtotal = isInvoice ? doc.subtotal : (isPO || isSO ? doc.subtotal : 0)
  const vatAmount = isInvoice ? doc.vat_amount : (isPO || isSO ? doc.vat_amount : 0)
  const discount = isInvoice ? doc.discount_amount : (isPO || isSO ? doc.discount_amount : 0)
  const whtAmount = isInvoice ? doc.wht_amount : 0

  const docNumber = isReceipt ? doc.number : doc.number

  return (
    <div className="min-h-screen bg-gray-100 p-4 print-area">
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg p-8 print-area">
        {/* ปุ่มพิมพ์ */}
        <div className="no-print flex justify-end gap-2 mb-4">
          <Button variant="secondary" onClick={() => window.close()}>Close</Button>
          <Button onClick={() => window.print()}>🖨 Print</Button>
        </div>

        {/* หัวเอกสาร */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-sm mt-1 whitespace-pre-line">{company.address}</p>
            <p className="text-sm mt-1">
              {company.tax_id && <>เลขประจำตัวผู้เสียภาษี (Tax ID): {company.tax_id} · </>}
              {company.phone && <>โทร: {company.phone} </>}
              {company.email}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold border-2 border-gray-800 px-4 py-2 inline-block">{title}</h2>
            <div className="mt-2 text-sm">
              <p><span className="font-medium">เลขที่ / No.:</span> {docNumber}</p>
              <p><span className="font-medium">วันที่ / Date:</span> {date(doc.date)}</p>
              {doc.due_date && <p><span className="font-medium">วันครบกำหนด / Due:</span> {date(doc.due_date)}</p>}
            </div>
          </div>
        </div>

        {/* คู่ค้า */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 p-3 rounded">
            <p className="text-xs text-gray-500 uppercase mb-1">{isPO ? 'ผู้ขาย / Supplier' : isReceipt ? 'ผู้ชำระเงิน / Payer' : 'ลูกค้า / Customer'}</p>
            <p className="font-semibold">{partner?.name}</p>
            {partner?.address && <p className="text-sm mt-0.5 whitespace-pre-line">{partner.address}</p>}
            {partner?.tax_id && <p className="text-sm mt-0.5">เลขภาษี: {partner.tax_id}</p>}
            {partner?.phone && <p className="text-sm mt-0.5">โทร: {partner.phone}</p>}
          </div>
          {!isReceipt && (
            <div className="border border-gray-300 p-3 rounded text-sm">
              <p className="font-medium mb-1">ผู้รับสินค้า / Ship To</p>
              <p>{company.name}</p>
              <p className="mt-0.5 whitespace-pre-line">{company.address}</p>
            </div>
          )}
        </div>

        {/* ตารางรายการ */}
        {!isReceipt && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-2 text-center w-8">#</th>
                <th className="border border-gray-300 px-2 py-2 text-left">{isInvoice ? 'รายการ / Description' : 'สินค้า / Product'}</th>
                <th className="border border-gray-300 px-2 py-2 text-right w-20">จำนวน / Qty</th>
                <th className="border border-gray-300 px-2 py-2 text-right w-28">ราคา / Price</th>
                <th className="border border-gray-300 px-2 py-2 text-right w-32">จำนวนเงิน / Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-gray-300 px-2 py-1.5">
                    {isInvoice && !it.product ? it.description : (it.product?.name_th || it.product?.name_en)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{it.qty}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{money(it.unit_price)}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{money(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* สรุปยอด */}
        <div className="flex justify-end mt-4">
          <div className="w-72 space-y-1 text-sm">
            {!isReceipt && !isDelivery && (
              <>
                <div className="flex justify-between"><span>ยอดก่อนภาษี / Subtotal</span><span className="tabular-nums">{money(subtotal)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between"><span>ส่วนลด / Discount</span><span className="tabular-nums">({money(discount)})</span></div>
                )}
                <div className="flex justify-between">
                  <span>ภาษีมูลค่าเพิ่ม (VAT {isInvoice ? doc.vat_rate : 7}%)</span>
                  <span className="tabular-nums">{money(vatAmount)}</span>
                </div>
                {whtAmount > 0 && (
                  <div className="flex justify-between"><span>ภาษีหัก ณ ที่จ่าย (WHT {doc.wht_rate}%)</span><span className="tabular-nums">({money(whtAmount)})</span></div>
                )}
              </>
            )}
            {isDelivery && (
              <div className="flex justify-between"><span>มูลค่าสินค้า / Value</span><span className="tabular-nums">{money(total)}</span></div>
            )}
            <div className="flex justify-between font-bold text-base border-t-2 border-gray-800 pt-2">
              <span>{isInvoice ? 'ยอดสุทธิ / NET PAYABLE' : isReceipt ? 'รับเงิน / Received' : 'รวมทั้งสิ้น / TOTAL'}</span>
              <span className="tabular-nums">{money(isInvoice ? doc.net_payable : total)}</span>
            </div>
          </div>
        </div>

        {!isDelivery && !isReceipt && (
          <p className="text-sm mt-4">
            <span className="font-medium">ตัวอักษร / Amount in words:</span> {thaiBahtText(isInvoice ? doc.net_payable : total)}
          </p>
        )}

        {/* หมายเหตุ */}
        {(doc.note || (company.document_footer)) && (
          <div className="mt-6 text-sm">
            <p><span className="font-medium">หมายเหตุ / Note:</span> {doc.note || ''}</p>
            {company.document_footer && <p className="text-gray-600">{company.document_footer}</p>}
          </div>
        )}

        {/* ลายเซ็น */}
        <div className="grid grid-cols-2 gap-8 mt-10">
          <div className="text-center">
            <p className="text-sm">ผู้จัดทำ / Prepared by</p>
            <div className="h-10" />
            <p className="border-t border-gray-400 pt-1 text-sm">ลงชื่อ / Signature</p>
            <p className="text-sm mt-1">วันที่ / Date</p>
          </div>
          <div className="text-center">
            <p className="text-sm">{isReceipt ? 'ผู้รับเงิน / Received by' : 'ผู้รับของ / Received by'}</p>
            <div className="h-10" />
            <p className="border-t border-gray-400 pt-1 text-sm">ลงชื่อ / Signature</p>
            <p className="text-sm mt-1">วันที่ / Date</p>
          </div>
        </div>
      </div>
    </div>
  )
}
