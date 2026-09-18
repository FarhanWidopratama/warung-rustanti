# 🐛 DEBUG: Order Status Issue

## Problem:
Order `PGMKNER4` appears in "Selesai" (completed) column instead of "Menunggu Verifikasi" (pending).

## Expected Flow:
1. Customer creates order with Cash payment
2. Status should be: `pending`
3. Admin sees order in "Menunggu Verifikasi" column
4. Admin clicks "✓ Bayar Cash Diterima"
5. Status changes to: `confirmed`

## Current Issue:
- Order shows in "Selesai" column
- Status appears to be: `completed`

## Code Check:
```typescript
// checkout/page.tsx line 153
status: paymentMethod === 'qris' ? 'payment_review' : 'pending',
```
✅ Code is CORRECT - sets `pending` for cash

## Possible Causes:
1. Database default value is `completed` instead of `pending`
2. Database constraint issue
3. Real-time update triggered incorrectly
4. Admin dashboard filtering logic wrong

## Debug Steps:

### 1. Check Supabase Table Editor
Go to: https://supabase.com/dashboard/project/ejfsfabpdsuzmykeqump/editor

Click table `orders` → Find row with tracking_code `PGMKNER4`

**Check these columns:**
- `status` = ? (should be `pending`)
- `payment_verified` = ? (should be `false` for pending, `true` if completed)
- `payment_method` = `cash`
- `created_at` = timestamp

### 2. Check Admin Dashboard Filtering

Admin dashboard categorizes orders by status:
```typescript
const pendingPaymentOrders = orders.filter(
  (order) => order.status === 'pending' || order.status === 'payment_review'
);
const completedOrders = orders.filter((order) => order.status === 'completed');
```

If order shows in "Selesai", it means `order.status === 'completed'`.

### 3. Check Database Schema

SQL-FILE-1 sets default status:
```sql
status VARCHAR(50) DEFAULT 'pending'
```
✅ CORRECT

SQL-FILE-2 updates constraint:
```sql
CHECK (status IN ('pending', 'waiting_payment', 'payment_review', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'))
```
✅ CORRECT

## Action Items:

**YOU NEED TO DO:**
1. Open Supabase Table Editor
2. Find order PGMKNER4
3. Click on the row to see details
4. Screenshot the `status` column value
5. Share screenshot with me

**I WILL:**
1. Analyze the actual status value
2. Fix the issue (code or database)
3. Test again

---

**Go to Supabase now and screenshot the order row!** 📸
