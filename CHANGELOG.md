# Changelog

All notable changes to VRChat Event Creator will be documented in this file.

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

## [0.9.7] - 2026-01-06

Fully functional release of VRC Event Creator.

Waiting for feedback and translation reviews before version 1.0.0 is finalized.

- Added Optional Role Restrictions for Group-only Access events.
