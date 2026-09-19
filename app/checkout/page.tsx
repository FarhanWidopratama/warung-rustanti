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
      <div className="min-h-screen bg-[#6c1717]">
        <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] shadow-2xl shadow-[#260909] flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-xl font-bold text-[#4d2018] mb-4">
              Keranjang Kosong
            </p>
            <button
              onClick={() => router.push('/menu')}
              className="bg-[#e54b2e] text-white px-6 py-3 rounded-full font-bold hover:bg-[#c73a24] transition"
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
    <div className="min-h-screen bg-[#6c1717]">
      <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] shadow-2xl shadow-[#260909] pb-28">
        {/* Header */}
        <div className="px-4 pt-5">
          <button
            onClick={() => router.push('/menu')}
            className="flex items-center gap-1 text-xs font-bold text-[#9b4b32] mb-4"
          >
            <span className="text-lg">←</span> Kembali ke menu
          </button>
          <h2 className="text-[29px] text-[#4d2018] font-bold">
            Pesanan kamu
          </h2>
          <p className="text-xs text-[#936d5c]">
            Cek kembali sebelum dipesan, ya.
          </p>
        </div>

        <div className="px-4 py-6 pb-32">
          {/* Cart Items List */}
          <div className="mt-5 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-2xl border border-[#f0dfc8] bg-white p-3"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-17 w-17 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-[#4a231a]">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-[#b0432a]">
                    {formatPrice(item.price)}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="grid h-6 w-6 place-items-center rounded-md bg-[#f8ead5] font-bold text-[#4a231a]"
                    >
                      −
                    </button>
                    <span className="w-2 text-center text-xs font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="grid h-6 w-6 place-items-center rounded-md bg-[#7b1d18] font-bold text-white"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-auto"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-[#4b271c]">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Customer Info */}
          <div className="mt-5 rounded-[22px] bg-white border border-[#f0dfc8] p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-[#89542f] mb-3">
              Informasi Pelanggan
            </p>
            
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama lengkap"
              className="w-full px-3 py-2 bg-[#fff8e9] border border-[#ead8bd] rounded-lg text-sm text-[#4a231a] placeholder:text-[#9c7763] focus:border-[#7b1d18] focus:outline-none mb-3"
            />
            
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Nomor HP / WhatsApp"
              className="w-full px-3 py-2 bg-[#fff8e9] border border-[#ead8bd] rounded-lg text-sm text-[#4a231a] placeholder:text-[#9c7763] focus:border-[#7b1d18] focus:outline-none mb-3"
            />
            
            {/* Order Type */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`rounded-xl border p-3 text-left text-xs font-bold ${
                  orderType === 'dine_in'
                    ? 'border-[#bd432a] bg-white text-[#9e2d20]'
                    : 'border-transparent bg-[#fff2d7] text-[#866858]'
                }`}
              >
                <span className="mr-2">🍽️</span>Makan di Tempat
                <span className="float-right">{orderType === 'dine_in' ? '●' : '○'}</span>
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`rounded-xl border p-3 text-left text-xs font-bold ${
                  orderType === 'takeaway'
                    ? 'border-[#bd432a] bg-white text-[#9e2d20]'
                    : 'border-transparent bg-[#fff2d7] text-[#866858]'
                }`}
              >
                <span className="mr-2">📦</span>Bungkus
                <span className="float-right">{orderType === 'takeaway' ? '●' : '○'}</span>
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-4 rounded-[22px] bg-[#f7e5bf] p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-[#89542f]">
              Metode pembayaran
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`rounded-xl border p-3 text-left text-xs font-bold ${
                  paymentMethod === 'cash'
                    ? 'border-[#bd432a] bg-white text-[#9e2d20]'
                    : 'border-transparent bg-[#fff2d7] text-[#866858]'
                }`}
              >
                <span className="mr-2">💵</span>Tunai
                <span className="float-right">{paymentMethod === 'cash' ? '●' : '○'}</span>
              </button>
              <button
                onClick={() => setPaymentMethod('qris')}
                className={`rounded-xl border p-3 text-left text-xs font-bold ${
                  paymentMethod === 'qris'
                    ? 'border-[#bd432a] bg-white text-[#9e2d20]'
                    : 'border-transparent bg-[#fff2d7] text-[#866858]'
                }`}
              >
                <span className="mr-2">▣</span>QRIS
                <span className="float-right">{paymentMethod === 'qris' ? '●' : '○'}</span>
              </button>
            </div>

            {/* QRIS Section */}
            {paymentMethod === 'qris' && (
              <div className="mt-3 rounded-xl bg-white p-3">
                {qrisImageUrl ? (
                  <>
                    <p className="text-xs font-semibold text-[#4a231a] mb-2 text-center">
                      Scan QRIS untuk bayar:
                    </p>
                    <img
                      src={qrisImageUrl}
                      alt="QRIS"
                      className="w-full max-w-[200px] mx-auto rounded-lg mb-3"
                    />
                  </>
                ) : (
                  <p className="text-xs text-center text-[#9c7763] py-2">
                    ⚠️ QRIS belum tersedia
                  </p>
                )}

                {/* Upload Proof */}
                {paymentProofPreview ? (
                  <div className="relative">
                    <img
                      src={paymentProofPreview}
                      alt="Bukti"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={removePaymentProof}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[#ead8bd] rounded-lg p-4 flex flex-col items-center cursor-pointer">
                    <Upload className="w-8 h-8 text-[#9c7763] mb-1" />
                    <span className="text-xs font-semibold text-[#4a231a]">
                      Upload bukti bayar
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentProofChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Total Section */}
          <div className="mt-5 border-t border-dashed border-[#d8b98d] pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-[#805949]">
                Total pembayaran
              </span>
              <span className="text-[25px] text-[#962c20] font-bold">
                {formatPrice(getCartTotal())}
              </span>
            </div>
            <button
              onClick={handleConfirmPayment}
              disabled={isLoading || !customerName.trim() || !phoneNumber.trim() || (paymentMethod === 'qris' && !paymentProof)}
              className="w-full rounded-2xl bg-[#e54b2e] py-4 text-sm font-extrabold text-white shadow-lg shadow-[#db6347]/30 transition hover:bg-[#c73a24] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memproses...' : 'Pesan sekarang →'}
            </button>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
