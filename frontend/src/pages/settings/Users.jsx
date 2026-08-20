import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api'
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Spinner, Table } from '../../components/ui'
import { useLocale } from '../../i18n'

const empty = { name: '', email: '', phone: '', password: '', role: 'staff', locale: 'th', is_active: true }

export default function Users() {
  const { t } = useLocale()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [resetModal, setResetModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [resetPw, setResetPw] = useState('')
  const [error, setError] = useState('')
  const [resetError, setResetError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users', { params: { search: search || undefined } })
      setRows(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search])

  const openNew = () => { setEditing(null); setForm(empty); setError(''); setModal(true) }
  const openEdit = (row) => {
    setEditing(row)
    setForm({ name: row.name, email: row.email, phone: row.phone || '', password: '', role: row.role, locale: row.locale, is_active: row.is_active })
    setError('')
    setModal(true)
  }
  const openDetail = (row) => { setSelected(row); setDetailModal(true) }
  const openReset = (row) => { setSelected(row); setResetPw(''); setResetError(''); setResetModal(true) }

  const save = async () => {
    setError('')
    try {
      if (editing) await api.put(`/users/${editing.id}`, form)
      else await api.post('/users', form)
      setModal(false)
      load()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const toggleActive = async (row) => {
    try {
      await api.put(`/users/${row.id}`, { ...row, is_active: !row.is_active })
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const resetPassword = async () => {
    setResetError('')
    try {
      await api.post(`/users/${selected.id}/reset-password`, { password: resetPw })
      setResetModal(false)
    } catch (e) {
      setResetError(getErrorMessage(e))
    }
  }

  const remove = async (row) => {
    if (!confirm(t('delete') + '?')) return
    try {
      await api.delete(`/users/${row.id}`)
      load()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const activeCount = rows.filter((r) => r.is_active).length
  const adminCount = rows.filter((r) => r.role === 'admin').length

  return (
    <div>
      <PageHeader
        title={t('users')}
        actions={
          <div className="flex items-center gap-3">
            <Input
              placeholder={`${t('search')}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Button onClick={openNew}>+ {t('add')}</Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">{t('total_users')}</p>
          <p className="text-2xl font-bold text-gray-800">{rows.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">{t('active')}</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">{t('inactive')}</p>
          <p className="text-2xl font-bold text-red-500">{rows.length - activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">{t('admin')}</p>
          <p className="text-2xl font-bold text-purple-600">{adminCount}</p>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              {
                key: 'name',
                label: t('name'),
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0
                      ${r.is_active ? 'bg-gradient-to-br from-blue-500 to-cyan-400' : 'bg-gray-300'}`}>
                      {r.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'phone', label: t('phone_number'), render: (r) => r.phone || '-' },
              {
                key: 'role',
                label: t('role'),
                render: (r) => <Badge color={r.role === 'admin' ? 'purple' : 'blue'}>{t(r.role)}</Badge>,
              },
              {
                key: 'is_active',
                label: t('status'),
                render: (r) => (
                  <button
                    onClick={() => toggleActive(r)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                      ${r.is_active
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${r.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                    {r.is_active ? t('active') : t('inactive')}
                  </button>
                ),
              },
              { key: 'locale', label: t('language'), render: (r) => r.locale === 'th' ? '🇹🇭 ไทย' : '🌐 English' },
              {
                key: 'actions',
                label: t('actions'),
                render: (r) => (
                  <div className="flex gap-1 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(r)}>{t('detail')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>{t('edit')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => openReset(r)}>🔑</Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(r)}>{t('delete')}</Button>
                  </div>
                ),
              },
            ]}
            data={rows}
            empty={t('no_data')}
          />
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? `${t('edit')} ${t('users')}` : `${t('add')} ${t('users')}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>{t('cancel')}</Button>
            <Button onClick={save}>{t('save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label={t('phone_number')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0xx-xxx-xxxx" />
          <Input
            label={t('password')}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editing ? `(${t('change_password')})` : ''}
            required={!editing}
          />
          <Select
            label={t('role')}
            options={[{ value: 'admin', label: `👑 ${t('admin')}` }, { value: 'staff', label: `👤 ${t('staff')}` }]}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
          <Select
            label={t('language')}
            options={[{ value: 'th', label: '🇹🇭 ไทย' }, { value: 'en', label: '🌐 English' }]}
            value={form.locale}
            onChange={(e) => setForm({ ...form, locale: e.target.value })}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{t('active')}</span>
          </label>
        </div>
        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={detailModal}
        onClose={() => setDetailModal(false)}
        title={t('user_detail')}
        footer={<Button variant="secondary" onClick={() => setDetailModal(false)}>{t('close')}</Button>}
      >
        {selected && (
          <div className="space-y-4">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold
                ${selected.is_active ? 'bg-gradient-to-br from-blue-500 to-cyan-400' : 'bg-gray-300'}`}>
                {selected.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{selected.name}</h3>
                <Badge color={selected.role === 'admin' ? 'purple' : 'blue'}>{t(selected.role)}</Badge>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-800">{selected.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">{t('phone_number')}</p>
                <p className="text-sm font-medium text-gray-800">{selected.phone || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">{t('language')}</p>
                <p className="text-sm font-medium text-gray-800">{selected.locale === 'th' ? '🇹🇭 ไทย' : '🌐 English'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">{t('status')}</p>
                <p className={`text-sm font-medium ${selected.is_active ? 'text-green-600' : 'text-red-500'}`}>
                  {selected.is_active ? t('active') : t('inactive')}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={resetModal}
        onClose={() => setResetModal(false)}
        title={`${t('reset_password')} — ${selected?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetModal(false)}>{t('cancel')}</Button>
            <Button onClick={resetPassword}>{t('save')}</Button>
          </>
        }
      >
        <Input
          label={t('new_password')}
          type="password"
          value={resetPw}
          onChange={(e) => setResetPw(e.target.value)}
          placeholder={t('password_min')}
          required
        />
        {resetError && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{resetError}</p>}
      </Modal>
    </div>
  )
}
