import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Input, Select } from '../../components/ui'
import { useLocale } from '../../i18n'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { t, locale, setLocale } = useLocale()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [lang, setLang] = useState(user?.locale || locale)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 512 * 1024) {
      setError('File size must be less than 512 KB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      // Resize to max 200px
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 200
        const ratio = Math.min(max / img.width, max / img.height, 1)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setAvatar(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const payload = { name, phone, avatar, locale: lang }
      if (newPw) {
        payload.password = newPw
        payload.current_password = currentPw
      }
      const { data } = await api.put('/me', payload)
      updateUser(data)
      setLocale(lang)
      setSuccess(t('profile_updated'))
      setCurrentPw('')
      setNewPw('')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('edit_profile')}</h1>
        <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-4xl font-bold cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => fileRef.current?.click()}
            >
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              📷 {t('change_avatar')}
            </button>
            {avatar && (
              <button
                onClick={() => setAvatar('')}
                className="mt-1 text-xs text-red-500 hover:text-red-700"
              >
                ✕ {t('remove_image')}
              </button>
            )}
          </div>

          {/* Form Section */}
          <div className="flex-1 space-y-4">
            <Input label={t('name')} value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" value={user?.email} disabled className="bg-gray-50" />
            <Input label={t('phone_number')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0xx-xxx-xxxx" />
            <Select
              label={t('language')}
              options={[{ value: 'th', label: '🇹🇭 ไทย' }, { value: 'en', label: '🌐 English' }]}
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            />
          </div>
        </div>

        {/* Password Change */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🔑 {t('change_password')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('current_password')}
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder={t('password_min')}
            />
            <Input
              label={t('new_password')}
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder={t('password_min')}
            />
          </div>
        </div>

        {/* Messages */}
        {error && <p className="text-sm text-red-600 mt-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-4 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => navigate('/')}>{t('cancel')}</Button>
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? '...' : t('save')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
