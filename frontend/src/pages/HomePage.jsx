import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useToast } from '../context/AppContext'
import * as api from '../api'
import ProductCard from '../components/ProductCard'
import './HomePage.css'

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [activeCoupons, setActiveCoupons] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      toast.success('Ödeme başarılı! Siparişiniz alındı.')
      // Optional: Clear URL params
      setSearchParams({})
      navigate('/orders')
    } else if (payment === 'failed') {
      toast.error('Ödeme başarısız oldu.')
      setSearchParams({})
    }
  }, [searchParams, setSearchParams, toast, navigate])

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
    api.getActiveCoupons().then(setActiveCoupons).catch(() => {})
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getProducts(page, 12, selectedCategory)
      setProducts(data.content || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, selectedCategory])

  useEffect(() => {
    setPage(0)
  }, [selectedCategory])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filtered = search
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    : products

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <i className="fas fa-bolt"></i> Premium E-Ticaret
            </div>
            <h1 className="hero-title">
              Geleceğin <span className="neon-text">Alışveriş</span> <br/>
              Deneyimi Burada
            </h1>
            <p className="hero-sub">
              Binlerce ürün, güvenli ödeme, hızlı teslimat.
            </p>
            <div className="hero-search">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Ürün ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')}><i className="fas fa-times"></i></button>
              )}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orb orb-1"></div>
            <div className="hero-orb orb-2"></div>
            <div className="hero-card-float">
              <i className="fas fa-shopping-bag"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Active Coupons Banner */}
      {activeCoupons.length > 0 && (
        <section className="coupons-banner-section" style={{ padding: '20px 0', background: 'var(--primary)', color: '#fff' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                <i className="fas fa-ticket-alt" style={{ marginRight: '8px' }}></i>
                Fırsatları Kaçırma:
              </div>
              {activeCoupons.map(c => (
                <div key={c.id} style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '10px 15px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  whiteSpace: 'nowrap'
                }}>
                  <div>
                    <strong style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>{c.code}</strong>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                      % {c.discountPercentage} İndirim {c.minimumCartAmount > 0 ? `(${c.minimumCartAmount} TL ve üzeri)` : ''}
                    </div>
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Kupon kodu kopyalandı!'); }}
                    style={{ background: '#fff', color: 'var(--primary)', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Kopyala
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <div className="cats-scroll">
            <button
              className={`cat-chip ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <i className="fas fa-th"></i> Tümü
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`cat-chip ${selectedCategory === c.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(c.id)}
              >
                <i className="fas fa-tag"></i> {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <h2>
              {selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.name || 'Ürünler'
                : search ? `"${search}" için sonuçlar` : 'Tüm Ürünler'
              }
            </h2>
            {!loading && (
              <span className="product-count">{filtered.length} ürün</span>
            )}
          </div>

          {loading ? (
            <div className="products-skeleton">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-img"></div>
                  <div className="skeleton-info">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><i className="fas fa-search"></i></div>
              <h3>Ürün bulunamadı</h3>
              <p>Arama kriterlerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-ghost"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <i className="fas fa-chevron-left"></i> Önceki
              </button>
              <span className="page-info">{page + 1} / {totalPages}</span>
              <button
                className="btn btn-ghost"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Sonraki <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
