/**
 * Automation Engine for VRC Event Creator
 * Handles automated event posting based on profile patterns
 */

const fs = require("fs");
const { generateDateOptionsFromPatterns } = require("./date-utils");

// In-memory job storage
const scheduledJobs = new Map(); // pendingEventId -> timeoutId
let pendingEvents = [];
let deletedEvents = []; // Soft-deleted events that can be restored
let pendingSettings = { displayLimit: 10 };
let automationState = { profiles: {} };
let initialized = false;

// File paths (set by init)
let PENDING_EVENTS_PATH = null;
let AUTOMATION_STATE_PATH = null;

// Callbacks (set by init)
let createEventFn = null;
let onMissedEvent = null;
let onEventCreated = null;
let debugLogFn = () => {};
let profilesRef = null;
let knownGroupIds = null;

// Rate limiting constants
const EVENT_HOURLY_LIMIT = 10;
const EVENT_HOURLY_WINDOW_MS = 60 * 60 * 1000;
const BACKOFF_SEQUENCE = [2, 4, 8, 16, 32, 60]; // minutes, caps at 60
const VALID_PENDING_STATUSES = new Set(["scheduled", "missed", "queued", "published", "cancelled", "deleted"]);
const ACTIVE_PENDING_STATUSES = new Set(["scheduled", "missed", "queued"]);

// Rate limit tracking per group
const rateLimitState = {
  // groupId -> { history: [timestamps], backoffIndex: 0, lockUntil: null }
  groups: {},
  // Queue of pending posts: { pendingEventId, groupId, priority }
  queue: [],
  // Currently processing flag
  processing: false,
  // Processing timeout
  processTimeout: null
};

function getProfileStateKey(groupId, profileKey) {
  return `${groupId}::${profileKey}`;
}

function isKnownGroupId(groupId) {
  if (!knownGroupIds) {
    return true;
  }
  return knownGroupIds.has(groupId);
}

function getOrCreateProfileState(profileStateKey) {
  if (!automationState.profiles || typeof automationState.profiles !== "object") {
    automationState.profiles = {};
  }
  const existing = automationState.profiles[profileStateKey];
  if (existing && typeof existing === "object") {
    if (typeof existing.eventsCreated !== "number") {
      existing.eventsCreated = 0;
    }
    return existing;
  }
  const next = { eventsCreated: 0 };
  automationState.profiles[profileStateKey] = next;
  return next;
}

function setKnownGroupIds(groupIds) {
  if (!Array.isArray(groupIds)) {
    knownGroupIds = null;
    return { ok: true, removedPending: 0, removedDeleted: 0 };
  }

  knownGroupIds = new Set(groupIds.filter(Boolean));
  const removedPending = pendingEvents.filter(event => !isKnownGroupId(event.groupId));
  removedPending.forEach(event => cancelJob(event.id));

  const pendingBefore = pendingEvents.length;
  const deletedBefore = deletedEvents.length;

  if (removedPending.length) {
    pendingEvents = pendingEvents.filter(event => isKnownGroupId(event.groupId));
  }
  if (deletedEvents.length) {
    deletedEvents = deletedEvents.filter(event => isKnownGroupId(event.groupId));
  }

  const removedPendingCount = pendingBefore - pendingEvents.length;
  const removedDeletedCount = deletedBefore - deletedEvents.length;
  if (removedPendingCount || removedDeletedCount) {
    savePendingEvents();
    debugLogFn("Automation", `Pruned ${removedPendingCount} pending + ${removedDeletedCount} deleted for unknown groups`);
  }

  return { ok: true, removedPending: removedPendingCount, removedDeleted: removedDeletedCount };
}

function parseEventStartMs(value) {
  if (!value) {
    return null;
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function buildPendingEventId(groupId, profileKey, eventStartsAt) {
  const eventStartMs = parseEventStartMs(eventStartsAt);
  if (!groupId || !profileKey || eventStartMs === null) {
    return null;
  }
  return `pending_${groupId}_${profileKey}_${eventStartMs}`;
}

function parsePendingEventIdStartMs(value) {
  if (!value) {
    return null;
  }
  const parts = String(value).split("_");
  const last = parts[parts.length - 1];
  const ms = Number(last);
  return Number.isFinite(ms) ? ms : null;
}

function isDeterministicPendingId(value) {
  return parsePendingEventIdStartMs(value) !== null;
}

function getPendingSlotStartMs(event) {
  if (!event || typeof event !== "object") {
    return null;
  }
  return parsePendingEventIdStartMs(event.slotKey)
    ?? parsePendingEventIdStartMs(event.id);
}

function getRestoreStartMs(event) {
  if (!event || typeof event !== "object") {
    return null;
  }
  const slotStartMs = getPendingSlotStartMs(event);
  const currentStartMs = parseEventStartMs(event.eventStartsAt);
  if (
    slotStartMs !== null &&
    currentStartMs !== null &&
    slotStartMs !== currentStartMs &&
    event.manualOverrides?.eventStartsAt
  ) {
    return slotStartMs;
  }
  return currentStartMs ?? slotStartMs;
}

function derivePendingSlotKey(event) {
  if (!event || typeof event !== "object") {
    return null;
  }
  if (isDeterministicPendingId(event.id)) {
    return event.id;
  }
  return buildPendingEventId(event.groupId, event.profileKey, event.eventStartsAt);
}

function getPendingSlotKey(event) {
  if (!event || typeof event !== "object") {
    return null;
  }
  return event.slotKey || derivePendingSlotKey(event) || event.id || null;
}

function getPendingSlotKeys(event) {
  const keys = new Set();
  const primary = getPendingSlotKey(event);
  if (primary) {
    keys.add(primary);
  }
  const current = buildPendingEventId(event?.groupId, event?.profileKey, event?.eventStartsAt);
  if (current) {
    keys.add(current);
  }
  return Array.from(keys);
}

function hasActivePendingEvents(groupId, profileKey) {
  if (!groupId || !profileKey) {
    return false;
  }
  return pendingEvents.some(event =>
    event.groupId === groupId &&
    event.profileKey === profileKey &&
    ACTIVE_PENDING_STATUSES.has(event.status)
  );
}

function clearDeletedEventsForProfile(groupId, profileKey) {
  const before = deletedEvents.length;
  deletedEvents = deletedEvents.filter(e => !(e.groupId === groupId && e.profileKey === profileKey));
  return before - deletedEvents.length;
}

function clearProfileState(groupId, profileKey) {
  const profileStateKey = getProfileStateKey(groupId, profileKey);
  if (automationState?.profiles?.[profileStateKey]) {
    delete automationState.profiles[profileStateKey];
    saveAutomationState();
    return true;
  }
  return false;
}

function getActivationStartMs(profileState) {
  return parseEventStartMs(profileState?.activationStartsAt);
}

function getEarliestEventStartMs(events) {
  let earliest = null;
  events.forEach(event => {
    const fromStart = parseEventStartMs(event.eventStartsAt);
    const fromId = parsePendingEventIdStartMs(event.id);
    const ms = fromStart ?? fromId;
    if (!ms) {
      return;
    }
    if (earliest === null || ms < earliest) {
      earliest = ms;
    }
  });
  return earliest;
}

function isKnownProfile(groupId, profileKey) {
  if (!isKnownGroupId(groupId)) {
    return false;
  }
  if (!profilesRef || typeof profilesRef !== "object") {
    return true;
  }
  return Boolean(profilesRef[groupId]?.profiles?.[profileKey]);
}

function getPendingEventPriority(event) {
  if (!event || typeof event !== "object") {
    return 0;
  }
  if (event.status === "published") {
    return 100;
  }
  let score = 0;
  if (event.manualOverrides) {
    score += 50;
  }
  if (event.status === "queued") {
    score += 4;
  } else if (event.status === "scheduled") {
    score += 3;
  } else if (event.status === "missed") {
    score += 2;
  } else {
    score += 1;
  }
  return score;
}

function normalizePendingStore() {
  let changed = false;
  const nowMs = Date.now();
  const normalizedPending = [];
  const normalizedDeleted = [];

  const normalizeIdAndSlotKey = (event) => {
    const derivedSlotKey = derivePendingSlotKey(event);
    if (derivedSlotKey && event.slotKey !== derivedSlotKey) {
      event.slotKey = derivedSlotKey;
      changed = true;
    }
    if (!event.id || !isDeterministicPendingId(event.id)) {
      if (derivedSlotKey && event.id !== derivedSlotKey) {
        event.id = derivedSlotKey;
        changed = true;
      }
    }
    if (!event.id && derivedSlotKey) {
      event.id = derivedSlotKey;
      changed = true;
    }
  };

  const normalizeDeletedEvent = (raw) => {
    if (!raw || typeof raw !== "object") {
      changed = true;
      return null;
    }
    const event = { ...raw };
    if (!event.groupId || !event.profileKey) {
      changed = true;
      return null;
    }
    if (!isKnownProfile(event.groupId, event.profileKey)) {
      changed = true;
      return null;
    }
    if (!event.eventStartsAt && event.manualOverrides?.eventStartsAt) {
      event.eventStartsAt = event.manualOverrides.eventStartsAt;
      changed = true;
    }
    const eventStartMs = parseEventStartMs(event.eventStartsAt);
    if (eventStartMs === null || eventStartMs <= nowMs) {
      changed = true;
      return null;
    }
    if (event.status !== "deleted") {
      event.status = "deleted";
      changed = true;
    }
    normalizeIdAndSlotKey(event);
    return event;
  };

  const normalizePendingEvent = (raw) => {
    if (!raw || typeof raw !== "object") {
      changed = true;
      return null;
    }
    const event = { ...raw };
    if (!event.groupId || !event.profileKey) {
      changed = true;
      return null;
    }
    if (!isKnownProfile(event.groupId, event.profileKey)) {
      changed = true;
      return null;
    }
    if (!event.eventStartsAt && event.manualOverrides?.eventStartsAt) {
      event.eventStartsAt = event.manualOverrides.eventStartsAt;
      changed = true;
    }
    const eventStartMs = parseEventStartMs(event.eventStartsAt);
    if (eventStartMs === null) {
      changed = true;
      return null;
    }
    if (!event.status || typeof event.status !== "string" || !VALID_PENDING_STATUSES.has(event.status)) {
      event.status = "scheduled";
      changed = true;
    }
    if (event.status === "deleted") {
      const deletedEvent = normalizeDeletedEvent(event);
      if (deletedEvent) {
        normalizedDeleted.push(deletedEvent);
      }
      changed = true;
      return null;
    }
    if (event.status === "cancelled") {
      changed = true;
      return null;
    }
    if (event.manualOverrides && typeof event.manualOverrides !== "object") {
      event.manualOverrides = null;
      changed = true;
    }
    if (!event.scheduledPublishTime && event.status !== "published") {
      const profile = profilesRef?.[event.groupId]?.profiles?.[event.profileKey];
      const newPublishTime = calculatePublishTime(event.eventStartsAt, profile);
      if (newPublishTime) {
        event.scheduledPublishTime = newPublishTime.toISOString();
        changed = true;
      }
    }
    const publishMs = parseEventStartMs(event.scheduledPublishTime);
    if (event.status !== "published" && publishMs === null) {
      changed = true;
      return null;
    }
    normalizeIdAndSlotKey(event);
    return event;
  };

  pendingEvents.forEach(raw => {
    const event = normalizePendingEvent(raw);
    if (event) {
      normalizedPending.push(event);
    }
  });

  deletedEvents.forEach(raw => {
    const event = normalizeDeletedEvent(raw);
    if (event) {
      normalizedDeleted.push(event);
    }
  });

  const occupiedSlots = new Map();
  const keptEvents = new Set();

  const removeOccupiedByEvent = (target) => {
    for (const [key, value] of occupiedSlots.entries()) {
      if (value === target) {
        occupiedSlots.delete(key);
      }
    }
  };

  normalizedPending.forEach(event => {
    const slotKeys = getPendingSlotKeys(event);
    if (!slotKeys.length) {
      changed = true;
      return;
    }
    let existing = null;
    for (const key of slotKeys) {
      const occupied = occupiedSlots.get(key);
      if (occupied) {
        existing = occupied;
        break;
      }
    }
    if (!existing) {
      keptEvents.add(event);
      slotKeys.forEach(key => occupiedSlots.set(key, event));
      return;
    }
    if (getPendingEventPriority(event) > getPendingEventPriority(existing)) {
      removeOccupiedByEvent(existing);
      keptEvents.delete(existing);
      keptEvents.add(event);
      slotKeys.forEach(key => occupiedSlots.set(key, event));
      changed = true;
    } else {
      changed = true;
    }
  });

  const dedupedPending = Array.from(keptEvents);
  const pendingSlotKeys = new Set();
  dedupedPending.forEach(event => {
    getPendingSlotKeys(event).forEach(key => pendingSlotKeys.add(key));
  });

  const deletedOccupied = new Set();
  const keptDeleted = new Set();

  normalizedDeleted.forEach(event => {
    const slotKeys = getPendingSlotKeys(event);
    if (!slotKeys.length) {
      changed = true;
      return;
    }
    if (slotKeys.some(key => pendingSlotKeys.has(key))) {
      changed = true;
      return;
    }
    if (slotKeys.some(key => deletedOccupied.has(key))) {
      changed = true;
      return;
    }
    keptDeleted.add(event);
    slotKeys.forEach(key => deletedOccupied.add(key));
  });

  pendingEvents = dedupedPending;
  deletedEvents = Array.from(keptDeleted);
  return changed;
}

/**
 * Check if automation engine is initialized
 * @returns {boolean}
 */
function isInitialized() {
  return initialized;
}

/**
 * Initialize the automation engine
 * @param {object} config - Configuration object
 * @param {string} config.pendingEventsPath - Path to pending events JSON file
 * @param {string} config.automationStatePath - Path to automation state JSON file
 * @param {object} config.profiles - All profiles from main process
 * @param {function} config.createEventFn - Function to create an event via API
 * @param {function} config.onMissedEvent - Callback when an event is marked as missed
 * @param {function} config.onEventCreated - Callback when an event is successfully created
 * @param {function} config.debugLog - Debug logging function
 */
function initializeAutomation(config) {
  const {
    pendingEventsPath,
    automationStatePath,
    profiles,
    createEventFn: createFn,
    onMissedEvent: onMissed,
    onEventCreated: onCreate,
    debugLog
  } = config;

  PENDING_EVENTS_PATH = pendingEventsPath;
  AUTOMATION_STATE_PATH = automationStatePath;
  createEventFn = createFn;
  onMissedEvent = onMissed || (() => {});
  onEventCreated = onCreate || (() => {});
  debugLogFn = debugLog || (() => {});
  profilesRef = profiles;

  // Load existing state
  loadPendingEvents();
  loadAutomationState();

  // Check for missed events
  const now = Date.now();
  let missedCount = 0;
  for (const event of pendingEvents) {
    if (event.status === "scheduled") {
      const publishTime = new Date(event.scheduledPublishTime).getTime();
      if (publishTime <= now) {
        // Mark as missed
        event.status = "missed";
        event.missedAt = new Date().toISOString();
        missedCount++;
        // Notify about missed event
        onMissedEvent(event);
      }
    }
  }
  if (missedCount > 0) {
    savePendingEvents();
  }

  // Schedule future jobs
  for (const event of pendingEvents) {
    if (event.status === "scheduled") {
      scheduleJob(event);
    }
  }

  initialized = true;
  debugLogFn("Automation", `Initialized with ${pendingEvents.length} pending events, ${missedCount} missed`);
  return { pendingEvents, automationState };
}

/**
 * Load pending events from file
 */
function loadPendingEvents() {
  try {
    if (fs.existsSync(PENDING_EVENTS_PATH)) {
      const data = JSON.parse(fs.readFileSync(PENDING_EVENTS_PATH, "utf8"));
      pendingEvents = Array.isArray(data.events) ? data.events : [];
      deletedEvents = Array.isArray(data.deletedEvents) ? data.deletedEvents : [];
      if (data.settings && typeof data.settings === "object") {
        pendingSettings = { displayLimit: 10, ...data.settings };
      }

      // Clean up deleted events where eventStartsAt has passed (can never be restored)
      const now = new Date();
      deletedEvents = deletedEvents.filter(e => new Date(e.eventStartsAt) > now);

      const didNormalize = normalizePendingStore();
      if (didNormalize) {
        savePendingEvents();
        debugLogFn("Automation", `Normalized pending events: ${pendingEvents.length} pending, ${deletedEvents.length} deleted`);
      }
    } else {
      pendingEvents = [];
      deletedEvents = [];
    }
  } catch (err) {
    debugLogFn("Automation", "Failed to load pending events:", err);
    pendingEvents = [];
    deletedEvents = [];
  }
}

/**
 * Save pending events to file
 */
function savePendingEvents() {
  try {
    const data = {
      events: pendingEvents,
      deletedEvents: deletedEvents,
      settings: pendingSettings
    };
    fs.writeFileSync(PENDING_EVENTS_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    debugLogFn("Automation", "Failed to save pending events:", err);
  }
}

/**
 * Get pending events settings
 * @returns {object} Settings object
 */
function getPendingSettings() {
  return { ...pendingSettings };
}

/**
 * Update pending events settings
 * @param {object} newSettings - New settings to merge
 */
function updatePendingSettings(newSettings) {
  pendingSettings = { ...pendingSettings, ...newSettings };
  savePendingEvents();
}

/**
 * Load automation state from file
 */
function loadAutomationState() {
  try {
    if (fs.existsSync(AUTOMATION_STATE_PATH)) {
      automationState = JSON.parse(fs.readFileSync(AUTOMATION_STATE_PATH, "utf8"));
    } else {
      automationState = { profiles: {} };
    }
  } catch (err) {
    debugLogFn("Automation", "Failed to load automation state:", err);
    automationState = { profiles: {} };
  }
}

/**
 * Save automation state to file
 */
function saveAutomationState() {
  try {
    fs.writeFileSync(AUTOMATION_STATE_PATH, JSON.stringify(automationState, null, 2));
  } catch (err) {
    debugLogFn("Automation", "Failed to save automation state:", err);
  }
}

/**
 * Calculate pending events for a profile
 * @param {string} groupId - Group ID
 * @param {string} profileKey - Profile key
 * @param {object} profile - Profile data
 * @param {number} maxEvents - Maximum number of pending events to generate (default 10)
 * @param {object} options - Optional generation options
 * @param {number|null} options.minEventStartMs - Skip events on/before this UTC millis value
 * @returns {Array} Array of pending event objects
 */
function calculatePendingEvents(groupId, profileKey, profile, maxEvents = 10, options = {}) {
  if (!profile || !profile.automation?.enabled || !profile.patterns?.length) {
    return [];
  }

  const automation = profile.automation;
  const timezone = profile.timezone || "UTC";
  const minEventStartMs = Number.isFinite(options.minEventStartMs)
    ? options.minEventStartMs
    : null;

  // Generate date options from patterns (3 months ahead max)
  const dateOptions = generateDateOptionsFromPatterns(profile.patterns, 3, timezone);

  if (!dateOptions.length) {
    return [];
  }

  const newPendingEvents = [];
  const now = new Date();

  // Get existing pending events for this profile to check counts
  const profileStateKey = getProfileStateKey(groupId, profileKey);
  const profileState = getOrCreateProfileState(profileStateKey);

  // Check repeat limit
  if (automation.repeatMode === "count" && profileState.eventsCreated >= automation.repeatCount) {
    return []; // Limit reached
  }

  for (const dateOption of dateOptions) {
    if (newPendingEvents.length >= maxEvents) break;

    // Check repeat limit for count mode
    if (automation.repeatMode === "count") {
      const totalWillCreate = profileState.eventsCreated + newPendingEvents.length + 1;
      if (totalWillCreate > automation.repeatCount) break;
    }

    const eventStartTime = new Date(dateOption.iso);
    if (minEventStartMs !== null && eventStartTime.getTime() <= minEventStartMs) {
      continue;
    }
    let publishTime;

    // Calculate publish time based on timing mode
    if (automation.timingMode === "before") {
      // Publish X time before the event starts
      const offsetMs = (
        (automation.daysOffset || 0) * 24 * 60 * 60 * 1000 +
        (automation.hoursOffset || 0) * 60 * 60 * 1000 +
        (automation.minutesOffset || 0) * 60 * 1000
      );
      publishTime = new Date(eventStartTime.getTime() - offsetMs);
    } else if (automation.timingMode === "after") {
      // Publish X time after the previous event ends
      // For simplicity, use current time + offset for first event
      // or previous event end + offset for subsequent events
      const offsetMs = (
        (automation.daysOffset || 0) * 24 * 60 * 60 * 1000 +
        (automation.hoursOffset || 0) * 60 * 60 * 1000 +
        (automation.minutesOffset || 0) * 60 * 1000
      );

      if (newPendingEvents.length === 0) {
        // First pending event - use profile's last event end time or now
        const lastSuccess = profileState.lastSuccess ? new Date(profileState.lastSuccess) : now;
        const duration = (profile.duration || 120) * 60 * 1000;
        publishTime = new Date(lastSuccess.getTime() + duration + offsetMs);
      } else {
        // Subsequent events - use previous pending event's end time
        const prevEvent = newPendingEvents[newPendingEvents.length - 1];
        const prevEndTime = new Date(prevEvent.eventStartsAt);
        const duration = (profile.duration || 120) * 60 * 1000;
        publishTime = new Date(prevEndTime.getTime() + duration + offsetMs);
      }

      // Smart switching: if publish time is >50% toward next event, switch to "before" mode
      const nextEventTime = eventStartTime.getTime();
      const prevEventTime = newPendingEvents.length > 0
        ? new Date(newPendingEvents[newPendingEvents.length - 1].eventStartsAt).getTime()
        : now.getTime();
      const midpoint = prevEventTime + (nextEventTime - prevEventTime) / 2;

      if (publishTime.getTime() > midpoint) {
        // Switch to "before" mode
        const beforeOffset = (automation.daysOffset || 0) * 24 * 60 * 60 * 1000 +
          (automation.hoursOffset || 0) * 60 * 60 * 1000 +
          (automation.minutesOffset || 0) * 60 * 1000;
        publishTime = new Date(eventStartTime.getTime() - beforeOffset);
      }
    } else if (automation.timingMode === "monthly") {
      // Publish on specific day/time each month
      const eventMonth = eventStartTime.getMonth();
      const eventYear = eventStartTime.getFullYear();

      // Handle month-end dates intelligently
      // Days 29-31 should map to the last day of the month if that month doesn't have enough days
      let targetDay = automation.monthlyDay || 1;

      // Get the last day of the target month
      const lastDayOfMonth = new Date(eventYear, eventMonth + 1, 0).getDate();
      const publishDay = Math.min(targetDay, lastDayOfMonth);

      publishTime = new Date(
        eventYear,
        eventMonth,
        publishDay,
        automation.monthlyHour || 12,
        automation.monthlyMinute || 0,
        0,
        0
      );

      // If publish time is after event start, use previous month
      if (publishTime >= eventStartTime) {
        publishTime.setMonth(publishTime.getMonth() - 1);
        // Recalculate last day for the previous month
        const prevMonthLastDay = new Date(publishTime.getFullYear(), publishTime.getMonth() + 1, 0).getDate();
        publishTime.setDate(Math.min(targetDay, prevMonthLastDay));
      }
    }

    // Hard cap: publish time must be at least 30 minutes before event start
    const MIN_BUFFER_MS = 30 * 60 * 1000;
    const maxPublishTime = eventStartTime.getTime() - MIN_BUFFER_MS;
    if (publishTime.getTime() > maxPublishTime) {
      publishTime = new Date(maxPublishTime);
    }

    // Skip if publish time is in the past
    if (publishTime <= now) {
      continue;
    }

    // Create pending event object (dynamic - only store references, not full details)
    // Use deterministic ID based on groupId + profileKey + eventStartTime
    // This ensures the same pattern-slot always generates the same ID
    const slotKey = buildPendingEventId(groupId, profileKey, eventStartTime.toISOString());
    const pendingEvent = {
      id: slotKey || `pending_${groupId}_${profileKey}_${eventStartTime.getTime()}`,
      slotKey: slotKey || null,
      groupId,
      profileKey,
      scheduledPublishTime: publishTime.toISOString(),
      eventStartsAt: eventStartTime.toISOString(),
      manualOverrides: null,
      status: "scheduled",
      missedAt: null
    };

    newPendingEvents.push(pendingEvent);
  }

  return newPendingEvents;
}

function getRecheckIntervalMs(delayMs) {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  if (delayMs > 7 * ONE_DAY_MS) {
    return ONE_DAY_MS;
  }
  if (delayMs > 2 * ONE_DAY_MS) {
    return EIGHT_HOURS_MS;
  }
  if (delayMs > ONE_DAY_MS) {
    return TWO_HOURS_MS;
  }
  return null;
}

/**
 * Schedule a job to execute at the pending event's publish time
 * @param {object} pendingEvent - Pending event object
 */
function scheduleJob(pendingEvent) {
  const publishTime = new Date(pendingEvent.scheduledPublishTime).getTime();
  const now = Date.now();
  const delay = publishTime - now;

  // If already past, mark as missed
  if (delay <= 0) {
    pendingEvent.status = "missed";
    pendingEvent.missedAt = new Date().toISOString();
    savePendingEvents();
    onMissedEvent(pendingEvent);
    return;
  }

  // If more than 1 day away, recheck periodically to avoid missing publish times
  // Once within 1 day, schedule the exact time
  const recheckIntervalMs = getRecheckIntervalMs(delay);
  if (recheckIntervalMs) {
    const timeoutId = setTimeout(() => {
      // Reschedule with fresh timing
      scheduleJob(pendingEvent);
    }, recheckIntervalMs);
    scheduledJobs.set(pendingEvent.id, timeoutId);
    const profileLabel = pendingEvent.groupId && pendingEvent.profileKey
      ? `${pendingEvent.groupId}::${pendingEvent.profileKey}`
      : "unknown-profile";
    debugLogFn("Automation", `Scheduled recheck for ${pendingEvent.id} (${profileLabel}) in ${Math.round(recheckIntervalMs / 1000 / 60)} minutes (publish in ${Math.round(delay / 1000 / 60 / 60)} hours)`);
    return;
  }

  // Schedule the job
  const timeoutId = setTimeout(async () => {
    await executeAutomatedPost(pendingEvent);
  }, delay);

  scheduledJobs.set(pendingEvent.id, timeoutId);
  const profileLabel = pendingEvent.groupId && pendingEvent.profileKey
    ? `${pendingEvent.groupId}::${pendingEvent.profileKey}`
    : "unknown-profile";
  debugLogFn("Automation", `Scheduled job for ${pendingEvent.id} (${profileLabel}) in ${Math.round(delay / 1000 / 60)} minutes`);
}

/**
 * Cancel a scheduled job
 * @param {string} pendingEventId - ID of the pending event
 */
function cancelJob(pendingEventId) {
  const timeoutId = scheduledJobs.get(pendingEventId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledJobs.delete(pendingEventId);
  }

  // Also remove from rate limit queue
  dequeueEventPost(pendingEventId);
}

/**
 * Cancel all scheduled jobs
 */
function cancelAllJobs() {
  for (const timeoutId of scheduledJobs.values()) {
    clearTimeout(timeoutId);
  }
  scheduledJobs.clear();

  // Clear rate limit queue
  rateLimitState.queue = [];
  if (rateLimitState.processTimeout) {
    clearTimeout(rateLimitState.processTimeout);
    rateLimitState.processTimeout = null;
  }
  rateLimitState.processing = false;
}

/**
 * Cancel all jobs for a specific profile
 * @param {string} groupId - Group ID
 * @param {string} profileKey - Profile key
 */
function cancelJobsForProfile(groupId, profileKey) {
  const toCancel = pendingEvents
    .filter(e => e.groupId === groupId && e.profileKey === profileKey)
    .map(e => e.id);

  for (const id of toCancel) {
    cancelJob(id);
  }
}

function purgeProfilePendingEvents(groupId, profileKey) {
  if (!groupId || !profileKey) {
    return { ok: false, error: { message: "Missing groupId or profileKey" } };
  }

  cancelJobsForProfile(groupId, profileKey);

  const pendingBefore = pendingEvents.length;
  const deletedBefore = deletedEvents.length;

  pendingEvents = pendingEvents.filter(e => !(e.groupId === groupId && e.profileKey === profileKey));
  deletedEvents = deletedEvents.filter(e => !(e.groupId === groupId && e.profileKey === profileKey));

  const removedPending = pendingBefore - pendingEvents.length;
  const removedDeleted = deletedBefore - deletedEvents.length;

  if (removedPending || removedDeleted) {
    savePendingEvents();
  }

  const profileStateKey = getProfileStateKey(groupId, profileKey);
  if (automationState?.profiles?.[profileStateKey]) {
    delete automationState.profiles[profileStateKey];
    saveAutomationState();
  }

  debugLogFn("Automation", `Purged ${removedPending} pending + ${removedDeleted} deleted for ${groupId}::${profileKey}`);
  return { ok: true, removedPending, removedDeleted };
}

/**
 * Resolve event details from profile at runtime
 * Pulls latest profile data and applies manual overrides
 * @param {string} pendingEventId - ID of the pending event
 * @param {object} profiles - Current profiles data (optional, uses stored ref if not provided)
 * @returns {object|null} Resolved event details or null if profile not found
 */
function resolveEventDetails(pendingEventId, profiles = null) {
  const profilesData = profiles || profilesRef;
  const pendingEvent = pendingEvents.find(e => e.id === pendingEventId);

  if (!pendingEvent) {
    return null;
  }

  const profile = profilesData?.[pendingEvent.groupId]?.profiles?.[pendingEvent.profileKey];
  if (!profile) {
    return null;
  }

  // Start with profile data
  // Construct image URL from imageId if available
  const imageId = profile.imageId || null;
  let imageUrl = profile.imageUrl || null;
  if (imageId && !imageUrl) {
    // VRChat gallery image URL format
    imageUrl = `https://api.vrchat.cloud/api/1/file/${imageId}/1`;
  }

  const eventDetails = {
    title: profile.name || "Untitled Event",
    description: profile.description || "",
    category: profile.category || "hangout",
    accessType: profile.accessType || "public",
    languages: Array.isArray(profile.languages) ? [...profile.languages] : [],
    platforms: Array.isArray(profile.platforms) ? [...profile.platforms] : [],
    tags: Array.isArray(profile.tags) ? [...profile.tags] : [],
    imageId,
    imageUrl,
    roleIds: Array.isArray(profile.roleIds) ? [...profile.roleIds] : [],
    sendCreationNotification: profile.sendNotification ?? false
  };

  // Apply manual overrides if any
  if (pendingEvent.manualOverrides && typeof pendingEvent.manualOverrides === "object") {
    Object.entries(pendingEvent.manualOverrides).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        eventDetails[key] = value;
      }
    });
  }

  // Use overridden eventStartsAt if provided, otherwise use pending event's original
  const eventStartsAt = pendingEvent.manualOverrides?.eventStartsAt || pendingEvent.eventStartsAt;

  // Use overridden duration/timezone if provided
  const duration = pendingEvent.manualOverrides?.durationMinutes || profile.duration || 120;
  const timezone = pendingEvent.manualOverrides?.timezone || profile.timezone || "UTC";

  return {
    ...eventDetails,
    duration,
    timezone,
    eventStartsAt,
    scheduledPublishTime: pendingEvent.scheduledPublishTime
  };
}

/**
 * Get or initialize rate limit state for a group
 * @param {string} groupId - Group ID
 * @returns {object} Rate limit state for the group
 */
function getRateLimitState(groupId) {
  if (!rateLimitState.groups[groupId]) {
    rateLimitState.groups[groupId] = {
      history: [],
      backoffIndex: 0,
      lockUntil: null
    };
  }
  return rateLimitState.groups[groupId];
}

/**
 * Prune old timestamps from rate limit history
 * @param {string} groupId - Group ID
 */
function pruneRateLimitHistory(groupId) {
  const state = getRateLimitState(groupId);
  const cutoff = Date.now() - EVENT_HOURLY_WINDOW_MS;
  state.history = state.history.filter(ts => ts >= cutoff);
}

/**
 * Check if group is currently rate limited
 * @param {string} groupId - Group ID
 * @returns {boolean} True if rate limited
 */
function isGroupRateLimited(groupId) {
  const state = getRateLimitState(groupId);

  // Check explicit lock
  if (state.lockUntil && Date.now() < state.lockUntil) {
    return true;
  }

  // Clear expired lock
  if (state.lockUntil && Date.now() >= state.lockUntil) {
    state.lockUntil = null;
    state.backoffIndex = 0; // Reset backoff on lock expiry
  }

  // Check hourly limit
  pruneRateLimitHistory(groupId);
  return state.history.length >= EVENT_HOURLY_LIMIT;
}

/**
 * Get remaining time until rate limit expires
 * @param {string} groupId - Group ID
 * @returns {number} Milliseconds until rate limit expires, or 0
 */
function getRateLimitWaitMs(groupId) {
  const state = getRateLimitState(groupId);

  // Check explicit lock
  if (state.lockUntil) {
    const waitMs = state.lockUntil - Date.now();
    return Math.max(0, waitMs);
  }

  // Check hourly limit
  pruneRateLimitHistory(groupId);
  if (state.history.length >= EVENT_HOURLY_LIMIT) {
    // Wait until oldest entry expires
    const oldest = Math.min(...state.history);
    const expiresAt = oldest + EVENT_HOURLY_WINDOW_MS;
    const waitMs = expiresAt - Date.now();
    return Math.max(0, waitMs);
  }

  return 0;
}

/**
 * Record successful event creation for rate limiting
 * @param {string} groupId - Group ID
 */
function recordEventCreation(groupId) {
  const state = getRateLimitState(groupId);
  state.history.push(Date.now());
  pruneRateLimitHistory(groupId);

  // Reset backoff on success
  state.backoffIndex = 0;

  debugLogFn("Automation", `Recorded event for ${groupId}, count: ${state.history.length}/${EVENT_HOURLY_LIMIT}`);
}

/**
 * Handle rate limit error (429 response)
 * @param {string} groupId - Group ID
 */
function handleRateLimitError(groupId) {
  const state = getRateLimitState(groupId);

  // Check if we've already hit the known 10/hour limit
  pruneRateLimitHistory(groupId);
  if (state.history.length >= EVENT_HOURLY_LIMIT) {
    // Lock until oldest entry expires
    const oldest = Math.min(...state.history);
    state.lockUntil = oldest + EVENT_HOURLY_WINDOW_MS;
    debugLogFn("Automation", `Hit 10/hour limit for ${groupId}, locked until ${new Date(state.lockUntil).toISOString()}`);
  } else {
    // Cross-platform or unknown limit - use exponential backoff
    const backoffMinutes = BACKOFF_SEQUENCE[state.backoffIndex];
    state.backoffIndex = Math.min(state.backoffIndex + 1, BACKOFF_SEQUENCE.length - 1);
    state.lockUntil = Date.now() + (backoffMinutes * 60 * 1000);
    debugLogFn("Automation", `Rate limit error for ${groupId}, backoff ${backoffMinutes}min until ${new Date(state.lockUntil).toISOString()}`);
  }
}

/**
 * Add event to queue for rate-limited posting
 * @param {string} pendingEventId - Pending event ID
 * @param {string} groupId - Group ID
 * @param {number} priority - Priority (timestamp of event start, lower = sooner)
 */
function queueEventPost(pendingEventId, groupId, priority) {
  // Check if already in queue
  if (rateLimitState.queue.some(item => item.pendingEventId === pendingEventId)) {
    return;
  }

  rateLimitState.queue.push({ pendingEventId, groupId, priority });

  // Sort by priority (soonest event start times first)
  rateLimitState.queue.sort((a, b) => a.priority - b.priority);

  debugLogFn("Automation", `Queued ${pendingEventId} for ${groupId}, queue length: ${rateLimitState.queue.length}`);

  // Start processing if not already running
  processQueue();
}

/**
 * Remove event from queue
 * @param {string} pendingEventId - Pending event ID
 */
function dequeueEventPost(pendingEventId) {
  const index = rateLimitState.queue.findIndex(item => item.pendingEventId === pendingEventId);
  if (index !== -1) {
    rateLimitState.queue.splice(index, 1);
    debugLogFn("Automation", `Removed ${pendingEventId} from queue, remaining: ${rateLimitState.queue.length}`);
  }
}

/**
 * Process the queue of pending event posts
 */
async function processQueue() {
  // Already processing
  if (rateLimitState.processing) {
    return;
  }

  // Queue is empty
  if (rateLimitState.queue.length === 0) {
    return;
  }

  rateLimitState.processing = true;

  try {
    while (rateLimitState.queue.length > 0) {
      const item = rateLimitState.queue[0]; // Peek at next item

      // Check if group is rate limited
      if (isGroupRateLimited(item.groupId)) {
        const waitMs = getRateLimitWaitMs(item.groupId);
        debugLogFn("Automation", `Group ${item.groupId} rate limited, waiting ${Math.round(waitMs / 1000)}s`);

        // Schedule retry
        if (rateLimitState.processTimeout) {
          clearTimeout(rateLimitState.processTimeout);
        }
        rateLimitState.processTimeout = setTimeout(() => {
          rateLimitState.processTimeout = null;
          processQueue();
        }, waitMs + 100);

        break; // Stop processing, will resume after wait
      }

      // Remove from queue (we're processing it now)
      rateLimitState.queue.shift();

      // Find the pending event
      const pendingEvent = pendingEvents.find(e => e.id === item.pendingEventId);
      if (!pendingEvent) {
        debugLogFn("Automation", `Pending event ${item.pendingEventId} not found, skipping`);
        continue;
      }

      // Check if it's still scheduled (not cancelled/published)
      if (pendingEvent.status !== "scheduled" && pendingEvent.status !== "missed" && pendingEvent.status !== "queued") {
        debugLogFn("Automation", `Pending event ${item.pendingEventId} status is ${pendingEvent.status}, skipping`);
        continue;
      }

      // Mark as scheduled before execution (in case it was queued)
      if (pendingEvent.status === "queued") {
        pendingEvent.status = "scheduled";
      }

      // Execute the post
      await executeAutomatedPostInternal(pendingEvent);

      // Small delay between posts (100ms)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } finally {
    rateLimitState.processing = false;
  }

  // If queue still has items, schedule another processing run
  if (rateLimitState.queue.length > 0) {
    if (rateLimitState.processTimeout) {
      clearTimeout(rateLimitState.processTimeout);
    }
    rateLimitState.processTimeout = setTimeout(() => {
      rateLimitState.processTimeout = null;
      processQueue();
    }, 1000);
  }
}

/**
 * Internal function to execute automated post (called by queue processor)
 * @param {object} pendingEvent - Pending event object
 */
async function executeAutomatedPostInternal(pendingEvent) {
  debugLogFn("Automation", `Executing automated post for ${pendingEvent.id}`);

  try {
    // Resolve event details dynamically from profile
    const eventDetails = resolveEventDetails(pendingEvent.id);
    if (!eventDetails) {
      debugLogFn("Automation", `Could not resolve event details for ${pendingEvent.id} - profile may have been deleted`);
      pendingEvent.status = "cancelled";
      savePendingEvents();
      return;
    }

    // Calculate end time
    const startTime = new Date(pendingEvent.eventStartsAt);
    const durationMs = (eventDetails.duration || 120) * 60 * 1000;
    const endTime = new Date(startTime.getTime() + durationMs);

    // Call the event creation function
    const result = await createEventFn(
      pendingEvent.groupId,
      eventDetails,
      startTime.toISOString(),
      endTime.toISOString()
    );

      if (result.ok) {
        // Record successful creation for rate limiting
        recordEventCreation(pendingEvent.groupId);

        // Update pending event status
        pendingEvent.eventId = result.eventId || pendingEvent.eventId || null;
        pendingEvent.status = "published";

      // Update automation state
      const profileStateKey = getProfileStateKey(pendingEvent.groupId, pendingEvent.profileKey);
      const profileState = getOrCreateProfileState(profileStateKey);
      profileState.eventsCreated += 1;
      if (getActivationStartMs(profileState) === null && pendingEvent.eventStartsAt) {
        profileState.activationStartsAt = pendingEvent.eventStartsAt;
      }
      profileState.lastSuccess = new Date().toISOString();
      profileState.lastEventId = result.eventId;

      saveAutomationState();
      savePendingEvents();

      debugLogFn("Automation", `Successfully created event for ${pendingEvent.id}`);
      onEventCreated(pendingEvent, result.eventId);
    } else {
      // Check if it's a rate limit error
      const isRateLimit = result.error?.code === "UPCOMING_LIMIT" ||
                          result.error?.status === 429 ||
                          (result.error?.message && result.error.message.toLowerCase().includes("rate limit"));

      if (isRateLimit) {
        debugLogFn("Automation", `Rate limit hit for ${pendingEvent.id}`);
        handleRateLimitError(pendingEvent.groupId);

        // Mark as queued (distinct from "missed")
        pendingEvent.status = "queued";
        pendingEvent.queuedAt = new Date().toISOString();
        savePendingEvents();

        // Re-queue this event
        const priority = new Date(pendingEvent.eventStartsAt).getTime();
        queueEventPost(pendingEvent.id, pendingEvent.groupId, priority);
      } else {
        // Non-rate-limit failure - schedule retry with 15min delay
        debugLogFn("Automation", `Failed to create event: ${result.error?.message || "Unknown error"}`);
        scheduleRetry(pendingEvent);
      }
    }
  } catch (err) {
    debugLogFn("Automation", `Error executing automated post: ${err.message}`);
    scheduleRetry(pendingEvent);
  }
}

/**
 * Execute an automated event post (public wrapper that uses queue)
 * @param {object} pendingEvent - Pending event object
 */
async function executeAutomatedPost(pendingEvent) {
  // Queue the event for rate-limited posting
  const priority = new Date(pendingEvent.eventStartsAt).getTime();
  queueEventPost(pendingEvent.id, pendingEvent.groupId, priority);
}

/**
 * Schedule a retry for a failed job
 * @param {object} pendingEvent - Pending event object
 */
function scheduleRetry(pendingEvent) {
  const RETRY_DELAY = 15 * 60 * 1000; // 15 minutes

  const timeoutId = setTimeout(async () => {
    await executeAutomatedPost(pendingEvent);
  }, RETRY_DELAY);

  scheduledJobs.set(pendingEvent.id, timeoutId);
  debugLogFn("Automation", `Scheduled retry for ${pendingEvent.id} in 15 minutes`);
}

/**
 * Handle a missed pending event
 * @param {string} pendingEventId - ID of the pending event
 * @param {string} action - Action to take: "postNow", "reschedule", "cancel"
 */
async function handleMissedEvent(pendingEventId, action) {
  const eventIndex = pendingEvents.findIndex(e => e.id === pendingEventId);
  if (eventIndex === -1) {
    return { ok: false, error: { message: "Pending event not found" } };
  }

  const pendingEvent = pendingEvents[eventIndex];

  if (action === "postNow") {
    // Prevent posting if event is queued (waiting for rate limits)
    if (pendingEvent.status === "queued") {
      return { ok: false, error: { message: "Event is queued waiting for rate limits to clear. Please wait." } };
    }

    // Execute immediately
    pendingEvent.status = "scheduled"; // Reset status for execution
    await executeAutomatedPost(pendingEvent);
    return { ok: true };
  } else if (action === "reschedule") {
    // Recalculate publish time
    const profile = profilesRef?.[pendingEvent.groupId]?.profiles?.[pendingEvent.profileKey];
    if (!profile || !profile.automation?.enabled) {
      return { ok: false, error: { message: "Profile not found or automation disabled" } };
    }

    // Calculate new publish time based on current time and automation settings
    const automation = profile.automation;
    const eventStartTime = new Date(pendingEvent.eventStartsAt);
    const now = new Date();

    let newPublishTime;
    if (automation.timingMode === "before") {
      const offsetMs = (
        (automation.daysOffset || 0) * 24 * 60 * 60 * 1000 +
        (automation.hoursOffset || 0) * 60 * 60 * 1000 +
        (automation.minutesOffset || 0) * 60 * 1000
      );
      newPublishTime = new Date(eventStartTime.getTime() - offsetMs);

      // If still in the past, set to now + 5 minutes
      if (newPublishTime <= now) {
        newPublishTime = new Date(now.getTime() + 5 * 60 * 1000);
      }
    } else {
      // For other modes, just set to 5 minutes from now
      newPublishTime = new Date(now.getTime() + 5 * 60 * 1000);
    }

    pendingEvent.scheduledPublishTime = newPublishTime.toISOString();
    pendingEvent.status = "scheduled";
    pendingEvent.missedAt = null;

    savePendingEvents();
    scheduleJob(pendingEvent);

    return { ok: true };
    } else if (action === "cancel") {
      // Soft-delete: move to deletedEvents array instead of permanently removing
      const { groupId, profileKey } = pendingEvent;
      cancelJob(pendingEventId);
      const deletedEvent = pendingEvents.splice(eventIndex, 1)[0];
      deletedEvent.status = "deleted";
      deletedEvent.deletedAt = new Date().toISOString();
      deletedEvents.push(deletedEvent);

      let automationCleared = false;
      if (!hasActivePendingEvents(groupId, profileKey)) {
        const removed = clearDeletedEventsForProfile(groupId, profileKey);
        const stateCleared = clearProfileState(groupId, profileKey);
        automationCleared = removed > 0 || stateCleared;
        if (removed || stateCleared) {
          debugLogFn(
            "Automation",
            `Cleared ${removed} deleted events after last pending deletion for ${groupId}::${profileKey}`
          );
        }
      }

      savePendingEvents();
      return { ok: true, automationCleared, groupId, profileKey };
    }

  return { ok: false, error: { message: "Unknown action" } };
}

/**
 * Get all pending events, optionally filtered by group
 * @param {string} groupId - Optional group ID to filter by
 * @returns {Array} Array of pending events
 */
function getPendingEvents(groupId = null) {
  if (groupId) {
    return pendingEvents.filter(e => e.groupId === groupId && e.status !== "cancelled" && e.status !== "published");
  }
  return pendingEvents.filter(e => e.status !== "cancelled" && e.status !== "published");
}

/**
 * Get missed events count (truly missed, not queued)
 * @param {string} groupId - Optional group ID to filter by
 * @returns {number} Count of missed pending events
 */
function getMissedCount(groupId = null) {
  if (groupId) {
    return pendingEvents.filter(e => e.groupId === groupId && e.status === "missed").length;
  }
  return pendingEvents.filter(e => e.status === "missed").length;
}

/**
 * Get queued events count (waiting for rate limits)
 * @param {string} groupId - Optional group ID to filter by
 * @returns {number} Count of queued pending events
 */
function getQueuedCount(groupId = null) {
  if (groupId) {
    return pendingEvents.filter(e => e.groupId === groupId && e.status === "queued").length;
  }
  return pendingEvents.filter(e => e.status === "queued").length;
}

/**
 * Update or add pending events for a profile
 * @param {string} groupId - Group ID
 * @param {string} profileKey - Profile key
 * @param {object} profile - Profile data
 */
function updatePendingEventsForProfile(groupId, profileKey, profile) {
  if (!isKnownGroupId(groupId)) {
    debugLogFn("Automation", `Skipping pending updates for unknown group ${groupId}::${profileKey}`);
    purgeProfilePendingEvents(groupId, profileKey);
    return;
  }
  // Update profiles reference
  if (profilesRef && profilesRef[groupId]) {
    if (!profilesRef[groupId].profiles) {
      profilesRef[groupId].profiles = {};
    }
    profilesRef[groupId].profiles[profileKey] = profile;
  }

  const profileStateKey = getProfileStateKey(groupId, profileKey);
  const profileState = getOrCreateProfileState(profileStateKey);

  // Get existing events for this profile
  const existingEvents = pendingEvents.filter(e =>
    e.groupId === groupId && e.profileKey === profileKey
  );

  // Get slot keys of manually modified events (these should NEVER be recreated)
  const modifiedEventSlots = new Set();
  existingEvents
    .filter(e => e.manualOverrides)
    .forEach(event => {
      getPendingSlotKeys(event).forEach(key => modifiedEventSlots.add(key));
    });

  // Get slot keys of published events (these should never be recreated)
  const publishedEventSlots = new Set();
  existingEvents
    .filter(e => e.status === "published")
    .forEach(event => {
      getPendingSlotKeys(event).forEach(key => publishedEventSlots.add(key));
    });

  // Get slot keys of deleted events (these should not be recreated)
  const deletedEventSlots = new Set();
  deletedEvents
    .filter(e => e.groupId === groupId && e.profileKey === profileKey)
    .forEach(event => {
      getPendingSlotKeys(event).forEach(key => deletedEventSlots.add(key));
    });

  // Cancel existing jobs for this profile (only non-modified ones will be replaced)
  for (const event of existingEvents) {
    if (!event.manualOverrides) {
      cancelJob(event.id);
    }
  }

  // Remove only auto-generated events (keep manually modified ones)
  pendingEvents = pendingEvents.filter(e =>
    !(e.groupId === groupId && e.profileKey === profileKey && !e.manualOverrides && e.status !== "published")
  );

  // If automation is disabled, just save and return
  if (!profile?.automation?.enabled) {
    savePendingEvents();
    debugLogFn("Automation", `Automation disabled for ${groupId}::${profileKey}, cleared pending events`);
    return;
  }

  const hasExistingPending = existingEvents.length > 0;
  let anchorMs = getActivationStartMs(profileState);
  if (anchorMs === null && hasExistingPending) {
    anchorMs = getEarliestEventStartMs(existingEvents);
    if (anchorMs !== null) {
      profileState.activationStartsAt = new Date(anchorMs).toISOString();
      saveAutomationState();
    }
  }

  if (!hasExistingPending && anchorMs === null) {
    // Don't generate pending events until the profile is activated by a manual event
    savePendingEvents();
    debugLogFn("Automation", `No pending events generated for ${groupId}::${profileKey} - waiting for first manual event`);
    return;
  }

  // Calculate new pending events (with deterministic IDs)
  const newEvents = calculatePendingEvents(groupId, profileKey, profile, 10, { minEventStartMs: anchorMs });

  // Filter out events whose ID matches:
  // 1. A modified event (already exists, user customized it)
  // 2. A deleted event (user explicitly removed it)
  // 3. A published event (already posted)
  const filteredNewEvents = newEvents.filter(e =>
    !modifiedEventSlots.has(getPendingSlotKey(e)) &&
    !deletedEventSlots.has(getPendingSlotKey(e)) &&
    !publishedEventSlots.has(getPendingSlotKey(e))
  );

  // Add new events (modified events remain untouched in pendingEvents)
  pendingEvents.push(...filteredNewEvents);
  savePendingEvents();

  // Schedule jobs for new events
  for (const event of filteredNewEvents) {
    scheduleJob(event);
  }

  const modifiedCount = existingEvents.filter(e => e.manualOverrides).length;
  debugLogFn("Automation", `Updated pending events for ${groupId}::${profileKey}, ${filteredNewEvents.length} new + ${modifiedCount} modified preserved`);
}

function recordManualEvent(groupId, profileKey, eventStartsAt) {
  if (!isKnownGroupId(groupId)) {
    debugLogFn("Automation", `Skipping manual event seed for unknown group ${groupId}::${profileKey}`);
    return false;
  }
  const eventStartMs = parseEventStartMs(eventStartsAt);
  if (eventStartMs === null) {
    debugLogFn("Automation", `Skipping manual event seed for ${groupId}::${profileKey} - invalid start time`);
    return false;
  }

  const profileStateKey = getProfileStateKey(groupId, profileKey);
  const profileState = getOrCreateProfileState(profileStateKey);
  const existingStartMs = getActivationStartMs(profileState);
  if (existingStartMs !== null && existingStartMs <= eventStartMs) {
    return false;
  }

  profileState.activationStartsAt = new Date(eventStartMs).toISOString();
  saveAutomationState();
  debugLogFn("Automation", `Seeded automation for ${groupId}::${profileKey} at ${profileState.activationStartsAt}`);
  return true;
}

/**
 * Update manual overrides for a pending event
 * @param {string} pendingEventId - ID of the pending event
 * @param {object} overrides - Manual override fields
 */
function updatePendingEventOverrides(pendingEventId, overrides) {
  const event = pendingEvents.find(e => e.id === pendingEventId);
  if (!event) {
    return { ok: false, error: { message: "Pending event not found" } };
  }

  const previousEventStartsAt = event.eventStartsAt;
  if (!event.slotKey) {
    const derivedSlotKey = derivePendingSlotKey(event);
    if (derivedSlotKey) {
      event.slotKey = derivedSlotKey;
    }
  }
  event.manualOverrides = overrides;

  // If eventStartsAt is overridden, also update the main field for display
  if (overrides?.eventStartsAt) {
    event.eventStartsAt = overrides.eventStartsAt;
  }

  // Recalculate publish time if event start time changed
  if (overrides?.eventStartsAt && overrides.eventStartsAt !== previousEventStartsAt) {
    const profile = profilesRef?.[event.groupId]?.profiles?.[event.profileKey];
    const automation = profile?.automation;

    if (automation?.enabled) {
      const eventStartTime = new Date(overrides.eventStartsAt);
      let newPublishTime;

      if (automation.timingMode === "before") {
        // Publish X time before the event starts
        const offsetMs = (
          (automation.daysOffset || 0) * 24 * 60 * 60 * 1000 +
          (automation.hoursOffset || 0) * 60 * 60 * 1000 +
          (automation.minutesOffset || 0) * 60 * 1000
        );
        newPublishTime = new Date(eventStartTime.getTime() - offsetMs);
      } else {
        // For "after" and "monthly" modes, keep relative timing
        // Calculate the difference between old event start and publish time
        const oldEventStart = new Date(previousEventStartsAt).getTime();
        const oldPublishTime = new Date(event.scheduledPublishTime).getTime();
        const timeDiff = oldPublishTime - oldEventStart;
        newPublishTime = new Date(eventStartTime.getTime() + timeDiff);
      }

      event.scheduledPublishTime = newPublishTime.toISOString();

      // Check if new publish time is in the past - mark as missed if so
      const now = new Date();
      if (newPublishTime <= now) {
        event.status = "missed";
        event.missedAt = now.toISOString();
        // Cancel any existing scheduled job
        cancelJob(pendingEventId);
      } else if (event.status === "missed") {
        // If was missed but new time is in the future, reschedule
        event.status = "scheduled";
        event.missedAt = null;
        scheduleJob(event);
      } else {
        // Reschedule the job with new publish time
        cancelJob(pendingEventId);
        scheduleJob(event);
      }
    }
  }

  savePendingEvents();
  return { ok: true };
}

function reconcilePublishedEvents(groupId, upcomingEvents = []) {
  if (!groupId) {
    return { ok: false, error: { message: "Missing groupId" } };
  }
  if (!Array.isArray(upcomingEvents)) {
    return { ok: false, error: { message: "Missing upcoming events" } };
  }

  const eventIds = new Set(upcomingEvents.map(event => event?.id).filter(Boolean));
  const eventsByStart = new Map();
  upcomingEvents.forEach(event => {
    const start = event?.startsAtUtc || event?.eventStartsAt || null;
    if (!start) {
      return;
    }
    const list = eventsByStart.get(start) || [];
    list.push(event);
    eventsByStart.set(start, list);
  });

  let removed = 0;
  let updated = 0;

  pendingEvents = pendingEvents.filter(event => {
    if (event.groupId !== groupId || event.status !== "published") {
      return true;
    }
    if (event.eventId) {
      if (eventIds.has(event.eventId)) {
        return true;
      }
      removed += 1;
      return false;
    }

    const startKey = event.eventStartsAt;
    if (!startKey) {
      return true;
    }
    const candidates = eventsByStart.get(startKey) || [];
    if (!candidates.length) {
      removed += 1;
      return false;
    }
    if (candidates.length === 1) {
      event.eventId = candidates[0].id || null;
      if (event.eventId) {
        updated += 1;
      }
      return true;
    }
    const resolved = resolveEventDetails(event.id);
    const expectedTitle = resolved?.title;
    if (expectedTitle) {
      const matching = candidates.filter(candidate => candidate?.title === expectedTitle);
      if (matching.length === 1) {
        event.eventId = matching[0].id || null;
        if (event.eventId) {
          updated += 1;
        }
        return true;
      }
    }

    removed += 1;
    return false;
  });

  if (removed || updated) {
    savePendingEvents();
  }

  return { ok: true, removed, updated };
}

/**
 * Get automation status for a profile
 * @param {string} groupId - Group ID
 * @param {string} profileKey - Profile key
 * @returns {object} Automation status
 */
function getAutomationStatus(groupId, profileKey) {
  const profileStateKey = `${groupId}::${profileKey}`;
  const state = automationState.profiles[profileStateKey] || { eventsCreated: 0 };
  const profilePendingEvents = pendingEvents.filter(
    e => e.groupId === groupId && e.profileKey === profileKey
  );

  return {
    ...state,
    pendingCount: profilePendingEvents.filter(e => e.status === "scheduled").length,
    missedCount: profilePendingEvents.filter(e => e.status === "missed").length,
    queuedCount: profilePendingEvents.filter(e => e.status === "queued").length
  };
}

/**
 * Reset automation state for a profile (when settings change)
 * @param {string} groupId - Group ID
 * @param {string} profileKey - Profile key
 */
function resetAutomationState(groupId, profileKey) {
  const profileStateKey = `${groupId}::${profileKey}`;
  automationState.profiles[profileStateKey] = { eventsCreated: 0 };
  saveAutomationState();
}

/**
 * Calculate publish time for an event based on profile automation settings
 * @param {string} eventStartsAt - ISO string of event start time
 * @param {object} profile - Profile data with automation settings
 * @returns {Date} Calculated publish time
 */
function calculatePublishTime(eventStartsAt, profile) {
  const automation = profile?.automation;
  if (!automation?.enabled) {
    return null;
  }

  const eventStartTime = new Date(eventStartsAt);
  let publishTime;

  if (automation.timingMode === "before") {
    const offsetMs = (
      (automation.daysOffset || 0) * 24 * 60 * 60 * 1000 +
      (automation.hoursOffset || 0) * 60 * 60 * 1000 +
      (automation.minutesOffset || 0) * 60 * 1000
    );
    publishTime = new Date(eventStartTime.getTime() - offsetMs);
  } else if (automation.timingMode === "monthly") {
    const eventMonth = eventStartTime.getMonth();
    const eventYear = eventStartTime.getFullYear();
    let targetDay = automation.monthlyDay || 1;
    const lastDayOfMonth = new Date(eventYear, eventMonth + 1, 0).getDate();
    const publishDay = Math.min(targetDay, lastDayOfMonth);

    publishTime = new Date(
      eventYear,
      eventMonth,
      publishDay,
      automation.monthlyHour || 12,
      automation.monthlyMinute || 0,
      0,
      0
    );

    if (publishTime >= eventStartTime) {
      publishTime.setMonth(publishTime.getMonth() - 1);
      const prevMonthLastDay = new Date(publishTime.getFullYear(), publishTime.getMonth() + 1, 0).getDate();
      publishTime.setDate(Math.min(targetDay, prevMonthLastDay));
    }
  } else {
    // Default to "before" behavior for "after" mode during restore
    const offsetMs = (
      (automation.daysOffset || 0) * 24 * 60 * 60 * 1000 +
      (automation.hoursOffset || 0) * 60 * 60 * 1000 +
      (automation.minutesOffset || 0) * 60 * 1000
    );
    publishTime = new Date(eventStartTime.getTime() - offsetMs);
  }

  // Hard cap: publish time must be at least 30 minutes before event start
  const MIN_BUFFER_MS = 30 * 60 * 1000;
  const maxPublishTime = eventStartTime.getTime() - MIN_BUFFER_MS;
  if (publishTime.getTime() > maxPublishTime) {
    publishTime = new Date(maxPublishTime);
  }

  return publishTime;
}

/**
 * Restore deleted pending events for a profile
 * @param {string} groupId - Group ID
 * @param {string} profileKey - Profile key
 * @returns {object} Result with restoredCount
 */
function restoreDeletedEvents(groupId, profileKey) {
  const deletedForProfile = deletedEvents.filter(e =>
    e.groupId === groupId && e.profileKey === profileKey
  );

  if (deletedForProfile.length === 0) {
    return { ok: true, restoredCount: 0 };
  }

  const profile = profilesRef?.[groupId]?.profiles?.[profileKey];
  if (!profile) {
    return { ok: false, error: { message: "Profile not found" } };
  }

  const profileStateKey = getProfileStateKey(groupId, profileKey);
  const profileState = getOrCreateProfileState(profileStateKey);
  const existingEvents = pendingEvents.filter(e => e.groupId === groupId && e.profileKey === profileKey);
  const modifiedEventSlots = new Set();
  existingEvents
    .filter(e => e.manualOverrides)
    .forEach(event => {
      getPendingSlotKeys(event).forEach(key => modifiedEventSlots.add(key));
    });
  const publishedEventSlots = new Set();
  existingEvents
    .filter(e => e.status === "published")
    .forEach(event => {
      getPendingSlotKeys(event).forEach(key => publishedEventSlots.add(key));
    });
  let anchorMs = getActivationStartMs(profileState);
  if (anchorMs === null) {
    anchorMs = getEarliestEventStartMs(existingEvents) ?? getEarliestEventStartMs(deletedForProfile);
    if (anchorMs !== null) {
      profileState.activationStartsAt = new Date(anchorMs).toISOString();
      saveAutomationState();
    }
  }

  const nowMs = Date.now();
  let restoredCount = 0;
  const toRemoveFromDeleted = [];

  for (const event of deletedForProfile) {
    const eventSlotKeys = getPendingSlotKeys(event);
    if (eventSlotKeys.some(key => modifiedEventSlots.has(key))) {
      continue;
    }
    if (eventSlotKeys.some(key => publishedEventSlots.has(key))) {
      continue;
    }
    const restoreStartMs = getRestoreStartMs(event);
    if (restoreStartMs === null || restoreStartMs <= nowMs) {
      continue;
    }
    if (anchorMs !== null && restoreStartMs <= anchorMs) {
      continue;
    }
    // Only restore events whose event date hasn't passed yet
    // Recalculate publish time based on current profile settings
    const restoreStartsAt = new Date(restoreStartMs).toISOString();
    const newPublishTime = calculatePublishTime(restoreStartsAt, profile);

    // Only restore if publish time calculation succeeded and is in the future
      if (newPublishTime && newPublishTime.getTime() > nowMs) {
        const hasOverrides = event.manualOverrides && Object.keys(event.manualOverrides).length > 0;
        const currentStartMs = parseEventStartMs(event.eventStartsAt);
        const useOverrides = hasOverrides && currentStartMs === restoreStartMs;
        const slotKey = buildPendingEventId(groupId, profileKey, restoreStartsAt);
        const fallbackId = slotKey || event.id || `pending_${groupId}_${profileKey}_${restoreStartMs}`;
        let restoredEvent = event;

        if (!useOverrides) {
          restoredEvent = {
            id: fallbackId,
            slotKey: slotKey || event.slotKey || null,
            groupId,
            profileKey,
            scheduledPublishTime: newPublishTime.toISOString(),
            eventStartsAt: restoreStartsAt,
            manualOverrides: null,
            status: "scheduled",
            missedAt: null
          };
        } else {
          restoredEvent.scheduledPublishTime = newPublishTime.toISOString();
          restoredEvent.status = "scheduled";
          restoredEvent.missedAt = null;
          if (!restoredEvent.eventStartsAt) {
            restoredEvent.eventStartsAt = restoreStartsAt;
          }
          delete restoredEvent.deletedAt;
          delete restoredEvent.queuedAt;
        }

        pendingEvents.push(restoredEvent);
        scheduleJob(restoredEvent);
        restoredCount++;
        toRemoveFromDeleted.push(event);
      }
  }

  // Remove restored events from deletedEvents
  for (const event of toRemoveFromDeleted) {
    const idx = deletedEvents.indexOf(event);
    if (idx !== -1) {
      deletedEvents.splice(idx, 1);
    }
  }

  savePendingEvents();
  debugLogFn("Automation", `Restored ${restoredCount} deleted events for ${groupId}::${profileKey}`);

  return { ok: true, restoredCount };
}

/**
 * Get count of restorable deleted events for a profile
 * @param {string} groupId - Group ID
 * @param {string} profileKey - Profile key
 * @returns {number} Count of restorable events
 */
function getRestorableCount(groupId, profileKey) {
  const profileStateKey = getProfileStateKey(groupId, profileKey);
  const profileState = getOrCreateProfileState(profileStateKey);
  const existingEvents = pendingEvents.filter(e => e.groupId === groupId && e.profileKey === profileKey);
  const modifiedEventSlots = new Set();
  existingEvents
    .filter(e => e.manualOverrides)
    .forEach(event => {
      getPendingSlotKeys(event).forEach(key => modifiedEventSlots.add(key));
    });
  const publishedEventSlots = new Set();
  existingEvents
    .filter(e => e.status === "published")
    .forEach(event => {
      getPendingSlotKeys(event).forEach(key => publishedEventSlots.add(key));
    });
  let anchorMs = getActivationStartMs(profileState);
  if (anchorMs === null) {
    const deletedForProfile = deletedEvents.filter(e => e.groupId === groupId && e.profileKey === profileKey);
    anchorMs = getEarliestEventStartMs(existingEvents) ?? getEarliestEventStartMs(deletedForProfile);
  }
  const nowMs = Date.now();
  return deletedEvents.filter(e => {
    if (e.groupId !== groupId || e.profileKey !== profileKey) {
      return false;
    }
    const eventSlotKeys = getPendingSlotKeys(e);
    if (eventSlotKeys.some(key => modifiedEventSlots.has(key))) {
      return false;
    }
    if (eventSlotKeys.some(key => publishedEventSlots.has(key))) {
      return false;
    }
    const restoreStartMs = getRestoreStartMs(e);
    if (restoreStartMs === null || restoreStartMs <= nowMs) {
      return false;
    }
    if (anchorMs !== null && restoreStartMs <= anchorMs) {
      return false;
    }
    return true;
  }).length;
}

module.exports = {
  isInitialized,
  initializeAutomation,
  setKnownGroupIds,
  loadPendingEvents,
  savePendingEvents,
  loadAutomationState,
  saveAutomationState,
  calculatePendingEvents,
  scheduleJob,
  cancelJob,
  cancelAllJobs,
  cancelJobsForProfile,
  purgeProfilePendingEvents,
  executeAutomatedPost,
  handleMissedEvent,
  getPendingEvents,
  getMissedCount,
  getQueuedCount,
  getPendingSettings,
  updatePendingSettings,
  updatePendingEventsForProfile,
  recordManualEvent,
  updatePendingEventOverrides,
  reconcilePublishedEvents,
  getAutomationStatus,
  resetAutomationState,
  resolveEventDetails,
  restoreDeletedEvents,
  getRestorableCount
};
