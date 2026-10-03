package com.example.lesson10.security;

import com.example.lesson10.model.User;
import com.example.lesson10.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Spring Security, login olurken kullanıcının şifresini kontrol etmek için bu metodu otomatik çağırır.
    @Override
    @org.springframework.transaction.annotation.Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. Kullanıcıyı DB'den email ile bul
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Bu email ile bir kullanıcı bulunamadı: " + email));

        // 2. Kullanıcının DB'deki rollerini Spring Security'nin anlayacağı formata (GrantedAuthority) çevir
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleName())) // "ROLE_ADMIN" gibi
                .collect(Collectors.toList());

        // 3. Spring Security'nin kendi UserDetails objesi yerine bizim CustomUserDetails'i döndürüyoruz!
        // user.isActive() -> Eğer adam hesabını sildiyse (Soft Delete), enabled=false gidecek ve Spring girişi engelleyecek!
        return new CustomUserDetails(
                user.getEmail(),
                user.getPassword(),
                user.isActive(), // SOFT DELETE: Aktif mi değil mi kontrolü
                authorities,
                user.getId() // Sahiplik kontrolleri için ID
        );
    }
}

