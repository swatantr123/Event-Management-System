package com.sportsems.dto;

public class ComplaintRequestDTO {

    private String subject;
    private String message;

    // Optional — which event (if any) this complaint is about.
    private Long eventId;

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
}
