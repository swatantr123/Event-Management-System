package com.sportsems.controller;

import com.sportsems.dto.ComplaintRequestDTO;
import com.sportsems.dto.ComplaintStatusUpdateDTO;
import com.sportsems.service.ComplaintService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    // POST /api/complaints — raise a new complaint (USER or ORGANIZER).
    @PostMapping
    public ResponseEntity<?> raiseComplaint(@RequestBody ComplaintRequestDTO request, Authentication auth) {
        try {
            return new ResponseEntity<>(
                    complaintService.raiseComplaint(auth.getName(), request), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/complaints/my — complaints raised by the logged-in user/organizer.
    @GetMapping("/my")
    public ResponseEntity<?> getMyComplaints(Authentication auth) {
        return ResponseEntity.ok(complaintService.getMyComplaints(auth.getName()));
    }

    // GET /api/complaints/for-organizer — complaints raised by users about
    // the logged-in organizer's own events.
    @GetMapping("/for-organizer")
    public ResponseEntity<?> getComplaintsForOrganizer(Authentication auth) {
        return ResponseEntity.ok(complaintService.getComplaintsForOrganizer(auth.getName()));
    }

    // GET /api/complaints — ADMIN only: every complaint in the system.
    @GetMapping
    public ResponseEntity<?> getAllComplaints(Authentication auth) {
        if (!isAdmin(auth))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only"));
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    // PATCH /api/complaints/{id}/status — ADMIN only: change status / reply.
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @RequestBody ComplaintStatusUpdateDTO body,
                                           Authentication auth) {
        if (!isAdmin(auth))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only"));
        try {
            return ResponseEntity.ok(
                    complaintService.updateStatus(id, body.getStatus(), body.getAdminReply()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
