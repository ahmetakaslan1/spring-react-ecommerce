package com.example.lesson10.controller;

import com.example.lesson10.dto.AuthResponseDTO;
import com.example.lesson10.dto.LoginRequestDTO;
import com.example.lesson10.dto.UserCreateDTO;
import com.example.lesson10.dto.UserResponseDTO;
import com.example.lesson10.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponseDTO register(@Valid @RequestBody UserCreateDTO dto) {
        return authService.register(dto);
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@Valid @RequestBody LoginRequestDTO dto) {
        return authService.login(dto);
    }

    @GetMapping("/verify")
    public org.springframework.http.ResponseEntity<String> verifyEmail(@RequestParam String token) {
        String message = authService.verifyEmail(token);
        return org.springframework.http.ResponseEntity.ok(message);
    }
}

