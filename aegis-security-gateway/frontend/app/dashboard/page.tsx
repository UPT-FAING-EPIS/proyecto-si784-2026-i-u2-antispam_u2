"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { AlertTriangle, Filter, Search, Activity, Users, ShieldCheck } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip);

type AdminOverview = {
  total_users: number;
  total_scans: number;
  total_ids_alerts: number;
  total_spam_logs: number;
  spam_blocked_24h: number;
  ids_alerts_24h: number;
};

type ClientStats = {
  total_logs: number;
  spam_total: number;
  spam_blocked_24h: number;
  clean_total: number;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [adminData, setAdminData] = useState<AdminOverview | null>(null);
  const [clientData, setClientData] = useState<ClientStats | null>(null);

  const isAdmin = (session?.user as unknown as Record<string, unknown>)?.isAdmin as boolean | undefined;
  const token = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  useEffect(() => {
    if (!session || !token) return;

    if (isAdmin) {
      fetch(`${apiUrl}/api/v1/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => d && setAdminData(d as AdminOverview));
    } else {
      fetch(`${apiUrl}/api/v1/antispam/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => d && setClientData(d as ClientStats));
    }
  }, [session, isAdmin, token, apiUrl]);

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-gray-400">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        {isAdmin ? (
          <AdminDashboard data={adminData} />
        ) : (
          <ClientDashboard data={clientData} username={(session?.user as unknown as Record<string, unknown>)?.username as string} />
        )}
      </main>
    </div>
  );
}

function AdminDashboard({ data }: { data: AdminOverview | null }) {
  const chartData = {
    labels: ["Hace 6h", "Hace 5h", "Hace 4h", "Hace 3h", "Hace 2h", "Hace 1h", "Ahora"],
    datasets: [
      {
        label: "Alertas IDS",
        data: [0, 0, 0, 0, 0, 0, data?.ids_alerts_24h ?? 0],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.1)",
        tension: 0.4,
      },
      {
        label: "Spam bloqueado",
        data: [0, 0, 0, 0, 0, 0, data?.spam_blocked_24h ?? 0],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.1)",
        tension: 0.4,
      },
    ],
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-7 h-7 text-green-400" />
        <h1 className="text-2xl font-bold text-white">Panel de Administrador</h1>
      </div>
      <p className="text-gray-400 mb-8">Vista global del sistema — todos los clientes</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          icon={<AlertTriangle className="w-6 h-6 text-red-400" />}
          label="Alertas IDS (24h)"
          value={data?.ids_alerts_24h ?? "—"}
          sub={`Total histórico: ${data?.total_ids_alerts ?? "—"}`}
          color="border-red-800"
        />
        <KpiCard
          icon={<Filter className="w-6 h-6 text-yellow-400" />}
          label="Spam bloqueado (24h)"
          value={data?.spam_blocked_24h ?? "—"}
          sub={`Total logs: ${data?.total_spam_logs ?? "—"}`}
          color="border-yellow-800"
        />
        <KpiCard
          icon={<Search className="w-6 h-6 text-blue-400" />}
          label="Escaneos totales"
          value={data?.total_scans ?? "—"}
          sub={`Usuarios registrados: ${data?.total_users ?? "—"}`}
          color="border-blue-800"
        />
        <KpiCard
          icon={<Users className="w-6 h-6 text-purple-400" />}
          label="Usuarios registrados"
          value={data?.total_users ?? "—"}
          sub="Total en el sistema"
          color="border-purple-800"
        />
        <KpiCard
          icon={<Filter className="w-6 h-6 text-orange-400" />}
          label="Spam logs total"
          value={data?.total_spam_logs ?? "—"}
          sub="Todos los clientes"
          color="border-orange-800"
        />
        <KpiCard
          icon={<AlertTriangle className="w-6 h-6 text-pink-400" />}
          label="IDS alerts total"
          value={data?.total_ids_alerts ?? "—"}
          sub="Red histórica"
          color="border-pink-800"
        />
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Eventos de seguridad (últimas 6 horas)
        </h2>
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { labels: { color: "#9ca3af" } } },
            scales: {
              x: { ticks: { color: "#6b7280" }, grid: { color: "#1f2937" } },
              y: { ticks: { color: "#6b7280" }, grid: { color: "#1f2937" }, beginAtZero: true },
            },
          }}
        />
      </div>
    </>
  );
}

function ClientDashboard({ data, username }: { data: ClientStats | null; username?: string }) {
  const chartData = {
    labels: ["Hace 6h", "Hace 5h", "Hace 4h", "Hace 3h", "Hace 2h", "Hace 1h", "Ahora"],
    datasets: [
      {
        label: "Spam bloqueado",
        data: [0, 0, 0, 0, 0, 0, data?.spam_blocked_24h ?? 0],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.15)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Contenido limpio",
        data: [0, 0, 0, 0, 0, 0, data?.clean_total ?? 0],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const spamRate = data && data.total_logs > 0
    ? Math.round((data.spam_total / data.total_logs) * 100)
    : 0;

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <Filter className="w-7 h-7 text-yellow-400" />
        <h1 className="text-2xl font-bold text-white">Mi Panel de Seguridad</h1>
      </div>
      <p className="text-gray-400 mb-8">
        Bienvenido, <span className="text-white font-medium">{username ?? "cliente"}</span> — datos de tu integración con Aegis
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          icon={<Filter className="w-6 h-6 text-red-400" />}
          label="Spam bloqueado (24h)"
          value={data?.spam_blocked_24h ?? "—"}
          sub="Últimas 24 horas"
          color="border-red-800"
        />
        <KpiCard
          icon={<Filter className="w-6 h-6 text-yellow-400" />}
          label="Total spam detectado"
          value={data?.spam_total ?? "—"}
          sub="Histórico de tu cuenta"
          color="border-yellow-800"
        />
        <KpiCard
          icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
          label="Contenido limpio"
          value={data?.clean_total ?? "—"}
          sub="Aprobado por Aegis"
          color="border-green-800"
        />
        <KpiCard
          icon={<Activity className="w-6 h-6 text-blue-400" />}
          label="Tasa de spam"
          value={data ? `${spamRate}%` : "—"}
          sub={`De ${data?.total_logs ?? 0} revisiones totales`}
          color="border-blue-800"
        />
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-yellow-400" />
          Actividad antispam de tu aplicación
        </h2>
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { labels: { color: "#9ca3af" } } },
            scales: {
              x: { ticks: { color: "#6b7280" }, grid: { color: "#1f2937" } },
              y: { ticks: { color: "#6b7280" }, grid: { color: "#1f2937" }, beginAtZero: true },
            },
          }}
        />
      </div>

      <div className="mt-6 bg-gray-900 rounded-2xl border border-gray-700 p-4">
        <p className="text-sm text-gray-400">
          <span className="text-white font-medium">Integración activa:</span> Tu foro envía cada post y comentario al motor antispam de Aegis.
          Ve a <a href="/antispam" className="text-yellow-400 hover:underline">Antispam</a> para ver el historial detallado.
        </p>
      </div>
    </>
  );
}

function KpiCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  color: string;
}) {
  return (
    <div className={`bg-gray-900 rounded-2xl border ${color} p-6`}>
      <div className="flex items-center gap-3 mb-4">{icon}<span className="text-sm text-gray-400">{label}</span></div>
      <p className="text-4xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}
