import { useState } from 'react'
import { useAuth, useCart, useToast } from '../context/AppContext'
import * as api from '../api'
import AuthModal from './AuthModal'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { user } = useAuth()
  const { fetchCart } = useCart()
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAddToCart = async () => {
    if (!user) { setShowAuth(true); return }
    if (product.stock === 0) return
    setAdding(true)
    try {
      await api.addToCart(product.id, 1)
      await fetchCart()
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
      toast.success(`${product.name} sepete eklendi!`)
    } catch (err) {
      toast.error(err.message || 'Sepete eklenemedi')
    } finally {
      setAdding(false)
    }
  }

  const isOutOfStock = product.stock === 0

  return (
    <>
      <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
        {/* Image */}
        <div className="product-img-wrap">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} loading="lazy" />
            : <div className="product-img-placeholder"><i className="fas fa-box"></i></div>
          }
          {isOutOfStock && <div className="stock-overlay">Stok Tükendi</div>}
          {product.stock > 0 && product.stock <= 5 && (
            <div className="low-stock-badge">Son {product.stock} ürün!</div>
          )}
        </div>

        {/* Info */}
        <div className="product-info">
          {product.category && (
            <span className="product-category">{product.category.name}</span>
          )}
          <h3 className="product-name">{product.name}</h3>
          {product.description && (
            <p className="product-desc">{product.description}</p>
          )}
          <div className="product-footer">
            <div className="product-price">
              {product.price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}
              <span> TL</span>
            </div>
            <button
              className={`btn btn-cart ${added ? 'added' : ''} ${isOutOfStock ? 'btn-ghost' : 'btn-primary'}`}
              onClick={handleAddToCart}
              disabled={adding || isOutOfStock}
            >
              {adding
                ? <span className="btn-spinner"></span>
                : added
                ? <><i className="fas fa-check"></i> Eklendi</>
                : isOutOfStock
                ? <><i className="fas fa-ban"></i> Tükendi</>
                : <><i className="fas fa-cart-plus"></i> Sepete Ekle</>
              }
            </button>
          </div>
        </div>
      </div>

      {showAuth && <AuthModal tab="login" onClose={() => setShowAuth(false)} />}
    </>
  )
}
