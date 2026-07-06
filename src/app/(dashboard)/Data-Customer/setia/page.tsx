"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Heart, Search, CheckCircle2, Download } from "lucide-react";

export default function DataCustomerSetiaPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleMarkDone = async (id: string) => {
    try {
      await updateDoc(doc(db, "predictions", id), {
        followUpStatus: "Sudah Ditindaklanjuti",
      });

      setCustomers((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, followUpStatus: "Sudah Ditindaklanjuti" }
            : item,
        ),
      );
    } catch (error) {
      console.error(error);
      alert("Gagal mengubah status");
    }
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const q = query(
          collection(db, "predictions"),
          orderBy("createdAt", "desc"),
        );
        const querySnapshot = await getDocs(q);
        const dataList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(dataList);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // FILTER UTAMA: Hanya mengambil Churn < 50% (Pelanggan Setia)
  const filteredCustomers = customers
    .filter((item) => {
      const probability = item.final_probability || 0;
      const isSetia = probability < 0.5;

      const matchesSearch = item.customerID
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      return isSetia && matchesSearch;
    })
    .sort((a, b) => {
      const aDone = a.followUpStatus === "Sudah Ditindaklanjuti";
      const bDone = b.followUpStatus === "Sudah Ditindaklanjuti";
      return Number(aDone) - Number(bDone);
    });

  // FUNGSI DOWNLOAD CSV
  const handleDownloadCSV = () => {
    if (filteredCustomers.length === 0) {
      alert("Tidak ada data untuk diunduh");
      return;
    }

    const headers = [
      "ID Pelanggan",
      "Kontrak",
      "Layanan Internet",
      "Tenure (Bulan)",
      "Tagihan Bulanan ($)",
      "Churn Probability",
      "Status Risiko",
    ];

    const rows = filteredCustomers.map((item: any) => [
      item.customerID,
      item.contract || "N/A",
      item.internetService || "N/A",
      item.tenure || 0,
      item.monthlyCharges || 0,
      `"${Math.round((item.final_probability || 0) * 100)}%"`,
      (item.risk || "low").toUpperCase(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((e: any) => e.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Data_Pelanggan_Setia_Loyal.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCount = filteredCustomers.length;

  // Paginasi
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const cardStyle = "bg-white border border-gray-100 rounded-2xl p-6 shadow-sm";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">
          Memuat data pelanggan setia...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Heart className="text-emerald-600 fill-emerald-500" size={32} />
            Pelanggan Setia (Low Risk)
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Daftar pelanggan loyal dengan probabilitas loyalitas tinggi (Churn
            Score di bawah 50%). Pertahankan apresiasi pelayanan!
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${cardStyle} border-l-4 border-l-emerald-500`}>
            <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
              <CheckCircle2 size={16} />
              <p className="text-xs uppercase tracking-wider">
                Total Pelanggan Loyal
              </p>
            </div>
            <h2 className="text-3xl font-extrabold mt-1 text-slate-900">
              {totalCount}{" "}
              <span className="text-sm font-normal text-slate-400">
                Jiwa Aman
              </span>
            </h2>
          </div>
        </div>

        {/* PANEL TABEL */}
        <div className={cardStyle}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-gray-100 pb-6 mb-6">
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-3.5 top-3 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari ID Pelanggan Setia..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-slate-50/50"
              />
            </div>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-100 w-full md:w-auto"
            >
              <Download size={16} />
              Export CSV Pelanggan Setia
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-widest border-b border-gray-100">
                  <th className="py-4 px-6 font-bold">Profil Pelanggan</th>
                  <th className="py-4 px-6 font-bold">Layanan</th>
                  <th className="py-4 px-6 font-bold">Finansial</th>
                  <th className="py-4 px-6 font-bold">Skor Churn</th>
                  <th className="py-4 px-6 font-bold w-[420px]">
                    Analisis & Rekomendasi Apresiasi
                  </th>
                  <th className="py-4 px-6 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {currentItems.length > 0 ? (
                  currentItems.map((customer) => {
                    const isUploadFile =
                      customer.source === "Upload File" ||
                      Array.isArray(customer.recommendation);

                    let reasonsList: string[] = [];
                    let actionList: string[] = [];

                    if (isUploadFile) {
                      reasonsList = ["Data berasal dari unggahan massal."];
                      actionList = Array.isArray(customer.recommendation)
                        ? customer.recommendation
                        : [];
                    } else {
                      reasonsList = customer.recommendation?.reasons || [];
                      actionList =
                        customer.recommendation?.recommendations || [];
                    }

                    const riskLabelText = customer.risk?.toLowerCase() || "low";

                    // DYNAMIC THEME COLOR: Setting Default ke Hijau lembut (khas Low Risk)
                    let containerStyles =
                      "bg-green-50/60 border-green-100 text-green-950";
                    let indicatorHeaderStyles = "text-green-800";
                    let actionHeaderStyles = "text-emerald-800";
                    let bulletIconColor = "text-emerald-600";

                    // Antisipasi jika ada data medium/high masuk ke halaman ini karena anomali skor
                    if (riskLabelText === "high") {
                      containerStyles =
                        "bg-red-50/60 border-red-100 text-red-950";
                      indicatorHeaderStyles = "text-red-800";
                      actionHeaderStyles = "text-rose-800";
                      bulletIconColor = "text-red-600";
                    } else if (riskLabelText === "medium") {
                      containerStyles =
                        "bg-amber-50/60 border-amber-100 text-amber-950";
                      indicatorHeaderStyles = "text-amber-800";
                      actionHeaderStyles = "text-orange-800";
                      bulletIconColor = "text-amber-600";
                    }

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-slate-50/40 transition-colors"
                      >
                        <td className="py-5 px-6">
                          <div className="font-bold text-slate-800 text-base">
                            {customer.customerID}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Sumber: {customer.source || "Manual Input"}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-700 font-medium">
                            {customer.contract || "Two year"}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Tenure: {customer.tenure || 0} bln
                          </div>
                        </td>
                        <td className="py-5 px-6 font-bold text-slate-800">
                          ${customer.monthlyCharges || 0}
                        </td>
                        <td className="py-5 px-6 space-y-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                riskLabelText === "high"
                                  ? "bg-red-50 text-red-600 border border-red-100"
                                  : riskLabelText === "medium"
                                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                                    : "bg-green-50 text-green-600 border border-green-100"
                              }`}
                            >
                              {riskLabelText}
                            </span>
                            <span className="text-xs font-bold text-slate-600">
                              {Math.round(
                                (customer.final_probability || 0) * 100,
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                riskLabelText === "high"
                                  ? "bg-red-500"
                                  : riskLabelText === "medium"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${(customer.final_probability || 0) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </td>

                        {/* REKOMENDASI BOX DENGAN SISTEM SCROLL INTERNAL */}
                        <td className="py-5 px-6">
                          <div
                            className={`space-y-3 p-4 rounded-xl border max-h-56 overflow-y-auto ${containerStyles} custom-scrollbar`}
                          >
                            {/* Indikator Pelanggan */}
                            {!isUploadFile && (
                              <div>
                                <div
                                  className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${indicatorHeaderStyles}`}
                                >
                                  💡 Indikator Loyalitas ({reasonsList.length})
                                </div>
                                <ul className="text-xs space-y-1 list-disc pl-4 opacity-90">
                                  {reasonsList.map((reason, idx) => (
                                    <li key={idx} className="leading-relaxed">
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {!isUploadFile && (
                              <div className="border-t border-dashed border-current opacity-20 pt-1" />
                            )}

                            {/* Tindakan Retensi / Apresiasi */}
                            <div>
                              <div
                                className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${actionHeaderStyles}`}
                              >
                                🚀 Rekomendasi Program/Apresiasi (
                                {actionList.length})
                              </div>
                              <ul className="text-xs font-medium space-y-1.5 list-none">
                                {actionList.length > 0 ? (
                                  actionList.map((rec, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-1.5 leading-relaxed"
                                    >
                                      <span
                                        className={`font-bold mt-0.5 ${bulletIconColor}`}
                                      >
                                        ✓
                                      </span>
                                      <span>{rec}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="italic opacity-60">
                                    Berikan program reward standar pelanggan
                                    loyal.
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </td>

                        {/* STATUS TINDAK LANJUT */}
                        <td className="py-5 px-6">
                          {customer.followUpStatus ===
                          "Sudah Ditindaklanjuti" ? (
                            <div className="flex items-center gap-1.5 text-green-700 font-bold text-xs bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl w-fit">
                              <CheckCircle2 size={14} /> <span>Selesai</span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <span className="px-2.5 py-1 text-center rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider w-fit">
                                Pending
                              </span>
                              <button
                                onClick={() => handleMarkDone(customer.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-sm"
                              >
                                Apresiasi
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-slate-400 font-medium"
                    >
                      Tidak ada data pelanggan setia yang terdeteksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
