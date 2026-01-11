const { DateTime } = require("luxon");
const { generateDateOptionsFromPatterns, safeZone } = require("../../electron/core/date-utils");

const GROUP_IDS = {
  default: "demo-default",
  conflict: "demo-conflict",
  rate: "demo-rate",
  automationBefore: "demo-automation-before",
  automationAfter: "demo-automation-after",
  automationMonthly: "demo-automation-monthly",
  custom: "demo-custom"
};

const DEMO_USER = {
  id: "demo-user",
  userId: "demo-user",
  displayName: "Demo User"
};

const DEMO_IMAGE_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAf8f1tAAAAAASUVORK5CYII=";

const PROFILE_LOCKS = {
  [GROUP_IDS.default]: "immutable",
  [GROUP_IDS.conflict]: "immutable",
  [GROUP_IDS.rate]: "immutable",
  [GROUP_IDS.automationBefore]: "automation-only",
  [GROUP_IDS.automationAfter]: "automation-only",
  [GROUP_IDS.automationMonthly]: "automation-only",
  [GROUP_IDS.custom]: "open"
};

const EVENT_BEHAVIORS = {
  [GROUP_IDS.conflict]: "conflict",
  [GROUP_IDS.rate]: "rate-limit"
};

const HOURLY_HISTORY_SEED = {
  [GROUP_IDS.default]: 3,
  [GROUP_IDS.conflict]: 1,
  [GROUP_IDS.rate]: 8,
  [GROUP_IDS.automationBefore]: 2,
  [GROUP_IDS.automationAfter]: 1,
  [GROUP_IDS.automationMonthly]: 4,
  [GROUP_IDS.custom]: 0
};

function buildEventTimes({ selectedDateIso, manualDate, manualTime, timezone, durationMinutes }) {
  let start;
  if (selectedDateIso) {
    start = DateTime.fromISO(selectedDateIso, { setZone: true });
  } else {
    if (!manualDate || !manualTime) {
      throw new Error("Manual date and time required.");
    }
    const zone = safeZone(timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    start = DateTime.fromISO(`${manualDate}T${manualTime}`, { zone });
  }
  if (!start.isValid) {
    throw new Error("Invalid date or time.");
  }
  const minutes = Number(durationMinutes) || 0;
  const end = start.plus({ minutes });
  return {
    startLocal: start,
    endLocal: end,
    startsAtUtc: start.setZone("UTC").toISO(),
    endsAtUtc: end.setZone("UTC").toISO()
  };
}

function buildGalleryFiles(now) {
  return [
    {
      id: "file_demo_skyline",
      name: "Skyline",
      extension: ".png",
      mimeType: "image/png",
      tags: ["gallery"],
      previewUrl: DEMO_IMAGE_URL,
      createdAt: now.minus({ days: 2 }).toISO()
    },
    {
      id: "file_demo_stage",
      name: "Stage",
      extension: ".png",
      mimeType: "image/png",
      tags: ["gallery"],
      previewUrl: DEMO_IMAGE_URL,
      createdAt: now.minus({ days: 5 }).toISO()
    },
    {
      id: "file_demo_arcade",
      name: "Arcade",
      extension: ".png",
      mimeType: "image/png",
      tags: ["gallery"],
      previewUrl: DEMO_IMAGE_URL,
      createdAt: now.minus({ days: 10 }).toISO()
    },
    {
      id: "file_demo_meetup",
      name: "Meetup",
      extension: ".png",
      mimeType: "image/png",
      tags: ["gallery"],
      previewUrl: DEMO_IMAGE_URL,
      createdAt: now.minus({ days: 15 }).toISO()
    }
  ];
}

function buildGroups() {
  return [
    {
      groupId: GROUP_IDS.default,
      id: GROUP_IDS.default,
      name: "Default Showcase",
      canManageCalendar: true,
      privacy: "public"
    },
    {
      groupId: GROUP_IDS.conflict,
      id: GROUP_IDS.conflict,
      name: "Conflict Lab",
      canManageCalendar: true,
      privacy: "private"
    },
    {
      groupId: GROUP_IDS.rate,
      id: GROUP_IDS.rate,
      name: "Rate Limit Lab",
      canManageCalendar: true,
      privacy: "public"
    },
    {
      groupId: GROUP_IDS.automationBefore,
      id: GROUP_IDS.automationBefore,
      name: "Automation - Before",
      canManageCalendar: true,
      privacy: "private"
    },
    {
      groupId: GROUP_IDS.automationAfter,
      id: GROUP_IDS.automationAfter,
      name: "Automation - After",
      canManageCalendar: true,
      privacy: "public"
    },
    {
      groupId: GROUP_IDS.automationMonthly,
      id: GROUP_IDS.automationMonthly,
      name: "Automation - Monthly",
      canManageCalendar: true,
      privacy: "public"
    },
    {
      groupId: GROUP_IDS.custom,
      id: GROUP_IDS.custom,
      name: "Custom Sandbox",
      canManageCalendar: true,
      privacy: "public"
    }
  ];
}

function buildProfiles() {
  const automationDefaults = {
    enabled: false,
    timingMode: "before",
    daysOffset: 7,
    hoursOffset: 0,
    minutesOffset: 0,
    monthlyDay: 1,
    monthlyHour: 18,
    monthlyMinute: 0,
    repeatMode: "indefinite",
    repeatCount: 10
  };

  return {
    [GROUP_IDS.default]: {
      groupId: GROUP_IDS.default,
      groupName: "Default Showcase",
      profiles: {
        showcase: {
          displayName: "Showcase Profile",
          name: "VRC Demo Hangout",
          description: "A baseline profile showing the core event fields.",
          category: "hangout",
          languages: ["eng", "jpn"],
          platforms: ["standalonewindows", "android"],
          tags: ["demo", "showcase", "baseline"],
          accessType: "public",
          roleIds: [],
          imageId: "file_demo_skyline",
          duration: 120,
          sendNotification: true,
          timezone: "America/Los_Angeles",
          dateMode: "both",
          patterns: [
            { type: "every", weekday: "monday", hour: 19, minute: 0 },
            { type: "every-other", weekday: "wednesday", hour: 20, minute: 30 },
            { type: "last", weekday: "sunday", hour: 18, minute: 0 },
            { type: "annual", month: 12, day: 31, hour: 21, minute: 0 }
          ],
          automation: { ...automationDefaults }
        }
      }
    },
    [GROUP_IDS.conflict]: {
      groupId: GROUP_IDS.conflict,
      groupName: "Conflict Lab",
      profiles: {
        conflict: {
          displayName: "Conflict Tester",
          name: "Booked Stage Night",
          description: "A profile that always triggers a conflict warning.",
          category: "performance",
          languages: ["eng"],
          platforms: ["standalonewindows"],
          tags: ["conflict", "stage"],
          accessType: "group",
          roleIds: ["role-owner", "role-mod"],
          imageId: "file_demo_stage",
          duration: 90,
          sendNotification: true,
          timezone: "America/New_York",
          dateMode: "manual",
          patterns: [],
          automation: { ...automationDefaults }
        }
      }
    },
    [GROUP_IDS.rate]: {
      groupId: GROUP_IDS.rate,
      groupName: "Rate Limit Lab",
      profiles: {
        rateLimit: {
          displayName: "Rate Limit Stress",
          name: "Rapid Event Burst",
          description: "This profile simulates API rate limiting.",
          category: "gaming",
          languages: ["eng", "spa"],
          platforms: ["standalonewindows", "android"],
          tags: ["rate-limit", "stress"],
          accessType: "public",
          roleIds: [],
          imageId: "file_demo_arcade",
          duration: 60,
          sendNotification: false,
          timezone: "UTC",
          dateMode: "manual",
          patterns: [],
          automation: { ...automationDefaults }
        }
      }
    },
    [GROUP_IDS.automationBefore]: {
      groupId: GROUP_IDS.automationBefore,
      groupName: "Automation - Before",
      profiles: {
        before: {
          displayName: "Weekly Event (Posts 3 Days Before)",
          name: "Weekly Session - 3 Days Before",
          description: "Every Friday at 7 PM. Automation publishes 3 days before each event.",
          category: "education",
          languages: ["eng", "fra"],
          platforms: ["standalonewindows"],
          tags: ["automation", "before"],
          accessType: "group",
          roleIds: ["role-owner"],
          imageId: "file_demo_meetup",
          duration: 75,
          sendNotification: true,
          timezone: "Europe/Paris",
          dateMode: "pattern",
          patterns: [
            { type: "every", weekday: "friday", hour: 19, minute: 0 }
          ],
          automation: {
            ...automationDefaults,
            enabled: true,
            timingMode: "before",
            daysOffset: 3,
            hoursOffset: 0,
            minutesOffset: 0
          }
        }
      }
    },
    [GROUP_IDS.automationAfter]: {
      groupId: GROUP_IDS.automationAfter,
      groupName: "Automation - After",
      profiles: {
        after: {
          displayName: "Bi-Weekly Event (Posts 3 Days After)",
          name: "Bi-Weekly Session - 3 Days After",
          description: "Every other Tuesday at 8:30 PM. Automation publishes 3 days after each event ends.",
          category: "wellness",
          languages: ["eng", "por"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "after"],
          accessType: "public",
          roleIds: [],
          imageId: "file_demo_skyline",
          duration: 105,
          sendNotification: true,
          timezone: "America/Sao_Paulo",
          dateMode: "pattern",
          patterns: [
            { type: "every-other", weekday: "tuesday", hour: 20, minute: 30 }
          ],
          automation: {
            ...automationDefaults,
            enabled: true,
            timingMode: "after",
            daysOffset: 3,
            hoursOffset: 0,
            minutesOffset: 0
          }
        }
      }
    },
    [GROUP_IDS.automationMonthly]: {
      groupId: GROUP_IDS.automationMonthly,
      groupName: "Automation - Monthly",
      profiles: {
        monthly: {
          displayName: "Weekly Event (Monthly on 11th)",
          name: "Weekly Spotlight - Monthly on 11th",
          description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
          category: "music",
          languages: ["eng", "kor"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "monthly"],
          accessType: "public",
          roleIds: [],
          imageId: "file_demo_stage",
          duration: 90,
          sendNotification: true,
          timezone: "Asia/Seoul",
          dateMode: "pattern",
          patterns: [
            { type: "every", weekday: "saturday", hour: 18, minute: 0 }
          ],
          automation: {
            ...automationDefaults,
            enabled: true,
            timingMode: "monthly",
            monthlyDay: 11,
            monthlyHour: 19,
            monthlyMinute: 30,
            repeatMode: "count",
            repeatCount: 4
          }
        }
      }
    },
    [GROUP_IDS.custom]: {
      groupId: GROUP_IDS.custom,
      groupName: "Custom Sandbox",
      profiles: {}
    }
  };
}

function buildEvents(now, galleryMap) {
  const makeEvent = ({
    id,
    groupId,
    title,
    description,
    category,
    accessType,
    languages,
    platforms,
    tags,
    imageId,
    roleIds,
    startsAt,
    durationMinutes,
    timezone,
    createdAt
  }) => {
    const startsAtUtc = startsAt.toUTC().toISO();
    const endsAtUtc = startsAt.plus({ minutes: durationMinutes }).toUTC().toISO();
    const imageUrl = imageId && galleryMap[imageId] ? galleryMap[imageId].previewUrl : null;
    return {
      id,
      groupId,
      title,
      description,
      category,
      accessType,
      languages,
      platforms,
      tags,
      imageId: imageId || null,
      imageUrl,
      roleIds: roleIds || [],
      startsAtUtc,
      endsAtUtc,
      createdAtUtc: createdAt ? createdAt.toUTC().toISO() : now.minus({ hours: 3 }).toISO(),
      durationMinutes,
      timezone: timezone || "UTC"
    };
  };

  return {
    [GROUP_IDS.default]: [
      makeEvent({
        id: "demo-event-default-1",
        groupId: GROUP_IDS.default,
        title: "Demo: Scheduled Hangout",
        description: "A scheduled event preview with complete details.",
        category: "hangout",
        accessType: "public",
        languages: ["eng", "jpn"],
        platforms: ["standalonewindows", "android"],
        tags: ["scheduled", "demo"],
        imageId: "file_demo_skyline",
        roleIds: [],
        startsAt: now.plus({ days: 1 }).set({ hour: 19, minute: 0, second: 0, millisecond: 0 }),
        durationMinutes: 120,
        timezone: "America/Los_Angeles",
        createdAt: now.minus({ minutes: 25 })
      })
    ],
    [GROUP_IDS.conflict]: [
      makeEvent({
        id: "demo-event-conflict-1",
        groupId: GROUP_IDS.conflict,
        title: "Conflict: Stage Night",
        description: "This event is already scheduled and will trigger conflicts.",
        category: "performance",
        accessType: "group",
        languages: ["eng"],
        platforms: ["standalonewindows"],
        tags: ["conflict", "stage"],
        imageId: "file_demo_stage",
        roleIds: ["role-owner"],
        startsAt: now.plus({ days: 2 }).set({ hour: 20, minute: 0, second: 0, millisecond: 0 }),
        durationMinutes: 90,
        timezone: "America/New_York",
        createdAt: now.minus({ minutes: 40 })
      })
    ],
    [GROUP_IDS.rate]: [
      makeEvent({
        id: "demo-event-rate-1",
        groupId: GROUP_IDS.rate,
        title: "Rate Limit Preview",
        description: "This event is visible while create requests are rate limited.",
        category: "gaming",
        accessType: "public",
        languages: ["eng", "spa"],
        platforms: ["standalonewindows", "android"],
        tags: ["rate-limit"],
        imageId: "file_demo_arcade",
        roleIds: [],
        startsAt: now.plus({ days: 3 }).set({ hour: 18, minute: 30, second: 0, millisecond: 0 }),
        durationMinutes: 60,
        timezone: "UTC",
        createdAt: now.minus({ minutes: 10 })
      })
    ],
    [GROUP_IDS.automationBefore]: [
      makeEvent({
        id: "demo-event-before-1",
        groupId: GROUP_IDS.automationBefore,
        title: "Weekly Session - 3 Days Before",
        description: "Every Friday at 7 PM. Automation publishes 3 days before each event.",
        category: "education",
        accessType: "group",
        languages: ["eng", "fra"],
        platforms: ["standalonewindows"],
        tags: ["automation", "before"],
        imageId: "file_demo_meetup",
        roleIds: ["role-owner"],
        startsAt: now.minus({ days: 14 }).set({ hour: 19, minute: 0, second: 0, millisecond: 0 }),
        durationMinutes: 75,
        timezone: "Europe/Paris",
        createdAt: now.minus({ days: 17 })
      }),
      makeEvent({
        id: "demo-event-before-2",
        groupId: GROUP_IDS.automationBefore,
        title: "Weekly Session - 3 Days Before",
        description: "Every Friday at 7 PM. Automation publishes 3 days before each event.",
        category: "education",
        accessType: "group",
        languages: ["eng", "fra"],
        platforms: ["standalonewindows"],
        tags: ["automation", "before"],
        imageId: "file_demo_meetup",
        roleIds: ["role-owner"],
        startsAt: now.minus({ days: 7 }).set({ hour: 19, minute: 0, second: 0, millisecond: 0 }),
        durationMinutes: 75,
        timezone: "Europe/Paris",
        createdAt: now.minus({ days: 10 })
      }),
      makeEvent({
        id: "demo-event-before-3",
        groupId: GROUP_IDS.automationBefore,
        title: "Weekly Session - 3 Days Before",
        description: "Every Friday at 7 PM. Automation publishes 3 days before each event.",
        category: "education",
        accessType: "group",
        languages: ["eng", "fra"],
        platforms: ["standalonewindows"],
        tags: ["automation", "before"],
        imageId: "file_demo_meetup",
        roleIds: ["role-owner"],
        startsAt: now.plus({ days: 2 }).set({ hour: 19, minute: 0, second: 0, millisecond: 0 }),
        durationMinutes: 75,
        timezone: "Europe/Paris",
        createdAt: now.minus({ days: 1 })
      })
    ],
    [GROUP_IDS.automationAfter]: [
      makeEvent({
        id: "demo-event-after-1",
        groupId: GROUP_IDS.automationAfter,
        title: "Bi-Weekly Session - 3 Days After",
        description: "Every other Tuesday at 8:30 PM. Automation publishes 3 days after each event ends.",
        category: "wellness",
        accessType: "public",
        languages: ["eng", "por"],
        platforms: ["standalonewindows", "android"],
        tags: ["automation", "after"],
        imageId: "file_demo_skyline",
        roleIds: [],
        startsAt: now.minus({ days: 28 }).set({ hour: 20, minute: 30, second: 0, millisecond: 0 }),
        durationMinutes: 105,
        timezone: "America/Sao_Paulo",
        createdAt: now.minus({ days: 35 })
      }),
      makeEvent({
        id: "demo-event-after-2",
        groupId: GROUP_IDS.automationAfter,
        title: "Bi-Weekly Session - 3 Days After",
        description: "Every other Tuesday at 8:30 PM. Automation publishes 3 days after each event ends.",
        category: "wellness",
        accessType: "public",
        languages: ["eng", "por"],
        platforms: ["standalonewindows", "android"],
        tags: ["automation", "after"],
        imageId: "file_demo_skyline",
        roleIds: [],
        startsAt: now.minus({ days: 14 }).set({ hour: 20, minute: 30, second: 0, millisecond: 0 }),
        durationMinutes: 105,
        timezone: "America/Sao_Paulo",
        createdAt: now.minus({ days: 17 })
      }),
      makeEvent({
        id: "demo-event-after-3",
        groupId: GROUP_IDS.automationAfter,
        title: "Bi-Weekly Session - 3 Days After",
        description: "Every other Tuesday at 8:30 PM. Automation publishes 3 days after each event ends.",
        category: "wellness",
        accessType: "public",
        languages: ["eng", "por"],
        platforms: ["standalonewindows", "android"],
        tags: ["automation", "after"],
        imageId: "file_demo_skyline",
        roleIds: [],
        startsAt: now.minus({ days: 2 }).set({ hour: 20, minute: 30, second: 0, millisecond: 0 }),
        durationMinutes: 105,
        timezone: "America/Sao_Paulo",
        createdAt: now.minus({ days: 5 })
      })
    ],
    [GROUP_IDS.automationMonthly]: [
      // Last month's batch (4 weekly Saturdays, all published on the 11th)
      makeEvent({
        id: "demo-event-monthly-1",
        groupId: GROUP_IDS.automationMonthly,
        title: "Weekly Spotlight - Monthly on 11th",
        description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
        category: "music",
        accessType: "public",
        languages: ["eng", "kor"],
        platforms: ["standalonewindows", "android"],
        tags: ["automation", "monthly"],
        imageId: "file_demo_stage",
        roleIds: [],
        startsAt: now.minus({ days: 28 }).set({ hour: 18, minute: 0, second: 0, millisecond: 0 }),
        durationMinutes: 90,
        timezone: "Asia/Seoul",
        createdAt: now.minus({ days: 35 })
      }),
      makeEvent({
        id: "demo-event-monthly-2",
        groupId: GROUP_IDS.automationMonthly,
        title: "Weekly Spotlight - Monthly on 11th",
        description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
        category: "music",
        accessType: "public",
        languages: ["eng", "kor"],
        platforms: ["standalonewindows", "android"],
        tags: ["automation", "monthly"],
        imageId: "file_demo_stage",
        roleIds: [],
        startsAt: now.minus({ days: 21 }).set({ hour: 18, minute: 0, second: 0, millisecond: 0 }),
        durationMinutes: 90,
        timezone: "Asia/Seoul",
        createdAt: now.minus({ days: 35 })
      }),
      makeEvent({
        id: "demo-event-monthly-3",
        groupId: GROUP_IDS.automationMonthly,
        title: "Weekly Spotlight - Monthly on 11th",
        description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
        category: "music",
        accessType: "public",
        languages: ["eng", "kor"],
        platforms: ["standalonewindows", "android"],
        tags: ["automation", "monthly"],
        imageId: "file_demo_stage",
        roleIds: [],
        startsAt: now.minus({ days: 14 }).set({ hour: 18, minute: 0, second: 0, millisecond: 0 }),
        durationMinutes: 90,
        timezone: "Asia/Seoul",
        createdAt: now.minus({ days: 35 })
      }),
      makeEvent({
        id: "demo-event-monthly-4",
        groupId: GROUP_IDS.automationMonthly,
        title: "Weekly Spotlight - Monthly on 11th",
        description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
        category: "music",
        accessType: "public",
        languages: ["eng", "kor"],
        platforms: ["standalonewindows", "android"],
        tags: ["automation", "monthly"],
        imageId: "file_demo_stage",
        roleIds: [],
        startsAt: now.minus({ days: 7 }).set({ hour: 18, minute: 0, second: 0, millisecond: 0 }),
        durationMinutes: 90,
        timezone: "Asia/Seoul",
        createdAt: now.minus({ days: 35 })
      })
    ],
    [GROUP_IDS.custom]: []
  };
}

function buildPendingEvents(now, galleryMap) {
  const makeResolvedDetails = ({
    title,
    description,
    category,
    accessType,
    languages,
    platforms,
    tags,
    imageId,
    durationMinutes,
    timezone,
    roleIds
  }) => ({
    title,
    description,
    category,
    accessType,
    languages,
    platforms,
    tags,
    imageId: imageId || null,
    imageUrl: imageId && galleryMap[imageId] ? galleryMap[imageId].previewUrl : null,
    durationMinutes,
    timezone,
    roleIds: roleIds || []
  });

  return {
    [GROUP_IDS.default]: [
      {
        id: "pending-default-missed",
        groupId: GROUP_IDS.default,
        profileKey: "showcase",
        status: "missed",
        eventStartsAt: now.minus({ hours: 6 }).toISO(),
        scheduledPublishTime: now.minus({ hours: 8 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Missed Automation: Monday Hangout",
          description: "A missed automation that can be posted now.",
          category: "hangout",
          accessType: "public",
          languages: ["eng", "jpn"],
          platforms: ["standalonewindows", "android"],
          tags: ["demo", "showcase", "baseline"],
          imageId: "file_demo_skyline",
          durationMinutes: 120,
          timezone: "America/Los_Angeles"
        })
      },
      {
        id: "pending-default-queued",
        groupId: GROUP_IDS.default,
        profileKey: "showcase",
        status: "queued",
        eventStartsAt: now.plus({ hours: 12 }).toISO(),
        scheduledPublishTime: now.plus({ hours: 2 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Queued Automation: Wednesday Hangout",
          description: "Queued while rate limits are active.",
          category: "hangout",
          accessType: "public",
          languages: ["eng", "jpn"],
          platforms: ["standalonewindows", "android"],
          tags: ["demo", "showcase", "baseline"],
          imageId: "file_demo_skyline",
          durationMinutes: 120,
          timezone: "America/Los_Angeles"
        })
      },
      {
        id: "pending-default-upcoming",
        groupId: GROUP_IDS.default,
        profileKey: "showcase",
        status: "pending",
        eventStartsAt: now.plus({ days: 3 }).toISO(),
        scheduledPublishTime: now.plus({ days: 2, hours: 12 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Pending Automation: Sunday Hangout",
          description: "Upcoming automation waiting on its publish window.",
          category: "hangout",
          accessType: "public",
          languages: ["eng", "jpn"],
          platforms: ["standalonewindows", "android"],
          tags: ["demo", "showcase", "baseline"],
          imageId: "file_demo_skyline",
          durationMinutes: 120,
          timezone: "America/Los_Angeles"
        })
      }
    ],
    [GROUP_IDS.automationBefore]: [
      {
        id: "pending-before-queued",
        groupId: GROUP_IDS.automationBefore,
        profileKey: "before",
        status: "queued",
        eventStartsAt: now.plus({ days: 3 }).toISO(),
        scheduledPublishTime: now.toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Session - 3 Days Before",
          description: "Every Friday at 7 PM. Automation publishes 3 days before each event.",
          category: "education",
          accessType: "group",
          languages: ["eng", "fra"],
          platforms: ["standalonewindows"],
          tags: ["automation", "before"],
          imageId: "file_demo_meetup",
          durationMinutes: 75,
          timezone: "Europe/Paris",
          roleIds: ["role-owner"]
        })
      },
      {
        id: "pending-before-pending-1",
        groupId: GROUP_IDS.automationBefore,
        profileKey: "before",
        status: "pending",
        eventStartsAt: now.plus({ days: 10 }).toISO(),
        scheduledPublishTime: now.plus({ days: 7 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Session - 3 Days Before",
          description: "Every Friday at 7 PM. Automation publishes 3 days before each event.",
          category: "education",
          accessType: "group",
          languages: ["eng", "fra"],
          platforms: ["standalonewindows"],
          tags: ["automation", "before"],
          imageId: "file_demo_meetup",
          durationMinutes: 75,
          timezone: "Europe/Paris",
          roleIds: ["role-owner"]
        })
      },
      {
        id: "pending-before-pending-2",
        groupId: GROUP_IDS.automationBefore,
        profileKey: "before",
        status: "pending",
        eventStartsAt: now.plus({ days: 17 }).toISO(),
        scheduledPublishTime: now.plus({ days: 14 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Session - 3 Days Before",
          description: "Every Friday at 7 PM. Automation publishes 3 days before each event.",
          category: "education",
          accessType: "group",
          languages: ["eng", "fra"],
          platforms: ["standalonewindows"],
          tags: ["automation", "before"],
          imageId: "file_demo_meetup",
          durationMinutes: 75,
          timezone: "Europe/Paris",
          roleIds: ["role-owner"]
        })
      },
      {
        id: "pending-before-pending-3",
        groupId: GROUP_IDS.automationBefore,
        profileKey: "before",
        status: "pending",
        eventStartsAt: now.plus({ days: 24 }).toISO(),
        scheduledPublishTime: now.plus({ days: 21 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Session - 3 Days Before",
          description: "Every Friday at 7 PM. Automation publishes 3 days before each event.",
          category: "education",
          accessType: "group",
          languages: ["eng", "fra"],
          platforms: ["standalonewindows"],
          tags: ["automation", "before"],
          imageId: "file_demo_meetup",
          durationMinutes: 75,
          timezone: "Europe/Paris",
          roleIds: ["role-owner"]
        })
      }
    ],
    [GROUP_IDS.automationAfter]: [
      {
        id: "pending-after-queued",
        groupId: GROUP_IDS.automationAfter,
        profileKey: "after",
        status: "queued",
        eventStartsAt: now.plus({ days: 12 }).toISO(),
        scheduledPublishTime: now.toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Bi-Weekly Session - 3 Days After",
          description: "Every other Tuesday at 8:30 PM. Automation publishes 3 days after each event ends.",
          category: "wellness",
          accessType: "public",
          languages: ["eng", "por"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "after"],
          imageId: "file_demo_skyline",
          durationMinutes: 105,
          timezone: "America/Sao_Paulo"
        })
      },
      {
        id: "pending-after-pending-1",
        groupId: GROUP_IDS.automationAfter,
        profileKey: "after",
        status: "pending",
        eventStartsAt: now.plus({ days: 26 }).toISO(),
        scheduledPublishTime: now.plus({ days: 15 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Bi-Weekly Session - 3 Days After",
          description: "Every other Tuesday at 8:30 PM. Automation publishes 3 days after each event ends.",
          category: "wellness",
          accessType: "public",
          languages: ["eng", "por"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "after"],
          imageId: "file_demo_skyline",
          durationMinutes: 105,
          timezone: "America/Sao_Paulo"
        })
      },
      {
        id: "pending-after-pending-2",
        groupId: GROUP_IDS.automationAfter,
        profileKey: "after",
        status: "pending",
        eventStartsAt: now.plus({ days: 40 }).toISO(),
        scheduledPublishTime: now.plus({ days: 29 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Bi-Weekly Session - 3 Days After",
          description: "Every other Tuesday at 8:30 PM. Automation publishes 3 days after each event ends.",
          category: "wellness",
          accessType: "public",
          languages: ["eng", "por"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "after"],
          imageId: "file_demo_skyline",
          durationMinutes: 105,
          timezone: "America/Sao_Paulo"
        })
      },
      {
        id: "pending-after-pending-3",
        groupId: GROUP_IDS.automationAfter,
        profileKey: "after",
        status: "pending",
        eventStartsAt: now.plus({ days: 54 }).toISO(),
        scheduledPublishTime: now.plus({ days: 43 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Bi-Weekly Session - 3 Days After",
          description: "Every other Tuesday at 8:30 PM. Automation publishes 3 days after each event ends.",
          category: "wellness",
          accessType: "public",
          languages: ["eng", "por"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "after"],
          imageId: "file_demo_skyline",
          durationMinutes: 105,
          timezone: "America/Sao_Paulo"
        })
      }
    ],
    [GROUP_IDS.automationMonthly]: [
      // This month's batch (4 weekly Saturdays, all publish on the 11th)
      {
        id: "pending-monthly-this-1",
        groupId: GROUP_IDS.automationMonthly,
        profileKey: "monthly",
        status: "queued",
        eventStartsAt: now.plus({ days: 3 }).toISO(),
        scheduledPublishTime: now.toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Spotlight - Monthly on 11th",
          description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
          category: "music",
          accessType: "public",
          languages: ["eng", "kor"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "monthly"],
          imageId: "file_demo_stage",
          durationMinutes: 90,
          timezone: "Asia/Seoul"
        })
      },
      {
        id: "pending-monthly-this-2",
        groupId: GROUP_IDS.automationMonthly,
        profileKey: "monthly",
        status: "queued",
        eventStartsAt: now.plus({ days: 10 }).toISO(),
        scheduledPublishTime: now.toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Spotlight - Monthly on 11th",
          description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
          category: "music",
          accessType: "public",
          languages: ["eng", "kor"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "monthly"],
          imageId: "file_demo_stage",
          durationMinutes: 90,
          timezone: "Asia/Seoul"
        })
      },
      {
        id: "pending-monthly-this-3",
        groupId: GROUP_IDS.automationMonthly,
        profileKey: "monthly",
        status: "queued",
        eventStartsAt: now.plus({ days: 17 }).toISO(),
        scheduledPublishTime: now.toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Spotlight - Monthly on 11th",
          description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
          category: "music",
          accessType: "public",
          languages: ["eng", "kor"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "monthly"],
          imageId: "file_demo_stage",
          durationMinutes: 90,
          timezone: "Asia/Seoul"
        })
      },
      {
        id: "pending-monthly-this-4",
        groupId: GROUP_IDS.automationMonthly,
        profileKey: "monthly",
        status: "queued",
        eventStartsAt: now.plus({ days: 24 }).toISO(),
        scheduledPublishTime: now.toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Spotlight - Monthly on 11th",
          description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
          category: "music",
          accessType: "public",
          languages: ["eng", "kor"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "monthly"],
          imageId: "file_demo_stage",
          durationMinutes: 90,
          timezone: "Asia/Seoul"
        })
      },
      // Next month's batch (4 weekly Saturdays, all publish on next month's 11th)
      {
        id: "pending-monthly-next-1",
        groupId: GROUP_IDS.automationMonthly,
        profileKey: "monthly",
        status: "pending",
        eventStartsAt: now.plus({ days: 31 }).toISO(),
        scheduledPublishTime: now.plus({ days: 30 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Spotlight - Monthly on 11th",
          description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
          category: "music",
          accessType: "public",
          languages: ["eng", "kor"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "monthly"],
          imageId: "file_demo_stage",
          durationMinutes: 90,
          timezone: "Asia/Seoul"
        })
      },
      {
        id: "pending-monthly-next-2",
        groupId: GROUP_IDS.automationMonthly,
        profileKey: "monthly",
        status: "pending",
        eventStartsAt: now.plus({ days: 38 }).toISO(),
        scheduledPublishTime: now.plus({ days: 30 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Spotlight - Monthly on 11th",
          description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
          category: "music",
          accessType: "public",
          languages: ["eng", "kor"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "monthly"],
          imageId: "file_demo_stage",
          durationMinutes: 90,
          timezone: "Asia/Seoul"
        })
      },
      {
        id: "pending-monthly-next-3",
        groupId: GROUP_IDS.automationMonthly,
        profileKey: "monthly",
        status: "pending",
        eventStartsAt: now.plus({ days: 45 }).toISO(),
        scheduledPublishTime: now.plus({ days: 30 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Spotlight - Monthly on 11th",
          description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
          category: "music",
          accessType: "public",
          languages: ["eng", "kor"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "monthly"],
          imageId: "file_demo_stage",
          durationMinutes: 90,
          timezone: "Asia/Seoul"
        })
      },
      {
        id: "pending-monthly-next-4",
        groupId: GROUP_IDS.automationMonthly,
        profileKey: "monthly",
        status: "pending",
        eventStartsAt: now.plus({ days: 52 }).toISO(),
        scheduledPublishTime: now.plus({ days: 30 }).toISO(),
        resolvedDetails: makeResolvedDetails({
          title: "Weekly Spotlight - Monthly on 11th",
          description: "Every Saturday at 6 PM. On the 11th of each month, publishes all events for that month.",
          category: "music",
          accessType: "public",
          languages: ["eng", "kor"],
          platforms: ["standalonewindows", "android"],
          tags: ["automation", "monthly"],
          imageId: "file_demo_stage",
          durationMinutes: 90,
          timezone: "Asia/Seoul"
        })
      }
    ],
    [GROUP_IDS.conflict]: [],
    [GROUP_IDS.rate]: [],
    [GROUP_IDS.custom]: []
  };
}

function buildRateLimitServerEvents(now, galleryMap) {
  const events = [];
  for (let i = 0; i < 12; i += 1) {
    const startsAt = now.plus({ days: 5, hours: i }).set({ minute: 0, second: 0, millisecond: 0 });
    events.push({
      id: `demo-event-rate-server-${i + 1}`,
      groupId: GROUP_IDS.rate,
      title: `External Event ${i + 1}`,
      description: "An external event contributing to rate limits.",
      category: "gaming",
      accessType: "public",
      languages: ["eng"],
      platforms: ["standalonewindows"],
      tags: ["rate-limit"],
      imageId: "file_demo_arcade",
      imageUrl: galleryMap["file_demo_arcade"]?.previewUrl || null,
      roleIds: [],
      startsAtUtc: startsAt.toUTC().toISO(),
      endsAtUtc: startsAt.plus({ minutes: 30 }).toUTC().toISO(),
      createdAtUtc: now.minus({ minutes: 5 + i }).toISO(),
      durationMinutes: 30,
      timezone: "UTC"
    });
  }
  return events;
}

function buildRoles() {
  return {
    [GROUP_IDS.conflict]: [
      { id: "role-owner", name: "Group Owner", isManagementRole: true, order: 1 },
      { id: "role-mod", name: "Moderator", isManagementRole: true, order: 2 },
      { id: "role-vip", name: "VIP", isManagementRole: false, order: 3 },
      { id: "role-member", name: "Members", isManagementRole: false, order: 4 }
    ],
    [GROUP_IDS.automationBefore]: [
      { id: "role-owner", name: "Group Owner", isManagementRole: true, order: 1 },
      { id: "role-producer", name: "Producer", isManagementRole: true, order: 2 },
      { id: "role-member", name: "Members", isManagementRole: false, order: 3 }
    ]
  };
}

function createDemoStore() {
  const now = DateTime.utc();
  const gallery = buildGalleryFiles(now);
  const galleryMap = Object.fromEntries(gallery.map(file => [file.id, file]));
  const groups = buildGroups();
  const profiles = buildProfiles();
  const events = buildEvents(now, galleryMap);
  const pendingEvents = buildPendingEvents(now, galleryMap);
  const rateLimitServerEvents = buildRateLimitServerEvents(now, galleryMap);
  const rolesByGroup = buildRoles();

  return {
    groups,
    profiles,
    events,
    pendingEvents,
    rateLimitServerEvents,
    gallery,
    galleryMap,
    rolesByGroup,
    settings: {
      warnConflicts: true,
      minimizeToTray: false,
      trayPromptShown: true
    },
    themeStore: {
      selectedPreset: "default",
      customColors: null
    },
    themePresets: [],
    pendingSettings: {
      displayLimit: 10
    },
    updateState: {
      available: false,
      downloaded: false,
      downloading: false,
      progress: 0,
      version: null
    },
    counters: {
      event: 1,
      profile: 1,
      upload: 1
    },
    galleryUploadIndex: 0
  };
}

module.exports = {
  GROUP_IDS,
  DEMO_USER,
  PROFILE_LOCKS,
  EVENT_BEHAVIORS,
  HOURLY_HISTORY_SEED,
  DEMO_IMAGE_URL,
  createDemoStore,
  buildEventTimes,
  generateDateOptionsFromPatterns,
  safeZone
};
