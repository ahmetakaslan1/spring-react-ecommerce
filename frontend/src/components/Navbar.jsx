import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useCart } from '../context/AppContext'
import AuthModal from './AuthModal'
import CartDrawer from './CartDrawer'
import './Navbar.css'

export default function Navbar() {
  const { user, logoutUser, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [showCart, setShowCart] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const openLogin = () => { setAuthTab('login'); setShowAuth(true) }
  const openRegister = () => { setAuthTab('register'); setShowAuth(true) }

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

  const avatar = user?.gender === 'MALE'
    ? `https://avatar.iran.liara.run/public/boy?username=${user?.email}`
    : user?.gender === 'FEMALE'
    ? `https://avatar.iran.liara.run/public/girl?username=${user?.email}`
    : null

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner container">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <span className="logo-icon"><i className="fas fa-bolt"></i></span>
            <span style={{ color: 'var(--text)', fontWeight: '800' }}>GELECEK <span className="logo-accent">STORE</span></span>
          </Link>

          {/* Center Nav Links */}
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
              <i className="fas fa-home"></i> Ana Sayfa
            </Link>
            {user && (
              <Link to="/orders" className="nav-link" onClick={() => setMenuOpen(false)}>
                <i className="fas fa-box"></i> Siparişlerim
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="nav-link nav-link-admin" onClick={() => setMenuOpen(false)}>
                <i className="fas fa-shield-alt"></i> Admin
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="nav-actions">
            {/* Cart Button */}
            <button className="nav-cart-btn" onClick={() => setShowCart(true)}>
              <i className="fas fa-shopping-cart"></i>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>

            {/* Auth */}
            {user ? (
              <div className="nav-user">
                <button className="nav-user-btn" onClick={() => navigate('/profile')}>
                  {avatar
                    ? <img src={avatar} alt="avatar" className="nav-avatar" onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.className = 'nav-avatar-fallback'; e.target.alt = user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase() }} />
                    : <div className="nav-avatar-fallback">{user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</div>
                  }
                  <span className="nav-username" title={user.firstName || user.email}>
                    {user.firstName ? user.firstName : (user.email.length > 12 ? user.email.substring(0, 12) + '...' : user.email)}
                  </span>
                </button>
                <button className="nav-logout-btn" onClick={handleLogout} title="Çıkış Yap">
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            ) : (
              <div className="nav-auth-btns">
                <button className="btn btn-ghost btn-sm" onClick={openLogin}>Giriş Yap</button>
                <button className="btn btn-primary btn-sm" onClick={openRegister}>Kayıt Ol</button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button className="nav-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              <i className={`fas fa-${menuOpen ? 'times' : 'bars'}`}></i>
            </button>
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal tab={authTab} onClose={() => setShowAuth(false)} />}
      {showCart && <CartDrawer onClose={() => setShowCart(false)} />}
    </>
  )
}
