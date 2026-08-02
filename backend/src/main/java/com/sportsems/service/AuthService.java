package com.sportsems.service;

import com.sportsems.dto.LoginRequest;
import com.sportsems.dto.RegisterRequest;
import com.sportsems.entity.User;
import com.sportsems.repository.UserRepository;
import com.sportsems.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Random;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final JwtUtil        jwtUtil;
    private final EmailService   emailService;
    private final PasswordEncoder passwordEncoder; // Fix 3: BCrypt
    private final GoogleTokenVerifierService googleTokenVerifierService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public AuthService(UserRepository userRepo, JwtUtil jwtUtil,
                       EmailService emailService, PasswordEncoder passwordEncoder,
                       GoogleTokenVerifierService googleTokenVerifierService) {
        this.userRepo        = userRepo;
        this.jwtUtil         = jwtUtil;
        this.emailService    = emailService;
        this.passwordEncoder = passwordEncoder;
        this.googleTokenVerifierService = googleTokenVerifierService;
    }

    // Feature 6: ORGANIZER/ADMIN self-registration must include a PDF
    // verification document; USER registration never requires one.
    public String registerUser(RegisterRequest request, MultipartFile document) {
        if (userRepo.findByEmail(request.getEmail()).isPresent())
            throw new RuntimeException("EMAIL_EXISTS");
        if (request.getPhone() != null && userRepo.findByMobileNumber(request.getPhone()).isPresent())
            throw new RuntimeException("MOBILE_EXISTS");
        if (!isValidPassword(request.getPassword()))
            throw new RuntimeException("WEAK_PASSWORD");

        User.Role role = User.Role.valueOf(request.getRole().toUpperCase());
        boolean requiresDocument = role == User.Role.ORGANIZER || role == User.Role.ADMIN;

        if (requiresDocument) {
            if (document == null || document.isEmpty())
                throw new RuntimeException("DOCUMENT_REQUIRED");
            if (!isPdf(document))
                throw new RuntimeException("INVALID_DOCUMENT_TYPE");
        }

        User user = new User();
        user.setFullName(request.getName());
        user.setEmail(request.getEmail());
        // Fix 3: BCrypt hash the password before saving
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setMobileNumber(request.getPhone());
        user.setRole(role);
        user.setVerificationToken(UUID.randomUUID().toString());

        if (requiresDocument) {
            String storedPath = storeDocument(document);
            user.setDocumentPath(storedPath);
            user.setDocumentOriginalName(document.getOriginalFilename());
        }

        if (user.getRole() == User.Role.USER) {
            user.setStatus(User.Status.ACTIVE);
            userRepo.save(user);
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
            return "REGISTERED_SUCCESSFULLY";
        } else {
            user.setStatus(User.Status.PENDING_APPROVAL);
            userRepo.save(user);
            emailService.sendPendingApprovalEmail(user.getEmail(), user.getFullName(),
                    user.getRole().name());
            return "PENDING_APPROVAL";
        }
    }

    private boolean isPdf(MultipartFile file) {
        String contentType = file.getContentType();
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        return ("application/pdf".equalsIgnoreCase(contentType)) || name.endsWith(".pdf");
    }

    private String storeDocument(MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + ".pdf";
            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return target.toString();
        } catch (IOException e) {
            throw new RuntimeException("DOCUMENT_UPLOAD_FAILED");
        }
    }

    public String loginUser(LoginRequest request) {
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("INVALID_CREDENTIALS"));

        if (user.getStatus() == User.Status.PENDING_APPROVAL)
            throw new RuntimeException("ACCOUNT_PENDING");

        if (user.getStatus() == User.Status.LOCKED) {
            if (user.getLockTime() != null &&
                    user.getLockTime().plusMinutes(15).isAfter(LocalDateTime.now())) {
                throw new RuntimeException("ACCOUNT_LOCKED");
            }
            user.setStatus(User.Status.ACTIVE);
            user.setFailedAttempts(0);
            user.setLockTime(null);
            userRepo.save(user);
        }

        // Fix 3: use BCrypt matches() instead of plain equals()
        boolean passwordMatches;
        try {
            passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        } catch (Exception e) {
            // Fallback for old plain-text passwords still in DB
            passwordMatches = request.getPassword().equals(user.getPassword());
        }

        if (!passwordMatches) {
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            if (user.getFailedAttempts() >= 3) {
                user.setStatus(User.Status.LOCKED);
                user.setLockTime(LocalDateTime.now());
            }
            userRepo.save(user);
            throw new RuntimeException("INVALID_CREDENTIALS");
        }

        user.setFailedAttempts(0);
        user.setLastLogin(LocalDateTime.now());
        userRepo.save(user);
        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }

    /**
     * Google Sign-In (accessible from the Login page only).
     * Always logs the person in as a USER — never as ORGANIZER/ADMIN:
     *  - If no account exists for that email, one is auto-created as USER
     *    using the name/email fetched from Google.
     *  - If an account already exists but was registered as ORGANIZER/ADMIN,
     *    Google login is refused so that privileged roles can't be granted
     *    via a Google sign-in.
     */
    public String loginWithGoogle(String idToken) {
        GoogleTokenVerifierService.GoogleUserInfo info = googleTokenVerifierService.verify(idToken);

        User user = userRepo.findByEmail(info.email).orElse(null);

        if (user == null) {
            // First time signing in with Google — auto-register as USER
            user = new User();
            user.setFullName(info.name);
            user.setEmail(info.email);
            // Account has no usable password since it was created via Google;
            // store a random BCrypt hash so the column constraint is satisfied
            // and the value can never match a submitted password.
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setRole(User.Role.USER);
            user.setStatus(User.Status.ACTIVE);
            userRepo.save(user);
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
        } else if (user.getRole() != User.Role.USER) {
            // Don't let Google sign-in escalate/aliases into a privileged role
            throw new RuntimeException("GOOGLE_LOGIN_USER_ONLY");
        } else if (user.getStatus() == User.Status.LOCKED) {
            throw new RuntimeException("ACCOUNT_LOCKED");
        }

        user.setFailedAttempts(0);
        user.setLastLogin(LocalDateTime.now());
        userRepo.save(user);
        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }

    public String sendOtp(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("EMAIL_NOT_FOUND"));
        String otp = String.valueOf(100000 + new Random().nextInt(900000));
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepo.save(user);
        emailService.sendOtpEmail(user.getEmail(), user.getFullName(), otp);
        return "OTP_SENT";
    }

    public String verifyOtp(String email, String otp) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("EMAIL_NOT_FOUND"));
        if (user.getOtp() == null || !user.getOtp().equals(otp))
            throw new RuntimeException("INVALID_OTP");
        if (user.getOtpExpiry().isBefore(LocalDateTime.now()))
            throw new RuntimeException("OTP_EXPIRED");
        return "OTP_VERIFIED";
    }

    public String resetPassword(String email, String otp, String newPassword) {
        verifyOtp(email, otp);
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("EMAIL_NOT_FOUND"));
        if (!isValidPassword(newPassword)) throw new RuntimeException("WEAK_PASSWORD");
        // Fix 3: hash the new password too
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepo.save(user);
        return "PASSWORD_RESET_SUCCESS";
    }

    public String verifyEmail(String token) {
        User user = userRepo.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("INVALID_TOKEN"));
        user.setStatus(User.Status.ACTIVE);
        user.setVerificationToken(null);
        userRepo.save(user);
        return "EMAIL_VERIFIED";
    }

    private boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) return false;
        if (!password.matches(".*[A-Z].*")) return false;
        return password.matches(".*[0-9].*");
    }
}
