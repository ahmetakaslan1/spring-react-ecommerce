package com.example.lesson10.service.payment;

import com.example.lesson10.dto.CheckoutRequestDTO;
import com.example.lesson10.model.CartItem;
import com.example.lesson10.model.Product;
import com.example.lesson10.model.User;
import com.iyzipay.Options;
import com.iyzipay.model.*;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component("iyzicoPaymentStrategy")
public class IyzicoPaymentStrategy implements PaymentStrategy {

    @Value("${iyzico.callback-url}")
    private String callbackUrl;

    private final Options iyzicoOptions;

    public IyzicoPaymentStrategy(Options iyzicoOptions) {
        this.iyzicoOptions = iyzicoOptions;
    }

    @Override
    public PaymentInitResult initializePayment(User user, List<CartItem> cartItems, CheckoutRequestDTO dto, BigDecimal totalPrice) {
        CreateCheckoutFormInitializeRequest request = new CreateCheckoutFormInitializeRequest();
        request.setLocale(Locale.TR.getValue());
        request.setConversationId(UUID.randomUUID().toString());
        request.setPrice(totalPrice);
        request.setPaidPrice(totalPrice);
        request.setCurrency(Currency.TRY.name());
        request.setBasketId(user.getId().toString());
        request.setPaymentGroup(PaymentGroup.PRODUCT.name());
        request.setCallbackUrl(callbackUrl);

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
        buyer.setIdentityNumber("11111111111");
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

        // Fatura Adresi
        Address billingAddress = new Address();
        billingAddress.setContactName(dto.getFirstName() + " " + dto.getLastName());
        billingAddress.setCity(dto.getCity());
        billingAddress.setCountry("Turkey");
        billingAddress.setAddress(dto.getFullAddress());
        billingAddress.setZipCode("34732");
        request.setBillingAddress(billingAddress);

        // Sepet İçeriği
        List<BasketItem> basketItemsList = new ArrayList<>();
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            BasketItem basketItem = new BasketItem();
            basketItem.setId(product.getId().toString());
            basketItem.setName(product.getName());
            basketItem.setCategory1(product.getCategory() != null ? product.getCategory().getName() : "Genel");
            basketItem.setCategory2("E-Ticaret");
            basketItem.setItemType(BasketItemType.PHYSICAL.name());
            basketItem.setPrice(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            basketItemsList.add(basketItem);
        }
        request.setBasketItems(basketItemsList);

        CheckoutFormInitialize checkoutFormInitialize = CheckoutFormInitialize.create(request, iyzicoOptions);

        if ("failure".equals(checkoutFormInitialize.getStatus())) {
            throw new RuntimeException("Iyzico Hatası: " + checkoutFormInitialize.getErrorMessage());
        }

        return new PaymentInitResult(checkoutFormInitialize.getCheckoutFormContent(), checkoutFormInitialize.getToken());
    }
}
