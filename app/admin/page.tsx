'use client';

import { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  tracking_code: string;
  customer_name: string;
  phone_number: string;
  order_type: string;
  payment_method: string;
  payment_proof_url: string | null;
  payment_verified: boolean;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
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
          status: approve ? 'confirmed' : 'cancelled',
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fff8e9] flex items-center justify-center">
        <p className="text-[#7b1d18]">Memuat...</p>
      </main>
    );
  }

  const masukCount = orders.filter(o => ['pending', 'payment_review'].includes(o.status)).length;
  const dimasakCount = orders.filter(o => o.status === 'cooking').length;
  const selesaiCount = orders.filter(o => o.status === 'completed').length;
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));

  return (
    <main className="min-h-screen bg-[#fff8e9] pb-8">
      {/* Header */}
      <header className="bg-[#5d1715] px-5 pb-6 pt-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.17em] text-[#f3bf65]">
              Warung Rustanti
            </p>
            <h1 className="text-[27px]" style={{fontWeight: 700}}>Dapur hari ini</h1>
          </div>
          <a
            href="/menu"
            className="rounded-lg border border-white/25 px-2 py-1 text-[10px] font-bold hover:bg-white/10 transition"
          >
            Keluar
          </a>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            [String(masukCount).padStart(2, '0'), 'Masuk'],
            [String(dimasakCount).padStart(2, '0'), 'Dimasak'],
            [String(selesaiCount).padStart(2, '0'), 'Selesai']
          ].map(([num, label]) => (
            <div key={label} className="rounded-xl bg-white/10 p-2">
              <b className="text-xl font-bold" style={{fontWeight: 700}}>{num}</b>
              <span className="block text-[9px] text-[#f6d7a5]">{label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Orders Table */}
      <div className="px-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[22px]" style={{fontWeight: 700}}>Pesanan aktif</h2>
          <span className="rounded-full bg-[#f5dfac] px-2 py-1 font-mono text-[9px] font-bold text-[#89531f]">
            LIVE
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#ead8bd] bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-[1.2fr_.7fr_.7fr] border-b border-[#ead8bd] bg-[#f9f0df] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#936f5c]">
            <span>Pelanggan</span>
            <span>Status</span>
            <span className="text-right">Aksi</span>
          </div>

          {/* Table Rows */}
          {activeOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#936f5c]">
              Tidak ada pesanan aktif
            </div>
          ) : (
            activeOrders.map((order) => {
              const getStatusInfo = () => {
                if (order.status === 'payment_review') {
                  return { label: 'Verifikasi', bg: 'bg-[#fde2a4]', text: 'text-[#956216]' };
                }
                if (order.status === 'confirmed' || order.status === 'pending') {
                  return { label: 'Baru', bg: 'bg-[#fde2a4]', text: 'text-[#956216]' };
                }
                if (order.status === 'cooking') {
                  return { label: 'Dimasak', bg: 'bg-[#f9d8cb]', text: 'text-[#a34229]' };
                }
                if (order.status === 'ready') {
                  return { label: 'Siap', bg: 'bg-[#dcecd7]', text: 'text-[#497141]' };
                }
                return { label: 'Baru', bg: 'bg-[#fde2a4]', text: 'text-[#956216]' };
              };

              const statusInfo = getStatusInfo();
              
              const getNextAction = () => {
                if (order.status === 'payment_review') {
                  return {
                    label: 'Verifikasi',
                    onClick: () => handleVerifyPayment(order.id, true),
                    showReject: true,
                  };
                }
                if (order.status === 'pending' || order.status === 'confirmed') {
                  return {
                    label: 'Masak',
                    onClick: () => handleUpdateStatus(order.id, 'cooking'),
                    showReject: false,
                  };
                }
                if (order.status === 'cooking') {
                  return {
                    label: 'Siap',
                    onClick: () => handleUpdateStatus(order.id, 'ready'),
                    showReject: false,
                  };
                }
                if (order.status === 'ready') {
                  return {
                    label: 'Selesai',
                    onClick: () => handleUpdateStatus(order.id, 'completed'),
                    showReject: false,
                  };
                }
                return { label: 'Proses', onClick: () => {}, showReject: false };
              };

              const action = getNextAction();

              return (
                <div
                  key={order.id}
                  className="grid grid-cols-[1.2fr_.7fr_.7fr] items-center border-b border-[#f2e6d4] px-3 py-3 last:border-0"
                >
                  {/* Customer Info */}
                  <div>
                    <p className="text-xs font-extrabold text-[#4c251a]">
                      {order.customer_name}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] text-[#987261]">
                      {order.tracking_code} · {order.items.length} item · {order.payment_method === 'cash' ? 'Cash' : 'QRIS'}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span className={`w-fit rounded-full px-2 py-1 text-[9px] font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>

                  {/* Action Buttons */}
                  <div className="justify-self-end flex gap-2">
                    {order.payment_proof_url && (
                      <button
                        onClick={() => setSelectedImage(order.payment_proof_url)}
                        className="rounded-lg bg-blue-500 px-2 py-1.5 text-[9px] font-bold text-white hover:bg-blue-600"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={action.onClick}
                      className="rounded-lg bg-[#7b1d18] px-2 py-1.5 text-[9px] font-bold text-white hover:bg-[#5d1614]"
                    >
                      {action.label}
                    </button>
                    {action.showReject && (
                      <button
                        onClick={() => handleVerifyPayment(order.id, false)}
                        className="rounded-lg bg-red-500 px-2 py-1.5 text-[9px] font-bold text-white hover:bg-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedImage}
              alt="Bukti Pembayaran"
              className="max-h-[80vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  );
}
