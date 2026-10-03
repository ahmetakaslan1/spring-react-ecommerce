package com.example.lesson10.controller;

import com.example.lesson10.dto.CartAddRequestDTO;
import com.example.lesson10.dto.CartItemResponseDTO;
import com.example.lesson10.security.CustomUserDetails;
import com.example.lesson10.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public List<CartItemResponseDTO> getMyCart(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return cartService.getMyCart(currentUser.getId());
    }

    @PostMapping
    public ResponseEntity<String> addToCart(
            @Valid @RequestBody CartAddRequestDTO dto,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        cartService.addToCart(currentUser.getId(), dto);
        return ResponseEntity.ok("Ürün sepete eklendi.");
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<String> removeFromCart(
            @PathVariable Long cartItemId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        cartService.removeFromCart(currentUser.getId(), cartItemId);
        return ResponseEntity.ok("Ürün sepetten çıkarıldı.");
    }

    @PatchMapping("/{cartItemId}/decrease")
    public ResponseEntity<String> decreaseCartQuantity(
            @PathVariable Long cartItemId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        cartService.decreaseQuantity(currentUser.getId(), cartItemId);
        return ResponseEntity.ok("Ürün miktarı azaltıldı.");
    }

}
