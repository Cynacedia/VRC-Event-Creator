import { dom, state } from "./state.js";
import { renderSelect, renderChecklist, showToast } from "./ui.js";
import { buildTimezones, ensureTimezoneOption, createTagInput, enforceTagsInput, sanitizeText, formatDuration, normalizeDurationInput, parseDurationInput, sanitizeDurationInputValue, formatDurationPreview, enforceGroupAccess, getTodayDateString, getMaxEventDateString, getRateLimitRemainingMs, registerRateLimit, clearRateLimit, isRateLimitError, getTimeZoneAbbr } from "./utils.js";
import { ACCESS_TYPES, CATEGORIES, EVENT_DESCRIPTION_LIMIT, EVENT_NAME_LIMIT, LANGUAGES, PLATFORMS, TAG_LIMIT } from "./config.js";
import { t, getLanguageDisplayName } from "./i18n/index.js";
import { fetchGroupRoles, renderRoleList } from "./roles.js";

const HOLD_DURATION_MS = 2000;
const MODIFY_RATE_LIMIT_KEYS = {
  update: "events:update",
  delete: "events:delete",
  refresh: "events:refresh"
};
const REFRESH_BACKOFF_SEQUENCE = [2000, 5000, 10000, 20000, 40000, 60000]; // 2s, 5s, 10s, 20s, 40s, 60s
const REFRESH_DEDUP_MS = 3000;
let modifyApi = null;

// In-memory cache for image data URLs
const modifyImageDataUrlCache = new Map();

async function loadCachedImageForElement(imgElement, imageId, fallbackUrl) {
  if (!imageId || !modifyApi?.getCachedImage) return;

  // Check in-memory cache first
  if (modifyImageDataUrlCache.has(imageId)) {
    imgElement.src = modifyImageDataUrlCache.get(imageId);
    return;
  }

  // Try to get from disk cache
  try {
    const dataUrl = await modifyApi.getCachedImage(imageId);
    if (dataUrl) {
      modifyImageDataUrlCache.set(imageId, dataUrl);
      imgElement.src = dataUrl;
    }
  } catch {
    // Silently fail - image will continue using remote URL
  }
}

function extractImageIdFromUrl(url) {
  if (!url) return null;
  // VRChat file URLs contain file ID like "file_abc123"
  const match = url.match(/file_[a-zA-Z0-9-]+/);
  return match ? match[0] : null;
}

function getImageIdForEvent(event) {
  return event?.imageId || extractImageIdFromUrl(event?.imageUrl);
}

function getEventSlotKey(event) {
  const start = event?.startsAtUtc || event?.eventStartsAt;
  if (!event?.groupId || !start) {
    return null;
  }
  return `${event.groupId}::${start}`;
}

function buildOptimisticEvent(pendingEvent, details, eventId) {
  const resolved = details || pendingEvent?.resolvedDetails || {};
  const startsAtUtc = pendingEvent?.eventStartsAt || resolved.eventStartsAt || null;
  const durationMinutes = Number(
    resolved.durationMinutes ?? resolved.duration ?? pendingEvent?.manualOverrides?.durationMinutes ?? 120
  );
  const endsAtUtc = startsAtUtc
    ? new Date(Date.parse(startsAtUtc) + (durationMinutes * 60 * 1000)).toISOString()
    : null;
  const baseId = pendingEvent?.id ? `optimistic_${pendingEvent.id}` : `optimistic_${Date.now()}`;
  return {
    id: eventId || baseId,
    eventId: eventId || null,
    groupId: pendingEvent?.groupId || "",
    title: resolved.title || "",
    description: resolved.description || "",
    category: resolved.category || "hangout",
    accessType: resolved.accessType || "public",
    tags: Array.isArray(resolved.tags) ? resolved.tags : [],
    imageId: resolved.imageId || null,
    imageUrl: resolved.imageUrl || null,
    roleIds: Array.isArray(resolved.roleIds) ? resolved.roleIds : [],
    languages: Array.isArray(resolved.languages) ? resolved.languages : [],
    platforms: Array.isArray(resolved.platforms) ? resolved.platforms : [],
    startsAtUtc,
    endsAtUtc,
    timezone: resolved.timezone || "UTC",
    isOptimistic: true,
    sourcePendingId: pendingEvent?.id || null,
    optimisticCreatedAt: Date.now()
  };
}

function upsertOptimisticEvent(pendingEvent, details, eventId) {
  if (!pendingEvent?.id) {
    return;
  }
  const existing = state.modify.optimisticEvents.get(pendingEvent.id);
  const nextEvent = buildOptimisticEvent(pendingEvent, details, eventId || existing?.event?.eventId);
  const createdAt = existing?.createdAt || Date.now();
  state.modify.optimisticEvents.set(pendingEvent.id, {
    event: { ...nextEvent, optimisticCreatedAt: createdAt },
    createdAt
  });
}

function collectOptimisticEntriesForEvent(event) {
  const matches = [];
  if (!event || !state.modify.optimisticEvents.size) {
    return matches;
  }
  const seen = new Set();
  const eventSlotKey = getEventSlotKey(event);

  if (event?.sourcePendingId && state.modify.optimisticEvents.has(event.sourcePendingId)) {
    const entry = state.modify.optimisticEvents.get(event.sourcePendingId);
    if (entry) {
      seen.add(event.sourcePendingId);
      matches.push({ pendingId: event.sourcePendingId, entry });
    }
  }

  for (const [pendingId, entry] of state.modify.optimisticEvents.entries()) {
    if (seen.has(pendingId)) {
      continue;
    }
    const optimistic = entry?.event;
    if (!optimistic) {
      continue;
    }
    if (optimistic.eventId && event.id && optimistic.eventId === event.id) {
      seen.add(pendingId);
      matches.push({ pendingId, entry });
      continue;
    }
    if (optimistic.id && event.id && optimistic.id === event.id) {
      seen.add(pendingId);
      matches.push({ pendingId, entry });
      continue;
    }
    if (eventSlotKey && eventSlotKey === getEventSlotKey(optimistic)) {
      seen.add(pendingId);
      matches.push({ pendingId, entry });
    }
  }
  return matches;
}

function removeOptimisticEntriesForEvent(event) {
  const removed = [];
  const matches = collectOptimisticEntriesForEvent(event);
  matches.forEach(({ pendingId, entry }) => {
    state.modify.optimisticEvents.delete(pendingId);
    removed.push({ pendingId, entry });
  });
  return removed;
}

function reconcileOptimisticEvents(realEvents, pendingEvents, groupId) {
  if (!state.modify.optimisticEvents.size) {
    return;
  }
  const realIds = new Set(realEvents.map(event => event.id).filter(Boolean));
  const realSlots = new Set(realEvents.map(getEventSlotKey).filter(Boolean));
  const pendingById = new Map((pendingEvents || []).map(event => [event.id, event]));
  for (const [pendingId, entry] of state.modify.optimisticEvents.entries()) {
    const event = entry.event;
    if (groupId && event.groupId && event.groupId !== groupId) {
      state.modify.optimisticEvents.delete(pendingId);
      continue;
    }
    if (event.eventId && realIds.has(event.eventId)) {
      state.modify.optimisticEvents.delete(pendingId);
      continue;
    }
    if (event.id && realIds.has(event.id)) {
      state.modify.optimisticEvents.delete(pendingId);
      continue;
    }
    const slotKey = getEventSlotKey(event);
    if (slotKey && realSlots.has(slotKey)) {
      state.modify.optimisticEvents.delete(pendingId);
      continue;
    }
    const pending = pendingById.get(pendingId);
    if (pending && (pending.status === "queued" || pending.status === "missed")) {
      state.modify.optimisticEvents.delete(pendingId);
      continue;
    }
  }
}
let roleFetchToken = 0;
let refreshButtonTimer = null;

function getGroupName(groupId) {
  if (!groupId) {
    return "";
  }
  const group = state.groups.find(entry => entry.groupId === groupId || entry.id === groupId);
  return group?.name || "";
}

function getDurationUnits() {
  return {
    day: t("common.durationUnits.day"),
    hour: t("common.durationUnits.hour"),
    minute: t("common.durationUnits.minute")
  };
}

function applyRefreshBackoff() {
  const backoffMs = REFRESH_BACKOFF_SEQUENCE[state.modify.refreshBackoffIndex];
  state.modify.refreshBackoffUntil = Date.now() + backoffMs;
  state.modify.refreshBackoffIndex = Math.min(
    state.modify.refreshBackoffIndex + 1,
    REFRESH_BACKOFF_SEQUENCE.length - 1
  );
  updateRefreshButtonState();
}

function clearRefreshBackoff() {
  state.modify.refreshBackoffUntil = 0;
  state.modify.refreshBackoffIndex = 0;
  updateRefreshButtonState();
}

function updateRefreshButtonState() {
  if (!dom.modifyRefresh) {
    return;
  }

  const now = Date.now();
  const backoffRemainingMs = Math.max(0, state.modify.refreshBackoffUntil - now);
  const dedupRemainingMs = Math.max(0, (state.modify.lastRefreshTime + REFRESH_DEDUP_MS) - now);
  const remainingMs = Math.max(backoffRemainingMs, dedupRemainingMs);

  if (remainingMs > 0) {
    const seconds = Math.ceil(remainingMs / 1000);
    dom.modifyRefresh.textContent = `${t("common.refresh")} (${seconds}s)`;
    dom.modifyRefresh.disabled = true;

    // Clear existing timer
    if (refreshButtonTimer) {
      clearTimeout(refreshButtonTimer);
    }

    // Schedule next update
    refreshButtonTimer = setTimeout(updateRefreshButtonState, 1000);
  } else {
    dom.modifyRefresh.textContent = t("common.refresh");
    dom.modifyRefresh.disabled = state.modify.loading;

    if (refreshButtonTimer) {
      clearTimeout(refreshButtonTimer);
      refreshButtonTimer = null;
    }
  }
}

async function handleRefreshClick() {
  const now = Date.now();

  // Check if still in backoff period
  if (state.modify.refreshBackoffUntil > now) {
    updateRefreshButtonState();
    return;
  }

  // Respect deduplication window
  const timeSinceLastRefresh = now - state.modify.lastRefreshTime;
  if (timeSinceLastRefresh < REFRESH_DEDUP_MS) {
    updateRefreshButtonState();
    return;
  }

  state.modify.lastRefreshTime = now;

  try {
    await refreshModifyEvents(modifyApi, { bypassCache: true });
    // Success - reset backoff
    clearRefreshBackoff();
  } catch (err) {
    // Check if 429 error
    if (isRateLimitError(err)) {
      applyRefreshBackoff();
      showToast(t("common.rateLimitError"), true, { duration: 8000 });
    }
  }
}

export function updateModifyDurationPreview() {
  if (!dom.modifyEventDurationPreview || !dom.modifyEventDuration) {
    return;
  }
  dom.modifyEventDurationPreview.textContent = formatDurationPreview(dom.modifyEventDuration.value, getDurationUnits());
}

function getRoleLabels() {
  return {
    allAccess: t("events.roleRestrictions.allAccess"),
    managementRoles: t("events.roleRestrictions.managementRoles"),
    roles: t("events.roleRestrictions.roles"),
    noRoles: t("events.roleRestrictions.noRoles")
  };
}

async function renderModifyRoleRestrictions() {
  if (!dom.modifyRoleRestrictions || !dom.modifyRoleList) {
    return;
  }
  const groupId = state.modify.selectedEvent?.groupId || dom.modifyGroup?.value;
  const isGroupAccess = dom.modifyEventAccess?.value === "group";
  const shouldShow = Boolean(groupId) && isGroupAccess;
  dom.modifyRoleRestrictions.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) {
    dom.modifyRoleList.innerHTML = "";
    return;
  }
  const labels = getRoleLabels();
  const requestId = ++roleFetchToken;
  dom.modifyRoleList.innerHTML = `<div class="hint">${t("common.loading")}</div>`;
  try {
    const roles = await fetchGroupRoles(modifyApi, groupId);
    if (requestId !== roleFetchToken) {
      return;
    }
    const validIds = new Set(roles.map(role => role.id));
    state.modify.roleIds = (state.modify.roleIds || []).filter(id => validIds.has(id));
    renderRoleList({
      container: dom.modifyRoleList,
      roles,
      selectedIds: state.modify.roleIds,
      labels,
      onChange: next => {
        state.modify.roleIds = next;
      }
    });
  } catch (err) {
    dom.modifyRoleList.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = labels.noRoles;
    dom.modifyRoleList.appendChild(empty);
  }
}

function handleModifyAccessChange() {
  enforceGroupAccess(dom.modifyEventAccess, state.modify.selectedEvent?.groupId || dom.modifyGroup?.value);
  void renderModifyRoleRestrictions();
}

function getGroupBanner(groupId) {
  const group = state.groups.find(entry => entry.groupId === groupId || entry.id === groupId);
  if (!group) {
    return null;
  }
  return group.bannerUrl
    || group.bannerImageUrl
    || group.iconUrl
    || group.iconImageUrl
    || null;
}

function setModifyLoading(loading) {
  state.modify.loading = loading;
  if (dom.modifyRefresh) {
    dom.modifyRefresh.disabled = loading || !state.user;
  }
}

function formatDateParts(value, timeZone) {
  if (!value) {
    return { date: "", time: "" };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" };
  }
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const lookup = (parts, type) => parts.find(part => part.type === type)?.value || "";
  const year = lookup(dateParts, "year");
  const month = lookup(dateParts, "month");
  const day = lookup(dateParts, "day");
  const hour = lookup(timeParts, "hour");
  const minute = lookup(timeParts, "minute");
  return {
    date: year && month && day ? `${year}-${month}-${day}` : "",
    time: hour && minute ? `${hour}:${minute}` : ""
  };
}

function formatEventDisplayDate(value) {
  if (!value) {
    return t("modify.dateUnknown");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("modify.dateUnknown");
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

/**
 * Format date in a specific timezone with timezone abbreviation
 * @param {string} value - ISO date string
 * @param {string} timeZone - IANA timezone string
 * @returns {string} Formatted date with timezone code
 */
function formatDateInTimezone(value, timeZone) {
  if (!value) {
    return t("modify.dateUnknown");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("modify.dateUnknown");
  }
  const formatted = date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone
  });
  const tzAbbr = getTimeZoneAbbr(timeZone);
  return `${formatted} ${tzAbbr}`;
}

/**
 * Get system local timezone
 * @returns {string} IANA timezone string
 */
function getSystemTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/**
 * Setup hover-to-convert behavior for a date element
 * Shows local time with timezone code on hover, original on mouse leave
 * @param {HTMLElement} element - The element to attach hover behavior to
 * @param {string} isoDate - The ISO date string
 * @param {string} originalTimezone - The original timezone for normal display
 */
function setupDateHoverConvert(element, isoDate, originalTimezone) {
  const systemTz = getSystemTimezone();
  const originalText = formatDateInTimezone(isoDate, originalTimezone);
  const localText = formatDateInTimezone(isoDate, systemTz);

  element.textContent = originalText;

  element.addEventListener("mouseenter", () => {
    element.textContent = localText;
  });

  element.addEventListener("mouseleave", () => {
    element.textContent = originalText;
  });
}

function renderModifyCount() {
  if (!dom.modifyCount) {
    return;
  }
  const groupId = dom.modifyGroup?.value;
  if (!groupId) {
    dom.modifyCount.textContent = t("modify.countEmpty");
    return;
  }
  const groupName = getGroupName(groupId) || t("modify.countGroupFallback");
  const optimisticCount = state.modify.optimisticEvents?.size || 0;
  const totalCount = state.modify.events.length + optimisticCount;

  // Base text: "Upcoming events for <group>."
  let countText = t("modify.countStatus", {
    group: groupName,
    count: totalCount
  });

  // Append missed automation text if count > 0
  const missedCount = state.modify.missedCount || 0;
  if (missedCount > 0) {
    const missedKey = missedCount === 1
      ? "modify.missedAutomationNoticeSingular"
      : "modify.missedAutomationNoticePlural";
    const missedText = t(missedKey, { count: missedCount });
    countText += ` <strong>${missedText}</strong>`;
  }

  // Append queued automation text if count > 0
  const queuedCount = state.modify.queuedCount || 0;
  if (queuedCount > 0) {
    const queuedKey = queuedCount === 1
      ? "modify.queuedAutomationNoticeSingular"
      : "modify.queuedAutomationNoticePlural";
    const queuedText = t(queuedKey, { count: queuedCount });
    countText += ` <strong>${queuedText}</strong>`;
  }

  dom.modifyCount.innerHTML = countText; // Use innerHTML to support <strong> tags
}

function getMergedEvents() {
  // Merge real events and pending events, sorted by event start time
  const realEvents = state.modify.events.map(e => ({
    ...e,
    isPending: false,
    sortTime: new Date(e.startsAtUtc || e.endsAtUtc).getTime()
  }));

  const optimisticEvents = Array.from(state.modify.optimisticEvents.values()).map(entry => ({
    ...entry.event,
    isPending: false,
    isOptimistic: true,
    sortTime: new Date(entry.event.startsAtUtc || entry.event.endsAtUtc).getTime()
  }));

  const realSlots = new Set(realEvents.map(getEventSlotKey).filter(Boolean));
  const realIds = new Set(realEvents.map(event => event.id).filter(Boolean));
  const filteredOptimistic = optimisticEvents.filter(event => {
    if (event.eventId && realIds.has(event.eventId)) {
      return false;
    }
    if (event.id && realIds.has(event.id)) {
      return false;
    }
    const slotKey = getEventSlotKey(event);
    return !slotKey || !realSlots.has(slotKey);
  });

  const pendingEvents = state.modify.showPending
    ? state.modify.pendingEvents
      .filter(p => !state.modify.optimisticEvents.has(p.id))
      .map(p => ({
        ...p,
        isPending: true,
        sortTime: new Date(p.eventStartsAt).getTime()
      }))
    : [];

  return [...realEvents, ...filteredOptimistic, ...pendingEvents].sort((a, b) => a.sortTime - b.sortTime);
}

function renderModifyEventGrid() {
  if (!dom.modifyEventGrid) {
    return;
  }
  dom.modifyEventGrid.innerHTML = "";
  if (state.modify.loading) {
    const loading = document.createElement("div");
    loading.className = "hint";
    loading.textContent = t("common.loading");
    dom.modifyEventGrid.appendChild(loading);
    return;
  }

  const mergedEvents = getMergedEvents();

  if (!mergedEvents.length) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = t("modify.empty");
    dom.modifyEventGrid.appendChild(empty);
    return;
  }

  mergedEvents.forEach(event => {
    if (event.isPending) {
      renderPendingCard(event);
    } else {
      renderPublishedCard(event);
    }
  });
}

function renderPublishedCard(event) {
  const card = document.createElement("div");
  card.className = "event-card";
  if (event.isOptimistic) {
    card.classList.add("is-optimistic");
  }
  card.dataset.eventId = event.id;
  card.setAttribute("role", "button");
  card.tabIndex = 0;

  const thumb = document.createElement("div");
  thumb.className = "event-thumb";
  const imageUrl = event.imageUrl || getGroupBanner(event.groupId);
  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = event.title || t("modify.eventImage");
    img.loading = "lazy";
    img.addEventListener("error", () => {
      img.remove();
      const fallback = document.createElement("div");
      fallback.className = "event-thumb-placeholder";
      fallback.textContent = t("modify.noImage");
      thumb.appendChild(fallback);
    });
    thumb.appendChild(img);
    // Try to use cached version
    const imageId = getImageIdForEvent(event);
    if (imageId) {
      loadCachedImageForElement(img, imageId, imageUrl);
    }
  } else {
    const fallback = document.createElement("div");
    fallback.className = "event-thumb-placeholder";
    fallback.textContent = t("modify.noImage");
    thumb.appendChild(fallback);
  }

  const title = document.createElement("h4");
  title.className = "event-title";
  title.textContent = event.title || t("modify.untitled");

  const date = document.createElement("div");
  date.className = "event-date";
  // Published events: show local time, on hover show with timezone code
  const eventDateValue = event.startsAtUtc || event.endsAtUtc;
  const systemTz = getSystemTimezone();
  const normalDateText = formatEventDisplayDate(eventDateValue);
  const hoverDateText = formatDateInTimezone(eventDateValue, systemTz);
  date.textContent = normalDateText;
  date.addEventListener("mouseenter", () => {
    date.textContent = hoverDateText;
  });
  date.addEventListener("mouseleave", () => {
    date.textContent = normalDateText;
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "event-delete";
  deleteBtn.setAttribute("aria-label", t("common.delete"));
  const deleteIcon = document.createElement("span");
  deleteIcon.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zm-6 0h2v9H8V9z"></path>
    </svg>
  `;
  deleteBtn.appendChild(deleteIcon);
  attachHoldToDelete(deleteBtn, () => handleDeleteEvent(event));

  card.appendChild(deleteBtn);
  card.appendChild(thumb);
  card.appendChild(title);
  card.appendChild(date);
  card.addEventListener("click", () => openModifyModal(event));
  card.addEventListener("keydown", evt => {
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      openModifyModal(event);
    }
  });
  dom.modifyEventGrid.appendChild(card);
}

function renderPendingCard(pendingEvent) {
  const card = document.createElement("div");
  card.className = "event-card is-pending";
  if (pendingEvent.status === "missed") {
    card.classList.add("is-missed");
  } else if (pendingEvent.status === "queued") {
    card.classList.add("is-queued");
  }
  card.dataset.pendingId = pendingEvent.id;
  card.setAttribute("role", "button");
  card.tabIndex = 0;

  const thumb = document.createElement("div");
  thumb.className = "event-thumb";

  // Get resolved event details for display
  const details = pendingEvent.resolvedDetails || {};
  const imageUrl = details.imageUrl || getGroupBanner(pendingEvent.groupId);
  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = details.title || t("modify.eventImage");
    img.loading = "lazy";
    img.addEventListener("error", () => {
      img.remove();
      const fallback = document.createElement("div");
      fallback.className = "event-thumb-placeholder";
      fallback.textContent = t("modify.noImage");
      thumb.appendChild(fallback);
    });
    thumb.appendChild(img);
    // Try to use cached version
    const imageId = getImageIdForEvent(details);
    if (imageId) {
      loadCachedImageForElement(img, imageId, imageUrl);
    }
  } else {
    const fallback = document.createElement("div");
    fallback.className = "event-thumb-placeholder";
    fallback.textContent = t("modify.noImage");
    thumb.appendChild(fallback);
  }

  // Hover actions overlay (Post Now, Edit)
  const hoverActions = document.createElement("div");
  hoverActions.className = "pending-hover-actions";

  const postNowBtn = document.createElement("button");
  postNowBtn.type = "button";
  postNowBtn.className = "pending-action-btn pending-post-now";
  postNowBtn.textContent = t("modify.pending.postNow");
  // Disable Post Now for queued events
  if (pendingEvent.status === "queued") {
    postNowBtn.disabled = true;
    postNowBtn.title = t("modify.pending.queuedDisabled");
  }
  if (state.modify.pendingPostNow?.has(pendingEvent.id)) {
    postNowBtn.disabled = true;
  }
  postNowBtn.addEventListener("click", evt => {
    evt.stopPropagation();
    handlePendingPostNow(pendingEvent, postNowBtn);
  });

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "pending-action-btn pending-edit";
  editBtn.textContent = t("modify.pending.edit");
  editBtn.addEventListener("click", evt => {
    evt.stopPropagation();
    handlePendingEdit(pendingEvent);
  });

  hoverActions.appendChild(postNowBtn);
  hoverActions.appendChild(editBtn);
  thumb.appendChild(hoverActions);

  // Status badge
  if (pendingEvent.status === "missed") {
    // Missed badge (exclamation mark)
    const missedBadge = document.createElement("div");
    missedBadge.className = "pending-missed-badge";
    missedBadge.textContent = "!";
    missedBadge.title = t("modify.pending.missedHint");
    thumb.appendChild(missedBadge);
  } else if (pendingEvent.status === "queued") {
    // Queued badge (clock icon)
    const queuedBadge = document.createElement("div");
    queuedBadge.className = "pending-queued-badge";
    queuedBadge.textContent = "⏱";
    queuedBadge.title = t("modify.pending.queuedHint");
    thumb.appendChild(queuedBadge);
  }

  const title = document.createElement("h4");
  title.className = "event-title";
  title.textContent = details.title || t("modify.untitled");

  // Get profile timezone from resolved details (for hover conversion)
  const profileTz = details.timezone || getSystemTimezone();

  const dateRow = document.createElement("div");
  dateRow.className = "event-date";
  setupDateHoverConvert(dateRow, pendingEvent.eventStartsAt, profileTz);
  // Suppress hover overlay when hovering on date row
  dateRow.addEventListener("mouseenter", () => card.classList.add("suppress-hover-overlay"));
  dateRow.addEventListener("mouseleave", () => card.classList.remove("suppress-hover-overlay"));

  // Show scheduled publish time with hover-to-convert
  const publishTime = document.createElement("div");
  publishTime.className = "pending-publish-time";
  const publishTimeSpan = document.createElement("span");
  publishTimeSpan.className = "pending-publish-time-value";
  setupDateHoverConvert(publishTimeSpan, pendingEvent.scheduledPublishTime, profileTz);
  // Build the label with the hoverable time span
  const publishLabel = t("modify.pending.publishAt", { time: "" }).replace(/:\s*$/, ": ");
  publishTime.textContent = publishLabel;
  publishTime.appendChild(publishTimeSpan);
  // Suppress hover overlay when hovering on publish time
  publishTime.addEventListener("mouseenter", () => card.classList.add("suppress-hover-overlay"));
  publishTime.addEventListener("mouseleave", () => card.classList.remove("suppress-hover-overlay"));

  // Delete (cancel) button - same as published cards
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "event-delete";
  deleteBtn.setAttribute("aria-label", t("modify.pending.cancel"));
  const deleteIcon = document.createElement("span");
  deleteIcon.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zm-6 0h2v9H8V9z"></path>
    </svg>
  `;
  deleteBtn.appendChild(deleteIcon);
  attachHoldToDelete(deleteBtn, () => handlePendingCancel(pendingEvent));

  card.appendChild(deleteBtn);
  card.appendChild(thumb);
  card.appendChild(title);
  card.appendChild(dateRow);
  card.appendChild(publishTime);

  // Click card to see details (no edit modal for pending - actions are on hover)
  card.addEventListener("click", () => {
    // Do nothing on card click - actions are in hover overlay
  });

  dom.modifyEventGrid.appendChild(card);
}

async function handlePendingPostNow(pendingEvent, button) {
  if (!modifyApi?.pendingAction) {
    showToast(t("modify.pending.postFailed"), true);
    return;
  }
  if (!pendingEvent?.id) {
    showToast(t("modify.pending.postFailed"), true);
    return;
  }
  if (state.modify.pendingPostNow.has(pendingEvent.id)) {
    return;
  }
  state.modify.pendingPostNow.add(pendingEvent.id);
  if (button) {
    button.disabled = true;
  }
  try {
    const result = await modifyApi.pendingAction({
      pendingEventId: pendingEvent.id,
      action: "postNow"
    });
    if (!result?.ok) {
      showToast(result?.error?.message || t("modify.pending.postFailed"), true);
      return;
    }
    upsertOptimisticEvent(pendingEvent);
    showToast(t("modify.pending.posted"));
    await refreshModifyEvents(modifyApi, { preserveScroll: true });
  } catch (err) {
    showToast(t("modify.pending.postFailed"), true);
  } finally {
    state.modify.pendingPostNow.delete(pendingEvent.id);
    if (button && button.isConnected) {
      button.disabled = pendingEvent.status === "queued";
    }
  }
}

async function handlePendingEdit(pendingEvent) {
  if (!modifyApi?.pendingAction) {
    showToast(t("modify.pending.editFailed"), true);
    return;
  }
  // Store selected pending event and open modify modal with its resolved details
  state.modify.selectedPendingEvent = pendingEvent;
  const details = pendingEvent.resolvedDetails || {};

  // Store current imageUrl for card preview after save
  state.modify.selectedImageUrl = details.imageUrl || "";

  // Create a fake event object for the modify form
  const fakeEvent = {
    id: pendingEvent.id,
    groupId: pendingEvent.groupId,
    title: details.title || "",
    description: details.description || "",
    category: details.category || "hangout",
    tags: details.tags || [],
    accessType: details.accessType || "public",
    imageId: details.imageId || "",
    imageUrl: details.imageUrl || "",
    roleIds: details.roleIds || [],
    languages: details.languages || [],
    platforms: details.platforms || [],
    durationMinutes: details.durationMinutes || 120,
    timezone: details.timezone || "UTC",
    startsAtUtc: pendingEvent.eventStartsAt,
    isPendingEdit: true
  };

  applyModifyFormFromEvent(fakeEvent);
  dom.modifyOverlay.classList.remove("is-hidden");
}

async function handlePendingCancel(pendingEvent) {
  if (!modifyApi?.pendingAction) {
    showToast(t("modify.pending.cancelFailed"), true);
    return;
  }
  try {
    const result = await modifyApi.pendingAction({
      pendingEventId: pendingEvent.id,
      action: "cancel"
    });
    if (!result?.ok) {
      showToast(result?.error?.message || t("modify.pending.cancelFailed"), true);
      return;
    }
    showToast(t("modify.pending.cancelled"));

    // Optimistically remove from local state
    state.modify.pendingEvents = state.modify.pendingEvents.filter(p => p.id !== pendingEvent.id);
    state.modify.optimisticEvents.delete(pendingEvent.id);
    renderModifyEventGrid();
    renderModifyCount();
  } catch (err) {
    showToast(t("modify.pending.cancelFailed"), true);
  }
}

async function handlePendingSave() {
  const pendingEvent = state.modify.selectedPendingEvent;
  if (!pendingEvent) {
    showToast(t("modify.pending.editFailed"), true);
    return;
  }
  if (!modifyApi?.pendingAction) {
    showToast(t("modify.pending.editFailed"), true);
    return;
  }
  if (state.modify.saving) {
    return;
  }
  if (state.modify.tagInput) {
    state.modify.tagInput.commit();
  }

  const tags = state.modify.tagInput
    ? state.modify.tagInput.getTags()
    : enforceTagsInput(dom.modifyEventTags, TAG_LIMIT, true);
  const title = sanitizeText(dom.modifyEventName.value, {
    maxLength: EVENT_NAME_LIMIT,
    allowNewlines: false,
    trim: true
  });
  const description = sanitizeText(dom.modifyEventDescription.value, {
    maxLength: EVENT_DESCRIPTION_LIMIT,
    allowNewlines: true,
    trim: true
  });

  if (!title) {
    showToast(t("modify.requiredSingle", { field: t("common.fields.eventName") }), true);
    return;
  }
  if (!description) {
    showToast(t("modify.requiredSingle", { field: t("common.fields.description") }), true);
    return;
  }

  let durationMinutes = parseDurationInput(dom.modifyEventDuration.value)?.minutes ?? null;
  if (!durationMinutes) {
    durationMinutes = normalizeDurationInput(dom.modifyEventDuration, 120);
  }
  if (!durationMinutes || durationMinutes < 1) {
    showToast(t("modify.durationError"), true);
    return;
  }

  state.modify.saving = true;
  dom.modifySave.disabled = true;

  try {
    // Build manual overrides from form data
    const manualDate = dom.modifyEventDate.value;
    const manualTime = dom.modifyEventTime.value;
    const manualTimezone = dom.modifyEventTimezone.value;

    const manualOverrides = {
      title,
      description,
      category: dom.modifyEventCategory.value,
      accessType: dom.modifyEventAccess.value,
      languages: state.modify.languages.slice(),
      platforms: state.modify.platforms.slice(),
      tags,
      imageId: dom.modifyEventImageId.value.trim() || null,
      imageUrl: state.modify.selectedImageUrl || null,
      roleIds: dom.modifyEventAccess.value === "group" ? state.modify.roleIds.slice() : [],
      durationMinutes,
      timezone: manualTimezone,
      manualDate,
      manualTime
    };

    const result = await modifyApi.pendingAction({
      pendingEventId: pendingEvent.id,
      action: "edit",
      overrides: manualOverrides
    });

    if (!result?.ok) {
      showToast(result?.error?.message || t("modify.pending.editFailed"), true);
      return;
    }

    showToast(t("modify.pending.editSaved"));
    closeModifyModal();
    state.modify.selectedPendingEvent = null;
    await refreshModifyEvents(modifyApi, { preserveScroll: true });
  } catch (err) {
    showToast(t("modify.pending.editFailed"), true);
  } finally {
    state.modify.saving = false;
    dom.modifySave.disabled = false;
  }
}

function renderModifyProfileOptions(groupId) {
  if (!dom.modifyProfile) {
    return;
  }
  dom.modifyProfile.value = "";
  if (!groupId) {
    dom.modifyProfile.innerHTML = "";
    return;
  }
  const profiles = state.profiles[groupId]?.profiles || {};
  const profileKeys = Object.keys(profiles);
  const options = [
    { label: t("modify.profileSelect"), value: "" },
    ...profileKeys.map(key => ({
      label: getProfileLabel(key, profiles[key]),
      value: `${groupId}::${key}`
    }))
  ];
  renderSelect(dom.modifyProfile, options);
}

function renderModifyLanguageList() {
  renderChecklist(dom.modifyLanguageList, LANGUAGES, state.modify.languages, {
    max: 3,
    filterText: dom.modifyLanguageFilter.value,
    getLabel: item => getLanguageDisplayName(item.value, item.label),
    onChange: next => {
      state.modify.languages = next;
      renderModifyLanguageList();
      dom.modifyLanguageHint.textContent = t("common.fields.languagesHint", { count: next.length });
    }
  });
  dom.modifyLanguageHint.textContent = t("common.fields.languagesHint", { count: state.modify.languages.length });
}

function renderModifyPlatformList() {
  renderChecklist(dom.modifyPlatformList, PLATFORMS, state.modify.platforms, {
    onChange: next => {
      state.modify.platforms = next;
      renderModifyPlatformList();
    }
  });
}

function applyModifyFormFromEvent(event) {
  if (!event) {
    return;
  }
  state.modify.selectedEvent = event;
  dom.modifyEventName.value = event.title || "";
  dom.modifyEventDescription.value = event.description || "";
  dom.modifyEventCategory.value = event.category || "hangout";
  if (state.modify.tagInput) {
    state.modify.tagInput.setTags(event.tags || []);
  } else {
    dom.modifyEventTags.value = (event.tags || []).join(", ");
  }
  dom.modifyEventAccess.value = event.accessType || "public";
  enforceGroupAccess(dom.modifyEventAccess, event.groupId);
  dom.modifyEventImageId.value = event.imageId || "";
  state.modify.roleIds = Array.isArray(event.roleIds) ? event.roleIds.slice() : [];
  const { systemTz } = buildTimezones();
  const timezone = event.timezone || systemTz;
  ensureTimezoneOption(dom.modifyEventTimezone, timezone);
  dom.modifyEventTimezone.value = timezone;
  const parts = formatDateParts(event.startsAtUtc || event.endsAtUtc, timezone);
  dom.modifyEventDate.value = parts.date;
  dom.modifyEventTime.value = parts.time;
  dom.modifyEventDuration.value = formatDuration(event.durationMinutes || 120);
  updateModifyDurationPreview();

  state.modify.languages = Array.isArray(event.languages) ? event.languages.slice() : [];
  state.modify.platforms = Array.isArray(event.platforms) ? event.platforms.slice() : [];
  renderModifyLanguageList();
  renderModifyPlatformList();
  renderModifyProfileOptions(event.groupId);
  void renderModifyRoleRestrictions();
}

function openModifyModal(event) {
  if (!dom.modifyOverlay || !event) {
    return;
  }
  if (state.app?.updateAvailable) {
    showToast(t("modify.updateRequired"), true, { duration: 8000 });
    return;
  }
  applyModifyFormFromEvent(event);
  dom.modifyOverlay.classList.remove("is-hidden");
}

function closeModifyModal() {
  if (!dom.modifyOverlay) {
    return;
  }
  dom.modifyOverlay.classList.add("is-hidden");
  state.modify.selectedEvent = null;
  state.modify.selectedPendingEvent = null;
}

function applyProfileToModifyForm(profile) {
  if (!profile) {
    return;
  }
  const groupId = state.modify.selectedEvent?.groupId || dom.modifyGroup?.value || state.modify.selectedGroupId;
  dom.modifyEventName.value = profile.name || dom.modifyEventName.value;
  dom.modifyEventDescription.value = profile.description || dom.modifyEventDescription.value;
  dom.modifyEventCategory.value = profile.category || dom.modifyEventCategory.value || "hangout";
  if (state.modify.tagInput) {
    state.modify.tagInput.setTags(profile.tags || []);
  } else if (profile.tags) {
    dom.modifyEventTags.value = (profile.tags || []).join(", ");
  }
  dom.modifyEventAccess.value = profile.accessType || dom.modifyEventAccess.value || "public";
  enforceGroupAccess(dom.modifyEventAccess, groupId);
  dom.modifyEventImageId.value = profile.imageId || dom.modifyEventImageId.value;
  state.modify.roleIds = Array.isArray(profile.roleIds) ? profile.roleIds.slice() : state.modify.roleIds;
  if (profile.duration) {
    dom.modifyEventDuration.value = formatDuration(profile.duration);
    updateModifyDurationPreview();
  }
  if (profile.timezone) {
    ensureTimezoneOption(dom.modifyEventTimezone, profile.timezone);
    dom.modifyEventTimezone.value = profile.timezone;
  }
  state.modify.languages = Array.isArray(profile.languages) ? profile.languages.slice() : state.modify.languages;
  state.modify.platforms = Array.isArray(profile.platforms) ? profile.platforms.slice() : state.modify.platforms;
  renderModifyLanguageList();
  renderModifyPlatformList();
  void renderModifyRoleRestrictions();
}

function getProfileLabel(profileKey, profile) {
  const label = (profile?.displayName || "").trim();
  return label || profileKey;
}

function attachHoldToDelete(button, onConfirm) {
  let rafId = null;
  let holding = false;
  let startTime = 0;

  const reset = () => {
    holding = false;
    button.classList.remove("is-holding");
    button.style.setProperty("--hold-angle", "0deg");
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const tick = now => {
    if (!holding) {
      return;
    }
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
    button.style.setProperty("--hold-angle", `${progress * 360}deg`);
    if (progress >= 1) {
      reset();
      onConfirm();
      return;
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = event => {
    if (button.disabled) {
      return;
    }
    if (state.app?.updateAvailable) {
      showToast(t("modify.updateRequired"), true, { duration: 8000 });
      return;
    }
    if (getRateLimitRemainingMs(MODIFY_RATE_LIMIT_KEYS.delete) > 0) {
      showToast(t("common.rateLimitError"), true, { duration: 8000 });
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    holding = true;
    startTime = performance.now();
    button.classList.add("is-holding");
    if (typeof button.setPointerCapture === "function") {
      button.setPointerCapture(event.pointerId);
    }
    rafId = requestAnimationFrame(tick);
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", reset);
  button.addEventListener("pointerleave", reset);
  button.addEventListener("pointercancel", reset);
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
  });
}

async function handleDeleteEvent(event) {
  if (!modifyApi?.deleteEvent) {
    showToast(t("modify.deleteFailed"), true);
    return;
  }
  if (!event?.groupId || !event?.id) {
    showToast(t("modify.deleteFailed"), true);
    return;
  }
  if (getRateLimitRemainingMs(MODIFY_RATE_LIMIT_KEYS.delete) > 0) {
    showToast(t("common.rateLimitError"), true, { duration: 8000 });
    return;
  }

  // Check if already pending deletion
  if (state.modify.pendingDeletions.has(event.id)) {
    return;
  }

  // Optimistic UI update: immediately remove from list
  state.modify.pendingDeletions.add(event.id);
  const eventIndex = state.modify.events.findIndex(e => e.id === event.id);
  const deletedEvent = eventIndex >= 0 ? state.modify.events[eventIndex] : null;
  const removedOptimisticEntries = removeOptimisticEntriesForEvent(event);

  // Capture scroll position before render
  const scrollPos = dom.modifyEventGrid ? dom.modifyEventGrid.scrollTop : 0;

  if (eventIndex >= 0) {
    state.modify.events.splice(eventIndex, 1);
  }

  // Re-render immediately without the deleted event
  renderModifyEventGrid();
  renderModifyCount();

  // Restore scroll position
  if (dom.modifyEventGrid && scrollPos > 0) {
    dom.modifyEventGrid.scrollTop = scrollPos;
  }

  // Send delete request to backend in background
  const result = await modifyApi.deleteEvent({ groupId: event.groupId, eventId: event.id });

  // Remove from pending set
  state.modify.pendingDeletions.delete(event.id);

  if (!result?.ok) {
    // Rollback: restore the event to the list
    if (removedOptimisticEntries.length) {
      removedOptimisticEntries.forEach(({ pendingId, entry }) => {
        state.modify.optimisticEvents.set(pendingId, entry);
      });
    }
    if (deletedEvent) {
      // Capture scroll before rollback render
      const rollbackScrollPos = dom.modifyEventGrid ? dom.modifyEventGrid.scrollTop : 0;

      if (eventIndex >= 0 && eventIndex < state.modify.events.length) {
        state.modify.events.splice(eventIndex, 0, deletedEvent);
      } else {
        state.modify.events.push(deletedEvent);
      }
      renderModifyEventGrid();
      renderModifyCount();

      // Restore scroll after rollback
      if (dom.modifyEventGrid && rollbackScrollPos > 0) {
        dom.modifyEventGrid.scrollTop = rollbackScrollPos;
      }
    }

    if (isRateLimitError(result?.error)) {
      registerRateLimit(MODIFY_RATE_LIMIT_KEYS.delete);
      showToast(t("common.rateLimitError"), true, { duration: 8000 });
      return;
    }
    showToast(result?.error?.message || t("modify.deleteFailed"), true);
    return;
  }

  // Success: add to tombstone list to filter out if it reappears
  state.modify.deletedTombstones.set(event.id, Date.now());

  // Clean up old tombstones (older than 60 seconds)
  const now = Date.now();
  for (const [id, timestamp] of state.modify.deletedTombstones) {
    if (now - timestamp > 60000) {
      state.modify.deletedTombstones.delete(id);
    }
  }

  clearRateLimit(MODIFY_RATE_LIMIT_KEYS.delete);
  showToast(t("modify.deleted"));

  // Optionally refresh in background to sync with server (but don't block UI)
  refreshModifyEvents(modifyApi, { preserveSelection: true }).catch(() => {
    // Ignore refresh errors - optimistic delete already succeeded
  });
}

async function handleModifySave() {
  // Check if we're editing a pending event
  if (state.modify.selectedPendingEvent) {
    await handlePendingSave();
    return;
  }

  if (!modifyApi?.updateEvent) {
    showToast(t("modify.saveFailed"), true);
    return;
  }
  if (state.app?.updateAvailable) {
    showToast(t("modify.updateRequired"), true, { duration: 8000 });
    return;
  }
  if (getRateLimitRemainingMs(MODIFY_RATE_LIMIT_KEYS.update) > 0) {
    showToast(t("common.rateLimitError"), true, { duration: 8000 });
    return;
  }
  const event = state.modify.selectedEvent;
  if (!event?.groupId || !event?.id) {
    showToast(t("modify.selectEventError"), true);
    return;
  }
  enforceGroupAccess(dom.modifyEventAccess, event.groupId);
  if (state.modify.saving) {
    return;
  }
  if (state.modify.tagInput) {
    state.modify.tagInput.commit();
  }
  const tags = state.modify.tagInput
    ? state.modify.tagInput.getTags()
    : enforceTagsInput(dom.modifyEventTags, TAG_LIMIT, true);
  const title = sanitizeText(dom.modifyEventName.value, {
    maxLength: EVENT_NAME_LIMIT,
    allowNewlines: false,
    trim: true
  });
  dom.modifyEventName.value = title;
  const description = sanitizeText(dom.modifyEventDescription.value, {
    maxLength: EVENT_DESCRIPTION_LIMIT,
    allowNewlines: true,
    trim: true
  });
  dom.modifyEventDescription.value = description;
  if (!title) {
    showToast(t("modify.requiredSingle", { field: t("common.fields.eventName") }), true);
    return;
  }
  if (!description) {
    showToast(t("modify.requiredSingle", { field: t("common.fields.description") }), true);
    return;
  }
  const manualDate = dom.modifyEventDate.value;
  const manualTime = dom.modifyEventTime.value;
  if (!manualDate || !manualTime) {
    showToast(t("modify.selectDateError"), true);
    return;
  }
  const today = getTodayDateString();
  if (manualDate < today) {
    showToast(t("events.pastDateError"), true);
    return;
  }
  const maxDate = getMaxEventDateString();
  if (manualDate > maxDate) {
    showToast(t("events.futureDateError"), true);
    return;
  }
  let durationMinutes = parseDurationInput(dom.modifyEventDuration.value)?.minutes ?? null;
  if (!durationMinutes) {
    durationMinutes = normalizeDurationInput(dom.modifyEventDuration, 120);
  }
  if (!durationMinutes || durationMinutes < 1) {
    showToast(t("modify.durationError"), true);
    return;
  }
  if (state.modify.languages.length > 3) {
    showToast(t("modify.maxLanguages"), true);
    return;
  }
  state.modify.saving = true;
  dom.modifySave.disabled = true;
  let hitRateLimit = false;

    const eventData = {
      title,
      description,
      category: dom.modifyEventCategory.value,
      accessType: dom.modifyEventAccess.value,
      languages: state.modify.languages.slice(),
      platforms: state.modify.platforms.slice(),
      tags,
      imageId: dom.modifyEventImageId.value.trim() || null,
      roleIds: dom.modifyEventAccess.value === "group" ? state.modify.roleIds.slice() : []
    };
  try {
    const result = await modifyApi.updateEvent({
      groupId: event.groupId,
      eventId: event.id,
      eventData,
      timezone: dom.modifyEventTimezone.value,
      durationMinutes,
      manualDate,
      manualTime
    });
    if (!result?.ok) {
      if (isRateLimitError(result?.error)) {
        hitRateLimit = true;
        registerRateLimit(MODIFY_RATE_LIMIT_KEYS.update);
        showToast(t("common.rateLimitError"), true, { duration: 8000 });
        return;
      }
      showToast(result?.error?.message || t("modify.saveFailed"), true);
      return;
    }
    clearRateLimit(MODIFY_RATE_LIMIT_KEYS.update);
    showToast(t("modify.saved"));
    closeModifyModal();
    await refreshModifyEvents(modifyApi, { preserveSelection: true });
  } finally {
    state.modify.saving = false;
    if (!hitRateLimit) {
      dom.modifySave.disabled = false;
    } else {
      const remainingMs = getRateLimitRemainingMs(MODIFY_RATE_LIMIT_KEYS.update);
      if (remainingMs > 0) {
        window.setTimeout(() => {
          if (!state.modify.saving) {
            dom.modifySave.disabled = false;
          }
        }, remainingMs + 50);
      } else {
        dom.modifySave.disabled = false;
      }
    }
  }

  let removedOptimistic = false;
  if (event?.sourcePendingId && state.modify.optimisticEvents.has(event.sourcePendingId)) {
    state.modify.optimisticEvents.delete(event.sourcePendingId);
    removedOptimistic = true;
  }
  const eventSlotKey = getEventSlotKey(event);
  for (const [pendingId, entry] of state.modify.optimisticEvents.entries()) {
    const optimistic = entry?.event;
    if (!optimistic) {
      continue;
    }
    if (optimistic.eventId && event.id && optimistic.eventId === event.id) {
      state.modify.optimisticEvents.delete(pendingId);
      removedOptimistic = true;
      continue;
    }
    if (optimistic.id && event.id && optimistic.id === event.id) {
      state.modify.optimisticEvents.delete(pendingId);
      removedOptimistic = true;
      continue;
    }
    if (eventSlotKey && eventSlotKey === getEventSlotKey(optimistic)) {
      state.modify.optimisticEvents.delete(pendingId);
      removedOptimistic = true;
    }
  }
  if (removedOptimistic) {
    const refreshScrollPos = dom.modifyEventGrid ? dom.modifyEventGrid.scrollTop : 0;
    renderModifyEventGrid();
    renderModifyCount();
    if (dom.modifyEventGrid && refreshScrollPos > 0) {
      dom.modifyEventGrid.scrollTop = refreshScrollPos;
    }
  }
}

function handleProfileLoad() {
  const value = dom.modifyProfile.value;
  if (!value) {
    showToast(t("modify.profileSelectError"), true);
    return;
  }
  const [groupId, profileKey] = value.split("::");
  const profile = state.profiles?.[groupId]?.profiles?.[profileKey];
  if (!profile) {
    showToast(t("modify.profileLoadFailed"), true);
    return;
  }
  applyProfileToModifyForm(profile);
  showToast(t("modify.profileLoaded"));
}

// Track current refresh promise to fix race conditions
let currentRefreshPromise = null;

export async function refreshModifyEvents(api, options = {}) {
  // If already refreshing, wait for it to complete
  if (currentRefreshPromise) {
    await currentRefreshPromise;
    return;
  }

  currentRefreshPromise = performRefresh(api, options);
  try {
    await currentRefreshPromise;
  } finally {
    currentRefreshPromise = null;
  }
}

async function performRefresh(api, options = {}) {
  const { preserveScroll = true } = options;

  if (api) {
    modifyApi = api;
  }
  if (!modifyApi?.listGroupEvents || !dom.modifyGroup) {
    state.modify.events = [];
    state.modify.pendingEvents = [];
    renderModifyEventGrid();
    renderModifyCount();
    updateMissedBadge();
    return;
  }
  const groupId = dom.modifyGroup.value;
  if (!groupId) {
    state.modify.events = [];
    state.modify.pendingEvents = [];
    renderModifyEventGrid();
    renderModifyCount();
    updateMissedBadge();
    return;
  }

  // Capture scroll position before refresh
  const scrollPos = preserveScroll && dom.modifyEventGrid ? dom.modifyEventGrid.scrollTop : 0;

  state.modify.selectedGroupId = groupId;
  setModifyLoading(true);
  renderModifyEventGrid();

  try {
    // Fetch both real events and pending events in parallel
    const [events, pendingResult] = await Promise.all([
      modifyApi.listGroupEvents({ groupId, upcomingOnly: true }),
      modifyApi.getPendingEvents ? modifyApi.getPendingEvents({ groupId }) : Promise.resolve({ events: [], missedCount: 0 })
    ]);

    let filteredEvents = Array.isArray(events) ? events : [];

    // Filter out tombstoned (recently deleted) events
    const now = Date.now();
    filteredEvents = filteredEvents.filter(event => {
      const tombstoneTime = state.modify.deletedTombstones.get(event.id);
      if (tombstoneTime && now - tombstoneTime < 60000) {
        return false; // Event was recently deleted, filter it out
      }
      return true;
    });

    state.modify.events = filteredEvents;

    // Process pending events with resolved details
    const pendingEvents = pendingResult?.events || [];

    state.modify.pendingEvents = pendingEvents;
    state.modify.missedCount = pendingResult?.missedCount || 0;
    state.modify.queuedCount = pendingResult?.queuedCount || 0;
    reconcileOptimisticEvents(filteredEvents, pendingEvents, groupId);

    // Success - clear any refresh backoff
    if (options.bypassCache) {
      clearRefreshBackoff();
    }
  } catch (err) {
    // Check for 429 rate limit
    if (isRateLimitError(err)) {
      applyRefreshBackoff();
      throw err; // Re-throw to be handled by caller
    }

    showToast(t("modify.loadFailed"), true);
    state.modify.events = [];
    state.modify.pendingEvents = [];
  } finally {
    setModifyLoading(false);
    renderModifyEventGrid();
    renderModifyCount();
    updateMissedBadge();

    // Restore scroll position
    if (preserveScroll && dom.modifyEventGrid && scrollPos > 0) {
      dom.modifyEventGrid.scrollTop = scrollPos;
    }
  }
}

function updateMissedBadge() {
  // Update the badge on the Modify Events nav button
  const modifyNavBtn = Array.from(dom.navButtons || []).find(btn =>
    btn.dataset.view === "modify"
  );
  if (!modifyNavBtn) {
    return;
  }

  // Remove existing badge
  const existingBadge = modifyNavBtn.querySelector(".nav-badge");
  if (existingBadge) {
    existingBadge.remove();
  }

  // Add badge if there are missed events
  if (state.modify.missedCount > 0) {
    const badge = document.createElement("span");
    badge.className = "nav-badge";
    badge.textContent = state.modify.missedCount > 9 ? "9+" : state.modify.missedCount;
    modifyNavBtn.appendChild(badge);
  }
}

export function initModifyEvents(api) {
  if (api) {
    modifyApi = api;
  }
  if (!dom.modifyEventGrid) {
    return;
  }

  // Listen for automated event creation to refresh the view
  if (api?.onAutomationCreated) {
    api.onAutomationCreated((payload) => {
      if (payload?.pendingEvent) {
        upsertOptimisticEvent(payload.pendingEvent, payload.eventDetails, payload.eventId);
      }
      void refreshModifyEvents(modifyApi, { bypassCache: true });
    });
  }

  dom.modifyRefresh.addEventListener("click", () => { void handleRefreshClick(); });
  dom.modifyGroup.addEventListener("change", () => {
    // Clear backoff and tombstones when switching groups
    clearRefreshBackoff();
    state.modify.deletedTombstones.clear();
    state.modify.lastRefreshTime = 0;
    state.modify.optimisticEvents.clear();
    void refreshModifyEvents(modifyApi);
  });
  if (dom.modifyShowPending) {
    dom.modifyShowPending.addEventListener("change", () => {
      state.modify.showPending = dom.modifyShowPending.checked;
      renderModifyEventGrid();
    });
  }
  if (dom.modifyClose) {
    dom.modifyClose.addEventListener("click", closeModifyModal);
  }
  if (dom.modifyCancel) {
    dom.modifyCancel.addEventListener("click", closeModifyModal);
  }
  if (dom.modifyOverlay) {
    dom.modifyOverlay.addEventListener("click", event => {
      if (event.target === dom.modifyOverlay) {
        closeModifyModal();
      }
    });
  }
  if (dom.modifySave) {
    dom.modifySave.addEventListener("click", handleModifySave);
  }
  if (dom.modifyProfileLoad) {
    dom.modifyProfileLoad.addEventListener("click", handleProfileLoad);
  }
  if (dom.modifyLanguageFilter) {
    dom.modifyLanguageFilter.addEventListener("input", renderModifyLanguageList);
  }
  if (dom.modifyEventDate) {
    const today = getTodayDateString();
    const maxDate = getMaxEventDateString();
    dom.modifyEventDate.min = today;
    dom.modifyEventDate.max = maxDate;
    dom.modifyEventDate.addEventListener("blur", () => {
      const selectedDate = dom.modifyEventDate.value;
      if (!selectedDate) {
        return;
      }
      const currentToday = getTodayDateString();
      const currentMax = getMaxEventDateString();
      if (selectedDate < currentToday) {
        showToast(t("events.pastDateError"), true);
        dom.modifyEventDate.value = currentToday;
      } else if (selectedDate > currentMax) {
        showToast(t("events.futureDateError"), true);
        dom.modifyEventDate.value = currentMax;
      }
    });
  }
  if (dom.modifyEventAccess) {
    dom.modifyEventAccess.addEventListener("change", handleModifyAccessChange);
  }
  if (dom.modifyEventDuration) {
    dom.modifyEventDuration.addEventListener("input", () => {
      dom.modifyEventDuration.value = sanitizeDurationInputValue(dom.modifyEventDuration.value);
      updateModifyDurationPreview();
    });
    dom.modifyEventDuration.addEventListener("blur", () => {
      normalizeDurationInput(dom.modifyEventDuration, 120);
      updateModifyDurationPreview();
    });
  }
  state.modify.tagInput = createTagInput({
    inputEl: dom.modifyEventTags,
    chipContainer: dom.modifyTagsChips,
    wrapperEl: dom.modifyTagsInput,
    maxTags: TAG_LIMIT
  });
  // Listen for gallery selection to capture image URL for pending event preview
  if (dom.modifyEventImageId) {
    dom.modifyEventImageId.addEventListener("gallerySelect", evt => {
      state.modify.selectedImageUrl = evt.detail?.url || "";
    });
  }
  renderModifyLanguageList();
  renderModifyPlatformList();
}

export function syncModifyLocalization() {
  renderModifyLanguageList();
  renderModifyPlatformList();
  renderModifyCount();
  renderModifyEventGrid();
  void renderModifyRoleRestrictions();
}

export function initModifySelects() {
  if (!dom.modifyEventCategory || !dom.modifyEventAccess || !dom.modifyEventTimezone) {
    return;
  }
  renderSelect(dom.modifyEventCategory, CATEGORIES);
  renderSelect(dom.modifyEventAccess, ACCESS_TYPES);
  const { list, systemTz } = buildTimezones();
  renderSelect(dom.modifyEventTimezone, list);
  dom.modifyEventTimezone.value = systemTz;
}
