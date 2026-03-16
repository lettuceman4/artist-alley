package com.artistalley.booth.controller;

import com.artistalley.booth.model.BoothLayout;
import com.artistalley.booth.repository.BoothLayoutRepository;
import com.artistalley.booth.repository.EventRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/booth-layouts")
public class BoothLayoutController {

    private final BoothLayoutRepository repo;
    private final EventRepository eventRepo;

    public BoothLayoutController(BoothLayoutRepository repo, EventRepository eventRepo) {
        this.repo = repo;
        this.eventRepo = eventRepo;
    }

    @GetMapping
    public List<BoothLayout> getAll(@RequestParam(required = false) Long eventId) {
        if (eventId != null) return repo.findByEventIdOrderBySavedAtDesc(eventId);
        return repo.findByEventIsNullOrderBySavedAtDesc();
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String layoutJson = (String) body.get("layoutJson");
        if (name == null || name.isBlank() || layoutJson == null) {
            return ResponseEntity.badRequest().body("name and layoutJson are required");
        }

        BoothLayout layout = new BoothLayout();
        layout.setName(name.trim());
        layout.setLayoutJson(layoutJson);
        layout.setSavedAt(LocalDateTime.now());

        Object eventIdObj = body.get("eventId");
        if (eventIdObj != null) {
            Long eventId = Long.valueOf(eventIdObj.toString());
            eventRepo.findById(eventId).ifPresent(layout::setEvent);
        }

        return ResponseEntity.ok(repo.save(layout));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
