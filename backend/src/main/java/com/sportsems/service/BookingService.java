package com.sportsems.service;

import com.sportsems.dto.BookingResponseDTO;
import com.sportsems.entity.Booking;
import com.sportsems.entity.Event;
import com.sportsems.repository.BookingRepository;
import com.sportsems.repository.EventRepository;
import com.sportsems.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingService {

    private final BookingRepository bookingRepo;
    private final EventRepository   eventRepo;
    private final UserRepository    userRepo;
    private final EmailService      emailService;

    public BookingService(BookingRepository bookingRepo, EventRepository eventRepo,
                          UserRepository userRepo, EmailService emailService) {
        this.bookingRepo  = bookingRepo;
        this.eventRepo    = eventRepo;
        this.userRepo     = userRepo;
        this.emailService = emailService;
    }

    public BookingResponseDTO bookSeat(Long eventId, String userEmail) {
        return bookSeat(eventId, userEmail, 1);
    }

    // Feature: multiple tickets per booking. numberOfTickets is the number of
    // seats the user wants for this event; the total price is
    // registrationFee * numberOfTickets.
    public BookingResponseDTO bookSeat(Long eventId, String userEmail, Integer numberOfTicketsRequested) {
        int numberOfTickets = (numberOfTicketsRequested == null || numberOfTicketsRequested < 1)
                ? 1 : numberOfTicketsRequested;

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new RuntimeException("EVENT_NOT_FOUND"));

        if (event.getStatus() != Event.EventStatus.OPEN)
            throw new RuntimeException("EVENT_NOT_OPEN");

        bookingRepo.findByEvent_EventIdAndUserEmail(eventId, userEmail)
                .ifPresent(b -> {
                    if (b.getStatus() == Booking.BookingStatus.CONFIRMED)
                        throw new RuntimeException("ALREADY_BOOKED");
                });

        if (event.getAvailableSeats() != null && event.getAvailableSeats() <= 0)
            throw new RuntimeException("NO_SEATS_AVAILABLE");

        if (event.getAvailableSeats() != null && numberOfTickets > event.getAvailableSeats())
            throw new RuntimeException("NOT_ENOUGH_SEATS");

        if (event.getAvailableSeats() != null) {
            event.setAvailableSeats(event.getAvailableSeats() - numberOfTickets);
            eventRepo.save(event);
        }

        java.math.BigDecimal fee = event.getRegistrationFee() != null
                ? event.getRegistrationFee() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalAmount = fee.multiply(java.math.BigDecimal.valueOf(numberOfTickets));

        Booking booking = bookingRepo
                .findByEvent_EventIdAndUserEmail(eventId, userEmail)
                .orElse(new Booking());
        booking.setEvent(event);
        booking.setUserEmail(userEmail);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setCancelledAt(null);
        booking.setNumberOfTickets(numberOfTickets);
        booking.setTotalAmount(totalAmount);
        if (booking.getBookedAt() == null) booking.setBookedAt(LocalDateTime.now());

        Booking saved = bookingRepo.save(booking);

        // Feature 1: send confirmation email
        String userName = userRepo.findByEmail(userEmail)
                .map(u -> u.getFullName()).orElse(userEmail);

        // Feature 4: include the organizer's contact details in the email
        // so the attendee has someone to reach out to about the event.
        var organizer = event.getCreatedBy() != null
                ? userRepo.findByEmail(event.getCreatedBy()).orElse(null) : null;

        emailService.sendBookingConfirmationEmail(
                userEmail, userName, event.getEventName(), event.getVenue(),
                event.getEventDate() != null ? event.getEventDate().toString() : "TBA",
                saved.getId(),
                organizer != null ? organizer.getFullName()     : null,
                organizer != null ? organizer.getEmail()        : event.getCreatedBy(),
                organizer != null ? organizer.getMobileNumber() : null,
                numberOfTickets, totalAmount
        );

        return mapToDTO(saved);
    }

    public BookingResponseDTO cancelBooking(Long eventId, String userEmail) {
        Booking booking = bookingRepo
                .findByEvent_EventIdAndUserEmail(eventId, userEmail)
                .orElseThrow(() -> new RuntimeException("BOOKING_NOT_FOUND"));

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED)
            throw new RuntimeException("ALREADY_CANCELLED");

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());

        Event event = booking.getEvent();
        int ticketsToRelease = booking.getNumberOfTickets() != null ? booking.getNumberOfTickets() : 1;
        if (event.getAvailableSeats() != null && event.getMaxParticipants() != null) {
            event.setAvailableSeats(Math.min(event.getAvailableSeats() + ticketsToRelease, event.getMaxParticipants()));
            eventRepo.save(event);
        }

        Booking saved = bookingRepo.save(booking);

        // Feature 1: send cancellation email
        String userName = userRepo.findByEmail(userEmail)
                .map(u -> u.getFullName()).orElse(userEmail);
        emailService.sendBookingCancellationEmail(
                userEmail, userName, event.getEventName(), saved.getId()
        );

        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(String userEmail) {
        return bookingRepo.findByUserEmail(userEmail)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // Feature 3: organizer dashboard — list of registrants for one of THEIR
    // events. Only the event's owner (or an admin) may view this.
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getBookingsForEventAsOwner(Long eventId, String requesterEmail, boolean isAdmin) {
        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new RuntimeException("EVENT_NOT_FOUND"));
        if (!isAdmin && !requesterEmail.equals(event.getCreatedBy())) {
            throw new RuntimeException("FORBIDDEN: You can only view registrations for your own events");
        }
        return bookingRepo.findByEvent_EventId(eventId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private BookingResponseDTO mapToDTO(Booking b) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setBookingId(b.getId());
        dto.setEventId(b.getEvent().getEventId());
        dto.setEventName(b.getEvent().getEventName());
        dto.setVenue(b.getEvent().getVenue());
        dto.setEventDate(b.getEvent().getEventDate() != null
                ? b.getEvent().getEventDate().toString() : null);
        dto.setUserEmail(b.getUserEmail());
        dto.setUserName(userRepo.findByEmail(b.getUserEmail())
                .map(u -> u.getFullName()).orElse(b.getUserEmail()));

        // Feature 4: attach the event organizer's contact details to every
        // booking so the frontend can show/download them alongside the booking.
        String organizerEmail = b.getEvent().getCreatedBy();
        userRepo.findByEmail(organizerEmail).ifPresentOrElse(organizer -> {
            dto.setOrganizerName(organizer.getFullName());
            dto.setOrganizerEmail(organizer.getEmail());
            dto.setOrganizerPhone(organizer.getMobileNumber());
        }, () -> dto.setOrganizerEmail(organizerEmail));

        dto.setNumberOfTickets(b.getNumberOfTickets() != null ? b.getNumberOfTickets() : 1);
        dto.setRegistrationFee(b.getEvent().getRegistrationFee());
        dto.setTotalAmount(b.getTotalAmount() != null ? b.getTotalAmount()
                : (b.getEvent().getRegistrationFee() != null
                        ? b.getEvent().getRegistrationFee().multiply(
                                java.math.BigDecimal.valueOf(b.getNumberOfTickets() != null ? b.getNumberOfTickets() : 1))
                        : null));
        dto.setStatus(b.getStatus());
        dto.setBookedAt(b.getBookedAt());
        dto.setCancelledAt(b.getCancelledAt());
        return dto;
    }
}
