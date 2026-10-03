package com.example.lesson10.service;

import com.example.lesson10.dto.CartAddRequestDTO;
import com.example.lesson10.dto.CartItemResponseDTO;
import com.example.lesson10.model.CartItem;
import com.example.lesson10.model.Order;
import com.example.lesson10.model.OrderStatus;
import com.example.lesson10.model.Product;
import com.example.lesson10.model.User;
import com.example.lesson10.repository.CartItemRepository;
import com.example.lesson10.repository.OrderRepository;
import com.example.lesson10.repository.ProductRepository;
import com.example.lesson10.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final com.example.lesson10.repository.CouponRepository couponRepository;
    private final EmailService emailService;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository, 
                       UserRepository userRepository, OrderRepository orderRepository,
                       com.example.lesson10.repository.CouponRepository couponRepository,
                       EmailService emailService) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.couponRepository = couponRepository;
        this.emailService = emailService;
    }

    public List<CartItemResponseDTO> getMyCart(Long loggedInUserId) {
        return cartItemRepository.findByUserId(loggedInUserId).stream().map(item -> {
            CartItemResponseDTO dto = new CartItemResponseDTO();
            dto.setId(item.getId());
            dto.setProductId(item.getProduct().getId());
            dto.setProductName(item.getProduct().getName());
            dto.setProductImageUrl(item.getProduct().getImageUrl());
            dto.setPrice(item.getProduct().getPrice());
            dto.setQuantity(item.getQuantity());
            dto.setTotalPrice(item.getProduct().getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())));
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void addToCart(Long loggedInUserId, CartAddRequestDTO dto) {
        User user = userRepository.findById(loggedInUserId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı."));

        // Zaten sepette var mı kontrol et
        Optional<CartItem> existingItemOpt = cartItemRepository.findByUserIdAndProductId(loggedInUserId, product.getId());

        int newQuantity = dto.getQuantity();
        CartItem cartItem;

        if (existingItemOpt.isPresent()) {
            cartItem = existingItemOpt.get();
            newQuantity += cartItem.getQuantity();
        } else {
            cartItem = new CartItem();
            cartItem.setUser(user);
            cartItem.setProduct(product);
        }

        // Stok kontrolü (Sepete eklerken stoğu rezerve etmiyoruz, sadece var mı diye bakıyoruz)
        if (product.getStock() < newQuantity) {
            throw new RuntimeException("Yeterli stok yok! Mevcut stok: " + product.getStock());
        }

        cartItem.setQuantity(newQuantity);
        cartItemRepository.save(cartItem);
    }

    @Transactional
    public void removeFromCart(Long loggedInUserId, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Sepet ürünü bulunamadı."));

        if (!item.getUser().getId().equals(loggedInUserId)) {
            throw new RuntimeException("Yetkisiz işlem!");
        }

        cartItemRepository.delete(item);
    }

    @Transactional
    public void decreaseQuantity(Long loggedInUserId, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Sepet ürünü bulunamadı."));

        if (!item.getUser().getId().equals(loggedInUserId)) {
            throw new RuntimeException("Yetkisiz işlem!");
        }

        if (item.getQuantity() > 1) {
            item.setQuantity(item.getQuantity() - 1);
            cartItemRepository.save(item);
        } else {
            // Eğer 1 ise tamamen sil
            cartItemRepository.delete(item);
        }
    }

    @Transactional
    public void completePayment(String paymentToken, Long loggedInUserId) {
        // Iyzico token'a göre siparişi bul
        Order order = orderRepository.findByPaymentTransactionId(paymentToken)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı!"));

        // 1. Stokları Düşür (Optimistic Locking burada devrede)
        for (com.example.lesson10.model.OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product.getStock() < item.getQuantity()) {
                throw new RuntimeException(product.getName() + " için yeterli stok kalmadı!");
            }
            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
        }

        // 2. Sipariş durumunu COMPLETED yap
        order.setStatus(com.example.lesson10.model.OrderStatus.COMPLETED);
        orderRepository.save(order);
        
        // Kupon varsa kullanım sayısını artır
        if (order.getAppliedCoupon() != null) {
            com.example.lesson10.model.Coupon coupon = order.getAppliedCoupon();
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        // 3. Sepeti temizle
        cartItemRepository.deleteByUserId(loggedInUserId);
        
        // 4. Müşteriye Sipariş Onay E-postası Gönder
        User user = order.getUser();
        String emailText = "Merhaba " + user.getFirstName() + ",\n\n" +
                           "Siparişiniz başarıyla alınmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.\n" +
                           "Sipariş Numaranız: " + order.getId() + "\n\n" +
                           "İyi günler dileriz.";
                           
        emailService.sendSimpleMessage(user.getEmail(), "Siparişiniz Alındı!", emailText);
    }
}
