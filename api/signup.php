<?php
require __DIR__ . "/db.php";

$data = body();
$name = trim($data["name"] ?? "");
$email = strtolower(trim($data["email"] ?? ""));
$password = $data["password"] ?? "";
$confirm = $data["confirm"] ?? null;

if ($name === "" || $email === "" || $password === "") {
    json_out(["error" => "Please fill in all fields."], 400);
}

$missing = password_problems($password);
if (count($missing) > 0) {
    json_out(["error" => "Your password still needs " . implode(", ", $missing) . "."], 400);
}
if ($confirm !== null && $confirm !== $password) {
    json_out(["error" => "The passwords do not match."], 400);
}

// Is the email already taken?
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_out(["error" => "That email is already registered."], 400);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
$stmt->execute([$name, $email, $hash]);
$id = (int)$pdo->lastInsertId();

$_SESSION["user_id"] = $id;
json_out(["user" => ["id" => $id, "name" => $name, "email" => $email]]);
?>
