package com.example.lesson10.controller;

import com.example.lesson10.model.SystemSetting;
import com.example.lesson10.repository.SystemSettingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/settings")
public class SystemSettingController {

    private final SystemSettingRepository systemSettingRepository;

    public SystemSettingController(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SystemSetting>> getAllSettings() {
        return ResponseEntity.ok(systemSettingRepository.findAll());
    }

    @PostMapping("/update-payment")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updatePaymentStrategy(@RequestBody Map<String, String> payload) {
        String strategy = payload.get("strategy");
        if (strategy == null || strategy.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Strateji adı boş olamaz");
        }

        SystemSetting setting = systemSettingRepository.findById("ACTIVE_PAYMENT_STRATEGY")
                .orElse(new SystemSetting("ACTIVE_PAYMENT_STRATEGY", "iyzicoPaymentStrategy"));
        
        setting.setSettingValue(strategy);
        systemSettingRepository.save(setting);
        
        return ResponseEntity.ok("Ödeme yöntemi başarıyla güncellendi.");
    }
}
