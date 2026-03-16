package com.artistalley.booth.controller;

import com.artistalley.booth.model.Sale;
import com.artistalley.booth.repository.EventRepository;
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
    private final EventRepository eventRepo;

    public SaleController(SaleRepository saleRepo, ProductRepository productRepo, EventRepository eventRepo) {
        this.saleRepo = saleRepo;
        this.productRepo = productRepo;
        this.eventRepo = eventRepo;
    }

    @GetMapping
    public List<Sale> getAll(@RequestParam(required = false) Long eventId) {
        if (eventId != null) return saleRepo.findByEventId(eventId);
        return saleRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> recordSale(@RequestBody Map<String, Object> body) {
        Long productId = Long.valueOf(body.get("productId").toString());
        int quantity = Integer.parseInt(body.get("quantity").toString());
        Long eventId = body.get("eventId") != null ? Long.valueOf(body.get("eventId").toString()) : null;

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

            if (eventId != null) {
                eventRepo.findById(eventId).ifPresent(sale::setEvent);
            }

            return ResponseEntity.ok(saleRepo.save(sale));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/summary")
    public Map<String, Object> summary(@RequestParam(required = false) Long eventId) {
        if (eventId != null) {
            return Map.of(
                "totalRevenue", saleRepo.sumTotalRevenueByEvent(eventId),
                "totalItemsSold", saleRepo.sumTotalItemsSoldByEvent(eventId),
                "totalTransactions", saleRepo.countByEventId(eventId)
            );
        }
        return Map.of(
            "totalRevenue", saleRepo.sumTotalRevenue(),
            "totalItemsSold", saleRepo.sumTotalItemsSold(),
            "totalTransactions", saleRepo.count()
        );
    }
}
