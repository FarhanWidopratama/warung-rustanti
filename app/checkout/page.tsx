'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { supabase } from '@/lib/supabase';
import { menuData } from '../data/menuData';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, getCartTotal } = useCart();
  const [payment, setPayment] = useState<'cash' | 'qris'>('qris');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('takeaway');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const total = getCartTotal();
  const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleCheckout = async () => {
    if (!customerName || !phoneNumber) {
      alert('Nama dan nomor HP harus diisi!');
      return;
    }

    if (payment === 'qris' && !paymentProof) {
      alert('Upload bukti pembayaran QRIS!');
      return;
    }

    setIsLoading(true);

    try {
      let paymentProofUrl = null;

      if (paymentProof) {
        const fileName = `${Date.now()}_${paymentProof.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);

        paymentProofUrl = publicUrl;
      }

      const trackingCode = `WR-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const { error } = await supabase.from('orders').insert({
        tracking_code: trackingCode,
        customer_name: customerName,
        phone_number: phoneNumber,
        order_type: orderType,
        payment_method: payment,
        payment_proof_url: paymentProofUrl,
        payment_verified: payment === 'cash',
        items: cart,
        total: total,
        status: payment === 'cash' ? 'pending' : 'payment_review',
      });

      if (error) throw error;

      router.push(`/track/${trackingCode}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal memproses pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#6c1717] text-[#3c1712]">
      <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] shadow-2xl shadow-[#260909]">
        <section className="min-h-[calc(100vh-80px)] px-4 pb-28">
          
          {/* Back Button */}
          <button 
            onClick={() => router.push('/menu')} 
            className="mt-1 flex items-center gap-1 text-xs font-bold text-[#9b4b32]"
          >
            <span className="text-lg">←</span> Kembali ke menu
          </button>

          {/* Title */}
          <h2 className="mt-4 text-[29px] text-[#4d2018]" style={{fontWeight: 700}}>
            Pesanan kamu
          </h2>
          <p className="text-xs text-[#936d5c]">Cek kembali sebelum dipesan, ya.</p>

          {/* Cart Items */}
          <div className="mt-5 space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-[#f0dfc8] bg-white p-3">
                <img 
                  src={item.image} 
                  alt="" 
                  className="h-17 w-17 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-[#4a231a]">{item.name}</h3>
                  <p className="mt-1 text-xs font-bold text-[#b0432a]">{rupiah(item.price)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                      className="grid h-6 w-6 place-items-center rounded-md bg-[#f8ead5] font-bold"
                    >
                      −
                    </button>
                    <span className="w-2 text-center text-xs font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                      className="grid h-6 w-6 place-items-center rounded-md bg-[#7b1d18] font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-[#4b271c]">
                  {rupiah(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Customer Info */}
          <div className="mt-5 space-y-3">
            <input
              type="text"
              placeholder="Nama kamu"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-[#e6d3b8] bg-white px-4 py-3 text-sm text-[#4a231a] placeholder-[#b89c82] focus:border-[#7b1d18] focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Nomor HP"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-xl border border-[#e6d3b8] bg-white px-4 py-3 text-sm text-[#4a231a] placeholder-[#b89c82] focus:border-[#7b1d18] focus:outline-none"
            />
            
            {/* Order Type */}
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`flex-1 rounded-xl border p-3 text-xs font-bold ${
                  orderType === 'dine_in'
                    ? 'border-[#bd432a] bg-white text-[#9e2d20]'
                    : 'border-transparent bg-[#f5e8d4] text-[#866858]'
                }`}
              >
                🍽️ Makan di tempat
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`flex-1 rounded-xl border p-3 text-xs font-bold ${
                  orderType === 'takeaway'
                    ? 'border-[#bd432a] bg-white text-[#9e2d20]'
                    : 'border-transparent bg-[#f5e8d4] text-[#866858]'
                }`}
              >
                📦 Bungkus
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-5 rounded-[22px] bg-[#f7e5bf] p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-[#89542f]">
              Metode pembayaran
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[['cash','Tunai','💵'],['qris','QRIS','▣']].map(([id, label, icon]) => (
                <button 
                  key={id} 
                  onClick={() => setPayment(id as 'cash' | 'qris')} 
                  className={`rounded-xl border p-3 text-left text-xs font-bold ${
                    payment === id 
                      ? 'border-[#bd432a] bg-white text-[#9e2d20]' 
                      : 'border-transparent bg-[#fff2d7] text-[#866858]'
                  }`}
                >
                  <span className="mr-2">{icon}</span>{label}
                  <span className="float-right">{payment === id ? '●' : '○'}</span>
                </button>
              ))}
            </div>

            {/* QRIS Upload */}
            {payment === 'qris' && (
              <div className="mt-3">
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#d8b88f] bg-white p-4 text-center text-xs text-[#8d6749] hover:bg-[#fffdf7]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {paymentProof ? (
                    <span className="font-bold text-[#7b1d18]">
                      ✓ {paymentProof.name}
                    </span>
                  ) : (
                    <>📸 Upload bukti transfer QRIS</>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="mt-5 border-t border-dashed border-[#d8b98d] pt-4">
            <div className="flex justify-between">
              <span className="text-sm font-bold text-[#805949]">Total pembayaran</span>
              <span className="text-[25px] text-[#962c20]" style={{fontWeight: 700}}>
                {rupiah(total)}
              </span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isLoading}
              className="mt-4 w-full rounded-2xl bg-[#e54b2e] py-4 text-sm font-extrabold text-white shadow-lg shadow-[#db6347]/30 transition hover:bg-[#c73a24] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memproses...' : 'Pesan sekarang →'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
