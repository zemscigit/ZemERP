import { Button, Input, Money, Select } from './ui'
import { useLocale } from '../i18n'

export default function ItemLines({ items, onChange, products = [], unitPrices = {}, priceLabel }) {
  const { t } = useLocale()

  const update = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    const row = next[idx]
    row.amount = Math.round((Number(row.qty) || 0) * (Number(row.unit_price) || 0) * 100) / 100
    onChange(next)
  }

  const addRow = () => {
    onChange([...items, { product_id: '', qty: 1, unit_price: 0, vat_rate: 7, amount: 0 }])
  }

  const removeRow = (idx) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.code} - ${p.name_th}`,
    image: p.image || undefined,
  }))

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
              <th className="px-2 py-2 font-medium w-8">#</th>
              <th className="px-2 py-2 font-medium min-w-56">{t('product')}</th>
              <th className="px-2 py-2 font-medium w-24">{t('qty')}</th>
              <th className="px-2 py-2 font-medium w-32">{t('unit_price')}</th>
              <th className="px-2 py-2 font-medium w-24 text-right">{t('amount')}</th>
              <th className="px-2 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="px-2 py-1.5 text-gray-400 dark:text-gray-500">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <Select
                    options={productOptions}
                    value={it.product_id}
                    onChange={(e) => {
                      const pid = Number(e.target.value)
                      const p = products.find((x) => x.id === pid)
                      const patch = { product_id: pid }
                      if (p) {
                        patch.unit_price = priceLabel === 'purchase_price' ? p.purchase_price : p.sale_price
                      }
                      update(idx, patch)
                    }}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" min="0" step="any" value={it.qty} onChange={(e) => update(idx, { qty: e.target.value })} />
                </td>
                <td className="px-2 py-1.5">
                  <Input type="number" min="0" step="any" value={it.unit_price} onChange={(e) => update(idx, { unit_price: e.target.value })} />
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-800 dark:text-gray-200"><Money value={it.amount} /></td>
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(idx)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-lg leading-none">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="secondary" size="sm" onClick={addRow} className="mt-2">+ {t('items')}</Button>
    </div>
  )
}
