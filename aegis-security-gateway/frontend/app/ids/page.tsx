"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { AlertTriangle, RefreshCw } from "lucide-react";

type IdsAlert = {
  id: number;
  level: string;
  type: string;
  source_ip: string;
  description: string;
  timestamp: string;
};

const levelColor: Record<string, string> = {
  ALTO: "bg-red-900 text-red-300 border-red-700",
  MEDIO: "bg-yellow-900 text-yellow-300 border-yellow-700",
  BAJO: "bg-green-900 text-green-300 border-green-700",
};

export default function IDSPage() {
  const { data: session, status } = useSession();
  const [alerts, setAlerts] = useState<IdsAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const loadAlerts = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const token = (session as unknown as Record<string, unknown>).accessToken as string;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const levelParam = filter ? `&level=${filter}` : "";
    const res = await fetch(`${apiUrl}/api/v1/ids/alerts?limit=200${levelParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setAlerts(await res.json() as IdsAlert[]);
    setLoading(false);
  }, [session, filter]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400 w-7 h-7" />
            <h1 className="text-2xl font-bold text-white">Centro de Seguridad de Red</h1>
          </div>
          <button
            onClick={loadAlerts}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
        <p className="text-gray-400 mb-6 text-sm">Alertas del IDS detectadas por el capturador de paquetes Scapy → MySQL</p>

        <div className="flex gap-2 mb-6">
          {["", "ALTO", "MEDIO", "BAJO"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === lvl
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {lvl === "" ? "Todos" : lvl}
            </button>
          ))}
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Nivel</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">IP Origen</th>
                <th className="text-left px-4 py-3">Descripción</th>
                <th className="text-left px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    {loading ? "Cargando alertas..." : "No hay alertas registradas"}
                  </td>
                </tr>
              )}
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${levelColor[alert.level] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}>
                      {alert.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-300">{alert.type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{alert.source_ip}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{alert.description}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(alert.timestamp).toLocaleString("es-PE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
