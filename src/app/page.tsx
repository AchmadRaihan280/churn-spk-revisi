"use client";

import { LineChart } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-slate-900 to-slate-950 text-center px-6">
      {/* Icon */}
      <div className="bg-teal-500 text-white p-6 rounded-2xl shadow-lg mb-6">
        <LineChart size={48} />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-white mb-2">ChurnGuard</h1>

      <p className="text-gray-400 text-lg mb-8">
        Decision Support System untuk Prediksi Churn Pelanggan
      </p>

      {/* Button */}
      <Link
        href="/login"
        className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transition-all"
      >
        Masuk ke Dashboard
      </Link>
    </main>
  );
}
