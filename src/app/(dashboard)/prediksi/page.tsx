"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PrediksiPage() {
  // =========================
  // STATE INPUT
  // =========================
  const [gender, setGender] = useState("");
  const [seniorCitizen, setSeniorCitizen] = useState("");
  const [partner, setPartner] = useState("");
  const [dependents, setDependents] = useState("");
  const [tenure, setTenure] = useState("");
  const [phoneService, setPhoneService] = useState("");
  const [multipleLines, setMultipleLines] = useState("");
  const [internetService, setInternetService] = useState("");
  const [onlineSecurity, setOnlineSecurity] = useState("");
  const [onlineBackup, setOnlineBackup] = useState("");
  const [deviceProtection, setDeviceProtection] = useState("");
  const [techSupport, setTechSupport] = useState("");
  const [streamingTV, setStreamingTV] = useState("");
  const [streamingMovies, setStreamingMovies] = useState("");
  const [contract, setContract] = useState("");
  const [paperlessBilling, setPaperlessBilling] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [monthlyCharges, setMonthlyCharges] = useState("");
  const [totalCharges, setTotalCharges] = useState("");

  // =========================
  // RESULT
  // =========================
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ========================================================
  // KODE BARU: OTOMATISASI HITUNG TOTAL CHARGES
  // ========================================================
  useEffect(() => {
    const bulan = Number(tenure) || 0;
    const tagihanBulanan = Number(monthlyCharges) || 0;

    // Rumus: Tenure x Monthly Charges (dibulatkan 2 angka di belakang koma)
    const hitungTotal = (bulan * tagihanBulanan).toFixed(2);

    setTotalCharges(hitungTotal);
  }, [tenure, monthlyCharges]);

  // =========================
  // HANDLE PREDICT
  // =========================
  const handlePredict = async () => {
    if (
      !gender ||
      !seniorCitizen ||
      !partner ||
      !dependents ||
      !tenure ||
      !phoneService ||
      !multipleLines ||
      !internetService ||
      !onlineSecurity ||
      !onlineBackup ||
      !deviceProtection ||
      !techSupport ||
      !streamingTV ||
      !streamingMovies ||
      !contract ||
      !paperlessBilling ||
      !paymentMethod ||
      !monthlyCharges ||
      !totalCharges
    ) {
      alert("Mohon lengkapi semua data terlebih dahulu.");
      return;
    }

    setLoading(true);

    // UBAH DI SINI: Gunakan environment variable untuk URL API dinamis (Vercel/Ngrok)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

    try {
      const res = await fetch(`${baseUrl}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // UBAH DI SINI: Tambahkan header Ngrok untuk mem-bypass halaman peringatan
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({
          gender,
          seniorCitizen,
          partner,
          dependents,
          tenure: Number(tenure),
          phoneService,
          multipleLines,
          internetService,
          onlineSecurity,
          onlineBackup,
          deviceProtection,
          techSupport,
          streamingTV,
          streamingMovies,
          contract,
          paperlessBilling,
          paymentMethod,
          monthlyCharges: Number(monthlyCharges),
          totalCharges: Number(totalCharges),
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setResult(data);

      // =====================
      // SAVE FIRESTORE
      // =====================
      await addDoc(collection(db, "predictions"), {
        customerID: "MANUAL-" + Date.now().toString().slice(-6),
        source: "Manual",
        gender,
        seniorCitizen,
        partner,
        dependents,
        tenure: Number(tenure),
        phoneService,
        multipleLines,
        internetService,
        onlineSecurity,
        onlineBackup,
        deviceProtection,
        techSupport,
        streamingTV,
        streamingMovies,
        contract,
        paperlessBilling,
        paymentMethod,
        monthlyCharges: Number(monthlyCharges),
        totalCharges: Number(totalCharges),
        final_probability: data.final_probability,
        prediction: data.prediction,
        risk: data.risk,
        recommendation: data.recommendation,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.log(err);
      alert(
        "Gagal terhubung ke backend. Pastikan Flask API dan Ngrok Anda menyala.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // STYLE
  // =========================
  const inputStyle =
    "w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-slate-800";

  const cardStyle = "bg-white p-6 rounded-2xl shadow-sm border border-gray-200";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Prediksi Churn Pelanggan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Menggunakan Model XGBoost Full Feature (19 Fitur).
          </p>
        </div>

        <div className={cardStyle}>
          <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2">
            Parameter Indikator
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Gender
              </label>
              <select
                className={inputStyle}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Pilih Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            {/* Senior Citizen */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Senior Citizen
              </label>
              <select
                className={inputStyle}
                value={seniorCitizen}
                onChange={(e) => setSeniorCitizen(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Partner */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Partner
              </label>
              <select
                className={inputStyle}
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Dependents */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Dependents
              </label>
              <select
                className={inputStyle}
                value={dependents}
                onChange={(e) => setDependents(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Tenure */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tenure Months
              </label>
              <input
                type="number"
                className={inputStyle}
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
              />
            </div>

            {/* Phone Service */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Phone Service
              </label>
              <select
                className={inputStyle}
                value={phoneService}
                onChange={(e) => setPhoneService(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Multiple Lines */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Multiple Lines
              </label>
              <select
                className={inputStyle}
                value={multipleLines}
                onChange={(e) => setMultipleLines(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No phone service">No phone service</option>
              </select>
            </div>

            {/* Internet Service */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Internet Service
              </label>
              <select
                className={inputStyle}
                value={internetService}
                onChange={(e) => setInternetService(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="DSL">DSL</option>
                <option value="Fiber optic">Fiber optic</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Online Security */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Online Security
              </label>
              <select
                className={inputStyle}
                value={onlineSecurity}
                onChange={(e) => setOnlineSecurity(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            {/* Online Backup */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Online Backup
              </label>
              <select
                className={inputStyle}
                value={onlineBackup}
                onChange={(e) => setOnlineBackup(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            {/* Device Protection */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Device Protection
              </label>
              <select
                className={inputStyle}
                value={deviceProtection}
                onChange={(e) => setDeviceProtection(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            {/* Tech Support */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tech Support
              </label>
              <select
                className={inputStyle}
                value={techSupport}
                onChange={(e) => setTechSupport(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            {/* Streaming TV */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Streaming TV
              </label>
              <select
                className={inputStyle}
                value={streamingTV}
                onChange={(e) => setStreamingTV(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            {/* Streaming Movies */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Streaming Movies
              </label>
              <select
                className={inputStyle}
                value={streamingMovies}
                onChange={(e) => setStreamingMovies(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            {/* Contract */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Contract
              </label>
              <select
                className={inputStyle}
                value={contract}
                onChange={(e) => setContract(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="Month-to-month">Month-to-month</option>
                <option value="One year">One year</option>
                <option value="Two year">Two year</option>
              </select>
            </div>

            {/* Paperless Billing */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Paperless Billing
              </label>
              <select
                className={inputStyle}
                value={paperlessBilling}
                onChange={(e) => setPaperlessBilling(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Payment Method
              </label>
              <select
                className={inputStyle}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="Electronic check">Electronic check</option>
                <option value="Bank transfer (automatic)">
                  Bank transfer (automatic)
                </option>
                <option value="Credit card (automatic)">
                  Credit card (automatic)
                </option>
                <option value="Mailed check">Mailed check</option>
              </select>
            </div>

            {/* Monthly Charges */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Monthly Charges
              </label>
              <input
                type="number"
                step="0.01"
                className={inputStyle}
                value={monthlyCharges}
                onChange={(e) => setMonthlyCharges(e.target.value)}
              />
            </div>

            {/* Total Charges */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Total Charges
              </label>
              <input
                type="number"
                step="0.01"
                className={inputStyle}
                value={totalCharges}
                onChange={(e) => setTotalCharges(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 font-medium text-white py-4 rounded-xl shadow-md disabled:bg-gray-400 transition-colors"
        >
          {loading ? "MEMPROSES ANALISIS AI..." : "JALANKAN PREDIKSI CHURN"}
        </button>

        {/* HASIL */}
        {result && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div
                className={`p-6 rounded-2xl shadow-sm border-2 text-center ${
                  result.risk === "high"
                    ? "bg-red-50 border-red-400 text-red-800"
                    : result.risk === "medium"
                      ? "bg-amber-50 border-amber-400 text-amber-800"
                      : "bg-green-50 border-green-400 text-green-800"
                }`}
              >
                <p className="text-sm uppercase font-bold">
                  Probabilitas Churn
                </p>
                <h1 className="text-5xl font-black mt-3">
                  {Math.round(result.final_probability * 100)}%
                </h1>
              </div>

              <div
                className={`p-6 rounded-2xl shadow-sm border-2 ${
                  result.risk === "HIGH"
                    ? "bg-red-50 border-red-400 text-red-800"
                    : result.risk === "MEDIUM"
                      ? "bg-amber-50 border-amber-400 text-amber-800"
                      : "bg-green-50 border-green-400 text-green-800"
                }`}
              >
                <p className="text-sm uppercase font-bold">Tingkat Risiko</p>
                <h2 className="text-3xl font-bold mt-2 capitalize">
                  {result.risk} Risk
                </h2>
                <p className="mt-3 text-sm">
                  {result.prediction === 1
                    ? "⚠️ Pelanggan diprediksi churn"
                    : "✅ Pelanggan diprediksi bertahan"}
                </p>
              </div>
            </div>

            {/* KOTAK REKOMENDASI */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              {typeof result.recommendation === "object" ? (
                <>
                  {result.recommendation.reasons &&
                    result.recommendation.reasons.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">
                          💡 Analisis Indikator Pelanggan:
                        </h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {result.recommendation.reasons.map(
                            (reason: string, idx: number) => (
                              <li key={idx}>{reason}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {result.recommendation.recommendations &&
                    result.recommendation.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-blue-700 mb-2">
                          🚀 Tindakan Retensi yang Disarankan:
                        </h4>
                        <ul className="list-decimal list-inside text-sm text-gray-700 space-y-1.5 font-medium">
                          {result.recommendation.recommendations.map(
                            (rec: string, idx: number) => (
                              <li
                                key={idx}
                                className="bg-blue-50/50 p-2 rounded-lg my-1"
                              >
                                {rec}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                </>
              ) : (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Rekomendasi</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {result.recommendation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
