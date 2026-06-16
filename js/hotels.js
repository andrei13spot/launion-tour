// Hotels page logic: list the hotels, open a reservation modal, and after
// booking, suggest tourist spots that are near the hotel.

let HOTELS = [];
let SAVED_HOTELS = {};

function hotelById(id) {
  return HOTELS.find(function (h) { return h.id === id; });
}

function hotelCard(h) {
  const visual = h.image
    ? '<img src="' + h.image + '" alt="' + escapeHtml(h.name) + '" loading="lazy"/>'
    : '<div class="ph" style="background:var(--blue)"></div>';
  const heartClass = SAVED_HOTELS[h.id] ? "badge-fav saved" : "badge-fav";
  const heart = ICONS.heart(!!SAVED_HOTELS[h.id]);
  return '<article class="card reveal" data-id="' + h.id + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(h.name) + '">' +
    '<div class="card-visual">' + visual +
      '<span class="card-type">' + escapeHtml(h.type) + '</span>' +
      '<button class="' + heartClass + '" data-fav="' + h.id + '" aria-label="Save ' + escapeHtml(h.name) + '">' + heart + '</button>' +
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
      if (e.target.dataset.fav) return;
      openHotelModal(card.dataset.id);
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openHotelModal(card.dataset.id); }
    });
  });
  grid.querySelectorAll("[data-fav]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleSaveHotel(btn.dataset.fav, btn);
    });
  });
  revealCards();
}

function revealCards() {
  revealOnScroll("#hotelGrid .card");
}

async function toggleSaveHotel(hotelId, btn) {
  if (!CURRENT_USER) {
    toast("Please log in to save hotels.");
    setTimeout(function () { window.location.href = "login.html"; }, 900);
    return;
  }
  if (SAVED_HOTELS[hotelId]) {
    await api("api/saved.php", "DELETE", { itemType: "hotel", itemId: hotelId });
    delete SAVED_HOTELS[hotelId];
    if (btn) { btn.classList.remove("saved"); btn.innerHTML = ICONS.heart(false); }
    adjustSavedCount(-1);
    toast("Removed from saved.");
  } else {
    await api("api/saved.php", "POST", { itemType: "hotel", itemId: hotelId });
    SAVED_HOTELS[hotelId] = true;
    if (btn) { btn.classList.add("saved"); btn.innerHTML = ICONS.heart(true); }
    adjustSavedCount(1);
    toast("Saved to My Trips!");
  }
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

  document.getElementById("modal").innerHTML =
    '<div class="modal-visual"><div class="ph" style="background:var(--blue)"></div>' +
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
        '<div class="book-total"><span>Price per night</span><span><b>₱' + h.price.toLocaleString() + '</b></span></div>' +
        '<button class="btn btn-blue btn-block" id="reserveBtn">Reserve now</button>' +
      '</div>' +
      '<div id="suggestArea"></div>' +
    '</div>';

  openModal();
  document.getElementById("mClose").addEventListener("click", closeModal);
  document.getElementById("reserveBtn").addEventListener("click", function () { reserveHotel(h.id); });

  // Keep check-out at least one day after check-in.
  document.getElementById("checkin").addEventListener("change", function () {
    const co = document.getElementById("checkout");
    const next = new Date(this.value);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().slice(0, 10);
    co.min = nextStr;
    if (co.value < nextStr) co.value = nextStr;
  });
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
  const box = document.querySelector(".book-box");
  if (box) {
    box.outerHTML =
      '<div class="book-box"><div class="book-ok"><div class="check">' + ICONS.checkBig + '</div>' +
      '<h3>Reservation confirmed</h3>' +
      '<p>' + res.data.nights + ' night(s) · Total ₱' + res.data.total.toLocaleString() + '</p>' +
      '<div class="book-actions">' +
        '<a href="trips.html" class="btn btn-blue">View My Trips</a>' +
        '<button class="btn btn-ghost" id="laterBtn">Maybe later</button>' +
      '</div></div></div>';
    document.getElementById("laterBtn").addEventListener("click", closeModal);
  }
  showSuggestions(res.data.suggestions, "You might also like", "Tourist spots near your hotel, only if you want to explore.");
}

// "Nearby" tourist spots shown after a reservation.
function showSuggestions(suggestions, title, hint) {
  const area = document.getElementById("suggestArea");
  if (!area || !suggestions || !suggestions.items.length) return;
  const items = suggestions.items.map(function (it) {
    const color = CAT_COLOR[it.category] || "var(--blue)";
    const meta = (it.town || "") + " · " + (it.type || "");
    return '<div class="suggest-item">' +
      '<div class="suggest-thumb" style="background:' + color + '"></div>' +
      '<div class="suggest-meta"><div class="n">' + escapeHtml(it.name) + '</div>' +
        '<div class="d">' + escapeHtml(meta) + '</div></div>' +
      '<div class="suggest-dist">' + distText(it.distanceKm) + '</div>' +
    '</div>';
  }).join("");
  area.innerHTML = '<div class="suggest"><h4>' + title + ' <span class="optional">Optional</span></h4>' +
    '<p class="hint">' + hint + '</p>' +
    '<div class="suggest-list">' + items + '</div>' +
    '<a href="index.html" class="btn btn-red btn-block" style="margin-top:14px">See all tourist spots</a></div>';
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

  if (CURRENT_USER) {
    const saved = await api("api/saved.php");
    (saved.data.items || []).forEach(function (it) {
      if (it.type === "hotel") SAVED_HOTELS[it.data.id] = true;
    });
  }

  const res = await api("api/hotels.php");
  HOTELS = res.data.hotels;
  renderHotels();

  // If we came from a saved hotel (e.g. /hotels.html?hotel=hotel-1), open it.
  const wanted = new URLSearchParams(window.location.search).get("hotel");
  if (wanted && hotelById(wanted)) openHotelModal(wanted);

  setTimeout(function () { document.getElementById("loader").classList.add("hide"); }, 600);
});
