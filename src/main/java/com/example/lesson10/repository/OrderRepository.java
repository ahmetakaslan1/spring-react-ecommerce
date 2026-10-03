package com.example.lesson10.repository;

import com.example.lesson10.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Kullanıcının kendi siparişlerini çekebilmesi için özel sorgu
    List<Order> findByUserIdOrderByIdDesc(Long userId);

    // Admin için tüm siparişleri yeniden eskiye sıralı çekmek için
    List<Order> findAllByOrderByIdDesc();
    
    java.util.Optional<Order> findByPaymentTransactionId(String token);
}

