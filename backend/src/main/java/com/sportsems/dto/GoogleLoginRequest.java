package com.sportsems.dto;

public class GoogleLoginRequest {
    // The Google ID token (JWT credential) returned by Google Identity Services on the frontend
    private String idToken;

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
}
