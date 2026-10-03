# =============================================
# Stage 1: React build (Vite)
# Build-arg VITE_API_BASE: frontend'in hangi path üzerinden API'ye
# ulaşacağı (varsayılan: /api — Nginx proxy ile)
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Önce package.json kopyala (cache için)
COPY package.json ./
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Vite build-time env değişkeni (docker-compose'dan gelir)
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# =============================================
# Stage 2: Nginx ile serve
# Runtime'da BACKEND_URL env değişkeni envsubst ile
# nginx.conf.template içine işlenir
# =============================================
FROM nginx:1.27-alpine

# Build çıktısını kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config şablonunu kopyala
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

# Nginx resmi image'ı /etc/nginx/templates/*.template dosyalarını
# otomatik olarak envsubst ile işler — hiçbir custom CMD gerekmez!
