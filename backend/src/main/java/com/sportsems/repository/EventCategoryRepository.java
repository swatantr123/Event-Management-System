package com.sportsems.repository;

import com.sportsems.entity.EventCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventCategoryRepository extends JpaRepository<EventCategory, Long> {
    List<EventCategory> findAllByOrderByNameAsc();
    Optional<EventCategory> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
