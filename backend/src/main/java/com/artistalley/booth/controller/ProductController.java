package com.artistalley.booth.controller;

import com.artistalley.booth.model.Product;
import com.artistalley.booth.repository.ProductRepository;
import jakarta.validation.Valid;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
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

    @PostMapping("/bulk")
    public List<Product> createBulk(@RequestBody List<Product> products) {
        return products.stream().map(product -> {
            String prefix = product.getProductCode();
            if (prefix != null && !prefix.isBlank()) {
                prefix = prefix.trim().toUpperCase();
                long count = repo.countByProductCodePrefix(prefix);
                product.setProductCode(prefix + (count + 1));
            }
            return repo.save(product);
        }).toList();
    }

    @PostMapping("/import")
    public ResponseEntity<?> importExcel(@RequestParam("file") MultipartFile file) {
        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {

            Sheet sheet = wb.getSheetAt(0);
            List<Product> saved = new ArrayList<>();
            DataFormatter fmt = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String name = fmt.formatCellValue(row.getCell(0)).trim();
                if (name.isEmpty()) continue;

                Product p = new Product();
                p.setName(name);
                p.setCategory(fmt.formatCellValue(row.getCell(1)).trim());
                p.setSupplier(fmt.formatCellValue(row.getCell(2)).trim());

                String priceStr = fmt.formatCellValue(row.getCell(3)).trim();
                if (!priceStr.isEmpty()) p.setPrice(new BigDecimal(priceStr));

                String stockStr = fmt.formatCellValue(row.getCell(4)).trim();
                if (!stockStr.isEmpty()) p.setStock((int) Double.parseDouble(stockStr));

                String printStr = fmt.formatCellValue(row.getCell(5)).trim();
                if (!printStr.isEmpty()) p.setPrintingCost(new BigDecimal(printStr));

                String prefix = fmt.formatCellValue(row.getCell(6)).trim().toUpperCase();
                if (!prefix.isEmpty()) {
                    long count = repo.countByProductCodePrefix(prefix);
                    p.setProductCode(prefix + (count + 1));
                }

                saved.add(repo.save(p));
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to parse file: " + e.getMessage());
        }
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
