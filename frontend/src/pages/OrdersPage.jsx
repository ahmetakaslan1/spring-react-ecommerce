import { useState, useEffect } from 'react'
import { useAuth, useToast } from '../context/AppContext'
import * as api from '../api'
import './OrdersPage.css'

const STATUS_MAP = {
  PENDING:   { label: 'Ödeme Bekliyor',      badge: 'badge-pending',   icon: 'clock' },
  COMPLETED: { label: 'Sipariş Alındı',     badge: 'badge-completed', icon: 'check-circle' },
  SHIPPED:   { label: 'Kargoya Verildi',badge: 'badge-shipped',   icon: 'truck' },
  DELIVERED: { label: 'Teslim Edildi',  badge: 'badge-delivered', icon: 'box-open' },
  CANCELLED: { label: 'İptal Edildi',   badge: 'badge-cancelled', icon: 'ban' },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  const load = async () => {
    try {
      const data = await api.getMyOrders()
      setOrders(data || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) load() }, [user])

  const handleCancel = async (id) => {
    if (!confirm('Bu siparişi iptal etmek istiyor musunuz?')) return
    setCancelling(id)
    try {
      await api.cancelOrder(id)
      toast.success('Sipariş iptal edildi, stok iade edildi.')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCancelling(null)
    }
  }

  // Group by order id (since API returns one row per item)
  const grouped = orders.reduce((acc, order) => {
    const key = order.id
    if (!acc[key]) {
      acc[key] = {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        shippingCompany: order.shippingCompany,
        trackingNumber: order.trackingNumber,
        items: [],
      }
    }
    if (order.items) acc[key].items = order.items
    return acc
  }, {})

  const orderList = Object.values(grouped).sort((a, b) => b.id - a.id)

  if (loading) {
    return (
      <div className="page loading-page">
        <div className="spinner"></div>
        <p>Siparişler yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="page orders-page">
      <div className="container">
        <div className="page-hero">
          <h1><i className="fas fa-box" style={{color:'var(--primary)', marginRight:'12px'}}></i> Siparişlerim</h1>
          <p>{orderList.length} sipariş</p>
        </div>

        {orderList.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><i className="fas fa-box-open"></i></div>
            <h3>Henüz siparişiniz yok</h3>
            <p>İlk siparişinizi verin ve burada takip edin</p>
          </div>
        ) : (
          <div className="orders-list">
            {orderList.map(order => {
              const s = STATUS_MAP[order.status] || STATUS_MAP.PENDING
              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-id">
                      <span className="order-num">#{order.id}</span>
                      <span className="order-date">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : ''}
                      </span>
                    </div>
                    <span className={`badge ${s.badge}`}>
                      <i className={`fas fa-${s.icon}`}></i> {s.label}
                    </span>
                  </div>

                  {/* Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="order-items">
                      {order.items.map((item, i) => (
                        <div key={i} className="order-item">
                          <div className="order-item-img">
                            {item.productImageUrl
                              ? <img src={item.productImageUrl} alt={item.productName} />
                              : <i className="fas fa-box"></i>
                            }
                          </div>
                          <div className="order-item-info">
                            <p>{item.productName}</p>
                            <span>{item.quantity} adet × {(item.unitPrice || item.price)?.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                          </div>
                          <strong>{item.totalPrice?.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Shipping Info */}
                  {(order.shippingCompany || order.trackingNumber) && (
                    <div className="shipping-info">
                      <i className="fas fa-truck"></i>
                      <span>{order.shippingCompany || 'Kargo'}</span>
                      {order.trackingNumber && (
                        <span className="tracking-no">Takip No: <strong>{order.trackingNumber}</strong></span>
                      )}
                    </div>
                  )}

                  <div className="order-card-footer">
                    <div className="order-total">
                      Toplam: <strong className="neon-text">
                        {Number(order.totalAmount).toLocaleString('tr-TR', {minimumFractionDigits:2})} TL
                      </strong>
                    </div>
                    {order.status === 'PENDING' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancelling === order.id}
                      >
                        {cancelling === order.id
                          ? <><span className="btn-spinner"></span> İptal...</>
                          : <><i className="fas fa-times"></i> İptal Et</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
