package com.sportsems.service;

import com.sportsems.dto.EventRequestDTO;
import com.sportsems.dto.EventResponseDTO;
import java.util.List;

public interface EventService {
    EventResponseDTO createEvent(EventRequestDTO dto, String organizerEmail);
    List<EventResponseDTO> getAllEvents();                          // public / admin
    List<EventResponseDTO> getMyEvents(String organizerEmail);     // organizer's own
    EventResponseDTO getEventById(Long id);
    EventResponseDTO updateEvent(Long id, EventRequestDTO dto, String organizerEmail, boolean isAdmin);
    void deleteEvent(Long id, String organizerEmail, boolean isAdmin);
}
