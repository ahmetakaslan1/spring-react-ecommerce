import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useCart, useToast } from '../context/AppContext'
import * as api from '../api'
import './CartDrawer.css'

export default function CartDrawer({ onClose }) {
  const { user } = useAuth()
  const { cartItems, cartTotal, cartLoading, fetchCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [removing, setRemoving] = useState(null)

  useEffect(() => { fetchCart() }, [])

  const handleRemove = async (cartItemId) => {
    setRemoving(cartItemId)
    try {
      await api.removeFromCart(cartItemId)
      await fetchCart()
      toast.success('Ürün sepetten kaldırıldı')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRemoving(null)
    }
  }

  const handleDecrease = async (cartItemId) => {
    try {
      await api.decreaseCartItem(cartItemId)
      await fetchCart()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const goCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  return (
    <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cart-drawer">
        <div className="drawer-header">
          <h2><i className="fas fa-shopping-cart"></i> Sepetim
            <span className="cart-count-badge">{cartItems.length}</span>
          </h2>
          <button className="drawer-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="drawer-body">
          {cartLoading ? (
            <div className="loading-page"><div className="spinner"></div></div>
          ) : cartItems.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><i className="fas fa-shopping-cart"></i></div>
              <h3>Sepetiniz Boş</h3>
              <p>Ürün eklemek için alışverişe başlayın</p>
              <button className="btn btn-primary" style={{marginTop:'20px'}} onClick={onClose}>
                <i className="fas fa-store"></i> Alışverişe Başla
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item-img">
                      {item.productImageUrl
                        ? <img src={item.productImageUrl} alt={item.productName} />
                        : <i className="fas fa-box"></i>
                      }
                    </div>
                    <div className="cart-item-info">
                      <p className="cart-item-name">{item.productName}</p>
                      <div className="cart-item-meta">
                        <div className="cart-item-qty-controls">
                          <button className="qty-btn" onClick={() => handleDecrease(item.id)} title="Azalt">
                            <i className="fas fa-minus"></i>
                          </button>
                          <span className="cart-item-qty">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => api.addToCart(item.productId, 1).then(fetchCart)} title="Artır">
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <span className="cart-item-price">
                          {(item.price * item.quantity).toLocaleString('tr-TR', {minimumFractionDigits:2})} TL
                        </span>
                      </div>
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => handleRemove(item.id)}
                      disabled={removing === item.id}
                    >
                      {removing === item.id
                        ? <span className="btn-spinner"></span>
                        : <i className="fas fa-trash"></i>
                      }
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span>Toplam</span>
                  <strong className="neon-text">
                    {cartTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL
                  </strong>
                </div>
                <button className="btn btn-primary btn-block btn-lg" onClick={goCheckout}>
                  <i className="fas fa-credit-card"></i> Ödemeye Geç
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
