<?php
require __DIR__ . "/db.php";

// Category labels/tags shown on the page.
$catMeta = [
    "beaches"   => ["label" => "Beaches & Falls",     "tag" => "SAND // SURF // CASCADES"],
    "mountains" => ["label" => "Caves & Mountains",   "tag" => "HIGHLANDS // CAVERNS // TRAILS"],
    "food"      => ["label" => "Restaurants",         "tag" => "FLAVOR // FEAST // COAST"],
    "culture"   => ["label" => "Culture & Landmarks", "tag" => "HISTORY // FAITH // HERITAGE"]
];
$order = ["beaches", "mountains", "food", "culture"];

$rows = $pdo->query(
    "SELECT s.id, s.name, s.category, s.type, s.about, s.location, s.price, s.hours,
            s.phone, s.email, s.image, t.name AS town, t.lat, t.lng
     FROM spots s JOIN towns t ON s.town_id = t.id
     ORDER BY s.id"
)->fetchAll();

$spots = [];
foreach ($rows as $r) {
    $spots[] = [
        "id" => (int)$r["id"],
        "name" => $r["name"],
        "town" => $r["town"],
        "category" => $r["category"],
        "categoryLabel" => $catMeta[$r["category"]]["label"] ?? $r["category"],
        "type" => $r["type"],
        "about" => $r["about"],
        "location" => $r["location"],
        "price" => $r["price"],
        "hours" => $r["hours"],
        "phone" => $r["phone"],
        "email" => $r["email"],
        "image" => $r["image"],
        "lat" => (float)$r["lat"],
        "lng" => (float)$r["lng"]
    ];
}

// Build the category list in the fixed order.
$categories = [];
foreach ($order as $cid) {
    $categories[] = [
        "id" => $cid,
        "label" => $catMeta[$cid]["label"],
        "tag" => $catMeta[$cid]["tag"]
    ];
}

json_out(["categories" => $categories, "spots" => $spots]);
?>
