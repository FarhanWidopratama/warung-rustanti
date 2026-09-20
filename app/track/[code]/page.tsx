'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  tracking_code: string;
  customer_name: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
}

export default function TrackingPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrder();

    const subscription = supabase
      .channel(`order_${params.code}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `tracking_code=eq.${params.code}`,
        },
        () => {
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [params.code]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', params.code)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  const steps = [
    { 
      t: 'Pesanan diterima', 
      d: '14.20 · Kami sudah menerima pesananmu', 
      on: order && ['pending', 'payment_review', 'confirmed', 'cooking', 'ready', 'completed'].includes(order.status)
    },
    { 
      t: 'Sedang dimasak', 
      d: 'Dapur sedang menyiapkan pesanan', 
      on: order && ['cooking', 'ready', 'completed'].includes(order.status)
    },
    { 
      t: 'Siap diambil', 
      d: 'Tunggu sebentar lagi, ya!', 
      on: order && ['ready', 'completed'].includes(order.status)
    },
    { 
      t: 'Selesai', 
      d: 'Selamat menikmati hidanganmu', 
      on: order && order.status === 'completed'
    }
  ];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#6c1717]">
        <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] flex items-center justify-center">
          <p className="text-[#7b1d18]">Memuat...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#6c1717]">
        <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] flex items-center justify-center flex-col gap-4 px-5">
          <p className="text-[#7b1d18] text-center">Pesanan tidak ditemukan</p>
          <button 
            onClick={() => router.push('/menu')}
            className="rounded-2xl bg-[#7b1d18] px-6 py-3 text-sm font-bold text-white"
          >
            Kembali ke Menu
          </button>
        </div>
      </main>
    );
  }

  const progress = order.status === 'pending' || order.status === 'payment_review' || order.status === 'confirmed' 
    ? 25 
    : order.status === 'cooking' 
    ? 50 
    : order.status === 'ready' 
    ? 75 
    : 100;

  return (
    <main className="min-h-screen bg-[#6c1717] text-[#3c1712]">
      <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] shadow-2xl shadow-[#260909]">
        <section className="min-h-[calc(100vh-80px)] px-5 pb-28">
          
          {/* Status Card */}
          <div className="mt-2 rounded-[26px] bg-[#7b1d18] p-5 text-[#fff6e2]">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#ffd17e]">
              Pesanan #{order.tracking_code}
            </p>
            <h2 className="mt-1 text-[28px]" style={{fontWeight: 700}}>
              {order.status === 'completed' ? 'Selesai!' : order.status === 'ready' ? 'Siap diambil!' : 'Lagi dimasak!'}
            </h2>
            <p className="mt-1 text-xs text-[#f8d8a7]">
              {order.status === 'completed' 
                ? 'Terima kasih sudah memesan!' 
                : order.status === 'ready'
                ? 'Pesanan sudah siap, silakan diambil'
                : 'Estimasi siap dalam 12 menit'}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#56120f]">
              <div 
                className="h-full rounded-full bg-[#edb13d] transition-all duration-500"
                style={{width: `${progress}%`}}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-7">
            <h3 className="text-[22px]" style={{fontWeight: 700}}>Perjalanan pesananmu</h3>
            <div className="mt-5">
              {steps.map((s, i) => (
                <div className="relative flex gap-4 pb-7" key={s.t}>
                  {i < steps.length - 1 && (
                    <div className={`absolute left-[9px] top-5 h-[calc(100%-10px)] w-0.5 ${
                      s.on ? 'bg-[#e2633d]' : 'bg-[#ead7bd]'
                    }`}/>
                  )}
                  <span className={`z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full border-4 ${
                    s.on 
                      ? 'border-[#f3b34a] bg-[#d94a2e]' 
                      : 'border-[#ead7bd] bg-[#fff8e9]'
                  }`}>
                    {s.on && <span className="h-1.5 w-1.5 rounded-full bg-white"/>}
                  </span>
                  <div>
                    <p className={`text-sm font-extrabold ${
                      s.on ? 'text-[#59251c]' : 'text-[#aa8979]'
                    }`}>
                      {s.t}
                    </p>
                    <p className="mt-0.5 text-xs text-[#947062]">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="rounded-2xl border border-[#f0dfc8] bg-white p-4">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.15em] text-[#c46336]">
              Detail Pesanan
            </p>
            <p className="mt-2 text-sm font-bold text-[#4a231a]">{order.customer_name}</p>
            <div className="mt-3 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-[#5a413c]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-bold text-[#7b1d18]">
                    {rupiah(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-[#f0dfc8] pt-3 flex justify-between">
              <span className="text-sm font-bold text-[#4a231a]">Total</span>
              <span className="text-lg font-extrabold text-[#a53425]">
                {rupiah(order.total)}
              </span>
            </div>
          </div>

          {/* Add Order Button */}
          <button 
            onClick={() => router.push('/menu')}
            className="mt-5 w-full rounded-2xl border border-[#d79b70] py-3 text-sm font-bold text-[#9a3927] transition hover:bg-[#fff0e0]"
          >
            Tambah pesanan
          </button>
        </section>
      </div>
    </main>
  );
}
