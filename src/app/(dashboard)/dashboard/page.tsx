"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

import { Users, AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "predictions"));

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCustomers(data);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const totalCustomers = customers.length;

  const highRisk = customers.filter(
    (c) => c.risk?.toLowerCase() === "high",
  ).length;

  const mediumRisk = customers.filter(
    (c) => c.risk?.toLowerCase() === "medium",
  ).length;

  const lowRisk = customers.filter(
    (c) => c.risk?.toLowerCase() === "low",
  ).length;

  const pieData = [
    {
      name: "High Risk",
      value: highRisk,
    },
    {
      name: "Medium Risk",
      value: mediumRisk,
    },
    {
      name: "Low Risk",
      value: lowRisk,
    },
  ];
  const reasonCounter: Record<string, number> = {};

  customers.forEach((customer) => {
    let reasons: string[] = [];

    if (customer.recommendation) {
      if (Array.isArray(customer.recommendation)) {
        // Jika data upload berupa array langsung: ["A", "B"]
        reasons = customer.recommendation;
      } else if (
        customer.recommendation.reasons &&
        Array.isArray(customer.recommendation.reasons)
      ) {
        // Jika data manual berupa objek: { reasons: ["A", "B"] }
        reasons = customer.recommendation.reasons;
      } else if (typeof customer.recommendation === "string") {
        // Antisipasi jika data disimpan dalam bentuk single string teks biasa
        reasons = [customer.recommendation];
      }
    }

    reasons.forEach((reason: string) => {
      if (reason) {
        reasonCounter[reason] = (reasonCounter[reason] || 0) + 1;
      }
    });
  });

  const topReasonData = Object.entries(reasonCounter)
    .map(([name, total]) => ({
      name,
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 7);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Memuat data dashboard...</div>
      </div>
    );
  }
  const completedFollowUp = customers.filter(
    (c) => c.followUpStatus === "Sudah Ditindaklanjuti",
  ).length;

  const pendingFollowUp = customers.filter(
    (c) => c.followUpStatus !== "Sudah Ditindaklanjuti",
  ).length;

  const followUpProgress =
    totalCustomers > 0
      ? Math.round((completedFollowUp / totalCustomers) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard Churn Prediction
          </h1>

          <p className="text-slate-500 mt-2">
            Ringkasan kondisi pelanggan berdasarkan hasil prediksi churn yang
            tersimpan di database.
          </p>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card
            title="TOTAL CUSTOMER"
            value={totalCustomers}
            icon={<Users size={22} />}
          />

          <Card
            title="HIGH RISK"
            value={highRisk}
            icon={<AlertTriangle size={22} />}
            color="red"
          />

          <Card
            title="MEDIUM RISK"
            value={mediumRisk}
            icon={<ShieldAlert size={22} />}
            color="yellow"
          />

          <Card
            title="LOW RISK"
            value={lowRisk}
            icon={<ShieldCheck size={22} />}
            color="green"
          />
        </div>
        {/* CHURN DISTRIBUTION */}

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Distribusi Risiko Churn
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Komposisi pelanggan berdasarkan hasil prediksi churn.
            </p>
          </div>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={3}
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#facc15" />
                  <Cell fill="#22c55e" />
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-6 justify-center mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-600">
                High Risk ({highRisk})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-sm text-slate-600">
                Medium Risk ({mediumRisk})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-600">
                Low Risk ({lowRisk})
              </span>
            </div>
          </div>
        </div>
        {/* TOP CHURN FACTORS */}

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Faktor Penyebab Churn
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Faktor yang paling sering muncul pada pelanggan dengan risiko
              churn.
            </p>
          </div>

          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topReasonData}
                layout="vertical"
                margin={{
                  top: 10,
                  right: 30,
                  left: 60,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis type="number" />

                <YAxis type="category" dataKey="name" width={280} />

                <Tooltip />

                <Bar dataKey="total" radius={[0, 10, 10, 0]} fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* TOP HIGH RISK CUSTOMERS */}

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Prioritas Pelanggan Risiko Tinggi
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Pelanggan dengan probabilitas churn tertinggi yang perlu segera
              ditindaklanjuti.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">
                    Customer ID
                  </th>

                  <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">
                    Risiko
                  </th>

                  <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">
                    Probabilitas
                  </th>

                  <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">
                    Kontrak
                  </th>

                  <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">
                    Tenure
                  </th>

                  <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {customers
                  .filter((c) => c.risk?.toLowerCase() === "high")
                  .sort(
                    (a, b) =>
                      (b.final_probability || 0) - (a.final_probability || 0),
                  )
                  .slice(0, 10)
                  .map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="py-4 font-semibold text-slate-700">
                        {customer.customerID}
                      </td>

                      <td className="py-4">
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold">
                          HIGH
                        </span>
                      </td>

                      <td className="py-4 font-semibold text-red-600">
                        {Math.round((customer.final_probability || 0) * 100)}%
                      </td>

                      <td className="py-4 text-slate-600">
                        {customer.contract}
                      </td>

                      <td className="py-4 text-slate-600">
                        {customer.tenure} bulan
                      </td>

                      <td className="py-4">
                        {customer.followUpStatus === "Sudah Ditindaklanjuti" ? (
                          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-xs font-bold">
                            Selesai
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-xs font-bold">
                            Belum Ditindaklanjuti
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* RETENTION ACTION CENTER */}

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Retention Action Center
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Monitoring tindak lanjut pelanggan berisiko churn.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* BELUM DITINDAKLANJUTI */}

            <div className="bg-red-50 border border-red-100 rounded-xl p-5">
              <p className="text-xs font-bold text-red-500 uppercase">
                Pending Follow Up
              </p>

              <h3 className="text-4xl font-bold text-red-600 mt-2">
                {pendingFollowUp}
              </h3>

              <p className="text-sm text-red-500 mt-2">
                Pelanggan belum ditindaklanjuti
              </p>
            </div>

            {/* SUDAH DITINDAKLANJUTI */}

            <div className="bg-green-50 border border-green-100 rounded-xl p-5">
              <p className="text-xs font-bold text-green-500 uppercase">
                Completed
              </p>

              <h3 className="text-4xl font-bold text-green-600 mt-2">
                {completedFollowUp}
              </h3>

              <p className="text-sm text-green-500 mt-2">
                Pelanggan sudah ditindaklanjuti
              </p>
            </div>

            {/* PROGRESS */}

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
              <p className="text-xs font-bold text-teal-600 uppercase">
                Progress Retensi
              </p>

              <h3 className="text-4xl font-bold text-teal-700 mt-2">
                {followUpProgress}%
              </h3>

              <div className="mt-4">
                <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{
                      width: `${followUpProgress}%`,
                    }}
                  />
                </div>
              </div>

              <p className="text-sm text-teal-600 mt-3">
                Tingkat penyelesaian tindak lanjut pelanggan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon, color = "default" }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-2">{value}</h2>
        </div>

        <div
          className={`p-4 rounded-2xl ${
            color === "red"
              ? "bg-red-100 text-red-600"
              : color === "yellow"
                ? "bg-yellow-100 text-yellow-600"
                : color === "green"
                  ? "bg-green-100 text-green-600"
                  : "bg-teal-100 text-teal-600"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
