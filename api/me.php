<?php
require __DIR__ . "/db.php";

if (empty($_SESSION["user_id"])) {
    json_out(["user" => null]);
}
$stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = ?");
$stmt->execute([$_SESSION["user_id"]]);
$user = $stmt->fetch();
if (!$user) {
    json_out(["user" => null]);
}
$user["id"] = (int)$user["id"];
json_out(["user" => $user]);
?>
