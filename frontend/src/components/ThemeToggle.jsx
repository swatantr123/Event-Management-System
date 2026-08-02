import { useState } from "react";
import { getInitialTheme, applyTheme } from "../utils/theme";

// Feature 7: dark/light mode toggle button, shown in the Navbar.
function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme());

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
      className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
      style={{ width: 34, height: 34 }}
    >
      {theme === "dark" ? "☀" : "🌙"}
    </button>
  );
}

export default ThemeToggle;
