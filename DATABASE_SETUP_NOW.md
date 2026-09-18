# 🗄️ DATABASE SETUP - DO THIS NOW!

## ✅ Environment Variables - DONE! ✅
Server is running at: http://localhost:3000

Now you need to setup the database!

---

## 📝 3 SQL FILES TO RUN:

### 1️⃣ BASE SCHEMA (Main Tables)
**File:** `supabase-schema.sql`

**What it does:**
- Creates `menu_items` table
- Creates `orders` table
- Creates `settings` table
- Inserts sample menu (15 items)
- Sets up permissions (RLS)

**How to run:**
1. Open: https://supabase.com/dashboard/project/ejfsfabpdsuzmykeqump/sql/new
2. Open file: `supabase-schema.sql`
3. Copy ALL content (Ctrl+A, Ctrl+C)
4. Paste in SQL Editor
5. Click "Run" (or F5)
6. Wait for "Success!" ✅

---

### 2️⃣ PAYMENT MIGRATION (New Columns)
**File:** `supabase-migration-payment.sql`

**What it does:**
- Adds payment columns (payment_method, payment_proof_url)
- Adds tracking columns (tracking_code, phone_number)
- Adds order_type (dine_in/takeaway)
- Creates tracking code generator function

**How to run:**
1. Same SQL Editor
2. Click "New query"
3. Open file: `supabase-migration-payment.sql`
4. Copy ALL content
5. Paste & Run
6. Wait for "Success!" ✅

---

### 3️⃣ STORAGE BUCKETS (Image Upload)
**File:** `supabase-storage-setup.sql`

**What it does:**
- Creates `payment-proofs` bucket (for customer bukti bayar)
- Creates `qris-images` bucket (for QRIS ibu)
- Sets up public access permissions

**How to run:**
1. Same SQL Editor
2. Click "New query"
3. Open file: `supabase-storage-setup.sql`
4. Copy ALL content
5. Paste & Run
6. Wait for "Success!" ✅

---

## 🧪 VERIFICATION:

After running all 3 SQL files, check:

### Check Tables:
1. Go to: **Table Editor** (left sidebar)
2. You should see:
   - ✅ `menu_items` (15 rows)
   - ✅ `orders` (0 rows - empty, OK!)
   - ✅ `settings` (2 rows - qris_image_url, tts_enabled)

### Check Storage:
1. Go to: **Storage** (left sidebar)
2. You should see:
   - ✅ `payment-proofs` bucket
   - ✅ `qris-images` bucket

---

## 🚀 AFTER SETUP:

**Test the app:**
1. **Menu:** http://localhost:3000/menu
2. **Add items** → Checkout
3. **Submit order**
4. **Check Supabase Table Editor** → orders table
5. **Should see 1 row!** ✅

**If you see the order in Supabase → SUCCESS! 🎉**

---

## 🐛 TROUBLESHOOTING:

### SQL Error: "relation already exists"
- **Solution:** Already created! Safe to ignore or use `CREATE TABLE IF NOT EXISTS`

### SQL Error: "permission denied"
- **Solution:** Check you're logged in to correct Supabase project

### Storage Error: "bucket already exists"
- **Solution:** Already created! Check Storage tab, should see buckets

### Order not showing in Supabase after checkout:
- **Solution:** 
  - Check console (F12) for errors
  - Verify .env.local has correct credentials
  - Restart server: Ctrl+C, then `npm run dev`

---

## 📊 SQL FILES LOCATION:

All in project root:
- `supabase-schema.sql` ← Run FIRST
- `supabase-migration-payment.sql` ← Run SECOND
- `supabase-storage-setup.sql` ← Run THIRD

---

## ✅ CHECKLIST:

- [ ] SQL #1: Base schema executed
- [ ] SQL #2: Migration executed  
- [ ] SQL #3: Storage buckets created
- [ ] Verified tables in Table Editor
- [ ] Verified buckets in Storage
- [ ] Tested order creation
- [ ] Order appears in Supabase

**When all checked → You're READY! 🎉**

---

**Need help?** Screenshot any errors and share!
