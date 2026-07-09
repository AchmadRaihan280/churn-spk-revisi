"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Database,
  Search,
  SlidersHorizontal,
} from "lucide-react";

// ==========================================
// FUNGSI PEMBANTU (NORMALISASI DATA FLASK)
// ==========================================
const getCleanRecommendations = (item: any): string[] => {
  if (!item || !item.recommendation) return [];

  if (Array.isArray(item.recommendation)) {
    return item.recommendation;
  }
  if (Array.isArray(item.recommendation?.recommendations)) {
    return item.recommendation.recommendations;
  }
  if (Array.isArray(item.recommendation?.recommendation)) {
    return item.recommendation.recommendation;
  }
  if (typeof item.recommendation === "string") {
    return [item.recommendation];
  }

  return [];
};

export default function UploadDatasetPage() {
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. FUNGSI UPLOAD
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

    setFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setIsSaved(false); // Reset status simpan
    setResult(null); // Reset hasil lama
    setSearchTerm(""); // Reset pencarian lama
    setCurrentPage(1); // Reset halaman ke 1

    try {
      const res = await fetch(`${baseUrl}/api/predict-bulk`, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "69420",
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Respon Mentah dari Flask:", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert(
        "Gagal memproses upload dataset. Pastikan Flask API dan Ngrok Anda menyala.",
      );
      setFileName(""); // Kosongkan nama file jika gagal
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNGSI SIMPAN KE DATABASE (Aman dengan Chunk Berukuran Maksimal 400 Dokumen)
  const handleSaveToDatabase = async () => {
    const predictionsArray = result?.predictions || [];
    if (predictionsArray.length === 0) {
      alert("Tidak ada data hasil prediksi untuk disimpan.");
      return;
    }

    if (predictionsArray.length > 500) {
      alert("Sistem dibatasi untuk menyimpan maksimal 500 dokumen sekaligus.");
      return;
    }

    setSaving(true);
    try {
      const predictionsRef = collection(db, "predictions");
      const timeNow = Date.now().toString().slice(-4);

      // Membagi array menjadi beberapa kelompok kecil (chunks) maks 400 item untuk keamanan Firestore Batch
      const chunkSize = 400;
      for (let i = 0; i < predictionsArray.length; i += chunkSize) {
        const chunk = predictionsArray.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach((item: any, index: number) => {
          const globalIndex = i + index;
          const newDocRef = doc(predictionsRef);

          // Pencarian properti fleksibel (antisipasi huruf besar/kecil dari file Excel/CSV)
          const currentID =
            item.customerID ||
            item.CustomerID ||
            item.Customer_ID ||
            `CUST-UNKNOWN-${timeNow}-${globalIndex}`;

          const finalPrediction =
            item.prediction !== undefined && item.prediction !== null
              ? item.prediction
              : item.risk?.toLowerCase() === "high"
                ? 1
                : 0;

          const finalRecs = getCleanRecommendations(item);

          batch.set(newDocRef, {
            customerID: currentID,
            source: "Upload File",
            createdAt: serverTimestamp(),
            contract: item.contract || item.Contract || "Month-to-month",
            dependents: item.dependents || item.Dependents || "No",
            internetService:
              item.internetService || item.InternetService || "Fiber optic",
            paperlessBilling:
              item.paperlessBilling || item.PaperlessBilling || "Yes",
            paymentMethod:
              item.paymentMethod || item.PaymentMethod || "Electronic check",
            phoneService: item.phoneService || item.PhoneService || "Yes",
            tenure: Number(item.tenure ?? item.Tenure) || 0,
            monthlyCharges:
              Number(item.monthlyCharges ?? item.MonthlyCharges) || 0,
            final_probability:
              Number(item.final_probability ?? item.Probability) || 0,
            prediction: finalPrediction,
            risk: item.risk ? item.risk.toLowerCase() : "low",
            recommendation: finalRecs,
          });
        });

        // Eksekusi commit per kelompok chunk
        await batch.commit();
      }

      setIsSaved(true);
      alert(
        `Berhasil! ${predictionsArray.length} data aman tersimpan ke database.`,
      );
    } catch (error) {
      console.error("Gagal menyimpan ke Firestore:", error);
      alert("Terjadi kesalahan saat menyimpan data ke database.");
    } finally {
      setSaving(false);
    }
  };

  // 3. LOGIK PENYARINGAN DATA
  const predictionsList = result?.predictions || [];

  const filteredPredictions = predictionsList.filter((item: any) => {
    const rawID = item.customerID || item.CustomerID || "";
    const matchesSearch = String(rawID)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const currentRisk = (item.risk || "low").toLowerCase();
    const matchesRisk =
      riskFilter === "all" || currentRisk === riskFilter.toLowerCase();

    return matchesSearch && matchesRisk;
  });

  // 4. LOGIK PAGINATION
  const totalPages = Math.ceil(filteredPredictions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPredictions.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const totalDataCount = result?.total_data || predictionsList.length || 0;

  const highRiskCount =
    result?.high_risk !== undefined
      ? result.high_risk
      : predictionsList.filter(
          (item: any) => item.risk?.toLowerCase() === "high",
        ).length;

  const mediumRiskCount =
    result?.medium_risk !== undefined
      ? result.medium_risk
      : predictionsList.filter(
          (item: any) => item.risk?.toLowerCase() === "medium",
        ).length;

  const lowRiskCount =
    result?.low_risk !== undefined
      ? result.low_risk
      : predictionsList.filter(
          (item: any) => item.risk?.toLowerCase() === "low",
        ).length;

  const cardStyle = "bg-white border border-gray-100 rounded-2xl p-6 shadow-sm";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Upload Dataset Prediksi
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Analisis churn pelanggan secara massal dengan dukungan teknologi AI.
          </p>
        </div>

        {/* UPLOAD CARD */}
        <div className={cardStyle}>
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-teal-50 p-3 rounded-2xl">
              <Upload className="text-teal-600" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-800">Dataset Baru</h2>
              <p className="text-sm text-slate-500">
                Mendukung format .CSV dan .XLSX (Maksimal 500 Baris Data)
              </p>
            </div>
          </div>

          <label className="group border-2 border-dashed border-gray-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all duration-300 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50">
            <div className="bg-white p-4 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
              <FileSpreadsheet size={40} className="text-teal-500" />
            </div>
            <div className="mt-6 text-center">
              <p className="font-bold text-lg text-slate-700">
                Klik atau seret file ke sini
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Pastikan nama kolom ID adalah CustomerID atau customerID
              </p>
            </div>
            {fileName && (
              <div className="mt-6 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium flex items-center gap-2">
                <CheckCircle2 size={16} /> {fileName}
              </div>
            )}
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleUpload}
              disabled={loading || saving}
            />
          </label>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div
            className={`${cardStyle} flex items-center gap-6 border-l-4 border-l-teal-500 animate-pulse`}
          >
            <div className="bg-teal-50 p-3 rounded-full">
              <Loader2 className="animate-spin text-teal-600" size={28} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">
                AI Sedang Memproses...
              </h2>
              <p className="text-sm text-slate-500">
                Mengekstrak data dan menjalankan komputasi model
                regresi/klasifikasi.
              </p>
            </div>
          </div>
        )}

        {/* RESULT SECTION */}
        {result && (
          <div className="grid lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {/* STATS CARDS */}
            <div className={cardStyle}>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Total Pelanggan
              </p>
              <h2 className="text-4xl font-extrabold mt-2 text-slate-900">
                {totalDataCount}
              </h2>
            </div>

            <div className={`${cardStyle} border-l-4 border-l-red-500`}>
              <div className="flex items-center gap-2 text-red-600 font-bold mb-1">
                <AlertTriangle size={16} />
                <p className="text-xs uppercase tracking-wider">High Risk</p>
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900">
                {highRiskCount}
              </h2>
            </div>

            <div className={`${cardStyle} border-l-4 border-l-green-500`}>
              <div className="flex items-center gap-2 text-green-600 font-bold mb-1">
                <CheckCircle2 size={16} />
                <p className="text-xs uppercase tracking-wider">Low Risk</p>
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900">
                {lowRiskCount}
              </h2>
            </div>

            <div className={`${cardStyle} border-l-4 border-l-yellow-500`}>
              <div className="flex items-center gap-2 text-yellow-600 font-bold mb-1">
                <SlidersHorizontal size={16} />
                <p className="text-xs uppercase tracking-wider">Medium Risk</p>
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900">
                {mediumRiskCount}
              </h2>
            </div>

            {/* TABLE DATA */}
            <div
              className={`lg:col-span-4 ${cardStyle} overflow-hidden space-y-6`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Pratinjau Hasil Analisis AI
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Menampilkan {filteredPredictions.length} dari{" "}
                    {totalDataCount} data hasil prediksi sementara
                  </p>
                </div>
                <button
                  onClick={handleSaveToDatabase}
                  disabled={saving || isSaved}
                  className={`flex items-center justify-center gap-2 transition px-6 py-2.5 rounded-xl font-bold text-sm shadow-md ${
                    isSaved
                      ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
                      : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200"
                  }`}
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Database size={18} />
                  )}
                  {isSaved ? "Data Berhasil Disimpan" : "Simpan ke Database"}
                </button>
              </div>

              {/* SEARCH & FILTER BAR */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari ID Pelanggan..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-slate-700 bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={riskFilter}
                    onChange={(e) => {
                      setRiskFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-44 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 bg-slate-50 text-slate-700 font-medium"
                  >
                    <option value="all">Semua Risiko</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                </div>
              </div>

              {/* TABLE AREA */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-widest border-b border-gray-100">
                      <th className="text-left py-4 px-6 font-bold">
                        ID Pelanggan
                      </th>
                      <th className="text-left py-4 px-6 font-bold">Tenure</th>
                      <th className="text-left py-4 px-6 font-bold">
                        Tagihan Bulanan
                      </th>
                      <th className="text-left py-4 px-6 font-bold">
                        Churn Score
                      </th>
                      <th className="text-left py-4 px-6 font-bold">
                        Status Risiko
                      </th>
                      <th className="text-left py-4 px-6 font-bold">
                        Rekomendasi AI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentItems.length > 0 ? (
                      currentItems.map((item: any, index: number) => {
                        const displayID =
                          item.customerID || item.CustomerID || `CUST-${index}`;
                        const currentRisk = (item.risk || "low").toLowerCase();
                        const probValue = item.final_probability || 0;

                        return (
                          <tr
                            key={index}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="py-4 px-6 font-semibold text-slate-700">
                              {displayID}
                            </td>
                            <td className="py-4 px-6 text-slate-600">
                              {item.tenure || 0} bulan
                            </td>
                            <td className="py-4 px-6 text-slate-800 font-bold">
                              ${item.monthlyCharges || 0}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      probValue > 0.7
                                        ? "bg-red-500"
                                        : probValue > 0.4
                                          ? "bg-yellow-500"
                                          : "bg-teal-500"
                                    }`}
                                    style={{ width: `${probValue * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-black text-slate-700">
                                  {Math.round(probValue * 100)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                  currentRisk === "high"
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : currentRisk === "medium"
                                      ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                                      : "bg-green-50 text-green-600 border-green-100"
                                }`}
                              >
                                {currentRisk}
                              </span>
                            </td>
                            <td className="py-4 px-6 max-w-md">
                              {(() => {
                                const recs = getCleanRecommendations(item);
                                if (recs.length > 0) {
                                  return (
                                    <div className="space-y-1">
                                      <div className="text-xs font-bold text-slate-700 uppercase">
                                        {item.recommendation?.risk_level ||
                                          currentRisk}
                                      </div>
                                      <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
                                        {recs.map(
                                          (rec: string, idx: number) => (
                                            <li key={idx}>{rec}</li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  );
                                }
                                return (
                                  <span className="text-xs text-slate-400">
                                    Tidak ada rekomendasi
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-slate-400 text-sm font-medium"
                        >
                          Tidak ada data pelanggan yang cocok dengan pencarian /
                          filter risiko.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION INTERFACE */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <p className="text-sm text-slate-500">
                    Menampilkan{" "}
                    <span className="font-semibold text-slate-700">
                      {indexOfFirstItem + 1}
                    </span>{" "}
                    sampai{" "}
                    <span className="font-semibold text-slate-700">
                      {Math.min(indexOfLastItem, filteredPredictions.length)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-slate-700">
                      {filteredPredictions.length}
                    </span>{" "}
                    pelanggan
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
