<?php
require __DIR__ . "/db.php";
$_SESSION = [];
session_destroy();
json_out(["ok" => true]);
?>
