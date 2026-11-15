<?php
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = '127.0.0.1';
    $dbName = 'AlifStore';
    $username = 'root';
    $password = '';
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $host, $dbName);

    try {
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        die('Gagal koneksi database: ' . $e->getMessage());
    }

    return $pdo;
}
