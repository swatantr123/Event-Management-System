package com.sportsems.controller;

import com.sportsems.dto.EventRequestDTO;
import com.sportsems.dto.EventResponseDTO;
import com.sportsems.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // POST /api/events — create (organizer/admin)
    @PostMapping
    public ResponseEntity<EventResponseDTO> createEvent(
            @Valid @RequestBody EventRequestDTO dto,
            Authentication auth) {
        String email = auth.getName();
        return new ResponseEntity<>(eventService.createEvent(dto, email), HttpStatus.CREATED);
    }

    // GET /api/events — public: all events
    @GetMapping
    public ResponseEntity<List<EventResponseDTO>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    // GET /api/events/my — organizer's own events only (Feature 2)
    @GetMapping("/my")
    public ResponseEntity<List<EventResponseDTO>> getMyEvents(Authentication auth) {
        return ResponseEntity.ok(eventService.getMyEvents(auth.getName()));
    }

    // GET /api/events/{id}
    @GetMapping("/{id}")
    public ResponseEntity<EventResponseDTO> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    // PUT /api/events/{id} — owner or admin
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequestDTO dto,
            Authentication auth) {
        try {
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            return ResponseEntity.ok(eventService.updateEvent(id, dto, auth.getName(), isAdmin));
        } catch (RuntimeException e) {
            if (e.getMessage().startsWith("FORBIDDEN"))
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only edit your own events"));
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/events/{id} — owner or admin
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, Authentication auth) {
        try {
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            eventService.deleteEvent(id, auth.getName(), isAdmin);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().startsWith("FORBIDDEN"))
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only delete your own events"));
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
