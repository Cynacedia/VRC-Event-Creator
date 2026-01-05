// i18n - Internationalization loader for VRChat Event Creator
// This module handles loading and switching between language translations

import { en } from "./en.js";
import { fr } from "./fr.js";
import { es } from "./es.js";
import { de } from "./de.js";
import { ja } from "./ja.js";
import { zh } from "./zh.js";
import { pt } from "./pt.js";
import { ko } from "./ko.js";
import { ru } from "./ru.js";

// Available languages
const languages = {
  en,
  fr,
  es,
  de,
  ja,
  zh,
  pt,
  ko,
  ru
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "us" },
  { value: "fr", label: "Français", flag: "fr" },
  { value: "es", label: "Español", flag: "es" },
  { value: "de", label: "Deutsch", flag: "de" },
  { value: "ja", label: "日本語", flag: "jp" },
  { value: "zh", label: "中文（简体）", flag: "cn" },
  { value: "pt", label: "Português", flag: "pt" },
  { value: "ko", label: "한국어", flag: "kr" },
  { value: "ru", label: "Русский", flag: "ru" }
];

function normalizeLanguageCode(value) {
  if (!value) {
    return null;
  }
  const lower = String(value).toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("de")) return "de";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("zh")) return "zh";
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("ru")) return "ru";
  return null;
}

function getSystemLanguage() {
  if (typeof navigator === "undefined") {
    return null;
  }
  const locales = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  for (const locale of locales) {
    const normalized = normalizeLanguageCode(locale);
    if (normalized && languages[normalized]) {
      return normalized;
    }
  }
  return null;
}

// Current language state
let currentLang = "en";
let translations = en;
let languageDisplay = null;
let languageDisplayLocale = null;

function capitalizeLanguageLabel(label) {
  if (!label) {
    return label;
  }
  const trimmed = String(label).trim();
  if (!trimmed) {
    return trimmed;
  }
  const first = trimmed.charAt(0);
  const rest = trimmed.slice(1);
  const upper = first.toLocaleUpperCase(currentLang);
  return `${upper}${rest}`;
}

/**
 * Get the current language code
 * @returns {string} Current language code (e.g., "en")
 */
export function getCurrentLanguage() {
  return currentLang;
}

/**
 * Set the application language
 * @param {string} langCode - Language code (e.g., "en", "fr", "es")
 * @returns {Promise<boolean>} Success status
 */
export async function setLanguage(langCode) {
  if (!languages[langCode]) {
    console.warn(`Language "${langCode}" not available, using English`);
    return false;
  }

  // If language is already loaded (not a function), use it directly
  if (typeof languages[langCode] !== "function") {
    translations = languages[langCode];
    currentLang = langCode;
    localStorage.setItem("language", langCode);
    return true;
  }

  // Otherwise, lazy load it
  try {
    translations = await languages[langCode]();
    currentLang = langCode;
    localStorage.setItem("language", langCode);
    return true;
  } catch (err) {
    console.error(`Failed to load language "${langCode}":`, err);
    return false;
  }
}

/**
 * Get a translation string by key path
 * @param {string} keyPath - Dot-notation key path (e.g., "auth.title")
 * @param {object} vars - Variables to interpolate (e.g., {name: "John"})
 * @returns {string} Translated string
 */
export function t(keyPath, vars = {}) {
  const keys = keyPath.split(".");
  let value = translations;

  for (const key of keys) {
    if (value && typeof value === "object") {
      value = value[key];
    } else {
      console.warn(`Translation key "${keyPath}" not found`);
      return keyPath;
    }
  }

  if (typeof value !== "string") {
    console.warn(`Translation key "${keyPath}" is not a string`);
    return keyPath;
  }

  // Replace variables like {name}, {count}, etc.
  return value.replace(/\{(\w+)\}/g, (match, varName) => {
    return vars[varName] !== undefined ? vars[varName] : match;
  });
}

/**
 * Initialize i18n system
 * Loads the saved language preference or defaults to English
 */
export async function initI18n() {
  const savedLang = localStorage.getItem("language");
  const systemLang = getSystemLanguage();
  const nextLang = savedLang || systemLang || "en";
  await setLanguage(nextLang);
}

/**
 * Get all available language codes
 * @returns {string[]} Array of language codes
 */
export function getAvailableLanguages() {
  return Object.keys(languages);
}

export function getLanguageOptions() {
  return LANGUAGE_OPTIONS.slice();
}

export function getLanguageDisplayName(code, fallback) {
  if (!code) {
    return fallback || "";
  }
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return fallback || code;
  }
  if (!languageDisplay || languageDisplayLocale !== currentLang) {
    languageDisplayLocale = currentLang;
    languageDisplay = new Intl.DisplayNames([currentLang], { type: "language" });
  }
  try {
    const label = languageDisplay.of(code);
    if (!label) {
      return fallback || code;
    }
    const normalized = String(label).trim();
    if (!normalized || normalized.toLowerCase() === String(code).toLowerCase()) {
      return fallback || code;
    }
    return capitalizeLanguageLabel(normalized);
  } catch (err) {
    return fallback || code;
  }
}

export function applyTranslations(root = document) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return;
  }
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });
  root.querySelectorAll("[data-i18n-value]").forEach(el => {
    const key = el.getAttribute("data-i18n-value");
    if (key) {
      el.value = t(key);
    }
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      el.setAttribute("placeholder", t(key));
    }
  });
}


