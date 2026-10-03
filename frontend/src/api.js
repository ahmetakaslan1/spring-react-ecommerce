// API URL: VITE_API_BASE env değişkeninden alınır
// - Dev: vite.config.js proxy /api → localhost:8080
// - Docker: Nginx /api → BACKEND_URL (docker-compose.yml'den)
// Tek yer değiştirmek yeterli → .env dosyasındaki BACKEND_URL
const API_URL = import.meta.env.VITE_API_BASE || '/api'

// =================== AUTH ===================
export const login = (data) => post('/auth/login', data, false)
export const register = (data) => post('/auth/register', data, false)
export const getMe = () => get('/users/me')
export const updateProfile = (data) => put('/users/me', data)
export const verifyEmail = (token) => get(`/auth/verify?token=${token}`, false)

// =================== PRODUCTS ===================
export const getProducts = (page = 0, size = 12, categoryId = null) => {
  const url = categoryId 
    ? `/products/paged?page=${page}&size=${size}&categoryId=${categoryId}`
    : `/products/paged?page=${page}&size=${size}`
  return get(url, false)
}
export const getProduct = (id) => get(`/products/${id}`, false)
export const createProduct = (data) => post('/products', data)
export const updateProduct = (id, data) => put(`/products/${id}`, data)
export const deleteProduct = (id) => del(`/products/${id}`)
export const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const token = localStorage.getItem('token')
  const res = await fetch((import.meta.env.VITE_API_BASE || '/api') + '/upload', {
    method: 'POST',
    headers: token ? { 'Authorization': 'Bearer ' + token } : {},
    body: formData
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Resim yüklenemedi')
  }
  return res.text() // Returns URL string
}

// =================== CATEGORIES ===================
export const getCategories = () => get('/categories', false)
export const createCategory = (data) => post('/categories', data)
export const deleteCategory = (id) => del(`/categories/${id}`)

// =================== CART ===================
export const getCart = () => get('/cart')
export const addToCart = (productId, quantity) => post('/cart', { productId, quantity })
export const removeFromCart = (cartItemId) => del(`/cart/${cartItemId}`)
export const decreaseCartItem = (cartItemId) => patch(`/cart/${cartItemId}/decrease`)
export const checkout = (data) => post('/payment/checkout-form', data)

// =================== ORDERS ===================
export const getMyOrders = () => get('/orders/my-orders')
export const getAllOrders = () => get('/orders')
export const cancelOrder = (id) => patch(`/orders/${id}/cancel`)
export const updateOrderStatus = (id, status) => patch(`/orders/${id}/status?status=${status}`)
export const updateOrderShipping = (id, shippingCompany, trackingNumber) =>
  patch(`/orders/${id}/shipping?shippingCompany=${encodeURIComponent(shippingCompany)}&trackingNumber=${encodeURIComponent(trackingNumber)}`)

// =================== USERS (ADMIN) ===================
export const getAllUsers = () => get('/users')
export const banUser = (id) => del(`/users/${id}`)          // hard-delete (kendi hesabını silme)
export const toggleBanUser = (id) => put(`/users/${id}/ban`, {}) // ban/unban toggle

// =================== COUPONS ===================
export const createCoupon = (data) => post('/coupons', data)
export const getCoupons = () => get('/coupons')
export const getActiveCoupons = () => get('/coupons/active', false)
export const validateCoupon = (code, cartTotal) => get(`/coupons/validate/${code}${cartTotal ? '?cartTotal=' + cartTotal : ''}`)

// =================== SETTINGS ===================
export const getSettings = () => get('/settings')
export const updatePaymentSetting = (strategy) => post('/settings/update-payment', { strategy })

// =================== HTTP HELPERS ===================
function getToken() {
  return localStorage.getItem('token')
}

function headers(auth = true) {
  const h = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) h['Authorization'] = `Bearer ${token}`
  }
  return h
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text()
    let msg = `HTTP ${res.status}`
    if (text) {
      try {
        const err = JSON.parse(text)
        msg = err.message || err.error || JSON.stringify(err)
      } catch (_) {
        msg = text // If it's not JSON, use the plain text error!
      }
    }
    throw new Error(msg)
  }
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (e) {
    return text
  }
}

async function get(url, auth = true) {
  const res = await fetch(API_URL + url, { headers: headers(auth) })
  return handleResponse(res)
}

async function post(url, data, auth = true) {
  const res = await fetch(API_URL + url, {
    method: 'POST',
    headers: headers(auth),
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

async function put(url, data, auth = true) {
  const res = await fetch(API_URL + url, {
    method: 'PUT',
    headers: headers(auth),
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

async function patch(url, data = null, auth = true) {
  const res = await fetch(API_URL + url, {
    method: 'PATCH',
    headers: headers(auth),
    body: data ? JSON.stringify(data) : undefined,
  })
  return handleResponse(res)
}

async function del(url, auth = true) {
  const res = await fetch(API_URL + url, { method: 'DELETE', headers: headers(auth) })
  return handleResponse(res)
}
