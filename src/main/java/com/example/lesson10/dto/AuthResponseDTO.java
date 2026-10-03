package com.example.lesson10.dto;

public class AuthResponseDTO {
    private String token;
    private boolean isAdmin;

    public AuthResponseDTO(String token, boolean isAdmin) {
        this.token = token;
        this.isAdmin = isAdmin;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public boolean isAdmin() { return isAdmin; }
    public void setAdmin(boolean admin) { isAdmin = admin; }
}

