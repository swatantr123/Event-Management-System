package com.sportsems.repository;

import com.sportsems.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByEvent_EventIdAndUserEmail(Long eventId, String userEmail);
    List<Booking> findByUserEmail(String userEmail);
    List<Booking> findByEvent_EventId(Long eventId);
    long countByEvent_EventIdAndStatus(Long eventId, Booking.BookingStatus status);
}
