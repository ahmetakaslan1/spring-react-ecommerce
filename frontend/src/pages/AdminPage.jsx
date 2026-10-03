import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useToast } from '../context/AppContext'
import * as api from '../api'
import './AdminPage.css'

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])

  // Dashboard Stats
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0 })

  // Forms
  const [categoryName, setCategoryName] = useState('')
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '', categoryId: '', imageUrl: '' })
  const [editingProduct, setEditingProduct] = useState(null)
  const [orderTab, setOrderTab] = useState('ALL')
  const [shippingModal, setShippingModal] = useState({ isOpen: false, orderId: null, company: '', trackingNumber: '' })
  const [couponForm, setCouponForm] = useState({ code: '', discountPercentage: 10, usageLimit: 100, minimumCartAmount: 0 })
  const [coupons, setCoupons] = useState([])

  useEffect(() => {
    if (isAdmin) {
      loadDashboard()
    }
  }, [isAdmin])

  const loadDashboard = async () => {
    try {
      const [cats, prods, usrs, ords, coups] = await Promise.all([
        api.getCategories().catch(() => []),
        api.getProducts(0, 1000).catch(() => ({ content: [] })),
        api.getAllUsers().catch(() => []),
        api.getAllOrders().catch(() => []),
        api.getCoupons().catch(() => [])
      ])
      
      setCategories(cats)
      setProducts(prods.content || [])
      setUsers(usrs)
      setOrders(ords)
      setCoupons(coups)
      
      setStats({
        products: (prods.content || []).length,
        users: usrs.length,
        orders: ords.filter(o => o.status === 'PENDING').length
      })
    } catch (err) {
      toast.error('Veriler yüklenirken hata oluştu')
    }
  }

  // --- Category Actions ---
  const handleAddCategory = async (e) => {
    e.preventDefault()
    try {
      const newCat = await api.createCategory({ name: categoryName })
      setCategories(prev => [...prev, newCat])
      toast.success('Kategori eklendi')
      setCategoryName('')
    } catch (err) { toast.error(err.message) }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Emin misiniz?')) return
    try {
      await api.deleteCategory(id)
      toast.success('Kategori silindi')
      loadDashboard()
    } catch (err) { toast.error(err.message) }
  }

  // --- Product Actions ---
  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      await api.createProduct({
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        categoryId: parseInt(productForm.categoryId)
      })
      toast.success('Ürün eklendi')
      setProductForm({ name: '', description: '', price: '', stock: '', categoryId: '', imageUrl: '' })
      loadDashboard()
    } catch (err) { toast.error(err.message) }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Emin misiniz?')) return
    try {
      await api.deleteProduct(id)
      toast.success('Ürün silindi')
      loadDashboard()
    } catch (err) { toast.error(err.message) }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    try {
      await api.updateProduct(editingProduct.id, {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        stock: parseInt(editingProduct.stock),
        categoryId: parseInt(editingProduct.categoryId)
      })
      toast.success('Ürün güncellendi')
      setEditingProduct(null)
      loadDashboard()
    } catch (err) { toast.error(err.message) }
  }

  const handleFileUpload = async (e, isEditing) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await api.uploadImage(file)
      if (isEditing) {
        setEditingProduct({ ...editingProduct, imageUrl: url })
      } else {
        setProductForm({ ...productForm, imageUrl: url })
      }
      toast.success('Resim başarıyla yüklendi')
    } catch (err) {
      toast.error('Resim yüklenemedi: ' + err.message)
    }
  }

  // --- User Actions ---
  const handleToggleBan = async (id) => {
    try {
      const msg = await api.toggleBanUser(id)
      toast.success(msg || 'Kullanıcı durumu değiştirildi')
      loadDashboard()
    } catch (err) { toast.error(err.message) }
  }

  // --- Order Actions ---
  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status)
      toast.success('Sipariş durumu güncellendi')
      loadDashboard()
    } catch (err) { toast.error(err.message) }
  }

  const handleUpdateShipping = (id, currentCompany, currentTracking) => {
    setShippingModal({
      isOpen: true,
      orderId: id,
      company: currentCompany || '',
      trackingNumber: currentTracking || ''
    })
  }

  const handleSaveShipping = async (e) => {
    e.preventDefault()
    try {
      await api.updateOrderShipping(shippingModal.orderId, shippingModal.company, shippingModal.trackingNumber)
      
      // Also automatically update status to SHIPPED if we entered shipping details
      await api.updateOrderStatus(shippingModal.orderId, 'SHIPPED')
      
      toast.success('Kargo bilgileri güncellendi')
      setShippingModal({ isOpen: false, orderId: null, company: '', trackingNumber: '' })
      loadDashboard()
    } catch (err) { toast.error(err.message) }
  }

  // --- Coupon Actions ---
  const handleAddCoupon = async (e) => {
    e.preventDefault()
    try {
      await api.createCoupon({
        code: couponForm.code,
        discountPercentage: parseFloat(couponForm.discountPercentage),
        usageLimit: parseInt(couponForm.usageLimit),
        minimumCartAmount: parseFloat(couponForm.minimumCartAmount),
        isActive: true
      })
      toast.success('Kupon oluşturuldu')
      setCouponForm({ code: '', discountPercentage: 10, usageLimit: 100, minimumCartAmount: 0 })
      loadDashboard()
    } catch (err) { toast.error(err.message) }
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Yetkisiz Erişim</h3>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Ana Sayfa</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page admin-page">
      <div className="admin-container">
        
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="sidebar-header">
            <h2>ADMIN PANELİ</h2>
          </div>
          <ul className="sidebar-menu">
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <i className="fas fa-chart-line"></i> Genel Bakış
            </li>
            <li className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}>
              <i className="fas fa-tags"></i> Kategoriler
            </li>
            <li className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
              <i className="fas fa-box"></i> Ürünler
            </li>
            <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
              <i className="fas fa-users"></i> Kullanıcılar
            </li>
            <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
              <i className="fas fa-shopping-cart"></i> Siparişler
            </li>
            <li className={activeTab === 'coupons' ? 'active' : ''} onClick={() => setActiveTab('coupons')}>
              <i className="fas fa-ticket-alt"></i> Kuponlar
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="admin-content">
          
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="admin-section fade-in">
              <h2>Genel Bakış</h2>
              <p className="text-muted">Mağaza istatistikleri ve genel durum.</p>
              
              <div className="stat-cards">
                <div className="stat-card">
                  <p>Toplam Ürün</p>
                  <h3 className="neon-text">{stats.products}</h3>
                </div>
                <div className="stat-card">
                  <p>Kayıtlı Kullanıcı</p>
                  <h3 className="neon-text">{stats.users}</h3>
                </div>
                <div className="stat-card">
                  <p>Bekleyen Sipariş</p>
                  <h3 className="neon-text">{stats.orders}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="admin-section fade-in">
              <h2>Kategori Yönetimi</h2>
              <div className="admin-grid">
                <div className="glass-panel">
                  <h3>Yeni Kategori Ekle</h3>
                  <form onSubmit={handleAddCategory}>
                    <div className="input-group">
                      <label>Kategori Adı</label>
                      <input className="input" type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Ekle</button>
                  </form>
                </div>
                <div className="glass-panel table-panel">
                  <h3>Mevcut Kategoriler</h3>
                  <table>
                    <thead>
                      <tr><th>ID</th><th>Adı</th><th style={{textAlign:'right'}}>İşlem</th></tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c.id}>
                          <td>{c.id}</td>
                          <td>{c.name}</td>
                          <td style={{textAlign:'right'}}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(c.id)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          {activeTab === 'products' && (
            <div className="admin-section fade-in">
              <h2>Ürün Yönetimi</h2>
              <div className="admin-grid">
                <div className="glass-panel">
                  <h3>{editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
                  {editingProduct ? (
                    <form onSubmit={handleUpdateProduct}>
                      <div className="input-group">
                        <label>Kategori</label>
                        <select className="input" value={editingProduct.categoryId} onChange={e => setEditingProduct({...editingProduct, categoryId: e.target.value})} required>
                          <option value="">Seçiniz</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Ürün Adı</label>
                        <input className="input" type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
                      </div>
                      <div className="input-group">
                        <label>Fiyat (TL)</label>
                        <input className="input" type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} required />
                      </div>
                      <div className="input-group">
                        <label>Stok</label>
                        <input className="input" type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} required />
                      </div>
                      <div className="input-group">
                        <label>Açıklama</label>
                        <textarea className="input" rows="2" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}></textarea>
                      </div>
                      <div className="input-group">
                        <label>Resim Yükle veya URL Gir</label>
                        <div style={{display:'flex', gap:'10px'}}>
                          <input type="file" accept="image/jpeg, image/png, image/webp" className="input" style={{flex:1, padding:'6px'}} onChange={(e) => handleFileUpload(e, true)} />
                          <input className="input" type="text" placeholder="URL" style={{flex:2}} value={editingProduct.imageUrl || ''} onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})} />
                        </div>
                        {editingProduct.imageUrl && (
                          <img src={editingProduct.imageUrl} alt="Önizleme" style={{width:'80px', height:'80px', objectFit:'cover', marginTop:'10px', borderRadius:'8px'}} />
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Kaydet</button>
                        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingProduct(null)}>İptal</button>
                      </div>
                      <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Bu ürünü silmek istiyorsanız:</p>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => {
                          if (window.confirm('Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
                            handleDeleteProduct(editingProduct.id);
                            setEditingProduct(null);
                          }
                        }}>
                          <i className="fas fa-trash"></i> Kalıcı Olarak Sil
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleAddProduct}>
                      <div className="input-group">
                        <label>Kategori</label>
                        <select className="input" value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})} required>
                          <option value="">Seçiniz</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Ürün Adı</label>
                        <input className="input" type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
                      </div>
                      <div className="input-group">
                        <label>Fiyat (TL)</label>
                        <input className="input" type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} required />
                      </div>
                      <div className="input-group">
                        <label>Stok</label>
                        <input className="input" type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} required />
                      </div>
                      <div className="input-group">
                        <label>Açıklama</label>
                        <textarea className="input" rows="2" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}></textarea>
                      </div>
                      <div className="input-group">
                        <label>Resim Yükle veya URL Gir</label>
                        <div style={{display:'flex', gap:'10px'}}>
                          <input type="file" accept="image/jpeg, image/png, image/webp" className="input" style={{flex:1, padding:'6px'}} onChange={(e) => handleFileUpload(e, false)} />
                          <input className="input" type="text" placeholder="URL" style={{flex:2}} value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} />
                        </div>
                        {productForm.imageUrl && (
                          <img src={productForm.imageUrl} alt="Önizleme" style={{width:'80px', height:'80px', objectFit:'cover', marginTop:'10px', borderRadius:'8px'}} />
                        )}
                      </div>
                      <button type="submit" className="btn btn-primary w-100">Ekle</button>
                    </form>
                  )}
                </div>
                
                <div className="glass-panel table-panel">
                  <h3>Mevcut Ürünler</h3>
                  <table>
                    <thead>
                      <tr><th>ID</th><th>Adı</th><th>Kategori</th><th>Fiyat</th><th>Stok</th><th style={{textAlign:'right'}}>İşlem</th></tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.name}</td>
                          <td>{p.category?.name}</td>
                          <td>{p.price} TL</td>
                          <td>{p.stock}</td>
                          <td style={{textAlign:'right'}}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingProduct({...p, categoryId: p.category?.id})}>
                              <i className="fas fa-edit"></i> İncele / Düzenle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="admin-section fade-in">
              <h2>Kullanıcı Yönetimi</h2>
              <div className="glass-panel table-panel">
                <table>
                  <thead>
                    <tr><th>ID</th><th>Ad Soyad</th><th>Email</th><th>Durum</th><th style={{textAlign:'right'}}>İşlem</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'İsimsiz'}</td>
                        <td>{u.email}</td>
                        <td>
                          {u.active ? <span className="badge badge-success">Aktif</span> : <span className="badge badge-danger">Pasif</span>}
                        </td>
                        <td style={{textAlign:'right'}}>
                          <button className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-primary'}`} onClick={() => handleToggleBan(u.id)}>
                            {u.active ? 'Banla' : 'Kaldır'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <div className="admin-section fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Sipariş Yönetimi</h2>
                <div className="order-tabs" style={{ display: 'flex', gap: '10px' }}>
                  <button className={`btn btn-sm ${orderTab === 'ALL' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOrderTab('ALL')}>Tümü</button>
                  <button className={`btn btn-sm ${orderTab === 'PENDING' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOrderTab('PENDING')}>Ödeme Bekleyenler</button>
                  <button className={`btn btn-sm ${orderTab === 'SHIPPED' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOrderTab('SHIPPED')}>Kargolananlar</button>
                  <button className={`btn btn-sm ${orderTab === 'COMPLETED' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOrderTab('COMPLETED')}>Sipariş Alınanlar</button>
                  <button className={`btn btn-sm ${orderTab === 'CANCELLED' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOrderTab('CANCELLED')}>İptal Edilenler</button>
                </div>
              </div>
              
              <div className="glass-panel table-panel">
                <table>
                  <thead>
                    <tr><th>ID</th><th>Müşteri</th><th>Tutar</th><th>Durum</th><th>Kargo</th><th style={{textAlign:'right'}}>Durum Güncelle</th></tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter(o => orderTab === 'ALL' || o.status === orderTab)
                      .map(o => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>
                          {o.user 
                            ? ((o.user.firstName || o.user.lastName) ? `${o.user.firstName || ''} ${o.user.lastName || ''}`.trim() : o.user.email) 
                            : (o.userName || o.userEmail || 'Misafir')}
                        </td>
                        <td>{Number(o.totalAmount).toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</td>
                        <td>
                          <span className={`badge badge-${o.status?.toLowerCase()}`}>
                            {o.status === 'PENDING' ? 'Ödeme Bekliyor' :
                             o.status === 'COMPLETED' ? 'Sipariş Alındı' :
                             o.status === 'SHIPPED' ? 'Kargolandı' :
                             o.status === 'DELIVERED' ? 'Teslim Edildi' :
                             o.status === 'CANCELLED' ? 'İptal Edildi' : o.status}
                          </span>
                        </td>
                        <td>
                          {o.shippingCompany ? (
                            <div style={{fontSize:'0.85rem'}}>
                              <div><strong>{o.shippingCompany}</strong></div>
                              <div style={{color:'var(--text-muted)'}}>{o.trackingNumber}</div>
                              <button className="btn btn-ghost btn-sm" style={{padding:'2px 5px', marginTop:'5px'}} onClick={() => handleUpdateShipping(o.id, o.shippingCompany, o.trackingNumber)}>
                                Düzenle
                              </button>
                            </div>
                          ) : (
                            <button className="btn btn-outline btn-sm" onClick={() => handleUpdateShipping(o.id, '', '')}>
                              <i className="fas fa-truck"></i> Kargo Gir
                            </button>
                          )}
                        </td>
                        <td style={{textAlign:'right'}}>
                          <select className="input" style={{width:'auto', padding:'6px 12px', fontSize: '0.85rem', borderRadius:'6px'}} 
                            value={o.status} 
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}>
                            <option value="PENDING">Ödeme Bekliyor</option>
                            <option value="COMPLETED">Sipariş Alındı</option>
                            <option value="SHIPPED">Kargolandı</option>
                            <option value="DELIVERED">Teslim Edildi</option>
                            <option value="CANCELLED">İptal Et</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.filter(o => orderTab === 'ALL' || o.status === orderTab).length === 0 && (
                      <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Bu sekmede sipariş bulunamadı.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Coupons */}
          {activeTab === 'coupons' && (
            <div className="admin-section fade-in">
              <h2>Kupon Yönetimi</h2>
              <div className="admin-grid">
                <div className="glass-panel">
                  <h3>Yeni Kupon Oluştur</h3>
                  <form onSubmit={handleAddCoupon}>
                    <div className="input-group">
                      <label>Kupon Kodu</label>
                      <input className="input" type="text" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} placeholder="Örn: YAZ10" required />
                    </div>
                    <div className="input-group">
                      <label>İndirim Yüzdesi (%)</label>
                      <input className="input" type="number" min="1" max="100" value={couponForm.discountPercentage} onChange={e => setCouponForm({...couponForm, discountPercentage: e.target.value})} required />
                    </div>
                    <div className="input-group">
                      <label>Kullanım Limiti (Kişi)</label>
                      <input className="input" type="number" min="1" value={couponForm.usageLimit} onChange={e => setCouponForm({...couponForm, usageLimit: e.target.value})} required />
                    </div>
                    <div className="input-group">
                      <label>Min. Sepet Tutarı (TL)</label>
                      <input className="input" type="number" min="0" value={couponForm.minimumCartAmount} onChange={e => setCouponForm({...couponForm, minimumCartAmount: e.target.value})} required />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Kupon Oluştur</button>
                  </form>
                </div>
                <div className="glass-panel table-panel">
                  <h3>Mevcut Kuponlar</h3>
                  <table>
                    <thead>
                      <tr><th>Kod</th><th>İndirim</th><th>Min. Tutar</th><th>Kullanım</th><th>Durum</th></tr>
                    </thead>
                    <tbody>
                      {coupons.map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.code}</strong></td>
                          <td>%{c.discountPercentage}</td>
                          <td>{c.minimumCartAmount ? c.minimumCartAmount + ' TL' : '-'}</td>
                          <td>{c.usedCount} / {c.usageLimit}</td>
                          <td>
                            {c.active ? <span className="badge badge-success">Aktif</span> : <span className="badge badge-danger">Pasif</span>}
                          </td>
                        </tr>
                      ))}
                      {coupons.length === 0 && (
                        <tr><td colSpan="5" style={{textAlign: 'center'}}>Henüz kupon oluşturulmamış.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Shipping Modal */}
      {shippingModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content auth-modal">
            <button className="modal-close" onClick={() => setShippingModal({ ...shippingModal, isOpen: false })}>
              <i className="fas fa-times"></i>
            </button>
            <h2>Kargo Bilgilerini Gir</h2>
            <p className="text-muted text-center mb-4">Sipariş #{shippingModal.orderId}</p>
            <form onSubmit={handleSaveShipping}>
              <div className="input-group">
                <label>Kargo Şirketi</label>
                <select className="input" value={shippingModal.company} onChange={e => setShippingModal({ ...shippingModal, company: e.target.value })} required>
                  <option value="">Seçiniz...</option>
                  <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                  <option value="Aras Kargo">Aras Kargo</option>
                  <option value="MNG Kargo">MNG Kargo</option>
                  <option value="Sürat Kargo">Sürat Kargo</option>
                  <option value="PTT Kargo">PTT Kargo</option>
                  <option value="UPS Kargo">UPS Kargo</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div className="input-group">
                <label>Takip Numarası</label>
                <input className="input" type="text" value={shippingModal.trackingNumber} onChange={e => setShippingModal({ ...shippingModal, trackingNumber: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary w-100 mt-2">Kaydet ve Kargola</button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
