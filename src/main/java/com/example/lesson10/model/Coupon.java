package com.example.lesson10.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code; // Örn: YAZ2024

    private BigDecimal discountPercentage; // Örn: 15.00 (%15 indirim)

    private LocalDateTime expirationDate; // Son kullanma tarihi

    private Integer usageLimit; // Toplam kaç kez kullanılabilir (Örn: 100)

    private Integer usedCount = 0; // Şu ana kadar kaç kez kullanıldı
    
    private BigDecimal minimumCartAmount; // Minumum sepet tutarı
    
    private boolean isActive = true;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public BigDecimal getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(BigDecimal discountPercentage) { this.discountPercentage = discountPercentage; }
    
    public LocalDateTime getExpirationDate() { return expirationDate; }
    public void setExpirationDate(LocalDateTime expirationDate) { this.expirationDate = expirationDate; }
    
    public Integer getUsageLimit() { return usageLimit; }
    public void setUsageLimit(Integer usageLimit) { this.usageLimit = usageLimit; }
    
    public Integer getUsedCount() { return usedCount; }
    public void setUsedCount(Integer usedCount) { this.usedCount = usedCount; }
    
    public BigDecimal getMinimumCartAmount() { return minimumCartAmount; }
    public void setMinimumCartAmount(BigDecimal minimumCartAmount) { this.minimumCartAmount = minimumCartAmount; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public boolean isValid(BigDecimal cartTotal) {
        if (!isActive) return false;
        if (expirationDate != null && expirationDate.isBefore(LocalDateTime.now())) return false;
        if (usageLimit != null && usedCount >= usageLimit) return false;
        if (minimumCartAmount != null && cartTotal != null && cartTotal.compareTo(minimumCartAmount) < 0) return false;
        return true;
    }
}
