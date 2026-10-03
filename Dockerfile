# ==========================================
# 1. AŞAMA: DERLEME (BUILD)
# ==========================================
# Maven kurulu bir bilgisayar (imaj) kiralıyoruz
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Sadece pom.xml'i kopyalayıp paketleri indiriyoruz. 
# Neden? Çünkü Docker önbellek kullanır. Kodumuz değişse bile pom.xml değişmediği sürece kütüphaneleri baştan indirmez!
COPY pom.xml .
RUN mvn dependency:go-offline

# Şimdi kendi kodlarımızı kopyalıyor ve testleri atlayarak JAR dosyasına çeviriyoruz
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# 2. AŞAMA: ÇALIŞTIRMA (RUN)
# ==========================================
# Maven'a artık ihtiyacımız yok. Sadece Java çalıştıran (JRE) çok hafif, minicik bir sistem kiralıyoruz.
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Birinci aşamadaki bilgisayardan (builder) üretilen JAR dosyasını alıp buraya "app.jar" adıyla kopyalıyoruz
COPY --from=builder /app/target/*.jar app.jar

# Uygulamamızın varsayılan portunu dışarıya açıyoruz
EXPOSE 8080

# Konteyner başlatıldığında verilecek komut: "java -jar app.jar"
ENTRYPOINT ["java", "-jar", "app.jar"]
