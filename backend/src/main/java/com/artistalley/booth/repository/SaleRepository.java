package com.artistalley.booth.repository;

import com.artistalley.booth.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM Sale s")
    Long sumTotalItemsSold();
}
