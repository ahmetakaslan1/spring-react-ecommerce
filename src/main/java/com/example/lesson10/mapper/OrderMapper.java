package com.example.lesson10.mapper;

import com.example.lesson10.dto.OrderResponseDTO;
import com.example.lesson10.dto.OrderItemDTO;
import com.example.lesson10.model.Order;
import com.example.lesson10.model.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(target = "userName", expression = "java(entity.getUser().getFirstName() != null || entity.getUser().getLastName() != null ? (entity.getUser().getFirstName() != null ? entity.getUser().getFirstName() : \"\") + \" \" + (entity.getUser().getLastName() != null ? entity.getUser().getLastName() : \"\") : null)")
    @Mapping(source = "user.email", target = "userEmail")
    OrderResponseDTO toResponseDTO(Order entity);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "product.imageUrl", target = "productImageUrl")
    @Mapping(target = "totalPrice", expression = "java(item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))")
    OrderItemDTO toItemDTO(OrderItem item);
}
