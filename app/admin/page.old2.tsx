'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, ChefHat, Package, Settings, Bell, BellOff, Eye } from 'lucide-react';
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

interface StockItem {
  id: string;
  name: string;
  category: string;
  available: boolean;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // Initialize TTS
  useEffect(() => {
    const enabled = tts.isEnabled();
    setIsTTSEnabled(enabled);
  }, []);

  // Fetch orders from Supabase
  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const subscription = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // New order - announce it!
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
          payment_verified_at: new Date().toISOString(),
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
        console.error('Error updating order:', error);
        alert('Gagal update status pesanan');
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

  const testTTS = () => {
    tts.test();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const testTTS = () => {
    tts.test();
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
      <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center">
        <p className="text-lg text-[#5a413c]">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e6ded6] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1e1b1b]">
                Dapur Warung Bu Sri
              </h1>
              <p className="text-sm text-[#5a413c] mt-0.5">Dashboard Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#e6ded6] sticky top-[73px] z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold text-sm transition-all ${
                activeTab === 'orders'
                  ? 'text-[#c83e23] border-b-2 border-[#c83e23]'
                  : 'text-[#5a413c]'
              }`}
            >
              <ChefHat className="w-5 h-5" />
              Kelola Pesanan
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold text-sm transition-all ${
                activeTab === 'stock'
                  ? 'text-[#c83e23] border-b-2 border-[#c83e23]'
                  : 'text-[#5a413c]'
              }`}
            >
              <Package className="w-5 h-5" />
              Kelola Stok
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'orders' ? (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Pending Orders */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#e89218]" />
                <h2 className="text-lg font-bold text-[#1e1b1b]">
                  Pesanan Baru
                </h2>
                <span className="ml-auto bg-[#e89218] text-white text-xs font-bold px-2 py-1 rounded-full">
                  {pendingOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-4 shadow-card border-l-4 border-[#e89218]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-[#1e1b1b]">
                          {order.table_number}
                        </p>
                        <p className="text-xs text-[#5a413c]">
                          {order.customer_name}
                        </p>
                      </div>
                      <span className="text-xs text-[#5a413c]">
                        {formatTime(order.created_at)}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-[#1e1b1b]">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-3 pt-3 border-t border-[#e6ded6]">
                      <span className="text-sm text-[#5a413c]">Total</span>
                      <span className="text-base font-bold text-[#c83e23]">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleProcessOrder(order.id)}
                      className="w-full bg-[#e89218] text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-[#d17f0f] active:scale-[0.98] transition-all"
                    >
                      Proses Pesanan
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Orders */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="w-5 h-5 text-[#c83e23]" />
                <h2 className="text-lg font-bold text-[#1e1b1b]">
                  Sedang Diproses
                </h2>
                <span className="ml-auto bg-[#c83e23] text-white text-xs font-bold px-2 py-1 rounded-full">
                  {processingOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {processingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-4 shadow-card border-l-4 border-[#c83e23]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-[#1e1b1b]">
                          {order.table_number}
                        </p>
                        <p className="text-xs text-[#5a413c]">
                          {order.customer_name}
                        </p>
                      </div>
                      <span className="text-xs text-[#5a413c]">
                        {formatTime(order.created_at)}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-[#1e1b1b]">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-3 pt-3 border-t border-[#e6ded6]">
                      <span className="text-sm text-[#5a413c]">Total</span>
                      <span className="text-base font-bold text-[#c83e23]">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="w-full bg-[#2e7d32] text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-[#1b5e20] active:scale-[0.98] transition-all"
                    >
                      Selesai
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Orders */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-[#2e7d32]" />
                <h2 className="text-lg font-bold text-[#1e1b1b]">Selesai</h2>
                <span className="ml-auto bg-[#2e7d32] text-white text-xs font-bold px-2 py-1 rounded-full">
                  {completedOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {completedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-4 shadow-card border-l-4 border-[#2e7d32] opacity-75"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-[#1e1b1b]">
                          {order.table_number}
                        </p>
                        <p className="text-xs text-[#5a413c]">
                          {order.customer_name}
                        </p>
                      </div>
                      <span className="text-xs text-[#5a413c]">
                        {formatTime(order.created_at)}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-[#1e1b1b]">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[#e6ded6]">
                      <span className="text-sm text-[#5a413c]">Total</span>
                      <span className="text-base font-bold text-[#2e7d32]">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Stock Management
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h2 className="text-xl font-bold text-[#1e1b1b] mb-6">
                Ketersediaan Menu
              </h2>
              <div className="space-y-4">
                {Object.entries(
                  stockItems.reduce((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item);
                    return acc;
                  }, {} as Record<string, StockItem[]>)
                ).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-[#5a413c] mb-3 uppercase">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-[#f5efeb] rounded-lg"
                        >
                          <span className="text-sm font-semibold text-[#1e1b1b]">
                            {item.name}
                          </span>
                          <button
                            onClick={() => toggleStock(item.id)}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                              item.available ? 'bg-[#2e7d32]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                item.available ? 'translate-x-8' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
