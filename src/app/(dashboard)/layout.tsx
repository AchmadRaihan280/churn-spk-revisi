// Ingat: Tanpa alias (@), kita pakai relative path ke folder components
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* SIDEBAR: Terpisah & Stay */}
      <aside className="w-64 fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* TOPBAR: Terpisah & Stay (Fixed) */}
        <Topbar />

        {/* CONTENT SPACE */}
        {/* mt-16 agar konten tidak "nyungsep" di bawah Topbar yang fixed */}
        <main className="p-6 mt-16">{children}</main>
      </div>
    </div>
  );
}
