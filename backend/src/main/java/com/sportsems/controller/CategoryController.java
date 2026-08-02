package com.sportsems.controller;

import com.sportsems.dto.EventCategoryDTO;
import com.sportsems.dto.EventCategoryRequestDTO;
import com.sportsems.service.EventCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final EventCategoryService categoryService;

    public CategoryController(EventCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // GET /api/categories — everyone (guests, users, organizers, admins) can
    // see the menu of event types (e.g. Sports, Cultural Fest, Comedy, ...).
    @GetMapping
    public ResponseEntity<List<EventCategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    // POST /api/categories — organizer/admin only. Lets an organizer add a
    // brand-new event type while creating an event; plain users never see
    // or reach this endpoint (no "add category" control renders for them,
    // and the role check below blocks it server-side regardless).
    @PostMapping
    public ResponseEntity<?> createCategory(
            @Valid @RequestBody EventCategoryRequestDTO dto,
            Authentication auth) {
        boolean allowed = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ORGANIZER") || a.getAuthority().equals("ROLE_ADMIN"));
        if (!allowed) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only organizers or admins can add new event categories"));
        }
        try {
            EventCategoryDTO created = categoryService.createCategory(dto.getName(), auth.getName());
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
