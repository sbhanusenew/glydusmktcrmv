const STORAGE_KEY = "glydus-crm-store-v2";
const SESSION_KEY = "glydus-crm-session-v1";
const SUPABASE_CONFIG_ENDPOINT = "/api/config";
const GLYDUS_LOGO_FALLBACK = "https://glydus.com/wp-content/uploads/2026/02/Group-964.svg";
const SUPABASE_PLACEHOLDER_URL = "https://your-project.supabase.co";
const ADMIN_LOGIN_ID = "Sbhanuse";
const ADMIN_PASSWORD = "Ram@123";
const DEFAULT_USER_PASSWORD = "Glydus@123";
const DB_TABLES = {
  users: "crm_users",
  leads: "leads",
  activities: "activities",
};

const STAGE_OPTIONS = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
];
const PRIORITY_OPTIONS = ["Cold", "Warm", "Hot"];
const SOURCE_OPTIONS = [
  "Website",
  "Referral",
  "Trade Show",
  "Cold Call",
  "WhatsApp",
  "LinkedIn",
  "Service Desk",
];
const USER_ROLE_OPTIONS = [
  "Admin",
  "Sales Manager",
  "Sales Executive",
  "Business Development",
  "Service Coordinator",
];
const USER_STATUS_OPTIONS = ["Active", "Inactive"];
const ACTIVITY_TYPE_OPTIONS = [
  "Call",
  "Email",
  "Meeting",
  "WhatsApp",
  "Demo",
  "Site visit",
  "Proposal",
  "Quote revision",
  "Technical clarification",
  "Service follow-up",
  "Installation coordination",
  "Collection follow-up",
  "Research",
  "CRM update",
];
const ACTIVITY_OUTCOME_OPTIONS = [
  "Completed",
  "Customer replied",
  "Follow-up required",
  "Proposal shared",
  "Issue escalated",
  "No response",
];
const ACTIVITY_SENTIMENT_OPTIONS = ["Positive", "Neutral", "Concerned", "At risk"];
const ACTIVITY_PRIORITY_OPTIONS = ["Normal", "Important", "Urgent"];
const CLOSED_STAGES = new Set(["Won", "Lost"]);

let storageAvailable = true;
let memoryStore = null;
let supabaseClient = null;
let supabaseReady = false;
let remoteStoreLoaded = false;
let remoteSubscription = null;
let remoteRefreshTimer = null;
let storeListeners = new Set();
let userState = {
  currentUserId: "",
  selectedLeadId: null,
  createMessage: "",
  editorMessage: "",
  activityMessage: "",
};
let adminState = {
  stageFilter: "All",
  searchQuery: "",
  selectedLeadId: null,
  editorMessage: "",
  userMessage: "",
  editingUserId: null,
};

function createSeedUsers() {
  return [
    {
      id: "USR-01",
      fullName: "CRM Administrator",
      email: "admin@glydus.com",
      loginId: ADMIN_LOGIN_ID,
      password: ADMIN_PASSWORD,
      role: "Admin",
      department: "Revenue Operations",
      status: "Active",
      createdAt: "2026-05-01T09:00:00+05:30",
    },
    {
      id: "USR-02",
      fullName: "Rahul Singh",
      email: "rahul.singh@glydus.com",
      loginId: "RahulSingh",
      password: DEFAULT_USER_PASSWORD,
      role: "Sales Manager",
      department: "Corporate Sales",
      status: "Active",
      createdAt: "2026-05-01T09:05:00+05:30",
    },
    {
      id: "USR-03",
      fullName: "Meera Kapoor",
      email: "meera.kapoor@glydus.com",
      loginId: "MeeraKapoor",
      password: DEFAULT_USER_PASSWORD,
      role: "Sales Executive",
      department: "Inside Sales",
      status: "Active",
      createdAt: "2026-05-01T09:10:00+05:30",
    },
    {
      id: "USR-04",
      fullName: "Vivek Nair",
      email: "vivek.nair@glydus.com",
      loginId: "VivekNair",
      password: DEFAULT_USER_PASSWORD,
      role: "Business Development",
      department: "Field Sales",
      status: "Active",
      createdAt: "2026-05-01T09:15:00+05:30",
    },
  ];
}

function createSeedLeads() {
  return [
    {
      id: "LEAD-3001",
      companyName: "BlueWake Marina",
      contactName: "Sonia Verma",
      email: "sonia.verma@bluewake.co.in",
      phone: "+91 9870001201",
      source: "Website",
      stage: "Qualified",
      priority: "Hot",
      estimatedValue: 1500000,
      probability: 65,
      ownerId: "USR-03",
      nextAction: "Share steering proposal and warranty terms.",
      followUpDate: "2026-05-20",
      lastNote: "Operations team wants pricing with delivery timeline.",
      createdBy: "Meera Kapoor",
      createdAt: "2026-05-09T11:00:00+05:30",
      updatedAt: "2026-05-12T16:15:00+05:30",
    },
    {
      id: "LEAD-3002",
      companyName: "Harbor Marine Systems",
      contactName: "Dinesh Patel",
      email: "dinesh.patel@harbormarine.in",
      phone: "+91 9820034512",
      source: "Referral",
      stage: "Proposal Sent",
      priority: "Warm",
      estimatedValue: 3200000,
      probability: 75,
      ownerId: "USR-04",
      nextAction: "Confirm technical clarification call.",
      followUpDate: "2026-05-21",
      lastNote: "Proposal submitted. Waiting for engineering review comments.",
      createdBy: "Vivek Nair",
      createdAt: "2026-05-07T10:20:00+05:30",
      updatedAt: "2026-05-12T12:10:00+05:30",
    },
    {
      id: "LEAD-3003",
      companyName: "Apex Boat Works",
      contactName: "Ritika Shah",
      email: "ritika.shah@apexboatworks.com",
      phone: "+91 9891008744",
      source: "LinkedIn",
      stage: "New Lead",
      priority: "Warm",
      estimatedValue: 950000,
      probability: 20,
      ownerId: "USR-03",
      nextAction: "Complete discovery call and boat fitment analysis.",
      followUpDate: "2026-05-22",
      lastNote: "First call done. Customer requested company profile.",
      createdBy: "Meera Kapoor",
      createdAt: "2026-05-11T14:00:00+05:30",
      updatedAt: "2026-05-11T14:20:00+05:30",
    },
    {
      id: "LEAD-3004",
      companyName: "Sterling Ports",
      contactName: "Arpit Desai",
      email: "arpit.desai@sterlingports.com",
      phone: "+91 9811147788",
      source: "Trade Show",
      stage: "Negotiation",
      priority: "Hot",
      estimatedValue: 4800000,
      probability: 85,
      ownerId: "USR-02",
      nextAction: "Review revised payment terms with finance.",
      followUpDate: "2026-05-23",
      lastNote: "Commercial terms under negotiation. Decision expected this week.",
      createdBy: "Rahul Singh",
      createdAt: "2026-05-06T09:45:00+05:30",
      updatedAt: "2026-05-12T18:05:00+05:30",
    },
    {
      id: "LEAD-3005",
      companyName: "Northstar Engineering",
      contactName: "Pooja Malhotra",
      email: "pooja.malhotra@northstarengg.in",
      phone: "+91 9820080011",
      source: "Cold Call",
      stage: "Won",
      priority: "Warm",
      estimatedValue: 2100000,
      probability: 100,
      ownerId: "USR-02",
      nextAction: "Transfer to installation and onboarding.",
      followUpDate: "2026-05-24",
      lastNote: "PO received and handoff to operations completed.",
      createdBy: "Rahul Singh",
      createdAt: "2026-05-02T15:00:00+05:30",
      updatedAt: "2026-05-10T11:30:00+05:30",
    },
    {
      id: "LEAD-3006",
      companyName: "Coastal Energy Works",
      contactName: "Niharika Sethi",
      email: "niharika.sethi@coastalenergy.in",
      phone: "+91 9807803210",
      source: "WhatsApp",
      stage: "Lost",
      priority: "Cold",
      estimatedValue: 700000,
      probability: 0,
      ownerId: "USR-04",
      nextAction: "Revisit after next budget cycle.",
      followUpDate: "2026-08-01",
      lastNote: "Lost on price. Possible reopen after 3 months.",
      createdBy: "Vivek Nair",
      createdAt: "2026-05-03T13:30:00+05:30",
      updatedAt: "2026-05-09T17:10:00+05:30",
    },
  ];
}

function createSeedActivities() {
  return [
    {
      id: "ACT-5001",
      leadId: "LEAD-3001",
      leadName: "BlueWake Marina",
      userId: "USR-03",
      userName: "Meera Kapoor",
      action: "Call",
      minutes: 35,
      note: "Qualified steering requirement and noted delivery expectation.",
      changes: "Stage: Contacted to Qualified",
      outcome: "Follow-up required",
      sentiment: "Positive",
      priority: "Important",
      nextFollowUpDate: "2026-05-20",
      deliverable: "Warranty terms proposal",
      needsSupport: false,
      activityDate: "2026-05-12",
      createdAt: "2026-05-12T16:15:00+05:30",
    },
    {
      id: "ACT-5002",
      leadId: "LEAD-3004",
      leadName: "Sterling Ports",
      userId: "USR-02",
      userName: "Rahul Singh",
      action: "Meeting",
      minutes: 55,
      note: "Reviewed commercial terms and pending finance approval.",
      changes: "Probability: 75 to 85",
      outcome: "Issue escalated",
      sentiment: "Concerned",
      priority: "Urgent",
      nextFollowUpDate: "2026-05-13",
      deliverable: "Commercial approval note",
      needsSupport: true,
      activityDate: "2026-05-12",
      createdAt: "2026-05-12T18:05:00+05:30",
    },
  ];
}

function createSeedData() {
  return {
    nextLeadNumber: 3007,
    nextUserNumber: 5,
    nextActivityNumber: 5003,
    users: createSeedUsers(),
    leads: createSeedLeads(),
    activities: createSeedActivities(),
  };
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function cleanPassword(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
  });
}

function buildLoginId(fullName, fallbackId) {
  const fromName = cleanText(fullName).replace(/[^a-z0-9]/gi, "");
  return fromName || fallbackId;
}

function normaliseLeadId(value) {
  return cleanText(value).toUpperCase();
}

function buildLeadId(number) {
  return `LEAD-${String(number).padStart(4, "0")}`;
}

function buildUserId(number) {
  return `USR-${String(number).padStart(2, "0")}`;
}

function buildActivityId(number) {
  return `ACT-${String(number).padStart(4, "0")}`;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
}

function formatCurrency(value) {
  const amount = Number(value) || 0;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `INR ${amount}`;
  }
}

function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;

  if (hours && remaining) {
    return `${hours}h ${remaining}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${remaining}m`;
}

function isDueLead(lead) {
  return (
    Boolean(lead.followUpDate) &&
    !CLOSED_STAGES.has(lead.stage) &&
    lead.followUpDate <= getTodayKey()
  );
}

function stageClass(stage) {
  return {
    "New Lead": "badge--new",
    Contacted: "badge--contacted",
    Qualified: "badge--qualified",
    "Proposal Sent": "badge--proposal",
    Negotiation: "badge--negotiation",
    Won: "badge--won",
    Lost: "badge--lost",
  }[stage] || "badge--new";
}

function priorityClass(priority) {
  return {
    Cold: "badge--cold",
    Warm: "badge--warm",
    Hot: "badge--hot",
  }[priority] || "badge--warm";
}

function activityPriorityClass(priority) {
  return {
    Normal: "badge--active",
    Important: "badge--warm",
    Urgent: "badge--hot",
  }[priority] || "badge--active";
}

function sentimentClass(sentiment) {
  return {
    Positive: "badge--won",
    Neutral: "badge--cold",
    Concerned: "badge--warm",
    "At risk": "badge--hot",
  }[sentiment] || "badge--cold";
}

function userStatusClass(status) {
  return status === "Inactive" ? "badge--inactive" : "badge--active";
}

function badgeHtml(label, className) {
  return `<span class="badge ${className}">${escapeHtml(label)}</span>`;
}

function absoluteLogoPath() {
  return `${window.location.origin}/assets/glydus-logo.svg`;
}

function initialiseBrandImages() {
  document.querySelectorAll('img[src$="glydus-logo.svg"]').forEach((image) => {
    image.src = absoluteLogoPath();
    image.addEventListener(
      "error",
      () => {
        if (image.src !== GLYDUS_LOGO_FALLBACK) {
          image.src = GLYDUS_LOGO_FALLBACK;
        }
      },
      { once: true },
    );
  });
}

function outlookComposeUrl(lead) {
  const subject = `Glydus CRM follow-up: ${lead.companyName}`;
  const body = [
    `Hello ${lead.contactName},`,
    "",
    `Following up on: ${lead.nextAction}`,
    "",
    "Regards,",
    "Glydus Team",
  ].join("\n");

  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(
    lead.email || "",
  )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function teamsSearchUrl(lead) {
  const query = lead.email || lead.contactName || lead.companyName;
  return `https://teams.microsoft.com/l/search/${encodeURIComponent(query)}`;
}

function collaborationActionsHtml(lead, compact = false) {
  const labelSuffix = compact ? "" : ` ${escapeHtml(lead.companyName)}`;
  return `
    <div class="collab-actions" aria-label="Collaboration actions">
      <a class="button button--teams button--small" href="${teamsSearchUrl(lead)}" target="_blank" rel="noopener">Teams${labelSuffix}</a>
      <a class="button button--outlook button--small" href="${outlookComposeUrl(lead)}" target="_blank" rel="noopener">Outlook${labelSuffix}</a>
    </div>
  `;
}

function normaliseUser(user, fallbackId) {
  const fullName = cleanText(user.fullName) || "Unnamed User";
  let loginId = cleanText(user.loginId) || buildLoginId(fullName, fallbackId);
  let role = USER_ROLE_OPTIONS.includes(user.role) ? user.role : "Sales Executive";
  let password = cleanPassword(user.password) || DEFAULT_USER_PASSWORD;

  if (fallbackId === "USR-01" || loginId.toLowerCase() === ADMIN_LOGIN_ID.toLowerCase()) {
    loginId = ADMIN_LOGIN_ID;
    password = ADMIN_PASSWORD;
    role = "Admin";
  }

  return {
    id: cleanText(user.id) || fallbackId,
    authUserId: cleanText(user.authUserId),
    fullName,
    email: cleanText(user.email) || "user@glydus.com",
    loginId,
    password,
    role,
    department: cleanText(user.department) || "Sales",
    status: USER_STATUS_OPTIONS.includes(user.status) ? user.status : "Active",
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
  };
}

function resolveOwner(users, ownerId) {
  const matched = users.find((user) => user.id === ownerId && user.status === "Active");
  if (matched) {
    return matched;
  }

  return (
    users.find((user) => user.status === "Active" && user.role !== "Admin") ||
    users.find((user) => user.status === "Active") ||
    users[0]
  );
}

function normaliseLead(lead, fallbackId, users) {
  const owner = resolveOwner(users, cleanText(lead.ownerId));
  const safeStage = STAGE_OPTIONS.includes(lead.stage) ? lead.stage : "New Lead";
  let probability = Math.max(0, Math.min(100, Number(lead.probability) || 0));

  if (safeStage === "Won") {
    probability = 100;
  }

  if (safeStage === "Lost") {
    probability = 0;
  }

  return {
    id: normaliseLeadId(lead.id || fallbackId),
    companyName: cleanText(lead.companyName) || "Unnamed Company",
    contactName: cleanText(lead.contactName) || "Unknown Contact",
    email: cleanText(lead.email) || "contact@glydus.com",
    phone: cleanText(lead.phone),
    source: SOURCE_OPTIONS.includes(lead.source) ? lead.source : "Website",
    stage: safeStage,
    priority: PRIORITY_OPTIONS.includes(lead.priority) ? lead.priority : "Warm",
    estimatedValue: Math.max(0, Number(lead.estimatedValue) || 0),
    probability,
    ownerId: owner?.id || "",
    ownerName: owner?.fullName || "Unassigned",
    nextAction: cleanText(lead.nextAction) || "Plan next customer touchpoint.",
    followUpDate: cleanText(lead.followUpDate),
    lastNote: cleanText(lead.lastNote) || "No note added yet.",
    createdBy: cleanText(lead.createdBy) || owner?.fullName || "System",
    createdAt: lead.createdAt || new Date().toISOString(),
    updatedAt: lead.updatedAt || lead.createdAt || new Date().toISOString(),
  };
}

function normaliseActivity(activity, fallbackId, users, leads) {
  const actor = users.find((user) => user.id === cleanText(activity.userId));
  const lead = leads.find((item) => item.id === normaliseLeadId(activity.leadId));
  const createdAt = activity.createdAt || new Date().toISOString();

  return {
    id: cleanText(activity.id) || fallbackId,
    leadId: lead?.id || normaliseLeadId(activity.leadId),
    leadName: cleanText(activity.leadName) || lead?.companyName || "General CRM work",
    userId: actor?.id || cleanText(activity.userId),
    userName: cleanText(activity.userName) || actor?.fullName || "Unknown User",
    action: ACTIVITY_TYPE_OPTIONS.includes(activity.action)
      ? activity.action
      : cleanText(activity.action) || "CRM update",
    minutes: Math.max(0, Math.min(1440, Number(activity.minutes) || 0)),
    note: cleanText(activity.note) || "Activity recorded.",
    changes: cleanText(activity.changes),
    outcome: ACTIVITY_OUTCOME_OPTIONS.includes(activity.outcome)
      ? activity.outcome
      : "Completed",
    sentiment: ACTIVITY_SENTIMENT_OPTIONS.includes(activity.sentiment)
      ? activity.sentiment
      : "Neutral",
    priority: ACTIVITY_PRIORITY_OPTIONS.includes(activity.priority)
      ? activity.priority
      : "Normal",
    nextFollowUpDate: cleanText(activity.nextFollowUpDate),
    deliverable: cleanText(activity.deliverable),
    needsSupport: Boolean(activity.needsSupport),
    activityDate: cleanText(activity.activityDate) || createdAt.slice(0, 10),
    createdAt,
  };
}

function normaliseStore(rawData = {}, options = {}) {
  const shouldSeed = options.seed !== false;
  const seed = createSeedData();
  const sourceUsers = Array.isArray(rawData.users)
    ? rawData.users
    : shouldSeed
      ? seed.users
      : [];
  const users = sourceUsers.map((user, index) =>
    normaliseUser(user, buildUserId(index + 1)),
  );

  if (
    shouldSeed &&
    !users.some((user) => user.loginId.toLowerCase() === ADMIN_LOGIN_ID.toLowerCase())
  ) {
    users.unshift(normaliseUser(seed.users[0], "USR-01"));
  }

  const sourceLeads = Array.isArray(rawData.leads)
    ? rawData.leads
    : shouldSeed
      ? seed.leads
      : [];
  const leads = sourceLeads.map((lead, index) =>
    normaliseLead(lead, buildLeadId(3001 + index), users),
  );

  const sourceActivities = Array.isArray(rawData.activities)
    ? rawData.activities
    : shouldSeed
      ? seed.activities
      : [];
  const activities = sourceActivities.map((activity, index) =>
    normaliseActivity(activity, buildActivityId(5001 + index), users, leads),
  );

  const maxLeadNumber = leads.reduce((highest, lead) => {
    const match = lead.id.match(/(\d+)$/);
    return Math.max(highest, match ? Number(match[1]) : highest);
  }, 3006);
  const maxUserNumber = users.reduce((highest, user) => {
    const match = user.id.match(/(\d+)$/);
    return Math.max(highest, match ? Number(match[1]) : highest);
  }, 4);
  const maxActivityNumber = activities.reduce((highest, activity) => {
    const match = activity.id.match(/(\d+)$/);
    return Math.max(highest, match ? Number(match[1]) : highest);
  }, 5002);

  return {
    nextLeadNumber: Math.max(Number(rawData.nextLeadNumber) || 0, maxLeadNumber + 1),
    nextUserNumber: Math.max(Number(rawData.nextUserNumber) || 0, maxUserNumber + 1),
    nextActivityNumber: Math.max(
      Number(rawData.nextActivityNumber) || 0,
      maxActivityNumber + 1,
    ),
    users,
    leads,
    activities,
  };
}

function isSupabaseConfigured(config = {}) {
  return Boolean(
    config.url &&
      config.anonKey &&
      config.url !== SUPABASE_PLACEHOLDER_URL &&
      config.anonKey !== "your-supabase-anon-key",
  );
}

function isSupabaseActive() {
  return Boolean(supabaseReady && supabaseClient);
}

function notifyStoreListeners() {
  storeListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      return;
    }
  });
}

function subscribeToStore(listener) {
  storeListeners.add(listener);
  window.addEventListener("storage", listener);
}

async function loadSupabaseConfig() {
  const staticConfig = window.GLYDUS_SUPABASE_CONFIG || {};

  try {
    const response = await fetch(SUPABASE_CONFIG_ENDPOINT, {
      cache: "no-store",
    });

    if (response.ok) {
      const apiConfig = await response.json();
      return {
        url: cleanText(apiConfig.supabaseUrl || apiConfig.url || staticConfig.url),
        anonKey: cleanText(apiConfig.supabaseAnonKey || apiConfig.anonKey || staticConfig.anonKey),
      };
    }
  } catch (error) {
    return {
      url: cleanText(staticConfig.url),
      anonKey: cleanText(staticConfig.anonKey),
    };
  }

  return {
    url: cleanText(staticConfig.url),
    anonKey: cleanText(staticConfig.anonKey),
  };
}

function userFromRow(row = {}) {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.full_name,
    email: row.email,
    loginId: row.login_id,
    password: row.password || "",
    role: row.role,
    department: row.department,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function userToRow(user, authUserId = undefined) {
  const row = {
    id: user.id,
    full_name: user.fullName,
    email: user.email,
    login_id: user.loginId,
    role: user.role,
    department: user.department,
    status: user.status,
    updated_at: user.updatedAt || new Date().toISOString(),
  };

  if (user.createdAt) {
    row.created_at = user.createdAt;
  }

  if (authUserId !== undefined) {
    row.auth_user_id = authUserId;
  } else if (user.authUserId !== undefined) {
    row.auth_user_id = user.authUserId;
  }

  if (user.password) {
    row.password = user.password;
  }

  return row;
}

function leadFromRow(row = {}) {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    stage: row.stage,
    priority: row.priority,
    estimatedValue: row.estimated_value,
    probability: row.probability,
    ownerId: row.owner_id,
    nextAction: row.next_action,
    followUpDate: row.follow_up_date,
    lastNote: row.last_note,
    createdBy: row.created_by_name || row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function leadToRow(lead) {
  return {
    id: lead.id,
    company_name: lead.companyName,
    contact_name: lead.contactName,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    stage: lead.stage,
    priority: lead.priority,
    estimated_value: lead.estimatedValue,
    probability: lead.probability,
    owner_id: lead.ownerId,
    next_action: lead.nextAction,
    follow_up_date: lead.followUpDate || null,
    last_note: lead.lastNote,
    created_by: lead.createdBy,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
  };
}

function activityFromRow(row = {}) {
  return {
    id: row.id,
    leadId: row.lead_id || "",
    leadName: row.lead_name,
    userId: row.user_id,
    action: row.action,
    minutes: row.minutes,
    note: row.note,
    changes: row.changes,
    outcome: row.outcome,
    sentiment: row.sentiment,
    priority: row.priority,
    nextFollowUpDate: row.next_follow_up_date,
    deliverable: row.deliverable,
    needsSupport: row.needs_support,
    activityDate: row.activity_date,
    createdAt: row.created_at,
  };
}

function activityToRow(activity) {
  return {
    id: activity.id,
    lead_id: activity.leadId || null,
    lead_name: activity.leadName,
    user_id: activity.userId,
    action: activity.action,
    minutes: activity.minutes,
    note: activity.note,
    changes: activity.changes,
    outcome: activity.outcome,
    sentiment: activity.sentiment,
    priority: activity.priority,
    next_follow_up_date: activity.nextFollowUpDate || null,
    deliverable: activity.deliverable || null,
    needs_support: Boolean(activity.needsSupport),
    activity_date: activity.activityDate,
    created_at: activity.createdAt,
  };
}

async function fetchRemoteProfile() {
  if (!isSupabaseActive()) {
    return null;
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from(DB_TABLES.users)
    .select("*")
    .eq("auth_user_id", user.id)
    .eq("status", "Active")
    .single();

  if (error || !data) {
    return null;
  }

  return normaliseUser(userFromRow(data), data.id);
}

async function refreshRemoteStore(profile = null, shouldNotify = true) {
  if (!isSupabaseActive()) {
    return readStore();
  }

  const authUser = profile || (await fetchRemoteProfile());
  if (!authUser) {
    remoteStoreLoaded = false;
    return readStore();
  }

  const [usersResult, leadsResult, activitiesResult] = await Promise.all([
    isAdmin(authUser)
      ? supabaseClient.from(DB_TABLES.users).select("*").order("created_at", { ascending: true })
      : supabaseClient.from(DB_TABLES.users).select("*").eq("id", authUser.id),
    supabaseClient.from(DB_TABLES.leads).select("*").order("updated_at", { ascending: false }),
    supabaseClient
      .from(DB_TABLES.activities)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (usersResult.error || leadsResult.error || activitiesResult.error) {
    return readStore();
  }

  memoryStore = normaliseStore(
    {
      users: (usersResult.data || []).map(userFromRow),
      leads: (leadsResult.data || []).map(leadFromRow),
      activities: (activitiesResult.data || []).map(activityFromRow),
    },
    { seed: false },
  );
  remoteStoreLoaded = true;
  setSession(authUser);

  if (shouldNotify) {
    notifyStoreListeners();
  }

  return cloneData(memoryStore);
}

function scheduleRemoteRefresh() {
  if (!isSupabaseActive()) {
    return;
  }

  window.clearTimeout(remoteRefreshTimer);
  remoteRefreshTimer = window.setTimeout(async () => {
    await refreshRemoteStore(null, true);
  }, 250);
}

function subscribeRemoteChanges() {
  if (!isSupabaseActive() || remoteSubscription) {
    return;
  }

  remoteSubscription = supabaseClient
    .channel("glydus-crm-shared-data")
    .on("postgres_changes", { event: "*", schema: "public", table: DB_TABLES.users }, scheduleRemoteRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: DB_TABLES.leads }, scheduleRemoteRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: DB_TABLES.activities }, scheduleRemoteRefresh)
    .subscribe();
}

async function initRemoteDatabase() {
  const config = await loadSupabaseConfig();

  if (!isSupabaseConfigured(config) || !window.supabase?.createClient) {
    supabaseReady = false;
    return;
  }

  supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  supabaseReady = true;

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session?.user) {
    const profile = await fetchRemoteProfile();
    if (profile) {
      await refreshRemoteStore(profile, false);
      subscribeRemoteChanges();
    }
  }
}

async function authenticateRemoteUser(loginId, password) {
  if (!isSupabaseActive()) {
    return null;
  }

  const cleanLogin = cleanText(loginId);
  const loginEmail = cleanLogin.includes("@")
    ? cleanLogin
    : await resolveLoginEmail(cleanLogin);

  if (!loginEmail) {
    return null;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: loginEmail,
    password: cleanPassword(password),
  });

  if (error) {
    return null;
  }

  const profile = await fetchRemoteProfile();
  if (!profile) {
    await supabaseClient.auth.signOut();
    return null;
  }

  await refreshRemoteStore(profile, false);
  subscribeRemoteChanges();
  return profile;
}

async function resolveLoginEmail(loginId) {
  const { data, error } = await supabaseClient.rpc("resolve_crm_login", {
    requested_login_id: loginId,
  });

  if (error || !data) {
    return "";
  }

  return cleanText(data);
}

async function upsertRemoteLead(lead) {
  if (!isSupabaseActive()) {
    return { error: null };
  }

  const { error } = await supabaseClient
    .from(DB_TABLES.leads)
    .upsert(leadToRow(lead), { onConflict: "id" });
  return { error };
}

async function upsertRemoteActivity(activity) {
  if (!isSupabaseActive()) {
    return { error: null };
  }

  const { error } = await supabaseClient
    .from(DB_TABLES.activities)
    .upsert(activityToRow(activity), { onConflict: "id" });
  return { error };
}

async function callAdminUserApi(method, payload) {
  if (!isSupabaseActive()) {
    return { error: "Supabase is not connected." };
  }

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session?.access_token) {
    return { error: "Admin session expired. Sign in again." };
  }

  const response = await fetch("/api/admin-users", {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: data.error || "User administration API failed." };
  }

  return { data };
}

function readRawStoredValue() {
  return window.localStorage.getItem(STORAGE_KEY);
}

function readStore() {
  const seed = createSeedData();

  if (isSupabaseActive() && remoteStoreLoaded && memoryStore) {
    return cloneData(memoryStore);
  }

  if (!storageAvailable) {
    if (!memoryStore) {
      memoryStore = normaliseStore(seed);
    }
    return cloneData(memoryStore);
  }

  try {
    const rawValue = readRawStoredValue();

    if (!rawValue) {
      const initial = normaliseStore(seed);
      writeStore(initial);
      return cloneData(initial);
    }

    const parsed = JSON.parse(rawValue);
    const normalised = normaliseStore(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalised)) {
      writeStore(normalised);
    }

    return cloneData(normalised);
  } catch (error) {
    storageAvailable = false;
    memoryStore = normaliseStore(seed);
    return cloneData(memoryStore);
  }
}

function writeStore(data) {
  const normalised = normaliseStore(data);

  if (isSupabaseActive()) {
    memoryStore = cloneData(normalised);
    remoteStoreLoaded = true;
    return;
  }

  if (!storageAvailable) {
    memoryStore = cloneData(normalised);
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalised));
  } catch (error) {
    storageAvailable = false;
    memoryStore = cloneData(normalised);
  }
}

function getSortedLeads(leads) {
  return [...leads].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function getSortedActivities(activities) {
  return [...activities].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function getStageBreakdown(leads) {
  return STAGE_OPTIONS.map((stage) => {
    const stageLeads = leads.filter((lead) => lead.stage === stage);
    const stageValue = stageLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);

    return {
      stage,
      count: stageLeads.length,
      value: stageValue,
    };
  });
}

function getMetrics(leads, users, activities) {
  const totalLeads = leads.length;
  const openLeads = leads.filter((lead) => !CLOSED_STAGES.has(lead.stage));
  const wonLeads = leads.filter((lead) => lead.stage === "Won");
  const hotLeads = leads.filter(
    (lead) => lead.priority === "Hot" && !CLOSED_STAGES.has(lead.stage),
  );
  const activeUsers = users.filter((user) => user.status === "Active");
  const today = getTodayKey();
  const todayActivities = activities.filter((activity) => activity.activityDate === today);

  return {
    totalLeads,
    openValue: openLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
    wonCount: wonLeads.length,
    wonValue: wonLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
    hotLeads: hotLeads.length,
    activeUsers: activeUsers.length,
    todayActivityCount: todayActivities.length,
    todayMinutes: todayActivities.reduce((sum, activity) => sum + activity.minutes, 0),
  };
}

function isAdmin(user) {
  return user?.role === "Admin";
}

function getSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function setSession(user) {
  try {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: user.id,
        loginId: user.loginId,
        role: user.role,
        signedInAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    return;
  }
}

function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
    supabaseClient?.auth.signOut();
  } catch (error) {
    return;
  }
}

function getAuthenticatedUser(data = readStore()) {
  const session = getSession();
  if (!session?.userId) {
    return null;
  }

  const user = data.users.find(
    (item) => item.id === session.userId && item.status === "Active",
  );

  return user || null;
}

function findUserByCredentials(loginId, password, data) {
  const cleanLogin = cleanText(loginId).toLowerCase();
  const cleanPass = cleanPassword(password);

  return data.users.find((user) => {
    return (
      user.status === "Active" &&
      user.loginId.toLowerCase() === cleanLogin &&
      user.password === cleanPass
    );
  });
}

function logActivity(data, payload) {
  const actor = data.users.find((user) => user.id === payload.userId);
  const lead = data.leads.find((item) => item.id === normaliseLeadId(payload.leadId));
  const now = new Date().toISOString();
  const activityNumber = data.nextActivityNumber;
  const activity = normaliseActivity(
    {
      id: buildActivityId(activityNumber),
      leadId: lead?.id || payload.leadId,
      leadName: lead?.companyName || payload.leadName,
      userId: actor?.id || payload.userId,
      userName: actor?.fullName || payload.userName,
      action: payload.action,
      minutes: payload.minutes,
      note: payload.note,
      changes: payload.changes,
      outcome: payload.outcome,
      sentiment: payload.sentiment,
      priority: payload.priority,
      nextFollowUpDate: payload.nextFollowUpDate,
      deliverable: payload.deliverable,
      needsSupport: payload.needsSupport,
      activityDate: payload.activityDate || now.slice(0, 10),
      createdAt: now,
    },
    buildActivityId(activityNumber),
    data.users,
    data.leads,
  );

  data.activities.unshift(activity);
  data.nextActivityNumber = activityNumber + 1;
  return activity;
}

function pickDefaultUser(users) {
  return (
    users.find((user) => user.status === "Active" && user.role === "Sales Executive") ||
    users.find((user) => user.status === "Active" && user.role === "Business Development") ||
    users.find((user) => user.status === "Active" && user.role === "Sales Manager") ||
    users.find((user) => user.status === "Active") ||
    users[0]
  );
}

function canAccessLead(user, lead) {
  return isAdmin(user) || lead.ownerId === user?.id;
}

function getLeadById(leadId, user = null) {
  const lead = readStore().leads.find((item) => item.id === normaliseLeadId(leadId));
  if (!lead) {
    return null;
  }

  if (user && !canAccessLead(user, lead)) {
    return null;
  }

  return lead;
}

function compareLeadChanges(before, after, users) {
  const labels = {
    companyName: "Company",
    contactName: "Contact",
    email: "Email",
    phone: "Phone",
    source: "Source",
    ownerId: "Owner",
    stage: "Stage",
    priority: "Priority",
    estimatedValue: "Value",
    probability: "Probability",
    followUpDate: "Follow-up",
    nextAction: "Next action",
    lastNote: "Note",
  };

  return Object.entries(labels)
    .filter(([field]) => String(before[field] ?? "") !== String(after[field] ?? ""))
    .map(([field, label]) => {
      if (field === "ownerId") {
        const beforeOwner = users.find((user) => user.id === before.ownerId)?.fullName;
        const afterOwner = users.find((user) => user.id === after.ownerId)?.fullName;
        return `${label}: ${beforeOwner || "Unassigned"} to ${afterOwner || "Unassigned"}`;
      }

      if (field === "estimatedValue") {
        return `${label}: ${formatCurrency(before[field])} to ${formatCurrency(after[field])}`;
      }

      return `${label}: ${before[field] || "-"} to ${after[field] || "-"}`;
    })
    .join("; ");
}

async function createLead(payload, ownerId, actorId) {
  const data = readStore();
  const owner = resolveOwner(data.users, ownerId);
  const now = new Date().toISOString();
  const leadNumber = data.nextLeadNumber;
  const lead = normaliseLead(
    {
      id: buildLeadId(leadNumber),
      ...payload,
      stage: "New Lead",
      probability: 20,
      ownerId: owner?.id,
      createdBy: owner?.fullName || "System",
      createdAt: now,
      updatedAt: now,
    },
    buildLeadId(leadNumber),
    data.users,
  );

  data.leads.unshift(lead);
  data.nextLeadNumber = leadNumber + 1;
  const activity = logActivity(data, {
    userId: actorId || owner?.id,
    leadId: lead.id,
    action: "CRM update",
    minutes: Math.max(0, Number(payload.minutes) || 0),
    note: `Created lead for ${lead.companyName}. ${cleanText(payload.lastNote)}`.trim(),
    changes: "Lead created",
  });
  writeStore(data);

  if (isSupabaseActive()) {
    const [leadSync, activitySync] = await Promise.all([
      upsertRemoteLead(lead),
      upsertRemoteActivity(activity),
    ]);

    if (leadSync.error || activitySync.error) {
      return null;
    }

    await refreshRemoteStore(null, true);
  }

  return lead;
}

async function updateLead(leadId, updates, actorId, activityMeta = {}) {
  const data = readStore();
  const normalisedId = normaliseLeadId(leadId);
  const index = data.leads.findIndex((lead) => lead.id === normalisedId);

  if (index === -1) {
    return null;
  }

  const before = data.leads[index];
  const after = normaliseLead(
    {
      ...before,
      ...updates,
      updatedAt: new Date().toISOString(),
    },
    before.id,
    data.users,
  );
  const changes = compareLeadChanges(before, after, data.users);

  data.leads[index] = after;
  const activity = logActivity(data, {
    userId: actorId || after.ownerId,
    leadId: after.id,
    action: activityMeta.action || "CRM update",
    minutes: Math.max(0, Number(activityMeta.minutes) || 0),
    note:
      cleanText(activityMeta.note) ||
      cleanText(updates.lastNote) ||
      `Updated ${after.companyName}.`,
    changes: changes || "Customer record reviewed",
  });
  writeStore(data);

  if (isSupabaseActive()) {
    const [leadSync, activitySync] = await Promise.all([
      upsertRemoteLead(after),
      upsertRemoteActivity(activity),
    ]);

    if (leadSync.error || activitySync.error) {
      return null;
    }

    await refreshRemoteStore(null, true);
  }

  return after;
}

async function createManualActivity(payload, actorId) {
  const data = readStore();
  const actor = data.users.find((user) => user.id === actorId && user.status === "Active");
  const lead = data.leads.find((item) => item.id === normaliseLeadId(payload.leadId));

  if (!actor) {
    return { error: "Sign in again before logging activity." };
  }

  if (lead && !canAccessLead(actor, lead)) {
    return { error: "You can only log activity for your assigned customers." };
  }

  const nextFollowUpDate = cleanText(payload.nextFollowUpDate);
  if (lead && nextFollowUpDate) {
    lead.followUpDate = nextFollowUpDate;
    lead.updatedAt = new Date().toISOString();
  }

  const activity = logActivity(data, {
    userId: actor.id,
    leadId: lead?.id || "",
    leadName: lead?.companyName || "General CRM work",
    action: payload.action,
    minutes: payload.minutes,
    note: payload.note,
    changes: lead
      ? nextFollowUpDate
        ? "Daily activity logged; follow-up scheduled"
        : "Daily activity logged"
      : "General daily activity logged",
    outcome: payload.outcome,
    sentiment: payload.sentiment,
    priority: payload.priority,
    nextFollowUpDate,
    deliverable: payload.deliverable,
    needsSupport: payload.needsSupport,
    activityDate: payload.activityDate,
  });

  writeStore(data);

  if (isSupabaseActive()) {
    const operations = [upsertRemoteActivity(activity)];
    if (lead && nextFollowUpDate) {
      operations.push(upsertRemoteLead(lead));
    }

    const results = await Promise.all(operations);
    if (results.some((result) => result.error)) {
      return { error: "Database sync failed. Please try again." };
    }

    await refreshRemoteStore(null, true);
  }

  return { activity };
}

function validateLoginId(data, loginId, ignoreUserId = "") {
  const cleanLogin = cleanText(loginId).toLowerCase();
  if (!cleanLogin) {
    return "Login ID is required.";
  }

  if (
    data.users.some(
      (user) => user.id !== ignoreUserId && user.loginId.toLowerCase() === cleanLogin,
    )
  ) {
    return "That Login ID is already assigned to another user.";
  }

  return "";
}

async function createUser(payload, actorId) {
  const data = readStore();
  const loginError = validateLoginId(data, payload.loginId);
  const password = cleanPassword(payload.password);

  if (loginError) {
    return { error: loginError };
  }

  if (!password) {
    return { error: "Password is required for every CRM user." };
  }

  const userNumber = data.nextUserNumber;
  const user = normaliseUser(
    {
      id: buildUserId(userNumber),
      ...payload,
      password,
      createdAt: new Date().toISOString(),
    },
    buildUserId(userNumber),
  );

  if (isSupabaseActive()) {
    const apiResult = await callAdminUserApi("POST", { user, password });
    if (apiResult.error) {
      return { error: apiResult.error };
    }
    user.authUserId = apiResult.data.user?.auth_user_id || user.authUserId;
  }

  data.users.push(user);
  data.nextUserNumber = userNumber + 1;
  const activity = logActivity(data, {
    userId: actorId,
    leadName: "User administration",
    action: "CRM update",
    minutes: 5,
    note: `Created CRM user ${user.fullName}.`,
    changes: `User added with role ${user.role}`,
  });
  writeStore(data);

  if (isSupabaseActive()) {
    const activitySync = await upsertRemoteActivity(activity);
    if (activitySync.error) {
      return { error: "User was saved, but admin activity sync failed." };
    }
    await refreshRemoteStore(null, true);
  }

  return { user };
}

async function updateUser(userId, payload, actorId) {
  const data = readStore();
  const index = data.users.findIndex((user) => user.id === userId);

  if (index === -1) {
    return { error: "User not found." };
  }

  const loginError = validateLoginId(data, payload.loginId, userId);
  if (loginError) {
    return { error: loginError };
  }

  const before = data.users[index];
  const nextPassword =
    before.loginId === ADMIN_LOGIN_ID ? ADMIN_PASSWORD : cleanPassword(payload.password) || before.password;
  const updatedUser = normaliseUser(
    {
      ...before,
      ...payload,
      password: nextPassword,
      updatedAt: new Date().toISOString(),
    },
    before.id,
  );

  if (isSupabaseActive()) {
    const apiResult = await callAdminUserApi("PUT", {
      userId,
      user: updatedUser,
      password: cleanPassword(payload.password),
    });
    if (apiResult.error) {
      return { error: apiResult.error };
    }
    updatedUser.authUserId = apiResult.data.user?.auth_user_id || updatedUser.authUserId;
  }

  data.users[index] = updatedUser;
  data.leads = data.leads.map((lead) =>
    lead.ownerId === updatedUser.id
      ? normaliseLead({ ...lead, ownerName: updatedUser.fullName }, lead.id, data.users)
      : lead,
  );
  const activity = logActivity(data, {
    userId: actorId,
    leadName: "User administration",
    action: "CRM update",
    minutes: 5,
    note: `Updated CRM user ${updatedUser.fullName}.`,
    changes: `User details updated for ${updatedUser.loginId}`,
  });
  writeStore(data);

  if (isSupabaseActive()) {
    const activitySync = await upsertRemoteActivity(activity);
    if (activitySync.error) {
      return { error: "User was updated, but admin activity sync failed." };
    }
    await refreshRemoteStore(null, true);
  }

  return { user: updatedUser };
}

async function deleteUser(userId, actorId) {
  const data = readStore();
  const user = data.users.find((item) => item.id === userId);
  const actor = data.users.find((item) => item.id === actorId);

  if (!user) {
    return { error: "User not found." };
  }

  if (actor?.id === user.id) {
    return { error: "You cannot delete the account you are currently using." };
  }

  const adminCount = data.users.filter(
    (item) => item.role === "Admin" && item.status === "Active",
  ).length;
  if (user.role === "Admin" && adminCount <= 1) {
    return { error: "At least one active admin must remain." };
  }

  const reassignmentOwner =
    data.users.find((item) => item.role === "Admin" && item.id !== user.id) ||
    data.users.find((item) => item.id !== user.id && item.status === "Active");
  data.users = data.users.filter((item) => item.id !== user.id);
  const reassignedLeads = [];
  data.leads = data.leads.map((lead) => {
    if (lead.ownerId !== user.id) {
      return lead;
    }

    const reassignedLead = normaliseLead(
      { ...lead, ownerId: reassignmentOwner?.id },
      lead.id,
      data.users,
    );
    reassignedLeads.push(reassignedLead);
    return reassignedLead;
  });

  if (isSupabaseActive()) {
    const leadSyncResults = await Promise.all(reassignedLeads.map(upsertRemoteLead));
    if (leadSyncResults.some((result) => result.error)) {
      return { error: "Lead reassignment failed. User was not deleted." };
    }

    const apiResult = await callAdminUserApi("DELETE", { userId });
    if (apiResult.error) {
      return { error: apiResult.error };
    }
  }
  const activity = logActivity(data, {
    userId: actorId,
    leadName: "User administration",
    action: "CRM update",
    minutes: 5,
    note: `Deleted CRM user ${user.fullName}.`,
    changes: reassignmentOwner
      ? `Open records reassigned to ${reassignmentOwner.fullName}`
      : "User deleted",
  });
  writeStore(data);

  if (isSupabaseActive()) {
    const activitySync = await upsertRemoteActivity(activity);
    if (activitySync.error) {
      return { error: "User was deleted, but admin activity sync failed." };
    }
    await refreshRemoteStore(null, true);
  }

  return { user };
}

function fillSelectOptions(select, options, includeAll = false) {
  if (!select) {
    return;
  }

  const values = includeAll ? ["All", ...options] : options;
  select.innerHTML = values
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
    .join("");
}

function fillUserOptions(select, users, includeRoles = true) {
  if (!select) {
    return;
  }

  const options = users
    .filter((user) => user.status === "Active")
    .map((user) => {
      const label = includeRoles ? `${user.fullName} (${user.role})` : user.fullName;
      return `<option value="${escapeHtml(user.id)}">${escapeHtml(label)}</option>`;
    })
    .join("");

  select.innerHTML = options;
}

function fillLeadOptions(select, leads) {
  if (!select) {
    return;
  }

  select.innerHTML = [
    `<option value="">General CRM work</option>`,
    ...leads.map((lead) => {
      return `<option value="${escapeHtml(lead.id)}">${escapeHtml(lead.companyName)} - ${escapeHtml(lead.id)}</option>`;
    }),
  ].join("");
}

function leadLookupHtml(lead) {
  return `
    <div class="lookup-row">
      <div>
        <h3>${escapeHtml(lead.id)}</h3>
        <p>${escapeHtml(lead.companyName)} with ${escapeHtml(lead.contactName)}</p>
      </div>
      ${badgeHtml(lead.stage, stageClass(lead.stage))}
    </div>
    <p><strong>Owner:</strong> ${escapeHtml(lead.ownerName)}</p>
    <p><strong>Priority:</strong> ${escapeHtml(lead.priority)}</p>
    <p><strong>Next action:</strong> ${escapeHtml(lead.nextAction)}</p>
    <p><strong>Follow-up:</strong> ${escapeHtml(formatDate(lead.followUpDate))}</p>
    <p><strong>Updated:</strong> ${escapeHtml(formatDateTime(lead.updatedAt))}</p>
    ${collaborationActionsHtml(lead, true)}
  `;
}

function renderEmptyRow(columnCount, message) {
  return `<tr><td colspan="${columnCount}">${escapeHtml(message)}</td></tr>`;
}

function renderActivityDetails(activity) {
  const detailLines = [
    activity.outcome ? `Outcome: ${activity.outcome}` : "",
    activity.nextFollowUpDate
      ? `Next follow-up: ${formatDate(activity.nextFollowUpDate)}`
      : "",
    activity.deliverable ? `Reference: ${activity.deliverable}` : "",
    activity.needsSupport ? "Manager support required" : "",
  ].filter(Boolean);

  return `
    ${escapeHtml(activity.note)}
    ${activity.changes ? `<span class="activity-detail">${escapeHtml(activity.changes)}</span>` : ""}
    <div class="activity-meta">
      ${badgeHtml(activity.outcome, "badge--qualified")}
      ${badgeHtml(activity.sentiment, sentimentClass(activity.sentiment))}
      ${badgeHtml(activity.priority, activityPriorityClass(activity.priority))}
    </div>
    ${
      detailLines.length
        ? `<span class="activity-detail">${escapeHtml(detailLines.join(" | "))}</span>`
        : ""
    }
  `;
}

function renderActivityRows(activities, columnCount = 6) {
  const data = readStore();
  return activities.length
    ? activities
        .map((activity) => {
          const activityLead = data.leads.find((lead) => lead.id === activity.leadId);
          return `
            <tr>
              <td>${escapeHtml(formatDateTime(activity.createdAt))}</td>
              <td>${escapeHtml(activity.userName)}</td>
              <td>${escapeHtml(activity.leadName)}</td>
              <td>${escapeHtml(activity.action)}</td>
              <td>${escapeHtml(formatDuration(activity.minutes))}</td>
              <td>
                ${renderActivityDetails(activity)}
                ${activityLead ? collaborationActionsHtml(activityLead, true) : ""}
              </td>
            </tr>
          `;
        })
        .join("")
    : renderEmptyRow(columnCount, "No activity logged yet.");
}

function renderSharedFooter() {
  const footerNote = document.querySelector("#shared-footer-note");
  if (!footerNote) {
    return;
  }

  if (isSupabaseActive()) {
    footerNote.textContent =
      "Connected to Supabase. CRM changes sync through the shared database for permitted users and admins.";
    return;
  }

  footerNote.textContent = storageAvailable
    ? "Local demo mode. Add Supabase URL and anon key to make this shared database-backed."
    : "Browser storage is limited in this session. Use a local web server for reliable testing.";
}

function renderLoginGate(message = "Sign in to continue.") {
  let gate = document.querySelector("#auth-gate");
  if (!gate) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <section id="auth-gate" class="auth-gate" aria-modal="true" role="dialog">
          <div class="auth-gate__panel">
            <div>
              <img class="auth-gate__logo" src="/assets/glydus-logo.svg" alt="Glydus" />
              <p class="eyebrow">Secure Access</p>
              <h2>Glydus CRM login</h2>
              <p id="auth-message" class="lead-copy"></p>
            </div>
            <form id="auth-form" class="stack-form">
              <label>
                Login ID
                <input name="loginId" type="text" autocomplete="username" required />
              </label>
              <label>
                Password
                <input name="password" type="password" autocomplete="current-password" required />
              </label>
              <button class="button button--primary" type="submit">Sign In</button>
              <p id="auth-error" class="inline-message" aria-live="polite"></p>
            </form>
          </div>
        </section>
      `,
    );
    gate = document.querySelector("#auth-gate");
  }

  document.body.classList.add("auth-locked");
  document.querySelector("#auth-message").textContent = message;
  gate.hidden = false;
  gate.querySelector("input")?.focus();
}

function hideLoginGate() {
  const gate = document.querySelector("#auth-gate");
  if (gate) {
    gate.hidden = true;
  }
  document.body.classList.remove("auth-locked");
  document.body.classList.add("auth-ready");
}

function requiredAccessForPage() {
  const page = document.body.dataset.page;
  return page === "admin" || page === "overview" ? "Admin" : "User";
}

function getPostLoginTarget(user) {
  const page = document.body.dataset.page;
  if (isAdmin(user)) {
    return page === "user" ? "user-portal.html" : window.location.pathname.split("/").pop() || "index.html";
  }

  return "user-portal.html";
}

function requireAccess() {
  const data = readStore();
  const user = getAuthenticatedUser(data);
  const requiredAccess = requiredAccessForPage();

  if (!user) {
    renderLoginGate(
      requiredAccess === "Admin"
        ? "Admin login is required for the command center."
        : "Use your registered CRM Login ID and password.",
    );
    return null;
  }

  if (requiredAccess === "Admin" && !isAdmin(user)) {
    window.location.replace("user-portal.html");
    return null;
  }

  hideLoginGate();
  return user;
}

function updateSessionChrome(user) {
  document.body.classList.toggle("is-admin-session", isAdmin(user));
  document.body.classList.toggle("is-user-session", !isAdmin(user));

  document.querySelectorAll("[data-admin-only]").forEach((node) => {
    node.hidden = !isAdmin(user);
  });

  document.querySelectorAll("[data-user-name]").forEach((node) => {
    node.textContent = user.fullName;
  });

  document.querySelectorAll("[data-user-role]").forEach((node) => {
    node.textContent = user.role;
  });

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      clearSession();
      window.location.href = "user-portal.html";
    });
  });
}

function renderOverviewPage(authUser) {
  const refs = {
    totalLeads: document.querySelector("#overview-total-leads"),
    openValue: document.querySelector("#overview-open-value"),
    wonCount: document.querySelector("#overview-won-count"),
    timeToday: document.querySelector("#overview-time-today"),
    stageGrid: document.querySelector("#overview-stage-grid"),
    table: document.querySelector("#overview-lead-table"),
    activityTable: document.querySelector("#overview-activity-table"),
  };

  const render = () => {
    const data = readStore();
    const leads = getSortedLeads(data.leads);
    const activities = getSortedActivities(data.activities);
    const metrics = getMetrics(leads, data.users, activities);
    const stages = getStageBreakdown(leads);

    refs.totalLeads.textContent = String(metrics.totalLeads);
    refs.openValue.textContent = formatCurrency(metrics.openValue);
    refs.wonCount.textContent = String(metrics.wonCount);
    refs.timeToday.textContent = formatDuration(metrics.todayMinutes);

    refs.stageGrid.innerHTML = stages
      .map((stage) => {
        return `
          <article class="stage-summary-card">
            <span class="eyebrow">${escapeHtml(stage.stage)}</span>
            <strong>${escapeHtml(String(stage.count))} leads</strong>
            <p>${escapeHtml(formatCurrency(stage.value))}</p>
          </article>
        `;
      })
      .join("");

    refs.table.innerHTML = leads.length
      ? leads
          .slice(0, 8)
          .map((lead) => {
            return `
              <tr>
                <td>${escapeHtml(lead.id)}</td>
                <td>${escapeHtml(lead.companyName)}</td>
                <td>${escapeHtml(lead.ownerName)}</td>
                <td>${badgeHtml(lead.stage, stageClass(lead.stage))}</td>
                <td>${escapeHtml(formatCurrency(lead.estimatedValue))}</td>
                <td>${escapeHtml(formatDate(lead.followUpDate))}</td>
              </tr>
            `;
          })
          .join("")
      : renderEmptyRow(6, "No leads available yet.");

    refs.activityTable.innerHTML = renderActivityRows(activities.slice(0, 6));
    updateSessionChrome(authUser);
    renderSharedFooter();
  };

  render();
  subscribeToStore(render);
}

function renderUserPage(authUser) {
  const refs = {
    userSelector: document.querySelector("#user-selector"),
    myLeadCount: document.querySelector("#user-my-leads-count"),
    dueCount: document.querySelector("#user-due-count"),
    openValue: document.querySelector("#user-open-value"),
    timeToday: document.querySelector("#user-time-today"),
    createForm: document.querySelector("#lead-create-form"),
    createMessage: document.querySelector("#lead-create-message"),
    lookupForm: document.querySelector("#lead-lookup-form"),
    lookupInput: document.querySelector("#lead-lookup-input"),
    lookupButton: document.querySelector("#lead-lookup-button"),
    lookupResult: document.querySelector("#lead-lookup-result"),
    followUpCount: document.querySelector("#user-follow-up-count"),
    followUpList: document.querySelector("#user-follow-up-list"),
    pipelineCount: document.querySelector("#user-pipeline-count"),
    pipelineBoard: document.querySelector("#user-pipeline-board"),
    editorTitle: document.querySelector("#user-editor-title"),
    editorStage: document.querySelector("#user-editor-stage"),
    editorEmpty: document.querySelector("#user-editor-empty"),
    editorForm: document.querySelector("#user-lead-editor"),
    editorMessage: document.querySelector("#user-editor-message"),
    leadId: document.querySelector("#user-lead-id"),
    companyName: document.querySelector("#user-company-name"),
    contactName: document.querySelector("#user-contact-name"),
    sourceName: document.querySelector("#user-source-name"),
    leadValue: document.querySelector("#user-lead-value"),
    stageSelect: document.querySelector("#user-stage-select"),
    prioritySelect: document.querySelector("#user-priority-select"),
    probabilityInput: document.querySelector("#user-probability-input"),
    followUpInput: document.querySelector("#user-follow-up-input"),
    nextActionInput: document.querySelector("#user-next-action-input"),
    noteInput: document.querySelector("#user-note-input"),
    timeInput: document.querySelector("#user-time-input"),
    sourceSelect: document.querySelector("#lead-source-select"),
    createPrioritySelect: document.querySelector("#lead-priority-select"),
    activityForm: document.querySelector("#user-activity-form"),
    activityInsights: document.querySelector("#user-activity-insights"),
    activityLeadSelect: document.querySelector("#user-activity-lead-select"),
    activityTypeSelect: document.querySelector("#user-activity-type-select"),
    activityOutcomeSelect: document.querySelector("#user-activity-outcome-select"),
    activitySentimentSelect: document.querySelector("#user-activity-sentiment-select"),
    activityPrioritySelect: document.querySelector("#user-activity-priority-select"),
    activityMessage: document.querySelector("#user-activity-message"),
    activityFocusCount: document.querySelector("#user-activity-focus-count"),
    activityFocusList: document.querySelector("#user-activity-focus-list"),
    activityTable: document.querySelector("#user-activity-table"),
  };

  fillSelectOptions(refs.stageSelect, STAGE_OPTIONS);
  fillSelectOptions(refs.prioritySelect, PRIORITY_OPTIONS);
  fillSelectOptions(refs.sourceSelect, SOURCE_OPTIONS);
  fillSelectOptions(refs.createPrioritySelect, PRIORITY_OPTIONS);
  fillSelectOptions(refs.activityTypeSelect, ACTIVITY_TYPE_OPTIONS);
  fillSelectOptions(refs.activityOutcomeSelect, ACTIVITY_OUTCOME_OPTIONS);
  fillSelectOptions(refs.activitySentimentSelect, ACTIVITY_SENTIMENT_OPTIONS);
  fillSelectOptions(refs.activityPrioritySelect, ACTIVITY_PRIORITY_OPTIONS);
  refs.createPrioritySelect.value = "Warm";
  refs.activityOutcomeSelect.value = "Completed";
  refs.activitySentimentSelect.value = "Neutral";
  refs.activityPrioritySelect.value = "Normal";

  const render = () => {
    const data = readStore();
    const sessionUser = getAuthenticatedUser(data) || authUser;
    const activeUsers = data.users.filter((user) => user.status === "Active");
    const selectableUsers = isAdmin(sessionUser) ? activeUsers : [sessionUser];
    const defaultUser = isAdmin(sessionUser) ? pickDefaultUser(activeUsers) : sessionUser;

    if (!userState.currentUserId) {
      userState.currentUserId = defaultUser?.id || "";
    }

    if (!selectableUsers.some((user) => user.id === userState.currentUserId)) {
      userState.currentUserId = defaultUser?.id || "";
    }

    fillUserOptions(refs.userSelector, selectableUsers);
    refs.userSelector.value = userState.currentUserId;
    refs.userSelector.disabled = !isAdmin(sessionUser);

    const myLeads = getSortedLeads(
      data.leads.filter((lead) => lead.ownerId === userState.currentUserId),
    );
    const myActivities = getSortedActivities(
      data.activities.filter((activity) => activity.userId === userState.currentUserId),
    );
    const dueLeads = myLeads.filter(isDueLead);
    const openValue = myLeads
      .filter((lead) => !CLOSED_STAGES.has(lead.stage))
      .reduce((sum, lead) => sum + lead.estimatedValue, 0);
    const todayMinutes = myActivities
      .filter((activity) => activity.activityDate === getTodayKey())
      .reduce((sum, activity) => sum + activity.minutes, 0);
    const todayActivities = myActivities.filter(
      (activity) => activity.activityDate === getTodayKey(),
    );
    const supportNeeded = myActivities.filter((activity) => activity.needsSupport);
    const followUpCommitments = myActivities.filter((activity) => {
      return activity.nextFollowUpDate && activity.nextFollowUpDate >= getTodayKey();
    });
    const touchedCustomers = new Set(
      todayActivities.map((activity) => activity.leadId || activity.leadName),
    );

    refs.myLeadCount.textContent = String(myLeads.length);
    refs.dueCount.textContent = String(dueLeads.length);
    refs.openValue.textContent = formatCurrency(openValue);
    refs.timeToday.textContent = formatDuration(todayMinutes);
    refs.pipelineCount.textContent = `${myLeads.length} leads`;
    refs.followUpCount.textContent = `${dueLeads.length} items`;
    fillLeadOptions(refs.activityLeadSelect, myLeads);
    if (refs.activityForm?.activityDate && !refs.activityForm.activityDate.value) {
      refs.activityForm.activityDate.value = getTodayKey();
    }

    refs.activityInsights.innerHTML = [
      {
        label: "Touchpoints today",
        value: String(todayActivities.length),
        note: `${touchedCustomers.size} customer records touched`,
      },
      {
        label: "Time captured",
        value: formatDuration(todayMinutes),
        note: "Logged against customer work",
      },
      {
        label: "Follow-up commitments",
        value: String(followUpCommitments.length),
        note: "Open future actions from activity logs",
      },
      {
        label: "Support needed",
        value: String(supportNeeded.length),
        note: "Items marked for manager review",
      },
    ]
      .map((item) => {
        return `
          <article class="activity-insight-card">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
            <p>${escapeHtml(item.note)}</p>
          </article>
        `;
      })
      .join("");

    refs.followUpList.innerHTML = dueLeads.length
      ? dueLeads
          .slice(0, 6)
          .map((lead) => {
            return `
              <article class="mini-item">
                <strong>${escapeHtml(lead.companyName)}</strong>
                <span>${escapeHtml(lead.id)} | ${escapeHtml(lead.stage)}</span>
                <p>${escapeHtml(lead.nextAction)}</p>
                <p>Follow-up: ${escapeHtml(formatDate(lead.followUpDate))}</p>
              </article>
            `;
          })
          .join("")
      : `<div class="mini-item"><strong>No urgent follow-ups</strong><p>Your due queue is clear for now.</p></div>`;

    const focusItems = [
      ...dueLeads.slice(0, 3).map((lead) => ({
        title: lead.companyName,
        meta: `${lead.id} | ${lead.stage}`,
        note: lead.nextAction,
      })),
      ...supportNeeded.slice(0, 2).map((activity) => ({
        title: activity.leadName,
        meta: `${activity.action} | ${formatDate(activity.activityDate)}`,
        note: activity.note,
      })),
    ];
    refs.activityFocusCount.textContent = `${focusItems.length} items`;
    refs.activityFocusList.innerHTML = focusItems.length
      ? focusItems
          .map((item) => {
            return `
              <article class="mini-item">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.meta)}</span>
                <p>${escapeHtml(item.note)}</p>
              </article>
            `;
          })
          .join("")
      : `<div class="mini-item"><strong>Clean queue</strong><p>No urgent follow-ups or support blockers are open.</p></div>`;

    if (!myLeads.some((lead) => lead.id === userState.selectedLeadId)) {
      userState.selectedLeadId = myLeads[0]?.id || null;
    }

    refs.pipelineBoard.innerHTML = STAGE_OPTIONS.map((stage) => {
      const stageLeads = myLeads.filter((lead) => lead.stage === stage);
      const stageValue = stageLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);

      return `
        <section class="stage-column">
          <div class="stage-column__head">
            <div>
              <h3>${escapeHtml(stage)}</h3>
              <p>${escapeHtml(formatCurrency(stageValue))}</p>
            </div>
            <span class="subtle-chip">${escapeHtml(String(stageLeads.length))}</span>
          </div>
          <div class="stage-column__body">
            ${
              stageLeads.length
                ? stageLeads
                    .map((lead) => {
                      const selectedClass =
                        lead.id === userState.selectedLeadId ? "is-selected" : "";

                      return `
                        <article
                          class="lead-card ${selectedClass}"
                          role="button"
                          tabindex="0"
                          data-select-lead="${escapeHtml(lead.id)}"
                        >
                          <div class="lead-card__top">
                            <div>
                              <strong>${escapeHtml(lead.companyName)}</strong>
                              <small>${escapeHtml(lead.id)}</small>
                            </div>
                            ${badgeHtml(lead.priority, priorityClass(lead.priority))}
                          </div>
                          <p>${escapeHtml(lead.contactName)}</p>
                          <div class="lead-meta">
                            ${badgeHtml(lead.stage, stageClass(lead.stage))}
                            <span class="subtle-chip">${escapeHtml(formatCurrency(lead.estimatedValue))}</span>
                          </div>
                          <p>Next: ${escapeHtml(lead.nextAction)}</p>
                          <p>Follow-up: ${escapeHtml(formatDate(lead.followUpDate))}</p>
                          ${collaborationActionsHtml(lead, true)}
                        </article>
                      `;
                    })
                    .join("")
                : `<div class="mini-item"><strong>No leads</strong><p>No records in this stage.</p></div>`
            }
          </div>
        </section>
      `;
    }).join("");

    const selectedLead = myLeads.find((lead) => lead.id === userState.selectedLeadId);

    if (!selectedLead) {
      refs.editorEmpty.hidden = false;
      refs.editorForm.hidden = true;
      refs.editorTitle.textContent = "Choose a lead";
      refs.editorStage.textContent = "Waiting";
      refs.editorStage.className = "subtle-chip";
    } else {
      refs.editorEmpty.hidden = true;
      refs.editorForm.hidden = false;
      refs.editorTitle.textContent = selectedLead.companyName;
      refs.editorStage.textContent = selectedLead.stage;
      refs.editorStage.className = `badge ${stageClass(selectedLead.stage)}`;
      refs.leadId.value = selectedLead.id;
      refs.companyName.textContent = selectedLead.companyName;
      refs.contactName.textContent = selectedLead.contactName;
      refs.sourceName.textContent = selectedLead.source;
      refs.leadValue.textContent = formatCurrency(selectedLead.estimatedValue);
      refs.stageSelect.value = selectedLead.stage;
      refs.prioritySelect.value = selectedLead.priority;
      refs.probabilityInput.value = String(selectedLead.probability);
      refs.followUpInput.value = selectedLead.followUpDate || "";
      refs.nextActionInput.value = selectedLead.nextAction;
      refs.noteInput.value = selectedLead.lastNote;
      refs.editorForm.querySelector("[data-user-lead-actions]")?.remove();
      refs.editorForm.insertAdjacentHTML(
        "afterbegin",
        `<div data-user-lead-actions>${collaborationActionsHtml(selectedLead, false)}</div>`,
      );
    }

    refs.activityTable.innerHTML = renderActivityRows(myActivities.slice(0, 10));
    refs.createMessage.textContent = userState.createMessage;
    refs.editorMessage.textContent = userState.editorMessage;
    refs.activityMessage.textContent = userState.activityMessage;
    updateSessionChrome(sessionUser);
    renderSharedFooter();
  };

  refs.userSelector?.addEventListener("change", (event) => {
    userState.currentUserId = event.target.value;
    userState.selectedLeadId = null;
    userState.createMessage = "";
    userState.editorMessage = "";
    userState.activityMessage = "";
    render();
  });

  const getActingUserId = () => {
    const sessionUser = getAuthenticatedUser();
    return isAdmin(sessionUser)
      ? userState.currentUserId || sessionUser?.id
      : sessionUser?.id;
  };

  refs.createForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const actingUserId = getActingUserId();
    const formData = new FormData(refs.createForm);
    const lead = await createLead(
      {
        companyName: formData.get("companyName"),
        contactName: formData.get("contactName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        source: formData.get("source"),
        estimatedValue: formData.get("estimatedValue"),
        nextAction: formData.get("nextAction"),
        followUpDate: formData.get("followUpDate"),
        priority: formData.get("priority"),
        lastNote: formData.get("lastNote"),
      },
      userState.currentUserId,
      actingUserId,
    );

    if (lead) {
      userState.selectedLeadId = lead.id;
      userState.createMessage = `Lead ${lead.id} created for ${lead.companyName}.`;
      userState.editorMessage = "";
      refs.createForm.reset();
      refs.createPrioritySelect.value = "Warm";
      render();
    }
  });

  const showLeadLookup = () => {
    const data = readStore();
    const sessionUser = getAuthenticatedUser(data);
    const lead = getLeadById(refs.lookupInput.value, sessionUser);

    if (!lead) {
      refs.lookupResult.className = "info-panel info-panel--empty";
      refs.lookupResult.innerHTML =
        "No accessible lead found for that ID. Check the lead number or ask an admin for ownership.";
      return;
    }

    refs.lookupResult.className = "info-panel";
    refs.lookupResult.innerHTML = leadLookupHtml(lead);
  };

  refs.lookupForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    showLeadLookup();
  });

  refs.lookupButton?.addEventListener("click", (event) => {
    event.preventDefault();
    showLeadLookup();
  });

  refs.pipelineBoard?.addEventListener("click", (event) => {
    if (event.target.closest(".collab-actions a")) {
      return;
    }

    const button = event.target.closest("[data-select-lead]");
    if (!button) {
      return;
    }

    userState.selectedLeadId = button.dataset.selectLead;
    userState.editorMessage = "";
    render();
  });

  refs.editorForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const actingUserId = getActingUserId();
    const updatedLead = await updateLead(
      refs.leadId.value,
      {
        stage: refs.stageSelect.value,
        priority: refs.prioritySelect.value,
        probability: refs.probabilityInput.value,
        nextAction: refs.nextActionInput.value,
        followUpDate: refs.followUpInput.value,
        lastNote: refs.noteInput.value,
      },
      actingUserId,
      {
        minutes: refs.timeInput.value,
        note: refs.noteInput.value,
      },
    );

    if (updatedLead) {
      userState.selectedLeadId = updatedLead.id;
      userState.editorMessage = `Saved updates for ${updatedLead.id}.`;
      userState.createMessage = "";
      refs.timeInput.value = "";
      render();
    }
  });

  refs.activityForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const actingUserId = getActingUserId();
    const formData = new FormData(refs.activityForm);
    const result = await createManualActivity(
      {
        leadId: formData.get("leadId"),
        action: formData.get("action"),
        activityDate: formData.get("activityDate"),
        minutes: formData.get("minutes"),
        outcome: formData.get("outcome"),
        sentiment: formData.get("sentiment"),
        priority: formData.get("priority"),
        nextFollowUpDate: formData.get("nextFollowUpDate"),
        deliverable: formData.get("deliverable"),
        needsSupport: formData.get("needsSupport") === "on",
        note: formData.get("note"),
      },
      actingUserId,
    );

    if (result.error) {
      userState.activityMessage = result.error;
    } else {
      userState.activityMessage = `Logged ${formatDuration(result.activity.minutes)} for ${result.activity.leadName}.`;
      refs.activityForm.reset();
      refs.activityOutcomeSelect.value = "Completed";
      refs.activitySentimentSelect.value = "Neutral";
      refs.activityPrioritySelect.value = "Normal";
      refs.activityForm.activityDate.value = getTodayKey();
    }
    render();
  });

  render();
  subscribeToStore(render);
}

function filterAdminLeads(leads) {
  return leads.filter((lead) => {
    const stageMatch =
      adminState.stageFilter === "All" || lead.stage === adminState.stageFilter;
    const query = adminState.searchQuery.toLowerCase();
    const haystack = [
      lead.id,
      lead.companyName,
      lead.contactName,
      lead.ownerName,
      lead.email,
      lead.lastNote,
      lead.nextAction,
    ]
      .join(" ")
      .toLowerCase();

    return stageMatch && (!query || haystack.includes(query));
  });
}

function renderAdminPage(authUser) {
  const refs = {
    totalLeads: document.querySelector("#admin-total-leads"),
    hotLeads: document.querySelector("#admin-hot-leads"),
    wonValue: document.querySelector("#admin-won-value"),
    timeToday: document.querySelector("#admin-time-today"),
    leadCount: document.querySelector("#admin-lead-count"),
    stageFilter: document.querySelector("#admin-stage-filter"),
    searchInput: document.querySelector("#admin-search-input"),
    leadList: document.querySelector("#admin-lead-list"),
    editorTitle: document.querySelector("#admin-editor-title"),
    editorStage: document.querySelector("#admin-editor-stage"),
    editorEmpty: document.querySelector("#admin-editor-empty"),
    editorForm: document.querySelector("#admin-lead-editor"),
    editorMessage: document.querySelector("#admin-editor-message"),
    leadId: document.querySelector("#admin-lead-id"),
    companyInput: document.querySelector("#admin-company-input"),
    contactInput: document.querySelector("#admin-contact-input"),
    emailInput: document.querySelector("#admin-email-input"),
    phoneInput: document.querySelector("#admin-phone-input"),
    sourceSelect: document.querySelector("#admin-source-select"),
    ownerSelect: document.querySelector("#admin-owner-select"),
    stageSelect: document.querySelector("#admin-stage-select"),
    prioritySelect: document.querySelector("#admin-priority-select"),
    valueInput: document.querySelector("#admin-value-input"),
    probabilityInput: document.querySelector("#admin-probability-input"),
    followUpInput: document.querySelector("#admin-follow-up-input"),
    nextActionInput: document.querySelector("#admin-next-action-input"),
    noteInput: document.querySelector("#admin-note-input"),
    timeInput: document.querySelector("#admin-time-input"),
    userForm: document.querySelector("#admin-user-form"),
    userSubmitButton: document.querySelector("#admin-user-submit"),
    userCancelButton: document.querySelector("#admin-user-cancel"),
    userMessage: document.querySelector("#admin-user-message"),
    userTable: document.querySelector("#admin-user-table"),
    userCount: document.querySelector("#admin-user-count"),
    userLoginInput: document.querySelector("#admin-user-login-input"),
    userPasswordInput: document.querySelector("#admin-user-password-input"),
    userRoleSelect: document.querySelector("#admin-user-role-select"),
    userStatusSelect: document.querySelector("#admin-user-status-select"),
    activityCount: document.querySelector("#admin-activity-count"),
    activityTable: document.querySelector("#admin-activity-table"),
  };

  fillSelectOptions(refs.stageFilter, STAGE_OPTIONS, true);
  fillSelectOptions(refs.sourceSelect, SOURCE_OPTIONS);
  fillSelectOptions(refs.stageSelect, STAGE_OPTIONS);
  fillSelectOptions(refs.prioritySelect, PRIORITY_OPTIONS);
  fillSelectOptions(refs.userRoleSelect, USER_ROLE_OPTIONS);
  fillSelectOptions(refs.userStatusSelect, USER_STATUS_OPTIONS);
  refs.stageFilter.value = adminState.stageFilter;

  const render = () => {
    const data = readStore();
    const leads = getSortedLeads(data.leads);
    const activities = getSortedActivities(data.activities);
    const filteredLeads = filterAdminLeads(leads);
    const metrics = getMetrics(leads, data.users, activities);
    const activeUsers = data.users.filter((user) => user.status === "Active");
    const editingUser = data.users.find((user) => user.id === adminState.editingUserId);

    fillUserOptions(refs.ownerSelect, activeUsers);

    refs.totalLeads.textContent = String(metrics.totalLeads);
    refs.hotLeads.textContent = String(metrics.hotLeads);
    refs.wonValue.textContent = formatCurrency(metrics.wonValue);
    refs.timeToday.textContent = formatDuration(metrics.todayMinutes);
    refs.leadCount.textContent = `${filteredLeads.length} leads`;
    refs.userCount.textContent = `${data.users.length} users`;
    refs.activityCount.textContent = `${activities.length} entries`;

    if (!filteredLeads.some((lead) => lead.id === adminState.selectedLeadId)) {
      adminState.selectedLeadId = filteredLeads[0]?.id || null;
    }

    refs.leadList.innerHTML = filteredLeads.length
      ? filteredLeads
          .map((lead) => {
            const selectedClass =
              lead.id === adminState.selectedLeadId ? "is-selected" : "";

            return `
              <article
                class="record-card ${selectedClass}"
                role="button"
                tabindex="0"
                data-select-lead="${escapeHtml(lead.id)}"
              >
                <div class="record-card__top">
                  <div>
                    <strong>${escapeHtml(lead.companyName)}</strong>
                    <p>${escapeHtml(lead.id)} | ${escapeHtml(lead.contactName)}</p>
                  </div>
                  ${badgeHtml(lead.stage, stageClass(lead.stage))}
                </div>
                <div class="record-card__meta">
                  ${badgeHtml(lead.priority, priorityClass(lead.priority))}
                  <span class="subtle-chip">${escapeHtml(lead.ownerName)}</span>
                  <span class="subtle-chip">${escapeHtml(formatCurrency(lead.estimatedValue))}</span>
                </div>
                <p>${escapeHtml(lead.nextAction)}</p>
                <p>Updated ${escapeHtml(formatDateTime(lead.updatedAt))}</p>
                ${collaborationActionsHtml(lead, true)}
              </article>
            `;
          })
          .join("")
      : `<div class="empty-state">No leads matched the selected filters.</div>`;

    const selectedLead = leads.find((lead) => lead.id === adminState.selectedLeadId);

    if (!selectedLead) {
      refs.editorEmpty.hidden = false;
      refs.editorForm.hidden = true;
      refs.editorTitle.textContent = "Choose a lead";
      refs.editorStage.textContent = "Waiting";
      refs.editorStage.className = "subtle-chip";
    } else {
      refs.editorEmpty.hidden = true;
      refs.editorForm.hidden = false;
      refs.editorTitle.textContent = selectedLead.companyName;
      refs.editorStage.textContent = selectedLead.stage;
      refs.editorStage.className = `badge ${stageClass(selectedLead.stage)}`;
      refs.leadId.value = selectedLead.id;
      refs.companyInput.value = selectedLead.companyName;
      refs.contactInput.value = selectedLead.contactName;
      refs.emailInput.value = selectedLead.email;
      refs.phoneInput.value = selectedLead.phone;
      refs.sourceSelect.value = selectedLead.source;
      refs.ownerSelect.value = selectedLead.ownerId;
      refs.stageSelect.value = selectedLead.stage;
      refs.prioritySelect.value = selectedLead.priority;
      refs.valueInput.value = String(selectedLead.estimatedValue);
      refs.probabilityInput.value = String(selectedLead.probability);
      refs.followUpInput.value = selectedLead.followUpDate || "";
      refs.nextActionInput.value = selectedLead.nextAction;
      refs.noteInput.value = selectedLead.lastNote;
      refs.editorForm.querySelector("[data-admin-lead-actions]")?.remove();
      refs.editorForm.insertAdjacentHTML(
        "afterbegin",
        `<div data-admin-lead-actions>${collaborationActionsHtml(selectedLead, false)}</div>`,
      );
    }

    if (editingUser) {
      refs.userForm.fullName.value = editingUser.fullName;
      refs.userForm.email.value = editingUser.email;
      refs.userForm.loginId.value = editingUser.loginId;
      refs.userForm.password.value = isSupabaseActive() ? "" : editingUser.password;
      refs.userForm.role.value = editingUser.role;
      refs.userForm.department.value = editingUser.department;
      refs.userForm.status.value = editingUser.status;
      refs.userSubmitButton.textContent = "Update User Details";
      refs.userCancelButton.hidden = false;
      refs.userPasswordInput.required = !isSupabaseActive() && editingUser.loginId !== ADMIN_LOGIN_ID;
      refs.userPasswordInput.placeholder = isSupabaseActive()
        ? "Leave blank to keep current password"
        : "Set user password";
    } else {
      refs.userSubmitButton.textContent = "Register User";
      refs.userCancelButton.hidden = true;
      refs.userPasswordInput.required = true;
      refs.userPasswordInput.placeholder = "Set user password";
      refs.userRoleSelect.value = "Sales Executive";
      refs.userStatusSelect.value = "Active";
    }

    refs.searchInput.value = adminState.searchQuery;
    refs.editorMessage.textContent = adminState.editorMessage;
    refs.userMessage.textContent = adminState.userMessage;

    refs.userTable.innerHTML = data.users.length
      ? data.users
          .map((user) => {
            const isProtectedAdmin = user.loginId === ADMIN_LOGIN_ID;
            return `
              <tr>
                <td>${escapeHtml(user.id)}</td>
                <td>${escapeHtml(user.fullName)}<br /><span class="eyebrow">${escapeHtml(user.email)}</span></td>
                <td>${escapeHtml(user.loginId)}</td>
                <td>${escapeHtml(user.role)}</td>
                <td>${escapeHtml(user.department)}</td>
                <td>${badgeHtml(user.status, userStatusClass(user.status))}</td>
                <td>
                  <div class="row-actions">
                    <button class="button button--secondary button--small" type="button" data-edit-user="${escapeHtml(user.id)}">Update</button>
                    <button class="button button--danger button--small" type="button" data-delete-user="${escapeHtml(user.id)}" ${isProtectedAdmin ? "disabled" : ""}>Delete</button>
                  </div>
                </td>
              </tr>
            `;
          })
          .join("")
      : renderEmptyRow(7, "No users available yet.");

    refs.activityTable.innerHTML = renderActivityRows(activities.slice(0, 12));
    updateSessionChrome(authUser);
    renderSharedFooter();
  };

  refs.stageFilter?.addEventListener("change", (event) => {
    adminState.stageFilter = event.target.value;
    render();
  });

  refs.searchInput?.addEventListener("input", (event) => {
    adminState.searchQuery = cleanText(event.target.value);
    render();
  });

  refs.leadList?.addEventListener("click", (event) => {
    if (event.target.closest(".collab-actions a")) {
      return;
    }

    const button = event.target.closest("[data-select-lead]");
    if (!button) {
      return;
    }

    adminState.selectedLeadId = button.dataset.selectLead;
    adminState.editorMessage = "";
    render();
  });

  refs.editorForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const sessionUser = getAuthenticatedUser();
    const updatedLead = await updateLead(
      refs.leadId.value,
      {
        companyName: refs.companyInput.value,
        contactName: refs.contactInput.value,
        email: refs.emailInput.value,
        phone: refs.phoneInput.value,
        source: refs.sourceSelect.value,
        ownerId: refs.ownerSelect.value,
        stage: refs.stageSelect.value,
        priority: refs.prioritySelect.value,
        estimatedValue: refs.valueInput.value,
        probability: refs.probabilityInput.value,
        followUpDate: refs.followUpInput.value,
        nextAction: refs.nextActionInput.value,
        lastNote: refs.noteInput.value,
      },
      sessionUser?.id,
      {
        minutes: refs.timeInput.value,
        note: refs.noteInput.value,
      },
    );

    if (updatedLead) {
      adminState.selectedLeadId = updatedLead.id;
      adminState.editorMessage = `Lead ${updatedLead.id} updated successfully.`;
      refs.timeInput.value = "";
      render();
    }
  });

  refs.userForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const sessionUser = getAuthenticatedUser();
    const formData = new FormData(refs.userForm);
    const payload = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      loginId: formData.get("loginId"),
      password: formData.get("password"),
      role: formData.get("role"),
      department: formData.get("department"),
      status: formData.get("status"),
    };
    const result = adminState.editingUserId
      ? await updateUser(adminState.editingUserId, payload, sessionUser?.id)
      : await createUser(payload, sessionUser?.id);

    if (result.error) {
      adminState.userMessage = result.error;
    } else {
      adminState.userMessage = adminState.editingUserId
        ? `User ${result.user.fullName} updated.`
        : `User ${result.user.fullName} registered with ID ${result.user.id}.`;
      adminState.editingUserId = null;
      refs.userForm.reset();
    }
    render();
  });

  refs.userCancelButton?.addEventListener("click", () => {
    adminState.editingUserId = null;
    adminState.userMessage = "";
    refs.userForm.reset();
    render();
  });

  refs.userTable?.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit-user]");
    const deleteButton = event.target.closest("[data-delete-user]");
    const sessionUser = getAuthenticatedUser();

    if (editButton) {
      adminState.editingUserId = editButton.dataset.editUser;
      adminState.userMessage = "Editing selected user. Save the form to update details.";
      render();
      refs.userLoginInput?.focus();
      return;
    }

    if (deleteButton && !deleteButton.disabled) {
      const data = readStore();
      const user = data.users.find((item) => item.id === deleteButton.dataset.deleteUser);
      const confirmed = window.confirm(`Delete ${user?.fullName || "this user"} from Glydus CRM?`);
      if (!confirmed) {
        return;
      }

      const result = await deleteUser(deleteButton.dataset.deleteUser, sessionUser?.id);
      adminState.userMessage = result.error || `User ${result.user.fullName} deleted.`;
      if (adminState.editingUserId === deleteButton.dataset.deleteUser) {
        adminState.editingUserId = null;
        refs.userForm.reset();
      }
      render();
    }
  });

  render();
  subscribeToStore(render);
}

function initAuthForm() {
  document.addEventListener("submit", async (event) => {
    if (event.target?.id !== "auth-form") {
      return;
    }

    event.preventDefault();
    const formData = new FormData(event.target);
    const error = document.querySelector("#auth-error");
    error.textContent = "";
    const loginId = formData.get("loginId");
    const password = formData.get("password");
    const user = isSupabaseActive()
      ? await authenticateRemoteUser(loginId, password)
      : findUserByCredentials(loginId, password, readStore());

    if (!user) {
      error.textContent = isSupabaseActive()
        ? "Invalid Login ID or password, or this CRM user is not linked to Supabase Auth."
        : "Invalid Login ID or password.";
      return;
    }

    setSession(user);
    const target = getPostLoginTarget(user);
    window.location.href = target;
  });
}

async function initPage() {
  initialiseBrandImages();
  renderSharedFooter();
  await initRemoteDatabase();
  initAuthForm();

  const authUser = requireAccess();
  if (!authUser) {
    return;
  }

  updateSessionChrome(authUser);

  if (document.body.dataset.page === "overview") {
    renderOverviewPage(authUser);
  }

  if (document.body.dataset.page === "user") {
    renderUserPage(authUser);
  }

  if (document.body.dataset.page === "admin") {
    renderAdminPage(authUser);
  }
}

document.addEventListener("DOMContentLoaded", initPage);
