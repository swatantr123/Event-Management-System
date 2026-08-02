import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window to the top whenever the route changes — so clicking a
 * link (e.g. Home, About Us, Events, Login, Register, Forgot Password in
 * the footer) always lands the person at the top of the new page instead
 * of keeping their previous scroll position.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
