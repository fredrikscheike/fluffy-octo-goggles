// All IANA timezones supported by Intl.DateTimeFormat, grouped by region
const TIMEZONES = [
  // Africa
  "Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers",
  "Africa/Cairo", "Africa/Casablanca", "Africa/Johannesburg", "Africa/Lagos",
  "Africa/Nairobi", "Africa/Tripoli", "Africa/Tunis",
  // America
  "America/Anchorage", "America/Argentina/Buenos_Aires", "America/Bogota",
  "America/Chicago", "America/Denver", "America/Halifax", "America/Lima",
  "America/Los_Angeles", "America/Mexico_City", "America/New_York",
  "America/Phoenix", "America/Santiago", "America/Sao_Paulo",
  "America/St_Johns", "America/Toronto", "America/Vancouver",
  // Asia
  "Asia/Baghdad", "Asia/Bangkok", "Asia/Colombo", "Asia/Dubai",
  "Asia/Hong_Kong", "Asia/Jakarta", "Asia/Karachi", "Asia/Kathmandu",
  "Asia/Kolkata", "Asia/Kuala_Lumpur", "Asia/Manila", "Asia/Riyadh",
  "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei",
  "Asia/Tehran", "Asia/Tokyo", "Asia/Yangon",
  // Atlantic
  "Atlantic/Azores", "Atlantic/Cape_Verde",
  // Australia
  "Australia/Adelaide", "Australia/Brisbane", "Australia/Darwin",
  "Australia/Hobart", "Australia/Perth", "Australia/Sydney",
  // Europe
  "Europe/Amsterdam", "Europe/Athens", "Europe/Berlin", "Europe/Brussels",
  "Europe/Bucharest", "Europe/Budapest", "Europe/Copenhagen", "Europe/Dublin",
  "Europe/Helsinki", "Europe/Istanbul", "Europe/Kyiv", "Europe/Lisbon",
  "Europe/London", "Europe/Madrid", "Europe/Moscow", "Europe/Oslo",
  "Europe/Paris", "Europe/Prague", "Europe/Rome", "Europe/Stockholm",
  "Europe/Vienna", "Europe/Warsaw", "Europe/Zurich",
  // Pacific
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Guam", "Pacific/Honolulu",
  "Pacific/Midway", "Pacific/Noumea", "Pacific/Port_Moresby",
  // UTC
  "UTC",
];

const STORAGE_KEY = "world-clock-v1";

// State: array of { id, timezone, label }
let clocks = [];

function loadClocks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) clocks = JSON.parse(saved);
  } catch {
    clocks = [];
  }
  if (clocks.length === 0) {
    // Seed with local timezone and a couple of defaults
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    clocks = [
      { id: uid(), timezone: localTz, label: "Local" },
      { id: uid(), timezone: "America/New_York", label: "New York" },
      { id: uid(), timezone: "Europe/London", label: "London" },
      { id: uid(), timezone: "Asia/Tokyo", label: "Tokyo" },
    ].filter((c, i, arr) =>
      // deduplicate if local is one of the defaults
      i === arr.findIndex((x) => x.timezone === c.timezone)
    );
  }
}

function saveClocks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clocks));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Populate timezone <select>
function populateSelect() {
  const select = document.getElementById("timezone-select");
  TIMEZONES.forEach((tz) => {
    const opt = document.createElement("option");
    opt.value = tz;
    opt.textContent = tz.replace(/_/g, " ");
    select.appendChild(opt);
  });
}

// Format helpers
function formatTime(date, timezone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDate(date, timezone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getUTCOffset(timezone) {
  const now = new Date();
  const utcMs = now.getTime();
  // Get the time in the target timezone as a string, then parse offset via subtraction
  const tzDate = new Date(
    now.toLocaleString("en-US", { timeZone: timezone })
  );
  const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const diffMs = tzDate - utcDate;
  const diffHrs = Math.floor(Math.abs(diffMs) / 3600000);
  const diffMins = Math.round((Math.abs(diffMs) % 3600000) / 60000);
  const sign = diffMs >= 0 ? "+" : "-";
  return `UTC${sign}${String(diffHrs).padStart(2, "0")}:${String(diffMins).padStart(2, "0")}`;
}

// Render all clock cards
function renderClocks() {
  const grid = document.getElementById("clocks-grid");
  const empty = document.getElementById("empty-state");

  grid.innerHTML = "";

  if (clocks.length === 0) {
    empty.classList.add("visible");
    return;
  }
  empty.classList.remove("visible");

  clocks.forEach((clock) => {
    const card = document.createElement("div");
    card.className = "clock-card";
    card.dataset.id = clock.id;

    const label = clock.label || clock.timezone.split("/").pop().replace(/_/g, " ");

    card.innerHTML = `
      <button class="remove-btn" data-id="${clock.id}" title="Remove">&#x2715;</button>
      <div class="label">${escapeHtml(label)}</div>
      <div class="timezone-name">${escapeHtml(clock.timezone.replace(/_/g, " "))}</div>
      <div class="time" id="time-${clock.id}">--:--:--</div>
      <div class="date" id="date-${clock.id}"></div>
      <div class="offset" id="offset-${clock.id}"></div>
    `;

    grid.appendChild(card);
  });

  // Wire up remove buttons
  grid.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeClock(btn.dataset.id);
    });
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Update time displays (called every second)
function tick() {
  const now = new Date();
  clocks.forEach((clock) => {
    const timeEl = document.getElementById(`time-${clock.id}`);
    const dateEl = document.getElementById(`date-${clock.id}`);
    const offsetEl = document.getElementById(`offset-${clock.id}`);
    if (timeEl) timeEl.textContent = formatTime(now, clock.timezone);
    if (dateEl) dateEl.textContent = formatDate(now, clock.timezone);
    if (offsetEl) offsetEl.textContent = getUTCOffset(clock.timezone);
  });
}

function addClock() {
  const select = document.getElementById("timezone-select");
  const labelInput = document.getElementById("clock-label");
  const timezone = select.value;

  if (!timezone) {
    select.focus();
    select.style.borderColor = "#ff5370";
    setTimeout(() => (select.style.borderColor = ""), 1000);
    return;
  }

  // Prevent duplicates
  if (clocks.some((c) => c.timezone === timezone)) {
    select.style.borderColor = "#f0a500";
    setTimeout(() => (select.style.borderColor = ""), 1000);
    return;
  }

  clocks.push({
    id: uid(),
    timezone,
    label: labelInput.value.trim(),
  });

  saveClocks();
  renderClocks();
  tick();

  select.value = "";
  labelInput.value = "";
}

function removeClock(id) {
  clocks = clocks.filter((c) => c.id !== id);
  saveClocks();
  renderClocks();
  tick();
}

// Init
populateSelect();
loadClocks();
renderClocks();
tick();
setInterval(tick, 1000);

document.getElementById("add-btn").addEventListener("click", addClock);
document.getElementById("clock-label").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addClock();
});
