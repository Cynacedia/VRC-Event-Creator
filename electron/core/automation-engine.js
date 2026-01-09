/**
 * Automation Engine for VRC Event Creator
 * Handles automated event posting based on profile patterns
 */

const fs = require("fs");
const path = require("path");
const { generateDateOptionsFromPatterns } = require("./date-utils");

// In-memory job storage
const scheduledJobs = new Map(); // pendingEventId -> timeoutId
let pendingEvents = [];
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
      if (data.settings && typeof data.settings === "object") {
        pendingSettings = { displayLimit: 10, ...data.settings };
      }
    } else {
      pendingEvents = [];
    }
  } catch (err) {
    debugLogFn("Automation", "Failed to load pending events:", err);
    pendingEvents = [];
  }
}

/**
 * Save pending events to file
 */
function savePendingEvents() {
  try {
    const data = {
      events: pendingEvents,
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
    const pendingEvent = {
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
}

/**
 * Cancel all scheduled jobs
 */
function cancelAllJobs() {
  for (const [id, timeoutId] of scheduledJobs) {
    clearTimeout(timeoutId);
  }
  scheduledJobs.clear();
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
  const eventDetails = {
    title: profile.name || "Untitled Event",
    description: profile.description || "",
    category: profile.category || "hangout",
    accessType: profile.accessType || "public",
    languages: Array.isArray(profile.languages) ? [...profile.languages] : [],
    platforms: Array.isArray(profile.platforms) ? [...profile.platforms] : [],
    tags: Array.isArray(profile.tags) ? [...profile.tags] : [],
    imageId: profile.imageId || null,
    imageUrl: profile.imageUrl || null,
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
 * Execute an automated event post
 * @param {object} pendingEvent - Pending event object
 */
async function executeAutomatedPost(pendingEvent) {
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
      // Update pending event status
      pendingEvent.status = "published";

      // Update automation state
      const profileStateKey = `${pendingEvent.groupId}::${pendingEvent.profileKey}`;
      if (!automationState.profiles[profileStateKey]) {
        automationState.profiles[profileStateKey] = { eventsCreated: 0 };
      }
      automationState.profiles[profileStateKey].eventsCreated += 1;
      automationState.profiles[profileStateKey].lastSuccess = new Date().toISOString();
      automationState.profiles[profileStateKey].lastEventId = result.eventId;

      saveAutomationState();
      savePendingEvents();

      debugLogFn("Automation", `Successfully created event for ${pendingEvent.id}`);
      onEventCreated(pendingEvent, result.eventId);
    } else {
      // Handle failure - schedule retry
      debugLogFn("Automation", `Failed to create event: ${result.error?.message || "Unknown error"}`);
      scheduleRetry(pendingEvent);
    }
  } catch (err) {
    debugLogFn("Automation", `Error executing automated post: ${err.message}`);
    scheduleRetry(pendingEvent);
  }
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
    // Remove the pending event
    cancelJob(pendingEventId);
    pendingEvents.splice(eventIndex, 1);
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
 * Get missed events count
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

  // Cancel existing jobs for this profile
  cancelJobsForProfile(groupId, profileKey);

  // Remove existing pending events for this profile (except ones with manual overrides)
  pendingEvents = pendingEvents.filter(e => {
    if (e.groupId === groupId && e.profileKey === profileKey) {
      // Keep events with manual overrides
      return e.manualOverrides !== null;
    }
    return true;
  });

  // If automation is disabled, just save and return
  if (!profile?.automation?.enabled) {
    savePendingEvents();
    debugLogFn("Automation", `Automation disabled for ${groupId}::${profileKey}, cleared pending events`);
    return;
  }

  // Calculate new pending events
  const newEvents = calculatePendingEvents(groupId, profileKey, profile);

  // Add new events
  pendingEvents.push(...newEvents);
  savePendingEvents();

  // Schedule jobs for new events
  for (const event of newEvents) {
    scheduleJob(event);
  }

  debugLogFn("Automation", `Updated pending events for ${groupId}::${profileKey}, now ${newEvents.length} pending`);
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
    missedCount: profilePendingEvents.filter(e => e.status === "missed").length
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
  getPendingSettings,
  updatePendingSettings,
  updatePendingEventsForProfile,
  updatePendingEventOverrides,
  getAutomationStatus,
  resetAutomationState,
  resolveEventDetails
};
