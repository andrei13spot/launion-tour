// Shared helpers used by every page (API calls, login state, nav, toast, etc).

// Wrapper around fetch so we don't repeat the headers everywhere.
async function api(url, method, body) {
  const options = { method: method || "GET", headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  let data = {};
  try { data = await res.json(); } catch (e) { data = {}; }
  return { ok: res.ok, status: res.status, data: data };
}

// Keep the logged-in user here once we fetch it.
let CURRENT_USER = null;

async function loadUser() {
  const res = await api("api/me.php");
  CURRENT_USER = res.data.user;
  return CURRENT_USER;
}

// Small inline SVG icons (no emojis, no glyph characters).
const ICONS = {
  heart: function (filled) {
    return filled
      ? '<svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 21l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 12.18z"/></svg>'
      : '<svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20l-1.45-1.32C5.4 13.86 2 10.78 2 7 2 4.42 4.42 2 7 2c1.74 0 3.41.81 4.5 2.09C12.59 2.81 14.26 2 16 2c2.58 0 4.5 2.42 4.5 5 0 3.78-3.4 6.86-8.55 11.68z"/></svg>';
  },
  star: '<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"/></svg>',
  check: '<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
  checkBig: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
  info: '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></svg>'
};

// Builds the right-hand side of the nav depending on login state.
function renderNavUser() {
  const box = document.getElementById("navAuth");
  if (!box) return;
  if (CURRENT_USER) {
    // Account dropdown (like the one on Agoda) with profile / trips / log out.
    box.innerHTML =
      '<a href="trips.html">My Trips</a>' +
      '<a href="trips.html?tab=saved" class="nav-icon" aria-label="Saved" title="Saved">' +
        ICONS.heart(false) + '<span class="saved-count" id="savedCount"></span>' +
      '</a>' +
      '<div class="acct" id="acct">' +
        '<button class="acct-btn" id="acctBtn" aria-haspopup="true" aria-expanded="false">' +
          escapeHtml(CURRENT_USER.name.split(" ")[0]) +
        '</button>' +
        '<div class="acct-drop" id="acctDrop">' +
          '<a href="profile.html">My Profile</a>' +
          '<a href="#" id="logoutLink">Log out</a>' +
        '</div>' +
      '</div>';

    const btn = document.getElementById("acctBtn");
    const drop = document.getElementById("acctDrop");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const open = drop.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // close the dropdown when clicking anywhere else
    document.addEventListener("click", function () {
      drop.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });

    document.getElementById("logoutLink").addEventListener("click", async function (e) {
      e.preventDefault();
      await api("api/logout.php", "POST");
      window.location.href = "index.html";
    });

    refreshSavedCount(); // fill in the little number on the heart icon
  } else {
    box.innerHTML =
      '<a href="login.html" class="nav-ghost">Log in</a>' +
      '<a href="signup.html" class="nav-cta">Sign up</a>';
  }
}

// Keeps the little number badge on the Saved heart icon up to date.
let SAVED_COUNT = 0;
function renderSavedBadge() {
  const el = document.getElementById("savedCount");
  if (!el) return;
  if (SAVED_COUNT > 0) {
    el.textContent = SAVED_COUNT > 99 ? "99+" : SAVED_COUNT;
    el.classList.add("show");
  } else {
    el.textContent = "";
    el.classList.remove("show");
  }
}
async function refreshSavedCount() {
  if (!CURRENT_USER) return;
  const res = await api("api/saved.php");
  SAVED_COUNT = (res.data.items || []).length;
  renderSavedBadge();
}
// Called when the user saves/unsaves so the badge updates without a reload.
function adjustSavedCount(delta) {
  SAVED_COUNT = Math.max(0, SAVED_COUNT + delta);
  renderSavedBadge();
}

// Mobile nav toggle (the hamburger button).
function setupNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () { links.classList.toggle("open"); });
}

// Small toast popup at the bottom of the screen.
let toastTimer = null;
function toast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2500);
}

// Fade-up reveal using IntersectionObserver (works no matter how the page
// scrolls). Elements need the .reveal class; we add .in when they show.
function revealOnScroll(selector) {
  const els = document.querySelectorAll(selector);
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (e) { e.classList.add("in"); });
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(function (e) {
    // small stagger based on the card's position in its row group
    const sibs = Array.prototype.slice.call(e.parentElement.children);
    e.style.transitionDelay = (sibs.indexOf(e) % 8) * 55 + "ms";
    io.observe(e);
  });
}

// ---- little display helpers ----

// Placeholder background color for a category (used when there's no image).
const CAT_COLOR = {
  beaches: "var(--c-beaches)",
  mountains: "var(--c-mountains)",
  food: "var(--c-food)",
  culture: "var(--c-culture)"
};
function phStyle(catId) {
  return "background:" + (CAT_COLOR[catId] || "var(--blue)") + ";";
}

// Fake but stable rating + review count so cards look like a real booking site.
function hashy(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function ratingFor(name) {
  return (4.2 + (hashy(name) % 8) / 10).toFixed(1);
}
function reviewsFor(name) {
  return 45 + (hashy(name + "r") % 2400);
}

// Turn a price string like "200 - 400" into something nice, or FREE.
function priceText(price) {
  if (!price || price === "N/A") return null;
  if (/free/i.test(price)) return "FREE";
  return "₱" + price;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Turns "2026-07-04" into "July 04, 2026 (Saturday)" so dates read nicely.
function formatDate(iso) {
  if (!iso) return "";
  const p = String(iso).split("-");
  if (p.length !== 3) return iso;
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const y = +p[0], m = +p[1], d = +p[2];
  const dt = new Date(y, m - 1, d); // build in local time so the weekday is right
  if (!months[m - 1]) return iso;
  return months[m - 1] + " " + String(d).padStart(2, "0") + ", " + y + " (" + days[dt.getDay()] + ")";
}

// Format a distance for the suggestion list ("Same area" when it's basically 0).
function distText(km) {
  if (km <= 0.5) return "Same area";
  return "~" + km + " km away";
}
