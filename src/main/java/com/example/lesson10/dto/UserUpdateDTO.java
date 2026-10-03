package com.example.lesson10.dto;

import jakarta.validation.constraints.Size;

public class UserUpdateDTO {

    // Kullanıcı adını (Name) boş bırakırsa güncellenmeyecek anlamına gelsin diye NotBlank koymuyoruz
    private String firstName;
    private String lastName;

    // Şifre girilmezse güncellenmez, girilirse en az 6 karakter olmalı
    private String password;

    private String gender;
    private java.time.LocalDate birthDate;
    
    private String phone;
    private String city;
    private String district;
    private String address;

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    public java.time.LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(java.time.LocalDate birthDate) { this.birthDate = birthDate; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
