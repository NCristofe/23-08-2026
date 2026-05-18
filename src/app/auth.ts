const AUTH_KEY = "appAuthenticated";
const PASSWORD = import.meta.env.VITE_APP_PASSWORD || "230825";

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function validatePassword(password: string) {
  return password === PASSWORD;
}

export function saveAuthentication() {
  localStorage.setItem(AUTH_KEY, "true");
}

export function clearAuthentication() {
  localStorage.removeItem(AUTH_KEY);
}
