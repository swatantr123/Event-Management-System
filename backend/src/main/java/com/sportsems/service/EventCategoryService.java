package com.sportsems.service;

import com.sportsems.dto.EventCategoryDTO;
import com.sportsems.entity.EventCategory;
import com.sportsems.repository.EventCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

// Menu-driven event categories (Sports, Cultural Fest, Family Function, Comedy,
// Concert, Get Together, ...). Any signed-in user can view the list; only
// organizers/admins are allowed (enforced by the controller/security config)
// to add a brand-new category. Regular users can only pick from the list.
@Service
public class EventCategoryService {

    private final EventCategoryRepository categoryRepository;

    public EventCategoryService(EventCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<EventCategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(c -> new EventCategoryDTO(c.getCategoryId(), c.getName()))
                .collect(Collectors.toList());
    }

    @Transactional
    public EventCategoryDTO createCategory(String name, String createdByEmail) {
        String trimmed = name == null ? "" : name.trim();
        if (trimmed.isEmpty()) {
            throw new RuntimeException("Category name is required");
        }
        if (categoryRepository.existsByNameIgnoreCase(trimmed)) {
            throw new RuntimeException("This category already exists");
        }
        EventCategory category = new EventCategory();
        category.setName(trimmed);
        category.setCreatedBy(createdByEmail);
        EventCategory saved = categoryRepository.save(category);
        return new EventCategoryDTO(saved.getCategoryId(), saved.getName());
    }

    // Called at startup to make sure the default menu options always exist.
    @Transactional
    public void seedDefaultsIfEmpty(List<String> defaults) {
        if (categoryRepository.count() > 0) return;
        for (String name : defaults) {
            if (!categoryRepository.existsByNameIgnoreCase(name)) {
                EventCategory category = new EventCategory();
                category.setName(name);
                categoryRepository.save(category);
            }
        }
    }
}
