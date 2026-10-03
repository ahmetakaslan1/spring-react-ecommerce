const API_URL = 'http://localhost:8080';
let categories = [];
let products = [];
let users = [];
let orders = [];

// Admin Kontrolü
document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
        Swal.fire({
            icon: 'error',
            title: 'Erişim Reddedildi',
            text: 'Bu sayfayı görüntüleme yetkiniz yok!',
            background: '#1a1a2e',
            color: '#fff'
        }).then(() => {
            window.location.href = "index.html";
        });
        return;
    }
    
    // Yükleme İşlemleri
    fetchCategories();
    fetchProducts();
    fetchUsers();
    fetchOrders();
});

// Menü Geçişleri
function showSection(sectionName) {
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    event.currentTarget.classList.add('active');

    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('section-' + sectionName).classList.add('active');
}

// Ortak Fetch Fonksiyonu
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(API_URL + url, { ...options, headers });
    if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || "İşlem başarısız!");
    }
    // Sadece json döneceğini varsaymayalım, delete gibi durumlarda boş dönebilir
    return response.headers.get("content-type")?.includes("application/json") ? response.json() : null;
}

// --- KATEGORİ İŞLEMLERİ ---
async function fetchCategories() {
    try {
        categories = await fetchWithAuth('/categories');
        renderCategories();
        updateCategorySelect();
    } catch (e) {
        toastError('Kategoriler yüklenemedi: ' + e.message);
    }
}

function renderCategories() {
    const list = document.getElementById('category-list');
    if (!list) return;
    list.innerHTML = '';
    categories.forEach(cat => {
        list.innerHTML += `
            <tr>
                <td>${cat.id}</td>
                <td><span class="badge bg-primary">${cat.name}</span></td>
                <td style="text-align: right;">
                    <button class="btn btn-danger btn-sm" onclick="deleteCategory(${cat.id})"><i class="fas fa-trash"></i> Sil</button>
                </td>
            </tr>
        `;
    });
}

function updateCategorySelect() {
    const select = document.getElementById('prod-category');
    if (!select) return;
    select.innerHTML = '<option value="">Kategori Seçin</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

async function handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;
    try {
        await fetchWithAuth('/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        toastSuccess('Kategori başarıyla eklendi!');
        document.getElementById('cat-name').value = '';
        fetchCategories();
    } catch (e) {
        toastError(e.message);
    }
}

async function deleteCategory(id) {
    const result = await Swal.fire({
        title: 'Emin misiniz?',
        text: "Bu kategoriyi sildiğinizde, bağlı olan ürünler etkilenebilir!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e94560',
        cancelButtonColor: '#533b66',
        confirmButtonText: 'Evet, Sil!',
        cancelButtonText: 'İptal',
        background: '#1a1a2e',
        color: '#fff'
    });

    if (result.isConfirmed) {
        try {
            await fetchWithAuth(`/categories/${id}`, { method: 'DELETE' });
            toastSuccess('Kategori silindi!');
            fetchCategories();
        } catch (e) {
            toastError('Silinemedi: ' + e.message);
        }
    }
}

// --- ÜRÜN İŞLEMLERİ ---
async function fetchProducts() {
    try {
        const data = await fetchWithAuth('/products/paged?size=100');
        products = data.content;
        document.getElementById('stat-products').innerText = data.totalElements;
        renderProducts();
    } catch (e) {
        toastError('Ürünler yüklenemedi: ' + e.message);
    }
}

function renderProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;
    list.innerHTML = '';
    products.forEach(p => {
        const catName = p.category ? p.category.name : 'Kategorisiz';
        const imgTag = p.imageUrl ? `<img src="${API_URL}${p.imageUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px;">` : `<div style="width:40px; height:40px; background: rgba(255,255,255,0.1); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:10px;">Yok</div>`;
        list.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td><div style="display:flex; align-items:center; gap:10px;">${imgTag} <strong>${p.name}</strong></div></td>
                <td><span class="badge bg-secondary">${catName}</span></td>
                <td>${p.price} TL</td>
                <td>${p.stock}</td>
                <td style="text-align: right;">
                    <button class="btn btn-primary btn-sm" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i> Düzenle</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i> Sil</button>
                </td>
            </tr>
        `;
    });
}

let editingProductId = null;

function editProduct(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    
    editingProductId = prod.id;
    document.getElementById('prod-name').value = prod.name;
    document.getElementById('prod-desc').value = prod.description;
    document.getElementById('prod-price').value = prod.price;
    document.getElementById('prod-stock').value = prod.stock;
    if(prod.category) document.getElementById('prod-category').value = prod.category.id;
    document.getElementById('prod-image').value = ''; // Input file temizlenir
    
    document.getElementById('product-submit-btn').innerText = "Ürünü Güncelle";
    document.getElementById('product-cancel-btn').style.display = "inline-block";
    
    showSection('products'); // Eğer başka menüdeyse buraya at
    window.scrollTo(0, 0);
}

function cancelEdit() {
    editingProductId = null;
    document.getElementById('admin-product-form').reset();
    document.getElementById('product-submit-btn').innerText = "Ürün Ekle";
    document.getElementById('product-cancel-btn').style.display = "none";
}

async function handleAddOrUpdateProduct(e) {
    e.preventDefault();
    // Resim yükleme işlemi
    const imageInput = document.getElementById('prod-image');
    let uploadedImageUrl = null;
    
    // Eğer düzenleme modundaysak ve yeni resim seçilmemişse eski resmi koru
    if (editingProductId) {
        const existingProd = products.find(p => p.id === editingProductId);
        if (existingProd) uploadedImageUrl = existingProd.imageUrl;
    }

    if (imageInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', imageInput.files[0]);
        try {
            const token = localStorage.getItem('token');
            const uploadRes = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!uploadRes.ok) throw new Error('Resim yüklenemedi!');
            uploadedImageUrl = await uploadRes.text();
        } catch (e) {
            toastError(e.message);
            return;
        }
    }

    const payload = {
        name: document.getElementById('prod-name').value,
        description: document.getElementById('prod-desc').value,
        price: parseFloat(document.getElementById('prod-price').value),
        stock: parseInt(document.getElementById('prod-stock').value),
        categoryId: parseInt(document.getElementById('prod-category').value),
        imageUrl: uploadedImageUrl
    };

    try {
        if (editingProductId) {
            // Update
            await fetchWithAuth(`/products/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            toastSuccess('Ürün başarıyla güncellendi!');
        } else {
            // Create
            await fetchWithAuth('/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            toastSuccess('Yeni ürün başarıyla eklendi!');
        }
        cancelEdit();
        fetchProducts();
    } catch (e) {
        toastError(e.message);
    }
}

async function deleteProduct(id) {
    const result = await Swal.fire({
        title: 'Emin misiniz?',
        text: "Bu ürünü sildiğinizde geri dönüşü olmaz!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e94560',
        cancelButtonColor: '#533b66',
        confirmButtonText: 'Evet, Sil!',
        cancelButtonText: 'İptal',
        background: '#1a1a2e',
        color: '#fff'
    });

    if (result.isConfirmed) {
        try {
            await fetchWithAuth(`/products/${id}`, { method: 'DELETE' });
            toastSuccess('Ürün silindi!');
            fetchProducts();
        } catch (e) {
            toastError('Silinemedi: ' + e.message);
        }
    }
}

// --- KULLANICI İŞLEMLERİ (FAZ 4) ---
async function fetchUsers() {
    try {
        users = await fetchWithAuth('/users');
        document.getElementById('stat-users').innerText = users.length;
        renderUsers();
    } catch (e) {
        toastError('Kullanıcılar yüklenemedi: ' + e.message);
    }
}

function renderUsers() {
    const list = document.getElementById('user-list');
    if (!list) return;
    list.innerHTML = '';
    users.forEach(u => {
        // Admin olanlar için Banlama butonunu gizleyelim (Kendi kendini veya diğer adminleri banlamasın diye)
        const isAdminBadge = u.admin ? '<span class="badge bg-primary" style="margin-left:5px;">Admin</span>' : '';
        const statusBadge = u.active ? 
            '<span class="badge" style="background: rgba(0, 255, 136, 0.1); color: var(--success); border: 1px solid rgba(0, 255, 136, 0.2);">Aktif</span>' : 
            '<span class="badge" style="background: rgba(255, 0, 85, 0.1); color: var(--danger); border: 1px solid rgba(255, 0, 85, 0.2);">Yasaklı (Ban)</span>';
            
        const actionBtn = u.admin ? 
            '<span style="color:var(--text-muted); font-size: 0.8rem;">İşlem Yapılamaz</span>' :
            `<button class="btn ${u.active ? 'btn-danger' : 'btn-outline'}" style="padding: 5px 10px; font-size: 0.8rem;" onclick="toggleUserBan(${u.id}, ${u.active})">
                <i class="fas ${u.active ? 'fa-ban' : 'fa-check-circle'}"></i> ${u.active ? 'Hesabı Banla' : 'Banı Kaldır'}
            </button>`;

        list.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.name}</strong> ${isAdminBadge}</td>
                <td>${u.email}</td>
                <td>${statusBadge}</td>
                <td style="text-align: right;">${actionBtn}</td>
            </tr>
        `;
    });
}

async function toggleUserBan(id, currentStatus) {
    const actionText = currentStatus ? "banlamak" : "banını kaldırmak";
    const result = await Swal.fire({
        title: 'Emin misiniz?',
        text: `Bu kullanıcının ${actionText} istediğinize emin misiniz?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: currentStatus ? '#ff2a5f' : '#00ff88',
        cancelButtonColor: '#533b66',
        confirmButtonText: 'Evet, Onaylıyorum!',
        cancelButtonText: 'İptal',
        background: '#1a1a2e',
        color: '#fff'
    });

    if (result.isConfirmed) {
        try {
            await fetchWithAuth(`/users/${id}/ban`, { method: 'PUT' });
            toastSuccess('İşlem başarıyla gerçekleşti!');
            fetchUsers();
        } catch (e) {
            toastError('İşlem başarısız: ' + e.message);
        }
    }
}

// --- SİPARİŞ İŞLEMLERİ (FAZ 5) ---
async function fetchOrders() {
    try {
        orders = await fetchWithAuth('/orders');
        document.getElementById('stat-orders').innerText = orders.length;
        renderAdminOrders();
    } catch (e) {
        toastError('Siparişler yüklenemedi: ' + e.message);
    }
}

function translateStatusAdmin(status) {
    if (status === 'PENDING') return 'Beklemede';
    if (status === 'SHIPPED') return 'Kargolandı';
    if (status === 'DELIVERED') return 'Teslim Edildi';
    if (status === 'CANCELLED') return 'İptal Edildi';
    return status;
}

function getStatusBadge(status) {
    if (status === 'PENDING') return '<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fcd34d;">Beklemede</span>';
    if (status === 'SHIPPED') return '<span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd;">Kargolandı</span>';
    if (status === 'DELIVERED') return '<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7;">Teslim Edildi</span>';
    if (status === 'CANCELLED') return '<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5;">İptal Edildi</span>';
    return status;
}

function renderAdminOrders() {
    const list = document.getElementById('order-list');
    if (!list) return;
    list.innerHTML = '';
    orders.forEach(o => {
        // Dropdown to update status
        const isCancelled = o.status === 'CANCELLED';
        let selectHtml = '';
        if (isCancelled) {
            selectHtml = '<span style="color:var(--text-muted); font-size: 0.8rem;">İptal Edilenler Değiştirilemez</span>';
        } else {
            selectHtml = `
                <select class="admin-select" style="margin-right: 10px;" onchange="changeOrderStatus(${o.id}, this.value)">
                    <option value="" disabled selected>Durum Seç...</option>
                    <option value="PENDING" ${o.status === 'PENDING' ? 'disabled' : ''}>Beklemeye Al</option>
                    <option value="SHIPPED" ${o.status === 'SHIPPED' ? 'disabled' : ''}>Kargolandı İşaretle</option>
                    <option value="DELIVERED" ${o.status === 'DELIVERED' ? 'disabled' : ''}>Teslim Edildi İşaretle</option>
                </select>
                <button class="btn btn-sm btn-outline" style="padding: 5px 10px; font-size: 12px; margin-top: 5px;" onclick="promptShippingUpdate(${o.id}, '${o.shippingCompany || ''}', '${o.trackingNumber || ''}')">Kargo Bilgisi</button>
            `;
        }
        
        let cargoInfo = '';
        if (o.shippingCompany || o.trackingNumber) {
            cargoInfo = `<br><span style="font-size:12px; color:var(--primary);"><i class="fas fa-truck"></i> ${o.shippingCompany || 'Bilinmiyor'} - ${o.trackingNumber || 'No Yok'}</span>`;
        }

        list.innerHTML += `
            <tr>
                <td><strong>#${o.id}</strong></td>
                <td>Kullanıcı ${o.userId}</td>
                <td>${o.productName}</td>
                <td>${o.quantity} Adet x ${o.purchasedPrice} TL</td>
                <td><strong>${o.totalPrice} TL</strong></td>
                <td>${getStatusBadge(o.status)}${cargoInfo}</td>
                <td style="text-align: right;">${selectHtml}</td>
            </tr>
        `;
    });
}

async function promptShippingUpdate(orderId, currentCompany, currentTracking) {
    const { value: formValues } = await Swal.fire({
        title: 'Kargo Bilgisi Gir',
        html:
            `<input id="swal-input1" class="swal2-input" placeholder="Kargo Firması (Örn: Yurtiçi)" value="${currentCompany === 'undefined' ? '' : currentCompany}">` +
            `<input id="swal-input2" class="swal2-input" placeholder="Takip Numarası" value="${currentTracking === 'undefined' ? '' : currentTracking}">`,
        focusConfirm: false,
        showCancelButton: true,
        background: '#1a1a2e', color: '#fff',
        preConfirm: () => {
            return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value
            ]
        }
    });

    if (formValues) {
        try {
            await fetchWithAuth(`/orders/${orderId}/shipping?shippingCompany=${encodeURIComponent(formValues[0])}&trackingNumber=${encodeURIComponent(formValues[1])}`, { method: 'PATCH' });
            toastSuccess('Kargo bilgileri güncellendi!');
            fetchOrders();
        } catch (e) {
            toastError('Hata: ' + e.message);
        }
    }
}

async function changeOrderStatus(orderId, newStatus) {
    try {
        await fetchWithAuth(`/orders/${orderId}/status?status=${newStatus}`, { method: 'PATCH' });
        toastSuccess('Sipariş durumu güncellendi!');
        fetchOrders(); // Refresh to see the new status
    } catch (e) {
        toastError('Sipariş güncellenemedi: ' + e.message);
        fetchOrders(); // Re-render to reset dropdown
    }
}

// Form dinleyicileri
document.getElementById('admin-category-form').addEventListener('submit', handleAddCategory);
document.getElementById('admin-product-form').addEventListener('submit', handleAddOrUpdateProduct);

// SweetAlert Wrappers
function toastSuccess(msg) {
    Swal.fire({
        toast: true, position: 'bottom-end', icon: 'success', title: msg,
        showConfirmButton: false, timer: 3000, background: '#1a1a2e', color: '#fff'
    });
}

function toastError(msg) {
    Swal.fire({
        toast: true, position: 'bottom-end', icon: 'error', title: msg,
        showConfirmButton: false, timer: 3000, background: '#1a1a2e', color: '#fff'
    });
}
