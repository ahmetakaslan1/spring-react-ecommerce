package com.example.lesson10.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

// Spring Security'nin standart kullanıcı nesnesi sadece "username" ve "password" bilir.
// Kendi sistemimizdeki "ID" bilgisini de filtrelerde kullanabilmek için bu nesneyi genişletiyoruz.
public class CustomUserDetails extends User {
    
    private final Long id;
    
    // SOFT DELETE UYUMU: Kullanıcının aktif olup olmadığını (enabled) Spring Security'ye bildiriyoruz!
    public CustomUserDetails(String username, String password, boolean enabled, Collection<? extends GrantedAuthority> authorities, Long id) {
        // enabled: Hesap aktif mi? (Soft delete için)
        // diğer 3 boolean: Hesap süresi doldu mu?, Şifre süresi doldu mu?, Hesap kilitli mi? (Hepsine true diyoruz)
        super(username, password, enabled, true, true, true, authorities); 
        this.id = id; 
    }

    public Long getId() {
        return id;
    }
}

