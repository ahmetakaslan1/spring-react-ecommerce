package com.example.lesson10.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender emailSender;

    public EmailService(JavaMailSender emailSender) {
        this.emailSender = emailSender;
    }

    public void sendSimpleMessage(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage(); 
        message.setFrom("noreply@ecommerce.com"); // SMTP ayarlarına göre ezilebilir
        message.setTo(to); 
        message.setSubject(subject); 
        message.setText(text);
        
        // Gerçek uygulamada try-catch ile hataları loglamak önemlidir
        try {
            emailSender.send(message);
        } catch (Exception e) {
            System.err.println("E-posta gönderilirken hata oluştu: " + e.getMessage());
            // Loglama mekanizması (Slf4j vb.) kullanılmalı
        }
    }
}
