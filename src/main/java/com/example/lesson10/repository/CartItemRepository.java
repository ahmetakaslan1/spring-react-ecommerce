package com.example.lesson10.repository;

import com.example.lesson10.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    @Query("SELECT c FROM CartItem c JOIN FETCH c.product WHERE c.user.id = :userId")
    List<CartItem> findByUserId(@Param("userId") Long userId);
    
    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserId(Long userId);
}
