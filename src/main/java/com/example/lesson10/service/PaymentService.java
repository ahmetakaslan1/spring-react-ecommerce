package com.example.lesson10.service;

import com.example.lesson10.model.CartItem;
import com.example.lesson10.model.Product;
import com.example.lesson10.model.User;
import com.example.lesson10.repository.CartItemRepository;
import com.example.lesson10.repository.UserRepository;
import com.iyzipay.Options;
import com.iyzipay.model.Address;
import com.iyzipay.model.BasketItem;
import com.iyzipay.model.BasketItemType;
import com.iyzipay.model.Buyer;
import com.iyzipay.model.CheckoutFormInitialize;
import com.iyzipay.model.Currency;
import com.iyzipay.model.Locale;
import com.iyzipay.model.PaymentGroup;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import com.example.lesson10.dto.CheckoutRequestDTO;
import com.example.lesson10.repository.AddressRepository;
import com.example.lesson10.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    @Value("${iyzico.callback-url}")
    private String callbackUrl;

    private final Options iyzicoOptions;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final com.example.lesson10.repository.CouponRepository couponRepository;

    public PaymentService(Options iyzicoOptions, CartItemRepository cartItemRepository, 
                          UserRepository userRepository, AddressRepository addressRepository,
                          OrderRepository orderRepository, com.example.lesson10.repository.CouponRepository couponRepository) {
        this.iyzicoOptions = iyzicoOptions;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.orderRepository = orderRepository;
        this.couponRepository = couponRepository;
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

        CreateCheckoutFormInitializeRequest request = new CreateCheckoutFormInitializeRequest();
        request.setLocale(Locale.TR.getValue());
        request.setConversationId(UUID.randomUUID().toString()); // Benzersiz işlem id
        request.setPrice(totalPrice);
        request.setPaidPrice(totalPrice);
        request.setCurrency(Currency.TRY.name());
        request.setBasketId(userId.toString()); // Kullanıcı ID'sini buraya gizliyoruz
        request.setPaymentGroup(PaymentGroup.PRODUCT.name());
        
        // Iyzico işlem sonucunu bu adrese POST edecek
        request.setCallbackUrl(callbackUrl);
        
        // Disable 3D secure for testing simplicity if needed, but Iyzico defaults to 3D often.
        // request.setForceThreeDS(0);

        List<Integer> enabledInstallments = new ArrayList<>();
        enabledInstallments.add(1);
        enabledInstallments.add(2);
        enabledInstallments.add(3);
        request.setEnabledInstallments(enabledInstallments);

        // Alıcı Bilgileri
        Buyer buyer = new Buyer();
        buyer.setId(user.getId().toString());
        
        buyer.setName(dto.getFirstName());
        buyer.setSurname(dto.getLastName());
        buyer.setGsmNumber(dto.getPhoneNumber());
        buyer.setEmail(user.getEmail());
        buyer.setIdentityNumber("11111111111"); // Gerçek projelerde TC istenir
        buyer.setLastLoginDate("2023-10-01 12:43:35");
        buyer.setRegistrationDate("2023-10-01 12:43:35");
        buyer.setRegistrationAddress(dto.getFullAddress());
        buyer.setIp("85.34.78.112");
        buyer.setCity(dto.getCity());
        buyer.setCountry("Turkey");
        buyer.setZipCode("34732");
        request.setBuyer(buyer);

        // Kargo Adresi
        Address shippingAddress = new Address();
        shippingAddress.setContactName(dto.getFirstName() + " " + dto.getLastName());
        shippingAddress.setCity(dto.getCity());
        shippingAddress.setCountry("Turkey");
        shippingAddress.setAddress(dto.getFullAddress());
        shippingAddress.setZipCode("34732");
        request.setShippingAddress(shippingAddress);

        // Fatura Adresi (Şimdilik aynı)
        Address billingAddress = new Address();
        billingAddress.setContactName(dto.getFirstName() + " " + dto.getLastName());
        billingAddress.setCity(dto.getCity());
        billingAddress.setCountry("Turkey");
        billingAddress.setAddress(dto.getFullAddress());
        billingAddress.setZipCode("34732");
        request.setBillingAddress(billingAddress);

        // Sepet İçeriği
        List<BasketItem> basketItems = new ArrayList<>();
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            BasketItem basketItem = new BasketItem();
            basketItem.setId(product.getId().toString());
            basketItem.setName(product.getName());
            basketItem.setCategory1(product.getCategory() != null ? product.getCategory().getName() : "Genel");
            basketItem.setCategory2("E-Ticaret");
            basketItem.setItemType(BasketItemType.PHYSICAL.name());
            basketItem.setPrice(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            basketItems.add(basketItem);
        }
        request.setBasketItems(basketItems);

        // İsteği Iyzico'ya gönder
        CheckoutFormInitialize checkoutFormInitialize = CheckoutFormInitialize.create(request, iyzicoOptions);

        if ("failure".equals(checkoutFormInitialize.getStatus())) {
            throw new RuntimeException("Iyzico Hatası: " + checkoutFormInitialize.getErrorMessage());
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
        order.setPaymentTransactionId(checkoutFormInitialize.getToken()); // Iyzico token'ı
        
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
        orderRepository.save(order);

        // Bize HTML snippet dönecek. Bunu frontend'de div'e basacağız.
        return checkoutFormInitialize.getCheckoutFormContent();
    }
}
