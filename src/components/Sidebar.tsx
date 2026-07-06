"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Brain,
  GitCompare,
  BarChart3,
  Users,
  History,
  Settings,
  Activity,
} from "lucide-react";

import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  // dropdown logout
  const [open, setOpen] = useState(false);

  // dropdown menu prediksi
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const menu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },

    {
      name: "Prediksi",
      icon: Brain,
      children: [
        {
          name: "Prediksi Manual",
          path: "/prediksi",
        },
        {
          name: "Upload Dataset",
          path: "/prediksi/upload",
        },
      ],
    },

    {
      name: "Data Pelanggan",
      icon: Users,
      children: [
        {
          name: "Customer Churn",
          path: "/Data-Customer",
        },
        {
          name: "Customer Setia",
          path: "/Data-Customer/setia",
        },
      ],
    },
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-[#0f172a] to-[#020617] text-white flex flex-col justify-between p-5">
      {/* ================= TOP ================= */}
      <div>
        {/* LOGO */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-teal-500 p-3 rounded-xl shadow-lg">
            <Activity size={20} />
          </div>

          <div>
            <h1 className="text-lg font-bold">ChurnGuard</h1>

            <p className="text-xs text-gray-400">Decision Support System</p>
          </div>
        </div>

        <div className="border-t border-slate-700 mb-6"></div>

        {/* ================= MENU ================= */}
        <nav className="space-y-2">
          {menu.map((item) => {
            // ================= DROPDOWN MENU =================
            if ("children" in item) {
              const Icon = item.icon;

              return (
                <div key={item.name}>
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === item.name ? null : item.name)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-400 hover:bg-slate-800 hover:text-white transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />

                      <span className="text-sm font-medium">{item.name}</span>
                    </div>

                    <span className="text-lg">
                      {openMenu === item.name ? "−" : "+"}
                    </span>
                  </button>

                  {/* SUBMENU */}
                  {openMenu === item.name && (
                    <div className="ml-8 mt-2 space-y-2">
                      {item.children?.map((sub) => {
                        const active = pathname === sub.path;

                        return (
                          <Link
                            key={sub.name}
                            href={sub.path}
                            className={`block px-4 py-2 rounded-lg text-sm transition ${
                              active
                                ? "bg-slate-800 text-teal-400"
                                : "text-gray-400 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // ================= NORMAL MENU =================
            const Icon = item.icon;
            const active = pathname === item.path;

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-slate-800 text-teal-400"
                    : "text-gray-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />

                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ================= BOTTOM ================= */}
      <div>
        <div className="border-t border-slate-700 mb-4"></div>

        {!user ? (
          <Link
            href="/login"
            className="block w-full text-center bg-teal-500 hover:bg-teal-600 py-3 rounded-xl font-semibold transition"
          >
            Login Admin
          </Link>
        ) : (
          <div className="relative">
            {/* USER CARD */}
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 bg-slate-800/70 backdrop-blur-md p-3 rounded-xl border border-slate-700 hover:bg-slate-800 transition cursor-pointer"
            >
              {/* AVATAR */}
              <div className="relative">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="w-11 h-11 rounded-full object-cover border-2 border-teal-500"
                  />
                ) : (
                  <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold text-lg">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full"></span>
              </div>

              {/* INFO */}
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.displayName || "Admin User"}
                </p>

                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>

            {/* DROPDOWN */}
            {open && (
              <div className="absolute bottom-16 left-0 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
