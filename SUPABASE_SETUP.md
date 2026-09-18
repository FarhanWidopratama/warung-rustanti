# 🗄️ Supabase Setup Guide for Warung Bu Sri

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a free account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name:** Warung Bu Sri
   - **Database Password:** (create a strong password)
   - **Region:** Choose the closest region to you
5. Click **"Create new project"** and wait for it to initialize (~2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** under Project Settings
3. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (under "Project API keys")

## Step 3: Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

## Step 4: Run the SQL Schema

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase-schema.sql` from your project root
4. Copy the entire contents of the file
5. Paste it into the SQL Editor in Supabase
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see a success message and "Query successful" at the bottom

### What This Creates:

✅ **Tables:**
- `menu_items` - Stores all food items
- `orders` - Stores customer orders

✅ **Indexes** for better performance

✅ **Triggers** for auto-updating timestamps

✅ **Row Level Security (RLS)** policies for public access

✅ **15 sample menu items** already inserted

## Step 5: Verify the Setup

Run these verification queries in the SQL Editor:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('menu_items', 'orders');

-- Check menu items (should return 15)
SELECT COUNT(*) FROM menu_items;

-- Check orders (should return 0 initially)
SELECT COUNT(*) FROM orders;
```

## Step 6: Restart Your Development Server

1. Stop your Next.js dev server (Ctrl+C)
2. Start it again:

```bash
npm run dev
```

## Step 7: Test the Integration

### Test Order Creation:
1. Open [http://localhost:3000/menu](http://localhost:3000/menu)
2. Add items to your cart
3. Click **"Lihat Keranjang"**
4. Enter a customer name
5. Click **"Lanjut ke Pembayaran"**
6. You should see "Menyimpan Pesanan..." briefly

### Verify in Supabase:
1. Go to Supabase Dashboard
2. Click **"Table Editor"** → **"orders"**
3. You should see your order appear!

### Test Admin Dashboard:
1. Open [http://localhost:3000/admin](http://localhost:3000/admin)
2. You should see your orders in the "Pesanan Baru" column
3. Click **"Proses Pesanan"** to move it to "Sedang Diproses"
4. Click **"Selesai"** to mark it complete

## 🎉 Features Now Working:

✅ **Real-time order sync** - Orders appear instantly in admin dashboard
✅ **Persistent data** - All orders saved to database
✅ **Order status updates** - Track orders from pending → processing → completed
✅ **Automatic timestamps** - Created and updated times tracked automatically

## Troubleshooting

### Error: "Invalid API key"
- Double-check your `.env.local` file has the correct credentials
- Make sure there are no extra spaces or quotes
- Restart your dev server after updating `.env.local`

### Error: "relation 'orders' does not exist"
- Make sure you ran the SQL schema in Supabase SQL Editor
- Verify the query completed successfully

### Orders not appearing in admin dashboard
- Check browser console for errors (F12)
- Verify your Supabase credentials are correct
- Check the orders table in Supabase Table Editor

### RLS (Row Level Security) errors
- The schema includes public access policies
- If you see RLS errors, verify the policies were created correctly
- You can temporarily disable RLS for testing:
  ```sql
  ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
  ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
  ```

## Next Steps (Optional Enhancements)

- Add authentication for admin dashboard
- Implement menu item sync from Supabase (currently uses local data)
- Add order history view for customers
- Implement stock management sync with database
- Add real-time notifications for new orders

## Support

If you encounter any issues, check:
1. Browser console (F12) for JavaScript errors
2. Terminal for server-side errors
3. Supabase logs in the dashboard

Happy coding! 🚀
