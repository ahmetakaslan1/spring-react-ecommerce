package com.example.lesson10.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ProductCreateDTO {
    
    @NotBlank(message = "Ürün adı boş olamaz")
    private String name;
    
    private String description;
    
    @NotNull(message = "Fiyat boş olamaz")
    @Min(value = 0, message = "Fiyat 0'dan küçük olamaz")
    private BigDecimal price;
    
    @NotNull(message = "Stok boş olamaz")
    @Min(value = 0, message = "Stok 0'dan küçük olamaz")
    private Integer stock;

    @NotNull(message = "Kategori ID boş olamaz")
    private Long categoryId;

    private String imageUrl;

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
