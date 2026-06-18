// hotels page logic: list the hotels, open a reservation modal, and after
// booking, suggest tourist spots that are near the hotel.

let HOTELS = [];

function hotelById(id) {
  // ids are numbers from the database but data-id attributes are strings.
  return HOTELS.find(function (h) { return String(h.id) === String(id); });
}

function hotelCard(h) {
  const visual = h.image
    ? '<img src="' + h.image + '" alt="' + escapeHtml(h.name) + '" loading="lazy"/>'
    : '<div class="ph" style="background:var(--blue)"></div>';
  return '<article class="card reveal" data-id="' + h.id + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(h.name) + '">' +
    '<div class="card-visual">' + visual +
      '<span class="card-type">' + escapeHtml(h.type) + '</span>' +
      heartBtn("hotel", h.id, h.name) +
    '</div>' +
    '<div class="card-body">' +
      '<h4>' + escapeHtml(h.name) + '</h4>' +
      '<div class="card-town">' + escapeHtml(h.town) + '</div>' +
      '<p class="card-about">' + escapeHtml(h.about) + '</p>' +
      '<div class="card-foot">' +
        '<span class="card-price"><span class="peso">&#8369;</span> ' + h.price.toLocaleString() + ' <span style="color:var(--muted);font-weight:500">/night</span></span>' +
        '<span class="card-rating">' + ICONS.star + ' ' + h.rating.toFixed(1) + '</span>' +
      '</div>' +
    '</div>' +
  '</article>';
}

function renderHotels() {
  const grid = document.getElementById("hotelGrid");
  grid.innerHTML = HOTELS.map(hotelCard).join("");
  document.getElementById("hotelCount").textContent = String(HOTELS.length).padStart(2, "0");
  grid.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("[data-save-id]")) return;
      openHotelModal(card.dataset.id);
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openHotelModal(card.dataset.id); }
    });
  });
  wireHearts(grid);
  revealCards();
}

// real-time search over the hotel cards.
function filterHotels(query) {
  const q = query.trim().toLowerCase();
  let anyVisible = false;
  document.querySelectorAll("#hotelGrid .card").forEach(function (card) {
    const h = hotelById(card.dataset.id);
    const hay = (h.name + " " + h.town + " " + h.type + " " + h.about + " " + h.amenities).toLowerCase();
    const hit = !q || hay.indexOf(q) !== -1;
    card.style.display = hit ? "" : "none";
    if (hit) { card.classList.add("in"); anyVisible = true; }
  });
  const noRes = document.getElementById("noResults");
  if (noRes) noRes.style.display = anyVisible ? "none" : "block";
}

function revealCards() {
  revealOnScroll("#hotelGrid .card");
}

function openHotelModal(hotelId) {
  const h = hotelById(hotelId);
  if (!h) return;

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const fmt = function (d) { return d.toISOString().slice(0, 10); };

  const amenities = h.amenities.split(",").map(function (a) {
    return '<span style="display:inline-block;background:var(--bg-soft);border:1px solid var(--line);' +
      'border-radius:20px;padding:5px 12px;font-size:.78rem;margin:0 6px 6px 0">' + escapeHtml(a.trim()) + '</span>';
  }).join("");

  const visual = h.image
    ? '<img src="' + h.image + '" alt="' + escapeHtml(h.name) + '"/>'
    : '<div class="ph" style="background:var(--blue)"></div>';

  document.getElementById("modal").innerHTML =
    '<div class="modal-visual">' + visual + heartBtn("hotel", h.id, h.name) +
      '<button class="modal-close" id="mClose" aria-label="Close">&times;</button></div>' +
    '<div class="modal-inner">' +
      '<span class="modal-type">' + escapeHtml(h.type) + '</span>' +
      '<h3>' + escapeHtml(h.name) + '</h3>' +
      '<div class="modal-town">' + escapeHtml(h.town) + ', La Union</div>' +
      '<div class="modal-rating"><span class="stars">' + ICONS.star + ' ' + h.rating.toFixed(1) + '</span> · ' +
        reviewsFor(h.name).toLocaleString() + ' reviews</div>' +
      '<p class="modal-about">' + escapeHtml(h.about) + '</p>' +
      '<div style="margin-bottom:6px">' + amenities + '</div>' +
      '<div class="book-box">' +
        '<h4>Reserve your stay</h4>' +
        '<div class="field-row">' +
          '<div class="field"><label for="checkin">Check-in</label><input type="date" id="checkin" value="' + fmt(today) + '" min="' + fmt(today) + '" /></div>' +
          '<div class="field"><label for="checkout">Check-out</label><input type="date" id="checkout" value="' + fmt(tomorrow) + '" min="' + fmt(tomorrow) + '" /></div>' +
        '</div>' +
        '<div class="field"><label for="guests">Guests</label><input type="number" id="guests" value="2" min="1" max="10" /></div>' +
        '<div class="book-total"><span>Total <span style="color:var(--muted);font-weight:500">(₱' + h.price.toLocaleString() + '/night)</span></span><span><b id="hTotal"></b></span></div>' +
        '<button class="btn btn-blue btn-block" id="reserveBtn">Reserve now</button>' +
      '</div>' +
      '<div id="suggestArea"></div>' +
    '</div>';

  openModal();
  wireHearts(document.getElementById("modal"));
  document.getElementById("mClose").addEventListener("click", closeModal);
  document.getElementById("reserveBtn").addEventListener("click", function () { reserveHotel(h.id); });

  const checkin = document.getElementById("checkin");
  const checkout = document.getElementById("checkout");
  const totalEl = document.getElementById("hTotal");
  // show the running total so the user sees the price before confirming.
  function refreshTotal() {
    const n = Math.round((new Date(checkout.value) - new Date(checkin.value)) / 86400000);
    totalEl.textContent = n >= 1 ? "₱" + (n * h.price).toLocaleString() + " · " + n + " night" + (n > 1 ? "s" : "") : "Pick valid dates";
  }
  checkin.addEventListener("change", function () {
    const next = new Date(this.value);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().slice(0, 10);
    checkout.min = nextStr;
    if (checkout.value < nextStr) checkout.value = nextStr;
    refreshTotal();
  });
  checkout.addEventListener("change", refreshTotal);
  refreshTotal();
}

async function reserveHotel(hotelId) {
  if (!CURRENT_USER) {
    toast("Please log in to make a reservation.");
    setTimeout(function () { window.location.href = "login.html"; }, 900);
    return;
  }
  const checkin = document.getElementById("checkin").value;
  const checkout = document.getElementById("checkout").value;
  const guests = parseInt(document.getElementById("guests").value, 10) || 1;

  const res = await api("api/book-hotel.php", "POST", {
    hotelId: hotelId, checkin: checkin, checkout: checkout, guests: guests
  });
  if (!res.ok) { toast(res.data.error || "Booking failed."); return; }

  toast("Reservation confirmed!");
  const ref = "ELYU-" + String(res.data.bookingId || 0).padStart(6, "0");
  const box = document.querySelector(".book-box");
  if (box) {
    box.outerHTML =
      '<div class="book-box"><div class="book-ok">' +
        '<span class="ok-badge">Confirmed</span>' +
        '<h3>Reservation confirmed</h3>' +
        '<p>' + res.data.nights + ' night(s) · Total ₱' + res.data.total.toLocaleString() + '</p>' +
        '<p class="ok-ref">Booking reference <b>' + ref + '</b></p>' +
        '<div class="book-actions">' +
          '<a href="trips.html" class="btn btn-blue">View My Trips</a>' +
          '<button class="btn btn-ghost" id="laterBtn">Close</button>' +
        '</div>' +
      '</div></div>';
    document.getElementById("laterBtn").addEventListener("click", closeModal);
  }
  showSuggestions(res.data.suggestions, "You might also like", "Tourist spots near your hotel.");
}

// clickable "nearby" tourist spots shown after a reservation.
function showSuggestions(suggestions, title, hint) {
  const area = document.getElementById("suggestArea");
  if (!area || !suggestions || !suggestions.items.length) return;
  const items = suggestions.items.map(function (it) {
    const color = CAT_COLOR[it.category] || "var(--blue)";
    const meta = (it.town || "") + " · " + (it.type || "");
    const thumb = it.image
      ? '<img class="suggest-thumb" src="' + it.image + '" alt="' + escapeHtml(it.name) + '" loading="lazy"/>'
      : '<div class="suggest-thumb" style="background:' + color + '"></div>';
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
    '<a href="index.html" class="btn btn-red btn-block" style="margin-top:14px">See all tourist spots</a></div>';
  // open the spot's details in place instead of navigating away.
  area.querySelectorAll(".suggest-item").forEach(function (el) {
    el.addEventListener("click", function () { openItemModal("spot", el.dataset.sid); });
  });
  area.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// modal helpers
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

window.addEventListener("load", async function () {
  setupNavToggle();
  await loadUser();
  renderNavUser();
  await loadSaved(); // shared saved state for the hearts

  const res = await api("api/hotels.php");
  HOTELS = res.data.hotels;
  HOTELS.forEach(function (h) { HOTELS_BY_ID[h.id] = h; });
  renderHotels();

  // load spots too so spot suggestions can open in place (no navigation).
  const spotRes = await api("api/spots.php");
  (spotRes.data.spots || []).forEach(function (s) { SPOTS_BY_ID[s.id] = s; });

  setupSearch({
    getItems: function () { return HOTELS; },
    onPick: function (id) { openHotelModal(id); },
    onFilter: function (q) { filterHotels(q); },
    chips: ["San Juan", "San Fernando City", "Beach Resort", "Hotel", "Bauang"],
    popular: ["Awesome Hotel", "Puerto de San Juan Beach Resort", "The Salt Boutique Hotel by Wyns"]
  });

  // if we came from the Hotels nav menu (e.g. hotels.html?q=Resort), pre-filter.
  const qParam = new URLSearchParams(window.location.search).get("q");
  if (qParam) {
    const si = document.getElementById("searchInput");
    if (si) { si.value = qParam; filterHotels(qParam); }
  }

  // if we came from a saved hotel (e.g. /hotels.html?hotel=hotel-1), open it.
  const wanted = new URLSearchParams(window.location.search).get("hotel");
  if (wanted && hotelById(wanted)) openHotelModal(wanted);

  setTimeout(function () { document.getElementById("loader").classList.add("hide"); }, 600);
});
