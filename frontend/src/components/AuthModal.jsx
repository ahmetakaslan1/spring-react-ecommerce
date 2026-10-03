import { useState } from 'react'
import { useAuth, useToast } from '../context/AppContext'
import * as api from '../api'
import './AuthModal.css'

export default function AuthModal({ tab: initialTab = 'login', onClose }) {
  const [tab, setTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const toast = useToast()

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // Register form
  const [regForm, setRegForm] = useState({
    firstName: '', lastName: '', email: '', password: '', gender: 'UNKNOWN'
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginUser(loginForm.email, loginForm.password)
      toast.success('Hoş geldiniz!')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Giriş başarısız!')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.register(regForm)
      toast.success('Kayıt başarılı! Şimdi giriş yapabilirsiniz.')
      setTab('login')
      setLoginForm({ email: regForm.email, password: '' })
    } catch (err) {
      toast.error(err.message || 'Kayıt başarısız!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal auth-modal">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >Giriş Yap</button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
          >Kayıt Ol</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-header">
              <div className="auth-icon"><i className="fas fa-bolt"></i></div>
              <h2>Tekrar Hoş Geldiniz</h2>
              <p>Hesabınıza giriş yapın</p>
            </div>

            <div className="input-group">
              <label>E-Posta</label>
              <div className="input-icon-wrap">
                <i className="fas fa-envelope icon"></i>
                <input
                  type="email" className="input"
                  placeholder="ornek@mail.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Şifre</label>
              <div className="input-icon-wrap">
                <i className="fas fa-lock icon"></i>
                <input
                  type="password" className="input"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <><span className="btn-spinner"></span> Giriş yapılıyor...</> : <><i className="fas fa-sign-in-alt"></i> Giriş Yap</>}
            </button>

            <p className="auth-switch">
              Hesabınız yok mu?{' '}
              <button type="button" onClick={() => setTab('register')}>Kayıt olun</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="auth-header">
              <div className="auth-icon secondary"><i className="fas fa-user-plus"></i></div>
              <h2>Hesap Oluştur</h2>
              <p>Hızlı ve ücretsiz kayıt olun</p>
            </div>

            <div className="input-group" style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label>Ad</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-user icon"></i>
                  <input
                    type="text" className="input"
                    placeholder="Ahmet"
                    value={regForm.firstName}
                    onChange={e => setRegForm({...regForm, firstName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label>Soyad</label>
                <div className="input-icon-wrap">
                  <input
                    type="text" className="input"
                    placeholder="Akaslan"
                    value={regForm.lastName}
                    onChange={e => setRegForm({...regForm, lastName: e.target.value})}
                    required
                    style={{ paddingLeft: '15px' }}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>E-Posta</label>
              <div className="input-icon-wrap">
                <i className="fas fa-envelope icon"></i>
                <input
                  type="email" className="input"
                  placeholder="ornek@mail.com"
                  value={regForm.email}
                  onChange={e => setRegForm({...regForm, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Şifre</label>
              <div className="input-icon-wrap">
                <i className="fas fa-lock icon"></i>
                <input
                  type="password" className="input"
                  placeholder="En az 6 karakter"
                  value={regForm.password}
                  onChange={e => setRegForm({...regForm, password: e.target.value})}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Cinsiyet <span style={{color:'var(--text-muted)'}}>· Avatar için</span></label>
              <div className="gender-select">
                {[['MALE','Erkek','mars'],['FEMALE','Kadın','venus'],['UNKNOWN','Belirtmek istemiyorum','genderless']].map(([val, label, icon]) => (
                  <button
                    key={val}
                    type="button"
                    className={`gender-btn ${regForm.gender === val ? 'active' : ''}`}
                    onClick={() => setRegForm({...regForm, gender: val})}
                  >
                    <i className={`fas fa-${icon}`}></i>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-secondary btn-block btn-lg" disabled={loading}>
              {loading ? <><span className="btn-spinner"></span> Kayıt yapılıyor...</> : <><i className="fas fa-user-plus"></i> Kayıt Ol</>}
            </button>

            <p className="auth-switch">
              Zaten hesabınız var mı?{' '}
              <button type="button" onClick={() => setTab('login')}>Giriş yapın</button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
