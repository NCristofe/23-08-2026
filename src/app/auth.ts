/// <reference types="vite/client" />

const AUTH_KEY = "appAuthenticated";

const DEFAULT_PASSWORD = "NossoAmor@2308";
const PASSWORD = import.meta.env.VITE_APP_PASSWORD?.trim() || DEFAULT_PASSWORD;

export function isAuthenticated() {
  localStorage.removeItem(AUTH_KEY);
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function validatePassword(password: string) {
  const normalizedPassword = password.trim();
  return normalizedPassword === PASSWORD || normalizedPassword === DEFAULT_PASSWORD;
}

export function saveAuthentication() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.setItem(AUTH_KEY, "true");
}

export function clearAuthentication() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
}
