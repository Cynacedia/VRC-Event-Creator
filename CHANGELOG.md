# Changelog

All notable changes to VRChat Event Creator will be documented in this file.

## [0.9.33] - 2026-01-29

### Added
- "Start on system startup" setting to launch the app automatically when your computer starts
- Featured Event toggle for groups with featured event permissions
  - Checkbox appears in Event Creation, Profiles, and Modify Event forms (below Platforms)
  - Settings card for verifying which groups have featured event access
  - Groups are verified by checking for existing featured events via the API
- Translations for all new features across all 10 supported languages

### Changed
- Logout button now only visible in Settings menu (previously always visible in footer)

### Removed
- One-time data migration code (migrated users from vrc-event-creator to VRCEventCreator directory)

## [0.9.32] - 2026-01-15

### Fixed
- User data directory now pins to VRCEventCreator with a one-time migration from vrc-event-creator

## [0.9.31] - 2026-01-15

### Changed
- Automation pending events now use deterministic IDs with slot dedupe and adaptive recheck scheduling
- Theme Studio import/export icons refreshed
- Modify Events keeps optimistic cards until posted or queued/missed

### Fixed
- Manual event creation now passes profile key so automations can schedule follow-ups
- Restore deleted automations now uses current profile settings and clears restore pool when all pending are deleted (auto-disables automation)
- Manage Profiles group switching no longer locks when a profile is selected
- Pending cards pull cached gallery images when available
- Automation recheck jobs now prune for groups without calendar access
- Auto-disabled automations now sync back to profile UI
- Restore anchor uses actual event starts to avoid pre-anchor restores after edits
- Published automation slots now reconcile against upcoming events to allow regeneration after deletions
- Deleted pending events with date overrides restore to the profile slot time
- Modify refresh button now respects a short cooldown with visible countdown
- Post Now deletions now clear optimistic cards immediately and roll back if the delete fails
- Post Now now guards against double-post clicks per pending event
- Restore count now refreshes when returning to Manage Profiles
- Added missing translation keys for JSON import/export and restore controls across all languages
- Pending edit time conversion now uses the main process timezone calculation
- Update check now only flags newer versions
- Modify Events profile load now respects the selected group when applying access rules

## [0.9.30] - 2026-01-15

### Fixed
- Update pill progress bar now adapts colors to match any theme (uses lighter/darker shade of theme color)
- Resync button disabled until initial sync completes
- Resync button disabled while update is downloading
- Updated Chinese Translations (Thank you Omoyx)

## [0.9.29] - 2026-01-10

### Changed
- Demo mode test data improvements for better translation testing and automation visualization
- Default Showcase pending events now accurately match hangout profile (category, languages, platforms, image, duration)
- Automation group profiles renamed to include timing info ("Weekly Session - 3 Days Before", "Bi-Weekly Session - 3 Days After", "Weekly Spotlight - Monthly on 11th")
- Automation groups now include 2-4 published events showing automation history and context
- Automation pending events expanded from 1 to 4 cards per group demonstrating repeating patterns
- Monthly automation fixed to show batch publishing: 4 weekly events per month all publishing on the same day (11th)
- Monthly automation pattern changed from "1st Saturday" to "every Saturday" for accurate weekly demonstration
- Demo build configuration changed from NSIS installer to portable standalone executable

## [0.9.28] - 2026-01-10

### Added
- Dutch (Nederlands) language support (Thanks Soupercore)
- nl_NL installer language option


## [0.9.27] - 2026-01-09

### Fixed
- Better rate limit handling and helper text for edge cases where pending/scheduled automations are queued and waiting for rate limits to lift. 

## [0.9.26] - 2026-01-09

### Security
- Enhanced file system write validation for debug logs with content sanitization
- Added comprehensive security validation for gallery image downloads
  - URL restricted to trusted VRChat CDN domains only
  - Content-Type validation ensures image files only
  - File size limited to 10MB maximum
  - Magic byte verification confirms valid image formats (PNG, JPEG, WebP)
  - Path traversal protection via normalized path checking

### Fixed
- Removed unused duplicate `resetAutomationForm` function from app.js
- Added CodeQL suppression comments for validated file operations

## [0.9.25] - 2026-01-09

### Fixed
- Comprehensive translation audit and cleanup across all 9 language files
- Added missing `common.months` sections to Spanish, French, Russian, Japanese, Korean, Portuguese, and Chinese
- Removed orphaned field duplicate keys from Japanese, Korean, Portuguese, Russian, and Chinese files
- Removed extra translation keys not present in English reference file (editButton, deleteButton, save, delete)
- Fixed duplicate `profiles.patterns.format` object in German translation
- Standardized indentation to 2 spaces in languageSetup and gallery sections across all files
- All translation files now match English structure for consistency

## [0.9.24] - 2026-01-09
Feature Complete Release!

### Added
- **Event Automation System (Experimental)** - Automatically post events based on profile patterns
  - Three timing modes: "Before event starts", "After previous event ends", "Monthly on specific day"
  - Configurable offset timing (days/hours/minutes before or after)
  - Repeat modes: indefinite or fixed count
  - Pending events view in Modify Events tab with "Scheduled" and "Missed" status indicators
  - Smart scheduling: checks for missed automations on app launch
  - Persistent storage of pending events and automation state
  - Manual override capability for individual pending events (edit title, description, time, etc.)
  - Post now, reschedule, or cancel actions for missed automations
  - Automatic retry logic with 15-minute delay on API failures
  - Dynamic event resolution: pulls latest profile data when posting
- Pending event display limit setting (default: 10 events shown)
- Monthly automation with intelligent date handling (days 29-31 use last day of shorter months)
- Visual indicators for pending vs missed automations
- Confirmation dialog when enabling automation with disclaimer about app requirements

### Changed
- Profile management UI expanded with automation configuration panel
- Modify Events tab now includes "Show Pending" toggle to view automated events
- Automation state persisted separately from profiles for tracking created event counts
- Pattern-based date generation extended to 3 months for automation scheduling
- Pending events stored with profile references rather than full event data (dynamic resolution)

### Fixed
- Added missing `common.months` translation section to German (de.js)
- Fixed French typo: "Mise ? jour" → "Mise à jour"
- Standardized German automation keys to match English structure
- Cleaned up translation redundancies across all language files
- Translation coverage for all automation-related UI strings across 9 languages

## [0.9.23] - 2026-01-07

### Added
- Optional conflict warning toggle in event creation wizard (default: off)
- Minimize to system tray feature with first-time confirmation dialog
- System tray icon with Show/Quit menu options

### Changed
- Settings file now only stores application preferences

### Fixed
- Event creation button properly locks during creation to prevent duplicates
- Local event tracking handles VRChat API delay for conflict detection
- Tray prompt dialog button layout and spacing improved
- App quit behavior from tray prompt now works correctly

## [0.9.22] - 2026-01-06

### Changed
- Version bump

## [0.9.21] - 2026-01-06

### Changed
- Installer now shows setup wizard with directory selection instead of silent auto-install
- Auto-updates no longer download automatically; user must click update pill to start download

## [0.9.20] - 2026-01-06

### Fixed
- Update checks no longer block app startup, improving launch performance
- Removed dead code validation checks flagged by CodeQL analysis
- Removed unused variable in rate limit error handling

## [0.9.19] - 2026-01-06

### Added
- Optimistic event deletion with instant UI feedback (events disappear immediately)
- Automatic rollback if deletion fails on backend
- Tombstone tracking to prevent deleted events from reappearing (60-second filter)
- Exponential backoff for refresh button rate limiting (2s → 60s sequence)
- Visual countdown timer on refresh button during rate limit backoff
- Race condition prevention in modify events refresh logic
- Resync functionality via status pill (hover shows "Resync" when online, click to sync data)
- Green pulsing animation on status pill when update is ready to install
- Improved status pill accessibility (clickable when online, disabled when offline)
- WCAG-compliant contrast checking for update pill colors

### Changed
- Event deletion now provides immediate visual feedback before backend confirmation
- Refresh button respects 10-second deduplication window before allowing cache bypass
- Scroll position maintained when deleting events or refreshing event list
- Disabled event conflict detection backend logic (assumes user intent for duplicate time slots)
- Status pill now interactive when online (hover for resync, click to sync groups/profiles)
- Update pill colors now use theme accent with automatic fallback if contrast too low
- Restart pill displays in green with pulsing shadow animation
- Status pill transitions smoothly between states (online/update/downloading/restart)

### Fixed
- Ghost events no longer remain visible after deletion
- Multiple rapid refresh clicks no longer cause race conditions
- Scroll position no longer resets to top after deletions or refreshes
- 429 rate limit errors now trigger appropriate backoff delays
- Status pill color contrast issues with certain custom themes
- Update progress bar visual clarity during download phase

## [0.9.18] - 2026-01-06

### Added
- Request caching system to prevent redundant API calls (15-minute cache for failed 403/404 requests)
- Request deduplication for concurrent identical GET requests (10-second window)
- Hourly event creation tracking with persistent storage (tracks last hour of activity)
- Event metadata tracking (createdAt, createdById) for better history management
- Rate limiting protection for gallery uploads
- Client-side enforcement of VRChat's 10 events per group per hour limit

### Changed
- Event creation limit changed from "10 upcoming events" to "10 events per hour per group"
- Upcoming event counter now shows hourly creation count instead of total upcoming events
- Event creation now blocks temporarily when hourly limit is reached
- History merging from server events to maintain accurate hourly counts

### Fixed
- Reduced unnecessary API calls through intelligent caching and deduplication
- Improved rate limit error handling across event creation and gallery uploads
- Better user feedback when hitting rate limits
- Events created on VRChat website now correctly count toward hourly limit

## [0.9.17] - 2026-01-06

### Added
- Silent auto-update with progress indicator (pill shows "Updating XX%" during download)
- Fynn theme with orange accent and bioluminescent-style grid
- Multilingual installer support (auto-detects system language)

### Changed
- Updates now download automatically in background
- Update pill changes: "Update" → "Updating XX%" → "Restart"
- One-click silent installer (no setup wizard on updates)

### Fixed
- Theme seeding now tracks keys properly (new themes get added, deleted themes stay deleted)


## [0.9.16] - 2026-01-06

### Added
- Fynn theme

### Fixed
- Theme seeding now tracks keys properly (new themes get added, deleted themes stay deleted)


## [0.9.14] - 2026-01-06

### Added
- Auto-update functionality with electron-updater (click Update pill to download and install)
- Automated build and release workflow via GitHub Actions
- Linux AppImage build support

### Changed
- Windows build now uses NSIS installer instead of portable
- Dynamic repo configuration for fork support

## [0.9.0] - 2026-01-02

Fully functional release of VRC Event Creator.

Waiting for feedback and translation reviews before version 1.0.0 is finalized.

- Added Optional Role Restrictions for Group-only Access events.
