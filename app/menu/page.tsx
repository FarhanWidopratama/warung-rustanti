'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { menuData } from '../data/menuData';
import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('Favorit');
  const { addToCart, getCartTotal, getCartItemCount } = useCart();
  const router = useRouter();

  // Filter menu based on category
  const filteredMenu =
    selectedCategory === 'Favorit'
      ? menuData.filter((item) => item.isChefRecommendation)
      : selectedCategory === 'Semua'
      ? menuData
      : menuData.filter((item) => item.category === selectedCategory);

  const cartItemCount = getCartItemCount();
  const cartTotal = getCartTotal();

  const formatPrice = (price: number) => {
    return `Rp${price.toLocaleString('id-ID')}`;
  };

  const categoryList = ['Favorit', 'Semua', 'Nasi', 'Lauk', 'Sayur'];

  return (
    <div className="min-h-screen bg-[#6c1717] text-[#3c1712] selection:bg-[#f4b83f] selection:text-[#3c1712]">
      <div className="mx-auto min-h-screen max-w-[414px] overflow-hidden bg-[#fff8e9] shadow-2xl shadow-[#260909]">
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between bg-[#fff8e9] px-5 pb-3 pt-5">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#bb4a2f]">
              Selamat datang di
            </p>
            <h1 className="text-[25px] leading-6 text-[#7b1d18] font-bold">
              Warung Rustanti
            </h1>
          </div>
          <button
            onClick={() => router.push('/checkout')}
            aria-label="Buka keranjang"
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-[#e9cfae] bg-white text-[#7b1d18] transition hover:-translate-y-0.5 hover:bg-[#fdf0d7]"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e54b2e] px-1 text-[10px] font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </button>
        </header>

        {/* Hero Banner */}
        <div className="relative mx-4 overflow-hidden rounded-[28px] bg-[#8d211b] px-5 py-5 text-[#fff5db] shadow-lg shadow-[#9a3523]/20">
          <div className="absolute -right-4 -top-12 h-36 w-36 rounded-full border-[16px] border-[#e9a63a]/30" />
          <div className="absolute bottom-1 right-9 h-14 w-14 rotate-12 rounded-[16px] bg-[#d74b2f]" />
          <p className="relative text-xs font-medium text-[#ffd889]">
            Masakan rumahan, rasa kenangan.
          </p>
          <h2 className="relative mt-1 max-w-[230px] text-[29px] leading-8 font-bold">
            Makan enak, hati tenang.
          </h2>
          <button
            onClick={() => router.push('/tracking')}
            className="relative mt-4 flex items-center gap-2 text-xs font-bold text-[#ffe5a8] underline decoration-[#f1ac38] underline-offset-4"
          >
            Lacak pesanan saya <span>→</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="mt-6 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          {categoryList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-[#7b1d18] text-white shadow-md'
                  : 'border border-[#eddbc1] bg-white text-[#875b45]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Section */}
        <div className="mt-5 px-4 pb-32">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#c46336]">
                Paling dicari
              </p>
              <h3 className="text-[23px] text-[#4c2018] font-bold">
                Pilih menu hari ini
              </h3>
            </div>
          </div>

          {/* Food Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredMenu.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-[21px] border border-[#f0dfc8] bg-white shadow-[0_5px_16px_rgba(84,38,17,.07)]"
              >
                {/* Image */}
                <div className="relative h-32 bg-[#eec98b]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  {item.isHalal && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#fff8e9]/95 px-2 py-1 text-[9px] font-bold text-[#7d681c]">
                      ✓ HALAL
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  <h4 className="min-h-10 text-[13px] font-extrabold leading-4 text-[#4a231a]">
                    {item.name}
                  </h4>
                  <p className="mt-0.5 text-[10px] text-[#9c7763]">
                    {item.category}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[13px] font-extrabold text-[#a53425]">
                      {formatPrice(item.price)}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      aria-label={`Tambah ${item.name}`}
                      className="grid h-7 w-7 place-items-center rounded-lg bg-[#e55032] text-lg font-bold leading-none text-white transition hover:scale-110"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Floating Cart Summary */}
        {cartItemCount > 0 && (
          <div className="fixed bottom-0 left-1/2 w-full max-w-[414px] -translate-x-1/2 border-t border-[#efddc3] bg-[#fffdf7]/95 px-5 py-4 backdrop-blur z-50">
            <button
              onClick={() => router.push('/checkout')}
              className="w-full rounded-2xl bg-[#e54b2e] py-4 text-sm font-extrabold text-white shadow-lg shadow-[#db6347]/30 transition hover:bg-[#c73a24] flex items-center justify-between px-6"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs opacity-90">{cartItemCount} Item</p>
                  <p className="text-sm font-bold">{formatPrice(cartTotal)}</p>
                </div>
              </div>
              <span className="text-sm">Lihat Keranjang →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
