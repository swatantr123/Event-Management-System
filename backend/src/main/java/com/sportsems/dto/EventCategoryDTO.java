package com.sportsems.dto;

public class EventCategoryDTO {
    private Long categoryId;
    private String name;

    public EventCategoryDTO() {}
    public EventCategoryDTO(Long categoryId, String name) {
        this.categoryId = categoryId;
        this.name = name;
    }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
