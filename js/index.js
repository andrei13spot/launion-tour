// home page logic: render the category blocks of tourist spots, open a
// detail modal, save spots, and let the user plan a tour (with nearby
// hotel suggestions afterwards).

let DATA = null;          // { categories, spots }

// the search box lives inside the first category's photo banner (beaches & falls).
const SEARCH_BOX_HTML =
  '<div class="search-box hero-search">' +
    '<div class="searchbar">' +
      '<svg class="search-ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
      '<input type="text" id="searchInput" placeholder="Search by name, town, or type" aria-label="Search tourist spots" autocomplete="off" />' +
      '<button type="button" class="search-btn" id="searchBtn">Search</button>' +
    '</div>' +
    '<div class="search-suggest" id="searchSuggest"></div>' +
  '</div>';

function spotById(id) {
  // ids from the database are numbers, but data-id attributes are strings,
  // so compare them as strings to be safe.
  return DATA.spots.find(function (s) { return String(s.id) === String(id); });
}

function priceFmt(price) {
  if (!price || price === "N/A") return '<span class="free">Info on site</span>';
  if (/free/i.test(price)) return '<span class="free">FREE</span>';
  return '<span class="peso">&#8369;</span> ' + price;
}

function cardHTML(s) {
  const visual = s.image
    ? '<img src="' + s.image + '" alt="' + escapeHtml(s.name) + '" loading="lazy"/>'
    : '<div class="ph" style="' + phStyle(s.category) + '"></div>';
  return '<article class="card reveal" data-id="' + s.id + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(s.name) + '">' +
    '<div class="card-visual">' + visual +
      '<span class="card-type">' + escapeHtml(s.type) + '</span>' +
      heartBtn("spot", s.id, s.name) +
    '</div>' +
    '<div class="card-body">' +
      '<h4>' + escapeHtml(s.name) + '</h4>' +
      '<div class="card-town">' + escapeHtml(s.town) + '</div>' +
      '<p class="card-about">' + escapeHtml(s.about) + '</p>' +
      '<div class="card-foot">' +
        '<span class="card-price">' + priceFmt(s.price) + '</span>' +
      '</div>' +
    '</div>' +
  '</article>';
}

function renderCatalog() {
  const root = document.getElementById("catalog");
  let html = "";
  DATA.categories.forEach(function (cat, idx) {
    const list = DATA.spots.filter(function (s) { return s.category === cat.id; });
    // each category is a full-width section with its own big centered header
    // band (a distinct background per category) so the page reads in clear,
    // apple-style chapters as you scroll. the search box sits inside the first
    // banner (beaches & falls).
    html += '<section class="cat-block cat-' + cat.id + (idx === 0 ? " has-search" : "") + '" id="' + cat.id + '">' +
      '<div class="cat-hero">' +
        (idx === 0 ? SEARCH_BOX_HTML : "") +
        '<div class="l-tag">' + escapeHtml(cat.tag) + '</div>' +
        '<h3>' + escapeHtml(cat.label) + '</h3>' +
        '<p class="cat-sub">Places to explore</p>' +
      '</div>' +
      '<div class="wrap"><div class="grid">' + list.map(cardHTML).join("") + '</div></div>' +
    '</section>';
  });
  root.innerHTML = html;

  root.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("[data-save-id]")) return; // heart handled separately
      openSpotModal(card.dataset.id);
    });
    // let keyboard users open the card with Enter or Space too
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSpotModal(card.dataset.id); }
    });
  });
  wireHearts(root);

  initScrollAnimations();
}

// real-time search: hide cards that don't match, and hide empty categories.
function filterSpots(query) {
  const q = query.trim().toLowerCase();
  let anyVisible = false;
  document.querySelectorAll(".cat-block").forEach(function (block) {
    // the hotel teaser isn't part of the spot search - hide it while searching.
    if (block.id === "stay") { block.style.display = q ? "none" : ""; return; }
    let blockHas = false;
    block.querySelectorAll(".card").forEach(function (card) {
      const s = spotById(card.dataset.id);
      const hay = (s.name + " " + s.town + " " + s.type + " " + s.about).toLowerCase();
      const hit = !q || hay.indexOf(q) !== -1;
      card.style.display = hit ? "" : "none";
      if (hit) { card.classList.add("in"); blockHas = true; } // .in keeps it visible past the reveal animation
    });
    // the first banner holds the search box, so keep it on screen even when
    // nothing in it matches (otherwise the search field would vanish mid-type).
    const hasSearch = !!block.querySelector("#searchInput");
    block.style.display = (blockHas || hasSearch) ? "" : "none";
    // make sure the section's header band is visible too (it may not have
    // scrolled into view yet, which would leave it faded out).
    if (blockHas) {
      const hero = block.querySelector(".cat-hero");
      if (hero) hero.classList.add("in");
      anyVisible = true;
    }
  });
  const noRes = document.getElementById("noResults");
  if (noRes) noRes.style.display = anyVisible ? "none" : "block";
}

function detailRow(key, value, link) {
  if (!value || value === "N/A") return "";
  let v = escapeHtml(value);
  if (link === "tel") v = '<a href="tel:' + value.replace(/\s/g, "") + '">' + escapeHtml(value) + '</a>';
  if (link === "mail") v = '<a href="mailto:' + value + '">' + escapeHtml(value) + '</a>';
  return '<div class="mrow"><span class="k">' + key + '</span><span class="v">' + v + '</span></div>';
}

function openSpotModal(spotId) {
  const s = spotById(spotId);
  if (!s) return;
  const todayStr = new Date().toISOString().slice(0, 10); // so tours can't be booked in the past
  const visual = s.image
    ? '<img src="' + s.image + '" alt="' + escapeHtml(s.name) + '"/>'
    : '<div class="ph" style="' + phStyle(s.category) + '"></div>';
  const priceVal = (s.price && s.price !== "N/A")
    ? (/free/i.test(s.price) ? "Free" : "₱ " + s.price) : "Free / info on site";

  document.getElementById("modal").innerHTML =
    '<div class="modal-visual">' + visual + heartBtn("spot", s.id, s.name) +
      '<button class="modal-close" id="mClose" aria-label="Close">&times;</button></div>' +
    '<div class="modal-inner">' +
      '<span class="modal-type">' + escapeHtml(s.type) + '</span>' +
      '<h3>' + escapeHtml(s.name) + '</h3>' +
      '<div class="modal-town">' + escapeHtml(s.town) + ', La Union</div>' +
      '<div class="modal-rating"><span class="stars">' + ICONS.star + ' ' + ratingFor(s.name) + '</span> · ' +
        reviewsFor(s.name).toLocaleString() + ' reviews</div>' +
      '<p class="modal-about">' + escapeHtml(s.about) + '</p>' +
      '<div class="modal-rows">' +
        detailRow("Location", s.location) +
        detailRow("Price", priceVal) +
        detailRow("Hours", s.hours) +
        detailRow("Phone", s.phone, "tel") +
        detailRow("Email", s.email, "mail") +
      '</div>' +
      '<div class="book-box">' +
        '<h4>Plan a tour to this spot</h4>' +
        '<div class="field-row">' +
          '<div class="field"><label for="tourDate">Date</label><input type="date" id="tourDate" value="' + todayStr + '" min="' + todayStr + '" /></div>' +
          '<div class="field"><label for="tourPeople">People</label><input type="number" id="tourPeople" value="2" min="1" max="20" /></div>' +
        '</div>' +
        '<button class="btn btn-red btn-block" id="planBtn">Book tour</button>' +
      '</div>' +
      '<div id="suggestArea"></div>' +
    '</div>';

  openModal();
  wireHearts(document.getElementById("modal"));
  document.getElementById("mClose").addEventListener("click", closeModal);
  document.getElementById("planBtn").addEventListener("click", function () { planTour(s.id); });
}

async function planTour(spotId) {
  if (!CURRENT_USER) {
    toast("Please log in to plan a tour.");
    setTimeout(function () { window.location.href = "login.html"; }, 900);
    return;
  }
  const date = document.getElementById("tourDate").value;
  const people = parseInt(document.getElementById("tourPeople").value, 10) || 1;
  if (!date) { toast("Please pick a date."); return; }

  const res = await api("api/book-tour.php", "POST", { spotId: spotId, date: date, people: people });
  if (!res.ok) { toast(res.data.error || "Something went wrong."); return; }

  toast("Tour booked!");
  // swap the form for a confirmation so the user can go straight to their
  // trip or simply close - they are never forced to look at the suggestions.
  const s = spotById(spotId);
  const ref = "ELYU-" + String(res.data.bookingId || 0).padStart(6, "0");
  const box = document.querySelector(".book-box");
  if (box) {
    box.outerHTML =
      '<div class="book-box"><div class="book-ok">' +
        '<span class="ok-badge">Confirmed</span>' +
        '<h3>Tour booked</h3>' +
        '<p>' + escapeHtml(s.name) + ' · ' + formatDate(date) + '</p>' +
        '<p class="ok-ref">Booking reference <b>' + ref + '</b></p>' +
        '<div class="book-actions">' +
          '<a href="trips.html" class="btn btn-red">View My Trips</a>' +
          '<button class="btn btn-ghost" id="laterBtn">Close</button>' +
        '</div>' +
      '</div></div>';
    document.getElementById("laterBtn").addEventListener("click", closeModal);
  }
  showSuggestions(res.data.suggestions, "You might also like", "Hotels near this spot.");
}

// builds the clickable "nearby" list shown after planning a tour (hotels near the spot).
function showSuggestions(suggestions, title, hint) {
  const area = document.getElementById("suggestArea");
  if (!area || !suggestions || !suggestions.items.length) return;
  const items = suggestions.items.map(function (it) {
    const meta = it.town + " · ₱" + it.price + "/night";
    const thumb = it.image
      ? '<img class="suggest-thumb" src="' + it.image + '" alt="' + escapeHtml(it.name) + '" loading="lazy"/>'
      : '<div class="suggest-thumb" style="background:var(--blue)"></div>';
    return '<div class="suggest-item" data-sid="' + it.id + '" role="button" tabindex="0">' +
      thumb +
      '<div class="suggest-meta"><div class="n">' + escapeHtml(it.name) + '</div>' +
        '<div class="d">' + escapeHtml(meta) + '</div></div>' +
      '<div class="suggest-dist">' + distText(it.distanceKm) + '</div>' +
    '</div>';
  }).join("");
  area.innerHTML = '<div class="suggest"><h4>' + title + '</h4>' +
    '<p class="hint">' + hint + '</p>' +
    '<div class="suggest-list">' + items + '</div>' +
    '<a href="hotels.html" class="btn btn-blue btn-block" style="margin-top:14px">Browse all hotels</a></div>';
  // open the hotel's details in place instead of navigating away.
  area.querySelectorAll(".suggest-item").forEach(function (el) {
    el.addEventListener("click", function () { openItemModal("hotel", el.dataset.sid); });
  });
  area.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// fade the cards in as they scroll into view.
function initScrollAnimations() {
  revealOnScroll(".cat-block .card");
}

// "where to stay" teaser - a few featured hotels. Clicking one opens it in
// place (view + book); only the "See all hotels" button leaves the page.
function renderStayTeaser(hotels) {
  const grid = document.getElementById("stayGrid");
  if (!grid) return;
  const featured = hotels.slice(0, 6);
  grid.innerHTML = featured.map(function (h) {
    const visual = h.image
      ? '<img src="' + h.image + '" alt="' + escapeHtml(h.name) + '" loading="lazy"/>'
      : '<div class="ph" style="background:var(--blue)"></div>';
    return '<article class="card reveal" data-hotel="' + h.id + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(h.name) + '">' +
      '<div class="card-visual">' + visual +
        '<span class="card-type">' + escapeHtml(h.type) + '</span>' + heartBtn("hotel", h.id, h.name) + '</div>' +
      '<div class="card-body">' +
        '<h4>' + escapeHtml(h.name) + '</h4>' +
        '<div class="card-town">' + escapeHtml(h.town) + '</div>' +
        '<p class="card-about">' + escapeHtml(h.about) + '</p>' +
        '<div class="card-foot">' +
          '<span class="card-price"><span class="peso">&#8369;</span> ' + h.price.toLocaleString() + ' <span style="color:var(--muted);font-weight:500">/night</span></span>' +
          '<span class="card-rating">' + ICONS.star + ' ' + h.rating.toFixed(1) + '</span>' +
        '</div>' +
      '</div></article>';
  }).join("");
  grid.querySelectorAll(".card").forEach(function (card) {
    const go = function () { openItemModal("hotel", card.dataset.hotel); };
    card.addEventListener("click", function (e) { if (e.target.closest("[data-save-id]")) return; go(); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
  wireHearts(grid);
  revealOnScroll("#stayGrid .card");
}

// ---- modal helpers ----
function openModal() {
  document.getElementById("modalBack").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  document.getElementById("modalBack").classList.remove("open");
  document.body.style.overflow = "";
}
document.getElementById("modalBack").addEventListener("click", function (e) {
  if (e.target.id === "modalBack") closeModal();
});
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

// ---- boot ----
window.addEventListener("load", async function () {
  setupNavToggle();

  await loadUser();
  renderNavUser();
  await loadSaved(); // shared saved state for spot + hotel hearts

  const res = await api("api/spots.php");
  DATA = res.data;
  DATA.spots.forEach(function (s) { SPOTS_BY_ID[s.id] = s; }); // for in-place detail popups
  renderCatalog();

  setupSearch({
    getItems: function () { return DATA.spots; },
    onPick: function (id) { openSpotModal(id); },
    onFilter: function (q) { filterSpots(q); },
    chips: ["San Juan", "Beach", "Waterfall", "Restaurant", "San Fernando City"],
    popular: ["Urbiztondo Beach", "Tangadan Falls", "Ma-Cho Temple"]
  });

  // featured hotels teaser below the spots
  const hotelRes = await api("api/hotels.php");
  (hotelRes.data.hotels || []).forEach(function (h) { HOTELS_BY_ID[h.id] = h; }); // so hotel suggestions open in-place
  renderStayTeaser(hotelRes.data.hotels || []);

  // if we arrived from a saved item (e.g. /?spot=spot-1), open it right away.
  const wanted = new URLSearchParams(window.location.search).get("spot");
  if (wanted && spotById(wanted)) openSpotModal(wanted);

  // if linked to a category from the nav menu (e.g. index.html#beaches), scroll there
  // once the sections exist.
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) setTimeout(function () { target.scrollIntoView(); }, 80);
  }

  setTimeout(function () { document.getElementById("loader").classList.add("hide"); }, 700);
});
