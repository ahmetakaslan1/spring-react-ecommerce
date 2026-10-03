import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as api from '../api'

const AuthContext = createContext(null)
const CartContext = createContext(null)
const ToastContext = createContext(null)

// =================== TOAST PROVIDER ===================
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{icons[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

// =================== AUTH PROVIDER ===================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.getMe()
        .then(data => setUser(data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const loginUser = async (email, password) => {
    const data = await api.login({ email, password })
    localStorage.setItem('token', data.token)
    const me = await api.getMe()
    setUser(me)
    return me
  }

  const logoutUser = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const refreshUser = async () => {
    const me = await api.getMe()
    setUser(me)
    return me
  }

  const isAdmin = user?.admin === true || user?.isAdmin === true || user?.roles?.some(r => r.roleName === 'ROLE_ADMIN')

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, refreshUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// =================== CART PROVIDER ===================
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [cartLoading, setCartLoading] = useState(false)
  const { user } = useAuth()

  const fetchCart = useCallback(async () => {
    if (!user) { setCartItems([]); return }
    setCartLoading(true)
    try {
      const data = await api.getCart()
      setCartItems(data || [])
    } catch (_) {
      setCartItems([])
    } finally {
      setCartLoading(false)
    }
  }, [user])

  useEffect(() => { fetchCart() }, [fetchCart])

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

  return (
    <CartContext.Provider value={{ cartItems, cartCount, cartTotal, cartLoading, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
