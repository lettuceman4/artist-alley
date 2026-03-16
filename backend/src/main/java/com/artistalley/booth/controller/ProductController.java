package com.artistalley.booth.controller;

import com.artistalley.booth.model.Product;
import com.artistalley.booth.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository repo;

    public ProductController(ProductRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Product> getAll() {
        return repo.findAll();
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return repo.findDistinctCategories();
    }

    @PostMapping
    public Product create(@Valid @RequestBody Product product) {
        String prefix = product.getProductCode();
        if (prefix != null && !prefix.isBlank()) {
            prefix = prefix.trim().toUpperCase();
            long count = repo.countByProductCodePrefix(prefix);
            product.setProductCode(prefix + (count + 1));
        }
        return repo.save(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @Valid @RequestBody Product updated) {
        return repo.findById(id).map(p -> {
            p.setName(updated.getName());
            p.setCategory(updated.getCategory());
            p.setStock(updated.getStock());
            p.setPrice(updated.getPrice());
            p.setImageUrl(updated.getImageUrl());
            p.setSupplier(updated.getSupplier());
            p.setPrintingCost(updated.getPrintingCost());
            return ResponseEntity.ok(repo.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
