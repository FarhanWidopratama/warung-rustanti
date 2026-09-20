'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { menuData } from '../data/menuData';
import { useRouter } from 'next/navigation';

const categories = ['Favorit', 'Semua', 'Nasi', 'Lauk', 'Sayur', 'Minuman'];

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

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('Favorit');
  const [toast, setToast] = useState('');
  const [lastOrderCode, setLastOrderCode] = useState<string | null>(null);
  const { addToCart, getCartItemCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = localStorage.getItem('last_order_code');
      if (code) setLastOrderCode(code);
    }
  }, []);

  const visibleMenu = useMemo(() => {
    if (activeCategory === 'Semua') return menuData;
    if (activeCategory === 'Favorit') return menuData.filter(x => x.isChefRecommendation);
    if (activeCategory === 'Nasi') return menuData.filter(x => x.category.toLowerCase().includes('nasi'));
    if (activeCategory === 'Lauk') return menuData.filter(x => x.category.toLowerCase().includes('lauk'));
    if (activeCategory === 'Sayur') return menuData.filter(x => x.category.toLowerCase().includes('sayur'));
    if (activeCategory === 'Minuman') return menuData.filter(x => x.category.toLowerCase().includes('minum'));
    return menuData.filter(x => x.category === activeCategory);
  }, [activeCategory]);

  const itemCount = getCartItemCount();
  const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  const handleAddItem = (item: (typeof menuData)[0]) => {
    addToCart(item);
    setToast(`${item.name} ditambahkan`);
    setTimeout(() => {
      setToast('');
    }, 2000);
  };

  const handleTrackOrder = () => {
    if (lastOrderCode) {
      router.push(`/track/${lastOrderCode}`);
    } else {
      router.push('/track/WR-0824');
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#6c1717] flex justify-center text-[#3c1712] selection:bg-[#f4b83f] selection:text-[#3c1712]">
      <div className="w-full min-h-screen max-w-[414px] overflow-hidden bg-[#fff8e9] shadow-2xl shadow-[#260909] relative pb-20">
        
        {/* Top Bar */}
        <header className="relative z-10 flex items-center justify-between bg-[#fff8e9] px-5 pb-3 pt-5">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#bb4a2f]">
              Selamat datang di
            </p>
            <h1 className="font-display text-[25px] leading-6 text-[#7b1d18]">
              Warung Rustanti
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/admin')} 
              className="rounded-full border border-[#9d3220]/20 bg-[#fff8e9]/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9d3220] transition hover:bg-[#fdf0d7]"
            >
              Admin
            </button>
            <button 
              onClick={() => router.push('/checkout')} 
              aria-label="Buka keranjang"
              className="relative grid h-11 w-11 place-items-center rounded-2xl border border-[#e9cfae] bg-white text-[#7b1d18] transition hover:-translate-y-0.5 hover:bg-[#fdf0d7]"
            >
              <Icon size={20}>
                <path d="M3 3h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 7H6"/>
                <circle cx="10" cy="20" r="1"/>
                <circle cx="18" cy="20" r="1"/>
              </Icon>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-[#e54b2e] px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Menu Content */}
        <section className="pb-12">
          {/* Hero Banner with Figma AI motif */}
          <div className="relative mx-4 overflow-hidden rounded-[28px] bg-[#8d211b] px-5 py-5 text-[#fff5db] shadow-lg shadow-[#9a3523]/20">
            <div className="absolute -right-4 -top-12 h-36 w-36 rounded-full border-[16px] border-[#e9a63a]/30"/>
            <div className="absolute bottom-1 right-9 h-14 w-14 rotate-12 rounded-[16px] bg-[#d74b2f]"/>
            <p className="relative text-xs font-medium text-[#ffd889]">
              Masakan rumahan, rasa kenangan.
            </p>
            <h2 className="relative mt-1 max-w-[230px] font-display text-[29px] leading-8">
              Makan enak, hati tenang.
            </h2>
            <button 
              onClick={handleTrackOrder} 
              className="relative mt-4 flex items-center gap-2 text-xs font-bold text-[#ffe5a8] underline decoration-[#f1ac38] underline-offset-4"
            >
              {lastOrderCode ? `Lacak pesanan (${lastOrderCode})` : 'Lacak pesanan saya'} <span>→</span>
            </button>
          </div>

          {/* Category Pills with smooth horizontal scrolling */}
          <div className="mt-6 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                  activeCategory === cat 
                    ? 'bg-[#7b1d18] text-white shadow-md' 
                    : 'border border-[#eddbc1] bg-white text-[#875b45] hover:bg-[#fff9ef]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="mt-5 px-4">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#c46336]">
                  {activeCategory === 'Favorit' ? 'Paling dicari' : `Kategori ${activeCategory}`}
                </p>
                <h3 className="font-display text-[23px] text-[#4c2018]">
                  Pilih menu hari ini
                </h3>
              </div>
              <button 
                onClick={() => setActiveCategory('Semua')}
                className="text-xs font-semibold text-[#b6452b] hover:underline"
              >
                Lihat semua
              </button>
            </div>

            {visibleMenu.length === 0 ? (
              <div className="rounded-2xl border border-[#f0dfc8] bg-white p-8 text-center text-sm text-[#936d5c]">
                Menu belum tersedia untuk kategori ini.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-4">
                {visibleMenu.map((item) => (
                  <article 
                    key={item.id} 
                    className="overflow-hidden rounded-[21px] border border-[#f0dfc8] bg-white shadow-[0_5px_16px_rgba(84,38,17,.07)] transition hover:-translate-y-0.5"
                  >
                    {/* Image */}
                    <div className="relative h-32 w-full bg-[#eec98b] overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                      {item.isHalal && (
                        <span className="absolute left-2 top-2 rounded-full bg-[#fff8e9]/95 px-2 py-0.5 text-[9px] font-bold text-[#7d681c] shadow-sm">
                          ✓ HALAL
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h4 className="min-h-10 text-[13px] font-extrabold leading-4 text-[#4a231a] line-clamp-2">
                        {item.name}
                      </h4>
                      <p className="mt-0.5 text-[10px] text-[#9c7763]">
                        {item.category}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[13px] font-extrabold text-[#a53425]">
                          {rupiah(item.price)}
                        </span>
                        <button 
                          onClick={() => handleAddItem(item)} 
                          aria-label={`Tambah ${item.name}`}
                          className="grid h-7 w-7 place-items-center rounded-lg bg-[#e55032] text-lg font-bold leading-none text-white transition hover:scale-110 active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[#3c1712] px-4 py-2 text-xs font-bold text-white shadow-xl animate-fade-in">
            {toast}
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[414px] -translate-x-1/2 justify-around border-t border-[#efddc3] bg-[#fffdf7]/95 px-5 py-2 backdrop-blur">
          <button 
            onClick={() => router.push('/menu')} 
            className="grid place-items-center gap-1 px-4 py-1 text-[10px] font-bold text-[#bb3a25]"
          >
            <Icon size={18}>
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </Icon>
            Menu
          </button>
          <button 
            onClick={handleTrackOrder} 
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
