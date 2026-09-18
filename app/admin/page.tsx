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

  const OrderCard = ({ order }: { order: Order }) => {
    const getStatusBadge = () => {
      const badges: Record<string, { label: string; color: string }> = {
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
      <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c83e23] mx-auto mb-4"></div>
          <p className="text-lg text-[#5a413c]">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f7]">
      {/* Header */}
      <div className="bg-white border-b-2 border-[#e6ded6] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1e1b1b]">
                🍳 Dapur Bu Sri
              </h1>
              <p className="text-sm text-[#5a413c]">Dashboard Admin</p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Settings Link */}
              <Link
                href="/admin/settings"
                className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                title="Pengaturan"
              >
                <Settings className="w-6 h-6" />
              </Link>
              
              {/* TTS Toggle */}
              <button
                onClick={toggleTTS}
                className={`p-3 rounded-xl transition ${
                  isTTSEnabled
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
                title={isTTSEnabled ? 'Notif Suara ON' : 'Notif Suara OFF'}
              >
                {isTTSEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
              <p className="text-xs text-yellow-700">Menunggu</p>
              <p className="text-xl font-bold text-yellow-800">{pendingPaymentOrders.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
              <p className="text-xs text-green-700">Confirmed</p>
              <p className="text-xl font-bold text-green-800">{confirmedOrders.length}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
              <p className="text-xs text-orange-700">Masak</p>
              <p className="text-xl font-bold text-orange-800">{cookingOrders.length}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
              <p className="text-xs text-blue-700">Siap</p>
              <p className="text-xl font-bold text-blue-800">{readyOrders.length}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-700">Selesai</p>
              <p className="text-xl font-bold text-gray-800">{completedOrders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Columns */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Column 1: Pending Payment */}
          <div>
            <h2 className="text-sm font-bold text-[#1e1b1b] mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Menunggu Verifikasi ({pendingPaymentOrders.length})
            </h2>
            <div className="space-y-3">
              {pendingPaymentOrders.length === 0 ? (
                <p className="text-sm text-[#8c827a] text-center py-8 bg-white rounded-lg">
                  Tidak ada pesanan
                </p>
              ) : (
                pendingPaymentOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          </div>

          {/* Column 2: Confirmed */}
          <div>
            <h2 className="text-sm font-bold text-[#1e1b1b] mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Siap Masak ({confirmedOrders.length})
            </h2>
            <div className="space-y-3">
              {confirmedOrders.length === 0 ? (
                <p className="text-sm text-[#8c827a] text-center py-8 bg-white rounded-lg">
                  Tidak ada pesanan
                </p>
              ) : (
                confirmedOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          </div>

          {/* Column 3: Cooking */}
          <div>
            <h2 className="text-sm font-bold text-[#1e1b1b] mb-3 flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Sedang Masak ({cookingOrders.length})
            </h2>
            <div className="space-y-3">
              {cookingOrders.length === 0 ? (
                <p className="text-sm text-[#8c827a] text-center py-8 bg-white rounded-lg">
                  Tidak ada pesanan
                </p>
              ) : (
                cookingOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          </div>

          {/* Column 4: Ready */}
          <div>
            <h2 className="text-sm font-bold text-[#1e1b1b] mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Siap Diambil ({readyOrders.length})
            </h2>
            <div className="space-y-3">
              {readyOrders.length === 0 ? (
                <p className="text-sm text-[#8c827a] text-center py-8 bg-white rounded-lg">
                  Tidak ada pesanan
                </p>
              ) : (
                readyOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          </div>

          {/* Column 5: Completed */}
          <div>
            <h2 className="text-sm font-bold text-[#1e1b1b] mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Selesai ({completedOrders.length})
            </h2>
            <div className="space-y-3">
              {completedOrders.length === 0 ? (
                <p className="text-sm text-[#8c827a] text-center py-8 bg-white rounded-lg">
                  Tidak ada pesanan
                </p>
              ) : (
                completedOrders.slice(0, 10).map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 bg-white text-black p-2 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
