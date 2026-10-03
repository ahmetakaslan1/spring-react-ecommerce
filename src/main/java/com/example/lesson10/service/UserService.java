package com.example.lesson10.service;

import com.example.lesson10.dto.UserCreateDTO;
import com.example.lesson10.dto.UserResponseDTO;
import com.example.lesson10.dto.UserUpdateDTO;
import com.example.lesson10.mapper.UserMapper;
import com.example.lesson10.model.User;
import com.example.lesson10.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.example.lesson10.repository.RoleRepository roleRepository;

    public UserService(UserRepository userRepository, UserMapper userMapper, 
                       org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                       com.example.lesson10.repository.RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
    }

    public UserResponseDTO createUser(UserCreateDTO createDto) {
        if (userRepository.existsByEmail(createDto.getEmail())) {
            throw new RuntimeException("Bu email adresi zaten kullanımda! Başka bir email deneyin.");
        }

        User user = userMapper.toEntity(createDto);
        
        // Admin'in girdiği şifreyi şifreliyoruz
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Şimdilik varsayılan olarak USER rolü atayalım. (İleride DTO'ya rol alanı ekleyip admin'in seçmesini sağlayabiliriz)
        com.example.lesson10.model.Role userRole = roleRepository.findByRoleName("USER").orElse(null);
        if (userRole != null) {
            user.setRoles(List.of(userRole));
        }

        User savedUser = userRepository.save(user);
        return userMapper.toResponseDTO(savedUser);
    }

    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    public String deleteUser(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return "Böyle bir kullanıcı bulunamadı. Silme işlemi iptal edildi.";
        }
        
        // SOFT DELETE: Veritabanından satırı silmek yerine hesabı pasife çekiyoruz.
        user.setActive(false);
        userRepository.save(user);
        
        return id + " id'li Kullanıcı başarıyla silindi (Hesap Pasife Çekildi).";
    }

    public String toggleUserBan(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return "Böyle bir kullanıcı bulunamadı.";
        }
        
        user.setActive(!user.isActive());
        userRepository.save(user);
        
        return user.isActive() ? "Kullanıcı yasağı kaldırıldı." : "Kullanıcı banlandı.";
    }

    // --- PROFIL (ME) ISLEMLERI ---

    public UserResponseDTO getMyProfile(Long loggedInUserId) {
        User user = userRepository.findById(loggedInUserId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        return userMapper.toResponseDTO(user);
    }

    public UserResponseDTO updateMyProfile(Long loggedInUserId, UserUpdateDTO dto) {
        User user = userRepository.findById(loggedInUserId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));

        // Eğer isim gönderilmişse ve boş değilse güncelle
        if (dto.getFirstName() != null && !dto.getFirstName().trim().isEmpty()) {
            user.setFirstName(dto.getFirstName());
        }

        // Eğer soyisim gönderilmişse ve boş değilse güncelle
        if (dto.getLastName() != null && !dto.getLastName().trim().isEmpty()) {
            user.setLastName(dto.getLastName());
        }

        // Eğer şifre gönderilmişse ve boş değilse şifreleyerek güncelle
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            if (dto.getPassword().length() < 6) {
                throw new RuntimeException("Yeni şifre en az 6 karakter olmalıdır!");
            }
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        if (dto.getGender() != null) {
            user.setGender(dto.getGender());
        }

        if (dto.getBirthDate() != null) {
            user.setBirthDate(dto.getBirthDate());
        }

        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getCity() != null) user.setCity(dto.getCity());
        if (dto.getDistrict() != null) user.setDistrict(dto.getDistrict());
        if (dto.getAddress() != null) user.setAddress(dto.getAddress());

        userRepository.save(user);
        return userMapper.toResponseDTO(user);
    }

    public void deleteMyProfile(Long loggedInUserId) {
        User user = userRepository.findById(loggedInUserId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        
        user.setActive(false);
        userRepository.save(user);
    }
}

