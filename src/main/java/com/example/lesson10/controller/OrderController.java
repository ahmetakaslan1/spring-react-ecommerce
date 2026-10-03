package com.example.lesson10.controller;

import com.example.lesson10.dto.OrderCreateDTO;
import com.example.lesson10.dto.OrderResponseDTO;
import com.example.lesson10.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /*
     * 1. SİPARİŞ SAHTEKARLIĞI (IDOR) ÇÖZÜMÜ:
     * Eskiden siparişi kimin verdiğini dışarıdan (JSON içindeki userId) alıyorduk.
     * Bu büyük bir açıktı çünkü kötü niyetli biri başkasının ID'sini yazabilirdi.
     * Artık dışarıdan ID almıyoruz. DTO'dan o alanı sildik.
     * Adamın gerçek ID'sini Spring Security'nin kasasından (AuthenticationPrincipal) çekiyoruz!
     */
    @PostMapping
    public OrderResponseDTO createOrder(@Valid @RequestBody OrderCreateDTO orderCreateDTO,
                                        @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.lesson10.security.CustomUserDetails currentUser) {
        // Güvenli ID'yi service katmanına gönderiyoruz
        return orderService.createOrder(orderCreateDTO, currentUser.getId());
    }

    /*
     * 2. GİZLİLİK İHLALİ ÇÖZÜMÜ:
     * Eskiden sisteme giren herkes (sıradan müşteriler dahil) tüm siparişleri görebiliyordu.
     * Artık bu kapının önüne ADMIN güvenlik görevlisini diktik. Sadece ADMIN'ler tüm listeyi çekebilir.
     */
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<OrderResponseDTO> getAllOrders() {
        return orderService.getAllOrders();
    }

    /*
     * YENİ: Sadece sisteme giriş yapmış kullanıcının kendi siparişlerini getiren metot.
     * Güvenlik: ID dışarıdan alınmaz, Spring Security token'dan (AuthenticationPrincipal) okunur.
     */
    @GetMapping("/my-orders")
    public List<OrderResponseDTO> getMyOrders(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.lesson10.security.CustomUserDetails currentUser) {
        return orderService.getMyOrders(currentUser.getId());
    }

    /*
     * 3. SİPARİŞ İPTALİ (Soft Delete for Orders)
     * Kullanıcı siparişten vazgeçtiğinde silinmez, durumu İPTAL EDİLDİ olur.
     */
    @PatchMapping("/{id}/cancel")
    public org.springframework.http.ResponseEntity<String> cancelOrder(@PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.lesson10.security.CustomUserDetails currentUser) {
        
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                
        orderService.cancelOrder(id, currentUser.getId(), isAdmin);
        return org.springframework.http.ResponseEntity.ok("Sipariş başarıyla iptal edildi ve stok iade edildi.");
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public org.springframework.http.ResponseEntity<String> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        orderService.updateOrderStatus(id, status);
        return org.springframework.http.ResponseEntity.ok("Sipariş durumu güncellendi: " + status);
    }
    
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/shipping")
    public org.springframework.http.ResponseEntity<String> updateOrderShipping(@PathVariable Long id, 
            @RequestParam String shippingCompany, 
            @RequestParam String trackingNumber) {
        orderService.updateOrderShipping(id, shippingCompany, trackingNumber);
        return org.springframework.http.ResponseEntity.ok("Kargo bilgileri güncellendi.");
    }
}

