package com.sportsems.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Feature: menu-driven event categories (Sports, Cultural Fest, Family Function,
// Comedy, Concert, Get Together, ...). Organizers/admins can add new categories;
// regular users can only view/select from the list.
@Entity
@Table(name = "event_categories", uniqueConstraints = @UniqueConstraint(columnNames = "name"))
public class EventCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    // Who added this category (organizer/admin email). Null for the
    // built-in categories seeded at application startup.
    @Column(name = "created_by", length = 200)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
