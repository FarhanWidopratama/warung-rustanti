'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, ChefHat, Package, Bell, BellOff, Eye, X, Settings } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { tts } from '@/lib/textToSpeech';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  table_number: string;
  customer_name: string;
  phone_number: string;
  order_type: string;
  payment_method: string;
  payment_proof_url: string | null;
  payment_verified: boolean;
  tracking_code: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Initialize TTS
  useEffect(() => {
    const enabled = tts.isEnabled();
    setIsTTSEnabled(enabled);
  }, []);

  // Fetch orders and subscribe to changes
  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            announceNewOrder(newOrder);
          }
          
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const announceNewOrder = (order: Order) => {
    if (!tts.isEnabled()) return;

    tts.announceNewOrder({
      customerName: order.customer_name,
      orderNumber: order.tracking_code,
      total: order.total,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

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

      if (error) {
        console.error('Error verifying payment:', error);
        alert('Gagal memverifikasi pembayaran');
        return;
      }

      if (approve && tts.isEnabled()) {
        tts.speak('Pembayaran diterima');
      }

      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating status:', error);
        alert('Gagal update status');
        return;
      }

      if (tts.isEnabled()) {
        if (newStatus === 'cooking') {
          tts.speak('Pesanan sedang dimasak');
        } else if (newStatus === 'ready') {
          tts.speak('Pesanan siap diambil');
        } else if (newStatus === 'completed') {
          tts.speak('Pesanan selesai');
        }
      }

      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleTTS = () => {
    const newState = !isTTSEnabled;
    setIsTTSEnabled(newState);
    tts.setEnabled(newState);
    
    if (newState) {
      tts.speak('Notifikasi suara diaktifkan');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Categorize orders
  const pendingPaymentOrders = orders.filter(
    (order) => order.status === 'pending' || order.status === 'payment_review'
  );
  const confirmedOrders = orders.filter((order) => order.status === 'confirmed');
  const cookingOrders = orders.filter((order) => order.status === 'cooking');
  const readyOrders = orders.filter((order) => order.status === 'ready');
  const completedOrders = orders.filter((order) => order.status === 'completed');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#6c1717] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fff8e9] mx-auto mb-4"></div>
          <p className="text-[#fff8e9]">Memuat...</p>
        </div>
      </div>
    );
  }

  // Count by status
        pending: { label: 'Menunggu Bayar', color: 'bg-yellow-100 text-yellow-800' },
        payment_review: { label: 'Verifikasi QRIS', color: 'bg-blue-100 text-blue-800' },
        confirmed: { label: 'Siap Masak', color: 'bg-green-100 text-green-800' },
        cooking: { label: 'Sedang Masak', color: 'bg-orange-100 text-orange-800' },
        ready: { label: 'Siap Diambil', color: 'bg-green-200 text-green-900' },
        completed: { label: 'Selesai', color: 'bg-gray-100 text-gray-600' },
      };
      
      const badge = badges[order.status] || badges.pending;
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
          {badge.label}
        </span>
      );
    };

    return (
      <div className="bg-white rounded-xl p-4 shadow-card border-2 border-[#e6ded6]">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-lg text-[#c83e23]">
              {order.tracking_code}
            </p>
            <p className="text-sm text-[#5a413c]">{formatTime(order.created_at)}</p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Customer Info */}
        <div className="mb-3 pb-3 border-b border-[#e6ded6]">
          <p className="text-sm font-semibold text-[#1e1b1b]">{order.customer_name}</p>
          <p className="text-xs text-[#5a413c]">{order.phone_number}</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-[#f5efeb] px-2 py-0.5 rounded">
              {order.order_type === 'dine_in' ? '🍽️ Makan di tempat' : '📦 Bungkus'}
            </span>
            <span className="text-xs bg-[#f5efeb] px-2 py-0.5 rounded">
              {order.payment_method === 'cash' ? '💵 Cash' : '📱 QRIS'}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="mb-3 space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-[#1e1b1b]">
                {item.quantity}x {item.name}
              </span>
              <span className="font-semibold text-[#5a413c]">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center mb-3 pt-2 border-t-2 border-[#e6ded6]">
          <span className="font-bold text-[#1e1b1b]">Total</span>
          <span className="text-lg font-bold text-[#c83e23]">
            {formatPrice(order.total)}
          </span>
        </div>

        {/* Payment Proof (QRIS) */}
        {order.payment_method === 'qris' && order.payment_proof_url && (
          <div className="mb-3">
            <p className="text-xs text-[#5a413c] mb-2 font-semibold">
              📸 Bukti Pembayaran:
            </p>
            <div className="relative">
              <img
                src={order.payment_proof_url}
                alt="Bukti bayar"
                className="w-full h-32 object-cover rounded-lg cursor-pointer border-2 border-[#e6ded6]"
                onClick={() => setSelectedImage(order.payment_proof_url)}
              />
              <button
                onClick={() => setSelectedImage(order.payment_proof_url)}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(order.status === 'pending' || order.status === 'payment_review') && 
         order.payment_method === 'qris' && 
         order.payment_proof_url && (
          <div className="flex gap-2">
            <button
              onClick={() => handleVerifyPayment(order.id, true)}
              className="flex-1 bg-[#2e7d32] text-white py-2.5 rounded-lg font-semibold hover:bg-[#1b5e20] transition"
            >
              ✓ Terima
            </button>
            <button
              onClick={() => handleVerifyPayment(order.id, false)}
              className="flex-1 bg-[#c62828] text-white py-2.5 rounded-lg font-semibold hover:bg-[#b71c1c] transition"
            >
              ✗ Tolak
            </button>
          </div>
        )}

        {order.status === 'pending' && order.payment_method === 'cash' && (
          <button
            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
            className="w-full bg-[#2e7d32] text-white py-2.5 rounded-lg font-semibold"
          >
            ✓ Bayar Cash Diterima
          </button>
        )}

        {order.status === 'confirmed' && (
          <button
            onClick={() => handleUpdateStatus(order.id, 'cooking')}
            className="w-full bg-[#c83e23] text-white py-2.5 rounded-lg font-semibold hover:bg-[#a8321b] transition flex items-center justify-center gap-2"
          >
            <ChefHat className="w-5 h-5" />
            Mulai Masak
          </button>
        )}

        {order.status === 'cooking' && (
          <button
            onClick={() => handleUpdateStatus(order.id, 'ready')}
            className="w-full bg-[#2e7d32] text-white py-2.5 rounded-lg font-semibold hover:bg-[#1b5e20] transition flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            Siap Diambil
          </button>
        )}

        {order.status === 'ready' && (
          <button
            onClick={() => handleUpdateStatus(order.id, 'completed')}
            className="w-full bg-gray-600 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Selesai
          </button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#6c1717] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fff8e9] mx-auto mb-4"></div>
          <p className="text-[#fff8e9]">Memuat...</p>
        </div>
      </div>
    );
  }

  // Count by status
  const masukCount = orders.filter(o => ['pending', 'payment_review'].includes(o.status)).length;
  const dimasakCount = orders.filter(o => o.status === 'cooking').length;
  const selesaiCount = orders.filter(o => o.status === 'completed').length;
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-[#fff8e9]">
      {/* Header */}
      <header className="bg-[#5d1715] px-5 pb-6 pt-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.17em] text-[#f3bf65]">
              Warung Rustanti
            </p>
            <h1 className="text-[27px] font-bold">Dapur hari ini</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleTTS}
              className="rounded-lg border border-white/25 px-2 py-1 text-[10px] font-bold hover:bg-white/10 transition"
            >
              {isTTSEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <Link
              href="/admin/settings"
              className="rounded-lg border border-white/25 px-2 py-1 text-[10px] font-bold hover:bg-white/10 transition"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 p-2">
            <b className="text-xl font-bold">{String(masukCount).padStart(2, '0')}</b>
            <span className="block text-[9px] text-[#f6d7a5]">Masuk</span>
          </div>
          <div className="rounded-xl bg-white/10 p-2">
            <b className="text-xl font-bold">{String(dimasakCount).padStart(2, '0')}</b>
            <span className="block text-[9px] text-[#f6d7a5]">Dimasak</span>
          </div>
          <div className="rounded-xl bg-white/10 p-2">
            <b className="text-xl font-bold">{String(selesaiCount).padStart(2, '0')}</b>
            <span className="block text-[9px] text-[#f6d7a5]">Selesai</span>
          </div>
        </div>
      </header>

      {/* Orders Table */}
      <div className="px-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-[#4d2018]">Pesanan aktif</h2>
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
    </div>
  );
}

