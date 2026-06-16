<?php
require __DIR__ . "/db.php";

// Cross-selling: nearby spots for a hotel, or nearby hotels for a spot.
$type = $_GET["type"] ?? "";
$id = (int)($_GET["id"] ?? 0);

if ($type === "hotel") {
    $stmt = $pdo->prepare(
        "SELECT t.lat, t.lng FROM hotels h JOIN towns t ON h.town_id = t.id WHERE h.id = ?"
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_out(["error" => "Hotel not found."], 404);
    json_out(["kind" => "spots", "items" => nearby_spots($pdo, (float)$row["lat"], (float)$row["lng"], 4)]);
}

if ($type === "spot") {
    $stmt = $pdo->prepare(
        "SELECT t.lat, t.lng FROM spots s JOIN towns t ON s.town_id = t.id WHERE s.id = ?"
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_out(["error" => "Spot not found."], 404);
    json_out(["kind" => "hotels", "items" => nearby_hotels($pdo, (float)$row["lat"], (float)$row["lng"], 4)]);
}

json_out(["error" => "Bad suggestion request."], 400);
?>
