package com.sportsems.controller;

import com.sportsems.dto.BookingRequestDTO;
import com.sportsems.dto.BookingResponseDTO;
import com.sportsems.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // POST /api/bookings/events/{eventId}/book
    // Feature: multiple tickets per booking — body is optional; omitting it
    // (or numberOfTickets) defaults to a single ticket.
    @PostMapping("/events/{eventId}/book")
    public ResponseEntity<?> bookSeat(@PathVariable Long eventId,
                                       @RequestBody(required = false) BookingRequestDTO request,
                                       Authentication auth) {
        try {
            String email = auth.getName();
            Integer numberOfTickets = request != null ? request.getNumberOfTickets() : 1;
            BookingResponseDTO booking = bookingService.bookSeat(eventId, email, numberOfTickets);
            return new ResponseEntity<>(booking, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            String msg = switch (e.getMessage()) {
                case "EVENT_NOT_FOUND"     -> "Event not found.";
                case "EVENT_NOT_OPEN"      -> "This event is not open for registration.";
                case "ALREADY_BOOKED"      -> "You have already registered for this event.";
                case "NO_SEATS_AVAILABLE"  -> "No seats available. This event is full.";
                case "NOT_ENOUGH_SEATS"    -> "Not enough seats available for the number of tickets requested.";
                default -> e.getMessage();
            };
            HttpStatus status = ("NO_SEATS_AVAILABLE".equals(e.getMessage()) || "NOT_ENOUGH_SEATS".equals(e.getMessage()))
                    ? HttpStatus.BAD_REQUEST : HttpStatus.CONFLICT;
            return ResponseEntity.status(status).body(Map.of("error", msg));
        }
    }

    // DELETE /api/bookings/events/{eventId}/cancel
    @DeleteMapping("/events/{eventId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long eventId, Authentication auth) {
        try {
            String email = auth.getName();
            BookingResponseDTO booking = bookingService.cancelBooking(eventId, email);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/bookings/my — current user's bookings
    @GetMapping("/my")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(Authentication auth) {
        return ResponseEntity.ok(bookingService.getMyBookings(auth.getName()));
    }

    // GET /api/bookings/events/{eventId} — registrants for one event.
    // Restricted to that event's organizer (or an admin) — Feature 3.
    @GetMapping("/events/{eventId}")
    public ResponseEntity<?> getEventBookings(@PathVariable Long eventId, Authentication auth) {
        try {
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            return ResponseEntity.ok(
                    bookingService.getBookingsForEventAsOwner(eventId, auth.getName(), isAdmin));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("FORBIDDEN"))
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only view registrations for your own events"));
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
