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
      <div className="min-h-screen bg-[#6c1717]">
        <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] shadow-2xl shadow-[#260909] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7b1d18] mx-auto mb-4"></div>
            <p className="text-[#936d5c]">Memuat pesanan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#6c1717]">
        <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] shadow-2xl shadow-[#260909] flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-[#4d2018] mb-2">
              {error || 'Pesanan Tidak Ditemukan'}
            </h2>
            <p className="text-sm text-[#936d5c] mb-6">
              Periksa kembali kode tracking Anda
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

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const progress = getProgressPercentage(order.status);

  return (
    <div className="min-h-screen bg-[#6c1717]">
      <div className="mx-auto min-h-screen max-w-[414px] bg-[#fff8e9] shadow-2xl shadow-[#260909] pb-28">
        {/* Status Card at Top */}
        <div className="px-5 pt-6">
          <div className="rounded-[26px] bg-[#7b1d18] p-5 text-[#fff6e2]">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#ffd17e]">
              Pesanan #{order.order_number}
            </p>
            <h2 className="mt-1 text-[28px] font-bold">
              {order.status === 'cooking' ? 'Lagi dimasak!' : 
               order.status === 'ready' ? 'Siap diambil!' :
               order.status === 'completed' ? 'Selesai!' : 'Pesanan diterima!'}
            </h2>
            <p className="mt-1 text-xs text-[#f8d8a7]">
              {order.status === 'cooking' ? 'Estimasi siap dalam 12 menit' :
               order.status === 'ready' ? 'Pesanan Anda sudah siap!' :
               order.status === 'completed' ? 'Terima kasih sudah memesan' :
               'Pesanan Anda sedang diproses'}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#56120f]">
              <div
                className="h-full rounded-full bg-[#edb13d] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mt-7 px-5">
          <h3 className="text-[22px] font-bold text-[#4d2018]">
            Perjalanan pesananmu
          </h3>
          <div className="mt-5">
            {[
              { key: 'pending', title: 'Pesanan diterima', desc: `${formatTime(order.created_at)} · Kami sudah menerima pesananmu`, active: true },
              { key: 'cooking', title: 'Sedang dimasak', desc: 'Dapur sedang menyiapkan pesanan', active: ['cooking', 'ready', 'completed'].includes(order.status) },
              { key: 'ready', title: 'Siap diambil', desc: 'Tunggu sebentar lagi, ya!', active: ['ready', 'completed'].includes(order.status) },
              { key: 'completed', title: 'Selesai', desc: 'Selamat menikmati hidanganmu', active: order.status === 'completed' }
            ].map((step, i, arr) => (
              <div className="relative flex gap-4 pb-7" key={step.key}>
                {i < arr.length - 1 && (
                  <div
                    className={`absolute left-[9px] top-5 h-[calc(100%-10px)] w-0.5 ${
                      step.active ? 'bg-[#e2633d]' : 'bg-[#ead7bd]'
                    }`}
                  />
                )}
                <span
                  className={`z-10 grid h-5 w-5 place-items-center rounded-full border-4 ${
                    step.active
                      ? 'border-[#f3b34a] bg-[#d94a2e]'
                      : 'border-[#ead7bd] bg-[#fff8e9]'
                  }`}
                >
                  {step.active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <div>
                  <p
                    className={`text-sm font-extrabold ${
                      step.active ? 'text-[#59251c]' : 'text-[#aa8979]'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#947062]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="mt-5 px-5">
          <div className="rounded-2xl border border-[#f0dfc8] bg-white p-4">
            <h3 className="text-sm font-bold text-[#4d2018] mb-3">
              Detail Pesanan
            </h3>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#936d5c]">Kode Tracking:</span>
                <span className="font-bold text-[#4a231a]">{order.tracking_code}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#936d5c]">Nama:</span>
                <span className="font-semibold text-[#4a231a]">{order.customer_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#936d5c]">Tipe:</span>
                <span className="font-semibold text-[#4a231a]">
                  {order.order_type === 'dine_in' ? '🍽️ Makan di Tempat' : '📦 Bungkus'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#936d5c]">Pembayaran:</span>
                <span className="font-semibold text-[#4a231a]">
                  {order.payment_method === 'cash' ? '💵 Cash' : '📱 QRIS'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-[#ead7bd] pt-3 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-[#4a231a]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-bold text-[#4a231a]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-[#ead7bd]">
              <span className="text-sm font-bold text-[#805949]">Total</span>
              <span className="text-xl font-bold text-[#962c20]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 px-5">
          <button
            onClick={() => router.push('/menu')}
            className="w-full rounded-2xl border border-[#d79b70] bg-white py-3 text-sm font-bold text-[#9a3927] hover:bg-[#fff8e9] transition"
          >
            Tambah pesanan
          </button>
        </div>
      </div>
    </div>
  );
}
