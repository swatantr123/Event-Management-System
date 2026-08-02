package com.sportsems.dto;

import com.sportsems.entity.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class UserResponseDTO {
    private Long id;
    private String fullName;
    private String email;
    private String mobileNumber;
    private User.Role role;
    private User.Status status;
    private int failedAttempts;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime lastLogin;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") private LocalDateTime createdAt;
    // Feature 6: whether this user uploaded a verification document (ORGANIZER/ADMIN)
    private boolean hasDocument;
    private String documentOriginalName;
    // Feature: whether an admin has already opened that document (required before approval)
    private boolean documentViewed;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
    public User.Role getRole() { return role; }
    public void setRole(User.Role role) { this.role = role; }
    public User.Status getStatus() { return status; }
    public void setStatus(User.Status status) { this.status = status; }
    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isHasDocument() { return hasDocument; }
    public void setHasDocument(boolean hasDocument) { this.hasDocument = hasDocument; }
    public String getDocumentOriginalName() { return documentOriginalName; }
    public void setDocumentOriginalName(String documentOriginalName) { this.documentOriginalName = documentOriginalName; }
    public boolean isDocumentViewed() { return documentViewed; }
    public void setDocumentViewed(boolean documentViewed) { this.documentViewed = documentViewed; }
}
