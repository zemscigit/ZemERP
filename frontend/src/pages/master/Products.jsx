import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Badge, Button, Card, Input, Modal, Money, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { useLocale } from '../../i18n'

const empty = { code: '', barcode: '', name_th: '', name_en: '', category: '', unit: 'ชิ้น', image: '', purchase_price: 0, sale_price: 0, is_active: true }

export default function Products() {
  const { t } = useLocale()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/products', { params: { search, per_page: 100 } })
      setRows(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search])

  const openNew = () => {
    setEditing(null)
    setForm(empty)
    setError('')
    setModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ ...row })
    setError('')
    setModal(true)
  }

  const save = async () => {
    setError('')
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form)
      } else {
        await api.post('/products', form)
      }
      setModal(false)
      load()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const remove = async (row) => {
    if (!confirm(t('delete') + '?')) return
    try {
      await api.delete(`/products/${row.id}`)
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  // อัปรูป: resize เป็น thumbnail (max 300px) แล้วเก็บเป็น base64
  const onImageFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 300
        let { width, height } = img
        if (width > max || height > max) {
          const ratio = Math.min(max / width, max / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        setForm({ ...form, image: canvas.toDataURL('image/jpeg', 0.8) })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const columns = [
    { key: 'image', label: '', render: (r) => r.image ? <img src={r.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" /> : <span className="inline-flex w-10 h-10 rounded-lg bg-gray-50 items-center justify-center text-lg">📦</span> },
    { key: 'code', label: t('code') },
    { key: 'name_th', label: t('name') },
    { key: 'category', label: t('category') },
    { key: 'unit', label: t('unit') },
    { key: 'purchase_price', label: t('purchase_price'), align: 'right', render: (r) => <Money value={r.purchase_price} /> },
    { key: 'sale_price', label: t('sale_price'), align: 'right', render: (r) => <Money value={r.sale_price} /> },
    { key: 'stock_on_hand', label: t('stock'), align: 'right', render: (r) => <span className="tabular-nums">{r.stock_on_hand}</span> },
    { key: 'is_active', label: t('status'), render: (r) => r.is_active ? <Badge color="green">{t('confirmed')}</Badge> : <Badge>{t('draft')}</Badge> },
    {
      key: 'actions',
      label: t('actions'),
      render: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(r) }}>{t('edit')}</Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={(e) => { e.stopPropagation(); remove(r) }}>{t('delete')}</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('products')}
        actions={
          <>
            <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            <Button onClick={openNew}>+ {t('add')}</Button>
          </>
        }
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} data={rows} />}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? t('edit') : `${t('add')} ${t('products')}`}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button onClick={save}>{t('save')}</Button>
          </>
        }
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* รายละเอียดสินค้า */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <Input label={t('code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <Input label="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            <Input label={`${t('name')} (ไทย)`} value={form.name_th} onChange={(e) => setForm({ ...form, name_th: e.target.value })} required />
            <Input label={`${t('name')} (EN)`} value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
            <Input label={t('category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label={t('unit')} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input label={t('purchase_price')} type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
            <Input label={t('sale_price')} type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
            <Select
              label={t('status')}
              options={[{ value: true, label: t('confirmed') }, { value: false, label: t('draft') }]}
              value={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
            />
          </div>

          {/* รูปสินค้า (ด้านขวา) */}
          <div className="w-full md:w-60 shrink-0">
            <span className="block text-sm font-medium text-gray-600 mb-1">{t('product_image')}</span>
            {form.image ? (
              <img src={form.image} alt="" className="w-full aspect-square rounded-xl border border-gray-200 object-cover" />
            ) : (
              <div className="w-full aspect-square rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-5xl text-gray-300">📦</div>
            )}
            <div className="mt-3 flex flex-col items-start gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                📷 {t('upload_image')}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageFile(e.target.files[0])} />
              </label>
              {form.image && (
                <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-xs text-red-600 hover:text-red-700">✕ {t('remove_image')}</button>
              )}
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </Modal>
    </div>
  )
}
