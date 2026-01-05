# Internationalization (i18n)

This folder contains translation files for the VRChat Event Creator UI.

## Adding a New Language

1. **Create a new language file** (e.g., `fr.js`) by copying `en.js`.
   - Keep the same object structure and keys.
   - Preserve variables like `{name}` and `{count}`.
2. **Register the language** in `electron/renderer/i18n/index.js`:
   - Import the new file.
   - Add it to the `languages` map.
   - Add it to `LANGUAGE_OPTIONS` with a label and flag code.
3. **Optional**: Use lazy loading for large translation files.

Example:

```javascript
import { fr } from "./fr.js";

const languages = {
  en,
  fr
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "us" },
  { value: "fr", label: "Francais", flag: "fr" }
];
```

## Available Languages

- en - English (default)
- fr - French
- es - Spanish
- de - German
- ja - Japanese
- zh - Chinese (Simplified)
- pt - Portuguese
- ko - Korean
- ru - Russian

## Usage in Code

```javascript
import { t } from "./i18n/index.js";

const title = t("auth.title"); // "Access Node"
const message = t("auth.loggedInAs", { name: "User123" });
```

## Translation Key Structure

- `nav.*` - Navigation menu items
- `auth.*` - Authentication (login, logout, 2FA)
- `languageSetup.*` - First-run language selection
- `settings.*` - Settings page (theme, app info)
- `events.*` - Event creation page
- `profiles.*` - Profile management page
- `gallery.*` - Gallery image picker
- `common.*` - Common UI elements (buttons, status messages)
- `wizard.*` - Wizard navigation (back, next)

## Best Practices

1. **Keep keys consistent** - Do not change key names when translating.
2. **Preserve variables** - Keep `{name}`, `{count}` placeholders intact.
3. **Match structure** - Keep the same nested object structure as `en.js`.
4. **Test placeholders** - Ensure variable interpolation works in your language.
5. **Keep strings concise** - Shorter labels fit the UI better.

## Future Enhancements

- RTL (Right-to-Left) support for Arabic, Hebrew, etc.
- Locale-aware date/time formatting
- Locale-aware number formatting
