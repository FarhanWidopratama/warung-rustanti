'use client';

import { useState, useEffect } from 'react';
import { Eye, X, Volume2, VolumeX, Settings, BellRing } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { tts } from '@/lib/textToSpeech';
import { useRouter } from 'next/navigation';

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
  phone_number?: string;
  order_type?: string;
  payment_method: string;
  payment_proof_url: string | null;
  payment_verified: boolean;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          fetchOrders();
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            if (soundEnabled) {
              tts.announceNewOrder({
                customerName: newOrder.customer_name || 'Pelanggan',
                orderNumber: newOrder.table_number || newOrder.tracking_code || '1',
                total: newOrder.total || 0,
                itemCount: newOrder.items?.length || 1,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [soundEnabled]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_verified: approve,
          status: approve ? 'cooking' : 'cancelled',
        })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal memverifikasi pembayaran');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal update status');
    }
  };

  const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  const masukCount = orders.filter(o => ['pending', 'payment_review', 'confirmed'].includes(o.status)).length;
  const dimasakCount = orders.filter(o => o.status === 'cooking').length;
  const selesaiCount = orders.filter(o => o.status === 'completed').length;
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fff8e9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7b1d18] border-t-transparent" />
          <p className="text-xs font-bold text-[#7b1d18]">Memuat dapur...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8e9] text-[#3c1712] pb-10">
      {/* Header */}
      <header className="bg-[#5d1715] px-5 pb-6 pt-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.17em] text-[#f3bf65]">
              Warung Rustanti
            </p>
            <h1 className="font-display text-[27px] leading-tight">
              Dapur Hari Ini
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                tts.setEnabled(nextState);
                if (nextState) tts.speak('Suara aktif');
              }}
              title={soundEnabled ? 'Matikan Notifikasi Suara' : 'Nyalakan Notifikasi Suara'}
              className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/20 transition"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#ffd17e]" /> : <VolumeX className="w-3.5 h-3.5 text-gray-300" />}
              <span className="text-[10px]">{soundEnabled ? 'Suara ON' : 'Mute'}</span>
            </button>

            <button
              onClick={() => router.push('/admin/settings')}
              title="Pengaturan QRIS & Warung"
              className="rounded-lg border border-white/20 bg-white/10 p-1.5 hover:bg-white/20 transition"
            >
              <Settings className="w-4 h-4 text-[#ffd17e]" />
            </button>

            <button
              onClick={() => router.push('/menu')}
              className="rounded-lg border border-white/25 px-2.5 py-1 text-xs font-bold hover:bg-white/10 transition"
            >
              Menu
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            [String(masukCount).padStart(2, '0'), 'Pesanan Masuk', 'bg-white/10'],
            [String(dimasakCount).padStart(2, '0'), 'Sedang Dimasak', 'bg-white/15'],
            [String(selesaiCount).padStart(2, '0'), 'Sudah Selesai', 'bg-white/10']
          ].map(([num, label, bgClass]) => (
            <div key={label} className={`rounded-xl ${bgClass} p-3 text-center border border-white/10`}>
              <b className="font-display text-2xl font-bold block">{num}</b>
              <span className="block text-[10px] text-[#f6d7a5] font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-4 pt-5 max-w-2xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[22px] text-[#4a231a]">
              Antrean Pesanan Aktif
            </h2>
            <span className="rounded-full bg-[#fde2a4] px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-[#956216]">
              {activeOrders.length} AKTIF
            </span>
          </div>
          <button 
            onClick={() => tts.test()} 
            className="flex items-center gap-1 text-[11px] font-bold text-[#b6452b] hover:underline"
          >
            <BellRing className="w-3.5 h-3.5" /> Tes Panggilan Suara
          </button>
        </div>

        {/* Order Cards List */}
        {activeOrders.length === 0 ? (
          <div className="rounded-2xl border border-[#ead8bd] bg-white p-12 text-center shadow-sm">
            <span className="text-4xl">🍳</span>
            <p className="mt-3 font-display text-base text-[#4a231a]">
              Belum ada pesanan aktif saat ini.
            </p>
            <p className="text-xs text-[#936f5c] mt-1">
              Setiap pesanan baru dari pelanggan akan otomatis muncul di sini dan bersuara.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {activeOrders.map((order) => {
              const isQRReview = order.status === 'payment_review';
              const isCooking = order.status === 'cooking';
              const isReady = order.status === 'ready';

              return (
                <div 
                  key={order.id} 
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                    isQRReview 
                      ? 'border-[#f59e0b] ring-1 ring-[#f59e0b]/30' 
                      : isCooking
                      ? 'border-[#ea580c] ring-1 ring-[#ea580c]/20'
                      : 'border-[#ead8bd]'
                  }`}
                >
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#f5eadb] pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-[#4a231a]">
                          {order.customer_name}
                        </span>
                        <span className="rounded-md bg-[#7b1d18] px-2 py-0.5 text-[11px] font-extrabold text-white">
                          {order.table_number || 'Meja 01'}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-[#987261] mt-0.5">
                        #{order.tracking_code} · {order.order_type === 'takeaway' ? 'Bungkus' : 'Dine-In'} · {order.phone_number || '-'}
                      </p>
                    </div>

                    {/* Status Pill */}
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      isQRReview
                        ? 'bg-[#fef3c7] text-[#92400e]'
                        : isCooking
                        ? 'bg-[#ffedd5] text-[#9a3412]'
                        : isReady
                        ? 'bg-[#dcfce7] text-[#166534]'
                        : 'bg-[#f3f4f6] text-[#374151]'
                    }`}>
                      {isQRReview ? 'Verifikasi Bayar' : isCooking ? 'Sedang Dimasak' : isReady ? 'Siap Diambil' : 'Pesanan Baru'}
                    </span>
                  </div>

                  {/* Food Items List - Clear & Large for Ibu! */}
                  <div className="py-3">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#987261] mb-1.5">
                      Menu yang Dimasak:
                    </p>
                    <div className="space-y-1 bg-[#fffaf2] p-2.5 rounded-xl border border-[#f5eadb]">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#432319]">
                            <span className="text-[#a5250c] font-black mr-1">{item.quantity}x</span> {item.name}
                          </span>
                          <span className="text-[11px] text-[#845f4c]">
                            {rupiah(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Footer: Total, Payment Status, and Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f5eadb]">
                    <div>
                      <span className="text-[10px] text-[#987261] block">Total Tagihan:</span>
                      <span className="font-display text-base font-bold text-[#a5250c]">
                        {rupiah(order.total)}
                      </span>
                      <span className="ml-1.5 text-[10px] font-semibold text-[#805949]">
                        ({order.payment_method === 'cash' ? '💵 Bayar Tunai' : '▣ QRIS'})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {order.payment_proof_url && (
                        <button
                          onClick={() => setSelectedImage(order.payment_proof_url)}
                          className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Bukti QR</span>
                        </button>
                      )}

                      {/* Workflow Action Buttons */}
                      {isQRReview ? (
                        <>
                          <button
                            onClick={() => handleVerifyPayment(order.id, true)}
                            className="rounded-xl bg-[#2e7d32] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#256629] transition"
                          >
                            ✓ Lunas & Masak
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(order.id, false)}
                            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition"
                          >
                            ✕ Tolak
                          </button>
                        </>
                      ) : order.status === 'pending' || order.status === 'confirmed' ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cooking')}
                          className="rounded-xl bg-[#7b1d18] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5e1612] transition"
                        >
                          🍳 Mulai Masak
                        </button>
                      ) : isCooking ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          className="rounded-xl bg-[#e65100] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#c74500] transition"
                        >
                          🔔 Siap Diambil / Diantar
                        </button>
                      ) : isReady ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          className="rounded-xl bg-[#2e7d32] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#256629] transition"
                        >
                          ✓ Selesai
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Bukti Pembayaran */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-lg bg-white rounded-2xl p-3 shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-xs font-bold text-[#4a231a] mb-2 px-1">
              Foto Bukti Transfer QRIS Pelanggan
            </p>
            <img
              src={selectedImage}
              alt="Bukti Transfer"
              className="max-h-[75vh] w-auto rounded-xl object-contain mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  );
}
