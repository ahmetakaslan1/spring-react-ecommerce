package com.example.lesson10.model;

public enum OrderStatus {
    PENDING,    // Beklemede (Ödeme Bekleniyor)
    COMPLETED,  // Ödendi / Onaylandı
    SHIPPED,    // Kargolandı
    DELIVERED,  // Teslim Edildi
    CANCELLED   // İptal Edildi
}
