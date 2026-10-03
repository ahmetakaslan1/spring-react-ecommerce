package com.example.lesson10.controller;

import com.example.lesson10.dto.ProductCreateDTO;
import com.example.lesson10.model.Product;
import com.example.lesson10.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // 1. KÖTÜ YÖNTEM (Tüm veriyi aynı anda çekmek - Sunucuyu yorar)
    // Gerçek dünyada binlerce kayıt varken bu metot RAM'i şişirir.
    @GetMapping("/all")
    public List<Product> getAllProductsBadWay() {
        return productService.getAllProductsBadWay();
    }

    // 2. İYİ YÖNTEM (Sayfalama - Pagination)
    // Sadece istenen sayfa numarasına göre sınırlı sayıda veri çeker.
    @GetMapping("/paged")
    public Page<Product> getProductsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long categoryId) {
        
        return productService.getProductsPaged(page, size, categoryId);
    }

    // --- ADMIN İŞLEMLERİ ---

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductCreateDTO dto) {
        return ResponseEntity.ok(productService.createProduct(dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductCreateDTO dto) {
        return ResponseEntity.ok(productService.updateProduct(id, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok("Ürün başarıyla silindi.");
    }
}
