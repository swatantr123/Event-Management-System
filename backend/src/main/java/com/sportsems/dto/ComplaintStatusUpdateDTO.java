package com.sportsems.dto;

// Used by admins to change a complaint's status and/or leave a reply.
public class ComplaintStatusUpdateDTO {

    private String status;      // OPEN | IN_PROGRESS | RESOLVED
    private String adminReply;  // optional

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAdminReply() { return adminReply; }
    public void setAdminReply(String adminReply) { this.adminReply = adminReply; }
}
