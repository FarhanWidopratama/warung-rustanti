'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '../../context/CartContext';

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number?: string;
  tracking_code: string;
  table_number?: string;
  customer_name: string;
  order_type?: string;
  payment_method?: string;
  payment_verified?: boolean;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
}

function Icon({ children, size = 19 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function TrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { getCartItemCount } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const itemCount = getCartItemCount();
  const code = resolvedParams.code;

  useEffect(() => {
    fetchOrder();

    const subscription = supabase
      .channel(`order_${code}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tracking_code=eq.${code}`,
        },
        () => {
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [code]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', code)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  const formattedTime = order?.created_at 
    ? new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    : 'Hari ini';

  const steps = [
    { 
      t: 'Pesanan diterima', 
      d: `${formattedTime} · Kami sudah menerima pesananmu`, 
      on: order ? ['pending', 'payment_review', 'confirmed', 'cooking', 'ready', 'completed'].includes(order.status) : false
    },
    { 
      t: 'Sedang dimasak', 
      d: 'Dapur sedang menyiapkan pesanan', 
      on: order ? ['cooking', 'ready', 'completed'].includes(order.status) : false
    },
    { 
      t: 'Siap diambil / diantar', 
      d: order?.order_type === 'takeaway' ? 'Siap diambil di kasir' : 'Akan segera diantar ke meja kamu', 
      on: order ? ['ready', 'completed'].includes(order.status) : false
    },
    { 
      t: 'Selesai', 
      d: 'Selamat menikmati hidanganmu', 
      on: order ? order.status === 'completed' : false
    }
  ];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#6c1717]">
        <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7b1d18] border-t-transparent" />
            <p className="text-xs font-bold text-[#7b1d18]">Memuat status pesanan...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#6c1717]">
        <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] flex items-center justify-center flex-col gap-4 px-6 text-center">
          <span className="text-4xl">🔍</span>
          <h2 className="font-display text-xl text-[#4a231a]">
            Pesanan #{code} Tidak Ditemukan
          </h2>
          <p className="text-xs text-[#947062]">
            Periksa kembali kode pesanan atau pesan menu favoritmu sekarang.
          </p>
          <button 
            onClick={() => router.push('/menu')}
            className="rounded-2xl bg-[#7b1d18] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#5a1410]"
          >
            Kembali ke Menu
          </button>
        </div>
      </main>
    );
  }

  const getHeadline = () => {
    if (order.status === 'payment_review') return 'Verifikasi QRIS';
    if (order.status === 'pending' || order.status === 'confirmed') return 'Pesanan Masuk!';
    if (order.status === 'cooking') return 'Lagi dimasak!';
    if (order.status === 'ready') return 'Siap diambil!';
    if (order.status === 'completed') return 'Selesai!';
    return 'Pesanan Diproses';
  };

  const getSubheadline = () => {
    if (order.status === 'payment_review') return 'Kasir sedang mengecek bukti transfer QRIS';
    if (order.status === 'pending' || order.status === 'confirmed') return 'Pesanan sudah masuk antrean dapur';
    if (order.status === 'cooking') return 'Dapur sedang memasak pesanan dengan cinta';
    if (order.status === 'ready') return order.order_type === 'takeaway' ? 'Silakan ambil di kasir' : 'Pesanan segera diantar ke meja';
    if (order.status === 'completed') return 'Terima kasih telah berkunjung ke Warung Rustanti!';
    return 'Estimasi penyajian 10-15 menit';
  };

  const progress = order.status === 'payment_review' 
    ? 15 
    : order.status === 'pending' || order.status === 'confirmed' 
    ? 30 
    : order.status === 'cooking' 
    ? 65 
    : order.status === 'ready' 
    ? 90 
    : 100;

  return (
    <main className="min-h-screen w-full bg-[#6c1717] flex justify-center text-[#3c1712] selection:bg-[#f4b83f] selection:text-[#3c1712]">
      <div className="w-full min-h-screen max-w-[414px] bg-[#fff8e9] shadow-2xl shadow-[#260909] relative pb-24">
        
        {/* Top Header */}
        <header className="relative z-10 flex items-center justify-between bg-[#fff8e9] px-5 pb-3 pt-5">
          <button 
            onClick={() => router.push('/menu')} 
            className="flex items-center gap-1.5 text-xs font-bold text-[#9b4b32] transition hover:text-[#7b1d18]"
          >
            <span className="text-base leading-none">←</span> Ke menu
          </button>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#bb4a2f]">
            Status Pesanan
          </span>
        </header>

        <section className="px-5 pb-10">
          {/* Status Hero Card */}
          <div className="mt-2 rounded-[26px] bg-[#7b1d18] p-5 text-[#fff6e2] shadow-lg shadow-[#7b1d18]/25">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#ffd17e]">
                Pesanan #{order.tracking_code}
              </p>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase text-[#ffd17e]">
                {order.order_type === 'takeaway' ? '📦 Bungkus' : `🪑 ${order.table_number || 'Dine-in'}`}
              </span>
            </div>
            
            <h2 className="mt-2 font-display text-[28px] leading-tight">
              {getHeadline()}
            </h2>
            <p className="mt-1 text-xs text-[#f8d8a7]">
              {getSubheadline()}
            </p>

            {/* Progress bar */}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#56120f]">
              <div 
                className="h-full rounded-full bg-[#edb13d] transition-all duration-700 ease-out"
                style={{width: `${progress}%`}}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-7">
            <h3 className="font-display text-[22px] text-[#4d2018]">Perjalanan pesananmu</h3>
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

          {/* Order Details Card */}
          <div className="rounded-2xl border border-[#f0dfc8] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#f3e7d6] pb-2.5">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[.15em] text-[#c46336]">
                  Detail Pemesan
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-[#4a231a]">
                  {order.customer_name}
                </p>
              </div>
              <span className="rounded-lg bg-[#fff8eb] px-2.5 py-1 text-[11px] font-bold text-[#8f562b] border border-[#f0e0ca]">
                {order.payment_method === 'cash' ? '💵 Bayar Tunai' : '▣ QRIS Digital'}
              </span>
            </div>

            {/* Items list */}
            <div className="mt-3 space-y-2.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-[#5a413c] font-semibold">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-bold text-[#7b1d18]">
                    {rupiah(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-3.5 border-t border-[#f0dfc8] pt-3 flex justify-between items-baseline">
              <span className="text-xs font-bold text-[#4a231a]">Total Akhir</span>
              <span className="font-display text-lg font-extrabold text-[#a53425]">
                {rupiah(order.total)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={() => router.push('/menu')}
            className="mt-5 w-full rounded-2xl border border-[#d79b70] py-3 text-xs font-bold text-[#9a3927] transition hover:bg-[#fff0e0]"
          >
            Pesan Menu Tambahan
          </button>
        </section>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[414px] -translate-x-1/2 justify-around border-t border-[#efddc3] bg-[#fffdf7]/95 px-5 py-2 backdrop-blur">
          <button 
            onClick={() => router.push('/menu')} 
            className="grid place-items-center gap-1 px-4 py-1 text-[10px] font-bold text-[#a88473] hover:text-[#bb3a25]"
          >
            <Icon size={18}>
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </Icon>
            Menu
          </button>
          <button 
            onClick={() => router.push(`/track/${code}`)} 
            className="grid place-items-center gap-1 px-4 py-1 text-[10px] font-bold text-[#bb3a25]"
          >
            <Icon size={18}>
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3 2"/>
            </Icon>
            Pesanan
          </button>
          <button 
            onClick={() => router.push('/checkout')} 
            className="relative grid place-items-center gap-1 px-4 py-1 text-[10px] font-bold text-[#a88473] hover:text-[#bb3a25]"
          >
            <div className="relative">
              <Icon size={18}>
                <path d="M3 3h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 7H6"/>
                <circle cx="10" cy="20" r="1"/>
                <circle cx="18" cy="20" r="1"/>
              </Icon>
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[#e54b2e] px-1 text-[8px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </div>
            Keranjang
          </button>
        </nav>

      </div>
    </main>
  );
}
