<?php
require __DIR__ . "/db.php";
$userId = require_login();

$stmt = $pdo->prepare(
    "SELECT id, kind, item_id, item_name, town, checkin, checkout, guests,
            tour_date, people, total, status
     FROM bookings WHERE user_id = ? ORDER BY created_at DESC"
);
$stmt->execute([$userId]);
$rows = $stmt->fetchAll();

foreach ($rows as &$r) {
    $r["id"] = (int)$r["id"];
    $r["item_id"] = (int)$r["item_id"];
    if ($r["guests"] !== null) $r["guests"] = (int)$r["guests"];
    if ($r["people"] !== null) $r["people"] = (int)$r["people"];
    if ($r["total"] !== null) $r["total"] = (int)$r["total"];
}
unset($r);

json_out(["bookings" => $rows]);
?>
