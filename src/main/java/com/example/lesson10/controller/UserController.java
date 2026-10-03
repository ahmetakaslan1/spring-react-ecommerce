package com.example.lesson10.controller;

import com.example.lesson10.dto.UserCreateDTO;
import com.example.lesson10.dto.UserResponseDTO;
import com.example.lesson10.dto.UserUpdateDTO;
import com.example.lesson10.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }
    // Tabiki Bu Yazı Kısaltılabilir. @PreAuthorize de import edilirse. 
    // Sadece ADMIN'ler yeni bir kullanıcı/çalışan hesabı oluşturabilir (Admin Paneli Mantığı)
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public UserResponseDTO createUser(@Valid @RequestBody UserCreateDTO userCreateDTO) {
        return userService.createUser(userCreateDTO);
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    // Kritik Kural: Silmek istediği ID kendi ID'sine eşitse VEYA rolü ADMIN ise silebilir!
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        return userService.deleteUser(id);
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/ban")
    public String toggleUserBan(@PathVariable Long id) {
        return userService.toggleUserBan(id);
    }

    // --- PROFIL (ME) ISLEMLERI ---

    @GetMapping("/me")
    public UserResponseDTO getMyProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.lesson10.security.CustomUserDetails currentUser) {
        return userService.getMyProfile(currentUser.getId());
    }

    @PutMapping("/me")
    public UserResponseDTO updateMyProfile(
            @Valid @RequestBody UserUpdateDTO dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.lesson10.security.CustomUserDetails currentUser) {
        return userService.updateMyProfile(currentUser.getId(), dto);
    }

    @DeleteMapping("/me")
    public org.springframework.http.ResponseEntity<String> deleteMyProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.lesson10.security.CustomUserDetails currentUser) {
        userService.deleteMyProfile(currentUser.getId());
        return org.springframework.http.ResponseEntity.ok("Hesabınız başarıyla silinmiştir.");
    }
}

