package com.artistalley.booth.repository;

import com.artistalley.booth.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
}
