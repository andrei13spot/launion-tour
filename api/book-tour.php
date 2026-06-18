<?php
require __DIR__ . "/db.php";
$userId = require_login();

$data = body();
$spotId = (int)($data["spotId"] ?? 0);
$date = $data["date"] ?? "";
$people = max(1, (int)($data["people"] ?? 1));

// find the spot (with its town + coordinates).
$stmt = $pdo->prepare(
    "SELECT s.id, s.name, t.name AS town, t.lat, t.lng
     FROM spots s JOIN towns t ON s.town_id = t.id WHERE s.id = ?"
);
$stmt->execute([$spotId]);
$spot = $stmt->fetch();
if (!$spot) json_out(["error" => "Spot not found."], 404);

if ($date === "") json_out(["error" => "Please pick a date."], 400);
if ($date < date("Y-m-d")) json_out(["error" => "Please pick a date that isn't in the past."], 400);

// don't let the same user plan the same spot twice on the same date.
$stmt = $pdo->prepare(
    "SELECT id FROM bookings
     WHERE user_id = ? AND kind = 'tour' AND item_id = ? AND tour_date = ? AND status = 'confirmed'
     LIMIT 1"
);
$stmt->execute([$userId, $spot["id"], $date]);
if ($stmt->fetch()) {
    json_out(["error" => "You already have this tour planned for that date."], 409);
}

$stmt = $pdo->prepare(
    "INSERT INTO bookings (user_id, kind, item_id, item_name, town, tour_date, people, status)
     VALUES (?, 'tour', ?, ?, ?, ?, ?, 'confirmed')"
);
$stmt->execute([$userId, $spot["id"], $spot["name"], $spot["town"], $date, $people]);
$bookingId = (int)$pdo->lastInsertId(); // grab this before running other queries

// suggest hotels near the spot.
$suggestions = ["items" => nearby_hotels($pdo, (float)$spot["lat"], (float)$spot["lng"], 4)];

json_out([
    "ok" => true,
    "bookingId" => $bookingId,
    "suggestions" => $suggestions
]);
?>
