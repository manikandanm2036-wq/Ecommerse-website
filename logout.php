<?php
require_once '../includes/functions.php';

session_start();
session_destroy();

$functions->jsonResponse([
    'success' => true,
    'message' => 'Logged out successfully'
]);
?>