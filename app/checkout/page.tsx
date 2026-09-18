'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, Upload, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { compressImage, validateImageFile, formatFileSize } from '@/lib/imageCompression';

export default function CheckoutPage() {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
  const [qrisImageUrl, setQrisImageUrl] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const router = useRouter();

  // Fetch QRIS image on mount
  useEffect(() => {
    fetchQRISImage();
  }, []);

  const fetchQRISImage = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'qris_image_url')
        .single();

      if (data?.value) {
        setQrisImageUrl(data.value);
      }
    } catch (error) {
      console.error('Error fetching QRIS:', error);
    }
  };

  const handlePaymentProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      const compressed = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        quality: 0.8,
      });

      setPaymentProof(compressed);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Gagal memproses gambar');
    }
  };

  const removePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview('');
  };

  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleConfirmPayment = async () => {
    if (!customerName.trim()) {
      alert('Silakan masukkan nama pelanggan');
      return;
    }

    if (!phoneNumber.trim()) {
      alert('Silakan masukkan nomor HP');
      return;
    }

    if (paymentMethod === 'qris' && !paymentProof) {
      alert('Silakan upload bukti pembayaran QRIS');
      return;
    }

    setIsLoading(true);

    try {
      const newOrderNumber = `ORD-${Date.now()}`;
      const newTrackingCode = generateTrackingCode();
      
      let paymentProofUrl = null;

      // Upload payment proof if QRIS
      if (paymentMethod === 'qris' && paymentProof) {
        const fileName = `${newOrderNumber}-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Error uploading payment proof:', uploadError);
          alert('Gagal mengupload bukti pembayaran');
          setIsLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);

        paymentProofUrl = urlData.publicUrl;
      }
      
      const orderData = {
        order_number: newOrderNumber,
        table_number: orderType === 'dine_in' ? 'Makan di Tempat' : 'Bungkus',
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
        order_type: orderType,
        payment_method: paymentMethod,
        payment_proof_url: paymentProofUrl,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: getCartTotal(),
        status: paymentMethod === 'qris' ? 'payment_review' : 'pending',
        tracking_code: newTrackingCode,
        payment_verified: paymentMethod === 'cash',
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Error saving order:', error);
        alert('Gagal menyimpan pesanan. Silakan coba lagi.');
        setIsLoading(false);
        return;
      }

      console.log('Order saved successfully:', data);
      setTrackingCode(newTrackingCode);
      setOrderNumber(newOrderNumber);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToTracking = () => {
    clearCart();
    router.push(`/track/${trackingCode}?phone=${encodeURIComponent(phoneNumber)}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (cart.length === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-[#e6ded6] flex justify-center">
        <div className="w-full max-w-md bg-[#fff8f7] min-h-screen shadow-2xl flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-xl font-semibold text-[#1e1b1b] mb-4">
              Keranjang Kosong
            </p>
            <button
              onClick={() => router.push('/menu')}
              className="bg-[#c83e23] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#a8321b] transition"
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#e6ded6] flex justify-center">
        <div className="w-full max-w-md bg-[#fff8f7] min-h-screen shadow-2xl relative">
          <div className="bg-white border-b border-[#e6ded6] sticky top-0 z-40">
            <div className="px-4 py-4">
              <h1 className="text-xl font-bold text-[#1e1b1b] text-center">
                Pesanan Berhasil!
              </h1>
            </div>
          </div>

          <div className="px-4 py-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-[#2e7d32]/10 flex items-center justify-center">
                <div className="text-5xl">✅</div>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-white rounded-2xl p-6 mb-4 shadow-card text-center">
              <h2 className="text-2xl font-bold text-[#2e7d32] mb-2">
                Pesanan Diterima!
              </h2>
              <p className="text-sm text-[#5a413c] mb-4">
                Terima kasih {customerName}
              </p>
              
              <div className="bg-[#f5efeb] rounded-xl p-4 mb-4">
                <p className="text-xs text-[#5a413c] mb-1">Nomor Pesanan</p>
                <p className="text-xl font-bold text-[#1e1b1b] mb-3">
                  {orderNumber}
                </p>
                
                <p className="text-xs text-[#5a413c] mb-1">Kode Tracking</p>
                <p className="text-3xl font-bold text-[#c83e23] tracking-wider">
                  {trackingCode}
                </p>
              </div>

              <div className="text-left space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5a413c]">Tipe:</span>
                  <span className="font-semibold text-[#1e1b1b]">
                    {orderType === 'dine_in' ? '🍽️ Makan di Tempat' : '📦 Bungkus'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5a413c]">Pembayaran:</span>
                  <span className="font-semibold text-[#1e1b1b]">
                    {paymentMethod === 'cash' ? '💵 Cash' : '📱 QRIS'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5a413c]">Total:</span>
                  <span className="font-bold text-[#c83e23]">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>
              </div>

              {paymentMethod === 'qris' ? (
                <div className="bg-[#e89218]/10 border-2 border-[#e89218] rounded-xl p-3 mb-4">
                  <p className="text-sm font-semibold text-[#e89218]">
                    ⏳ Menunggu Verifikasi Pembayaran
                  </p>
                  <p className="text-xs text-[#5a413c] mt-1">
                    Kasir akan memverifikasi bukti pembayaran Anda
                  </p>
                </div>
              ) : (
                <div className="bg-[#2e7d32]/10 border-2 border-[#2e7d32] rounded-xl p-3 mb-4">
                  <p className="text-sm font-semibold text-[#2e7d32]">
                    💵 Silakan Bayar di Kasir
                  </p>
                  <p className="text-xs text-[#5a413c] mt-1">
                    Tunjukkan kode tracking di atas
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGoToTracking}
                className="w-full bg-[#c83e23] text-white rounded-full py-4 font-bold text-base shadow-float hover:bg-[#a8321b] active:scale-[0.98] transition-all"
              >
                Lacak Pesanan
              </button>
              
              <button
                onClick={() => router.push('/menu')}
                className="w-full bg-[#f5efeb] text-[#1e1b1b] border-2 border-[#e6ded6] rounded-full py-4 font-bold text-base hover:bg-[#e6ded6] transition"
              >
                Pesan Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e6ded6] flex justify-center">
      <div className="w-full max-w-md bg-[#fff8f7] min-h-screen shadow-2xl relative">
        {/* Header */}
        <div className="bg-white border-b border-[#e6ded6] sticky top-0 z-40">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/menu')}
                className="w-10 h-10 rounded-full bg-[#f5efeb] flex items-center justify-center hover:bg-[#e6ded6] transition"
              >
                <ArrowLeft className="w-5 h-5 text-[#1e1b1b]" />
              </button>
              <h1 className="text-xl font-bold text-[#1e1b1b]">Checkout</h1>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 pb-32">
          {/* Customer Info Form */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
            <h2 className="text-base font-bold text-[#1e1b1b] mb-4">
              Informasi Pelanggan
            </h2>
            
            {/* Name Input */}
            <label className="block text-sm font-semibold text-[#1e1b1b] mb-2">
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama Anda"
              className="w-full px-4 py-3 bg-white border-2 border-[#e6ded6] rounded-xl text-[#1e1b1b] placeholder:text-[#8c827a] focus:border-[#c83e23] focus:outline-none focus:ring-4 focus:ring-[#c83e23]/15 transition mb-4"
            />

            {/* Phone Input */}
            <label className="block text-sm font-semibold text-[#1e1b1b] mb-2">
              Nomor HP / WhatsApp *
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="08123456789"
              className="w-full px-4 py-3 bg-white border-2 border-[#e6ded6] rounded-xl text-[#1e1b1b] placeholder:text-[#8c827a] focus:border-[#c83e23] focus:outline-none focus:ring-4 focus:ring-[#c83e23]/15 transition mb-4"
            />

            {/* Order Type */}
            <label className="block text-sm font-semibold text-[#1e1b1b] mb-2">
              Tipe Pesanan *
            </label>
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setOrderType('dine_in')}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  orderType === 'dine_in'
                    ? 'bg-[#c83e23] text-white shadow-float'
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
                    ? 'bg-[#c83e23] text-white shadow-float'
                    : 'bg-[#f5efeb] text-[#1e1b1b] border-2 border-[#e6ded6]'
                }`}
              >
                📦 Bungkus
              </button>
            </div>

            {/* Payment Method */}
            <label className="block text-sm font-semibold text-[#1e1b1b] mb-2">
              Metode Pembayaran *
            </label>
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  paymentMethod === 'cash'
                    ? 'bg-[#c83e23] text-white shadow-float'
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
                    ? 'bg-[#c83e23] text-white shadow-float'
                    : 'bg-[#f5efeb] text-[#1e1b1b] border-2 border-[#e6ded6]'
                }`}
              >
                📱 QRIS
              </button>
            </div>

            {/* QRIS Payment Section */}
            {paymentMethod === 'qris' && (
              <div className="mt-4 p-4 bg-[#f5efeb] rounded-xl">
                {qrisImageUrl ? (
                  <>
                    <p className="text-sm font-semibold text-[#1e1b1b] mb-2 text-center">
                      Scan QRIS untuk Bayar:
                    </p>
                    <img
                      src={qrisImageUrl}
                      alt="QRIS"
                      className="w-full max-w-xs mx-auto rounded-lg mb-4"
                    />
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-[#5a413c]">
                      ⚠️ QRIS belum diatur oleh admin
                    </p>
                  </div>
                )}

                {/* Upload Proof */}
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
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-float"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {paymentProof && (
                      <p className="text-xs text-[#5a413c] mt-2 text-center">
                        {formatFileSize(paymentProof.size)} - Siap diupload
                      </p>
                    )}
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[#e6ded6] rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-[#c83e23] transition bg-white">
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
                  💡 Setelah transfer, screenshot bukti dan upload di sini
                </p>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
            <h2 className="text-base font-bold text-[#1e1b1b] mb-4">
              Pesanan Anda ({cart.length} item)
            </h2>
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 py-3 border-b border-[#e6ded6] last:border-0"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover bg-[#f5efeb]"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#1e1b1b] mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm font-bold text-[#c83e23] mb-2">
                    {formatPrice(item.price)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-[#f5efeb] border border-[#e6ded6] flex items-center justify-center hover:bg-[#e6ded6] transition"
                    >
                      <Minus className="w-4 h-4 text-[#1e1b1b]" />
                    </button>
                    <span className="text-sm font-bold text-[#1e1b1b] min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-[#f5efeb] border border-[#e6ded6] flex items-center justify-center hover:bg-[#e6ded6] transition"
                    >
                      <Plus className="w-4 h-4 text-[#1e1b1b]" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-auto w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <h2 className="text-base font-bold text-[#1e1b1b] mb-3">
              Ringkasan Pembayaran
            </h2>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[#5a413c]">
                    {item.name} ({item.quantity}x)
                  </span>
                  <span className="text-[#1e1b1b] font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-[#e6ded6]">
              <p className="text-lg font-bold text-[#1e1b1b]">Total</p>
              <p className="text-2xl font-bold text-[#c83e23]">
                {formatPrice(getCartTotal())}
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-[#e6ded6] z-50">
          <div className="px-4 py-4">
            <button
              onClick={handleConfirmPayment}
              disabled={isLoading || !customerName.trim() || !phoneNumber.trim()}
              className="w-full bg-[#c83e23] text-white rounded-full py-4 font-bold text-base shadow-float hover:bg-[#a8321b] active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memproses Pesanan...' : 'Konfirmasi Pesanan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
