/// <reference types="vite/client" />

const AUTH_KEY = "appAuthenticated";

const PASSWORD = import.meta.env.VITE_APP_PASSWORD?.trim() || "NossoAmor@2308";

export function isAuthenticated() {
  localStorage.removeItem(AUTH_KEY);
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function validatePassword(password: string) {
  return password === PASSWORD;
}

export function saveAuthentication() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.setItem(AUTH_KEY, "true");
}

export function clearAuthentication() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
}
