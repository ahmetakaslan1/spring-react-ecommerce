package com.example.lesson10.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CartAddRequestDTO {
    
    @NotNull(message = "Ürün ID boş olamaz")
    private Long productId;

    @Min(value = 1, message = "Adet en az 1 olmalıdır")
    private Integer quantity;

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
