package com.example.lesson10.service.payment;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PaymentStrategyFactory {

    private final Map<String, PaymentStrategy> strategies;

    public PaymentStrategyFactory(Map<String, PaymentStrategy> strategies) {
        this.strategies = strategies;
    }

    public PaymentStrategy getStrategy(String providerName) {
        PaymentStrategy strategy = strategies.get(providerName);
        if (strategy == null) {
            throw new IllegalArgumentException("Desteklenmeyen ödeme yöntemi: " + providerName);
        }
        return strategy;
    }
}
