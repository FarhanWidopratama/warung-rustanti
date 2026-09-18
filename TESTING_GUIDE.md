# 🧪 Testing Guide - Tracking Page

## ✅ Yang Udah Selesai:

1. ✅ **Checkout Page** - Form lengkap dengan payment & upload bukti
2. ✅ **Tracking Page** - Real-time order tracking
3. ✅ **Database** - Siap dengan semua kolom & storage

---

## 🧪 Cara Test Flow Lengkap:

### 1. Test Checkout (Cash Payment)

1. **Buka**: http://localhost:3000/menu
2. **Tambah beberapa item** ke cart (klik tombol `+`)
3. **Klik** tombol floating cart di bawah: `Lihat Keranjang`
4. **Isi form**:
   - Nama: `Budi Santoso`
   - HP: `08123456789`
   - Tipe: Pilih `Makan di Tempat` atau `Bungkus`
   - Pembayaran: Pilih `Cash`
5. **Klik** `Konfirmasi Pesanan`
6. **Lihat success screen** dengan:
   - Nomor pesanan: `ORD-xxxxx`
   - Tracking code: `ABC12XYZ` (8 karakter random)
   - Status: "Silakan Bayar di Kasir"
7. **Klik** `Lacak Pesanan`

### 2. Test Tracking Page

Setelah checkout, kamu akan diredirect ke tracking page.

**Atau akses manual:**
- URL: `http://localhost:3000/track/ABC12XYZ?phone=08123456789`
- Ganti `ABC12XYZ` dengan tracking code yang muncul di success screen

**Yang bisa dilihat:**
- ✅ Tracking code besar di atas
- ✅ Progress bar (warna orange/hijau)
- ✅ Status pesanan saat ini
- ✅ Info customer (nama, HP, tipe, pembayaran)
- ✅ Detail pesanan (items + total)
- ✅ Timeline status (checklist hijau untuk status yang sudah lewat)
- ✅ Tombol `Refresh Status` dan `Kembali ke Menu`

### 3. Test Real-Time Update (Manual)

1. **Buka Supabase Dashboard** → **Table Editor** → **orders**
2. **Cari order** yang baru dibuat (pakai tracking code)
3. **Edit status** dari `pending` ke `confirmed`
4. **Balik ke tracking page** → status **otomatis update!** ✨

Status yang bisa dicoba:
- `pending` → Menunggu Pembayaran (20%)
- `confirmed` → Pembayaran Diterima (50%)
- `cooking` → Sedang Dimasak (70%)
- `ready` → Siap Diambil (90%)
- `completed` → Selesai (100%)

---

## 🧪 Test QRIS Payment (Optional)

**Note:** QRIS image belum ada, jadi akan muncul "QRIS belum diatur"

1. **Checkout** seperti biasa
2. **Pilih pembayaran:** `QRIS`
3. **Upload gambar random** (screenshot apa aja)
4. **Klik** `Konfirmasi Pesanan`
5. **Status:** `payment_review` (menunggu verifikasi)

---

## 🔍 Cek Data di Supabase

### Table `orders`:
```
- order_number: ORD-1234567890
- tracking_code: ABC12XYZ
- customer_name: Budi Santoso
- phone_number: 08123456789
- order_type: dine_in / takeaway
- payment_method: cash / qris
- payment_proof_url: https://... (kalau QRIS)
- status: pending
- items: [{"id":"1","name":"Nasi Goreng",...}]
```

### Storage `payment-proofs`:
Kalau upload bukti QRIS, foto tersimpan di bucket ini.

---

## 🐛 Troubleshooting

### Error: "Pesanan tidak ditemukan"
- ✅ Cek tracking code benar (8 karakter, huruf besar)
- ✅ Cek nomor HP match dengan yang diinput saat checkout

### Status tidak update otomatis
- ✅ Tunggu 2-3 detik (real-time kadang delay)
- ✅ Klik tombol `Refresh Status` manual
- ✅ Cek console browser (F12) untuk error

### Image upload gagal
- ✅ Pastikan udah jalanin `supabase-storage-setup.sql`
- ✅ File size max 10MB sebelum kompress
- ✅ Format: jpg, jpeg, png

### Tracking page blank
- ✅ Cek URL ada `?phone=xxxxx` di belakang
- ✅ Cek order ada di Supabase table editor

---

## 📱 Test di HP (Local Network)

1. **Cek IP laptop:**
   ```powershell
   ipconfig
   # Cari "IPv4 Address" → contoh: 192.168.1.100
   ```

2. **Buka di HP:**
   ```
   http://192.168.1.100:3000/menu
   ```

3. **Pastikan HP & laptop di WiFi yang sama!**

---

## ✅ Fitur yang Sudah Jalan:

- ✅ Customer bisa pesan (cash/QRIS)
- ✅ Upload bukti bayar (kalau QRIS)
- ✅ Dapat tracking code
- ✅ Tracking real-time
- ✅ Auto-update status
- ✅ Data tersimpan ke database

## ⏳ Yang Belum:

- ⏳ Admin dashboard belum bisa verify payment
- ⏳ Admin settings (upload QRIS ibu)
- ⏳ TTS notification
- ⏳ Admin bisa update status dari dashboard

---

Mau lanjut bikin **Admin Dashboard Update** atau **Admin Settings** dulu? 🤔
