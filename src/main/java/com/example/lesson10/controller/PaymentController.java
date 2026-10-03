package com.example.lesson10.controller;

import com.example.lesson10.security.CustomUserDetails;
import com.example.lesson10.service.CartService;
import com.example.lesson10.service.PaymentService;
import com.iyzipay.Options;
import com.iyzipay.model.CheckoutForm;
import com.iyzipay.request.RetrieveCheckoutFormRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    private final PaymentService paymentService;
    private final CartService cartService;
    private final Options iyzicoOptions;

    public PaymentController(PaymentService paymentService, CartService cartService, Options iyzicoOptions) {
        this.paymentService = paymentService;
        this.cartService = cartService;
        this.iyzicoOptions = iyzicoOptions;
    }

    // 1. Frontend bu endpoint'e gelir (Form doldurup POST atar), dönen HTML'i alır ve modal'a basar
    @PostMapping("/checkout-form")
    public ResponseEntity<String> getCheckoutForm(
            @AuthenticationPrincipal CustomUserDetails currentUser, 
            @RequestBody com.example.lesson10.dto.CheckoutRequestDTO dto) {
        try {
            String formHtml = paymentService.generateCheckoutForm(currentUser.getId(), dto);
            return ResponseEntity.ok(formHtml);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Hata: " + e.getMessage());
        }
    }

    // 2. Iyzico müşteri ödemeyi yapınca bize bu adrese POST atar
    @PostMapping("/callback")
    public ResponseEntity<String> paymentCallback(@RequestParam Map<String, String> payload) {
        // Iyzico bize token gönderir
        String token = payload.get("token");

        // Token'ı Iyzico'ya sorarak ödemenin durumunu öğrenmeliyiz (Güvenlik için)
        RetrieveCheckoutFormRequest request = new RetrieveCheckoutFormRequest();
        request.setToken(token);

        CheckoutForm checkoutForm = CheckoutForm.retrieve(request, iyzicoOptions);

        if ("success".equalsIgnoreCase(checkoutForm.getPaymentStatus())) {
            try {
                Long userId = Long.valueOf(checkoutForm.getBasketId()); 
                cartService.completePayment(token, userId);
            } catch(Exception e) {
                return ResponseEntity.ok("<html><body><h2>Sipariş tamamlanamadı (Stok yetersiz vb.) " + e.getMessage() + "</h2></body></html>");
            }

            return ResponseEntity.ok("<html><body style='background-color:#1a1a2e; color:white; text-align:center; font-family:sans-serif;'><h2><br/><br/>Ödeme Başarılı! 🎉<br/>Siparişiniz Alındı. Yönlendiriliyorsunuz...</h2><script>setTimeout(()=> { if(window.parent !== window) { window.parent.postMessage('PAYMENT_SUCCESS', '*'); } else { window.location.href = 'http://localhost:3000?payment=success'; } }, 3000);</script></body></html>");
        } else {
            // Hata mesajını frontend'e de gönderelim ki pencereyi kapatıp hata göstersin
            return ResponseEntity.ok("<html><body style='background-color:#1a1a2e; color:white; text-align:center; font-family:sans-serif;'><h2><br/><br/>Ödeme Başarısız!</h2><p>Lütfen tekrar deneyiniz. Yönlendiriliyorsunuz...</p><script>setTimeout(()=> { if(window.parent !== window) { window.parent.postMessage('PAYMENT_FAILED', '*'); } else { window.location.href = 'http://localhost:3000?payment=failed'; } }, 3000);</script></body></html>");
        }
    }
}
