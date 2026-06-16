<?php
require __DIR__ . "/db.php";

$data = body();
$email = strtolower(trim($data["email"] ?? ""));
$password = $data["password"] ?? "";

if ($email === "" || $password === "") {
    json_out(["error" => "Please enter your email and password."], 400);
}

$stmt = $pdo->prepare("SELECT id, name, email, password FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user["password"])) {
    json_out(["error" => "Wrong email or password."], 400);
}

$_SESSION["user_id"] = (int)$user["id"];
json_out(["user" => ["id" => (int)$user["id"], "name" => $user["name"], "email" => $user["email"]]]);
?>
