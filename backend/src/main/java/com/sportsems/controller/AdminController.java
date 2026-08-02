package com.sportsems.controller;

import com.sportsems.dto.UserResponseDTO;
import com.sportsems.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    // Feature 3: get pending approval requests
    @GetMapping("/users/pending")
    public ResponseEntity<List<UserResponseDTO>> getPendingUsers() {
        return ResponseEntity.ok(adminService.getPendingUsers());
    }

    // Feature 3: approve a pending user
    @PatchMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminService.approveUser(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Feature 3: reject a pending user
    @DeleteMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long id) {
        try {
            adminService.rejectUser(id);
            return ResponseEntity.ok(Map.of("message", "User rejected and removed"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(adminService.updateUserStatus(id, body.get("status")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(adminService.updateUserRole(id, body.get("role")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Feature 5: user deletion removed. Admins can only deactivate (status
    // endpoint above) — no endpoint exists to permanently delete a user.

    // Feature 6: admin downloads the verification PDF a organizer/admin
    // uploaded at registration, to validate it before approving.
    @GetMapping("/users/{id}/document")
    public ResponseEntity<?> getUserDocument(@PathVariable Long id) {
        try {
            AdminService.DocumentFile doc = adminService.getUserDocument(id);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "inline; filename=\"" + doc.filename + "\"")
                    .body(doc.bytes);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReport() {
        return ResponseEntity.ok(adminService.generateReport());
    }
}
