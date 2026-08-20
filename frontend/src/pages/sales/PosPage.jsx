import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../../api'
import { Button, Card, Input, Select } from '../../components/ui'
import { fmtMoney, useLocale } from '../../i18n'

export default function PosPage() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentModal, setPaymentModal] = useState(false)
  const [payForm, setPayForm] = useState({ method: 'cash', amount: 0, reference: '' })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    api.get('/pos/products').then((r) => setProducts(r.data)).catch(() => {})
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const params = {}
    if (search) params.search = search
    if (categoryId) params.category_id = categoryId
    api.get('/pos/products', { params }).then((r) => setProducts(r.data)).catch(() => {})
  }, [search, categoryId])

  const filteredProducts = products

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === product.id)
      if (existing) {
        return prev.map((c) =>
          c.product_id === product.id
            ? { ...c, qty: Number(c.qty) + 1, amount: (Number(c.qty) + 1) * Number(c.unit_price) }
            : c
        )
      }
      return [...prev, {
        product_id: product.id,
        code: product.code,
        name: product.name_th,
        image: product.image,
        qty: 1,
        unit_price: product.sale_price || 0,
        amount: product.sale_price || 0,
      }]
    })
  }

  const updateQty = (idx, newQty) => {
    if (Number(newQty) < 0) return
    setCart((prev) =>
      prev.map((c, i) =>
        i === idx
          ? { ...c, qty: newQty, amount: Number(newQty) * Number(c.unit_price) }
          : c
      )
    )
  }

  const removeItem = (idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx))
  }

  const subtotal = cart.reduce((s, c) => s + Number(c.amount), 0)
  const vatRate = 7
  const vatAmount = Math.round(subtotal * vatRate / 100 * 100) / 100
  const total = Math.round((subtotal + vatAmount) * 100) / 100

  const openPayment = () => {
    if (cart.length === 0) return
    setPayForm({ method: 'cash', amount: total, reference: '' })
    setPaymentModal(true)
  }

  const checkout = async () => {
    setSaving(true)
    try {
      const { data } = await api.post('/pos/checkout', {
        items: cart.map((c) => ({
          product_id: c.product_id,
          qty: Number(c.qty),
          unit_price: Number(c.unit_price),
        })),
        payment_method: payForm.method,
        amount_paid: Number(payForm.amount),
        reference: payForm.reference || null,
      })
      setResult(data)
      setPaymentModal(false)
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const newSale = () => {
    setCart([])
    setResult(null)
    setSearch('')
    setCategoryId('')
    searchRef.current?.focus()
  }

  // ── Success screen ──
  if (result) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">ขายสำเร็จ!</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <p>ใบเสร็จรับเงิน: <span className="font-mono font-bold text-gray-800 dark:text-gray-100">{result.invoice.number}</span></p>
            <p>ยอดรวม: <span className="font-bold text-gray-800 dark:text-gray-100">{fmtMoney(result.invoice.total)}</span></p>
            <p>รับเงิน: <span className="font-bold text-gray-800 dark:text-gray-100">{fmtMoney(result.payment.amount)}</span></p>
            {result.change > 0 && (
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                เงินทอน: {fmtMoney(result.change)}
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={newSale} className="px-8">ขายใหม่</Button>
            <Button variant="secondary" onClick={() => navigate(`/invoices/${result.invoice.id}`)}>ดูใบแจ้งหนี้</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      {/* ── Left: Product Grid ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search + Categories */}
        <div className="flex gap-3 mb-4 shrink-0">
          <div className="flex-1 relative">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t('search')}... 🔍`}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto shrink-0 pb-1">
          <button
            onClick={() => setCategoryId('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
              ${!categoryId ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {t('all')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                ${categoryId === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-left hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden mb-2">
                {p.image ? (
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">📦</span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{p.code}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">{fmtMoney(p.sale_price)}</p>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
              ไม่พบสินค้า
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart ── */}
      <div className="w-80 lg:w-96 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 dark:text-gray-100">🛒 {t('items')} ({cart.length})</h2>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">ล้างทั้งหมด</button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {cart.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              เลือกสินค้าจากด้านซ้าย
            </div>
          )}
          {cart.map((item, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{fmtMoney(item.unit_price)}/ชิ้น</p>
                </div>
                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(idx, Number(item.qty) - 1)}
                    className="w-7 h-7 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold"
                  >−</button>
                  <input
                    type="number"
                    step="any"
                    value={item.qty}
                    onChange={(e) => updateQty(idx, e.target.value)}
                    className="w-16 text-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => updateQty(idx, Number(item.qty) + 1)}
                    className="w-7 h-7 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold"
                  >+</button>
                </div>
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{fmtMoney(item.amount)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span> subtotal</span>
            <span>{fmtMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>VAT {vatRate}%</span>
            <span>{fmtMoney(vatAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700 pt-2">
            <span>{t('total')}</span>
            <span>{fmtMoney(total)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="px-4 pb-4">
          <Button
            onClick={openPayment}
            disabled={cart.length === 0}
            className="w-full py-4 text-lg font-bold"
          >
            💳 ชำระเงิน
          </Button>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={() => setPaymentModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">💳 ชำระเงิน</h3>

            {/* Total */}
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">ยอดรวมที่ต้องชำระ</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{fmtMoney(total)}</p>
            </div>

            {/* Payment method */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: 'cash', label: '💵 เงินสด', icon: '💵' },
                { value: 'bank', label: '🏦 โอนเงิน', icon: '🏦' },
                { value: 'transfer', label: '📱 QR/Transfer', icon: '📱' },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPayForm({ ...payForm, method: m.value, amount: payForm.method === 'cash' ? total : payForm.amount })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    payForm.method === m.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span className="text-2xl block mb-1">{m.icon}</span>
                  <span className="text-xs font-medium">{m.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>

            {/* Amount paid */}
            <div className="mb-4">
              <Input
                label="รับเงิน"
                type="number"
                step="any"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                className="text-2xl"
              />
              {Number(payForm.amount) >= total && (
                <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">
                  เงินทอน: {fmtMoney(Number(payForm.amount) - total)}
                </p>
              )}
            </div>

            {/* Quick amount buttons (cash) */}
            {payForm.method === 'cash' && (
              <div className="flex gap-2 mb-4">
                {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000].filter((v, i, a) => a.indexOf(v) === i).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPayForm({ ...payForm, amount: amt })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      Number(payForm.amount) === amt
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {amt === total ? 'พอดี' : fmtMoney(amt)}
                  </button>
                ))}
              </div>
            )}

            {payForm.method !== 'cash' && (
              <Input
                label="Reference / เลขอ้างอิง"
                value={payForm.reference}
                onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                placeholder="เลขที่โอน / slip"
              />
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => setPaymentModal(false)} className="flex-1">ยกเลิก</Button>
              <Button onClick={checkout} disabled={saving || Number(payForm.amount) < total} className="flex-1">
                {saving ? '...' : '✅ ยืนยัน'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
