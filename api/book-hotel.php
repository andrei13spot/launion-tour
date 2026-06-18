<?php
require __DIR__ . "/db.php";
$userId = require_login();

$data = body();
$hotelId = (int)($data["hotelId"] ?? 0);
$checkin = $data["checkin"] ?? "";
$checkout = $data["checkout"] ?? "";
$guests = max(1, (int)($data["guests"] ?? 1));

// find the hotel (with its town + coordinates).
$stmt = $pdo->prepare(
    "SELECT h.id, h.name, h.price, t.name AS town, t.lat, t.lng
     FROM hotels h JOIN towns t ON h.town_id = t.id WHERE h.id = ?"
);
$stmt->execute([$hotelId]);
$hotel = $stmt->fetch();
if (!$hotel) json_out(["error" => "Hotel not found."], 404);

if ($checkin === "" || $checkout === "") json_out(["error" => "Please pick your dates."], 400);
if ($checkin < date("Y-m-d")) json_out(["error" => "Check-in can't be in the past."], 400);

$nights = (int)round((strtotime($checkout) - strtotime($checkin)) / 86400);
if ($nights < 1) json_out(["error" => "Check-out must be after check-in."], 400);

// don't let the same user double-book this hotel on overlapping dates.
$stmt = $pdo->prepare(
    "SELECT id FROM bookings
     WHERE user_id = ? AND kind = 'hotel' AND item_id = ? AND status = 'confirmed'
       AND checkin < ? AND checkout > ?
     LIMIT 1"
);
$stmt->execute([$userId, $hotel["id"], $checkout, $checkin]);
if ($stmt->fetch()) {
    json_out(["error" => "You already have a reservation at this hotel for those dates."], 409);
}

$total = $nights * (int)$hotel["price"];

$stmt = $pdo->prepare(
    "INSERT INTO bookings (user_id, kind, item_id, item_name, town, checkin, checkout, guests, total, status)
     VALUES (?, 'hotel', ?, ?, ?, ?, ?, ?, ?, 'confirmed')"
);
$stmt->execute([$userId, $hotel["id"], $hotel["name"], $hotel["town"], $checkin, $checkout, $guests, $total]);
$bookingId = (int)$pdo->lastInsertId(); // grab this before running other queries

// suggest tourist spots near the hotel.
$suggestions = ["items" => nearby_spots($pdo, (float)$hotel["lat"], (float)$hotel["lng"], 4)];

json_out([
    "ok" => true,
    "bookingId" => $bookingId,
    "nights" => $nights,
    "total" => $total,
    "suggestions" => $suggestions
]);
?>
