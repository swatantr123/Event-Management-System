/**
 * Auth utility — stores token in BOTH localStorage and cookie.
 * Cookie persists across page reloads and tab switches.
 */

const COOKIE_EXPIRY_DAYS = 1;

function setCookie(name, value) {
  const expires = new Date(Date.now() + COOKIE_EXPIRY_DAYS * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Strict`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
}

export function setAuth(token, role, userName, email) {
  localStorage.setItem("token",    token);
  localStorage.setItem("role",     role);
  localStorage.setItem("userName", userName);
  if (email) localStorage.setItem("email", email);
  setCookie("ems_token",    token);
  setCookie("ems_role",     role);
  setCookie("ems_userName", userName);
  if (email) setCookie("ems_email", email);
}

export function getToken() {
  return localStorage.getItem("token") || getCookie("ems_token") || null;
}

export function getRole() {
  return localStorage.getItem("role") || getCookie("ems_role") || null;
}

export function getUserName() {
  return localStorage.getItem("userName") || getCookie("ems_userName") || null;
}

export function getEmail() {
  return localStorage.getItem("email") || getCookie("ems_email") || null;
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userName");
  localStorage.removeItem("email");
  deleteCookie("ems_token");
  deleteCookie("ems_role");
  deleteCookie("ems_userName");
  deleteCookie("ems_email");
}

export function isLoggedIn() {
  return !!getToken();
}
