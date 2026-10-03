package com.example.lesson10.mapper;

import com.example.lesson10.dto.UserCreateDTO;
import com.example.lesson10.dto.UserResponseDTO;
import com.example.lesson10.model.User;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toEntity(UserCreateDTO dto);
    UserResponseDTO toResponseDTO(User entity);

    @AfterMapping
    default void setAdminFlag(User user, @MappingTarget UserResponseDTO dto) {
        if (user.getRoles() != null) {
            boolean isAdmin = user.getRoles().stream()
                    .anyMatch(role -> role.getRoleName().equals("ADMIN"));
            dto.setAdmin(isAdmin);
        }
    }
}

