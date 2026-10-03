package com.example.lesson10.service;

import com.example.lesson10.dto.AuthResponseDTO;
import com.example.lesson10.dto.LoginRequestDTO;
import com.example.lesson10.dto.UserCreateDTO;
import com.example.lesson10.dto.UserResponseDTO;
import com.example.lesson10.mapper.UserMapper;
import com.example.lesson10.model.Role;
import com.example.lesson10.model.User;
import com.example.lesson10.repository.RoleRepository;
import com.example.lesson10.repository.UserRepository;
import com.example.lesson10.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, UserMapper userMapper, 
                       PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userMapper = userMapper;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    // KAYIT OLMA (REGISTER)
    public AuthResponseDTO register(UserCreateDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Bu email zaten kullanımda!");
        }

        User user = userMapper.toEntity(dto);
        
        // 1. Şifreyi BCrypt ile gizle!
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // 2. Yeni kayıt olan kişiye otomatik "USER" rolü ver (Opsiyonel ama mantıklı)
        Role userRole = roleRepository.findByRoleName("USER").orElse(null);
        if (userRole != null) {
            user.setRoles(List.of(userRole));
        }

        // 3. E-posta doğrulama token'ı oluştur
        String verificationToken = java.util.UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        user.setEmailVerified(false);

        userRepository.save(user);
        
        // 4. Doğrulama maili gönder
        String verifyUrl = "http://localhost:3000/verify?token=" + verificationToken;
        String emailText = "Merhaba " + user.getFirstName() + ",\n\n"
                + "Gelecek Store'a hoş geldiniz! Lütfen hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:\n"
                + verifyUrl;
        emailService.sendSimpleMessage(user.getEmail(), "E-Posta Doğrulama", emailText);
        
        // 5. Kullanıcı başarıyla kaydedildiğine göre hemen bir Token bas (Auto-Login)
        String token = jwtUtil.generateToken(user.getEmail());
        
        boolean isAdmin = user.getRoles() != null && user.getRoles().stream()
                .anyMatch(role -> role.getRoleName().equals("ADMIN"));
                
        return new AuthResponseDTO(token, isAdmin);
    }

    // GİRİŞ YAPMA (LOGIN)
    public AuthResponseDTO login(LoginRequestDTO dto) {
        // 1. Spring Security görevlisine diyoruz ki "Şu email ve şifreye bak bakalım doğru mu?"
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
        );

        // 2. Doğruysa (Hata fırlatmadıysa) JWT biletini basıyoruz!
        String token = jwtUtil.generateToken(dto.getEmail());
        
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        boolean isAdmin = user.getRoles() != null && user.getRoles().stream()
                .anyMatch(role -> role.getRoleName().equals("ADMIN"));
                
        // 3. Kullanıcıya token'ı dönüyoruz.
        return new AuthResponseDTO(token, isAdmin);
    }
    
    // E-POSTA DOĞRULAMA (VERIFY EMAIL)
    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Geçersiz veya süresi dolmuş doğrulama linki!"));
                
        user.setEmailVerified(true);
        user.setVerificationToken(null); // Token bir kere kullanılır
        userRepository.save(user);
        
        return "E-posta adresiniz başarıyla doğrulandı!";
    }
}

