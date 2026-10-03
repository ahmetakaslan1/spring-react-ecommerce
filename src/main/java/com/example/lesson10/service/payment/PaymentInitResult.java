package com.example.lesson10.service.payment;

public class PaymentInitResult {
    private String checkoutContent;
    private String transactionId;

    public PaymentInitResult(String checkoutContent, String transactionId) {
        this.checkoutContent = checkoutContent;
        this.transactionId = transactionId;
    }

    public String getCheckoutContent() {
        return checkoutContent;
    }

    public String getTransactionId() {
        return transactionId;
    }
}
