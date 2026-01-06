# Changelog

All notable changes to VRChat Event Creator will be documented in this file.

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
- Fynn theme with orange accent and bioluminescent-style grid

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
