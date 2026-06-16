<?php
require __DIR__ . "/db.php";
$userId = require_login();

$data = body();
$bookingId = (int)($data["bookingId"] ?? 0);

$stmt = $pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ?");
$stmt->execute([$bookingId, $userId]);

json_out(["ok" => true]);
?>
