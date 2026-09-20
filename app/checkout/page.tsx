'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { supabase } from '@/lib/supabase';

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

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, getCartTotal, clearCart, getCartItemCount } = useCart();
  const [payment, setPayment] = useState<'cash' | 'qris'>('qris');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [tableNumber, setTableNumber] = useState('01');
  const [customTable, setCustomTable] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const total = getCartTotal();
  const itemCount = getCartItemCount();
  const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  const quickTables = ['01', '02', '03', '04', '05', '06', '07', '08'];

  useEffect(() => {
    // Fetch QRIS image from Supabase settings
    const fetchQrisSetting = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'qris_image_url')
          .single();

        if (!error && data?.value) {
          setQrisImageUrl(data.value);
        }
      } catch (err) {
        console.error('Error fetching QRIS setting:', err);
      }
    };

    fetchQrisSetting();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Keranjang belanja kamu masih kosong!');
      return;
    }

    if (!customerName.trim() || !phoneNumber.trim()) {
      alert('Nama dan nomor HP harus diisi!');
      return;
    }

    const finalTable = orderType === 'dine_in' 
      ? (customTable.trim() ? `Meja ${customTable.trim()}` : `Meja ${tableNumber}`) 
      : 'Bungkus / Takeaway';

    if (orderType === 'dine_in' && !tableNumber && !customTable.trim()) {
      alert('Silakan pilih atau masukkan nomor meja!');
      return;
    }

    if (payment === 'qris' && !paymentProof) {
      alert('Silakan upload bukti transfer QRIS terlebih dahulu!');
      return;
    }

    setIsLoading(true);

    try {
      let paymentProofUrl = null;

      if (paymentProof) {
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `${Date.now()}_proof.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof);

        if (uploadError) {
          console.warn('Upload proof warning (continuing):', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(fileName);
          paymentProofUrl = publicUrl;
        }
      }

      const trackingCode = `WR-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const orderNumber = `WR-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        table_number: finalTable,
        tracking_code: trackingCode,
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
        order_type: orderType,
        payment_method: payment,
        payment_proof_url: paymentProofUrl,
        payment_verified: payment === 'cash',
        items: cart,
        total: total,
        status: payment === 'cash' ? 'pending' : 'payment_review',
      });

      if (error) {
        console.error('Insert order error:', error);
        throw error;
      }

      // Clear cart & store last order code
      clearCart();
      if (typeof window !== 'undefined') {
        localStorage.setItem('last_order_code', trackingCode);
      }

      router.push(`/track/${trackingCode}`);
    } catch (error) {
      console.error('Error checkout:', error);
      alert('Gagal memproses pesanan. Silakan periksa koneksi dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#6c1717] flex justify-center text-[#3c1712] selection:bg-[#f4b83f] selection:text-[#3c1712]">
      <div className="w-full min-h-screen max-w-[414px] bg-[#fff8e9] shadow-2xl shadow-[#260909] relative pb-24">
        
        {/* Top Header */}
        <header className="relative z-10 flex items-center justify-between bg-[#fff8e9] px-5 pb-3 pt-5">
          <button 
            onClick={() => router.push('/menu')} 
            className="flex items-center gap-1.5 text-xs font-bold text-[#9b4b32] transition hover:text-[#7b1d18]"
          >
            <span className="text-base leading-none">←</span> Kembali ke menu
          </button>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#bb4a2f]">
            Checkout
          </span>
        </header>

        <section className="px-4 pb-12">
          {/* Title */}
          <div className="mt-2">
            <h2 className="font-display text-[29px] leading-8 text-[#4d2018]">
              Pesanan kamu
            </h2>
            <p className="mt-1 text-xs text-[#936d5c]">
              Cek kembali pesanan dan data sebelum kirim ke dapur, ya.
            </p>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-[#f0dfc8] bg-white p-8 text-center shadow-sm">
              <span className="text-4xl">🍲</span>
              <h3 className="mt-3 font-display text-lg text-[#4a231a]">
                Keranjangmu masih kosong
              </h3>
              <p className="mt-1 text-xs text-[#936d5c]">
                Pilih menu lezat masakan rumahan dulu yuk!
              </p>
              <button
                onClick={() => router.push('/menu')}
                className="mt-5 rounded-2xl bg-[#7b1d18] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#5e1612]"
              >
                Pilih Menu
              </button>
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-3">
                {cart.map(item => (
                  <div 
                    key={item.id} 
                    className="flex gap-3 rounded-2xl border border-[#f0dfc8] bg-white p-3 shadow-sm"
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="h-[68px] w-[68px] rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-extrabold text-[#4a231a] truncate">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 text-xs font-bold text-[#b0432a]">
                        {rupiah(item.price)}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                          className="grid h-6 w-6 place-items-center rounded-md bg-[#f8ead5] font-bold text-[#7b1d18] transition hover:bg-[#edd3b4]"
                        >
                          −
                        </button>
                        <span className="w-3 text-center text-xs font-extrabold">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                          className="grid h-6 w-6 place-items-center rounded-md bg-[#7b1d18] font-bold text-white transition hover:bg-[#5e1612]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-[#4b271c] self-center">
                      {rupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Customer & Order Details Form */}
              <div className="mt-6 rounded-[22px] border border-[#f0dfc8] bg-white p-4 shadow-sm space-y-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-[#89542f]">
                  Informasi Pemesan & Lokasi
                </p>

                {/* Dine-in vs Takeaway Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('dine_in')}
                    className={`rounded-xl border p-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                      orderType === 'dine_in'
                        ? 'border-[#bd432a] bg-[#fff5f2] text-[#9e2d20] shadow-sm'
                        : 'border-transparent bg-[#f5e8d4] text-[#866858] hover:bg-[#ede0ca]'
                    }`}
                  >
                    <span>🍽️</span> Makan di Tempat
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className={`rounded-xl border p-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                      orderType === 'takeaway'
                        ? 'border-[#bd432a] bg-[#fff5f2] text-[#9e2d20] shadow-sm'
                        : 'border-transparent bg-[#f5e8d4] text-[#866858] hover:bg-[#ede0ca]'
                    }`}
                  >
                    <span>📦</span> Bungkus
                  </button>
                </div>

                {/* Table Number Selector (Only for Dine-in) */}
                {orderType === 'dine_in' && (
                  <div className="rounded-xl bg-[#fff8e9] p-3 border border-[#ecd9c2]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-extrabold text-[#59251c] flex items-center gap-1.5">
                        <span>🪑</span> Pilih Nomor Meja
                      </label>
                      <span className="text-[10px] text-[#987261]">Wajib dipilih</span>
                    </div>

                    {/* Quick Table Chips */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {quickTables.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTableNumber(t);
                            setCustomTable('');
                          }}
                          className={`py-2 rounded-lg font-bold text-xs transition ${
                            tableNumber === t && !customTable
                              ? 'bg-[#7b1d18] text-white shadow-sm'
                              : 'bg-white border border-[#e8d5be] text-[#6b3c29] hover:bg-[#fbf2e3]'
                          }`}
                        >
                          Meja {t}
                        </button>
                      ))}
                    </div>

                    {/* Custom Table Input */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-[#8d6749]">Lainnya:</span>
                      <input
                        type="text"
                        placeholder="Contoh: Lesehan 2 / Meja 12"
                        value={customTable}
                        onChange={(e) => {
                          setCustomTable(e.target.value);
                          setTableNumber('');
                        }}
                        className="flex-1 rounded-lg border border-[#e6d3b8] bg-white px-3 py-1.5 text-xs text-[#4a231a] placeholder-[#b89c82] focus:border-[#7b1d18] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Name & Phone Inputs */}
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6a4231] mb-1">
                      Nama Kamu
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nama pemesan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-[#e6d3b8] bg-white px-4 py-2.5 text-xs font-semibold text-[#4a231a] placeholder-[#b89c82] focus:border-[#7b1d18] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6a4231] mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      placeholder="Contoh: 08123456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full rounded-xl border border-[#e6d3b8] bg-white px-4 py-2.5 text-xs font-semibold text-[#4a231a] placeholder-[#b89c82] focus:border-[#7b1d18] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="mt-5 rounded-[22px] bg-[#f7e5bf] p-4 shadow-sm">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-[#89542f]">
                  Metode Pembayaran
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setPayment('cash')} 
                    className={`rounded-xl border p-3 text-left text-xs font-bold transition ${
                      payment === 'cash' 
                        ? 'border-[#bd432a] bg-white text-[#9e2d20] shadow-sm' 
                        : 'border-transparent bg-[#fff2d7] text-[#866858] hover:bg-white/60'
                    }`}
                  >
                    <span className="mr-1.5">💵</span> Tunai di Kasir
                    <span className="float-right">{payment === 'cash' ? '●' : '○'}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPayment('qris')} 
                    className={`rounded-xl border p-3 text-left text-xs font-bold transition ${
                      payment === 'qris' 
                        ? 'border-[#bd432a] bg-white text-[#9e2d20] shadow-sm' 
                        : 'border-transparent bg-[#fff2d7] text-[#866858] hover:bg-white/60'
                    }`}
                  >
                    <span className="mr-1.5">▣</span> QRIS Digital
                    <span className="float-right">{payment === 'qris' ? '●' : '○'}</span>
                  </button>
                </div>

                {/* QRIS Presentation Box when QRIS is selected */}
                {payment === 'qris' && (
                  <div className="mt-4 rounded-2xl bg-white p-4 border border-[#e8d5be] shadow-sm flex flex-col items-center text-center">
                    {/* QRIS Header Badge */}
                    <div className="flex items-center justify-between w-full pb-2 border-b border-[#f3e6d5]">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-[#a5250c] px-2 py-0.5 text-[11px] font-black tracking-tight text-white">
                          QRIS
                        </span>
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#794f38]">
                          Standar Nasional BI
                        </span>
                      </div>
                      <span className="rounded bg-[#e8f5e9] px-2 py-0.5 text-[9px] font-bold text-[#2e7d32]">
                        ✓ GPN
                      </span>
                    </div>

                    {/* Merchant Info */}
                    <div className="mt-3">
                      <h4 className="font-display text-base font-bold text-[#4c2018] tracking-wide uppercase">
                        Warung Rustanti
                      </h4>
                      <p className="font-mono text-[10px] text-[#936d5c]">
                        NMID: ID1020492819203 · Kasir Utama
                      </p>
                    </div>

                    {/* QR Code Frame */}
                    <div className="mt-3 p-3 bg-white rounded-xl border-2 border-dashed border-[#d8b88f] shadow-inner flex flex-col items-center">
                      {qrisImageUrl ? (
                        <img 
                          src={qrisImageUrl} 
                          alt="QRIS Warung Rustanti" 
                          className="h-48 w-48 object-contain rounded-lg shadow-sm"
                        />
                      ) : (
                        /* Default clean high-fidelity QR Code representation */
                        <div className="flex flex-col items-center justify-center p-2">
                          <img 
                            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=WARUNG-RUSTANTI-QRIS-MOCKUP" 
                            alt="QRIS Barcode" 
                            className="h-44 w-44 object-contain rounded-md"
                          />
                          <p className="mt-1 text-[9px] text-[#a53425] font-semibold">
                            Scan via GoPay, OVO, Dana, BCA, dll
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Amount reminder */}
                    <div className="mt-3 w-full rounded-xl bg-[#fff8eb] p-2.5 border border-[#eedfc9]">
                      <p className="text-[10px] text-[#865d48]">Nominal yang harus dibayar:</p>
                      <p className="font-display text-lg font-bold text-[#a5250c]">
                        {rupiah(total)}
                      </p>
                    </div>

                    {/* Instructions */}
                    <ol className="mt-3 text-left text-[10px] text-[#855e4b] space-y-1 list-decimal list-inside w-full">
                      <li>Buka aplikasi e-wallet / m-Banking kamu</li>
                      <li>Scan kode QRIS di atas</li>
                      <li>Ketik nominal persis <b>{rupiah(total)}</b></li>
                      <li>Screenshot bukti transfer dan unggah di bawah ini:</li>
                    </ol>

                    {/* Upload File Input with Preview */}
                    <div className="mt-3 w-full">
                      <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#c75539] bg-[#fff5f2] p-3 text-center text-xs text-[#8d6749] hover:bg-[#ffede8] transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {proofPreview ? (
                          <div className="flex flex-col items-center gap-2">
                            <img 
                              src={proofPreview} 
                              alt="Bukti Transfer" 
                              className="h-24 w-auto max-w-full rounded-lg object-contain border border-[#ecd5cb]"
                            />
                            <span className="font-bold text-[#7b1d18] text-xs">
                              ✓ Bukti Terpilih: {paymentProof?.name} (Ganti)
                            </span>
                          </div>
                        ) : (
                          <div className="py-1">
                            <span className="block text-xl">📸</span>
                            <span className="font-bold text-[#9e2d20] block mt-0.5">
                              Upload Bukti Transfer QRIS
                            </span>
                            <span className="text-[10px] text-[#a88473]">
                              Format foto/screenshot (JPG, PNG)
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Total & Checkout Button */}
              <div className="mt-5 border-t border-dashed border-[#d8b98d] pt-4">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-[#805949] block">
                      Total Pembayaran
                    </span>
                    <span className="text-[11px] text-[#a88473]">
                      ({itemCount} item menu)
                    </span>
                  </div>
                  <span className="font-display text-[26px] text-[#962c20]">
                    {rupiah(total)}
                  </span>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="mt-4 w-full rounded-2xl bg-[#e54b2e] py-4 text-sm font-extrabold text-white shadow-lg shadow-[#db6347]/30 transition hover:bg-[#c73a24] active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Mengirim ke dapur...</span>
                    </>
                  ) : (
                    <span>Pesan Sekarang →</span>
                  )}
                </button>
              </div>
            </>
          )}
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
            onClick={() => {
              const code = typeof window !== 'undefined' ? localStorage.getItem('last_order_code') : null;
              router.push(code ? `/track/${code}` : '/track/WR-0824');
            }} 
            className="grid place-items-center gap-1 px-4 py-1 text-[10px] font-bold text-[#a88473] hover:text-[#bb3a25]"
          >
            <Icon size={18}>
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3 2"/>
            </Icon>
            Pesanan
          </button>
          <button 
            onClick={() => router.push('/checkout')} 
            className="relative grid place-items-center gap-1 px-4 py-1 text-[10px] font-bold text-[#bb3a25]"
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
