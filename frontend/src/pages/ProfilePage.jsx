import { useState, useEffect } from 'react'
import { useAuth, useToast } from '../context/AppContext'
import * as api from '../api'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    name: '', gender: 'UNKNOWN', birthDate: '',
    phone: '', city: '', district: '', address: '',
    password: '',
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        gender: user.gender || 'UNKNOWN',
        birthDate: user.birthDate || '',
        phone: user.phone || '',
        city: user.city || '',
        district: user.district || '',
        address: user.address || '',
        password: '',
      })
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      await api.updateProfile(payload)
      await refreshUser()
      toast.success('Profil güncellendi!')
    } catch (err) {
      toast.error(err.message || 'Güncelleme başarısız!')
    } finally {
      setSaving(false)
    }
  }

  const avatar = user?.gender === 'MALE'
    ? `https://avatar.iran.liara.run/public/boy?username=${user?.email}`
    : user?.gender === 'FEMALE'
    ? `https://avatar.iran.liara.run/public/girl?username=${user?.email}`
    : null

  if (!user) {
    return (
      <div className="page loading-page">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="page profile-page">
      <div className="container">
        {/* Profile Hero */}
        <div className="profile-hero">
          <div className="profile-avatar-lg">
            {avatar
              ? <img src={avatar} alt="avatar" />
              : <i className="fas fa-user"></i>
            }
          </div>
          <div className="profile-hero-info">
            <h1>{user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'İsimsiz Kullanıcı'}</h1>
            <p><i className="fas fa-envelope"></i> {user.email}</p>
            {user.city && <p><i className="fas fa-map-marker-alt"></i> {user.city}</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <i className="fas fa-user"></i> Profil Bilgileri
          </button>
          <button className={`profile-tab ${activeTab === 'address' ? 'active' : ''}`} onClick={() => setActiveTab('address')}>
            <i className="fas fa-map-marker-alt"></i> Adres Bilgileri
          </button>
          <button className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <i className="fas fa-shield-alt"></i> Güvenlik
          </button>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-card">
              <h2>Kişisel Bilgiler</h2>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Ad</label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-user icon"></i>
                    <input className="input" type="text" placeholder="Adınız"
                      value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  </div>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Soyad</label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-user icon"></i>
                    <input className="input" type="text" placeholder="Soyadınız"
                      value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Doğum Tarihi</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-calendar icon"></i>
                  <input className="input" type="date"
                    value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} />
                </div>
              </div>

              <div className="input-group">
                <label>Cinsiyet <span style={{color:'var(--text-muted)', fontWeight:'normal', fontSize:'0.8rem'}}>· Avatar'ı etkiler</span></label>
                <div className="gender-select">
                  {[['MALE','Erkek','mars'],['FEMALE','Kadın','venus'],['UNKNOWN','Belirtmem','genderless']].map(([val,label,icon]) => (
                    <button key={val} type="button"
                      className={`gender-btn ${form.gender === val ? 'active' : ''}`}
                      onClick={() => setForm({...form, gender: val})}>
                      <i className={`fas fa-${icon}`}></i>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="btn-spinner"></span> Kaydediliyor...</> : <><i className="fas fa-save"></i> Kaydet</>}
              </button>
            </div>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <div className="profile-card">
              <h2>Teslimat Adresi</h2>
              <p className="tab-desc">
                <i className="fas fa-info-circle"></i>
                Bu bilgiler siparişlerinizde otomatik doldurulacak.
              </p>

              <div className="input-group">
                <label>Telefon Numarası</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-phone icon"></i>
                  <input className="input" type="tel" placeholder="05xx xxx xx xx"
                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="input-group">
                  <label>Şehir</label>
                  <input className="input" type="text" placeholder="Mardin"
                    value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>İlçe</label>
                  <input className="input" type="text" placeholder="Artuklu"
                    value={form.district} onChange={e => setForm({...form, district: e.target.value})} />
                </div>
              </div>

              <div className="input-group">
                <label>Açık Adres</label>
                <textarea className="input" rows={3} placeholder="Mahalle, sokak, bina no, daire..."
                  value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="btn-spinner"></span> Kaydediliyor...</> : <><i className="fas fa-save"></i> Adresi Kaydet</>}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="profile-card">
              <h2>Şifre Değiştir</h2>
              <p className="tab-desc">
                <i className="fas fa-info-circle"></i>
                Boş bırakırsanız şifreniz değişmez.
              </p>

              <div className="input-group">
                <label>Yeni Şifre</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-lock icon"></i>
                  <input className="input" type="password" placeholder="En az 6 karakter"
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    minLength={form.password ? 6 : 0} />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary" disabled={saving}>
                {saving ? <><span className="btn-spinner"></span> Güncelleniyor...</> : <><i className="fas fa-key"></i> Şifreyi Güncelle</>}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
