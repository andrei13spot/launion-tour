// shared helpers used by every page (API calls, login state, nav, toast, etc).

// wrapper around fetch so we don't repeat the headers everywhere.
async function api(url, method, body) {
  const options = { method: method || "GET", headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  let data = {};
  try { data = await res.json(); } catch (e) { data = {}; }
  return { ok: res.ok, status: res.status, data: data };
}

// keep the logged-in user here once we fetch it.
let CURRENT_USER = null;

// if nobody is logged in, send them to the login page. Returns true if logged in.
function requireLoginRedirect() {
  if (CURRENT_USER) return true;
  toast("Please log in first.");
  setTimeout(function () { window.location.href = "login.html"; }, 900);
  return false;
}

// catalog lookups so any page can show a spot/hotel detail without navigating.
const SPOTS_BY_ID = {};
const HOTELS_BY_ID = {};

// the little sailboat logo (used in the nav brand and the favicon).
const BOAT_SHAPES =
  '<polygon points="14.5,4 14.5,18 6,18" fill="#0038a8"/>' +
  '<polygon points="16.5,8 16.5,18 24,18" fill="#ce1126"/>' +
  '<rect x="14.5" y="4" width="1.4" height="14" rx="0.5" fill="#13203b"/>' +
  '<path d="M4 20 H28 L24.5 26 Q16 28.5 7.5 26 Z" fill="#13203b"/>';

// swap the brand square for the boat and set the favicon (runs on every page).
(function applyBranding() {
  document.querySelectorAll(".brand .dot").forEach(function (d) {
    d.outerHTML = '<svg class="brand-logo" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">' + BOAT_SHAPES + '</svg>';
  });
  const fav = document.createElement("link");
  fav.rel = "icon";
  fav.type = "image/svg+xml";
  fav.href = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' + BOAT_SHAPES + '</svg>');
  document.head.appendChild(fav);
  buildNavMenus();
})();

// shows a spot/hotel detail popup on the current page (no page reload), with a
// single button to actually book it. Used by the "You might also like" list so
// the user can browse suggestions without bouncing between pages.
function openItemModal(type, id) {
  const isHotel = type === "hotel";
  const item = isHotel ? HOTELS_BY_ID[id] : SPOTS_BY_ID[id];
  if (!item) { toast("Details are not available right now."); return; }
  const color = isHotel ? "var(--blue)" : (CAT_COLOR[item.category] || "var(--blue)");
  const visual = item.image
    ? '<img src="' + item.image + '" alt="' + escapeHtml(item.name) + '"/>'
    : '<div class="ph" style="background:' + color + '"></div>';

  function row(k, v, link) {
    if (!v || v === "N/A") return "";
    let val = escapeHtml(v);
    if (link === "tel") val = '<a href="tel:' + String(v).replace(/\s/g, "") + '">' + escapeHtml(v) + '</a>';
    return '<div class="mrow"><span class="k">' + k + '</span><span class="v">' + val + '</span></div>';
  }

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const fmt = function (d) { return d.toISOString().slice(0, 10); };

  let rows, form;
  if (isHotel) {
    rows = row("Rating", item.rating.toFixed(1) + " / 5") + row("Type", item.type) + row("Amenities", item.amenities);
    form =
      '<div class="book-box"><h4>Reserve your stay</h4>' +
        '<div class="field-row">' +
          '<div class="field"><label for="iCi">Check-in</label><input type="date" id="iCi" value="' + fmt(today) + '" min="' + fmt(today) + '" /></div>' +
          '<div class="field"><label for="iCo">Check-out</label><input type="date" id="iCo" value="' + fmt(tomorrow) + '" min="' + fmt(tomorrow) + '" /></div>' +
        '</div>' +
        '<div class="field"><label for="iGs">Guests</label><input type="number" id="iGs" value="2" min="1" max="10" /></div>' +
        '<div class="book-total"><span>Total <span style="color:var(--muted);font-weight:500">(+₱500/extra guest)</span></span><span><b id="iTotal"></b></span></div>' +
        '<button class="btn btn-blue btn-block" id="iBook">Reserve now</button>' +
      '</div>';
  } else {
    const priceVal = (item.price && item.price !== "N/A") ? (/free/i.test(item.price) ? "Free" : "₱ " + item.price) : "Free / info on site";
    rows = row("Location", item.location) + row("Price", priceVal) + row("Hours", item.hours) + row("Phone", item.phone, "tel");
    form =
      '<div class="book-box"><h4>Plan a tour</h4>' +
        '<div class="field-row">' +
          '<div class="field"><label for="iTd">Date</label><input type="date" id="iTd" value="' + fmt(today) + '" min="' + fmt(today) + '" /></div>' +
          '<div class="field"><label for="iTp">People</label><input type="number" id="iTp" value="2" min="1" max="20" /></div>' +
        '</div>' +
        '<button class="btn btn-red btn-block" id="iBook">Book tour</button>' +
      '</div>';
  }

  document.getElementById("modal").innerHTML =
    '<div class="modal-visual">' + visual + heartBtn(type, item.id, item.name) +
      '<button class="modal-close" id="mClose" aria-label="Close">&times;</button></div>' +
    '<div class="modal-inner">' +
      '<span class="modal-type">' + escapeHtml(item.type) + '</span>' +
      '<h3>' + escapeHtml(item.name) + '</h3>' +
      '<div class="modal-town">' + escapeHtml(item.town) + ', La Union</div>' +
      (item.about ? '<p class="modal-about">' + escapeHtml(item.about) + '</p>' : '') +
      '<div class="modal-rows">' + rows + '</div>' + form +
    '</div>';

  const back = document.getElementById("modalBack");
  back.classList.add("open");
  document.body.style.overflow = "hidden";
  wireHearts(document.getElementById("modal"));
  document.getElementById("mClose").addEventListener("click", function () {
    back.classList.remove("open");
    document.body.style.overflow = "";
  });

  if (isHotel) {
    const ci = document.getElementById("iCi"), co = document.getElementById("iCo");
    const total = document.getElementById("iTotal");
    const gs = document.getElementById("iGs");
    function nights() { return Math.round((new Date(co.value) - new Date(ci.value)) / 86400000); }
    // base rate covers 2 guests; each extra guest adds ₱500 per night.
    function refreshTotal() {
      const n = nights();
      const guests = parseInt(gs.value, 10) || 1;
      const perNight = item.price + Math.max(0, guests - 2) * 500;
      total.textContent = n >= 1
        ? "₱" + (n * perNight).toLocaleString() + " · " + n + " night" + (n > 1 ? "s" : "") +
          (guests > 2 ? " · " + (guests - 2) + " extra guest" + (guests - 2 > 1 ? "s" : "") : "")
        : "Pick valid dates";
    }
    ci.addEventListener("change", function () {
      const next = new Date(ci.value); next.setDate(next.getDate() + 1);
      const ns = next.toISOString().slice(0, 10);
      co.min = ns; if (co.value < ns) co.value = ns;
      refreshTotal();
    });
    co.addEventListener("change", refreshTotal);
    gs.addEventListener("input", refreshTotal);
    refreshTotal();
    document.getElementById("iBook").addEventListener("click", async function () {
      if (!requireLoginRedirect()) return;
      const res = await api("api/book-hotel.php", "POST", { hotelId: item.id, checkin: ci.value, checkout: co.value, guests: parseInt(document.getElementById("iGs").value, 10) || 1 });
      if (!res.ok) { toast(res.data.error || "Booking failed."); return; }
      toast("Reservation confirmed!");
      itemBookingConfirm(item.name, res.data.nights + " night(s) · Total ₱" + res.data.total.toLocaleString(), res.data.bookingId);
    });
  } else {
    document.getElementById("iBook").addEventListener("click", async function () {
      if (!requireLoginRedirect()) return;
      const date = document.getElementById("iTd").value;
      if (!date) { toast("Please pick a date."); return; }
      const res = await api("api/book-tour.php", "POST", { spotId: item.id, date: date, people: parseInt(document.getElementById("iTp").value, 10) || 1 });
      if (!res.ok) { toast(res.data.error || "Something went wrong."); return; }
      toast("Tour booked!");
      itemBookingConfirm(item.name, formatDate(date), res.data.bookingId);
    });
  }
}

// replaces the booking form with a confirmation (used by openItemModal).
function itemBookingConfirm(name, detail, bookingId) {
  const ref = "ELYU-" + String(bookingId || 0).padStart(6, "0");
  const box = document.querySelector("#modal .book-box");
  if (!box) return;
  box.outerHTML =
    '<div class="book-box"><div class="book-ok">' +
      '<span class="ok-badge">Confirmed</span>' +
      '<h3>Booking confirmed</h3>' +
      '<p>' + escapeHtml(name) + ' · ' + escapeHtml(detail) + '</p>' +
      '<p class="ok-ref">Booking reference <b>' + ref + '</b></p>' +
      '<div class="book-actions">' +
        '<a href="trips.html" class="btn btn-blue">View My Trips</a>' +
        '<button class="btn btn-ghost" id="iOkClose">Close</button>' +
      '</div>' +
    '</div></div>';
  const close = document.getElementById("iOkClose");
  if (close) close.addEventListener("click", function () {
    document.getElementById("modalBack").classList.remove("open");
    document.body.style.overflow = "";
  });
}

async function loadUser() {
  const res = await api("api/me.php");
  CURRENT_USER = res.data.user;
  return CURRENT_USER;
}

// small inline SVG icons (no emojis, no glyph characters).
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

// builds the right-hand side of the nav depending on login state.
function renderNavUser() {
  const box = document.getElementById("navAuth");
  if (!box) return;
  if (CURRENT_USER) {
    // account dropdown (like the one on Agoda) with profile / trips / log out.
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

// keeps the little number badge on the Saved heart icon up to date.
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
// called when the user saves/unsaves so the badge updates without a reload.
function adjustSavedCount(delta) {
  SAVED_COUNT = Math.max(0, SAVED_COUNT + delta);
  renderSavedBadge();
}

// ---- shared "save" (heart) system for spots and hotels ----
// one source of truth so card hearts and modal hearts stay in sync.
const SAVED = {}; // key "type:id" -> true
function savedKey(type, id) { return type + ":" + id; }
function isSaved(type, id) { return !!SAVED[savedKey(type, id)]; }

// load the user's saved items into SAVED (call on page boot).
async function loadSaved() {
  if (!CURRENT_USER) return;
  const res = await api("api/saved.php");
  (res.data.items || []).forEach(function (it) { SAVED[savedKey(it.type, it.data.id)] = true; });
}

// toggle a save. Returns the new state (true/false), or null if not logged in.
async function toggleSaved(type, id) {
  if (!CURRENT_USER) { requireLoginRedirect(); return null; }
  const key = savedKey(type, id);
  if (SAVED[key]) {
    await api("api/saved.php", "DELETE", { itemType: type, itemId: id });
    delete SAVED[key]; adjustSavedCount(-1); toast("Removed from saved.");
    return false;
  }
  await api("api/saved.php", "POST", { itemType: type, itemId: id });
  SAVED[key] = true; adjustSavedCount(1); toast("Saved to My Trips!");
  return true;
}

// markup for a heart button (used on cards and inside modals).
function heartBtn(type, id, name) {
  const on = isSaved(type, id);
  return '<button class="badge-fav' + (on ? " saved" : "") + '" data-save-type="' + type +
    '" data-save-id="' + id + '" aria-label="Save ' + escapeHtml(name) + '">' + ICONS.heart(on) + '</button>';
}

// wire every heart button inside a container so it toggles + updates itself.
function wireHearts(container) {
  (container || document).querySelectorAll("[data-save-id]").forEach(function (btn) {
    if (btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", async function (e) {
      e.stopPropagation();
      e.preventDefault();
      const on = await toggleSaved(btn.dataset.saveType, btn.dataset.saveId);
      if (on === null) return;
      // update every heart on the page for this item (card + modal)
      document.querySelectorAll('[data-save-type="' + btn.dataset.saveType + '"][data-save-id="' + btn.dataset.saveId + '"]')
        .forEach(function (b) { b.classList.toggle("saved", on); b.innerHTML = ICONS.heart(on); });
    });
  });
}

// mobile nav toggle (the hamburger button).
function setupNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () { links.classList.toggle("open"); });
}

// small toast popup at the bottom of the screen.
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

// reusable confirmation dialog so important actions aren't done by accident.
// confirmAction({ title, message, confirmText, cancelText, danger, onConfirm })
function confirmAction(opts) {
  let back = document.getElementById("confirmBack");
  if (!back) {
    back = document.createElement("div");
    back.id = "confirmBack";
    back.className = "confirm-back";
    document.body.appendChild(back);
  }
  const danger = opts.danger !== false; // red button by default
  back.innerHTML =
    '<div class="confirm-box" role="alertdialog" aria-modal="true">' +
      '<h3>' + escapeHtml(opts.title || "Are you sure?") + '</h3>' +
      '<p>' + escapeHtml(opts.message || "") + '</p>' +
      '<div class="confirm-actions">' +
        '<button class="btn btn-ghost" id="confirmNo">' + escapeHtml(opts.cancelText || "Cancel") + '</button>' +
        '<button class="btn ' + (danger ? "btn-red" : "btn-blue") + '" id="confirmYes">' + escapeHtml(opts.confirmText || "Confirm") + '</button>' +
      '</div>' +
    '</div>';
  back.classList.add("open");

  function close() { back.classList.remove("open"); }
  document.getElementById("confirmNo").addEventListener("click", close);
  back.addEventListener("click", function (e) { if (e.target === back) close(); });
  document.getElementById("confirmYes").addEventListener("click", function () {
    close();
    if (typeof opts.onConfirm === "function") opts.onConfirm();
  });
}

// search box with a live suggestions dropdown so users aren't left guessing.
// opts: { getItems(), onPick(id), onFilter(query), chips: [..] }
//   getItems  -> array of { id, name, town, type } to search through
//   onPick    -> open the chosen item (e.g. its detail popup)
//   onFilter  -> also filter the cards on the page
//   chips     -> quick suggestions shown when nothing matches
function setupSearch(opts) {
  const input = document.getElementById("searchInput");
  const drop = document.getElementById("searchSuggest");
  if (!input || !drop) return;

  function rowHtml(it) {
    return '<div class="suggest-row" data-id="' + it.id + '">' +
      '<span class="sr-name">' + escapeHtml(it.name) + '</span>' +
      '<span class="sr-meta">' + escapeHtml(it.town) + '</span></div>';
  }

  // wire up clicks (mousedown so it beats the input's blur) after rendering.
  function bind() {
    drop.querySelectorAll(".suggest-row").forEach(function (row) {
      row.addEventListener("mousedown", function (e) {
        e.preventDefault();
        drop.classList.remove("open");
        opts.onPick(row.dataset.id);
      });
    });
    drop.querySelectorAll(".suggest-chip").forEach(function (chip) {
      chip.addEventListener("mousedown", function (e) {
        e.preventDefault();
        input.value = chip.dataset.chip;
        if (opts.onFilter) opts.onFilter(input.value);
        render(input.value);
        input.focus();
      });
    });
  }

  // shown when the box is focused but empty - a few popular picks.
  function renderPopular() {
    const items = opts.getItems();
    const pop = (opts.popular || []).map(function (name) {
      return items.find(function (it) { return it.name === name; });
    }).filter(Boolean).slice(0, 3);
    if (!pop.length) { drop.classList.remove("open"); return; }
    drop.innerHTML = '<div class="suggest-empty">Popular right now</div>' + pop.map(rowHtml).join("");
    drop.classList.add("open");
    bind();
  }

  function render(query) {
    const q = query.trim().toLowerCase();
    if (!q) { renderPopular(); return; }

    const matches = opts.getItems().filter(function (it) {
      return (it.name + " " + it.town + " " + it.type).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 6);

    if (matches.length) {
      drop.innerHTML = matches.map(rowHtml).join("");
    } else {
      drop.innerHTML = '<div class="suggest-empty">No matches for "' + escapeHtml(query.trim()) + '". Try one of these:</div>' +
        '<div class="suggest-chips">' + opts.chips.map(function (c) {
          return '<span class="suggest-chip" data-chip="' + escapeHtml(c) + '">' + escapeHtml(c) + '</span>';
        }).join("") + '</div>';
    }
    drop.classList.add("open");
    bind();
  }

  input.addEventListener("input", function () { if (opts.onFilter) opts.onFilter(input.value); render(input.value); });
  input.addEventListener("focus", function () { render(input.value); });
  input.addEventListener("blur", function () { setTimeout(function () { drop.classList.remove("open"); }, 150); });

  const btn = document.getElementById("searchBtn");
  if (btn) btn.addEventListener("click", function () {
    if (opts.onFilter) opts.onFilter(input.value);
    drop.classList.remove("open");
    input.blur();
  });
}

// builds the hover menus under "Tourist Spots" (the 4 categories) and "Hotels"
// (hotel types). Runs once per page from app.js.
function buildNavMenus() {
  const menus = {
    "Tourist Spots": [
      ["Beaches & Falls", "index.html#beaches"],
      ["Caves & Mountains", "index.html#mountains"],
      ["Restaurants", "index.html#food"],
      ["Culture & Landmarks", "index.html#culture"]
    ],
    "Hotels": [
      ["Beach Resorts", "hotels.html?q=Beach Resort"],
      ["Resorts", "hotels.html?q=Resort"],
      ["Hotels", "hotels.html?q=Hotel"],
      ["Inns", "hotels.html?q=Inn"]
    ]
  };
  document.querySelectorAll(".nav-links > a").forEach(function (a) {
    const items = menus[a.textContent.trim()];
    if (!items) return;
    const wrap = document.createElement("div");
    wrap.className = "nav-item";
    a.parentNode.insertBefore(wrap, a);
    wrap.appendChild(a);
    const box = document.createElement("div");
    box.className = "nav-drop";
    box.innerHTML = items.map(function (it) { return '<a href="' + it[1] + '">' + it[0] + '</a>'; }).join("");
    wrap.appendChild(box);
  });
}

// fade-up reveal using IntersectionObserver (works no matter how the page
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

// placeholder background color for a category (used when there's no image).
const CAT_COLOR = {
  beaches: "var(--c-beaches)",
  mountains: "var(--c-mountains)",
  food: "var(--c-food)",
  culture: "var(--c-culture)"
};
function phStyle(catId) {
  return "background:" + (CAT_COLOR[catId] || "var(--blue)") + ";";
}

// fake but stable rating + review count so cards look like a real booking site.
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

// turn a price string like "200 - 400" into something nice, or FREE.
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

// turns "2026-07-04" into "July 04, 2026 (Saturday)" so dates read nicely.
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

// format a distance for the suggestion list ("Same area" when it's basically 0).
function distText(km) {
  if (km <= 0.5) return "Same area";
  return "~" + km + " km away";
}
