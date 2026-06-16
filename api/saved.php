<?php
require __DIR__ . "/db.php";
$userId = require_login();

$method = $_SERVER["REQUEST_METHOD"];

// READ - list the user's saved spots and hotels, with full details.
if ($method === "GET") {
    $stmt = $pdo->prepare("SELECT item_type, item_id FROM saved_items WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    $items = [];
    foreach ($rows as $r) {
        if ($r["item_type"] === "spot") {
            $s = $pdo->prepare(
                "SELECT s.id, s.name, s.category, s.type, s.price, s.image, t.name AS town
                 FROM spots s JOIN towns t ON s.town_id = t.id WHERE s.id = ?"
            );
            $s->execute([$r["item_id"]]);
            $data = $s->fetch();
            if ($data) {
                $data["id"] = (int)$data["id"];
                $items[] = ["type" => "spot", "data" => $data];
            }
        } else {
            $h = $pdo->prepare(
                "SELECT h.id, h.name, h.type, h.price, h.image, t.name AS town
                 FROM hotels h JOIN towns t ON h.town_id = t.id WHERE h.id = ?"
            );
            $h->execute([$r["item_id"]]);
            $data = $h->fetch();
            if ($data) {
                $data["id"] = (int)$data["id"];
                $data["price"] = (int)$data["price"];
                $items[] = ["type" => "hotel", "data" => $data];
            }
        }
    }
    json_out(["items" => $items]);
}

// CREATE - save an item.
if ($method === "POST") {
    $data = body();
    $type = $data["itemType"] ?? "";
    $itemId = (int)($data["itemId"] ?? 0);
    if (!in_array($type, ["spot", "hotel"]) || $itemId <= 0) {
        json_out(["error" => "Bad save request."], 400);
    }
    $stmt = $pdo->prepare("INSERT IGNORE INTO saved_items (user_id, item_type, item_id) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $type, $itemId]);
    json_out(["ok" => true]);
}

// DELETE - remove a saved item.
if ($method === "DELETE") {
    $data = body();
    $type = $data["itemType"] ?? "";
    $itemId = (int)($data["itemId"] ?? 0);
    $stmt = $pdo->prepare("DELETE FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?");
    $stmt->execute([$userId, $type, $itemId]);
    json_out(["ok" => true]);
}

json_out(["error" => "Method not allowed."], 405);
?>
