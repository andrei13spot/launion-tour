// logic for the My Trips dashboard (bookings + saved items).

let BOOKINGS = [];           // the user's bookings, kept so we can open details
let SPOT_MAP = {};           // spotId  -> spot object
let HOTEL_MAP = {};          // hotelId -> hotel object

// returns the "what to bring" and "good to know" tips for a booking, based
// on whether it's a hotel or what kind of tourist spot it is.
function travellerTips(booking) {
  if (booking.kind === "hotel") {
    return {
      bring: ["A valid ID for check-in", "Your booking reference", "Comfortable clothes and swimwear", "Personal toiletries"],
      know: ["Check-in is usually 2:00 PM and check-out 12:00 noon", "Call the front desk for early check-in or extra guests", "Some amenities may need to be reserved ahead"]
    };
  }
  const spot = SPOT_MAP[booking.item_id];
  const cat = spot ? spot.category : "";
  if (cat === "beaches") {
    return {
      bring: ["Sunscreen and a hat", "Swimwear and a towel", "Drinking water and snacks", "A dry bag for your phone", "Cash for entrance or parking fees"],
      know: ["Best visited early morning or late afternoon", "Mind the tides and currents", "Please take your trash home with you"]
    };
  }
  if (cat === "mountains") {
    return {
      bring: ["Sturdy hiking shoes", "Plenty of water", "A light rain jacket", "A flashlight for the caves", "Trail snacks"],
      know: ["A local guide or barangay registration may be required", "Start early to avoid the afternoon heat", "Check the weather before you go"]
    };
  }
  if (cat === "food") {
    return {
      bring: ["Cash and card", "An appetite for Ilocano food", "A reservation if you're a big group"],
      know: ["Call ahead on weekends and holidays", "Try the house specialty", "Peak meal hours can get busy"]
    };
  }
  // culture, landmarks, and everything else
  return {
    bring: ["Comfortable walking shoes", "A camera", "Small cash for entrance or donation", "Modest clothing for religious sites"],
    know: ["Be respectful at religious and heritage sites", "Photography may be limited indoors", "Opening hours can change on holidays"]
  };
}

// small inline icons (no emojis) for the booking type.
const ICON_HOTEL = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18V9a1 1 0 0 1 1-1h11a4 4 0 0 1 4 4v6"/><path d="M3 14h18"/><path d="M3 18v2M21 18v2"/></svg>';
const ICON_TOUR = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>';

let bookingFilter = { status: "all", type: "all" };

function bookingRow(b) {
  const isHotel = b.kind === "hotel";
  const icon = isHotel ? ICON_HOTEL : ICON_TOUR;
  // show the real photo when we have it, falling back to the type icon.
  const item = isHotel ? HOTEL_MAP[b.item_id] : SPOT_MAP[b.item_id];
  const visual = (item && item.image)
    ? '<img class="booking-thumb" src="' + item.image + '" alt="' + escapeHtml(b.item_name) + '" loading="lazy"/>'
    : '<div class="booking-icon ' + (isHotel ? "hotel" : "tour") + '">' + icon + '</div>';
  let meta, side;
  if (isHotel) {
    meta = b.town + " · " + formatDate(b.checkin) + " → " + formatDate(b.checkout) + " · " + (b.guests || 1) + " guest(s)";
    side = '<div class="price">₱' + (b.total || 0).toLocaleString() + '</div>';
  } else {
    meta = b.town + " · " + formatDate(b.tour_date) + " · " + (b.people || 1) + " person(s)";
    side = '<div class="price" style="color:var(--blue)">Tour</div>';
  }
  const statusClass = b.status === "cancelled" ? "status-cancelled" : "status-confirmed";

  // the whole card opens the detail modal; cancel/remove lives inside that modal.
  return '<div class="booking-card" data-open="' + b.id + '" style="cursor:pointer">' +
    visual +
    '<div class="booking-info">' +
      '<div class="t">' + escapeHtml(b.item_name) + '</div>' +
      '<div class="m">' + escapeHtml(meta) + '</div>' +
      '<span class="status-pill ' + statusClass + '">' + b.status + '</span>' +
      '<span style="color:var(--blue);font-size:.76rem;font-weight:700;margin-left:8px">View details &rarr;</span>' +
    '</div>' +
    '<div class="booking-side">' + side + '</div>' +
  '</div>';
}

// one row of filter chips (status or type) for the bookings list.
function filterChips(group, opts) {
  return '<div class="trip-fgroup">' + opts.map(function (o) {
    return '<button class="trip-chip' + (bookingFilter[group] === o[0] ? " active" : "") +
      '" data-fgroup="' + group + '" data-fval="' + o[0] + '">' + o[1] + '</button>';
  }).join("") + '</div>';
}

function renderBookings(bookings) {
  const panel = document.getElementById("panel-bookings");
  if (!bookings.length) {
    panel.innerHTML = '<div class="empty">No bookings yet.<br/>' +
      '<a href="index.html" style="color:var(--blue);font-weight:700">Start planning a trip</a></div>';
    return;
  }
  panel.innerHTML =
    '<div class="trip-filters">' +
      filterChips("status", [["all", "All"], ["confirmed", "Confirmed"], ["cancelled", "Cancelled"]]) +
      filterChips("type", [["all", "All"], ["hotel", "Hotels"], ["tour", "Tourist spots"]]) +
    '</div>' +
    '<div id="bookingList"></div>';
  panel.querySelectorAll("[data-fgroup]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      const group = chip.dataset.fgroup;
      bookingFilter[group] = chip.dataset.fval;
      panel.querySelectorAll('[data-fgroup="' + group + '"]').forEach(function (c) {
        c.classList.toggle("active", c.dataset.fval === chip.dataset.fval);
      });
      applyBookingFilters();
    });
  });
  applyBookingFilters();
}

// filters BOOKINGS by the chosen status + type and renders the rows.
function applyBookingFilters() {
  const listEl = document.getElementById("bookingList");
  if (!listEl) return;
  const list = BOOKINGS.filter(function (b) {
    return (bookingFilter.status === "all" || b.status === bookingFilter.status) &&
           (bookingFilter.type === "all" || b.kind === bookingFilter.type);
  });
  if (!list.length) {
    listEl.innerHTML = '<div class="empty">No bookings match this filter.</div>';
    return;
  }
  listEl.innerHTML = list.map(bookingRow).join("");
  listEl.querySelectorAll("[data-open]").forEach(function (card) {
    card.addEventListener("click", function () {
      openBookingModal(parseInt(card.dataset.open, 10));
    });
  });
}

// detail row used inside the booking modal.
function bRow(key, value, link) {
  if (!value || value === "N/A") return "";
  let v = escapeHtml(value);
  if (link === "tel") v = '<a href="tel:' + value.replace(/\s/g, "") + '">' + escapeHtml(value) + '</a>';
  return '<div class="mrow"><span class="k">' + key + '</span><span class="v">' + v + '</span></div>';
}

function openBookingModal(bookingId) {
  const b = BOOKINGS.find(function (x) { return x.id === bookingId; });
  if (!b) return;
  const isHotel = b.kind === "hotel";
  const item = isHotel ? HOTEL_MAP[b.item_id] : SPOT_MAP[b.item_id];
  const color = isHotel ? "var(--blue)" : (item ? (CAT_COLOR[item.category] || "var(--blue)") : "var(--blue)");
  // use the real photo when the spot/hotel has one, so it matches the other popups.
  const visual = (item && item.image)
    ? '<img src="' + item.image + '" alt="' + escapeHtml(b.item_name) + '"/>'
    : '<div class="ph" style="background:' + color + '"></div>';
  const tips = travellerTips(b);

  // practical info rows differ for hotels vs tours
  let rows = "";
  if (isHotel) {
    rows =
      bRow("Where", b.town + ", La Union") +
      bRow("Check-in", formatDate(b.checkin)) +
      bRow("Check-out", formatDate(b.checkout)) +
      bRow("Guests", String(b.guests || 1)) +
      bRow("Total", "₱ " + (b.total || 0).toLocaleString()) +
      (item ? bRow("Amenities", item.amenities) : "");
  } else {
    rows =
      bRow("Tour date", formatDate(b.tour_date)) +
      bRow("People", String(b.people || 1)) +
      (item ? bRow("Location", item.location) : bRow("Where", b.town + ", La Union")) +
      (item ? bRow("Hours", item.hours) : "") +
      (item ? bRow("Contact", item.phone, "tel") : "");
  }

  const bringList = tips.bring.map(function (t) { return "<li>" + ICONS.check + "<span>" + escapeHtml(t) + "</span></li>"; }).join("");
  const knowList = tips.know.map(function (t) { return "<li>" + ICONS.info + "<span>" + escapeHtml(t) + "</span></li>"; }).join("");

  document.getElementById("modal").innerHTML =
    '<div class="modal-visual">' + visual +
      '<button class="modal-close" id="mClose" aria-label="Close">&times;</button></div>' +
    '<div class="modal-inner">' +
      '<span class="modal-type">' + (isHotel ? "Hotel Reservation" : "Tour Plan") + '</span>' +
      '<h3>' + escapeHtml(b.item_name) + '</h3>' +
      '<div class="modal-town">' + escapeHtml(b.town || "La Union") + ', La Union · ' + escapeHtml(b.status) + '</div>' +
      '<div class="modal-rows">' + rows + '</div>' +
      '<div class="tips" style="margin-top:20px">' +
        '<div class="tip-group tip-bring"><h5>What to bring</h5><ul>' + bringList + '</ul></div>' +
        '<div class="tip-group tip-know"><h5>Good to know</h5><ul>' + knowList + '</ul></div>' +
      '</div>' +
      (isHotel
        ? '<a href="index.html" class="btn btn-red btn-block" style="margin-top:22px">Browse tourist spots</a>'
        : '<a href="hotels.html" class="btn btn-blue btn-block" style="margin-top:22px">Browse hotels</a>') +
      '<button class="link-btn" id="bookingAction" style="display:block;margin:14px auto 0">' +
        (b.status === "cancelled" ? "Remove from my trips" : "Cancel this booking") +
      '</button>' +
    '</div>';

  openModal();
  document.getElementById("mClose").addEventListener("click", closeModal);

  // cancel (if confirmed) or remove (if already cancelled) right from the detail view.
  document.getElementById("bookingAction").addEventListener("click", function () {
    if (b.status === "cancelled") {
      confirmAction({
        title: "Remove this booking?",
        message: "This removes it from your list.",
        confirmText: "Remove",
        cancelText: "Cancel",
        onConfirm: async function () {
          await api("api/delete-booking.php", "POST", { bookingId: b.id });
          toast("Booking removed.");
          closeModal();
          load();
        }
      });
    } else {
      confirmAction({
        title: "Cancel this booking?",
        message: b.item_name,
        confirmText: "Cancel booking",
        cancelText: "Keep booking",
        onConfirm: async function () {
          await api("api/cancel-booking.php", "POST", { bookingId: b.id });
          toast("Booking cancelled.");
          closeModal();
          load();
        }
      });
    }
  });
}

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

function savedCard(item) {
  const d = item.data;
  const isHotel = item.type === "hotel";
  const color = isHotel ? "var(--blue)" : (CAT_COLOR[d.category] || "var(--blue)");
  const visual = d.image
    ? '<img src="' + d.image + '" alt="' + escapeHtml(d.name) + '" loading="lazy"/>'
    : '<div class="ph" style="background:' + color + '"></div>';
  const sub = isHotel
    ? ('<span class="peso">&#8369;</span> ' + d.price.toLocaleString() + ' <span style="color:var(--muted);font-weight:500">/night</span>')
    : ('<span style="color:var(--muted)">Tourist spot</span>');
  return '<article class="card" style="min-height:300px;opacity:1;transform:none;cursor:pointer" ' +
      'data-saved-type="' + item.type + '" data-saved-id="' + d.id + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(d.name) + '">' +
    '<div class="card-visual">' + visual +
      '<span class="card-type">' + escapeHtml(isHotel ? "Hotel" : d.type) + '</span>' +
      heartBtn(item.type, d.id, d.name) + '</div>' +
    '<div class="card-body">' +
      '<h4>' + escapeHtml(d.name) + '</h4>' +
      '<div class="card-town">' + escapeHtml(d.town) + ', La Union</div>' +
      '<div class="card-foot" style="margin-top:auto">' +
        '<span class="card-price">' + sub + '</span>' +
      '</div>' +
    '</div></article>';
}

function renderSaved(items) {
  const panel = document.getElementById("panel-saved");
  if (!items.length) {
    panel.innerHTML = '<div class="empty">Nothing saved yet.<br/>' +
      'Tap the heart on a spot or hotel to save it here.</div>';
    return;
  }
  panel.innerHTML = '<div class="grid">' + items.map(savedCard).join("") + '</div>';
  // open the item's details right here instead of navigating away.
  panel.querySelectorAll("[data-saved-id]").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("[data-save-id]")) return; // heart handled separately
      openSavedModal(card.dataset.savedType, card.dataset.savedId);
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSavedModal(card.dataset.savedType, card.dataset.savedId); }
    });
  });
  // the heart on each card removes it from saved, then refreshes the list.
  panel.querySelectorAll("[data-save-id]").forEach(function (btn) {
    btn.addEventListener("click", async function (e) {
      e.stopPropagation();
      e.preventDefault();
      const type = btn.dataset.saveType, id = btn.dataset.saveId;
      await api("api/saved.php", "DELETE", { itemType: type, itemId: id });
      delete SAVED[savedKey(type, id)];
      adjustSavedCount(-1);
      toast("Removed from saved.");
      load();
    });
  });
}

// shows a saved spot/hotel's full details in a modal, with a way to book it
// or remove it from the saved list.
function openSavedModal(type, id) {
  const isHotel = type === "hotel";
  const item = isHotel ? HOTEL_MAP[id] : SPOT_MAP[id];
  if (!item) { toast("Details are not available right now."); return; }
  const color = isHotel ? "var(--blue)" : (CAT_COLOR[item.category] || "var(--blue)");
  const visual = item.image
    ? '<img src="' + item.image + '" alt="' + escapeHtml(item.name) + '"/>'
    : '<div class="ph" style="background:' + color + '"></div>';

  let rows = "";
  if (isHotel) {
    rows = bRow("Price", "₱ " + item.price.toLocaleString() + " / night") +
           bRow("Rating", item.rating.toFixed(1) + " / 5") +
           bRow("Type", item.type) +
           bRow("Amenities", item.amenities);
  } else {
    const priceVal = (item.price && item.price !== "N/A")
      ? (/free/i.test(item.price) ? "Free" : "₱ " + item.price) : "Free / info on site";
    rows = bRow("Location", item.location) +
           bRow("Price", priceVal) +
           bRow("Hours", item.hours) +
           bRow("Phone", item.phone, "tel") +
           bRow("Email", item.email);
  }

  document.getElementById("modal").innerHTML =
    '<div class="modal-visual">' + visual + heartBtn(type, item.id, item.name) +
      '<button class="modal-close" id="mClose" aria-label="Close">&times;</button></div>' +
    '<div class="modal-inner">' +
      '<span class="modal-type">' + (isHotel ? "Saved Hotel" : "Saved Spot") + '</span>' +
      '<h3>' + escapeHtml(item.name) + '</h3>' +
      '<div class="modal-town">' + escapeHtml(item.town) + ', La Union</div>' +
      (item.about ? '<p class="modal-about">' + escapeHtml(item.about) + '</p>' : '') +
      '<div class="modal-rows">' + rows + '</div>' +
      (isHotel
        ? '<a href="hotels.html?hotel=' + item.id + '" class="btn btn-blue btn-block" style="margin-top:20px">Reserve now</a>'
        : '<a href="index.html?spot=' + item.id + '" class="btn btn-red btn-block" style="margin-top:20px">Book tour</a>') +
    '</div>';

  openModal();
  document.getElementById("mClose").addEventListener("click", closeModal);
  // the heart toggles saved (same as the homepage); refresh the list when changed.
  const heart = document.querySelector("#modal [data-save-id]");
  if (heart) {
    heart.addEventListener("click", async function (e) {
      e.stopPropagation();
      e.preventDefault();
      const on = await toggleSaved(type, item.id);
      if (on === null) return;
      heart.classList.toggle("saved", on);
      heart.innerHTML = ICONS.heart(on);
      load(); // refresh the saved list behind the modal
    });
  }
}

// tab switching
document.querySelectorAll(".tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("show"); });
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("show");
  });
});

async function load() {
  // load the spot/hotel catalogs once so we can show full details + tips.
  if (!Object.keys(SPOT_MAP).length) {
    const spots = await api("api/spots.php");
    (spots.data.spots || []).forEach(function (s) { SPOT_MAP[s.id] = s; });
    const hotels = await api("api/hotels.php");
    (hotels.data.hotels || []).forEach(function (h) { HOTEL_MAP[h.id] = h; });
  }
  const bookings = await api("api/bookings.php");
  BOOKINGS = bookings.data.bookings || [];
  renderBookings(BOOKINGS);
  const saved = await api("api/saved.php");
  renderSaved(saved.data.items || []);
}

window.addEventListener("load", async function () {
  setupNavToggle();
  await loadUser();
  // this page needs a login - send guests to the login page.
  if (!CURRENT_USER) {
    window.location.href = "login.html";
    return;
  }
  renderNavUser();
  await loadSaved(); // so the heart on each saved card shows as filled
  document.getElementById("welcomeLine").innerHTML =
    "Welcome back, <span class=\"welcome-name\">" + escapeHtml(CURRENT_USER.name) +
    "</span>! Here are your saved spots and bookings.";
  await load();

  // if we came from the Saved icon in the nav, open the Saved tab.
  if (new URLSearchParams(window.location.search).get("tab") === "saved") {
    const savedTab = Array.from(document.querySelectorAll(".tab")).find(function (t) { return t.dataset.tab === "saved"; });
    if (savedTab) savedTab.click();
  }

  setTimeout(function () { document.getElementById("loader").classList.add("hide"); }, 400);
});
