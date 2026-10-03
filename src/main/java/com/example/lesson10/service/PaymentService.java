package com.example.lesson10.service;

import com.example.lesson10.dto.CheckoutRequestDTO;
import com.example.lesson10.model.CartItem;
import com.example.lesson10.model.User;
import com.example.lesson10.repository.AddressRepository;
import com.example.lesson10.repository.CartItemRepository;
import com.example.lesson10.repository.OrderRepository;
import com.example.lesson10.repository.UserRepository;
import com.example.lesson10.service.payment.PaymentInitResult;
import com.example.lesson10.service.payment.PaymentStrategy;
import com.example.lesson10.service.payment.PaymentStrategyFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PaymentService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final com.example.lesson10.repository.CouponRepository couponRepository;
    private final PaymentStrategyFactory paymentStrategyFactory;
    private final com.example.lesson10.repository.SystemSettingRepository systemSettingRepository;

    public PaymentService(CartItemRepository cartItemRepository,
                          UserRepository userRepository, 
                          AddressRepository addressRepository,
                          OrderRepository orderRepository, 
                          com.example.lesson10.repository.CouponRepository couponRepository,
                          PaymentStrategyFactory paymentStrategyFactory,
                          com.example.lesson10.repository.SystemSettingRepository systemSettingRepository) {
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.orderRepository = orderRepository;
        this.couponRepository = couponRepository;
        this.paymentStrategyFactory = paymentStrategyFactory;
        this.systemSettingRepository = systemSettingRepository;
    }

    @Transactional
    public String generateCheckoutForm(Long userId, CheckoutRequestDTO dto) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);

        if (cartItems.isEmpty()) {
            throw new RuntimeException("Sepetiniz boş!");
        }

        // Sepetteki toplam tutarı hesapla
        BigDecimal totalPrice = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            BigDecimal itemTotal = item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            totalPrice = totalPrice.add(itemTotal);
        }

        // Kupon Kontrolü ve İndirim Uygulaması
        com.example.lesson10.model.Coupon appliedCoupon = null;
        if (dto.getCouponCode() != null && !dto.getCouponCode().trim().isEmpty()) {
            appliedCoupon = couponRepository.findByCode(dto.getCouponCode())
                .orElseThrow(() -> new RuntimeException("Geçersiz kupon kodu!"));
                
            if (!appliedCoupon.isValid(totalPrice)) {
                throw new RuntimeException("Kuponun süresi dolmuş, kullanım limiti aşılmış veya sepet tutarı yetersiz.");
            }
            
            BigDecimal discount = totalPrice.multiply(appliedCoupon.getDiscountPercentage()).divide(BigDecimal.valueOf(100));
            totalPrice = totalPrice.subtract(discount);
        }

        // Adresi kaydet
        com.example.lesson10.model.Address addressEntity = new com.example.lesson10.model.Address();
        addressEntity.setUser(user);
        addressEntity.setContactName(dto.getFirstName() + " " + dto.getLastName());
        addressEntity.setPhoneNumber(dto.getPhoneNumber());
        addressEntity.setCity(dto.getCity());
        addressEntity.setDistrict(dto.getDistrict());
        addressEntity.setFullAddress(dto.getFullAddress());
        addressRepository.save(addressEntity);

        // Kullanıcının profil bilgilerini güncelle (bir sonraki siparişte hazır gelsin)
        if (user.getPhone() == null || user.getPhone().isEmpty()) user.setPhone(dto.getPhoneNumber());
        if (user.getCity() == null || user.getCity().isEmpty()) user.setCity(dto.getCity());
        if (user.getDistrict() == null || user.getDistrict().isEmpty()) user.setDistrict(dto.getDistrict());
        if (user.getAddress() == null || user.getAddress().isEmpty()) user.setAddress(dto.getFullAddress());
        userRepository.save(user);

        // Bekleyen siparişi oluştur
        com.example.lesson10.model.Order order = new com.example.lesson10.model.Order();
        order.setUser(user);
        order.setAddress(addressEntity);
        order.setStatus(com.example.lesson10.model.OrderStatus.PENDING);
        
        if (appliedCoupon != null) {
            order.setAppliedCoupon(appliedCoupon);
        }
        for (CartItem item : cartItems) {
            com.example.lesson10.model.OrderItem orderItem = new com.example.lesson10.model.OrderItem();
            orderItem.setProduct(item.getProduct());
            orderItem.setQuantity(item.getQuantity());
            orderItem.setUnitPrice(item.getProduct().getPrice());
            order.addItem(orderItem);
        }
        order.setTotalAmount(totalPrice);
        
        // --- STRATEGY KULLANIMI ---
        // Veritabanından aktif ödeme yöntemini çekiyoruz. (Örn: "iyzicoPaymentStrategy")
        String activeStrategy = systemSettingRepository.findById("ACTIVE_PAYMENT_STRATEGY")
                .map(com.example.lesson10.model.SystemSetting::getSettingValue)
                .orElse("iyzicoPaymentStrategy");
                
        PaymentStrategy strategy = paymentStrategyFactory.getStrategy(activeStrategy);
        PaymentInitResult initResult = strategy.initializePayment(user, cartItems, dto, totalPrice);
        
        // Gelen transactionId'yi (Iyzico token) siparişe kaydet
        order.setPaymentTransactionId(initResult.getTransactionId());
        
        orderRepository.save(order);

        // HTML snippet'ı frontend'e dön
        return initResult.getCheckoutContent();
    }
}
