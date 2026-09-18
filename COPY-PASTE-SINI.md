# 📋 COPY-PASTE SQL FILES

## 🎯 3 Files Siap Copy!

---

## FILE 1: BASE SCHEMA ✅

**Location:** `SQL-FILE-1-SCHEMA.sql`

**Cara copy:**
1. Buka file `SQL-FILE-1-SCHEMA.sql`
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)
4. Buka Supabase SQL Editor: https://supabase.com/dashboard/project/ejfsfabpdsuzmykeqump/sql/new
5. Paste (Ctrl+V)
6. Run (F5 atau klik tombol Run)
7. Tunggu "Success!"

**What it creates:**
- ✅ menu_items table (15 items)
- ✅ orders table
- ✅ Permissions (RLS)

---

## FILE 2: MIGRATION ✅

**Location:** `SQL-FILE-2-MIGRATION.sql`

**Cara copy:**
1. Buka file `SQL-FILE-2-MIGRATION.sql`
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)
4. Supabase SQL Editor → New Query
5. Paste (Ctrl+V)
6. Run (F5)
7. Tunggu "Success!"

**What it creates:**
- ✅ Payment columns (payment_method, payment_proof_url)
- ✅ Tracking columns (tracking_code, phone_number)
- ✅ settings table
- ✅ Tracking code generator

---

## FILE 3: STORAGE ✅

**Location:** `SQL-FILE-3-STORAGE.sql`

**Cara copy:**
1. Buka file `SQL-FILE-3-STORAGE.sql`
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)
4. Supabase SQL Editor → New Query
5. Paste (Ctrl+V)
6. Run (F5)
7. Tunggu "Success!"

**What it creates:**
- ✅ payment-proofs bucket
- ✅ qris-images bucket
- ✅ Upload permissions

---

## ✅ VERIFICATION:

After running all 3:

**Check Tables:**
- Go to: Table Editor
- See: menu_items (15 rows), orders (0 rows), settings (2 rows)

**Check Storage:**
- Go to: Storage
- See: payment-proofs, qris-images buckets

---

## 🧪 TEST:

1. Go to: http://localhost:3000/menu
2. Add items → Checkout
3. Submit order
4. Check Supabase Table Editor → orders
5. Should see 1 row! ✅

---

**DONE!** 🎉
