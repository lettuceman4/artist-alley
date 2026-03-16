package com.artistalley.booth.controller;

import com.artistalley.booth.model.Product;
import com.artistalley.booth.model.Sale;
import com.artistalley.booth.repository.ProductRepository;
import com.artistalley.booth.repository.SaleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleRepository saleRepo;
    private final ProductRepository productRepo;

    public SaleController(SaleRepository saleRepo, ProductRepository productRepo) {
        this.saleRepo = saleRepo;
        this.productRepo = productRepo;
    }

    @GetMapping
    public List<Sale> getAll() {
        return saleRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> recordSale(@RequestBody Map<String, Object> body) {
        Long productId = Long.valueOf(body.get("productId").toString());
        int quantity = Integer.parseInt(body.get("quantity").toString());

        return productRepo.findById(productId).map(product -> {
            if (product.getStock() < quantity) {
                return ResponseEntity.badRequest().body("Not enough stock");
            }
            product.setStock(product.getStock() - quantity);
            productRepo.save(product);

            Sale sale = new Sale();
            sale.setProduct(product);
            sale.setQuantity(quantity);
            sale.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
            return ResponseEntity.ok(saleRepo.save(sale));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return Map.of(
            "totalRevenue", saleRepo.sumTotalRevenue(),
            "totalItemsSold", saleRepo.sumTotalItemsSold(),
            "totalTransactions", saleRepo.count()
        );
    }
}
