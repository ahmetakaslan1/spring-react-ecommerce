package com.example.lesson10.controller;

import com.example.lesson10.model.Coupon;
import com.example.lesson10.repository.CouponRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/coupons")
public class CouponController {

    private final CouponRepository couponRepository;

    public CouponController(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Coupon>> getActiveCoupons() {
        // Find coupons that are not expired and have remaining usage limit
        List<Coupon> activeCoupons = couponRepository.findAll().stream()
            .filter(c -> c.getUsageLimit() > c.getUsedCount())
            .toList();
        return ResponseEntity.ok(activeCoupons);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCoupon(@RequestBody Coupon coupon) {
        // Basic validation
        if (coupon.getCode() == null || coupon.getCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String cleanCode = coupon.getCode().toUpperCase().trim();
        
        if (couponRepository.findByCode(cleanCode).isPresent()) {
            return ResponseEntity.badRequest().body("Bu kupon kodu zaten kullanımda!");
        }
        
        coupon.setCode(cleanCode);
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @GetMapping("/validate/{code}")
    public ResponseEntity<?> validateCoupon(@PathVariable String code, @RequestParam(required = false) java.math.BigDecimal cartTotal) {
        return couponRepository.findByCode(code.toUpperCase())
            .map(coupon -> {
                if (!coupon.isValid(cartTotal)) {
                    if (coupon.getMinimumCartAmount() != null && cartTotal != null && cartTotal.compareTo(coupon.getMinimumCartAmount()) < 0) {
                        return ResponseEntity.badRequest().body("Bu kuponu kullanmak için minimum sepet tutarı " + coupon.getMinimumCartAmount() + " TL olmalıdır.");
                    }
                    return ResponseEntity.badRequest().body("Kuponun süresi dolmuş veya kullanım limiti aşıldı.");
                }
                return ResponseEntity.ok(coupon);
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
