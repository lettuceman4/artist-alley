package com.artistalley.booth.repository;

import com.artistalley.booth.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL AND p.category <> '' ORDER BY p.category")
    List<String> findDistinctCategories();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.productCode LIKE :prefix%")
    long countByProductCodePrefix(@org.springframework.data.repository.query.Param("prefix") String prefix);
}
