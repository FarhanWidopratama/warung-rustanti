'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/menu');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#e6ded6] flex justify-center">
      <div className="w-full max-w-md bg-[#fff8f7] min-h-screen shadow-2xl flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1e1b1b] mb-2">
            Warung Bu Sri
          </h1>
          <p className="text-[#5a413c]">Memuat menu...</p>
        </div>
      </div>
    </div>
  );
}
