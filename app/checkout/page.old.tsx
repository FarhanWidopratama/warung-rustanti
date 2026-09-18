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
  const [showQRIS, setShowQRIS] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } =
    useCart();
  const router = useRouter();

  // Fetch QRIS image on component mount
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

    // Validate
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      // Compress image
      const compressed = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        quality: 0.8,
      });

      setPaymentProof(compressed);

      // Create preview
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
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
      // Generate order number and tracking code
      const orderNumber = `ORD-${Date.now()}`;
      const newTrackingCode = generateTrackingCode();
      
      let paymentProofUrl = null;

      // Upload payment proof if QRIS
      if (paymentMethod === 'qris' && paymentProof) {
        const fileName = `${orderNumber}-${Date.now()}.jpg`;
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

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);

        paymentProofUrl = urlData.publicUrl;
      }
      
      // Prepare order data
      const orderData = {
        order_number: orderNumber,
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

      // Save to Supabase
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
      setShowQRIS(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    clearCart();
    router.push(`/track/${trackingCode}?phone=${encodeURIComponent(phoneNumber)}`);
  };

  if (cart.length === 0 && !showQRIS) {
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

  if (showQRIS) {
    return (
      <div className="min-h-screen bg-[#e6ded6] flex justify-center">
        <div className="w-full max-w-md bg-[#fff8f7] min-h-screen shadow-2xl relative">
          {/* Header */}
          <div className="bg-white border-b border-[#e6ded6] sticky top-0 z-40">
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowQRIS(false)}
                  className="w-10 h-10 rounded-full bg-[#f5efeb] flex items-center justify-center hover:bg-[#e6ded6] transition"
                >
                  <ArrowLeft className="w-5 h-5 text-[#1e1b1b]" />
                </button>
                <h1 className="text-xl font-bold text-[#1e1b1b]">
                  Pembayaran QRIS
                </h1>
              </div>
            </div>
          </div>

          <div className="px-4 py-6">
            {/* Customer Info */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
              <p className="text-sm text-[#5a413c] mb-1">Nama Pelanggan</p>
              <p className="text-lg font-bold text-[#1e1b1b]">{customerName}</p>
              <p className="text-sm text-[#5a413c] mt-2">Meja 04</p>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
              <h2 className="text-base font-bold text-[#1e1b1b] mb-3">
                Ringkasan Pesanan
              </h2>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-[#e6ded6] last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1e1b1b]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#5a413c]">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#1e1b1b]">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-[#e6ded6]">
                <p className="text-lg font-bold text-[#1e1b1b]">Total</p>
                <p className="text-xl font-bold text-[#c83e23]">
                  {formatPrice(getCartTotal())}
                </p>
              </div>
            </div>

            {/* QRIS Code */}
            <div className="bg-white rounded-2xl p-6 mb-4 shadow-card">
              <h2 className="text-center text-base font-bold text-[#1e1b1b] mb-4">
                Scan QRIS untuk Membayar
              </h2>
              <div className="bg-[#f5efeb] rounded-xl p-6 flex items-center justify-center mb-4">
                {/* QR Code Placeholder */}
                <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center">
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 256 256"
                    className="p-4"
                  >
                    {/* Simple QR pattern mockup */}
                    <rect width="256" height="256" fill="white" />
                    <rect x="8" y="8" width="80" height="80" fill="black" />
                    <rect x="20" y="20" width="56" height="56" fill="white" />
                    <rect x="32" y="32" width="32" height="32" fill="black" />
                    
                    <rect x="168" y="8" width="80" height="80" fill="black" />
                    <rect x="180" y="20" width="56" height="56" fill="white" />
                    <rect x="192" y="32" width="32" height="32" fill="black" />
                    
                    <rect x="8" y="168" width="80" height="80" fill="black" />
                    <rect x="20" y="180" width="56" height="56" fill="white" />
                    <rect x="32" y="192" width="32" height="32" fill="black" />
                    
                    <rect x="104" y="8" width="16" height="16" fill="black" />
                    <rect x="136" y="8" width="16" height="16" fill="black" />
                    <rect x="8" y="104" width="16" height="16" fill="black" />
                    <rect x="8" y="136" width="16" height="16" fill="black" />
                    <rect x="168" y="104" width="16" height="16" fill="black" />
                    <rect x="200" y="104" width="16" height="16" fill="black" />
                    <rect x="104" y="168" width="16" height="16" fill="black" />
                    <rect x="136" y="168" width="16" height="16" fill="black" />
                    <rect x="168" y="200" width="16" height="16" fill="black" />
                    <rect x="200" y="168" width="16" height="16" fill="black" />
                    <rect x="120" y="120" width="48" height="48" fill="black" />
                  </svg>
                </div>
              </div>
              <p className="text-center text-sm text-[#5a413c] mb-2">
                Scan kode QR dengan aplikasi pembayaran
              </p>
              <p className="text-center text-xs text-[#5a413c]">
                GoPay, OVO, DANA, ShopeePay, LinkAja
              </p>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handlePaymentComplete}
              className="w-full bg-[#c83e23] text-white rounded-full py-4 font-bold text-base shadow-float hover:bg-[#a8321b] active:scale-[0.98] transition-all"
            >
              Konfirmasi Bayar
            </button>
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
          {/* Customer Name Input */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
            <label className="block text-sm font-semibold text-[#1e1b1b] mb-2">
              Nama Pelanggan
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama Anda"
              className="w-full h-13 px-4 py-3 bg-white border-2 border-[#e6ded6] rounded-xl text-[#1e1b1b] placeholder:text-[#8c827a] focus:border-[#c83e23] focus:outline-none focus:ring-4 focus:ring-[#c83e23]/15 transition"
            />
            <p className="text-sm text-[#5a413c] mt-2">Meja 04</p>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
            <h2 className="text-base font-bold text-[#1e1b1b] mb-4">
              Pesanan Anda
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
              disabled={!customerName.trim() || isLoading}
              className="w-full bg-[#c83e23] text-white rounded-full py-4 font-bold text-base shadow-float hover:bg-[#a8321b] active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Menyimpan Pesanan...' : 'Lanjut ke Pembayaran'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
