package com.example.lesson10.service.payment;

import com.example.lesson10.dto.CheckoutRequestDTO;
import com.example.lesson10.model.User;
import com.example.lesson10.model.CartItem;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentStrategy {
    
    /**
     * Ödeme işlemini başlatır ve dönen HTML/Yönlendirme sonucunu verir.
     */
    PaymentInitResult initializePayment(User user, List<CartItem> cartItems, CheckoutRequestDTO dto, BigDecimal totalPrice);
}
