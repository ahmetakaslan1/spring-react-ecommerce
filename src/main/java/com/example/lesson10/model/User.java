package com.example.lesson10.model;

import jakarta.persistence.*;
import java.util.List;

import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.SQLDelete;

@Entity
@Table(name = "users")
@SQLDelete(sql = "UPDATE users SET is_active = false WHERE id = ?")
@SQLRestriction("is_active = true")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    
    // Yeni eklenen profil bilgileri
    private String gender; // "MALE", "FEMALE", "UNKNOWN"
    private java.time.LocalDate birthDate;
    
    // Address & Contact info for checkout pre-fill
    private String phone;
    private String city;
    private String district;
    private String address;
    
    // Email Verification
    @Column(columnDefinition = "boolean default false")
    private boolean emailVerified = false;
    private String verificationToken;
    
    /*
     * DİKKAT (SİSTEM ÇÖKME TEHLİKESİ!):
     * Bu 'isActive' alanını (Soft Delete için) projeye sonradan ekledik.
     * Eğer veritabanında daha önceden kayıtlı eski kullanıcılar varsa, PostgreSQL bu yeni kolon için onlara
     * otomatik olarak 'NULL' değeri atar. 
     * Java'daki ilkel (primitive) 'boolean' veri tipi NULL olamayacağı için, Hibernate eski verileri 
     * okurken sistemi çökertebilir veya mecburen 'false' kabul eder. Bu durumda eski müşterilerin 
     * hepsi bir anda "Pasif" duruma düşer ve kimse sisteme giremez! (Eğer eski veri olsaydı şu an patlamıştık).
     * 
     * ÇÖZÜM:
     * Bunun Java/Hibernate seviyesindeki çözümü altına `@Column(nullable = false, columnDefinition = "boolean default true")` 
     * yazmaktır. Bir sonraki derste veritabanı versiyonlama (Flyway) konularına geçtiğimizde 
     * bu sorun tamamen, sektör standartlarına uygun şekilde çözülmüş olacaktır.
     */
    // GERÇEK DÜNYA ÇÖZÜMÜ: Veritabanını silmeden, yeni eklenen kolona PostgreSQL seviyesinde otomatik true basılmasını sağlıyoruz.
    @Column(columnDefinition = "boolean default true")
    private boolean isActive = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private List<Role> roles;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public List<Role> getRoles() { return roles; }
    public void setRoles(List<Role> roles) { this.roles = roles; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
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
    
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
}

