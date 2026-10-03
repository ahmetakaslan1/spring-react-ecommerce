package com.example.lesson10.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class OrderCreateDTO {
    // GÜVENLİK GÜNCELLEMESİ: userId alanı dışarıdan alınmamalıdır! Silindi.
    
    @NotNull(message = "Ürün ID boş olamaz")
    private Long productId;
    
    @NotNull(message = "Adet boş olamaz")
    @Min(value = 1, message = "Adet en az 1 olmalıdır")
    private Integer quantity;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}

