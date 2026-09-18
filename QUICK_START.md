# 🚀 Quick Start Guide

## You're Almost Ready!

Your Warung Bu Sri app is fully built and ready to connect to Supabase. Follow these 3 simple steps:

---

## Step 1: Create Supabase Project (5 minutes)

1. Go to **https://supabase.com** and sign in
2. Click **"New Project"**
3. Enter project name: **Warung Bu Sri**
4. Set a database password
5. Choose region closest to you
6. Click **"Create new project"** and wait ~2 minutes

---

## Step 2: Get Your Credentials (1 minute)

1. In Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in the left menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

## Step 3: Configure Your App (2 minutes)

### A. Update Environment Variables

Open `.env.local` in your project and paste your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

### B. Create Database Tables

1. In Supabase dashboard, click **SQL Editor**
2. Click **"New query"**
3. Open the file `supabase-schema.sql` from your project
4. Copy ALL the contents and paste into SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for "Success!" message

### C. Restart Your Server

```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

---

## 🎉 That's It! Test Your App

### Test 1: Create an Order
1. Open **http://localhost:3000/menu**
2. Add items to cart
3. Click **"Lihat Keranjang"**
4. Enter customer name
5. Click **"Lanjut ke Pembayaran"**
6. ✅ Order is saved to Supabase!

### Test 2: View in Admin Dashboard
1. Open **http://localhost:3000/admin**
2. ✅ Your order appears in "Pesanan Baru"!
3. Click **"Proses Pesanan"** → moves to "Sedang Diproses"
4. Click **"Selesai"** → moves to "Selesai"

### Test 3: Check in Supabase
1. Go to Supabase dashboard
2. Click **Table Editor** → **orders**
3. ✅ See your order saved in the database!

---

## 📚 Need More Help?

- **Complete Setup Guide:** See `SUPABASE_SETUP.md`
- **Integration Details:** See `INTEGRATION_SUMMARY.md`
- **Troubleshooting:** Check browser console (F12) for errors

---

## ⚡ Features You Now Have

✅ Orders saved to database permanently  
✅ Real-time admin dashboard updates  
✅ Order status tracking (pending → processing → completed)  
✅ Automatic timestamps  
✅ 15 menu items pre-loaded  
✅ Multi-admin support (multiple dashboards sync automatically)

---

## 🎯 What's Next?

Your app is production-ready! Optional enhancements:
- Add admin authentication
- Connect payment gateway
- Add WhatsApp notifications
- Print receipts
- Analytics dashboard

**Happy cooking! 🍜**
