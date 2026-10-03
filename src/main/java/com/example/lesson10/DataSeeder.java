package com.example.lesson10;

import com.example.lesson10.model.Product;
import com.example.lesson10.model.Role;
import com.example.lesson10.repository.ProductRepository;
import com.example.lesson10.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

import com.example.lesson10.model.Category;
import com.example.lesson10.repository.CategoryRepository;
import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final com.example.lesson10.repository.CouponRepository couponRepository;

    public DataSeeder(RoleRepository roleRepository, ProductRepository productRepository, CategoryRepository categoryRepository, com.example.lesson10.repository.CouponRepository couponRepository) {
        this.roleRepository = roleRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.couponRepository = couponRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Sistem ilk defa (örneğin yepyeni bir Docker konteynerinde) ayağa kalktığında, 
        // veritabanında hiç rol yoksa temel rolleri otomatik ekliyoruz.
        if (roleRepository.findByRoleName("USER").isEmpty()) {
            Role userRole = new Role();
            userRole.setRoleName("USER");
            roleRepository.save(userRole);
            System.out.println("USER rolü veritabanına otomatik eklendi.");
        }

        if (roleRepository.findByRoleName("ADMIN").isEmpty()) {
            Role adminRole = new Role();
            adminRole.setRoleName("ADMIN");
            roleRepository.save(adminRole);
            System.out.println("ADMIN rolü veritabanına otomatik eklendi.");
        }

        // 2. Kategori Ekleme
        if (categoryRepository.count() == 0) {
            System.out.println("Kategoriler oluşturuluyor...");
            categoryRepository.saveAll(Arrays.asList(
                    createCategory("Elektronik"),
                    createCategory("Giyim"),
                    createCategory("Gıda"),
                    createCategory("Kitap")
            ));
        }

        // Sayfalama Sorununu Gözlemlemek İçin: Veritabanına 500 Adet Ürün Yığıyoruz!
        if (productRepository.count() == 0) {
            List<Category> allCategories = categoryRepository.findAll();
            
            System.out.println("Veritabanına 500 adet ağır test ürünü ekleniyor, lütfen bekleyin...");
            for (int i = 1; i <= 500; i++) {
                Product product = new Product();
                product.setName("Ağır Yük Test Ürünü " + i);
                product.setDescription("Bu ürün sayfalama (Pagination) testleri için özel üretildi. Uzun bir açıklama metni var ki veritabanından çekerken ağırlık yapsın. Model no: " + i);
                product.setPrice(BigDecimal.valueOf(50.0 + i));
                product.setStock(100);
                
                // Ürünlere sırayla kategori atayalım (0,1,2,3,0,1,2,3...)
                if (!allCategories.isEmpty()) {
                    product.setCategory(allCategories.get(i % allCategories.size()));
                }
                
                productRepository.save(product);
            }
            System.out.println("500 Adet ürün başarıyla yüklendi! Sunucuyu terletmeye hazırız.");
        }

        // 4. Kupon Ekleme (Varsayılan Kupon)
        if (couponRepository.count() == 0) {
            com.example.lesson10.model.Coupon defaultCoupon = new com.example.lesson10.model.Coupon();
            defaultCoupon.setCode("HOSGELDIN10");
            defaultCoupon.setDiscountPercentage(BigDecimal.valueOf(10));
            defaultCoupon.setUsageLimit(1000);
            defaultCoupon.setMinimumCartAmount(BigDecimal.valueOf(500));
            couponRepository.save(defaultCoupon);
            System.out.println("Varsayılan indirim kuponu (HOSGELDIN10) oluşturuldu.");
        }
    }
    
    private Category createCategory(String name) {
        Category category = new Category();
        category.setName(name);
        return category;
    }
}

