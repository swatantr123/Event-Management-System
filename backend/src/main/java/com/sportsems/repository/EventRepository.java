package com.sportsems.repository;

import com.sportsems.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    // Feature 2: get only this organizer's events
    List<Event> findByCreatedBy(String createdBy);
    // Feature 2: find event by id AND owner (prevents accessing others' events)
    Optional<Event> findByEventIdAndCreatedBy(Long eventId, String createdBy);
}
