package com.sportsems.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Verifies Google "ID tokens" (JWT credentials) issued by Google Identity
 * Services on the frontend, using Google's public tokeninfo endpoint.
 *
 * NOTE: this calls Google's tokeninfo endpoint on every login, which is fine
 * for typical traffic. For very high volume, switch to local verification
 * with Google's public JWK keys (com.google.api-client:google-api-client).
 */
@Service
public class GoogleTokenVerifierService {

    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final RestTemplate restTemplate;

    @Value("${google.oauth.client-id:}")
    private String googleClientId;

    public GoogleTokenVerifierService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public static class GoogleUserInfo {
        public String email;
        public String name;
        public boolean emailVerified;
    }

    /**
     * Verifies the given Google ID token and returns the user's profile
     * details (email, name) fetched from the token payload.
     *
     * @throws RuntimeException("INVALID_GOOGLE_TOKEN") if the token is
     *                                                  missing, expired, malformed,
     *                                                  not meant for this app
     *                                                  (wrong
     *                                                  audience), or the email
     *                                                  isn't verified by Google.
     */
    public GoogleUserInfo verify(String idToken) {
        if (idToken == null || idToken.isBlank())
            throw new RuntimeException("INVALID_GOOGLE_TOKEN");

        Map<String, Object> payload;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(TOKEN_INFO_URL + idToken, Map.class);
            payload = response;
        } catch (RestClientException e) {
            throw new RuntimeException("INVALID_GOOGLE_TOKEN");
        }
        if (payload == null)
            throw new RuntimeException("INVALID_GOOGLE_TOKEN");

        // Make sure the token was actually issued for THIS application,
        // not some other Google client — prevents token substitution attacks.
        Object aud = payload.get("aud");
        if (googleClientId != null && !googleClientId.isBlank()
                && !googleClientId.equals(aud)) {
            throw new RuntimeException("INVALID_GOOGLE_TOKEN");
        }

        Object emailVerified = payload.get("email_verified");
        boolean verified = "true".equals(emailVerified) || Boolean.TRUE.equals(emailVerified);
        Object email = payload.get("email");
        if (email == null || !verified)
            throw new RuntimeException("INVALID_GOOGLE_TOKEN");

        GoogleUserInfo info = new GoogleUserInfo();
        info.email = (String) email;
        info.name = (String) payload.getOrDefault("name", info.email.split("@")[0]);
        info.emailVerified = true;
        return info;
    }
}
