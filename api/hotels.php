<?php
require __DIR__ . "/db.php";

$rows = $pdo->query(
    "SELECT h.id, h.name, h.type, h.price, h.rating, h.about, h.amenities, h.image,
            t.name AS town, t.lat, t.lng
     FROM hotels h JOIN towns t ON h.town_id = t.id
     ORDER BY h.id"
)->fetchAll();

$hotels = [];
foreach ($rows as $r) {
    $hotels[] = [
        "id" => (int)$r["id"],
        "name" => $r["name"],
        "town" => $r["town"],
        "type" => $r["type"],
        "price" => (int)$r["price"],
        "rating" => (float)$r["rating"],
        "about" => $r["about"],
        "amenities" => $r["amenities"],
        "image" => $r["image"],
        "lat" => (float)$r["lat"],
        "lng" => (float)$r["lng"]
    ];
}

json_out(["hotels" => $hotels]);
?>
