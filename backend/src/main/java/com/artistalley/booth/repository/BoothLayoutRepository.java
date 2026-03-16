package com.artistalley.booth.repository;

import com.artistalley.booth.model.BoothLayout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoothLayoutRepository extends JpaRepository<BoothLayout, Long> {
    List<BoothLayout> findByEventIdOrderBySavedAtDesc(Long eventId);
    List<BoothLayout> findByEventIsNullOrderBySavedAtDesc();
}
