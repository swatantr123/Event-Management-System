package com.sportsems.controller;

import com.sportsems.dto.*;
import com.sportsems.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Feature 6: registration is multipart so ORGANIZER/ADMIN can attach a
    // PDF verification document alongside the regular fields. USER
    // registrations simply omit the "document" part.
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("phone") String phone,
            @RequestParam("role") String role,
            @RequestParam(value = "document", required = false) MultipartFile document) {
        try {
            RegisterRequest request = new RegisterRequest();
            request.setName(name);
            request.setEmail(email);
            request.setPassword(password);
            request.setPhone(phone);
            request.setRole(role);

            String result = authService.registerUser(request, document);
            if ("PENDING_APPROVAL".equals(result)) {
                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(Map.of("message",
                                "Registration submitted! Your account is pending admin approval. You will be notified by email.",
                                "status", "PENDING_APPROVAL"));
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Registration successful! You can now login.",
                            "status", "ACTIVE"));
        } catch (RuntimeException e) {
            if ("EMAIL_EXISTS".equals(e.getMessage()))
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Email already registered.", "field", "email"));
            if ("MOBILE_EXISTS".equals(e.getMessage()))
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Mobile number already registered.", "field", "mobile"));
            if ("WEAK_PASSWORD".equals(e.getMessage()))
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Password must be 8+ chars, 1 uppercase, 1 number.", "field", "password"));
            if ("DOCUMENT_REQUIRED".equals(e.getMessage()))
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Please upload a PDF verification document.", "field", "document"));
            if ("INVALID_DOCUMENT_TYPE".equals(e.getMessage()))
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Verification document must be a PDF file.", "field", "document"));
            if ("DOCUMENT_UPLOAD_FAILED".equals(e.getMessage()))
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Could not upload document. Please try again.", "field", "document"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Something went wrong."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = authService.loginUser(request);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (RuntimeException e) {
            return switch (e.getMessage()) {
                case "ACCOUNT_LOCKED" -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Account locked. Try again after 15 minutes."));
                case "ACCOUNT_PENDING" -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Your account is pending admin approval. Please wait for activation."));
                default -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid email or password"));
            };
        }
    }

    // Google Sign-In — available on the Login page only, always signs the
    // person in (or auto-registers them) as a USER.
    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            String token = authService.loginWithGoogle(request.getIdToken());
            return ResponseEntity.ok(Map.of("token", token));
        } catch (RuntimeException e) {
            return switch (e.getMessage()) {
                case "ACCOUNT_LOCKED" -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Account locked. Try again after 15 minutes."));
                case "GOOGLE_LOGIN_USER_ONLY" -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "This email is registered as an Organizer/Admin. Please use email & password login."));
                default -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Google sign-in failed. Please try again."));
            };
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.sendOtp(request.getEmail());
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email not found"));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            authService.verifyOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(Map.of("message", "OTP verified"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password reset successful"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}
