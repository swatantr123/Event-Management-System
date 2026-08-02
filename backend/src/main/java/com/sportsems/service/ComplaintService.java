package com.sportsems.service;

import com.sportsems.dto.ComplaintRequestDTO;
import com.sportsems.dto.ComplaintResponseDTO;
import com.sportsems.entity.Complaint;
import com.sportsems.entity.Event;
import com.sportsems.entity.User;
import com.sportsems.repository.ComplaintRepository;
import com.sportsems.repository.EventRepository;
import com.sportsems.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComplaintService {

    private final ComplaintRepository complaintRepo;
    private final UserRepository userRepo;
    private final EventRepository eventRepo;
    private final EmailService emailService;

    public ComplaintService(ComplaintRepository complaintRepo, UserRepository userRepo,
                             EventRepository eventRepo, EmailService emailService) {
        this.complaintRepo = complaintRepo;
        this.userRepo = userRepo;
        this.eventRepo = eventRepo;
        this.emailService = emailService;
    }

    // Raise a new complaint (USER or ORGANIZER).
    //
    // Visibility:
    //  - raised by USER      -> visible to ADMIN, and to the event's ORGANIZER
    //                           if the complaint is tied to one of their events.
    //  - raised by ORGANIZER -> visible to ADMIN only.
    public ComplaintResponseDTO raiseComplaint(String raiserEmail, ComplaintRequestDTO req) {
        User raiser = userRepo.findByEmail(raiserEmail)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

        if (raiser.getRole() != User.Role.USER && raiser.getRole() != User.Role.ORGANIZER)
            throw new RuntimeException("ONLY_USERS_AND_ORGANIZERS_CAN_RAISE_COMPLAINTS");

        if (req == null || req.getSubject() == null || req.getSubject().isBlank())
            throw new RuntimeException("SUBJECT_REQUIRED");
        if (req.getMessage() == null || req.getMessage().isBlank())
            throw new RuntimeException("MESSAGE_REQUIRED");

        Complaint complaint = new Complaint();
        complaint.setRaisedByEmail(raiser.getEmail());
        complaint.setRaisedByName(raiser.getFullName());
        complaint.setRaisedByRole(raiser.getRole() == User.Role.ORGANIZER
                ? Complaint.RaisedByRole.ORGANIZER : Complaint.RaisedByRole.USER);
        complaint.setSubject(req.getSubject().trim());
        complaint.setMessage(req.getMessage().trim());
        complaint.setStatus(Complaint.ComplaintStatus.OPEN);

        if (req.getEventId() != null) {
            Event event = eventRepo.findById(req.getEventId()).orElse(null);
            if (event != null) {
                complaint.setEventId(event.getEventId());
                complaint.setEventName(event.getEventName());
                if (event.getCreatedBy() != null) {
                    complaint.setOrganizerEmail(event.getCreatedBy());
                    userRepo.findByEmail(event.getCreatedBy())
                            .ifPresent(org -> complaint.setOrganizerName(org.getFullName()));
                }
            }
        }

        complaintRepo.save(complaint);
        sendRaiseNotifications(complaint);
        return toDTO(complaint);
    }

    private void sendRaiseNotifications(Complaint complaint) {
        // Admin(s) are notified about every complaint, regardless of who raised it.
        List<User> admins = userRepo.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .collect(Collectors.toList());
        for (User admin : admins) {
            emailService.sendComplaintReceivedEmailToAdmin(admin.getEmail(), admin.getFullName(),
                    complaint.getSubject(), complaint.getMessage(), complaint.getRaisedByName(),
                    complaint.getRaisedByRole().name(), complaint.getEventName());
        }

        // The organizer is only notified when a USER complains about one of
        // their events. Organizer-raised complaints go to admin only.
        if (complaint.getRaisedByRole() == Complaint.RaisedByRole.USER
                && complaint.getOrganizerEmail() != null) {
            emailService.sendComplaintNotificationToOrganizer(complaint.getOrganizerEmail(),
                    complaint.getOrganizerName(), complaint.getSubject(), complaint.getMessage(),
                    complaint.getRaisedByName(), complaint.getEventName());
        }
    }

    // The logged-in user/organizer's own submitted complaints.
    public List<ComplaintResponseDTO> getMyComplaints(String email) {
        return complaintRepo.findByRaisedByEmailOrderByCreatedAtDesc(email)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Organizer dashboard: complaints raised by USERS about this organizer's events.
    public List<ComplaintResponseDTO> getComplaintsForOrganizer(String organizerEmail) {
        return complaintRepo.findByOrganizerEmailAndRaisedByRoleOrderByCreatedAtDesc(
                        organizerEmail, Complaint.RaisedByRole.USER)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Admin: every complaint raised by anyone.
    public List<ComplaintResponseDTO> getAllComplaints() {
        return complaintRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Admin updates status and/or leaves a reply; the original raiser is emailed.
    @Transactional
    public ComplaintResponseDTO updateStatus(Long id, String status, String adminReply) {
        Complaint complaint = complaintRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("COMPLAINT_NOT_FOUND"));

        if (status != null && !status.isBlank()) {
            Complaint.ComplaintStatus newStatus;
            try {
                newStatus = Complaint.ComplaintStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("INVALID_STATUS");
            }
            complaint.setStatus(newStatus);
            complaint.setResolvedAt(newStatus == Complaint.ComplaintStatus.RESOLVED
                    ? LocalDateTime.now() : null);
        }
        if (adminReply != null && !adminReply.isBlank()) {
            complaint.setAdminReply(adminReply.trim());
        }
        complaintRepo.save(complaint);

        emailService.sendComplaintStatusUpdateEmail(complaint.getRaisedByEmail(),
                complaint.getRaisedByName(), complaint.getSubject(),
                complaint.getStatus().name(), complaint.getAdminReply());

        return toDTO(complaint);
    }

    private ComplaintResponseDTO toDTO(Complaint c) {
        ComplaintResponseDTO dto = new ComplaintResponseDTO();
        dto.setId(c.getId());
        dto.setSubject(c.getSubject());
        dto.setMessage(c.getMessage());
        dto.setStatus(c.getStatus().name());
        dto.setRaisedByName(c.getRaisedByName());
        dto.setRaisedByEmail(c.getRaisedByEmail());
        dto.setRaisedByRole(c.getRaisedByRole().name());
        dto.setEventId(c.getEventId());
        dto.setEventName(c.getEventName());
        dto.setOrganizerName(c.getOrganizerName());
        dto.setOrganizerEmail(c.getOrganizerEmail());
        dto.setAdminReply(c.getAdminReply());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }
}
