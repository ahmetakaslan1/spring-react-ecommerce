package com.example.lesson10.service;

import com.example.lesson10.dto.OrderCreateDTO;
import com.example.lesson10.dto.OrderResponseDTO;
import com.example.lesson10.mapper.OrderMapper;
import com.example.lesson10.model.Order;
import com.example.lesson10.model.Product;
import com.example.lesson10.model.User;
import com.example.lesson10.repository.OrderRepository;
import com.example.lesson10.repository.ProductRepository;
import com.example.lesson10.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository, ProductRepository productRepository, OrderMapper orderMapper) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderMapper = orderMapper;
    }

    @Transactional
    public OrderResponseDTO createOrder(OrderCreateDTO dto, Long loggedInUserId) {
        throw new RuntimeException("Direct order creation via this method is no longer supported. Please use checkoutCart.");
    }

    public List<OrderResponseDTO> getAllOrders() {
        return orderRepository.findAllByOrderByIdDesc().stream()
                .map(orderMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<OrderResponseDTO> getMyOrders(Long loggedInUserId) {
        return orderRepository.findByUserIdOrderByIdDesc(loggedInUserId).stream()
                .map(orderMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelOrder(Long orderId, Long loggedInUserId, boolean isAdmin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı!"));

        // Güvenlik: Bu sipariş iptal etmeye çalışan kişiye mi ait? VEYA kişi ADMIN mi?
        if (!isAdmin && !order.getUser().getId().equals(loggedInUserId)) {
            throw new RuntimeException("Yetkisiz işlem! Başkasının siparişini iptal edemezsiniz.");
        }

        if (order.getStatus() == com.example.lesson10.model.OrderStatus.CANCELLED) {
            throw new RuntimeException("Sipariş zaten iptal edilmiş!");
        }

        if (order.getStatus() == com.example.lesson10.model.OrderStatus.SHIPPED || order.getStatus() == com.example.lesson10.model.OrderStatus.DELIVERED) {
            throw new RuntimeException("Kargolanmış veya teslim edilmiş siparişler iptal edilemez!");
        }

        // Siparişi iptal et
        order.setStatus(com.example.lesson10.model.OrderStatus.CANCELLED);
        orderRepository.save(order);

        // İptal edilen siparişteki tüm ürünlerin stoğunu geri iade et
        for (com.example.lesson10.model.OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }
    }

    @Transactional
    public void updateOrderStatus(Long orderId, String newStatusStr) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı!"));

        com.example.lesson10.model.OrderStatus newStatus;
        try {
            newStatus = com.example.lesson10.model.OrderStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Geçersiz sipariş durumu!");
        }

        // Eğer mevcut durum CANCELLED ise ve başka bir duruma çekilmek isteniyorsa stoku geri almak gerekir, 
        // ya da iptal edilen siparişler değiştirilemez diyelim. (Karmaşıklığı önlemek için iptaller geri alınamaz diyelim)
        if (order.getStatus() == com.example.lesson10.model.OrderStatus.CANCELLED) {
            throw new RuntimeException("İptal edilmiş bir siparişin durumu değiştirilemez!");
        }

        // Eğer admin siparişi CANCELLED yapmak istiyorsa, hazır yazılmış cancel metodunu kullanmalı 
        // (çünkü stok iadesi lazım). Bu metotla CANCELLED yapmasına izin vermeyelim.
        if (newStatus == com.example.lesson10.model.OrderStatus.CANCELLED) {
            throw new RuntimeException("Siparişi iptal etmek için lütfen İptal et butonunu kullanın!");
        }

        order.setStatus(newStatus);
        orderRepository.save(order);
    }
    
    @Transactional
    public void updateOrderShipping(Long orderId, String shippingCompany, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı!"));
                
        order.setShippingCompany(shippingCompany);
        order.setTrackingNumber(trackingNumber);
        
        // Eğer kargo giriliyorsa otomatik olarak durumunu "Kargolandı" yapabiliriz
        if (order.getStatus() == com.example.lesson10.model.OrderStatus.PENDING || 
            order.getStatus() == com.example.lesson10.model.OrderStatus.COMPLETED) {
            order.setStatus(com.example.lesson10.model.OrderStatus.SHIPPED);
        }
        
        orderRepository.save(order);
    }
}

