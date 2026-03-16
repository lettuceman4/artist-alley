package com.artistalley.booth.repository;

import com.artistalley.booth.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByEventId(Long eventId);

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s WHERE s.event.id = :eventId")
    BigDecimal sumTotalRevenueByEvent(@Param("eventId") Long eventId);

    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM Sale s")
    Long sumTotalItemsSold();

    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM Sale s WHERE s.event.id = :eventId")
    Long sumTotalItemsSoldByEvent(@Param("eventId") Long eventId);

    long countByEventId(Long eventId);
}
