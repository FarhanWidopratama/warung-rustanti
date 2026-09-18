'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Clock, CheckCircle, ChefHat, Package, Home } from 'lucide-react';
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
  table_number: string;
  customer_name: string;
  phone_number: string;
  order_type: string;
  payment_method: string;
  payment_verified: boolean;
  tracking_code: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
}

export default function TrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = params.code as string;
  const phone = searchParams.get('phone');

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (code) {
      fetchOrder();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel(`order_${code}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `tracking_code=eq.${code}`,
          },
          (payload) => {
            console.log('Order updated:', payload);
            setOrder(payload.new as Order);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [code]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('orders')
        .select('*')
        .eq('tracking_code', code)
        .single();

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching order:', fetchError);
        setError('Pesanan tidak ditemukan');
        setIsLoading(false);
        return;
      }

      // Verify phone number if provided
      if (phone && data.phone_number !== phone) {
        setError('Nomor HP tidak sesuai');
        setIsLoading(false);
        return;
      }

      setOrder(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
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

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any; description: string }> = {
      pending: {
        label: 'Menunggu Pembayaran',
        color: 'bg-yellow-500',
        icon: Clock,
        description: 'Silakan bayar di kasir',
      },
      payment_review: {
        label: 'Verifikasi Pembayaran',
        color: 'bg-blue-500',
        icon: Clock,
        description: 'Kasir sedang memverifikasi bukti pembayaran',
      },
      confirmed: {
        label: 'Pembayaran Diterima',
        color: 'bg-green-500',
        icon: CheckCircle,
        description: 'Pesanan Anda masuk antrian',
      },
      cooking: {
        label: 'Sedang Dimasak',
        color: 'bg-orange-500',
        icon: ChefHat,
        description: 'Chef sedang menyiapkan pesanan Anda',
      },
      ready: {
        label: 'Siap Diambil',
        color: 'bg-green-600',
        icon: Package,
        description: 'Pesanan Anda sudah siap!',
      },
      completed: {
        label: 'Selesai',
        color: 'bg-gray-500',
        icon: CheckCircle,
        description: 'Terima kasih! Pesanan sudah diambil',
      },
      cancelled: {
        label: 'Dibatalkan',
        color: 'bg-red-500',
        icon: Clock,
        description: 'Pesanan dibatalkan',
      },
    };

    return statusMap[status] || statusMap.pending;
  };

  const getProgressPercentage = (status: string) => {
    const progressMap: Record<string, number> = {
      pending: 20,
      payment_review: 30,
      confirmed: 50,
      cooking: 70,
      ready: 90,
      completed: 100,
      cancelled: 0,
    };
    return progressMap[status] || 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e6ded6] flex justify-center">
        <div className="w-full max-w-md bg-[#fff8f7] min-h-screen shadow-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c83e23] mx-auto mb-4"></div>
            <p className="text-[#5a413c]">Memuat pesanan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#e6ded6] flex justify-center">
        <div className="w-full max-w-md bg-[#fff8f7] min-h-screen shadow-2xl flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-[#1e1b1b] mb-2">
              {error || 'Pesanan Tidak Ditemukan'}
            </h2>
            <p className="text-sm text-[#5a413c] mb-6">
              Periksa kembali kode tracking Anda
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

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const progress = getProgressPercentage(order.status);

  return (
    <div className="min-h-screen bg-[#e6ded6] flex justify-center">
      <div className="w-full max-w-md bg-[#fff8f7] min-h-screen shadow-2xl relative">
        {/* Header */}
        <div className="bg-white border-b border-[#e6ded6] sticky top-0 z-40">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-[#1e1b1b] text-center">
              Lacak Pesanan
            </h1>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Tracking Code Card */}
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-card">
            <div className="text-center mb-4">
              <p className="text-xs text-[#5a413c] mb-1">Kode Tracking</p>
              <p className="text-3xl font-bold text-[#c83e23] tracking-wider mb-2">
                {order.tracking_code}
              </p>
              <p className="text-xs text-[#5a413c]">
                {formatDate(order.created_at)} • {formatTime(order.created_at)}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-[#e6ded6] rounded-full overflow-hidden">
                <div
                  className={`h-full ${statusInfo.color} transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Current Status */}
            <div className={`${statusInfo.color} bg-opacity-10 border-2 border-current rounded-xl p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <StatusIcon className="w-6 h-6" />
                <p className="text-base font-bold">{statusInfo.label}</p>
              </div>
              <p className="text-sm opacity-80">{statusInfo.description}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
            <h2 className="text-sm font-bold text-[#1e1b1b] mb-3">
              Informasi Pelanggan
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#5a413c]">Nama:</span>
                <span className="font-semibold text-[#1e1b1b]">
                  {order.customer_name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5a413c]">No. HP:</span>
                <span className="font-semibold text-[#1e1b1b]">
                  {order.phone_number}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5a413c]">Tipe:</span>
                <span className="font-semibold text-[#1e1b1b]">
                  {order.order_type === 'dine_in' ? '🍽️ Makan di Tempat' : '📦 Bungkus'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5a413c]">Pembayaran:</span>
                <span className="font-semibold text-[#1e1b1b]">
                  {order.payment_method === 'cash' ? '💵 Cash' : '📱 QRIS'}
                  {order.payment_verified && (
                    <span className="ml-1 text-green-600">✓</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
            <h2 className="text-sm font-bold text-[#1e1b1b] mb-3">
              Detail Pesanan
            </h2>
            <div className="space-y-2 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-[#1e1b1b]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-semibold text-[#1e1b1b]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-[#e6ded6]">
              <p className="font-bold text-[#1e1b1b]">Total</p>
              <p className="text-xl font-bold text-[#c83e23]">
                {formatPrice(order.total)}
              </p>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
            <h2 className="text-sm font-bold text-[#1e1b1b] mb-4">
              Timeline Pesanan
            </h2>
            <div className="space-y-4">
              {[
                { status: 'pending', label: 'Pesanan Dibuat' },
                { status: 'confirmed', label: 'Pembayaran Diterima' },
                { status: 'cooking', label: 'Sedang Dimasak' },
                { status: 'ready', label: 'Siap Diambil' },
                { status: 'completed', label: 'Selesai' },
              ].map((step, idx) => {
                const isActive = getProgressPercentage(order.status) >= getProgressPercentage(step.status);
                const isCurrent = order.status === step.status;
                
                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                        isActive
                          ? isCurrent
                            ? 'bg-[#c83e23] text-white ring-4 ring-[#c83e23]/20'
                            : 'bg-[#2e7d32] text-white'
                          : 'bg-[#e6ded6] text-[#8c827a]'
                      }`}
                    >
                      {isActive ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? 'text-[#1e1b1b]' : 'text-[#8c827a]'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-[#c83e23] font-semibold">
                          Status saat ini
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => fetchOrder()}
              className="w-full bg-[#c83e23] text-white rounded-full py-4 font-bold text-base shadow-float hover:bg-[#a8321b] active:scale-[0.98] transition-all"
            >
              🔄 Refresh Status
            </button>
            
            <button
              onClick={() => router.push('/menu')}
              className="w-full bg-[#f5efeb] text-[#1e1b1b] border-2 border-[#e6ded6] rounded-full py-4 font-bold text-base hover:bg-[#e6ded6] transition flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Kembali ke Menu
            </button>
          </div>

          {/* Auto Refresh Info */}
          <p className="text-center text-xs text-[#5a413c] mt-4">
            ✨ Halaman ini akan update otomatis saat status berubah
          </p>
        </div>
      </div>
    </div>
  );
}
