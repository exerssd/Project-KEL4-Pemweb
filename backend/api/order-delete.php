<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST')
    json_response(['message' => 'Metode permintaan tidak diizinkan.'], 405);

$user = require_login('customer');
$data = request_data();
$orderId = (int) ($data['order_id'] ?? 0);

if ($orderId < 1)
    json_response(['message' => 'Pesanan tidak valid.'], 422);

$stmt = db()->prepare(
    "DELETE FROM orders
     WHERE id = ? AND user_id = ? AND status = 'cancelled'"
);
$stmt->execute([$orderId, $user['id']]);

if ($stmt->rowCount() === 0)
    json_response(['message' => 'Pesanan tidak ditemukan atau belum dibatalkan.'], 404);

json_response(['message' => 'Pesanan berhasil dihapus.']);
