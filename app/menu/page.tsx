'use client';

import { useState } from 'react';
import { ShoppingCart, Flame, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { menuData, categories } from '../data/menuData';
import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('Semua Menu');
  const { addToCart, getCartTotal, getCartItemCount } = useCart();
  const router = useRouter();

  const filteredMenu =
    selectedCategory === 'Semua Menu'
      ? menuData
      : menuData.filter((item) => item.category === selectedCategory);

  const cartItemCount = getCartItemCount();
  const cartTotal = getCartTotal();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-[#e6ded6] flex justify-center">
      <div className="w-full max-w-md bg-[#fff8f7] min-h-screen shadow-2xl relative">
        {/* Header */}
        <div className="bg-white border-b border-[#e6ded6] sticky top-0 z-40">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1e1b1b]">Warung Bu Sri</h1>
                <p className="text-sm text-[#5a413c] mt-0.5">Meja 04</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="sticky top-[73px] z-30 bg-[#fff8f7] border-b border-[#e6ded6] pb-3">
          <div className="px-4 pt-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-[#c83e23] text-white shadow-float'
                      : 'bg-[#f5efeb] text-[#1e1b1b] border border-[#e6ded6]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="px-4 py-6 pb-40">
          <div className="grid grid-cols-1 gap-4">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-card"
              >
                {/* Image */}
                <div className="relative h-48 bg-[#f5efeb]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {item.isChefRecommendation && (
                      <span className="px-2 py-1 bg-[#e89218]/15 text-[#e89218] text-xs font-bold rounded-md">
                        Chef's Pick
                      </span>
                    )}
                    {item.isHalal && (
                      <span className="px-2 py-1 bg-[#2e7d32]/12 text-[#2e7d32] text-xs font-bold rounded-md">
                        Halal
                      </span>
                    )}
                    {item.isVegetarian && (
                      <span className="px-2 py-1 bg-[#2e7d32]/12 text-[#2e7d32] text-xs font-bold rounded-md">
                        Vegetarian
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-semibold text-[#1e1b1b] flex-1">
                      {item.name}
                    </h3>
                    {item.spicyLevel > 0 && (
                      <div className="flex gap-0.5 ml-2">
                        {Array.from({ length: item.spicyLevel }).map((_, i) => (
                          <Flame
                            key={i}
                            className="w-4 h-4 text-[#c83e23] fill-[#c83e23]"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price and Add Button */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold text-[#1e1b1b]">
                      {formatPrice(item.price)}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-11 h-11 rounded-full bg-[#c83e23] text-white flex items-center justify-center hover:bg-[#a8321b] active:scale-95 transition-all shadow-float"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ALWAYS VISIBLE Floating Cart Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t-2 border-[#e6ded6] shadow-float z-[100]">
          <div className="px-4 py-4">
            {cartItemCount > 0 ? (
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-[#221f1f] text-white rounded-full px-6 py-4 flex items-center justify-between shadow-float hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#c83e23] flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold opacity-80">
                      {cartItemCount} Item{cartItemCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm font-bold">{formatPrice(cartTotal)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold bg-[#c83e23] px-4 py-2 rounded-full">
                  Lihat Keranjang
                </span>
              </button>
            ) : (
              <div className="w-full bg-[#f5efeb] text-[#5a413c] rounded-full px-6 py-4 flex items-center justify-center border-2 border-[#e6ded6]">
                <ShoppingCart className="w-5 h-5 mr-2" />
                <span className="text-sm font-semibold">Keranjang (0)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
