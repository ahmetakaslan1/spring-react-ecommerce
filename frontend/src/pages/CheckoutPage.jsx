import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useCart, useToast } from '../context/AppContext'
import * as api from '../api'
import './CheckoutPage.css'

export default function CheckoutPage() {
  const { user } = useAuth()
  const { cartItems, cartTotal, fetchCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [couponData, setCouponData] = useState(null)
  const [iyzicoHtml, setIyzicoHtml] = useState('')

  // Address form — pre-filled from user profile
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    district: '',
    address: '',
    couponCode: '',
  })

  // Pre-fill from profile
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        city: user.city || '',
        district: user.district || '',
        address: user.address || '',
      }))
    }
  }, [user])

  // Execute Iyzico Scripts
  useEffect(() => {
    if (iyzicoHtml) {
      const container = document.getElementById('iyzi-container')
      if (container) {
        container.innerHTML = iyzicoHtml
        const scripts = container.getElementsByTagName('script')
        for (let i = 0; i < scripts.length; i++) {
          const script = document.createElement('script')
          script.text = scripts[i].text
          if (scripts[i].src) script.src = scripts[i].src
          document.head.appendChild(script).parentNode.removeChild(script)
        }
      }
    }
  }, [iyzicoHtml])

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return
    try {
      const data = await api.validateCoupon(coupon.trim(), cartTotal)
      setCouponData(data)
      toast.success(`%${data.discountPercentage} indirim uygulandı!`)
    } catch (err) {
      toast.error(err.message || 'Geçersiz veya süresi dolmuş kupon')
      setCouponData(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.firstName || !form.phone || !form.city || !form.address) {
      toast.error('Lütfen zorunlu alanları doldurun!')
      return
    }

    setLoading(true)
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phone,
        city: form.city,
        district: form.district,
        fullAddress: form.address,
        couponCode: coupon || null,
      }

      const result = await api.checkout(payload)

      if (typeof result === 'string') {
        // Iyzico sends us a script block. We save it to state.
        setIyzicoHtml(result)
      } else if (result?.paymentPageUrl) {
        window.location.href = result.paymentPageUrl
      } else if (result?.checkoutFormContent) {
        document.open()
        document.write(result.checkoutFormContent)
        document.close()
      } else {
        await fetchCart()
        toast.success('Sipariş oluşturuldu!')
        navigate('/orders')
      }
    } catch (err) {
      toast.error(err.message || 'Ödeme başlatılamadı')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="page">
        <div className="loading-page">
          <div className="empty-state">
            <div className="icon"><i className="fas fa-lock"></i></div>
            <h3>Giriş yapmanız gerekiyor</h3>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="page">
        <div className="loading-page">
          <div className="empty-state">
            <div className="icon"><i className="fas fa-shopping-cart"></i></div>
            <h3>Sepetiniz boş</h3>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Alışverişe Başla
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page checkout-page">
      <div className="container">
        <div className="checkout-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Geri
          </button>
          <h1><i className="fas fa-credit-card"></i> Ödeme</h1>
        </div>

        <div className="checkout-layout">
          {/* Left: Form */}
          <form className="checkout-form" onSubmit={handleSubmit}>

            {/* Address Section */}
            <div className="checkout-section">
              <h3>
                <i className="fas fa-map-marker-alt"></i>
                Teslimat & Fatura Bilgileri
                {(user.city || user.address) && (
                  <span className="prefill-badge"><i className="fas fa-magic"></i> Profilden dolduruldu</span>
                )}
              </h3>

              <div className="form-row">
                <div className="input-group">
                  <label>Ad <span className="required">*</span></label>
                  <input className="input" type="text" placeholder="Ahmet"
                    value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Soyad</label>
                  <input className="input" type="text" placeholder="Akaslan"
                    value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                </div>
              </div>

              <div className="input-group">
                <label>Telefon <span className="required">*</span></label>
                <div className="input-icon-wrap">
                  <i className="fas fa-phone icon"></i>
                  <input className="input" type="tel" placeholder="05xx xxx xx xx"
                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Şehir <span className="required">*</span></label>
                  <input className="input" type="text" placeholder="Mardin"
                    value={form.city} onChange={e => setForm({...form, city: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>İlçe</label>
                  <input className="input" type="text" placeholder="Artuklu"
                    value={form.district} onChange={e => setForm({...form, district: e.target.value})} />
                </div>
              </div>

              <div className="input-group">
                <label>Açık Adres <span className="required">*</span></label>
                <textarea className="input" rows={3} placeholder="Mahalle, sokak, bina no..."
                  value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
              </div>

              {(!user.city && !user.address) && (
                <div className="address-tip">
                  <i className="fas fa-info-circle"></i>
                  Profilinizde adres kaydetmek için <button type="button" onClick={() => navigate('/profile')}>Profil sayfasını</button> ziyaret edin. Bir sonraki siparişinizde otomatik doldurulsun!
                </div>
              )}
            </div>

            {/* Coupon Section */}
            <div className="checkout-section">
              <h3><i className="fas fa-tag"></i> İndirim Kuponu</h3>
              <div className="coupon-row">
                <input
                  className="input"
                  type="text"
                  placeholder="Kupon kodunuz varsa girin (opsiyonel)"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  disabled={couponData !== null}
                />
                {coupon && !couponData && (
                  <button type="button" className="btn btn-ghost" onClick={handleApplyCoupon}>
                    Uygula
                  </button>
                )}
                {couponData && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => { setCoupon(''); setCouponData(null) }}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              {couponData && (
                <p className="coupon-ok"><i className="fas fa-check-circle"></i> "{couponData.code}" kodu ile %{couponData.discountPercentage} indirim uygulandı</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg checkout-submit" disabled={loading}>
              {loading
                ? <><span className="btn-spinner"></span> Ödeme başlatılıyor...</>
                : <><i className="fas fa-lock"></i> Güvenli Ödemeye Geç</>
              }
            </button>

            <p className="secure-note">
              <i className="fas fa-shield-alt"></i>
              256-bit SSL şifreli güvenli ödeme · Iyzico altyapısı
            </p>

            {/* Iyzico Form Container */}
            <div id="iyzi-container" style={{ marginTop: '20px' }}></div>
          </form>

          {/* Right: Order Summary */}
          <div className="order-summary">
            <h3>Sipariş Özeti</h3>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item.productId} className="summary-item">
                  <div className="summary-item-img">
                    {item.productImageUrl
                      ? <img src={item.productImageUrl} alt={item.productName} />
                      : <i className="fas fa-box"></i>
                    }
                  </div>
                  <div className="summary-item-info">
                    <p>{item.productName}</p>
                    <span>{item.quantity} adet × {item.price.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                  </div>
                  <strong>
                    {(item.price * item.quantity).toLocaleString('tr-TR', {minimumFractionDigits:2})} TL
                  </strong>
                </div>
              ))}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row">
              <span>Ara Toplam</span>
              <span>{cartTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
            </div>
            <div className="summary-row">
              <span>Kargo</span>
              <span className="free-shipping">Ücretsiz</span>
            </div>
            {couponData && (
              <div className="summary-row discount" style={{ color: 'var(--success-color)' }}>
                <span>Kupon ({couponData.code} - %{couponData.discountPercentage})</span>
                <span>- {((cartTotal * couponData.discountPercentage) / 100).toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
              </div>
            )}
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Toplam</span>
              <strong className="neon-text">
                {couponData 
                  ? (cartTotal - (cartTotal * couponData.discountPercentage) / 100).toLocaleString('tr-TR', {minimumFractionDigits:2})
                  : cartTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})
                } TL
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
