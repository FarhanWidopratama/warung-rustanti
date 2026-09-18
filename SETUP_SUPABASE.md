# 🗄️ Setup Supabase - Step by Step

## 1️⃣ Create Supabase Account

1. **Go to:** https://supabase.com
2. **Sign up** dengan GitHub atau email
3. **Free tier** (no credit card needed!)

---

## 2️⃣ Create New Project

1. **Click:** "New Project"
2. **Fill in:**
   - Name: `warung-bu-sri`
   - Database Password: (simpan password ini!)
   - Region: **Southeast Asia (Singapore)** ← closest to Indonesia!
3. **Click:** "Create new project"
4. **Wait ~2 minutes** untuk project ready

---

## 3️⃣ Get API Credentials

1. **Click:** Settings (gear icon) → API
2. **Copy these:**
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Paste ke `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 4️⃣ Create Database Tables

1. **Go to:** SQL Editor (left sidebar)
2. **Click:** "New query"
3. **Copy paste SQL dari:** `supabase/schema.sql`
4. **Click:** "Run" (atau F5)
5. **Wait for:** "Success. No rows returned"

**Then run migration:**
6. **New query** → Copy paste dari: `supabase/migration.sql`
7. **Run**

---

## 5️⃣ Create Storage Buckets

### Bucket 1: payment-proofs

1. **Go to:** Storage (left sidebar)
2. **Click:** "Create a new bucket"
3. **Settings:**
   - Name: `payment-proofs`
   - Public: ✅ **ON**
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg,image/png,image/jpg`
4. **Create bucket**

### Bucket 2: qris-images

1. **Click:** "Create a new bucket" again
2. **Settings:**
   - Name: `qris-images`
   - Public: ✅ **ON**
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg,image/png,image/jpg`
3. **Create bucket**

---

## 6️⃣ Enable Real-Time

1. **Go to:** Database → Replication (left sidebar)
2. **Find:** `orders` table
3. **Toggle ON:** Enable realtime
4. **Save**

---

## 7️⃣ Restart Development Server

```bash
# Stop server (Ctrl+C di terminal)
npm run dev
```

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] API credentials copied to `.env.local`
- [ ] `schema.sql` executed successfully
- [ ] `migration.sql` executed successfully
- [ ] `payment-proofs` bucket created (public)
- [ ] `qris-images` bucket created (public)
- [ ] Real-time enabled for `orders` table
- [ ] Server restarted

---

## 🧪 Test Connection

After setup, test by:

1. **Open:** http://localhost:3000/menu
2. **Add item to cart**
3. **Checkout** → fill form
4. **Submit order**
5. **Check Supabase Dashboard:**
   - Table Editor → orders → Should see 1 row! ✅

If you see the order in Supabase, **SUCCESS!** 🎉

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Double-check `.env.local` values
- Make sure no extra spaces
- Restart server after changing `.env.local`

### Error: "relation 'orders' does not exist"
- Run `schema.sql` in SQL Editor
- Check if tables appear in Table Editor

### Error: "The resource you are looking for could not be found"
- Check bucket names: `payment-proofs` & `qris-images`
- Make sure buckets are PUBLIC
- Check Storage policies

### Images not uploading
- Check bucket exists
- Check bucket is public
- Check file size (<10MB)
- Check MIME types allowed

---

## 📱 Production Setup (Later)

When ready to deploy:

1. **Create separate production project** in Supabase
2. **Update Vercel environment variables**
3. **Run SQL scripts** in production
4. **Create buckets** in production
5. **Test thoroughly!**

---

**Need help?** Check Supabase docs: https://supabase.com/docs
