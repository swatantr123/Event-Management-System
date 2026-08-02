package com.sportsems.service;

import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles all outgoing email notifications via Brevo's transactional email
 * HTTP API (https://api.brevo.com). We use an HTTP API rather than SMTP
 * because most free hosting tiers (e.g. Render's free web services) block
 * outbound SMTP ports (25/465/587) to prevent spam abuse — HTTP on port 443
 * is not affected.
 * Set app.email.enabled=false in application.properties to disable.
 * NOTE: @Async is on each public method (not on private sendEmail)
 *       to avoid Spring self-invocation proxy bypass issue.
 */
@Service
public class EmailService {

    private static final String BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.email.from:noreply@sportsems.com}")
    private String fromEmail;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    private void send(String to, String subject, String body) {
        if (!emailEnabled) {
            System.out.println("[EMAIL DISABLED] To: " + to + " | Subject: " + subject);
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);
            headers.set("accept", "application/json");

            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", Map.of("name", "Sports EMS", "email", fromEmail));
            payload.put("to", List.of(Map.of("email", to)));
            payload.put("subject", subject);
            payload.put("textContent", body);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(BREVO_ENDPOINT, request, String.class);
            System.out.println("[EMAIL SENT] To: " + to);
        } catch (Exception e) {
            // Never crash the main flow due to email failure
            System.err.println("[EMAIL ERROR] Failed to send to " + to + ": " + e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(String to, String name) {
        send(to, "Welcome to Sports EMS!",
                "Hi " + name + ",\n\nWelcome to Sports EMS! Your account is ready.\n\n"
                + "Login at: http://localhost:5173/login\n\nSports EMS Team");
    }

    @Async
    public void sendPendingApprovalEmail(String to, String name, String role) {
        send(to, "Account Pending Approval — Sports EMS",
                "Hi " + name + ",\n\nYour " + role + " account is PENDING APPROVAL.\n"
                + "An admin will review your request and notify you by email.\n\nSports EMS Team");
    }

    @Async
    public void sendAccountApprovedEmail(String to, String name) {
        send(to, "Account Approved — Sports EMS",
                "Hi " + name + ",\n\nYour account has been approved!\n"
                + "Login at: http://localhost:5173/login\n\nSports EMS Team");
    }

    @Async
    public void sendAccountDeactivatedEmail(String to, String name) {
        send(to, "Account Deactivated — Sports EMS",
                "Hi " + name + ",\n\nYour account has been deactivated by an administrator.\n"
                + "Contact support if you believe this is a mistake.\n\nSports EMS Team");
    }

    @Async
    public void sendBookingConfirmationEmail(String to, String userName, String eventName,
                                              String venue, String eventDate, Long bookingId) {
        send(to, "Booking Confirmed — " + eventName,
                "Hi " + userName + ",\n\nYour seat is confirmed!\n\n"
                + "Booking ID : #" + bookingId + "\n"
                + "Event      : " + eventName + "\n"
                + "Venue      : " + venue + "\n"
                + "Date       : " + eventDate + "\n\n"
                + "Please arrive 15 minutes early.\n\nSports EMS Team");
    }

    // Feature 4: booking confirmation that also includes the event organizer's
    // contact details, so the attendee knows who to reach out to.
    @Async
    public void sendBookingConfirmationEmail(String to, String userName, String eventName,
                                              String venue, String eventDate, Long bookingId,
                                              String organizerName, String organizerEmail,
                                              String organizerPhone) {
        String organizerBlock =
                "Event Organizer\n"
                + "----------------\n"
                + "Name  : " + (organizerName  != null ? organizerName  : "N/A") + "\n"
                + "Email : " + (organizerEmail != null ? organizerEmail : "N/A") + "\n"
                + "Phone : " + (organizerPhone != null ? organizerPhone : "N/A") + "\n\n";

        send(to, "Booking Confirmed — " + eventName,
                "Hi " + userName + ",\n\nYour seat is confirmed!\n\n"
                + "Booking ID : #" + bookingId + "\n"
                + "Event      : " + eventName + "\n"
                + "Venue      : " + venue + "\n"
                + "Date       : " + eventDate + "\n\n"
                + organizerBlock
                + "For any questions about this event, feel free to contact the organizer above.\n"
                + "Please arrive 15 minutes early.\n\nSports EMS Team");
    }

    // Feature: multiple tickets per booking — confirmation email also states
    // how many tickets were booked and the total amount charged.
    @Async
    public void sendBookingConfirmationEmail(String to, String userName, String eventName,
                                              String venue, String eventDate, Long bookingId,
                                              String organizerName, String organizerEmail,
                                              String organizerPhone, Integer numberOfTickets,
                                              BigDecimal totalAmount) {
        String organizerBlock =
                "Event Organizer\n"
                + "----------------\n"
                + "Name  : " + (organizerName  != null ? organizerName  : "N/A") + "\n"
                + "Email : " + (organizerEmail != null ? organizerEmail : "N/A") + "\n"
                + "Phone : " + (organizerPhone != null ? organizerPhone : "N/A") + "\n\n";

        send(to, "Booking Confirmed — " + eventName,
                "Hi " + userName + ",\n\nYour booking is confirmed!\n\n"
                + "Booking ID       : #" + bookingId + "\n"
                + "Event            : " + eventName + "\n"
                + "Venue            : " + venue + "\n"
                + "Date             : " + eventDate + "\n"
                + "No. of Tickets   : " + (numberOfTickets != null ? numberOfTickets : 1) + "\n"
                + "Total Amount     : ₹" + (totalAmount != null ? totalAmount : BigDecimal.ZERO) + "\n\n"
                + organizerBlock
                + "For any questions about this event, feel free to contact the organizer above.\n"
                + "Please arrive 15 minutes early.\n\nSports EMS Team");
    }

    @Async
    public void sendBookingCancellationEmail(String to, String userName,
                                              String eventName, Long bookingId) {
        send(to, "Booking Cancelled — " + eventName,
                "Hi " + userName + ",\n\nYour booking #" + bookingId
                + " for \"" + eventName + "\" has been cancelled.\n"
                + "The seat has been released.\n\nSports EMS Team");
    }

    @Async
    public void sendOtpEmail(String to, String name, String otp) {
        send(to, "Password Reset OTP — Sports EMS",
                "Hi " + name + ",\n\nYour OTP is: " + otp
                + "\n\nValid for 10 minutes. Do not share this.\n\nSports EMS Team");
    }

    @Async
    public void sendRoleChangedEmail(String to, String name, String newRole) {
        send(to, "Role Updated — Sports EMS",
                "Hi " + name + ",\n\nYour role has been updated to: " + newRole
                + "\nThis takes effect on your next login.\n\nSports EMS Team");
    }

    // Feature: Complaints — notify an admin whenever anyone (user or
    // organizer) raises a new complaint.
    @Async
    public void sendComplaintReceivedEmailToAdmin(String to, String adminName, String subject,
                                                   String message, String raisedByName,
                                                   String raisedByRole, String eventName) {
        send(to, "New Complaint Raised — " + subject,
                "Hi " + (adminName != null ? adminName : "Admin") + ",\n\n"
                + "A new complaint has been raised.\n\n"
                + "From     : " + raisedByName + " (" + raisedByRole + ")\n"
                + (eventName != null ? "Event    : " + eventName + "\n" : "")
                + "Subject  : " + subject + "\n\n"
                + "Message:\n" + message + "\n\n"
                + "Please review it from the Admin > Complaints panel.\n\nSports EMS Team");
    }

    // Feature: Complaints — notify the event's organizer when a USER
    // complains about their event (organizer-raised complaints only go to admin).
    @Async
    public void sendComplaintNotificationToOrganizer(String to, String organizerName, String subject,
                                                       String message, String raisedByName, String eventName) {
        send(to, "New Complaint on Your Event — " + (eventName != null ? eventName : subject),
                "Hi " + (organizerName != null ? organizerName : "there") + ",\n\n"
                + raisedByName + " has raised a complaint"
                + (eventName != null ? " about your event \"" + eventName + "\"" : "") + ".\n\n"
                + "Subject  : " + subject + "\n\n"
                + "Message:\n" + message + "\n\n"
                + "Our admin team has been notified and will review this complaint.\n\nSports EMS Team");
    }

    // Feature: Complaints — notify the person who raised a complaint whenever
    // an admin updates its status or adds a reply.
    @Async
    public void sendComplaintStatusUpdateEmail(String to, String name, String subject,
                                                String status, String adminReply) {
        send(to, "Complaint Update — " + subject,
                "Hi " + name + ",\n\nThere's an update on your complaint \"" + subject + "\".\n\n"
                + "Status: " + status + "\n"
                + (adminReply != null && !adminReply.isBlank() ? "\nAdmin reply:\n" + adminReply + "\n" : "")
                + "\nSports EMS Team");
    }
}
