# 🚀 Implementation Guide - Payment & Tracking Features

## ✅ What's Been Done So Far:

### 1. Database Schema ✅
- Created `supabase-migration-payment.sql` - Run this in Supabase SQL Editor
- Created `supabase-storage-setup.sql` - Run this to enable image uploads

### 2. Utilities Created ✅
- `lib/imageCompression.ts` - Compress images before upload (500KB max)
- `lib/textToSpeech.ts` - TTS notifications for ibu's dashboard

### 3. Checkout Page Updates ✅ (Partially)
- Added state for: phone, order type, payment method, payment proof
- Added image upload handlers
- Updated handleConfirmPayment to save all new data

## 🔧 What Needs To Be Added to Checkout UI:

### In the Customer Form Section (around line 360):

```tsx
{/* Phone Number Input - ADD AFTER customerName input */}
<label className="block text-sm font-semibold text-[#1e1b1b] mb-2 mt-4">
  Nomor HP
</label>
<input
  type="tel"
  value={phoneNumber}
  onChange={(e) => setPhoneNumber(e.target.value)}
  placeholder="08123456789"
  className="w-full h-13 px-4 py-3 bg-white border-2 border-[#e6ded6] rounded-xl text-[#1e1b1b] placeholder:text-[#8c827a] focus:border-[#c83e23] focus:outline-none focus:ring-4 focus:ring-[#c83e23]/15 transition"
/>

{/* Order Type Selection */}
<label className="block text-sm font-semibold text-[#1e1b1b] mb-2 mt-4">
  Tipe Pesanan
</label>
<div className="flex gap-3">
  <button
    type="button"
    onClick={() => setOrderType('dine_in')}
    className={`flex-1 py-3 rounded-xl font-semibold transition ${
      orderType === 'dine_in'
        ? 'bg-[#c83e23] text-white'
        : 'bg-[#f5efeb] text-[#1e1b1b] border-2 border-[#e6ded6]'
    }`}
  >
    🍽️ Makan di Tempat
  </button>
  <button
    type="button"
    onClick={() => setOrderType('takeaway')}
    className={`flex-1 py-3 rounded-xl font-semibold transition ${
      orderType === 'takeaway'
        ? 'bg-[#c83e23] text-white'
        : 'bg-[#f5efeb] text-[#1e1b1b] border-2 border-[#e6ded6]'
    }`}
  >
    📦 Bungkus
  </button>
</div>

{/* Payment Method Selection */}
<label className="block text-sm font-semibold text-[#1e1b1b] mb-2 mt-4">
  Metode Pembayaran
</label>
<div className="flex gap-3 mb-4">
  <button
    type="button"
    onClick={() => setPaymentMethod('cash')}
    className={`flex-1 py-3 rounded-xl font-semibold transition ${
      paymentMethod === 'cash'
        ? 'bg-[#c83e23] text-white'
        : 'bg-[#f5efeb] text-[#1e1b1b] border-2 border-[#e6ded6]'
    }`}
  >
    💵 Cash
  </button>
  <button
    type="button"
    onClick={() => setPaymentMethod('qris')}
    className={`flex-1 py-3 rounded-xl font-semibold transition ${
      paymentMethod === 'qris'
        ? 'bg-[#c83e23] text-white'
        : 'bg-[#f5efeb] text-[#1e1b1b] border-2 border-[#e6ded6]'
    }`}
  >
    📱 QRIS
  </button>
</div>

{/* QRIS Payment Proof Upload - Show only if QRIS selected */}
{paymentMethod === 'qris' && (
  <div className="mt-4">
    {/* Show QRIS Image */}
    {qrisImageUrl && (
      <div className="mb-4 p-4 bg-[#f5efeb] rounded-xl">
        <p className="text-sm font-semibold text-[#1e1b1b] mb-2">
          Scan QRIS untuk Bayar:
        </p>
        <img
          src={qrisImageUrl}
          alt="QRIS"
          className="w-full max-w-xs mx-auto rounded-lg"
        />
      </div>
    )}

    {/* Upload Bukti */}
    <label className="block text-sm font-semibold text-[#1e1b1b] mb-2">
      Upload Bukti Pembayaran *
    </label>
    
    {paymentProofPreview ? (
      <div className="relative">
        <img
          src={paymentProofPreview}
          alt="Preview"
          className="w-full h-48 object-cover rounded-xl"
        />
        <button
          type="button"
          onClick={removePaymentProof}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
        >
          <X className="w-5 h-5" />
        </button>
        {paymentProof && (
          <p className="text-xs text-[#5a413c] mt-2">
            {formatFileSize(paymentProof.size)} - Gambar akan dikompres sebelum diupload
          </p>
        )}
      </div>
    ) : (
      <label className="border-2 border-dashed border-[#e6ded6] rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-[#c83e23] transition">
        <Upload className="w-12 h-12 text-[#5a413c] mb-2" />
        <span className="text-sm font-semibold text-[#1e1b1b]">
          Klik untuk upload screenshot
        </span>
        <span className="text-xs text-[#5a413c] mt-1">
          Max 10MB, akan dikompres otomatis
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handlePaymentProofChange}
          className="hidden"
        />
      </label>
    )}
    
    <p className="text-xs text-[#5a413c] mt-2">
      💡 Setelah transfer, screenshot bukti pembayaran dan upload di sini
    </p>
  </div>
)}
```

### Update "Meja 04" text:
Find and REMOVE this line (around line 375):
```tsx
<p className="text-sm text-[#5a413c] mt-2">Meja 04</p>
```

### Update Success Screen (in showQRIS section):
Replace the success message with tracking info:

```tsx
{/* Success Message with Tracking Code */}
<div className="bg-[#2e7d32]/10 border-2 border-[#2e7d32] rounded-xl p-4 mb-4">
  <h3 className="text-lg font-bold text-[#2e7d32] mb-2">
    ✅ Pesanan Berhasil!
  </h3>
  <p className="text-sm text-[#1e1b1b] mb-1">
    <strong>Nomor Antrian:</strong> {trackingCode}
  </p>
  <p className="text-sm text-[#1e1b1b]">
    <strong>Nama:</strong> {customerName}
  </p>
  <p className="text-xs text-[#5a413c] mt-2">
    {paymentMethod === 'qris' 
      ? '⏳ Menunggu verifikasi pembayaran dari kasir'
      : '💵 Silakan bayar di kasir dan tunjukkan nomor antrian'}
  </p>
</div>
```

## 📱 Next Files to Create:

### 1. Order Tracking Page
File: `app/track/[code]/page.tsx`

### 2. Admin Settings Page (Upload QRIS)
File: `app/admin/settings/page.tsx`

### 3. Update Admin Dashboard
- Add TTS notifications
- Add payment proof review
- Update order status flow

---

## 🎯 Quick Implementation Order:

1. ✅ Run `supabase-migration-payment.sql` in Supabase
2. ✅ Run `supabase-storage-setup.sql` in Supabase
3. ⏳ Add UI elements to checkout page (copy code above)
4. ⏳ Create tracking page
5. ⏳ Create admin settings page
6. ⏳ Update admin dashboard with TTS

Want me to continue with creating the tracking page and admin updates?
