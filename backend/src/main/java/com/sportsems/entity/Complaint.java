package com.sportsems.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Feature: Complaints.
 * A USER or an ORGANIZER can raise a complaint.
 *
 * Visibility rules (enforced in ComplaintService, not here):
 *  - A complaint raised by a USER is visible to the ADMIN and, if it is
 *    tied to a specific event, to that event's ORGANIZER as well.
 *  - A complaint raised by an ORGANIZER is visible to the ADMIN only.
 */
@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "raised_by_email", nullable = false)
    private String raisedByEmail;

    @Column(name = "raised_by_name")
    private String raisedByName;

    @Enumerated(EnumType.STRING)
    @Column(name = "raised_by_role", nullable = false, length = 20)
    private RaisedByRole raisedByRole;

    @Column(nullable = false, length = 150)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // Optional: the event this complaint relates to. Mainly used when a USER
    // complains about a specific event — this is what makes the complaint
    // visible to that event's organizer too.
    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "event_name", length = 150)
    private String eventName;

    // Denormalized organizer info for that event, so the complaint can be
    // filtered to "complaints on my events" without a join.
    @Column(name = "organizer_email")
    private String organizerEmail;

    @Column(name = "organizer_name")
    private String organizerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintStatus status;

    @Column(name = "admin_reply", columnDefinition = "TEXT")
    private String adminReply;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = ComplaintStatus.OPEN;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum RaisedByRole { USER, ORGANIZER }

    public enum ComplaintStatus { OPEN, IN_PROGRESS, RESOLVED }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRaisedByEmail() { return raisedByEmail; }
    public void setRaisedByEmail(String raisedByEmail) { this.raisedByEmail = raisedByEmail; }
    public String getRaisedByName() { return raisedByName; }
    public void setRaisedByName(String raisedByName) { this.raisedByName = raisedByName; }
    public RaisedByRole getRaisedByRole() { return raisedByRole; }
    public void setRaisedByRole(RaisedByRole raisedByRole) { this.raisedByRole = raisedByRole; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }
    public String getOrganizerEmail() { return organizerEmail; }
    public void setOrganizerEmail(String organizerEmail) { this.organizerEmail = organizerEmail; }
    public String getOrganizerName() { return organizerName; }
    public void setOrganizerName(String organizerName) { this.organizerName = organizerName; }
    public ComplaintStatus getStatus() { return status; }
    public void setStatus(ComplaintStatus status) { this.status = status; }
    public String getAdminReply() { return adminReply; }
    public void setAdminReply(String adminReply) { this.adminReply = adminReply; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
