// Home page logic: render the category blocks of tourist spots, open a
// detail modal, save spots, and let the user plan a tour (with nearby
// hotel suggestions afterwards).

let DATA = null;          // { categories, spots }
let SAVED_SPOTS = {};     // spotId -> true (so we know which hearts are filled)

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
  const heartClass = SAVED_SPOTS[s.id] ? "badge-fav saved" : "badge-fav";
  const heart = ICONS.heart(!!SAVED_SPOTS[s.id]);
  return '<article class="card reveal" data-id="' + s.id + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(s.name) + '">' +
    '<div class="card-visual">' + visual +
      '<span class="card-type">' + escapeHtml(s.type) + '</span>' +
      '<button class="' + heartClass + '" data-fav="' + s.id + '" aria-label="Save ' + escapeHtml(s.name) + '">' + heart + '</button>' +
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

// Give some categories a tinted background so the sections alternate as you scroll.
const CAT_TINT = { mountains: " tint-blue", culture: " tint-sand" };

function renderCatalog() {
  const root = document.getElementById("catalog");
  let html = "";
  DATA.categories.forEach(function (cat) {
    const list = DATA.spots.filter(function (s) { return s.category === cat.id; });
    const tint = CAT_TINT[cat.id] || "";
    html += '<section class="cat-block' + tint + '" id="' + cat.id + '"><div class="wrap">' +
      '<div class="cat-head"><div>' +
        '<div class="l-tag">' + escapeHtml(cat.tag) + '</div>' +
        '<h3>' + escapeHtml(cat.label) + '</h3>' +
      '</div>' +
      '<div class="count">' + String(list.length).padStart(2, "0") + '</div></div>' +
      '<div class="grid">' + list.map(cardHTML).join("") + '</div>' +
    '</div></section>';
  });
  root.innerHTML = html;

  root.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.dataset.fav) return; // heart handled separately
      openSpotModal(card.dataset.id);
    });
    // let keyboard users open the card with Enter or Space too
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSpotModal(card.dataset.id); }
    });
  });
  root.querySelectorAll("[data-fav]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleSave(btn.dataset.fav, btn);
    });
  });

  initScrollAnimations();
}

async function toggleSave(spotId, btn) {
  if (!CURRENT_USER) {
    toast("Please log in to save spots.");
    setTimeout(function () { window.location.href = "login.html"; }, 900);
    return;
  }
  if (SAVED_SPOTS[spotId]) {
    await api("api/saved.php", "DELETE", { itemType: "spot", itemId: spotId });
    delete SAVED_SPOTS[spotId];
    if (btn) { btn.classList.remove("saved"); btn.innerHTML = ICONS.heart(false); }
    adjustSavedCount(-1);
    toast("Removed from saved.");
  } else {
    await api("api/saved.php", "POST", { itemType: "spot", itemId: spotId });
    SAVED_SPOTS[spotId] = true;
    if (btn) { btn.classList.add("saved"); btn.innerHTML = ICONS.heart(true); }
    adjustSavedCount(1);
    toast("Saved to My Trips!");
  }
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
    '<div class="modal-visual">' + visual +
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
        '<button class="btn btn-red btn-block" id="planBtn">Add to my trip</button>' +
      '</div>' +
      '<div id="suggestArea"></div>' +
    '</div>';

  openModal();
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

  toast("Tour added to My Trips!");
  // Swap the form for a confirmation so the user can go straight to their
  // trip or simply close - they are never forced to look at the suggestions.
  const s = spotById(spotId);
  const box = document.querySelector(".book-box");
  if (box) {
    box.outerHTML =
      '<div class="book-box"><div class="book-ok"><div class="check">' + ICONS.checkBig + '</div>' +
      '<h3>Added to your trip</h3>' +
      '<p>' + escapeHtml(s.name) + ' · ' + formatDate(date) + ' · ' + people + ' person(s)</p>' +
      '<div class="book-actions">' +
        '<a href="trips.html" class="btn btn-red">View My Trips</a>' +
        '<button class="btn btn-ghost" id="laterBtn">Maybe later</button>' +
      '</div></div></div>';
    document.getElementById("laterBtn").addEventListener("click", closeModal);
  }
  showSuggestions(res.data.suggestions, "You might also like", "Hotels near this spot, only if you still need a place to stay.");
}

// Builds the "nearby" list shown after planning a tour (hotels near the spot).
function showSuggestions(suggestions, title, hint) {
  const area = document.getElementById("suggestArea");
  if (!area || !suggestions || !suggestions.items.length) return;
  const items = suggestions.items.map(function (it) {
    const meta = it.town + " · ₱" + it.price + "/night";
    return '<div class="suggest-item">' +
      '<div class="suggest-thumb" style="background:var(--blue)"></div>' +
      '<div class="suggest-meta"><div class="n">' + escapeHtml(it.name) + '</div>' +
        '<div class="d">' + escapeHtml(meta) + '</div></div>' +
      '<div class="suggest-dist">' + distText(it.distanceKm) + '</div>' +
    '</div>';
  }).join("");
  area.innerHTML = '<div class="suggest"><h4>' + title + ' <span class="optional">Optional</span></h4>' +
    '<p class="hint">' + hint + '</p>' +
    '<div class="suggest-list">' + items + '</div>' +
    '<a href="hotels.html" class="btn btn-blue btn-block" style="margin-top:14px">Browse all hotels</a></div>';
  area.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Fade the cards in as they scroll into view.
function initScrollAnimations() {
  revealOnScroll(".cat-block .card");
}

// "Where to stay" teaser - a few featured hotels that link to the hotels page.
function renderStayTeaser(hotels) {
  const grid = document.getElementById("stayGrid");
  if (!grid) return;
  const featured = hotels.slice(0, 4);
  grid.innerHTML = featured.map(function (h) {
    return '<article class="card reveal" data-hotel="' + h.id + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(h.name) + '">' +
      '<div class="card-visual"><div class="ph" style="background:var(--blue)"></div>' +
        '<span class="card-type">' + escapeHtml(h.type) + '</span></div>' +
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
    const go = function () { window.location.href = "hotels.html?hotel=" + card.dataset.hotel; };
    card.addEventListener("click", go);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
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

  if (CURRENT_USER) {
    const saved = await api("api/saved.php");
    (saved.data.items || []).forEach(function (it) {
      if (it.type === "spot") SAVED_SPOTS[it.data.id] = true;
    });
  }

  const res = await api("api/spots.php");
  DATA = res.data;
  renderCatalog();

  // featured hotels teaser below the spots
  const hotelRes = await api("api/hotels.php");
  renderStayTeaser(hotelRes.data.hotels || []);

  // If we arrived from a saved item (e.g. /?spot=spot-1), open it right away.
  const wanted = new URLSearchParams(window.location.search).get("spot");
  if (wanted && spotById(wanted)) openSpotModal(wanted);

  setTimeout(function () { document.getElementById("loader").classList.add("hide"); }, 700);
});
