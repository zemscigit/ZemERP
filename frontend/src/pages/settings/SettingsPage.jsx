import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Button, Card, Input, PageHeader, Select, Spinner } from '../../components/ui'
import { useLocale } from '../../i18n'

const accountKeys = [
  ['cash', 'Cash / Bank'],
  ['accounts_receivable', 'Accounts Receivable'],
  ['accounts_payable', 'Accounts Payable'],
  ['sales_revenue', 'Sales Revenue'],
  ['inventory', 'Inventory'],
  ['cogs', 'Cost of Goods Sold'],
  ['vat_input', 'Input VAT'],
  ['vat_output', 'Output VAT'],
  ['wht_receivable', 'WHT Receivable'],
  ['wht_payable', 'WHT Payable'],
]

export default function SettingsPage() {
  const { t } = useLocale()
  const [data, setData] = useState(null)
  const [company, setCompany] = useState({})
  const [vatRate, setVatRate] = useState(7)
  const [glAccounts, setGlAccounts] = useState({})
  const [documentFooter, setDocumentFooter] = useState('')
  const [accounts, setAccounts] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/settings'), api.get('/chart-of-accounts')]).then(([s, a]) => {
      setData(s.data)
      setCompany(s.data.company || {})
      setVatRate(s.data.vat_rate ?? 7)
      setGlAccounts(s.data.gl_accounts || {})
      setDocumentFooter(s.data.document_footer || '')
      setAccounts(a.data)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    setError('')
    setOk(false)
    try {
      await api.put('/settings', { company, vat_rate: vatRate, gl_accounts: glAccounts, document_footer: documentFooter })
      setOk(true)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (!data) return <Spinner />

  const accountOptions = accounts.map((a) => ({ value: a.code, label: `${a.code} - ${a.name_th}` }))

  return (
    <div>
      <PageHeader title={t('company_settings')} actions={<Button onClick={save} disabled={saving}>{saving ? '...' : t('save')}</Button>} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={t('company_info')}>
          <div className="space-y-4">
            <Input label={t('company_name')} value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
            <Input label={t('address')} value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label={t('tax_id')} value={company.tax_id} onChange={(e) => setCompany({ ...company, tax_id: e.target.value })} />
              <Input label={t('phone')} value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
            </div>
            <Input label="Email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
            <Input label={t('vat_rate')} type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
            <Input label={t('document_footer')} value={documentFooter} onChange={(e) => setDocumentFooter(e.target.value)} />
          </div>
        </Card>

        <Card title={t('gl_accounts')}>
          <div className="space-y-3">
            {accountKeys.map(([key, label]) => (
              <Select
                key={key}
                label={label}
                options={accountOptions}
                value={glAccounts[key] || ''}
                onChange={(e) => setGlAccounts({ ...glAccounts, [key]: e.target.value })}
              />
            ))}
          </div>
        </Card>
      </div>

      {error && <p className="text-sm text-red-600 mt-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {ok && <p className="text-sm text-green-600 mt-4 bg-green-50 rounded-lg px-3 py-2">Saved ✓</p>}
    </div>
  )
}
