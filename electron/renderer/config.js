// Configuration and constants for VRChat Event Creator

export const CATEGORIES = [
  { label: "Hangout", value: "hangout", labelKey: "categories.hangout" },
  { label: "Exploration", value: "exploration", labelKey: "categories.exploration" },
  { label: "Roleplaying", value: "roleplaying", labelKey: "categories.roleplaying" },
  { label: "Film and Media", value: "film_media", labelKey: "categories.film" },
  { label: "Gaming", value: "gaming", labelKey: "categories.gaming" },
  { label: "Music", value: "music", labelKey: "categories.music" },
  { label: "Dance", value: "dance", labelKey: "categories.dance" },
  { label: "Performance", value: "performance", labelKey: "categories.performance" },
  { label: "Arts", value: "arts", labelKey: "categories.arts" },
  { label: "Avatars", value: "avatars", labelKey: "categories.avatars" },
  { label: "Education", value: "education", labelKey: "categories.education" },
  { label: "Wellness", value: "wellness", labelKey: "categories.wellness" },
  { label: "Other", value: "other", labelKey: "categories.other" }
];

export const ACCESS_TYPES = [
  { label: "Public", value: "public", labelKey: "common.accessTypes.public" },
  { label: "Group", value: "group", labelKey: "common.accessTypes.group" }
];

export const LANGUAGES = [
  { label: "English", value: "eng" },
  { label: "Japanese", value: "jpn" },
  { label: "Chinese", value: "zho" },
  { label: "Spanish", value: "spa" },
  { label: "French", value: "fra" },
  { label: "German", value: "deu" },
  { label: "Portuguese", value: "por" },
  { label: "Russian", value: "rus" },
  { label: "Korean", value: "kor" },
  { label: "American Sign Language", value: "ase" },
  { label: "British Sign Language", value: "bfi" },
  { label: "Japanese Sign Language", value: "jsl" },
  { label: "Toki Pona", value: "tok" },
  { label: "Italian", value: "ita" },
  { label: "Polish", value: "pol" },
  { label: "Afrikaans", value: "afr" },
  { label: "Arabic", value: "ara" },
  { label: "Auslan (Australian Sign Language)", value: "asf" },
  { label: "Bengali", value: "ben" },
  { label: "Bulgarian", value: "bul" },
  { label: "Cantonese", value: "yue" },
  { label: "Czech", value: "ces" },
  { label: "Danish", value: "dan" },
  { label: "Dutch", value: "nld" },
  { label: "Esperanto", value: "epo" },
  { label: "Estonian", value: "est" },
  { label: "Filipino", value: "fil" },
  { label: "Finnish", value: "fin" },
  { label: "Greek", value: "ell" },
  { label: "Hebrew", value: "heb" },
  { label: "Hindi", value: "hin" },
  { label: "Hmong", value: "hmn" },
  { label: "Hungarian", value: "hun" },
  { label: "Icelandic", value: "isl" },
  { label: "Indonesian", value: "ind" },
  { label: "Irish (Gaeilge)", value: "gle" },
  { label: "Latvian", value: "lav" },
  { label: "Lithuanian", value: "lit" },
  { label: "Luxembourgish", value: "ltz" },
  { label: "Macedonian", value: "mkd" },
  { label: "Malay", value: "msa" },
  { label: "Maori", value: "mri" },
  { label: "Marathi", value: "mar" },
  { label: "Norwegian", value: "nor" },
  { label: "New Zealand Sign Language", value: "nzs" },
  { label: "Romanian", value: "ron" },
  { label: "Scots", value: "sco" },
  { label: "Slovak", value: "slk" },
  { label: "Slovenian", value: "slv" },
  { label: "Swedish", value: "swe" },
  { label: "Telugu", value: "tel" },
  { label: "Thai", value: "tha" },
  { label: "Turkish", value: "tur" },
  { label: "Ukrainian", value: "ukr" },
  { label: "Urdu", value: "urd" },
  { label: "Vietnamese", value: "vie" },
  { label: "Welsh (Cymraeg)", value: "cym" },
  { label: "No linguistic content", value: "zxx" }
];

export const PLATFORMS = [
  { label: "PC (Windows)", value: "standalonewindows", labelKey: "platforms.pcWindows" },
  { label: "Android (Quest, mobile, etc)", value: "android", labelKey: "platforms.android" },
  { label: "iOS", value: "ios", labelKey: "platforms.ios" }
];

export const DATE_MODES = [
  { label: "Pattern based", value: "pattern", labelKey: "profiles.dateModePattern" },
  { label: "Manual only", value: "manual", labelKey: "profiles.dateModeManual" },
  { label: "Patterns + manual", value: "both", labelKey: "profiles.dateModeBoth" }
];

export const PATTERN_TYPES = [
  { label: "Every [weekday]", value: "every", labelKey: "profiles.patterns.types.every" },
  { label: "Every other [weekday]", value: "every-other", labelKey: "profiles.patterns.types.everyOther" },
  { label: "Every 1st [weekday] of month", value: "1st", labelKey: "profiles.patterns.types.nth1" },
  { label: "Every 2nd [weekday] of month", value: "2nd", labelKey: "profiles.patterns.types.nth2" },
  { label: "Every 3rd [weekday] of month", value: "3rd", labelKey: "profiles.patterns.types.nth3" },
  { label: "Every 4th [weekday] of month", value: "4th", labelKey: "profiles.patterns.types.nth4" },
  { label: "Every last [weekday] of month", value: "last", labelKey: "profiles.patterns.types.last" }
];

export const WEEKDAYS = [
  { label: "Monday", value: "monday", labelKey: "common.weekdays.monday" },
  { label: "Tuesday", value: "tuesday", labelKey: "common.weekdays.tuesday" },
  { label: "Wednesday", value: "wednesday", labelKey: "common.weekdays.wednesday" },
  { label: "Thursday", value: "thursday", labelKey: "common.weekdays.thursday" },
  { label: "Friday", value: "friday", labelKey: "common.weekdays.friday" },
  { label: "Saturday", value: "saturday", labelKey: "common.weekdays.saturday" },
  { label: "Sunday", value: "sunday", labelKey: "common.weekdays.sunday" }
];

export const TAG_LIMIT = 5;
export const TAG_TEXT_LIMIT = 64;
export const EVENT_NAME_LIMIT = 64;
export const EVENT_DESCRIPTION_LIMIT = 1024;

export const THEME_FIELDS = [
  { key: "accent", label: "Accent", labelKey: "settings.theme.fields.accent" },
  { key: "bg", label: "Background 1", labelKey: "settings.theme.fields.bg" },
  { key: "bgDeep", label: "Background 2", labelKey: "settings.theme.fields.bgDeep" },
  { key: "backdrop", label: "Background 3", labelKey: "settings.theme.fields.backdrop" },
  { key: "panel", label: "Panel", labelKey: "settings.theme.fields.panel" },
  { key: "panelAlt", label: "Panel Alt", labelKey: "settings.theme.fields.panelAlt" },
  { key: "headerBg", label: "Header", labelKey: "settings.theme.fields.headerBg" },
  { key: "overlay", label: "Overlay", labelKey: "settings.theme.fields.overlay" },
  { key: "text", label: "Text", labelKey: "settings.theme.fields.text" },
  { key: "textMuted", label: "Text Muted", labelKey: "settings.theme.fields.textMuted" },
  { key: "link", label: "Link", labelKey: "settings.theme.fields.link" },
  { key: "linkHover", label: "Link Hover", labelKey: "settings.theme.fields.linkHover" },
  { key: "button", label: "Button 1", labelKey: "settings.theme.fields.button" },
  { key: "button2", label: "Button 2", labelKey: "settings.theme.fields.button2" },
  { key: "buttonText", label: "Button Text", labelKey: "settings.theme.fields.buttonText" },
  { key: "border", label: "Border", labelKey: "settings.theme.fields.border" },
  { key: "shadow", label: "Shadow", labelKey: "settings.theme.fields.shadow" },
  { key: "inputBg", label: "Input Background", labelKey: "settings.theme.fields.inputBg" },
  { key: "inputBgStrong", label: "Input Background 2", labelKey: "settings.theme.fields.inputBgStrong" },
  { key: "inputText", label: "Input Text", labelKey: "settings.theme.fields.inputText" },
  { key: "selectOptionBg", label: "Select Option", labelKey: "settings.theme.fields.selectOptionBg" },
  { key: "selectOptionHighlight", label: "Select Highlight", labelKey: "settings.theme.fields.selectOptionHighlight" },
  { key: "backdropOverlay", label: "Backdrop Glow", labelKey: "settings.theme.fields.backdropOverlay" },
  { key: "backdropGrid", label: "Backdrop Grid", labelKey: "settings.theme.fields.backdropGrid" },
  { key: "scanline", label: "Scanline", labelKey: "settings.theme.fields.scanline" }
];

export const THEME_PRESET_LABELS = {
  wired: "『ᵂᶤʳᵉᵈ ᶠʳᵃᵐᵉ』",
  default: "VRChat Teal"
};

const BASE_THEME = {
  accent: "#1fc3ad",
  bg: "#cfd7d1",
  bgDeep: "#9aa7a2",
  backdrop: "#8c9f9a",
  panel: "#12181a",
  panelAlt: "#182022",
  headerBg: "#0c1012",
  overlay: "#080c0e",
  text: "#e8f0ec",
  textMuted: "#b8c6c0",
  link: "#1fc3ad",
  linkHover: "#4f96f2ff",
  button: "#4fc4f2ff",
  button2: "#1fc3ad",
  buttonText: "#12181a",
  border: "#eef6f2",
  shadow: "#090c0e",
  inputBg: "#060a0b",
  inputBgStrong: "#060a0b",
  inputText: "#f7fdf9",
  selectOptionBg: "#0f1416",
  selectOptionHighlight: "#1fc3ad",
  backdropOverlay: "#12181a",
  backdropGrid: "#ffffff",
  scanline: "#000000"
};

export const THEMES = {
  default: {
    ...BASE_THEME,
    accent: "#65D9EE",
    bg: "#040404",
    bgDeep: "#040404",
    backdrop: "#0E1013",
    panel: "#07242B",
    panelAlt: "#07142B",
    headerBg: "#07242B",
    overlay: "#080C0E",
    text: "#E8F0F4",
    textMuted: "#B8C6C0",
    link: "#0E9BB1",
    linkHover: "#0D5D6A",
    button: "#07242B",
    button2: "#07142B",
    buttonText: "#65D9EE",
    border: "#053C48FF",
    shadow: "#090C0E",
    inputBg: "#060A0B",
    inputBgStrong: "#060A0B",
    inputText: "#F7FDF9",
    selectOptionBg: "#0F1416",
    selectOptionHighlight: "#050506",
    backdropOverlay: "#12181A",
    backdropGrid: "#1E2A31AA",
    scanline: "#000000"
  },
  wired: {
    ...BASE_THEME,
    accent: "#ffffff30",
    bg: "#000000",
    bgDeep: "#000000",
    backdrop: "#383838",
    panel: "#0f0f0fea",
    panelAlt: "#1c1c1c",
    headerBg: "#0a0a0a25",
    overlay: "#000000",
    text: "#e8f0ec",
    textMuted: "#b8c6c0",
    link: "#757575",
    linkHover: "#ffffff",
    button: "#0f0f0f",
    button2: "#292929",
    buttonText: "#ffffff",
    border: "#1c1c1cff",
    shadow: "#ffffff25",
    inputBg: "#000000",
    inputBgStrong: "#060606",
    inputText: "#f7fdf9",
    selectOptionBg: "#363636aa",
    selectOptionHighlight: "#141414",
    backdropOverlay: "#21212150",
    backdropGrid: "#00000045",
    scanline: "#7d7d7d99"
  }
};
