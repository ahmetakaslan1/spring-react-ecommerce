package com.example.lesson10.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
public class FileUploadController {

    private final String UPLOAD_DIR = "uploads/";

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Dosya seçilmedi!");
        }

        try {
            // Klasör yoksa oluştur
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Dosya ismini benzersiz yap (Örn: 550e8400...jpg)
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !originalFilename.contains(".")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Geçersiz dosya formatı!");
            }
            
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
                 return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Sadece JPG, PNG veya WEBP resimleri yüklenebilir!");
            }

            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + extension;

            // Dosyayı kaydet
            Path path = Paths.get(UPLOAD_DIR + newFilename);
            Files.write(path, file.getBytes());

            // Frontend'in ulaşabileceği URL'i döndür (Örn: /uploads/abc.jpg)
            String fileUrl = "/uploads/" + newFilename;
            return ResponseEntity.ok(fileUrl);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Dosya yüklenemedi: " + e.getMessage());
        }
    }
}
