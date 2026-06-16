<?php
// Shared database connection (PDO) and small helper functions.
// Every API file includes this first.

session_start();
header("Content-Type: application/json; charset=utf-8");

// Database settings. These match the dedicated user created by sql/setup.sql.
$DB_HOST = "127.0.0.1";
$DB_NAME = "launion_tour";
$DB_USER = "launion_user";
$DB_PASS = "LaUnion2026!";

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Could not connect to the database. Did you run sql/setup.sql?"]);
    exit;
}

// Send a JSON response and stop.
function json_out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Read the JSON body of a request into an array.
function body() {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Stop the request if nobody is logged in. Returns the user id otherwise.
function require_login() {
    if (empty($_SESSION["user_id"])) {
        json_out(["error" => "Please log in first."], 401);
    }
    return $_SESSION["user_id"];
}

// Password rules (same as the front-end checklist). Returns what's missing.
function password_problems($pw) {
    $missing = [];
    if (strlen($pw) < 8) $missing[] = "at least 8 characters";
    if (!preg_match('/[A-Z]/', $pw)) $missing[] = "an uppercase letter";
    if (!preg_match('/[a-z]/', $pw)) $missing[] = "a lowercase letter";
    if (!preg_match('/[0-9]/', $pw)) $missing[] = "a number";
    return $missing;
}

// Distance between two lat/lng points in kilometers (haversine).
function distance_km($lat1, $lng1, $lat2, $lng2) {
    $R = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat / 2) ** 2 + sin($dLng / 2) ** 2 * cos(deg2rad($lat1)) * cos(deg2rad($lat2));
    return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
}

// Nearest tourist spots to a point (used after booking a hotel).
function nearby_spots($pdo, $lat, $lng, $limit = 4) {
    $rows = $pdo->query(
        "SELECT s.id, s.name, s.category, s.type, s.image, t.name AS town, t.lat, t.lng
         FROM spots s JOIN towns t ON s.town_id = t.id"
    )->fetchAll();
    return rank_by_distance($rows, $lat, $lng, $limit);
}

// Nearest hotels to a point (used after planning a tour).
function nearby_hotels($pdo, $lat, $lng, $limit = 4) {
    $rows = $pdo->query(
        "SELECT h.id, h.name, h.type, h.price, h.rating, h.image, t.name AS town, t.lat, t.lng
         FROM hotels h JOIN towns t ON h.town_id = t.id"
    )->fetchAll();
    return rank_by_distance($rows, $lat, $lng, $limit);
}

// Sorts a list of rows (each with lat/lng) by closeness and tags on distanceKm.
function rank_by_distance($rows, $lat, $lng, $limit) {
    foreach ($rows as &$r) {
        $r["distanceKm"] = round(distance_km($lat, $lng, (float)$r["lat"], (float)$r["lng"]) * 10) / 10;
    }
    unset($r);
    usort($rows, function ($a, $b) {
        return $a["distanceKm"] <=> $b["distanceKm"];
    });
    return array_slice($rows, 0, $limit);
}
?>
