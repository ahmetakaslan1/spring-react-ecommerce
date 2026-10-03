# 🚀 Gelecek Store - Modern E-Commerce Platform

Gelecek Store, modern web teknolojileri kullanılarak geliştirilmiş, uçtan uca (Full-Stack) çalışan kapsamlı bir e-ticaret platformudur. Şık ve aydınlık arayüzü, güçlü Java Spring Boot arka ucu ve güvenli ödeme altyapısıyla gerçek dünya senaryolarına tam uyumludur.

---

## 🛠️ Kullanılan Teknolojiler

### Backend (Arka Uç)
* **Java 17 & Spring Boot 3.x:** Uygulamanın iskeleti ve API katmanı.
* **Spring Security & JWT:** Güvenli kimlik doğrulama (Authentication) ve rol tabanlı erişim yönetimi (Role-based Authorization: ADMIN / USER).
* **Spring Data JPA & Hibernate:** Veritabanı işlemleri ve ORM yönetimi.
* **MySQL / PostgreSQL:** İlişkisel veritabanı desteği (Docker üzerinden).

### Frontend (Ön Yüz)
* **React.js & Vite:** Yüksek performanslı, bileşen tabanlı kullanıcı arayüzü.
* **React Router DOM:** Sayfalar arası dinamik geçiş (SPA routing).
* **Context API:** Global durum yönetimi (Sepet, Kullanıcı Oturumu).
* **Vanilla CSS (Modern Light Theme):** Özel tasarım değişkenleri (CSS Variables) ile oluşturulmuş, kullanıcı dostu ve aydınlık e-ticaret teması.

### DevOps & Altyapı
* **Docker & Docker Compose:** Hem frontend hem de backend'in tek komutla izole ortamlarda ayağa kalkmasını sağlayan konteyner mimarisi.
* **Nginx:** Frontend konteynerinde statik dosyaları sunmak ve API isteklerini arka uca proxy (yönlendirmek) yapmak için kullanılır.

---

## ✨ Öne Çıkan Özellikler

### 1. 🔐 Güvenlik ve Kimlik Doğrulama
* JWT (JSON Web Token) tabanlı güvenli oturum yönetimi.
* Tamamen ayrılmış **Admin Paneli** ve yetkilendirmesi.
* IDOR zafiyetlerine karşı korumalı Spring Security yapılandırması (Kullanıcı ID'leri dışarıdan alınmaz, token'dan okunur).

### 2. 🛍️ Ürün ve Kategori Yönetimi
* Sınırsız kategori ve ürün ekleme, düzenleme, silme.
* Güvenli resim yükleme (File Upload) entegrasyonu.
* Sayfalama (Pagination) desteği ile binlerce üründe bile yüksek performans.

### 3. 💳 Iyzico Ödeme Sistemi Entegrasyonu
* Türkiye'nin en popüler ödeme altyapılarından **Iyzico** ile test (Sandbox) entegrasyonu.
* Güvenli 3D Secure / Checkout form yönetimi.

### 4. 🎟️ Gelişmiş Kupon ve İndirim Sistemi
* Admin tarafından yönetilebilen dinamik kupon oluşturma.
* **Kullanım Limiti:** Kuponun kaç kişi tarafından kullanılabileceği.
* **Minimum Sepet Tutarı:** Kuponun geçerli olması için gereken minimum alışveriş tutarı kontrolü.
* Gerçek zamanlı doğrulama ve anında sepet indirimi hesaplaması.

### 5. 📦 Sipariş ve Kargo Takibi
* Müşteri sipariş geçmişi ve detaylı sipariş özeti (Sipariş Alındı, Ödeme Bekliyor, vs.).
* Admin panelinde gelişmiş sipariş yönetimi, durum güncelleme ve filtreleme (Sekmeli görünüm).
* **Kargo Yönetimi:** Admin tarafından Kargo firması ve Takip Numarası atama, müşterinin anında kargosunu takip edebilmesi.
* Stok düşme ve İptal/İade işlemlerinde stok geri yükleme mekanizması.

---

## 🚀 Kurulum ve Çalıştırma

Proje **Docker** kullanılarak tek komutla çalıştırılabilecek şekilde yapılandırılmıştır.

### Gereksinimler
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) kurulu ve çalışıyor olmalıdır.
* Proje dizininde (ve `frontend` klasöründe) `.env.example` dosyalarını kopyalayarak `.env` isimli dosyalarınızı oluşturun ve kendi veritabanı/Iyzico şifrelerinizi girin.

### Başlatma Komutu
Ana dizinde terminali açın ve şu komutu çalıştırın:
```bash
docker-compose up --build -d
```

### Erişim
* **Ön Yüz (Frontend):** `http://localhost:3000`
* **Arka Uç (Backend API):** `http://localhost:8080/api`

Sistem ilk kez çalıştığında varsayılan bir `ADMIN` rolü ve test amaçlı `HOSGELDIN10` indirim kuponu otomatik olarak veritabanına eklenir.

---
*Gelecek Store, modern e-ticaret ihtiyaçlarını karşılamak üzere ölçeklenebilir ve modüler bir mimariyle geliştirilmiştir.*
