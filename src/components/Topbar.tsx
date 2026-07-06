import React from 'react';

const Topbar = () => {
  return (
    <header className="h-16 fixed top-0 right-0 left-64 bg-white flex items-center px-8 border-b border-gray-100 z-40">
      <div className="flex justify-between w-full items-center">
        {/* Teks utama: Navy/Dark Blue, Bold, Normal Case */}
        <h1 className="text-xl font-bold text-[#1a2b3c] tracking-tight">
          Churn Prediction Decision Support System
        </h1>

        {/* Bagian kanan tetap ada (opsional), tapi dibuat clean sesuai tema putih */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-medium text-gray-500">System Ready</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
            AR
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;