package com.artistalley.booth.controller;

import com.artistalley.booth.model.Event;
import com.artistalley.booth.repository.EventRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository repo;

    public EventController(EventRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Event> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Event create(@Valid @RequestBody Event event) {
        return repo.save(event);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> update(@PathVariable Long id, @Valid @RequestBody Event updated) {
        return repo.findById(id).map(e -> {
            e.setName(updated.getName());
            e.setEventDate(updated.getEventDate());
            e.setLocation(updated.getLocation());
            return ResponseEntity.ok(repo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
