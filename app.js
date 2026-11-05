(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "super-timezone-v1";
  const cities = [
    { city: "New Delhi", country: "India", flag: "🇮🇳", zone: "Asia/Kolkata", lat: 28.6139, lon: 77.209, short: "Delhi" },
    { city: "London", country: "United Kingdom", flag: "🇬🇧", zone: "Europe/London", lat: 51.5072, lon: -0.1276, short: "London" },
    { city: "New York", country: "United States", flag: "🇺🇸", zone: "America/New_York", lat: 40.7128, lon: -74.006, short: "New York" },
    { city: "Tokyo", country: "Japan", flag: "🇯🇵", zone: "Asia/Tokyo", lat: 35.6762, lon: 139.6503, short: "Tokyo" },
    { city: "Singapore", country: "Singapore", flag: "🇸🇬", zone: "Asia/Singapore", lat: 1.3521, lon: 103.8198, short: "Singapore" },
    { city: "Sydney", country: "Australia", flag: "🇦🇺", zone: "Australia/Sydney", lat: -33.8688, lon: 151.2093, short: "Sydney" },
    { city: "Dubai", country: "United Arab Emirates", flag: "🇦🇪", zone: "Asia/Dubai", lat: 25.2048, lon: 55.2708, short: "Dubai" },
    { city: "Paris", country: "France", flag: "🇫🇷", zone: "Europe/Paris", lat: 48.8566, lon: 2.3522, short: "Paris" },
    { city: "Los Angeles", country: "United States", flag: "🇺🇸", zone: "America/Los_Angeles", lat: 34.0522, lon: -118.2437, short: "LA" },
    { city: "Chicago", country: "United States", flag: "🇺🇸", zone: "America/Chicago", lat: 41.8781, lon: -87.6298, short: "Chicago" },
    { city: "Toronto", country: "Canada", flag: "🇨🇦", zone: "America/Toronto", lat: 43.6532, lon: -79.3832, short: "Toronto" },
    { city: "Vancouver", country: "Canada", flag: "🇨🇦", zone: "America/Vancouver", lat: 49.2827, lon: -123.1207, short: "Vancouver" },
    { city: "Auckland", country: "New Zealand", flag: "🇳🇿", zone: "Pacific/Auckland", lat: -36.8509, lon: 174.7645, short: "Auckland" },
    { city: "Hong Kong", country: "China", flag: "🇭🇰", zone: "Asia/Hong_Kong", lat: 22.3193, lon: 114.1694, short: "Hong Kong" },
    { city: "Seoul", country: "South Korea", flag: "🇰🇷", zone: "Asia/Seoul", lat: 37.5665, lon: 126.978, short: "Seoul" },
    { city: "Bangkok", country: "Thailand", flag: "🇹🇭", zone: "Asia/Bangkok", lat: 13.7563, lon: 100.5018, short: "Bangkok" },
    { city: "Berlin", country: "Germany", flag: "🇩🇪", zone: "Europe/Berlin", lat: 52.52, lon: 13.405, short: "Berlin" },
    { city: "Madrid", country: "Spain", flag: "🇪🇸", zone: "Europe/Madrid", lat: 40.4168, lon: -3.7038, short: "Madrid" },
    { city: "Sao Paulo", country: "Brazil", flag: "🇧🇷", zone: "America/Sao_Paulo", lat: -23.5505, lon: -46.6333, short: "Sao Paulo" },
    { city: "Mexico City", country: "Mexico", flag: "🇲🇽", zone: "America/Mexico_City", lat: 19.4326, lon: -99.1332, short: "Mexico City" },
    { city: "Johannesburg", country: "South Africa", flag: "🇿🇦", zone: "Africa/Johannesburg", lat: -26.2041, lon: 28.0473, short: "Johannesburg" },
    { city: "Cairo", country: "Egypt", flag: "🇪🇬", zone: "Africa/Cairo", lat: 30.0444, lon: 31.2357, short: "Cairo" },
    { city: "Honolulu", country: "United States", flag: "🇺🇸", zone: "Pacific/Honolulu", lat: 21.3099, lon: -157.8581, short: "Honolulu" },
    { city: "Anchorage", country: "United States", flag: "🇺🇸", zone: "America/Anchorage", lat: 61.2181, lon: -149.9003, short: "Anchorage" },
    { city: "Reykjavik", country: "Iceland", flag: "🇮🇸", zone: "Atlantic/Reykjavik", lat: 64.1466, lon: -21.9426, short: "Reykjavik" },
    { city: "Kathmandu", country: "Nepal", flag: "🇳🇵", zone: "Asia/Kathmandu", lat: 27.7172, lon: 85.324, short: "Kathmandu" },
    { city: "Kolkata", country: "India", flag: "🇮🇳", zone: "Asia/Kolkata", lat: 22.5726, lon: 88.3639, short: "Kolkata" }
  ];
  const zoneNames = typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : [...new Set(cities.map((city) => city.zone))];
  const partsFormatters = new Map();
  const timeFormatters = new Map();
  const dateFormatters = new Map();
  const cityByZone = new Map();
  for (const city of cities) if (!cityByZone.has(city.zone)) cityByZone.set(city.zone, city);
  const zoneAliases = { "Asia/Calcutta": "Asia/Kolkata", "Europe/Kiev": "Europe/Kyiv", "America/Godthab": "America/Nuuk", "Asia/Katmandu": "Asia/Kathmandu" };
  const runtimeZone = zoneAliases[Intl.DateTimeFormat().resolvedOptions().timeZone] || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const defaults = {
    favorites: ["Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Tokyo"],
    homeZone: runtimeZone,
    format: "12",
    dark: false,
    events: [],
    alarms: [],
    flights: [],
    savedConversions: [],
    plannerZones: []
  };
  let state = loadState();
  let toastTimer;
  let calendarView = new Date();
  let selectedDate = dateString(new Date());
  let timerInterval = null;
  let timerEnd = 0;
  let stopwatchInterval = null;
  let stopwatchElapsed = 0;
  let stopwatchStartedAt = 0;
  let mapScale = 1;
  let alarmCheckKey = "";

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { ...defaults, ...saved };
    } catch (error) {
      console.error("Could not read saved workspace settings.", error);
      return { ...defaults };
    }
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save workspace settings.", error);
      showToast("Couldn't save changes in this browser.");
    }
  }
  function dateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function parseDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }
  function displayZoneName(zone) {
    const known = cityByZone.get(zone);
    return known ? `${known.city} · ${zone}` : zone.replaceAll("_", " ").replaceAll("/", " / ");
  }
  function getZoneParts(instant, zone) {
    if (!partsFormatters.has(zone)) partsFormatters.set(zone, new Intl.DateTimeFormat("en-US-u-nu-latn", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    }));
    const parts = partsFormatters.get(zone).formatToParts(instant);
    const result = {};
    for (const part of parts) if (part.type !== "literal") result[part.type] = Number(part.value);
    if (result.hour === 24) result.hour = 0;
    return result;
  }
  function offsetAt(instant, zone) {
    const parts = getZoneParts(instant, zone);
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return represented - Math.floor(instant.getTime() / 1000) * 1000;
  }
  function offsetLabel(instant, zone) {
    const minutes = Math.round(offsetAt(instant, zone) / 60000);
    const sign = minutes >= 0 ? "+" : "−";
    const absolute = Math.abs(minutes);
    return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
  }
  function localDateTimeToInstant(date, time, zone) {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const wanted = { year, month, day, hour, minute };
    const pseudoUtc = Date.UTC(year, month - 1, day, hour, minute);
    const offsets = new Set();
    for (let delta = -36; delta <= 36; delta += 6) offsets.add(offsetAt(new Date(pseudoUtc + delta * 3600000), zone));
    const matches = [];
    let nextValid = null;
    let nextWallDelta = Infinity;
    for (const offset of offsets) {
      const candidate = new Date(pseudoUtc - offset);
      const actual = getZoneParts(candidate, zone);
      if (actual.year === wanted.year && actual.month === wanted.month && actual.day === wanted.day && actual.hour === wanted.hour && actual.minute === wanted.minute) matches.push(candidate);
      else {
        const actualWallTime = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
        const wallDelta = actualWallTime - pseudoUtc;
        if (wallDelta > 0 && wallDelta < nextWallDelta) {
          nextWallDelta = wallDelta;
          nextValid = candidate;
        }
      }
    }
    if (matches.length) return { instant: new Date(Math.min(...matches.map((date) => date.getTime()))), ambiguous: matches.length > 1, nonexistent: false };
    if (nextValid) return { instant: nextValid, ambiguous: false, nonexistent: true };
    let candidate = new Date(pseudoUtc);
    for (let attempt = 0; attempt < 4; attempt++) candidate = new Date(pseudoUtc - offsetAt(candidate, zone));
    return { instant: candidate, ambiguous: false, nonexistent: true };
  }
  function formatTime(instant, zone, includeSeconds = false) {
    const key = `${zone}|${state.format}|${includeSeconds}`;
    if (!timeFormatters.has(key)) timeFormatters.set(key, new Intl.DateTimeFormat(undefined, {
      timeZone: zone,
      hour: "numeric",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
      hour12: state.format === "12"
    }));
    return timeFormatters.get(key).format(instant);
  }
  function formatTimeParts(instant, zone) {
    const parts = getZoneParts(instant, zone);
    let hour = parts.hour;
    const suffix = hour >= 12 ? "PM" : "AM";
    if (state.format === "12") hour = hour % 12 || 12;
    return { hour: String(hour).padStart(state.format === "24" ? 2 : 1, "0"), minute: String(parts.minute).padStart(2, "0"), second: String(parts.second).padStart(2, "0"), suffix };
  }
  function formatDate(instant, zone, options = {}) {
    const key = `${zone}|${JSON.stringify(options)}`;
    if (!dateFormatters.has(key)) dateFormatters.set(key, new Intl.DateTimeFormat(undefined, { timeZone: zone, weekday: "long", year: "numeric", month: "long", day: "numeric", ...options }));
    return dateFormatters.get(key).format(instant);
  }
  function localDateAt(instant, zone) {
    const p = getZoneParts(instant, zone);
    return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  }
  function localDateShiftLabel(sourceDate, destinationDate) {
    const [sourceYear, sourceMonth, sourceDay] = sourceDate.split("-").map(Number);
    const [destinationYear, destinationMonth, destinationDay] = destinationDate.split("-").map(Number);
    const difference = Math.round((Date.UTC(destinationYear, destinationMonth - 1, destinationDay) - Date.UTC(sourceYear, sourceMonth - 1, sourceDay)) / 86400000);
    if (!difference) return "";
    if (difference === -1) return "Previous day";
    if (difference === 1) return "Next day";
    const destinationInstant = new Date(Date.UTC(destinationYear, destinationMonth - 1, destinationDay, 12));
    return formatDate(destinationInstant, "UTC", { weekday: "short", month: "short", day: "numeric" });
  }
  function hourAt(instant, zone) {
    return getZoneParts(instant, zone).hour;
  }
  function zoneChoice(zone) {
    return cityByZone.get(zone) || { city: zone.replaceAll("_", " ").split("/").pop(), country: zone.split("/")[0].replaceAll("_", " "), flag: "🌐", zone, lat: 0, lon: 0 };
  }
  function allZones() {
    return [...new Set([...cities.map((city) => city.zone), ...zoneNames])];
  }
  function fillZoneSelect(select, selected, includeAll = true) {
    if (!select) return;
    const choices = includeAll ? allZones() : cities.map((city) => city.zone);
    select.innerHTML = choices.map((zone) => `<option value="${escapeHtml(zone)}">${escapeHtml(displayZoneName(zone))}</option>`).join("");
    if (choices.includes(selected)) select.value = selected;
    else select.value = choices[0] || "UTC";
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function currentHomeCity() {
    return cityByZone.get(state.homeZone) || { city: displayZoneName(state.homeZone).split(" · ")[0], country: "Your time zone", flag: "🌐", zone: state.homeZone };
  }
  function zoneDifference(zone, base = state.homeZone, instant = new Date()) {
    return Math.round((offsetAt(instant, zone) - offsetAt(instant, base)) / 3600000 * 4) / 4;
  }
  function differenceLabel(hours) {
    if (hours === 0) return "Same time";
    const abs = Math.abs(hours);
    const whole = Math.floor(abs);
    const fraction = Math.round((abs - whole) * 60);
    const quantity = `${whole ? `${whole}h` : ""}${fraction ? `${whole ? " " : ""}${fraction}m` : ""}`;
    return `${quantity} ${hours > 0 ? "ahead" : "behind"}`;
  }
  function isDaytime(instant, zone) {
    const hour = hourAt(instant, zone);
    return hour >= 6 && hour < 18;
  }
  function renderCityCard(zone, index, removable = false) {
    const city = zoneChoice(zone);
    const now = new Date();
    const offset = offsetLabel(now, zone);
    const difference = zoneDifference(zone);
    const parts = formatTimeParts(now, zone);
    const localDate = formatDate(now, zone, { weekday: "short", month: "short", day: "numeric" });
    const selected = state.favorites.includes(zone);
    return `<article class="card city-card" data-zone="${escapeHtml(zone)}">
      <div class="city-card-head"><span class="city-flag">${city.flag}</span><div class="city-name-wrap"><div class="city-name">${escapeHtml(city.city)}</div><div class="city-country">${escapeHtml(city.country)}</div></div><i class="day-badge ${isDaytime(now, zone) ? "day" : "night"}"></i></div>
      <div class="city-time">${parts.hour}:${parts.minute}<small>${state.format === "12" ? ` ${parts.suffix}` : ""}</small></div>
      <div class="city-meta"><span>${escapeHtml(localDate)} · ${offset}</span><span class="city-difference">${difference === 0 ? "Home" : escapeHtml(differenceLabel(difference))}</span></div>
      <div class="city-card-actions"><button class="favorite-toggle ${selected ? "selected" : ""}" data-favorite="${escapeHtml(zone)}" aria-label="${selected ? "Remove favorite" : "Add favorite"}">${selected ? "★" : "☆"}</button>${removable ? `<button class="remove-city" data-remove="${escapeHtml(zone)}" aria-label="Remove city">×</button>` : ""}</div>
    </article>`;
  }
  function renderHome() {
    const now = new Date();
    const city = currentHomeCity();
    const parts = formatTimeParts(now, state.homeZone);
    $(".page-heading .eyebrow").innerHTML = `<span class="eyebrow-line"></span>${escapeHtml(new Intl.DateTimeFormat(undefined, { timeZone: state.homeZone, weekday: "long", month: "long", day: "numeric" }).format(now).toUpperCase())}`;
    $("#home-city").textContent = `${city.city}, ${city.country}`;
    $("#home-time").innerHTML = `${parts.hour}:${parts.minute}<span id="home-seconds">:${parts.second}</span><span class="hero-period">${state.format === "12" ? parts.suffix : ""}</span>`;
    $("#home-date").textContent = formatDate(now, state.homeZone);
    $("#home-zone").textContent = state.homeZone;
    $("#home-offset").textContent = offsetLabel(now, state.homeZone);
    $("#focus-date").textContent = new Intl.DateTimeFormat(undefined, { timeZone: state.homeZone, month: "long", day: "numeric" }).format(now).toUpperCase();
    $("#timeline-marker").style.left = `${Math.max(3, Math.min(97, (hourAt(now, state.homeZone) + parts.minute / 60) / 24 * 100))}%`;
    const topZones = state.favorites.slice(0, 4);
    $("#favorite-count").textContent = String(state.favorites.length).padStart(2, "0");
    $("#home-cities").innerHTML = topZones.length ? topZones.map((zone, index) => renderCityCard(zone, index)).join("") : `<article class="card empty-note">Add a city in World clock to see it here.</article>`;
    renderUpcoming();
    updateQuickConversion();
  }
  function renderWorld(filter = "") {
    const query = filter.trim().toLowerCase();
    let zones = [...state.favorites];
    if ($("#city-sort").value === "alpha") zones.sort((a, b) => displayZoneName(a).localeCompare(displayZoneName(b)));
    if ($("#city-sort").value === "time") zones.sort((a, b) => hourAt(new Date(), a) - hourAt(new Date(), b));
    const grid = $("#world-cities");
    if (query) {
      grid.innerHTML = zones.filter((zone) => {
        const c = zoneChoice(zone);
        return `${c.city} ${c.country} ${zone}`.toLowerCase().includes(query);
      }).map((zone, index) => renderCityCard(zone, index, true)).join("");
    } else grid.innerHTML = zones.map((zone, index) => renderCityCard(zone, index, true)).join("");
    if (!grid.innerHTML) grid.innerHTML = `<article class="card empty-note">No saved cities match this search. Try another city or time zone.</article>`;
  }
  function refreshClockCards() {
    const worldPage = $("#page-world").classList.contains("active");
    const homePage = $("#page-home").classList.contains("active");
    if (worldPage) renderWorld($("#city-search").value);
    if (homePage) renderHome();
    updateMap();
    if ($("#page-travel").classList.contains("active")) updateTravel();
  }
  function renderUpcoming() {
    const now = Date.now();
    const reminders = [
      ...state.alarms.filter((alarm) => new Date(alarm.dueAt).getTime() >= now).map((alarm) => ({ title: alarm.label, detail: `${displayZoneName(alarm.zone)} · Alarm`, instant: new Date(alarm.dueAt), zone: alarm.zone, type: "alarm" })),
      ...state.events.filter((event) => new Date(event.instant).getTime() >= now).map((event) => ({ title: event.title, detail: `${displayZoneName(event.zone)} · Event`, instant: new Date(event.instant), zone: event.zone, type: "event" }))
    ].sort((a, b) => a.instant - b.instant).slice(0, 3);
    $("#upcoming-items").innerHTML = reminders.length ? reminders.map((item) => `<div class="upcoming-item"><i class="upcoming-mark ${item.type === "event" ? "orange" : ""}"></i><div class="upcoming-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div><span class="upcoming-time">${escapeHtml(formatTime(item.instant, item.zone))}</span></div>`).join("") : `<div class="empty-note">Nothing on the clock yet. Add an alarm or event to get started.</div>`;
  }
  function setupQuickConverter() {
    fillZoneSelect($("#quick-from"), state.homeZone);
    fillZoneSelect($("#quick-to"), "Europe/London");
    $("#quick-from").addEventListener("change", updateQuickConversion);
    $("#quick-to").addEventListener("change", updateQuickConversion);
    $("#quick-time").addEventListener("input", updateQuickConversion);
    $("#quick-swap").addEventListener("click", () => {
      const from = $("#quick-from"), to = $("#quick-to"), temporary = from.value;
      from.value = to.value; to.value = temporary; updateQuickConversion();
    });
    updateQuickConversion();
  }
  function updateQuickConversion() {
    if (!$("#quick-result")) return;
    const source = $("#quick-from").value || state.homeZone;
    const date = localDateAt(new Date(), source);
    const result = localDateTimeToInstant(date, $("#quick-time").value || "09:00", source);
    const destination = $("#quick-to").value || "Europe/London";
    $("#quick-result").textContent = `${formatTime(result.instant, destination)} · ${zoneChoice(destination).city}`;
    const sourceDate = localDateAt(result.instant, source);
    const destDate = localDateAt(result.instant, destination);
    $("#quick-date-shift").textContent = localDateShiftLabel(sourceDate, destDate);
  }
  function setupConverter() {
    fillZoneSelect($("#convert-from"), state.homeZone);
    fillZoneSelect($("#convert-to"), "Europe/London");
    $("#convert-date").value = dateString(new Date());
    for (const id of ["convert-date", "convert-time", "convert-from", "convert-to"]) $(`#${id}`).addEventListener("input", updateConverter);
    $("#converter-swap").addEventListener("click", () => {
      const from = $("#convert-from"), to = $("#convert-to"), temporary = from.value;
      from.value = to.value; to.value = temporary; updateConverter();
    });
    $("#copy-conversion").addEventListener("click", async () => {
      const text = conversionText();
      await copyText(text);
    });
    $("#save-conversion").addEventListener("click", () => {
      const text = conversionText();
      const record = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), from: $("#convert-from").value, to: $("#convert-to").value, date: $("#convert-date").value, time: $("#convert-time").value, result: text };
      state.savedConversions.unshift(record);
      state.savedConversions = state.savedConversions.slice(0, 12);
      persist(); renderSavedConversions(); showToast("Conversion saved to your shortcuts.");
    });
    updateConverter();
    renderSavedConversions();
  }
  function conversionText() {
    const result = localDateTimeToInstant($("#convert-date").value, $("#convert-time").value, $("#convert-from").value);
    return `${formatTime(result.instant, $("#convert-from").value)} ${zoneChoice($("#convert-from").value).city} → ${formatTime(result.instant, $("#convert-to").value)} ${zoneChoice($("#convert-to").value).city}, ${formatDate(result.instant, $("#convert-to").value)}`;
  }
  function updateConverter() {
    const from = $("#convert-from").value, to = $("#convert-to").value;
    if (!$("#convert-date").value || !$("#convert-time").value || !from || !to) return;
    const result = localDateTimeToInstant($("#convert-date").value, $("#convert-time").value, from);
    $("#converted-time").textContent = formatTime(result.instant, to);
    $("#converted-date").textContent = formatDate(result.instant, to);
    $("#converted-zone").textContent = `${displayZoneName(to)} · ${offsetLabel(result.instant, to)}`;
    const notes = [];
    if (result.ambiguous) notes.push("This local time occurs twice during the daylight-saving transition; showing the earlier occurrence.");
    if (result.nonexistent) notes.push("This local time does not exist because the clocks move forward. Showing the next valid local time.");
    $("#converter-note").textContent = notes.join(" ");
    $("#offset-comparison").innerHTML = `<div class="offset-line"><span>${escapeHtml(zoneChoice(from).city)}</span><strong>${offsetLabel(result.instant, from)}</strong></div><div class="offset-line"><span>${escapeHtml(zoneChoice(to).city)}</span><strong>${offsetLabel(result.instant, to)}</strong></div><div class="offset-line"><span>Difference</span><strong>${escapeHtml(differenceLabel(zoneDifference(to, from, result.instant)))}</strong></div>`;
  }
  function renderSavedConversions() {
    const container = $("#saved-conversions");
    container.innerHTML = state.savedConversions.length ? state.savedConversions.map((item) => `<div class="saved-conversion"><div><strong>${escapeHtml(item.result)}</strong><span>${escapeHtml(item.date)} · ${escapeHtml(item.time)}</span></div><button data-delete-conversion="${escapeHtml(item.id)}" aria-label="Remove saved conversion">×</button></div>`).join("") : `<div class="empty-note">No saved conversions yet. Save one to keep it close.</div>`;
  }
  function searchCityResults(query) {
    const results = $("#search-results");
    const text = query.trim().toLowerCase();
    if (!text) { results.classList.add("hidden"); return; }
    const matches = cities.filter((city) => `${city.city} ${city.country} ${city.zone}`.toLowerCase().includes(text)).slice(0, 7);
    const extraZones = !matches.length ? zoneNames.filter((zone) => zone.toLowerCase().includes(text)).slice(0, 5).map(zoneChoice) : [];
    const available = matches.length ? matches : extraZones;
    results.innerHTML = available.length ? available.map((city) => `<button class="search-result" data-add-zone="${escapeHtml(city.zone)}"><span>${city.flag}</span><strong>${escapeHtml(city.city)}</strong><small>${escapeHtml(city.country)} · ${escapeHtml(city.zone)}</small></button>`).join("") : `<div class="search-result"><small>No cities or zones found.</small></div>`;
    results.classList.remove("hidden");
  }
  function addZone(zone) {
    if (!zoneNames.includes(zone) && !cities.some((city) => city.zone === zone)) return;
    if (!state.favorites.includes(zone)) state.favorites.push(zone);
    persist(); renderWorld($("#city-search").value); renderHome(); showToast(`${zoneChoice(zone).city} added to your world clock.`);
  }
  function setupWorldClock() {
    $("#city-search").addEventListener("input", (event) => searchCityResults(event.target.value));
    $("#city-sort").addEventListener("change", () => renderWorld($("#city-search").value));
    $("#add-city-button").addEventListener("click", () => { navigate("world"); $("#city-search").focus(); });
    $("#grid-view").addEventListener("click", () => { $("#world-cities").classList.remove("list-view"); $("#grid-view").classList.add("active"); $("#list-view").classList.remove("active"); });
    $("#list-view").addEventListener("click", () => { $("#world-cities").classList.add("list-view"); $("#list-view").classList.add("active"); $("#grid-view").classList.remove("active"); });
  }
  function plannerZones() {
    const zones = [...new Set(state.plannerZones.length ? state.plannerZones : [state.homeZone, "Europe/London", "America/New_York", "Asia/Tokyo"])];
    return zones.slice(0, 6);
  }
  function setupPlanner() {
    $("#planner-date").value = dateString(new Date());
    $("#planner-date").addEventListener("change", renderPlanner);
    $("#add-participant").addEventListener("click", () => showDialog("participant"));
    $("#copy-planner").addEventListener("click", async () => {
      const selected = $("#meeting-suggestions .suggestion-card");
      const best = selected[0];
      await copyText(best ? best.dataset.share : "Open Super Time Zone to plan a meeting.");
    });
    renderPlanner();
  }
  function renderPlanner() {
    if (!$("#planner-grid")) return;
    const zones = plannerZones();
    $("#participant-chips").innerHTML = zones.map((zone) => `<span class="participant-chip">${zoneChoice(zone).flag} ${escapeHtml(zoneChoice(zone).city)}<button data-remove-participant="${escapeHtml(zone)}" aria-label="Remove ${escapeHtml(zoneChoice(zone).city)}">×</button></span>`).join("");
    const date = $("#planner-date").value || dateString(new Date());
    const start = localDateTimeToInstant(date, "00:00", "UTC").instant;
    const axis = Array.from({ length: 24 }, (_, hour) => `<span class="axis-cell">${hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`}</span>`).join("");
    $("#planner-grid").innerHTML = `<div class="planner-axis"><span></span>${axis}</div>` + zones.map((zone) => {
      const city = zoneChoice(zone);
      const cells = Array.from({ length: 24 }, (_, utcHour) => {
        const instant = new Date(start.getTime() + utcHour * 3600000);
        const localHour = hourAt(instant, zone);
        const work = localHour >= 9 && localHour < 17;
        const now = localDateAt(new Date(), "UTC") === date && new Date().getUTCHours() === utcHour;
        return `<span class="hour-cell ${work ? "work" : ""} ${now ? "now" : ""}" title="${escapeHtml(formatTime(instant, zone))} ${escapeHtml(city.city)}"></span>`;
      }).join("");
      return `<div class="planner-row"><span class="planner-city"><span>${city.flag}</span>${escapeHtml(city.city)}</span>${cells}</div>`;
    }).join("");
    renderSuggestions(zones, date);
  }
  function renderSuggestions(zones, startDate) {
    const suggestions = [];
    const start = localDateTimeToInstant(startDate, "00:00", "UTC").instant;
    for (let day = 0; day < 7; day++) {
      for (let minute = 0; minute < 1440; minute += 30) {
        const instant = new Date(start.getTime() + (day * 1440 + minute) * 60000);
        if (instant < new Date()) continue;
        const hours = zones.map((zone) => {
          const parts = getZoneParts(instant, zone);
          return parts.hour + parts.minute / 60;
        });
        const workCount = hours.filter((hour) => hour >= 9 && hour < 17).length;
        const humaneCount = hours.filter((hour) => hour >= 7 && hour < 21).length;
        if (!humaneCount) continue;
        const comfort = hours.reduce((score, hour) => score + Math.max(0, 1 - Math.abs(hour - 13) / 10), 0);
        suggestions.push({ instant, hours, workCount, humaneCount, score: workCount * 100 + humaneCount * 10 + comfort });
      }
    }
    suggestions.sort((a, b) => b.score - a.score || a.instant - b.instant);
    const unique = [];
    for (const suggestion of suggestions) {
      if (unique.every((item) => Math.abs(item.instant - suggestion.instant) > 3600000)) unique.push(suggestion);
      if (unique.length === 3) break;
    }
    $("#suggestion-count").textContent = String(unique.length);
    $("#meeting-suggestions").innerHTML = unique.length ? unique.map((item) => {
      const date = formatDate(item.instant, "UTC", { weekday: "short", month: "short", day: "numeric" });
      const time = formatTime(item.instant, "UTC");
      const summary = zones.map((zone) => `${zoneChoice(zone).city}: ${formatTime(item.instant, zone)}`).join(" · ");
      const fitText = item.workCount === zones.length ? "All in working hours" : `${item.workCount}/${zones.length} in working hours`;
      return `<article class="card suggestion-card" data-share="${escapeHtml(`Meeting suggestion — ${date}, ${time} UTC. ${summary}`)}"><span class="suggestion-date">${escapeHtml(date)} · UTC</span><strong>${escapeHtml(time)}</strong><p><span class="good-fit">✦ ${fitText}</span></p><p>${zones.map((zone) => `${zoneChoice(zone).flag} ${escapeHtml(formatTime(item.instant, zone))}`).join("　")}</p></article>`;
    }).join("") : `<div class="card empty-note">No comfortable shared window found for this week. Try different cities or dates.</div>`;
  }
  function setupMap() {
    $("#map-zoom-in").addEventListener("click", () => { mapScale = Math.min(1.7, mapScale + .15); $("#map-canvas svg").style.transform = `scale(${mapScale})`; });
    $("#map-zoom-out").addEventListener("click", () => { mapScale = Math.max(1, mapScale - .15); $("#map-canvas svg").style.transform = `scale(${mapScale})`; });
    renderMapCities();
    updateMap();
  }
  function renderMapCities() {
    const mapZones = ["America/Los_Angeles", "America/New_York", "America/Sao_Paulo", "Europe/London", "Africa/Johannesburg", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
    const markerGroup = $("#map-markers");
    markerGroup.innerHTML = mapZones.map((zone) => {
      const city = cityByZone.get(zone);
      const x = (city.lon + 180) / 360 * 1000;
      const y = (90 - city.lat) / 180 * 500;
      return `<g class="map-marker" tabindex="0" role="button" aria-label="Show time in ${escapeHtml(city.city)}" data-map-zone="${escapeHtml(zone)}"><circle class="marker-pulse" cx="${x}" cy="${y}" r="11"/><circle cx="${x}" cy="${y}" r="4"/><text x="${x + 8}" y="${y - 7}">${escapeHtml(city.city)}</text></g>`;
    }).join("");
    $("#map-city-strip").innerHTML = mapZones.map((zone) => {
      const city = cityByZone.get(zone);
      return `<button class="map-city-button" data-map-zone="${escapeHtml(zone)}"><strong>${city.flag} ${escapeHtml(city.city)}</strong><span>${formatTime(new Date(), zone)}</span></button>`;
    }).join("");
  }
  function updateMap() {
    if (!$("#map-markers")) return;
    const now = new Date();
    $$("#map-city-strip [data-map-zone]").forEach((button) => {
      const zone = button.dataset.mapZone;
      $("span", button).textContent = formatTime(now, zone);
    });
    const group = $("#map-zones");
    if (group && !group.dataset.ready) {
      group.innerHTML = Array.from({ length: 24 }, (_, index) => `<rect class="map-zone-band" x="${index * 1000 / 24}" y="0" width="${1000 / 24}" height="500"/>`).join("");
      group.dataset.ready = "true";
    }
    group?.querySelectorAll(".map-zone-band").forEach((band, index) => {
      const longitude = ((index + .5) * 15) - 180;
      const localHour = (now.getUTCHours() + Math.round(longitude / 15) + 24) % 24;
      const night = localHour < 6 || localHour >= 18;
      band.classList.toggle("night", night);
      band.classList.toggle("day", !night);
    });
  }
  function showMapDetail(zone) {
    const city = zoneChoice(zone);
    const detail = $("#map-detail");
    detail.innerHTML = `<strong>${city.flag} ${escapeHtml(city.city)}, ${escapeHtml(city.country)}</strong><span>${escapeHtml(zone)} · ${offsetLabel(new Date(), zone)}</span><b>${escapeHtml(formatTime(new Date(), zone))}</b>`;
    detail.classList.remove("hidden");
  }
  function setupTravel() {
    fillZoneSelect($("#travel-home"), state.homeZone);
    fillZoneSelect($("#travel-destination"), "Europe/London");
    $("#travel-home").addEventListener("change", updateTravel);
    $("#travel-destination").addEventListener("change", updateTravel);
    $("#add-flight").addEventListener("click", () => showDialog("flight"));
    updateTravel();
  }
  function updateTravel() {
    const home = $("#travel-home").value || state.homeZone;
    const dest = $("#travel-destination").value || "Europe/London";
    const now = new Date();
    $("#travel-home-time").textContent = formatTime(now, home);
    $("#travel-home-date").textContent = `${formatDate(now, home)} · ${offsetLabel(now, home)}`;
    $("#travel-destination-time").textContent = formatTime(now, dest);
    $("#travel-destination-date").textContent = `${formatDate(now, dest)} · ${offsetLabel(now, dest)}`;
    $("#travel-difference").textContent = differenceLabel(zoneDifference(dest, home));
    const hours = Math.abs(zoneDifference(dest, home));
    $("#jetlag-advice").textContent = hours < 3 ? "Your clocks are close. Keep your usual routine and enjoy the destination." : `Your clocks differ by about ${Math.floor(hours)} hours. Ease into local bedtime and get some daylight after arrival.`;
    $("#jetlag-marker").style.left = `${Math.min(88, 12 + hours * 7)}%`;
    renderFlights();
  }
  function renderFlights() {
    $("#itinerary-list").innerHTML = state.flights.length ? state.flights.map((flight) => `<div class="flight-item"><div><strong>${escapeHtml(flight.fromCity)} · ${escapeHtml(formatTime(new Date(flight.departure), flight.fromZone))}</strong><small>${escapeHtml(formatDate(new Date(flight.departure), flight.fromZone, { month: "short", day: "numeric" }))} · ${escapeHtml(displayZoneName(flight.fromZone))}</small></div><span class="flight-arrow">→</span><div><strong>${escapeHtml(flight.toCity)} · ${escapeHtml(formatTime(new Date(flight.arrival), flight.toZone))}</strong><small>${escapeHtml(formatDate(new Date(flight.arrival), flight.toZone, { month: "short", day: "numeric" }))} · ${escapeHtml(displayZoneName(flight.toZone))}</small></div><button class="flight-remove" data-delete-flight="${escapeHtml(flight.id)}" aria-label="Remove flight">×</button></div>`).join("") : `<div class="empty-note">Your flights will appear here. Departure and arrival times stay in their local time zones.</div>`;
  }
  function setupAlarms() {
    $("#add-alarm").addEventListener("click", () => showDialog("alarm"));
    $("#add-alarm-shortcut").addEventListener("click", () => { navigate("alarms"); showDialog("alarm"); });
    renderAlarms();
  }
  function renderAlarms() {
    const alarms = [...state.alarms].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    $("#alarm-list").innerHTML = alarms.length ? alarms.map((alarm) => {
      const due = new Date(alarm.dueAt);
      return `<article class="card alarm-card"><span class="alarm-clock-icon">◷</span><div class="alarm-copy"><strong>${escapeHtml(alarm.label)}</strong><span>${escapeHtml(formatDate(due, alarm.zone, { weekday: "short", month: "short", day: "numeric" }))} · ${escapeHtml(displayZoneName(alarm.zone))} · ${escapeHtml(alarm.repeat === "none" ? "Once" : `Repeats ${alarm.repeat}`)}</span></div><span class="alarm-time">${escapeHtml(formatTime(due, alarm.zone))}</span><button class="alarm-delete" data-delete-alarm="${escapeHtml(alarm.id)}" aria-label="Delete alarm">×</button></article>`;
    }).join("") : `<div class="card empty-note">No alarms set. Create a reminder for your next international call.</div>`;
  }
  function advanceRecurringAlarm(alarm) {
    if (alarm.repeat === "none") return null;
    const current = new Date(alarm.dueAt);
    const parts = getZoneParts(current, alarm.zone);
    const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + (alarm.repeat === "weekly" ? 7 : 1)));
    const date = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
    return localDateTimeToInstant(date, `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`, alarm.zone).instant.toISOString();
  }
  function checkAlarms() {
    const now = Date.now();
    let changed = false;
    for (const alarm of state.alarms) {
      const due = new Date(alarm.dueAt).getTime();
      if (due > now || alarm.lastFiredAt === alarm.dueAt) continue;
      if (now - due >= 60000) {
        if (alarm.repeat === "none") alarm.completed = true;
        else {
          let previousDue = due;
          let nextDue = advanceRecurringAlarm(alarm);
          let attempts = 0;
          while (nextDue && new Date(nextDue).getTime() <= now && attempts++ < 370) {
            alarm.dueAt = nextDue;
            previousDue = new Date(nextDue).getTime();
            nextDue = advanceRecurringAlarm(alarm);
          }
          if (nextDue) { alarm.lastFiredAt = new Date(previousDue).toISOString(); alarm.dueAt = nextDue; }
          else alarm.completed = true;
        }
        changed = true;
        continue;
      }
      if (due <= now) {
        alarm.lastFiredAt = alarm.dueAt;
        const next = advanceRecurringAlarm(alarm);
        if (next) alarm.dueAt = next;
        else alarm.completed = true;
        changed = true;
        showToast(`Alarm: ${alarm.label}`);
        if ("Notification" in window && Notification.permission === "granted") new Notification(alarm.label, { body: `It's ${formatTime(new Date(), alarm.zone)} in ${zoneChoice(alarm.zone).city}.` });
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audio = new AudioContextClass();
            const oscillator = audio.createOscillator(), gain = audio.createGain();
            oscillator.connect(gain); gain.connect(audio.destination);
            oscillator.frequency.value = 660; gain.gain.value = .12;
            oscillator.start(); oscillator.stop(audio.currentTime + .22);
          }
        } catch (error) { console.warn("Alarm sound was unavailable.", error); }
      }
    }
    if (changed) {
      state.alarms = state.alarms.filter((alarm) => !alarm.completed);
      persist(); renderAlarms(); renderUpcoming();
    }
  }
  function setupCalendar() {
    $("#add-event").addEventListener("click", () => showDialog("event"));
    $("#calendar-prev").addEventListener("click", () => { calendarView = new Date(calendarView.getFullYear(), calendarView.getMonth() - 1, 1); renderCalendar(); });
    $("#calendar-next").addEventListener("click", () => { calendarView = new Date(calendarView.getFullYear(), calendarView.getMonth() + 1, 1); renderCalendar(); });
    $("#calendar-today").addEventListener("click", () => { calendarView = new Date(); selectedDate = dateString(new Date()); renderCalendar(); });
    renderCalendar();
  }
  function renderCalendar() {
    const year = calendarView.getFullYear(), month = calendarView.getMonth();
    $("#calendar-month").textContent = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(calendarView);
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
    $("#calendar-grid").innerHTML = weekdays.map((day) => `<span class="calendar-weekday">${day}</span>`).join("") + days.map((date) => {
      const key = dateString(date);
      const hasEvent = state.events.some((event) => localDateAt(new Date(event.instant), event.zone) === key);
      return `<button class="calendar-day ${date.getMonth() !== month ? "outside" : ""} ${key === dateString(new Date()) ? "today" : ""} ${key === selectedDate ? "selected" : ""} ${hasEvent ? "has-event" : ""}" data-calendar-date="${key}">${date.getDate()}</button>`;
    }).join("");
    renderEventList();
  }
  function renderEventList() {
    const selected = parseDate(selectedDate);
    $("#selected-date-label").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(selected).toUpperCase();
    $("#selected-day-heading").textContent = selectedDate === dateString(new Date()) ? "Today" : formatDate(selected, state.homeZone, { weekday: "long" });
    const events = state.events.filter((event) => localDateAt(new Date(event.instant), event.zone) === selectedDate).sort((a, b) => new Date(a.instant) - new Date(b.instant));
    $("#event-list").innerHTML = events.length ? events.map((event) => `<div class="event-item"><time>${escapeHtml(formatTime(new Date(event.instant), event.zone))}</time><i class="event-stripe"></i><div class="event-copy"><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(displayZoneName(event.zone))}</small></div><button class="event-delete" data-delete-event="${escapeHtml(event.id)}" aria-label="Delete event">×</button></div>`).join("") : `<div class="empty-note">A little space to breathe. Add an event when you’re ready.</div>`;
  }
  function setupTools() {
    $("#diff-start").value = dateString(new Date());
    $("#diff-end").value = dateString(new Date(Date.now() + 86400000));
    $("#week-date").value = dateString(new Date());
    fillZoneSelect($("#date-zone-one"), state.homeZone);
    fillZoneSelect($("#date-zone-two"), "Asia/Tokyo");
    fillZoneSelect($("#sun-city"), state.homeZone);
    $("#unix-result").textContent = Math.floor(Date.now() / 1000);
    $("#copy-unix").addEventListener("click", () => copyText($("#unix-result").textContent));
    $("#convert-timestamp").addEventListener("click", convertTimestamp);
    for (const id of ["diff-start", "diff-end"]) $(`#${id}`).addEventListener("change", updateDateDifference);
    $("#week-date").addEventListener("change", updateWeek);
    for (const id of ["date-zone-one", "date-zone-two"]) $(`#${id}`).addEventListener("change", updateWorldDate);
    $("#sun-city").addEventListener("change", updateSunTimes);
    $("#timer-start").addEventListener("click", startTimer);
    $("#timer-reset").addEventListener("click", resetTimer);
    $("#duration-start").addEventListener("input", updateDuration);
    $("#duration-end").addEventListener("input", updateDuration);
    $("#stopwatch-toggle").addEventListener("click", toggleStopwatch);
    $("#stopwatch-lap").addEventListener("click", addStopwatchLap);
    $("#stopwatch-reset").addEventListener("click", resetStopwatch);
    $("#assistant-form").addEventListener("submit", (event) => {
      event.preventDefault();
      answerAssistant($("#assistant-query").value);
    });
    $$(".assistant-prompts button").forEach((button) => button.addEventListener("click", () => {
      $("#assistant-query").value = button.dataset.prompt;
      answerAssistant(button.dataset.prompt);
    }));
    updateDateDifference(); updateWeek(); updateWorldDate(); updateSunTimes(); updateMoon();
  }
  function convertTimestamp() {
    const raw = Number($("#timestamp-input").value);
    if (!Number.isFinite(raw)) { $("#timestamp-result").textContent = "Enter a valid timestamp"; return; }
    const instant = new Date(raw * ($("#timestamp-unit").value === "seconds" ? 1000 : 1));
    if (Number.isNaN(instant.getTime())) { $("#timestamp-result").textContent = "That timestamp is outside the supported date range"; return; }
    $("#timestamp-result").textContent = `${formatDate(instant, "UTC")} · ${formatTime(instant, "UTC")} UTC`;
  }
  function updateDuration() {
    const startValue = $("#duration-start").value, endValue = $("#duration-end").value;
    if (!startValue || !endValue) { $("#duration-result").textContent = "Choose start and end"; return; }
    const start = new Date(startValue), end = new Date(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) { $("#duration-result").textContent = "Choose valid dates and times"; return; }
    let minutes = Math.round((end - start) / 60000);
    const direction = minutes < 0 ? " earlier" : " apart";
    minutes = Math.abs(minutes);
    const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), remaining = minutes % 60;
    $("#duration-result").textContent = `${days ? `${days}d ` : ""}${hours}h ${remaining}m${direction}`;
  }
  function toggleStopwatch() {
    if (stopwatchInterval) {
      stopwatchElapsed += Date.now() - stopwatchStartedAt;
      clearInterval(stopwatchInterval); stopwatchInterval = null;
      $("#stopwatch-toggle").textContent = "Resume";
      renderStopwatch();
      return;
    }
    stopwatchStartedAt = Date.now();
    stopwatchInterval = setInterval(renderStopwatch, 30);
    $("#stopwatch-toggle").textContent = "Pause";
  }
  function stopwatchTime() {
    return stopwatchElapsed + (stopwatchInterval ? Date.now() - stopwatchStartedAt : 0);
  }
  function formattedStopwatch(milliseconds) {
    const centiseconds = Math.floor(milliseconds / 10) % 100;
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${String(hours * 60 + minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }
  function renderStopwatch() { $("#stopwatch-display").textContent = formattedStopwatch(stopwatchTime()); }
  function addStopwatchLap() {
    if (!stopwatchInterval) { showToast("Start the stopwatch before recording a lap."); return; }
    const laps = $("#stopwatch-laps");
    const row = document.createElement("div");
    row.className = "stopwatch-lap-row";
    row.innerHTML = `<span>Lap ${laps.children.length + 1}</span><strong>${formattedStopwatch(stopwatchTime())}</strong>`;
    laps.prepend(row);
  }
  function resetStopwatch() {
    clearInterval(stopwatchInterval); stopwatchInterval = null;
    stopwatchElapsed = 0; stopwatchStartedAt = 0;
    $("#stopwatch-toggle").textContent = "Start"; $("#stopwatch-laps").replaceChildren(); renderStopwatch();
  }
  function updateMoon() {
    const synodicMonth = 29.530588853;
    const referenceNewMoon = Date.UTC(2000, 0, 6, 18, 14);
    const age = ((Date.now() - referenceNewMoon) / 86400000 % synodicMonth + synodicMonth) % synodicMonth;
    const phase = age / synodicMonth;
    const phases = [["New moon", "🌑"], ["Waxing crescent", "🌒"], ["First quarter", "🌓"], ["Waxing gibbous", "🌔"], ["Full moon", "🌕"], ["Waning gibbous", "🌖"], ["Last quarter", "🌗"], ["Waning crescent", "🌘"]];
    const name = phases[Math.round(phase * 8) % 8];
    const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) * 50);
    $("#moon-result").textContent = `${name[1]} ${name[0]} · ${illumination}% lit`;
    $("#moon-illumination").style.width = `${illumination}%`;
  }
  function zonesMentioned(text) {
    const query = text.toLowerCase();
    const matched = cities
      .filter((city) => query.includes(city.city.toLowerCase()) || query.includes(city.country.toLowerCase()))
      .sort((a, b) => b.city.length - a.city.length)
      .map((city) => city.zone);
    if (query.includes("india") || query.includes("ist")) matched.push("Asia/Kolkata");
    if (query.includes("uk") || query.includes("britain")) matched.push("Europe/London");
    for (const zone of zoneNames) {
      const readable = zone.replaceAll("_", " ").replaceAll("/", " ").toLowerCase();
      if (query.includes(zone.toLowerCase()) || query.includes(readable)) matched.push(zone);
    }
    return [...new Set(matched)];
  }
  function meetingSuggestion(zones) {
    const now = new Date();
    const candidates = [];
    for (let minute = 0; minute < 7 * 1440; minute += 30) {
      const instant = new Date(now.getTime() + minute * 60000);
      const hours = zones.map((zone) => {
        const parts = getZoneParts(instant, zone);
        return parts.hour + parts.minute / 60;
      });
      const working = hours.filter((hour) => hour >= 9 && hour < 17).length;
      const comfortable = hours.filter((hour) => hour >= 7 && hour < 21).length;
      if (!comfortable) continue;
      const score = working * 100 + comfortable * 10 + hours.reduce((sum, hour) => sum + Math.max(0, 1 - Math.abs(hour - 13) / 10), 0);
      candidates.push({ instant, hours, working, comfortable, score });
    }
    candidates.sort((a, b) => b.score - a.score || a.instant - b.instant);
    return candidates[0];
  }
  function answerAssistant(rawQuestion) {
    const question = rawQuestion.trim();
    const answer = $("#assistant-answer");
    if (!question) { answer.textContent = "Ask about a city, time difference, or meeting window."; answer.classList.add("visible"); return; }
    const normalized = question.toLowerCase();
    const zones = zonesMentioned(question);
    const now = new Date();
    let response;
    if (/(meeting|meet|best time|overlap|schedule)/.test(normalized)) {
      const people = zones.length ? zones.slice(0, 6) : [state.homeZone, "Europe/London", "America/New_York"];
      const best = meetingSuggestion(people);
      if (!best) response = "I couldn't find a comfortable shared meeting window in the next seven days. Try a wider set of working hours or fewer cities.";
      else {
        const cityTimes = people.map((zone) => `${zoneChoice(zone).city}: ${formatTime(best.instant, zone)}`).join(" · ");
        const fit = best.working === people.length ? "Everyone is within typical 9 AM–5 PM working hours." : `${best.working} of ${people.length} cities are in typical working hours; the remaining times are the least inconvenient overlap I could find.`;
        response = `Best option: ${formatDate(best.instant, state.homeZone, { weekday: "long", month: "long", day: "numeric" })} at ${formatTime(best.instant, state.homeZone)} in your home time zone. ${cityTimes}. ${fit}`;
      }
    } else if (/(difference|ahead|behind|between|time zone difference)/.test(normalized) && zones.length >= 2) {
      const first = zones[0], second = zones[1];
      response = `${zoneChoice(second).city} is ${differenceLabel(zoneDifference(second, first, now))} ${zoneChoice(first).city} right now. ${zoneChoice(first).city}: ${formatTime(now, first)} (${offsetLabel(now, first)}); ${zoneChoice(second).city}: ${formatTime(now, second)} (${offsetLabel(now, second)}).`;
    } else if (/(convert|into|different zones|time zones)/.test(normalized) && /(am|pm|ist|gmt|utc)/.test(normalized)) {
      const match = normalized.match(/(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)/);
      if (!match) response = "Include a time like “5 PM IST” and I can convert it for you.";
      else {
        let hour = Number(match[1]) % 12;
        if (match[3] === "pm") hour += 12;
        const source = normalized.includes("ist") || normalized.includes("india") ? "Asia/Kolkata" : zones[0] || state.homeZone;
        const instant = localDateTimeToInstant(localDateAt(now, source), `${String(hour).padStart(2, "0")}:${match[2] || "00"}`, source).instant;
        const destinations = ["Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Europe/Paris", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "UTC", "Africa/Johannesburg"];
        response = `Interpreting IST as India Standard Time: ${formatTime(instant, source)} in ${zoneChoice(source).city} is ${destinations.map((zone) => `${zoneChoice(zone).city} ${formatTime(instant, zone)}`).join(" · ")}.`;
      }
    } else if (/(call|reach|phone)/.test(normalized) && zones.length) {
      const target = zones[0];
      const targetDate = localDateAt(now, target);
      let candidate = localDateTimeToInstant(targetDate, "10:00", target).instant;
      if (candidate < now) {
        const nextDay = new Date(Date.UTC(...targetDate.split("-").map(Number).map((value, index) => index === 1 ? value - 1 : value)));
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        const tomorrow = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDay.getUTCDate()).padStart(2, "0")}`;
        candidate = localDateTimeToInstant(tomorrow, "10:00", target).instant;
      }
      response = `A considerate time to call ${zoneChoice(target).city} is around 10:00 AM their local time (${formatTime(candidate, state.homeZone)} for you), on ${formatDate(candidate, target, { weekday: "long", month: "long", day: "numeric" })}.`;
    } else if (zones.length) {
      const zone = zones[0];
      response = `It's ${formatTime(now, zone)} on ${formatDate(now, zone)} in ${zoneChoice(zone).city}, ${zoneChoice(zone).country}. Their offset is ${offsetLabel(now, zone)}.`;
    } else {
      response = "I can help with questions like “What time is it in Tokyo?”, “What's the time difference between India and London?”, or “Find the best meeting time for New York and Singapore.”";
    }
    answer.textContent = response;
    answer.classList.add("visible");
  }
  function updateDateDifference() {
    const start = parseDate($("#diff-start").value), end = parseDate($("#diff-end").value);
    const days = Math.round((end - start) / 86400000);
    $("#diff-result").textContent = `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}${days < 0 ? " earlier" : " apart"}`;
  }
  function updateWeek() {
    const date = parseDate($("#week-date").value);
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day + 3);
    const firstThursday = new Date(date.getFullYear(), 0, 4);
    const firstDay = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
    const week = 1 + Math.round((date - firstThursday) / 604800000);
    $("#week-result").textContent = `Week ${String(week).padStart(2, "0")}`;
  }
  function updateWorldDate() {
    const now = new Date(), one = $("#date-zone-one").value, two = $("#date-zone-two").value;
    $("#world-date-result").textContent = `${formatDate(now, one, { weekday: "long", month: "short", day: "numeric" })} · ${formatDate(now, two, { weekday: "long", month: "short", day: "numeric" })}`;
  }
  function solarTimes(city, date = new Date()) {
    const dayNumber = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
    const calculate = (sunrise) => {
      const longitudeHour = city.lon / 15;
      const approximate = dayNumber + ((sunrise ? 6 : 18) - longitudeHour) / 24;
      const meanAnomaly = .9856 * approximate - 3.289;
      let trueLongitude = meanAnomaly + 1.916 * Math.sin(meanAnomaly * Math.PI / 180) + .020 * Math.sin(2 * meanAnomaly * Math.PI / 180) + 282.634;
      trueLongitude = (trueLongitude + 360) % 360;
      let rightAscension = Math.atan(.91764 * Math.tan(trueLongitude * Math.PI / 180)) * 180 / Math.PI;
      rightAscension = (rightAscension + 360) % 360;
      rightAscension += Math.floor(trueLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90;
      rightAscension /= 15;
      const sinDeclination = .39782 * Math.sin(trueLongitude * Math.PI / 180);
      const cosDeclination = Math.cos(Math.asin(sinDeclination));
      const cosineHour = (Math.cos(90.833 * Math.PI / 180) - sinDeclination * Math.sin(city.lat * Math.PI / 180)) / (cosDeclination * Math.cos(city.lat * Math.PI / 180));
      if (cosineHour > 1 || cosineHour < -1) return null;
      const hour = sunrise ? 360 - Math.acos(cosineHour) * 180 / Math.PI : Math.acos(cosineHour) * 180 / Math.PI;
      const localMean = hour / 15 + rightAscension - .06571 * approximate - 6.622;
      return ((localMean + longitudeHour) % 24 + 24) % 24;
    };
    const format = (hours) => {
      if (hours === null) return "Not available";
      const instant = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, Math.round(hours * 60)));
      return formatTime(instant, city.zone);
    };
    return { sunrise: format(calculate(true)), sunset: format(calculate(false)) };
  }
  function updateSunTimes() {
    const city = zoneChoice($("#sun-city").value);
    if (typeof city.lat !== "number" || (city.lat === 0 && city.lon === 0)) {
      $("#sun-result").textContent = "City coordinates unavailable";
      return;
    }
    const localParts = getZoneParts(new Date(), city.zone);
    const localDate = new Date(Date.UTC(localParts.year, localParts.month - 1, localParts.day, 12));
    const times = solarTimes(city, localDate);
    $("#sun-result").textContent = `↑ ${times.sunrise}　↓ ${times.sunset}`;
  }
  function startTimer() {
    if (timerInterval) return;
    const minutes = Math.min(1440, Math.max(1, Number($("#timer-minutes").value) || 1));
    timerEnd = Date.now() + minutes * 60000;
    $("#timer-start").textContent = "Pause";
    timerInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      $("#timer-display").textContent = `${String(Math.floor(remaining / 3600)).padStart(2, "0")}:${String(Math.floor(remaining % 3600 / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
      if (!remaining) { resetTimer(); showToast("Your countdown is complete."); }
    }, 250);
  }
  function resetTimer() {
    clearInterval(timerInterval); timerInterval = null; timerEnd = 0;
    $("#timer-display").textContent = "00:00:00"; $("#timer-start").textContent = "Start";
  }
  function setupSettings() {
    $("#setting-format").value = state.format;
    $("#setting-theme").addEventListener("click", toggleTheme);
    $("#theme-toggle").addEventListener("click", toggleTheme);
    $("#setting-format").addEventListener("change", (event) => { state.format = event.target.value; persist(); refreshAll(); });
    fillZoneSelect($("#setting-home"), state.homeZone);
    $("#setting-home").addEventListener("change", (event) => { state.homeZone = event.target.value; persist(); fillZoneSelect($("#quick-from"), state.homeZone); fillZoneSelect($("#convert-from"), state.homeZone); fillZoneSelect($("#travel-home"), state.homeZone); fillZoneSelect($("#date-zone-one"), state.homeZone); refreshAll(); });
    $("#help-button").addEventListener("click", () => showToast("Tip: search any city or IANA time zone in World clock."));
    applyTheme();
  }
  function toggleTheme() { state.dark = !state.dark; persist(); applyTheme(); }
  function applyTheme() {
    document.body.classList.toggle("dark", Boolean(state.dark));
    $("#theme-toggle").textContent = state.dark ? "☾" : "☼";
    $("#setting-theme").textContent = state.dark ? "Use light theme" : "Use dark theme";
  }
  function refreshAll() {
    renderHome(); renderWorld($("#city-search").value); updateConverter(); renderPlanner(); updateTravel(); renderCalendar(); renderAlarms(); renderMapCities(); updateMap(); updateDateDifference(); updateWeek(); updateWorldDate(); updateSunTimes();
  }
  function navigate(page) {
    $$(".page").forEach((section) => section.classList.toggle("active", section.id === `page-${page}`));
    $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
    $$(".mobile-nav button").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
    const active = $(`.nav-item[data-page="${page}"]`);
    $("#breadcrumb-current").textContent = active ? active.textContent.trim() : "Overview";
    $("#sidebar").classList.remove("open");
    if (page === "world") renderWorld($("#city-search").value);
    if (page === "planner") renderPlanner();
    if (page === "map") updateMap();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard.")).catch((error) => { console.error("Clipboard copy failed.", error); showToast("Couldn't copy. Select and copy the text instead."); });
    const temporary = document.createElement("textarea");
    temporary.value = text; temporary.style.position = "fixed"; temporary.style.opacity = "0";
    document.body.append(temporary); temporary.select();
    const success = document.execCommand("copy"); temporary.remove();
    showToast(success ? "Copied to clipboard." : "Couldn't copy. Select and copy the text instead.");
    return Promise.resolve();
  }
  function showDialog(type) {
    const dialog = $("#entry-dialog"), fields = $("#dialog-fields");
    const dialogConfigs = {
      event: { eyebrow: "ADD TO YOUR CALENDAR", title: "Create an event", fields: [
        { name: "title", label: "EVENT NAME", type: "text", required: true, placeholder: "e.g. Team catch-up" },
        { name: "date", label: "LOCAL DATE", type: "date", required: true, value: dateString(new Date()) },
        { name: "time", label: "LOCAL TIME", type: "time", required: true, value: "10:00" },
        { name: "zone", label: "TIME ZONE", type: "select", value: state.homeZone }
      ] },
      alarm: { eyebrow: "SET A LOCAL REMINDER", title: "Create an alarm", fields: [
        { name: "label", label: "LABEL", type: "text", required: true, placeholder: "e.g. Call the Singapore team" },
        { name: "date", label: "LOCAL DATE", type: "date", required: true, value: dateString(new Date()) },
        { name: "time", label: "LOCAL TIME", type: "time", required: true, value: "09:00" },
        { name: "zone", label: "TIME ZONE", type: "select", value: state.homeZone },
        { name: "repeat", label: "REPEAT", type: "select", options: [["none", "Once"], ["daily", "Daily"], ["weekly", "Weekly"]], value: "none" }
      ] },
      participant: { eyebrow: "PLAN TOGETHER", title: "Add a participant city", fields: [
        { name: "zone", label: "CITY OR TIME ZONE", type: "select", value: "Asia/Singapore" }
      ] },
      flight: { eyebrow: "ADD TO YOUR JOURNEY", title: "Add a flight", fields: [
        { name: "label", label: "FLIGHT OR NOTE", type: "text", required: true, placeholder: "e.g. Flight to London" },
        { name: "fromZone", label: "DEPARTURE TIME ZONE", type: "select", value: state.homeZone },
        { name: "departureDate", label: "DEPARTURE DATE", type: "date", required: true, value: dateString(new Date()) },
        { name: "departureTime", label: "DEPARTURE LOCAL TIME", type: "time", required: true, value: "10:00" },
        { name: "toZone", label: "ARRIVAL TIME ZONE", type: "select", value: "Europe/London" },
        { name: "arrivalDate", label: "ARRIVAL DATE", type: "date", required: true, value: dateString(new Date()) },
        { name: "arrivalTime", label: "ARRIVAL LOCAL TIME", type: "time", required: true, value: "14:00" }
      ] }
    };
    const config = dialogConfigs[type];
    $("#dialog-eyebrow").textContent = config.eyebrow;
    $("#dialog-title").textContent = config.title;
    fields.innerHTML = config.fields.map((field) => {
      const control = field.type === "select"
        ? `<select name="${field.name}" ${field.required ? "required" : ""}>${field.options ? field.options.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("") : allZones().map((zone) => `<option value="${escapeHtml(zone)}">${escapeHtml(displayZoneName(zone))}</option>`).join("")}</select>`
        : `<input name="${field.name}" type="${field.type}" ${field.value ? `value="${escapeHtml(field.value)}"` : ""} ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ""} ${field.required ? "required" : ""}>`;
      return `<div class="dialog-field"><label>${escapeHtml(field.label)}</label>${control}</div>`;
    }).join("");
    config.fields.filter((field) => field.type === "select" && !field.options).forEach((field) => { $(`[name="${field.name}"]`, fields).value = field.value; });
    const submit = (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      handleDialogSave(type, data);
      dialog.close();
    };
    $("#entry-form").onsubmit = submit;
    dialog.showModal();
  }
  function handleDialogSave(type, data) {
    if (type === "event") {
      const converted = localDateTimeToInstant(data.date, data.time, data.zone);
      state.events.push({ id: String(Date.now()), title: data.title, zone: data.zone, instant: converted.instant.toISOString() });
      persist(); renderCalendar(); renderUpcoming(); showToast("Event added to your calendar.");
      return;
    }
    if (type === "alarm") {
      const converted = localDateTimeToInstant(data.date, data.time, data.zone);
      if (converted.instant < new Date()) { showToast("Choose a future date and time for your alarm."); return; }
      state.alarms.push({ id: String(Date.now()), label: data.label, zone: data.zone, dueAt: converted.instant.toISOString(), repeat: data.repeat, lastFiredAt: "" });
      persist(); renderAlarms(); renderUpcoming(); showToast("Alarm set. It will be checked while this app is open.");
      return;
    }
    if (type === "participant") {
      if (!state.plannerZones.includes(data.zone)) state.plannerZones.push(data.zone);
      persist(); renderPlanner(); showToast(`${zoneChoice(data.zone).city} added to the meeting plan.`);
      return;
    }
    if (type === "flight") {
      const departure = localDateTimeToInstant(data.departureDate, data.departureTime, data.fromZone);
      const arrival = localDateTimeToInstant(data.arrivalDate, data.arrivalTime, data.toZone);
      state.flights.push({ id: String(Date.now()), label: data.label, fromZone: data.fromZone, toZone: data.toZone, fromCity: zoneChoice(data.fromZone).city, toCity: zoneChoice(data.toZone).city, departure: departure.instant.toISOString(), arrival: arrival.instant.toISOString() });
      persist(); renderFlights(); showToast("Flight added to your itinerary.");
    }
  }
  function setupDelegatedEvents() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-page],[data-goto],[data-favorite],[data-remove],[data-add-zone],[data-delete-conversion],[data-remove-participant],[data-map-zone],[data-delete-alarm],[data-delete-event],[data-delete-flight],[data-calendar-date],.suggestion-card");
      if (!target) return;
      if (target.dataset.page) { navigate(target.dataset.page); return; }
      if (target.dataset.goto) { navigate(target.dataset.goto); return; }
      if (target.dataset.favorite) {
        const zone = target.dataset.favorite;
        state.favorites = state.favorites.includes(zone) ? state.favorites.filter((item) => item !== zone) : [...state.favorites, zone];
        persist(); renderWorld($("#city-search").value); renderHome(); return;
      }
      if (target.dataset.remove) {
        state.favorites = state.favorites.filter((zone) => zone !== target.dataset.remove);
        persist(); renderWorld($("#city-search").value); renderHome(); return;
      }
      if (target.dataset.addZone) {
        addZone(target.dataset.addZone); $("#search-results").classList.add("hidden"); $("#city-search").value = ""; return;
      }
      if (target.dataset.deleteConversion) {
        state.savedConversions = state.savedConversions.filter((item) => item.id !== target.dataset.deleteConversion);
        persist(); renderSavedConversions(); return;
      }
      if (target.dataset.removeParticipant) {
        state.plannerZones = plannerZones().filter((zone) => zone !== target.dataset.removeParticipant);
        persist(); renderPlanner(); return;
      }
      if (target.dataset.mapZone) { showMapDetail(target.dataset.mapZone); return; }
      if (target.dataset.deleteAlarm) {
        state.alarms = state.alarms.filter((alarm) => alarm.id !== target.dataset.deleteAlarm);
        persist(); renderAlarms(); renderUpcoming(); return;
      }
      if (target.dataset.deleteEvent) {
        state.events = state.events.filter((item) => item.id !== target.dataset.deleteEvent);
        persist(); renderCalendar(); renderUpcoming(); return;
      }
      if (target.dataset.deleteFlight) {
        state.flights = state.flights.filter((flight) => flight.id !== target.dataset.deleteFlight);
        persist(); renderFlights(); return;
      }
      if (target.dataset.calendarDate) {
        selectedDate = target.dataset.calendarDate; renderCalendar(); return;
      }
      if (target.classList.contains("suggestion-card")) copyText(target.dataset.share);
    });
    $("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
    $("#map-markers").addEventListener("keydown", (event) => {
      const marker = event.target.closest("[data-map-zone]");
      if (marker && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); showMapDetail(marker.dataset.mapZone); }
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest("#city-search,#search-results")) $("#search-results").classList.add("hidden");
    });
  }
  function initialize() {
    state.homeZone = zoneAliases[state.homeZone] || state.homeZone;
    if (!zoneNames.includes(state.homeZone) && !cities.some((city) => city.zone === state.homeZone)) state.homeZone = runtimeZone;
    if (!state.favorites.length) state.favorites = [...defaults.favorites];
    setupQuickConverter(); setupConverter(); setupWorldClock(); setupPlanner(); setupMap(); setupTravel(); setupAlarms(); setupCalendar(); setupTools(); setupSettings(); setupDelegatedEvents();
    renderHome(); renderWorld(); renderMapCities(); updateMap();
    setInterval(() => {
      refreshClockCards();
      $("#unix-result").textContent = Math.floor(Date.now() / 1000);
      checkAlarms();
      renderUpcoming();
    }, 1000);
  }
  initialize();
})();
