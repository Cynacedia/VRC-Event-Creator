/**
 * Automation Engine for VRC Event Creator
 * Handles automated event posting based on profile patterns
 */

const fs = require("fs");
const { DateTime } = require("luxon");
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

// Rate limiting constants
const EVENT_HOURLY_LIMIT = 10;
const EVENT_HOURLY_WINDOW_MS = 60 * 60 * 1000;
const BACKOFF_SEQUENCE = [2, 4, 8, 16, 32, 60]; // minutes, caps at 60

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
 * @returns {Array} Array of pending event objects
 */
function calculatePendingEvents(groupId, profileKey, profile, maxEvents = 10) {
  if (!profile || !profile.automation?.enabled || !profile.patterns?.length) {
    return [];
  }

  const automation = profile.automation;
  const timezone = profile.timezone || "UTC";

  // Generate date options from patterns (3 months ahead max)
  const dateOptions = generateDateOptionsFromPatterns(profile.patterns, 3, timezone);

  debugLogFn("Automation", `Pattern dates generated: ${dateOptions.map(d => d.iso).join(", ")}`);

  if (!dateOptions.length) {
    return [];
  }

  const newPendingEvents = [];
  const now = new Date();

  // Get existing pending events for this profile to check counts
  const profileStateKey = `${groupId}::${profileKey}`;
  const profileState = automationState.profiles[profileStateKey] || { eventsCreated: 0 };

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
    const pendingEvent = {
      id: `pending_${groupId}_${profileKey}_${eventStartTime.getTime()}`,
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

  // If more than 1 day away, recheck every hour to avoid missing publish times
  // Once within 1 day, schedule the exact time
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const ONE_HOUR_MS = 60 * 60 * 1000;
  if (delay > ONE_DAY_MS) {
    const timeoutId = setTimeout(() => {
      // Reschedule with fresh timing
      scheduleJob(pendingEvent);
    }, ONE_HOUR_MS);
    scheduledJobs.set(pendingEvent.id, timeoutId);
    debugLogFn("Automation", `Scheduled recheck for ${pendingEvent.id} in 1 hour (publish in ${Math.round(delay / 1000 / 60 / 60)} hours)`);
    return;
  }

  // Schedule the job
  const timeoutId = setTimeout(async () => {
    await executeAutomatedPost(pendingEvent);
  }, delay);

  scheduledJobs.set(pendingEvent.id, timeoutId);
  debugLogFn("Automation", `Scheduled job for ${pendingEvent.id} in ${Math.round(delay / 1000 / 60)} minutes`);
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
 * Cancel all jobs for a specific profile and remove pending events
 * Called when a profile is deleted
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

  // Remove pending events for this profile (profile is being deleted)
  pendingEvents = pendingEvents.filter(e =>
    !(e.groupId === groupId && e.profileKey === profileKey)
  );

  // Also remove deleted events for this profile (no point keeping them)
  deletedEvents = deletedEvents.filter(e =>
    !(e.groupId === groupId && e.profileKey === profileKey)
  );

  // Clean up automation state for this profile
  const profileStateKey = `${groupId}::${profileKey}`;
  if (automationState.profiles[profileStateKey]) {
    delete automationState.profiles[profileStateKey];
    saveAutomationState();
  }

  savePendingEvents();
  debugLogFn("Automation", `Removed all pending and deleted events for deleted profile ${groupId}::${profileKey}`);
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
      pendingEvent.status = "published";

      // Update automation state
      const profileStateKey = `${pendingEvent.groupId}::${pendingEvent.profileKey}`;
      if (!automationState.profiles[profileStateKey]) {
        automationState.profiles[profileStateKey] = { eventsCreated: 0, publishedEventTimes: [] };
      }
      if (!automationState.profiles[profileStateKey].publishedEventTimes) {
        automationState.profiles[profileStateKey].publishedEventTimes = [];
      }
      automationState.profiles[profileStateKey].eventsCreated += 1;
      automationState.profiles[profileStateKey].lastSuccess = new Date().toISOString();
      automationState.profiles[profileStateKey].lastEventId = result.eventId;

      // Track published event time to prevent duplicate pending events
      const eventTime = new Date(pendingEvent.eventStartsAt).getTime();
      if (!automationState.profiles[profileStateKey].publishedEventTimes.includes(eventTime)) {
        automationState.profiles[profileStateKey].publishedEventTimes.push(eventTime);
      }

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

    // Prevent double-posting if already published or being processed
    if (pendingEvent.status === "published") {
      return { ok: false, error: { message: "Event has already been posted." } };
    }

    // Mark as processing to prevent concurrent executions
    const previousStatus = pendingEvent.status;
    pendingEvent.status = "processing";

    try {
      // Execute immediately (bypass queue for user-initiated "Post Now")
      await executeAutomatedPostInternal(pendingEvent);

      // Re-fetch the event to get the latest status (in case array was modified)
      const updatedEvent = pendingEvents.find(e => e.id === pendingEventId);
      const finalStatus = updatedEvent?.status || pendingEvent.status;

      // Check if the post succeeded
      if (finalStatus === "published") {
        return { ok: true };
      } else if (finalStatus === "queued") {
        return { ok: false, error: { message: "Rate limit hit. Event has been queued and will post automatically when limits clear." } };
      } else {
        return { ok: false, error: { message: "Failed to post event. It will retry automatically." } };
      }
    } catch (err) {
      // Restore previous status on error
      pendingEvent.status = previousStatus;
      return { ok: false, error: { message: err.message || "Failed to post event." } };
    }
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
    cancelJob(pendingEventId);
    const deletedEvent = pendingEvents.splice(eventIndex, 1)[0];
    deletedEvent.status = "deleted";
    deletedEvent.deletedAt = new Date().toISOString();
    deletedEvents.push(deletedEvent);
    savePendingEvents();
    return { ok: true };
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
  // Update profiles reference
  if (profilesRef && profilesRef[groupId]) {
    if (!profilesRef[groupId].profiles) {
      profilesRef[groupId].profiles = {};
    }
    profilesRef[groupId].profiles[profileKey] = profile;
  }

  // Get profile state (needed for checking eventsCreated and publishedEventTimes)
  const profileStateKey = `${groupId}::${profileKey}`;
  const profileState = automationState.profiles[profileStateKey] || { eventsCreated: 0, publishedEventTimes: [] };

  // Get existing events for this profile
  const existingEvents = pendingEvents.filter(e =>
    e.groupId === groupId && e.profileKey === profileKey
  );

  // Get IDs of manually modified events (these should NEVER be recreated)
  const modifiedEventIds = new Set(
    existingEvents.filter(e => e.manualOverrides).map(e => e.id)
  );

  // Get IDs of deleted events (these should not be recreated)
  const deletedEventIds = new Set(
    deletedEvents
      .filter(e => e.groupId === groupId && e.profileKey === profileKey)
      .map(e => e.id)
  );

  // Get timestamps of published events (these should not be recreated as pending)
  const publishedEventTimes = new Set(
    profileState.publishedEventTimes || []
  );

  // Cancel existing jobs for this profile (only non-modified ones will be replaced)
  for (const event of existingEvents) {
    if (!event.manualOverrides) {
      cancelJob(event.id);
    }
  }

  // Remove only auto-generated events (keep manually modified ones)
  pendingEvents = pendingEvents.filter(e =>
    !(e.groupId === groupId && e.profileKey === profileKey && !e.manualOverrides)
  );

  // If automation is disabled, just save and return
  if (!profile?.automation?.enabled) {
    savePendingEvents();
    debugLogFn("Automation", `Automation disabled for ${groupId}::${profileKey}, cleared pending events`);
    return;
  }

  // Check if we should generate pending events
  // Only generate if: profile has created events before OR there are existing pending events
  const hasExistingPending = existingEvents.length > 0;
  const hasCreatedBefore = profileState.eventsCreated > 0;

  if (!hasExistingPending && !hasCreatedBefore) {
    // Don't generate pending events until first manual event is created
    savePendingEvents();
    debugLogFn("Automation", `No pending events generated for ${groupId}::${profileKey} - waiting for first manual event`);
    return;
  }

  // Calculate new pending events (with deterministic IDs)
  const newEvents = calculatePendingEvents(groupId, profileKey, profile);

  debugLogFn("Automation", `Generated ${newEvents.length} potential events, publishedEventTimes: ${JSON.stringify([...publishedEventTimes])}`);

  // Filter out events whose ID matches:
  // 1. A modified event (already exists, user customized it)
  // 2. A deleted event (user explicitly removed it)
  // 3. A published event (already created manually or by automation)
  const filteredNewEvents = newEvents.filter(e => {
    const eventTime = new Date(e.eventStartsAt).getTime();
    const isModified = modifiedEventIds.has(e.id);
    const isDeleted = deletedEventIds.has(e.id);
    const isPublished = publishedEventTimes.has(eventTime);
    if (isModified || isDeleted || isPublished) {
      debugLogFn("Automation", `Filtering out event ${e.id} (time: ${eventTime}): modified=${isModified}, deleted=${isDeleted}, published=${isPublished}`);
    }
    return !isModified && !isDeleted && !isPublished;
  });

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

  // Convert manual date/time/timezone to UTC ISO string if provided
  if (overrides?.manualDate && overrides?.manualTime && overrides?.timezone) {
    const { manualDate, manualTime, timezone } = overrides;
    const safeTimezone = DateTime.local().setZone(timezone).isValid ? timezone : "UTC";
    const dt = DateTime.fromISO(`${manualDate}T${manualTime}`, { zone: safeTimezone });
    if (dt.isValid) {
      overrides.eventStartsAt = dt.toUTC().toISO();
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
 * Increment eventsCreated count for a profile (when manual event is created)
 * @param {string} groupId - Group ID
 * @param {string} profileKey - Profile key
 */
function incrementEventsCreated(groupId, profileKey) {
  const profileStateKey = `${groupId}::${profileKey}`;
  if (!automationState.profiles[profileStateKey]) {
    automationState.profiles[profileStateKey] = { eventsCreated: 0, publishedEventTimes: [] };
  }
  automationState.profiles[profileStateKey].eventsCreated++;
  saveAutomationState();
  debugLogFn("Automation", `Incremented eventsCreated for ${profileStateKey} to ${automationState.profiles[profileStateKey].eventsCreated}`);
}

/**
 * Track a published event time so it won't be recreated as a pending event
 * @param {string} groupId - Group ID
 * @param {string} profileKey - Profile key
 * @param {string} eventStartsAt - ISO string of event start time
 */
function trackPublishedEventTime(groupId, profileKey, eventStartsAt) {
  const profileStateKey = `${groupId}::${profileKey}`;
  if (!automationState.profiles[profileStateKey]) {
    automationState.profiles[profileStateKey] = { eventsCreated: 0, publishedEventTimes: [] };
  }
  if (!automationState.profiles[profileStateKey].publishedEventTimes) {
    automationState.profiles[profileStateKey].publishedEventTimes = [];
  }
  // Store the timestamp for matching
  const eventTime = new Date(eventStartsAt).getTime();
  if (!automationState.profiles[profileStateKey].publishedEventTimes.includes(eventTime)) {
    automationState.profiles[profileStateKey].publishedEventTimes.push(eventTime);
    saveAutomationState();
    debugLogFn("Automation", `Tracked published event time for ${profileStateKey}: ${eventStartsAt}`);
  }
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

  const now = new Date();
  let restoredCount = 0;
  const toRemoveFromDeleted = [];

  for (const event of deletedForProfile) {
    // Only restore events whose event date hasn't passed yet
    if (new Date(event.eventStartsAt) > now) {
      // Recalculate publish time based on current profile settings
      const newPublishTime = calculatePublishTime(event.eventStartsAt, profile);

      // Only restore if publish time calculation succeeded and is in the future
      if (newPublishTime && newPublishTime > now) {
        event.scheduledPublishTime = newPublishTime.toISOString();
        event.status = "scheduled";
        delete event.deletedAt;
        pendingEvents.push(event);
        scheduleJob(event);
        restoredCount++;
        toRemoveFromDeleted.push(event);
      }
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
  const now = new Date();
  return deletedEvents.filter(e =>
    e.groupId === groupId &&
    e.profileKey === profileKey &&
    new Date(e.eventStartsAt) > now
  ).length;
}

module.exports = {
  isInitialized,
  initializeAutomation,
  loadPendingEvents,
  savePendingEvents,
  loadAutomationState,
  saveAutomationState,
  calculatePendingEvents,
  scheduleJob,
  cancelJob,
  cancelAllJobs,
  cancelJobsForProfile,
  executeAutomatedPost,
  handleMissedEvent,
  getPendingEvents,
  getMissedCount,
  getQueuedCount,
  getPendingSettings,
  updatePendingSettings,
  updatePendingEventsForProfile,
  updatePendingEventOverrides,
  getAutomationStatus,
  resetAutomationState,
  incrementEventsCreated,
  trackPublishedEventTime,
  resolveEventDetails,
  restoreDeletedEvents,
  getRestorableCount
};
