package com.sportsems.service;

import com.sportsems.dto.UserResponseDTO;
import com.sportsems.entity.Booking;
import com.sportsems.entity.Event;
import com.sportsems.entity.User;
import com.sportsems.repository.BookingRepository;
import com.sportsems.repository.EventRepository;
import com.sportsems.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepo;
    private final EventRepository eventRepo;
    private final BookingRepository bookingRepo;
    private final EmailService emailService;

    public AdminService(UserRepository userRepo, EventRepository eventRepo,
                        BookingRepository bookingRepo, EmailService emailService) {
        this.userRepo     = userRepo;
        this.eventRepo    = eventRepo;
        this.bookingRepo  = bookingRepo;
        this.emailService = emailService;
    }

    public List<UserResponseDTO> getAllUsers() {
        return userRepo.findAll().stream().map(this::mapUser).collect(Collectors.toList());
    }

    // Feature 3: get only pending users for approval
    public List<UserResponseDTO> getPendingUsers() {
        return userRepo.findAll().stream()
                .filter(u -> u.getStatus() == User.Status.PENDING_APPROVAL)
                .map(this::mapUser)
                .collect(Collectors.toList());
    }

    // Feature 3: Admin approves a pending user
    @Transactional
    public UserResponseDTO approveUser(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
        if (user.getStatus() != User.Status.PENDING_APPROVAL)
            throw new RuntimeException("USER_NOT_PENDING");
        // Feature: if the organizer/admin uploaded a verification document,
        // the admin must have opened it at least once before approving.
        if (user.getDocumentPath() != null && user.getDocumentViewedAt() == null)
            throw new RuntimeException("Please view the verification document before approving this user.");
        user.setStatus(User.Status.ACTIVE);
        userRepo.save(user);
        // Feature 1: email notification
        emailService.sendAccountApprovedEmail(user.getEmail(), user.getFullName());
        return mapUser(user);
    }

    // Feature 3: Admin rejects a pending user
    @Transactional
    public void rejectUser(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
        userRepo.delete(user);
    }

    @Transactional
    public UserResponseDTO updateUserStatus(Long userId, String status) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
        user.setStatus(User.Status.valueOf(status.toUpperCase()));
        if (user.getStatus() == User.Status.ACTIVE) {
            user.setFailedAttempts(0);
            user.setLockTime(null);
        } else if (user.getStatus() == User.Status.LOCKED) {
            // Feature 1: notify user of deactivation
            emailService.sendAccountDeactivatedEmail(user.getEmail(), user.getFullName());
        }
        return mapUser(userRepo.save(user));
    }

    @Transactional
    public UserResponseDTO updateUserRole(Long userId, String role) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
        user.setRole(User.Role.valueOf(role.toUpperCase()));
        userRepo.save(user);
        // Feature 1: notify user of role change
        emailService.sendRoleChangedEmail(user.getEmail(), user.getFullName(), role);
        return mapUser(user);
    }

    // Feature 5: user deletion has been removed — accounts can only be
    // deactivated (LOCKED) or rejected while still PENDING_APPROVAL.

    // Feature 6: admin downloads the PDF a organizer/admin uploaded at
    // registration, to validate it before approving the account.
    public DocumentFile getUserDocument(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
        if (user.getDocumentPath() == null)
            throw new RuntimeException("DOCUMENT_NOT_FOUND");
        try {
            byte[] bytes = java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(user.getDocumentPath()));
            String name = user.getDocumentOriginalName() != null ? user.getDocumentOriginalName() : "document.pdf";
            // Feature: record that an admin has opened this document, which
            // unlocks approval for this account.
            if (user.getDocumentViewedAt() == null) {
                user.setDocumentViewedAt(java.time.LocalDateTime.now());
                userRepo.save(user);
            }
            return new DocumentFile(bytes, name);
        } catch (java.io.IOException e) {
            throw new RuntimeException("DOCUMENT_NOT_FOUND");
        }
    }

    public static class DocumentFile {
        public final byte[] bytes;
        public final String filename;
        public DocumentFile(byte[] bytes, String filename) {
            this.bytes = bytes;
            this.filename = filename;
        }
    }

    public Map<String, Object> generateReport() {
        Map<String, Object> report = new LinkedHashMap<>();
        List<Event> events = eventRepo.findAll();
        List<User> users = userRepo.findAll();
        List<Booking> bookings = bookingRepo.findAll();

        report.put("totalEvents", events.size());
        report.put("eventsByStatus", events.stream()
                .collect(Collectors.groupingBy(e -> e.getStatus().name(), Collectors.counting())));
        report.put("totalUsers", users.size());
        report.put("usersByRole", users.stream()
                .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting())));
        report.put("usersByStatus", users.stream()
                .collect(Collectors.groupingBy(u -> u.getStatus().name(), Collectors.counting())));
        report.put("pendingApprovals", users.stream()
                .filter(u -> u.getStatus() == User.Status.PENDING_APPROVAL).count());
        report.put("totalBookings", bookings.size());
        report.put("confirmedBookings", bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED).count());
        report.put("cancelledBookings", bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CANCELLED).count());

        report.put("eventDetails", events.stream().map(e -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("eventId", e.getEventId());
            d.put("eventName", e.getEventName());
            d.put("createdBy", e.getCreatedBy());
            d.put("venue", e.getVenue());
            d.put("eventDate", e.getEventDate() != null ? e.getEventDate().toString() : "");
            d.put("status", e.getStatus().name());
            d.put("maxParticipants", e.getMaxParticipants());
            d.put("availableSeats", e.getAvailableSeats());
            long booked = (e.getMaxParticipants() != null && e.getAvailableSeats() != null)
                    ? (e.getMaxParticipants() - e.getAvailableSeats()) : 0;
            d.put("bookedSeats", booked);
            d.put("registrationFee", e.getRegistrationFee());
            return d;
        }).collect(Collectors.toList()));

        // Feature: venue-wise breakdown — per venue, how many events, how many
        // distinct organizers run events there, and how many users booked each event.
        Map<Long, Long> confirmedCountByEvent = bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED)
                .collect(Collectors.groupingBy(b -> b.getEvent().getEventId(), Collectors.counting()));

        Map<String, List<Event>> eventsByVenue = events.stream()
                .collect(Collectors.groupingBy(Event::getVenue, LinkedHashMap::new, Collectors.toList()));

        List<Map<String, Object>> venueDetails = eventsByVenue.entrySet().stream().map(entry -> {
            String venue = entry.getKey();
            List<Event> venueEvents = entry.getValue();

            long organizerCount = venueEvents.stream()
                    .map(Event::getCreatedBy)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();

            List<Map<String, Object>> venueEventList = venueEvents.stream().map(e -> {
                Map<String, Object> ed = new LinkedHashMap<>();
                ed.put("eventId", e.getEventId());
                ed.put("eventName", e.getEventName());
                ed.put("category", e.getCategory());
                ed.put("createdBy", e.getCreatedBy());
                ed.put("eventDate", e.getEventDate() != null ? e.getEventDate().toString() : "");
                ed.put("status", e.getStatus().name());
                ed.put("userCount", confirmedCountByEvent.getOrDefault(e.getEventId(), 0L));
                return ed;
            }).collect(Collectors.toList());

            long totalUsers = venueEventList.stream().mapToLong(m -> (Long) m.get("userCount")).sum();

            Map<String, Object> vd = new LinkedHashMap<>();
            vd.put("venue", venue);
            vd.put("eventCount", venueEvents.size());
            vd.put("organizerCount", organizerCount);
            vd.put("totalUsers", totalUsers);
            vd.put("events", venueEventList);
            return vd;
        })
        .sorted((a, b) -> ((String) a.get("venue")).compareToIgnoreCase((String) b.get("venue")))
        .collect(Collectors.toList());

        report.put("venueDetails", venueDetails);
        return report;
    }

    private UserResponseDTO mapUser(User u) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(u.getId());
        dto.setFullName(u.getFullName());
        dto.setEmail(u.getEmail());
        dto.setMobileNumber(u.getMobileNumber());
        dto.setRole(u.getRole());
        dto.setStatus(u.getStatus());
        dto.setFailedAttempts(u.getFailedAttempts());
        dto.setLastLogin(u.getLastLogin());
        dto.setCreatedAt(u.getCreatedAt());
        dto.setHasDocument(u.getDocumentPath() != null);
        dto.setDocumentOriginalName(u.getDocumentOriginalName());
        dto.setDocumentViewed(u.getDocumentViewedAt() != null);
        return dto;
    }
}
