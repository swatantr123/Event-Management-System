import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * "Continue with Google" button for the Login page.
 *
 * Google Identity Services hands back a signed ID token (JWT) containing the
 * person's Google profile (name, email, etc.) — that token is forwarded as-is
 * to the backend, which verifies it with Google and fetches whatever details
 * it needs (name/email) to log the person in, auto-registering a new USER
 * account the first time they sign in with that Google account.
 *
 * Google sign-in only ever creates/logs in USER accounts (see AuthService).
 */
function GoogleLoginButton({ onCredential, onError }) {
  const buttonDivRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Poll for the Google script (loaded async in index.html) to be ready.
  useEffect(() => {
    if (window.google?.accounts?.id) { setScriptReady(true); return; }
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setScriptReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scriptReady) return;

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith("YOUR_GOOGLE")) {
      onError?.("Google Sign-In isn't configured yet. Set VITE_GOOGLE_CLIENT_ID in frontend/.env");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => onCredential(response.credential),
      auto_select: false,
    });

    if (buttonDivRef.current) {
      window.google.accounts.id.renderButton(buttonDivRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 320,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady]);

  return <div ref={buttonDivRef} className="d-flex justify-content-center" />;
}

export default GoogleLoginButton;
