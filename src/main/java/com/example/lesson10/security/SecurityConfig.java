package com.example.lesson10.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // 1. Şifreleri Karmaşıklaştıran (Hash'leyen) Aracımız
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. Spring Security'nin "Giriş Yapma" İşlemini Yöneten Müdürü
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // 3. Hangi sayfalara şifresiz girilir, hangilerine girilmez Kuralları
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // FRONTEND İÇİN CORS İZNİ AKTİF EDİLDİ
            .csrf(csrf -> csrf.disable()) // Postman'den istek atabilmek için korumayı kapattık
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll() // "/auth/register" ve "/auth/login" adreslerine HERKES girebilir (Şifresiz)
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/products/**").permitAll() // Ürün listelemeye (GET) HERKES girebilir (Şifresiz)
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/categories/**").permitAll() // Kategori listelemeye (GET) HERKES girebilir
                .requestMatchers("/uploads/**").permitAll() // Yüklenen resimlere herkes erişebilmeli
                .requestMatchers("/payment/callback").permitAll() // Iyzico'nun bize döneceği webhook adresi şifresiz erişime açık olmalı
                .anyRequest().authenticated() // Bunlar dışındaki tüm adresler kimlik doğrulaması (Token) isteyecek!
            )
            // Bizim yazdığımız JWT bilet kontrol filtresini, Spring'in standart kullanıcı/şifre kontrol filtresinden ÖNCE çalıştır!
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    // FRONTEND BAĞLANTISI (CORS) AYARLARI
    // Bu ayar sayesinde 8080 portundaki backend, 3000 veya 5500 portundaki frontend'in kendisine istek atmasına izin verir.
    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration frontendConfig = new org.springframework.web.cors.CorsConfiguration();
        // Sadece kendi frontend domainlerimize izin veriyoruz.
        frontendConfig.setAllowedOrigins(java.util.List.of("http://localhost:3000", "http://127.0.0.1:3000"));
        frontendConfig.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        frontendConfig.setAllowedHeaders(java.util.List.of("*"));
        frontendConfig.setAllowCredentials(true);

        org.springframework.web.cors.CorsConfiguration iyzicoConfig = new org.springframework.web.cors.CorsConfiguration();
        // Iyzico (veya diğer ödeme sağlayıcıları) callback'lerine izin ver
        iyzicoConfig.setAllowedOriginPatterns(java.util.List.of("*"));
        iyzicoConfig.setAllowedMethods(java.util.List.of("POST", "OPTIONS"));
        iyzicoConfig.setAllowedHeaders(java.util.List.of("*"));
        iyzicoConfig.setAllowCredentials(false); // Dış sistemlerden credentials beklenmez

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        // Genel API noktaları frontend'e kısıtlı
        source.registerCorsConfiguration("/**", frontendConfig);
        // Sadece ödeme callback endpointi dışarıya açık
        source.registerCorsConfiguration("/payment/callback", iyzicoConfig);
        
        return source;
    }
}

