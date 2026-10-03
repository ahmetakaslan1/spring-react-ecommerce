package com.example.lesson10.repository;

import com.example.lesson10.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    java.util.Optional<User> findByEmail(String email);
    java.util.Optional<User> findByVerificationToken(String token);
}

