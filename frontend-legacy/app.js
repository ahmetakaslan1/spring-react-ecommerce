const API_URL = 'http://localhost:8080';
// const API_URL = window.location.origin; 

// Global State
let currentPage = 0;
const pageSize = 12;
let currentCategoryId = null; // Aktif kategori filtresi
let categoriesList = []; // Gelen kategoriler

// Uygulama Başladığında
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    updateCartBadge(); // Sayfa yüklendiğinde sepet sayısını getir
    fetchCategories();
    fetchProducts(currentPage);
    
    // Check if redirected from a full-page Iyzico payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        showToast('Ödeme Başarılı! Siparişiniz alındı 🎉', 'success');
        // Clean the URL without refreshing
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('payment') === 'failed') {
        showToast('Ödeme Başarısız! Lütfen tekrar deneyin.', 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Form Dinleyicileri
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('profile-update-form').addEventListener('submit', handleProfileUpdate);
    
    // Pagination Dinleyicileri
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            fetchProducts(currentPage);
        }
    });
    document.getElementById('next-btn').addEventListener('click', () => {
        currentPage++;
        fetchProducts(currentPage);
    });
});

// --- API ÇAĞRILARI ---

// Kategorileri Çek (Filtreleme için)
async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (response.ok) {
            categoriesList = await response.json();
            renderCategoryFilters();
        }
    } catch (error) {
        console.error("Kategoriler çekilemedi", error);
    }
}

// Ürünleri Çek (Şifresiz - Herkese Açık)
async function fetchProducts(page) {
    try {
        let url = `${API_URL}/products/paged?page=${page}&size=${pageSize}`;
        if (currentCategoryId !== null) {
            url += `&categoryId=${currentCategoryId}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ürünler çekilemedi');
        
        const data = await response.json();
        renderProducts(data.content);
        updatePaginationUI(data);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Sepete Ekle (Giriş Gerekli)
async function addToCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Sepete eklemek için önce giriş yapmalısınız!', 'error');
        openModal('login-modal');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: productId,
                quantity: 1 // Varsayılan 1 adet
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error((errData && errData.message) ? errData.message : 'Sepete ekleme başarısız! (Stok bitmiş olabilir)');
        }

        showToast('Ürün sepete eklendi! 🛒', 'success');
        updateCartBadge();
        
        // Sepet butonuna tıklama/zıplama animasyonu ver
        const navCartBtn = document.getElementById('nav-cart-btn');
        if (navCartBtn) {
            navCartBtn.style.transform = 'scale(1.2)';
            setTimeout(() => { navCartBtn.style.transform = 'scale(1)'; }, 200);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- SEPET İŞLEMLERİ ---

async function fetchMyCart() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Sepet çekilemedi');
        
        const cartItems = await response.json();
        renderCart(cartItems);
        updateCartBadge(); // Fetch olduğunda badge'i de senkronize et
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function updateCartBadge() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const cartItems = await response.json();
            const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            
            const badge = document.getElementById('cart-badge');
            if (badge) {
                if (totalQty > 0) {
                    badge.style.display = 'inline-block';
                    badge.innerText = totalQty;
                } else {
                    badge.style.display = 'none';
                    badge.innerText = '0';
                }
            }
        }
    } catch (error) {
        console.error("Sepet sayısı güncellenemedi", error);
    }
}

async function removeFromCart(cartItemId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/cart/${cartItemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Ürün sepetten çıkarılamadı');
        
        showToast('Ürün sepetten çıkarıldı', 'success');
        fetchMyCart(); // Sepeti yenile
        updateCartBadge();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function decreaseCartQuantity(cartItemId, currentQuantity) {
    if (currentQuantity <= 1) {
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: "Son 1 adet kaldı. Ürünü sepetten tamamen silmek istediğinize emin misiniz?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e94560',
            cancelButtonColor: '#533b66',
            confirmButtonText: 'Evet, Sil!',
            cancelButtonText: 'İptal',
            background: '#1a1a2e',
            color: '#fff'
        });

        if (!result.isConfirmed) return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/cart/${cartItemId}/decrease`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Miktar azaltılamadı');
        
        fetchMyCart(); // Sepeti yenile
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function increaseCartQuantity(productId) {
    // addToCart servisini kullanarak sepete 1 adet daha ekler
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId: productId, quantity: 1 })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error((errData && errData.message) ? errData.message : 'Stok yetersiz!');
        }
        fetchMyCart(); // Sepeti yenile
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function openAddressModal() {
    const totalText = document.getElementById('cart-total-price').innerText;
    if (!totalText || parseFloat(totalText) === 0) {
        showToast('Sepetiniz boş!', 'error');
        return;
    }
    closeModal('cart-modal');
    openModal('address-modal');
}

async function submitAddressForm(event) {
    event.preventDefault();
    
    const addressData = {
        contactName: document.getElementById('address-contact-name').value,
        phoneNumber: document.getElementById('address-phone').value,
        city: document.getElementById('address-city').value,
        district: document.getElementById('address-district').value,
        fullAddress: document.getElementById('address-full').value,
        couponCode: document.getElementById('coupon-code').value
    };

    closeModal('address-modal');
    openModal('payment-modal');

    const token = localStorage.getItem('token');
    const container = document.getElementById('iyzipay-checkout-form');
    container.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; height: 100%; min-height: 300px; color: black;">
                    <i class="fas fa-spinner fa-spin fa-2x"></i> <span style="margin-left: 10px;">Iyzico Güvenli Ödeme Ekranı Yükleniyor...</span>
                </div>`;

    try {
        const response = await fetch(`${API_URL}/payment/checkout-form`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(addressData)
        });
        
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Ödeme formu yüklenemedi!');
        }

        const htmlContent = await response.text();
        container.innerHTML = htmlContent;
        
        // Iyzico'nun dönmüş olduğu HTML içerisindeki script'i manuel olarak çalıştırmamız gerekebilir
        const scripts = container.getElementsByTagName("script");
        for (let i = 0; i < scripts.length; i++) {
            const script = document.createElement("script");
            script.text = scripts[i].text;
            if (scripts[i].src) script.src = scripts[i].src;
            document.head.appendChild(script).parentNode.removeChild(script);
        }
    } catch (error) {
        container.innerHTML = `<div style="padding: 20px; color: red; text-align:center;">Ödeme sistemi yüklenirken hata oluştu: ${error.message}</div>`;
    }
}

// Iyzico ödeme tamamlandığında Iframe'den bize PAYMENT_SUCCESS postMessage atacaktır
window.addEventListener('message', function(event) {
    if (event.data === 'PAYMENT_SUCCESS') {
        showToast('Ödeme Başarılı! Siparişiniz alındı 🎉', 'success');
        closeModal('payment-modal');
        fetchMyOrders(); // Siparişleri güncelle
        fetchProducts(currentPage); // Stoklar düştüğü için anasayfayı yenile
    } else if (event.data === 'PAYMENT_FAILED') {
        showToast('Ödeme Başarısız! Lütfen bilgilerinizi kontrol ediniz.', 'error');
        closeModal('payment-modal');
    }
});

// async function checkoutCart() kullanımdan kaldırıldı çünkü Iyzico backend'de callback ile yapıyor

// Siparişlerimi Çek
async function fetchMyOrders() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Siparişler çekilemedi');
        
        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Sipariş İptal Et (Soft Delete)
async function cancelOrder(orderId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'İptal edilemedi');
        }

        showToast('Sipariş iptal edildi ve stok iade edildi! ↩️', 'success');
        fetchMyOrders(); // Sipariş listesini yenile
        fetchProducts(currentPage); // Arka planda ürün stokları güncellendiği için ana sayfayı da yenile
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- AUTH İŞLEMLERİ ---

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) throw new Error('E-posta adresi veya şifre hatalı!');

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', email.split('@')[0]); // E-postanın ilk kısmını isim olarak alalım
        localStorage.setItem('isAdmin', data.admin); // Admin bilgisi
        
        closeModal('login-modal');
        updateNavbar();
        showToast(`Hoş geldin, ${email.split('@')[0]}! 🚀`, 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            // Validasyon hatası mesajlarını ekrana basalım
            let errorMsg = 'Kayıt başarısız! E-posta adresi alınmış olabilir.';
            if (errData && typeof errData === 'object') {
                const messages = Object.values(errData).join(', ');
                if (messages) errorMsg = messages;
            }
            throw new Error(errorMsg);
        }

        closeModal('register-modal');
        showToast('Kayıt başarılı! Otomatik giriş yapılıyor...', 'success');
        
        // Otomatik Giriş Yap
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (loginRes.ok) {
            const loginData = await loginRes.json();
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('username', name); // E-postanın ilk kısmını isim olarak alalım
            localStorage.setItem('isAdmin', loginData.admin); // Admin bilgisi
            if(loginData.gender) localStorage.setItem('gender', loginData.gender);
            updateNavbar();
            showToast(`Hoş geldin, ${name}! 🚀`, 'success');
        } else {
            openModal('login-modal');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('gender');
    updateNavbar();
    showToast('Çıkış yapıldı 👋', 'success');
}

// --- PROFİL İŞLEMLERİ ---

async function fetchMyProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Profil bilgileri alınamadı.');

        const data = await response.json();
        document.getElementById('profile-display-name').innerText = data.name;
        document.getElementById('profile-display-email').innerText = data.email;
        
        let genderText = "Belirtilmemiş";
        let avatarHtml = '<i class="fas fa-user"></i>';
        
        if (data.gender === 'MALE') {
            genderText = "Erkek";
            avatarHtml = `<img src="https://avatar.iran.liara.run/public/boy?username=${data.email}" style="width:100%;height:100%;border-radius:50%; object-fit:cover;">`;
            localStorage.setItem('gender', 'MALE');
        } else if (data.gender === 'FEMALE') {
            genderText = "Kadın";
            avatarHtml = `<img src="https://avatar.iran.liara.run/public/girl?username=${data.email}" style="width:100%;height:100%;border-radius:50%; object-fit:cover;">`;
            localStorage.setItem('gender', 'FEMALE');
        } else {
            localStorage.setItem('gender', 'UNKNOWN');
        }

        document.getElementById('profile-display-gender').innerText = genderText;
        document.getElementById('profile-display-birthdate').innerText = data.birthDate ? data.birthDate : 'Belirtilmemiş';
        document.getElementById('profile-avatar-container').innerHTML = avatarHtml;
        
        // Modal açıldığında inputları temizle
        document.getElementById('profile-update-name').value = '';
        document.getElementById('profile-update-password').value = '';
        document.getElementById('profile-update-birthdate').value = data.birthDate || '';
        document.getElementById('profile-update-gender').value = data.gender || 'UNKNOWN';
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const name = document.getElementById('profile-update-name').value;
    const password = document.getElementById('profile-update-password').value;
    const birthDate = document.getElementById('profile-update-birthdate').value;
    const gender = document.getElementById('profile-update-gender').value;

    const bodyData = {};
    if (name) bodyData.name = name;
    if (password) bodyData.password = password;
    if (birthDate) bodyData.birthDate = birthDate;
    if (gender) bodyData.gender = gender;

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error((errData && errData.message) ? errData.message : 'Profil güncellenemedi.');
        }

        const data = await response.json();
        showToast('Profil başarıyla güncellendi!', 'success');
        
        // Navbar'daki ismi ve cinsiyeti güncelle
        localStorage.setItem('username', data.name);
        if(data.gender) localStorage.setItem('gender', data.gender);
        updateNavbar();
        
        closeModal('profile-modal');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteMyAccount() {
    if (!confirm('Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Hesap silinemedi.');
        }

        showToast('Hesabınız başarıyla silinmiştir.', 'success');
        closeModal('profile-modal');
        logout(); // Çıkış yap ve temizle
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- UI GÜNCELLEMELERİ ---

function updateNavbar() {
    const navActions = document.getElementById('nav-actions');
    const username = localStorage.getItem('username');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const gender = localStorage.getItem('gender');

    if (username) {
        let avatarIcon = '<i class="fas fa-user-circle" style="font-size: 1.8rem; color: var(--primary);"></i>';
        if (gender === 'MALE') avatarIcon = `<img src="https://avatar.iran.liara.run/public/boy?username=${username}" style="width:32px;height:32px;border-radius:50%;border:2px solid var(--primary); object-fit:cover;">`;
        if (gender === 'FEMALE') avatarIcon = `<img src="https://avatar.iran.liara.run/public/girl?username=${username}" style="width:32px;height:32px;border-radius:50%;border:2px solid var(--secondary); object-fit:cover;">`;

        navActions.innerHTML = `
            ${isAdmin ? `<a href="admin.html" class="btn btn-primary" style="background-color: var(--secondary-color); border-color: var(--secondary-color); text-decoration: none;">Admin Paneli</a>` : ''}
            <button class="btn btn-primary" id="nav-cart-btn" onclick="openCartModal()" style="transition: transform 0.2s ease;"><i class="fas fa-shopping-cart"></i> Sepetim <span id="cart-badge" style="display:none; background:var(--secondary-color); color:white; border-radius:10px; padding:2px 8px; font-size:12px; margin-left:5px; font-weight:bold;">0</span></button>
            <button class="btn btn-outline" onclick="openOrdersModal()"><i class="fas fa-box"></i> Siparişlerim</button>
            <div style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 5px 15px; border-radius: 30px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);" onclick="openProfileModal()">
                ${avatarIcon}
                <span style="font-weight: 600; color: var(--text-color);">${username}</span>
            </div>
            <button class="btn btn-danger" onclick="logout()" style="padding: 10px;"><i class="fas fa-sign-out-alt"></i></button>
        `;
    } else {
        navActions.innerHTML = `
            <button class="btn btn-outline" onclick="openModal('register-modal')">Kayıt Ol</button>
            <button class="btn btn-primary" onclick="openModal('login-modal')">Giriş Yap</button>
        `;
    }
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        // onClick özelliği ekliyoruz
        div.onclick = (e) => {
            // Eğer butona tıklandıysa modalı açma
            if(e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            openProductDetail(p);
        };
        div.style.cursor = 'pointer'; // Tıklanabilir olduğunu belirt

        const catName = p.category ? p.category.name : 'Genel';
        
        // Eğer resim varsa onu göster, yoksa varsayılan veya boş bir div
        const imgHtml = p.imageUrl 
            ? `<div style="height: 150px; overflow: hidden; border-radius: 8px; margin-bottom: 10px;"><img src="${API_URL}${p.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;"></div>` 
            : `<div style="height: 150px; background: rgba(255,255,255,0.05); border-radius: 8px; display:flex; align-items:center; justify-content:center; margin-bottom: 10px; color: var(--text-muted);"><i class="fas fa-image fa-3x"></i></div>`;

        div.innerHTML = `
            ${imgHtml}
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <h4 class="product-title" style="margin: 0;">${p.name}</h4>
                <span class="badge" style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); color: var(--primary);">${catName}</span>
            </div>
            <p class="product-desc">${p.description.substring(0, 80)}...</p>
            <div class="product-footer">
                <span class="product-price">${p.price} TL</span>
                <span class="product-stock">${p.stock} Adet Kaldı</span>
            </div>
            <button class="btn btn-primary w-100" onclick="addToCart(${p.id})"><i class="fas fa-shopping-cart"></i> Sepete Ekle</button>
        `;
        grid.appendChild(div);
    });
}

function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    list.innerHTML = '';

    if (orders.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Henüz hiç siparişin yok.</p>';
        return;
    }

    orders.forEach(o => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.background = 'rgba(255, 255, 255, 0.03)';
        div.style.border = '1px solid var(--glass-border)';
        div.style.borderRadius = '12px';
        div.style.padding = '20px';
        div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        
        let actionBtn = '';
        if (o.status === 'PENDING') {
            actionBtn = `<button class="btn btn-danger" onclick="cancelOrder(${o.id})" style="padding: 10px 15px; font-size: 0.9rem;"><i class="fas fa-times-circle"></i> İptal Et</button>`;
        }

        let itemsHtml = '';
        if (o.items && o.items.length > 0) {
            o.items.forEach(item => {
                itemsHtml += `
                    <div style="display:flex; justify-content:space-between; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">
                        <span style="color:var(--text-color);">${item.productName}</span>
                        <span style="color:var(--text-muted);">${item.quantity} Adet x ${item.unitPrice} TL = <strong style="color:var(--primary);">${item.totalPrice} TL</strong></span>
                    </div>
                `;
            });
        }

        const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString() : '';

        div.innerHTML = `
            <div class="order-info" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; margin-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--primary);">Sipariş #${o.id}</h4>
                        <small style="color:var(--text-muted);">${dateStr}</small>
                    </div>
                    <div style="text-align: right;">
                        <span class="order-status status-${o.status}" style="font-size: 0.9rem; padding: 6px 15px;">${translateStatus(o.status)}</span>
                        ${actionBtn ? `<div style="margin-top:10px;">${actionBtn}</div>` : ''}
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    ${itemsHtml}
                </div>
                
                <div style="text-align: right; font-size: 1.2rem; font-weight: bold; color: var(--text-color);">
                    Genel Toplam: <span style="color: var(--secondary-color);">${o.totalAmount} TL</span>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

function renderCart(cartItems) {
    const list = document.getElementById('cart-list');
    list.innerHTML = '';
    
    let total = 0;

    if (cartItems.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Sepetiniz boş.</p>';
        document.getElementById('cart-total-price').innerText = "0";
        return;
    }

    cartItems.forEach(item => {
        total += item.totalPrice;
        const div = document.createElement('div');
        div.className = 'order-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <div class="order-info">
                <h4 style="margin: 0 0 5px 0;">${item.productName}</h4>
                <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Birim: ${item.price} TL</p>
                <span style="color: var(--primary); font-weight: bold;">Ara Toplam: ${item.totalPrice} TL</span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 8px; overflow: hidden;">
                    <button class="btn btn-outline" style="border: none; border-radius: 0; padding: 5px 15px;" onclick="decreaseCartQuantity(${item.id}, ${item.quantity})">-</button>
                    <span style="padding: 0 15px; font-weight: bold; color: var(--text-color);">${item.quantity}</span>
                    <button class="btn btn-outline" style="border: none; border-radius: 0; padding: 5px 15px;" onclick="increaseCartQuantity(${item.productId})">+</button>
                </div>
                <button class="btn btn-danger" onclick="removeFromCart(${item.id})" style="padding: 10px;"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(div);
    });

    document.getElementById('cart-total-price').innerText = total;
}

function updatePaginationUI(data) {
    document.getElementById('total-elements').innerText = `${data.totalElements} Ürün`;
    document.getElementById('page-info').innerText = `Sayfa ${data.number + 1} / ${data.totalPages}`;
    
    document.getElementById('prev-btn').disabled = data.first;
    document.getElementById('next-btn').disabled = data.last;
}

// --- YARDIMCI FONKSİYONLAR ---

function translateStatus(status) {
    if (status === 'PENDING') return 'Beklemede';
    if (status === 'CANCELLED') return 'İptal Edildi';
    if (status === 'SHIPPED') return 'Kargolandı';
    if (status === 'DELIVERED') return 'Teslim Edildi';
    return status;
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function switchModal(closeId, openId) { closeModal(closeId); openModal(openId); }

function openOrdersModal() {
    fetchMyOrders();
    openModal('orders-modal');
}

function openProfileModal() {
    fetchMyProfile();
    openModal('profile-modal');
}

function openProductDetail(product) {
    document.getElementById('detail-title').innerText = product.name;
    document.getElementById('detail-desc').innerText = product.description;
    document.getElementById('detail-price').innerText = `${product.price} TL`;
    document.getElementById('detail-stock').innerText = `${product.stock} Adet Kaldı`;
    document.getElementById('detail-category').innerText = product.category ? product.category.name : 'Genel';
    
    const imgContainer = document.getElementById('detail-image-container');
    if (product.imageUrl) {
        imgContainer.innerHTML = `<img src="${API_URL}${product.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        imgContainer.innerHTML = `<i class="fas fa-image fa-5x" style="color: var(--text-muted);"></i>`;
    }

    const addBtn = document.getElementById('detail-add-btn');
    addBtn.onclick = () => {
        addToCart(product.id);
        closeModal('product-detail-modal');
    };

    openModal('product-detail-modal');
}

function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    container.innerHTML = '';

    // "Tümü" butonu
    const allBtn = document.createElement('button');
    allBtn.className = `btn ${currentCategoryId === null ? 'btn-primary' : 'btn-outline'}`;
    allBtn.style.whiteSpace = 'nowrap';
    allBtn.innerText = 'Tüm Ürünler';
    allBtn.onclick = () => {
        currentCategoryId = null;
        currentPage = 0;
        fetchProducts(currentPage);
        renderCategoryFilters(); // Butonların rengini güncelle
    };
    container.appendChild(allBtn);

    // "Genel" (Kategorisiz) butonu
    const generalBtn = document.createElement('button');
    generalBtn.className = `btn ${currentCategoryId === -1 ? 'btn-primary' : 'btn-outline'}`;
    generalBtn.style.whiteSpace = 'nowrap';
    generalBtn.innerText = 'Genel';
    generalBtn.onclick = () => {
        currentCategoryId = -1;
        currentPage = 0;
        fetchProducts(currentPage);
        renderCategoryFilters();
    };
    container.appendChild(generalBtn);

    // Diğer kategoriler
    categoriesList.forEach(c => {
        const btn = document.createElement('button');
        btn.className = `btn ${currentCategoryId === c.id ? 'btn-primary' : 'btn-outline'}`;
        btn.style.whiteSpace = 'nowrap';
        btn.innerText = c.name;
        btn.onclick = () => {
            currentCategoryId = c.id;
            currentPage = 0;
            fetchProducts(currentPage);
            renderCategoryFilters();
        };
        container.appendChild(btn);
    });
}

function openCartModal() {
    fetchMyCart();
    openModal('cart-modal');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- ADMIN İŞLEMLERİ ---

// Eski admin fonksiyonları admin.html'ye taşındı.
