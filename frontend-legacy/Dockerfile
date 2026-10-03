# Statik dosyalarımızı (HTML, CSS, JS) yayınlamak için 
# dünyaca ünlü ve çok hafif olan "Nginx" web sunucusunu kullanıyoruz.
FROM nginx:alpine

# Bizim frontend klasöründeki (index.html, style.css, app.js) tüm dosyaları,
# Nginx'in dış dünyaya yayın yaptığı ana klasörün içine kopyalıyoruz.
COPY . /usr/share/nginx/html

# Nginx varsayılan olarak 80 portunda çalışır.
EXPOSE 80
