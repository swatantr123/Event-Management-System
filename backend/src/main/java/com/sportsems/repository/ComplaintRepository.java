package com.sportsems.repository;

import com.sportsems.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // Complaints raised by one particular user/organizer (their own complaints).
    List<Complaint> findByRaisedByEmailOrderByCreatedAtDesc(String raisedByEmail);

    // Feature: organizer visibility — complaints raised by USERS about events
    // that belong to this organizer.
    List<Complaint> findByOrganizerEmailAndRaisedByRoleOrderByCreatedAtDesc(
            String organizerEmail, Complaint.RaisedByRole raisedByRole);

    // Admin visibility — every complaint in the system.
    List<Complaint> findAllByOrderByCreatedAtDesc();
}
