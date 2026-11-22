# Project-KEL4-Pemweb
# AlifStore

Aplikasi web layanan top-up Robux (Roblox) yang dibangun sebagai proyek akhir Praktikum Pemrograman Web, Program Studi Informatika, UPN "Veteran" Yogyakarta, Semester Ganjil 2026/2027.

AlifStore membantu pembeli memesan Robux lewat katalog yang jelas dan formulir pemesanan tanpa meminta kata sandi akun. Admin dapat mengelola produk dan memperbarui status pesanan dari dashboard terpisah. Proyek dibuat tanpa framework: HTML, CSS, JavaScript, PHP native, dan MySQL.

## Latar Belakang Singkat

Banyak pemain Roblox di Indonesia adalah pelajar yang belum memiliki metode pembayaran internasional, sehingga membeli Robux lewat penjual perorangan di media sosial atau grup chat. Cara ini rawan penipuan, pencurian akun, dan pencatatan yang tidak rapi. AlifStore dibuat sebagai simulasi layanan top-up yang lebih terstruktur dan transparan.

## Fitur

**Pelanggan**
- Registrasi dan login (nama, email, kata sandi minimal 8 karakter).
- Katalog paket Robux dengan harga yang seragam.
- Pemesanan: pilih paket, isi username Roblox, pilih metode pembayaran.
- Riwayat pesanan beserta status (`pending`, `processed`, `completed`, `cancelled`).
- Pencarian game, mode terang/gelap, dan flash sale dengan hitung mundur.

**Admin**
- Login lewat halaman terpisah.
- Dashboard ringkasan: produk aktif, total pesanan, pesanan `pending`, dan pesanan terbaru.
- Manajemen produk: tambah, ubah, atur stok, dan nonaktifkan (*soft delete*).
- Manajemen pesanan: lihat semua pesanan, ubah status, dan hapus pesanan yang dibatalkan.

**Teknis**
- Kata sandi disimpan dengan `password_hash()`.
- Autentikasi dan pembatasan peran (`customer` / `admin`) memakai session PHP.
- Query memakai *prepared statement*.
- Pembuatan pesanan memakai *database transaction* agar pesanan dan stok tetap konsisten.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | PHP (native) |
| Database | MySQL / MariaDB |
| Server lokal | XAMPP (Apache) |

## Struktur Proyek

```
├── frontend/
│   ├── index.html
│   └── js/              # main.js, auth.js, modal.js, render.js, data.js
└── backend/
    ├── admin/           # dashboard, products.php, orders.php, login/logout
    ├── api/             # auth.php, Products.php, order-create.php, order-status.php, order-delete.php
    ├── config/          # app.php, database.php
    ├── includes/        # auth.php, functions.php, response.php
    └── database/        # schema.sql
```

## Struktur Database

Database `AlifStore` terdiri dari tiga tabel:

- `users`: akun pelanggan dan admin (`role`: `customer` / `admin`).
- `products`: katalog paket Robux (`stock` bernilai `NULL` berarti tidak terbatas, `is_active` untuk *soft delete*).
- `orders`: transaksi pemesanan, berelasi ke `users` dan `products` lewat *foreign key*. Nama dan harga produk disalin saat pemesanan agar riwayat tidak berubah.

Skema lengkap ada di `backend/database/schema.sql`.

## Cara Menjalankan

1. Pasang [XAMPP](https://www.apachefriends.org/) lalu jalankan **Apache** dan **MySQL**.
2. Salin folder proyek ke `htdocs` (misalnya `C:\xampp\htdocs\alifstore`).
3. Buka phpMyAdmin dan impor `backend/database/schema.sql`.
4. Sesuaikan koneksi database di `backend/config/database.php` bila perlu.
5. Buat akun admin. Buat hash kata sandi dengan PHP:
   ```php
   <?php echo password_hash('kata-sandi-admin', PASSWORD_DEFAULT);
   ```
   lalu jalankan di phpMyAdmin:
   ```sql
   INSERT INTO users (name, email, password_hash, role)
   VALUES ('Administrator', 'admin@alifstore.test', 'HASH_DARI_LANGKAH_SEBELUMNYA', 'admin');
   ```
6. Buka aplikasi di browser:
   - Toko: `http://localhost/alifstore/frontend/index.html`
   - Admin: `http://localhost/alifstore/backend/admin/login.php`

> Sesuaikan nama folder pada URL dengan nama folder proyek Anda di `htdocs`.

## Batasan

Proyek ini adalah simulasi untuk keperluan praktikum:

- Belum terintegrasi dengan *payment gateway*. Metode pembayaran hanya dicatat pada pesanan, dan status diubah manual oleh admin.
- Pengiriman Robux tidak dilakukan otomatis.
- Leaderboard, daftar game, statistik, dan rating masih berupa data statis. Hanya produk Robux di database yang bisa dipesan.
- Tidak ada fitur unggah file (gambar produk lewat URL), verifikasi email, atau lupa kata sandi.
- Perlindungan CSRF baru tersedia sebagai fungsi bantu dan belum diterapkan di semua form dan API.
- Nomor WhatsApp dan tautan media sosial masih placeholder.

## Tim

| Nama | NIM |
|---|---|
| Fadhil Alif Rizky | 123250010 |
| Exel Dafa Rasyid | 123250036 |

Kelas IF-A, Praktikum Pemrograman Web IF 2026/2027.
