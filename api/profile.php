<?php
require __DIR__ . "/db.php";
$userId = require_login();

$data = body();
$name = trim($data["name"] ?? "");
$email = strtolower(trim($data["email"] ?? ""));
$password = $data["password"] ?? "";
$confirm = $data["confirm"] ?? "";

if ($name === "" || $email === "") {
    json_out(["error" => "Please enter your name and email."], 400);
}

// make sure the email isn't used by a different account.
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id <> ?");
$stmt->execute([$email, $userId]);
if ($stmt->fetch()) {
    json_out(["error" => "That email is already used by another account."], 400);
}

$pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?")->execute([$name, $email, $userId]);

// optional password change.
if ($password !== "") {
    $missing = password_problems($password);
    if (count($missing) > 0) {
        json_out(["error" => "Your new password still needs " . implode(", ", $missing) . "."], 400);
    }
    if ($password !== $confirm) {
        json_out(["error" => "The new passwords do not match."], 400);
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$hash, $userId]);
}

json_out(["user" => ["id" => (int)$userId, "name" => $name, "email" => $email]]);
?>
