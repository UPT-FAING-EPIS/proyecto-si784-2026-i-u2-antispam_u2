"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Search, ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

type ScanSummary = {
  id: number;
  target_url: string;
  status: string;
  risk_score: number;
  created_at: string;
  completed_at: string | null;
};

type Vulnerability = {
  id: number;
  module: string;
  severity: string;
  title: string;
  description: string;
  remediation: string;
  url: string;
  parameter: string | null;
};

type ScanDetail = ScanSummary & {
  ai_summary: string | null;
  error_message: string | null;
  progress: number;
  vulnerabilities: Vulnerability[];
};

const severityColor: Record<string, string> = {
  critical: "text-purple-300 bg-purple-900 border-purple-700",
  high: "text-red-300 bg-red-900 border-red-700",
  medium: "text-yellow-300 bg-yellow-900 border-yellow-700",
  low: "text-blue-300 bg-blue-900 border-blue-700",
  info: "text-gray-300 bg-gray-800 border-gray-700",
};

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: "Pendiente",   color: "text-gray-400",   dot: "bg-gray-500" },
  running:   { label: "Escaneando",  color: "text-yellow-400", dot: "bg-yellow-400 animate-pulse" },
  completed: { label: "Completado",  color: "text-green-400",  dot: "bg-green-400" },
  failed:    { label: "Fallido",     color: "text-red-400",    dot: "bg-red-400" },
};

export default function ScannerPage() {
  const { data: session, status } = useSession();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [targetUrl, setTargetUrl] = useState("");
  const [launching, setLaunching] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<ScanDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const loadScans = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${apiUrl}/api/v1/scanner/scans`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json() as ScanSummary[];
      setScans(data);
      return data;
    }
    return [];
  }, [token, apiUrl]);

  // Refresh expanded scan detail when it changes externally
  const refreshDetail = useCallback(async (scanId: number) => {
    if (!token) return;
    const res = await fetch(`${apiUrl}/api/v1/scanner/scans/${scanId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setDetail(await res.json() as ScanDetail);
  }, [token, apiUrl]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  useEffect(() => { loadScans(); }, [loadScans]);

  // Auto-poll while any scan is pending/running
  useEffect(() => {
    const hasActive = scans.some((s) => s.status === "pending" || s.status === "running");

    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const updated = await loadScans() as ScanSummary[];
        // Also refresh expanded detail if it was active
        if (expanded !== null) {
          const expandedScan = updated?.find((s) => s.id === expanded);
          if (expandedScan) refreshDetail(expanded);
        }
        // Stop polling once nothing is active
        const stillActive = updated?.some((s) => s.status === "pending" || s.status === "running");
        if (!stillActive && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 3000);
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [scans, expanded, loadScans, refreshDetail]);

  async function launchScan() {
    if (!token || !targetUrl.trim()) return;
    setLaunching(true);
    await fetch(`${apiUrl}/api/v1/scanner/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ target_url: targetUrl }),
    });
    setLaunching(false);
    setTargetUrl("");
    loadScans();
  }

  async function toggleExpand(scanId: number) {
    if (expanded === scanId) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(scanId);
    setLoadingDetail(true);
    const res = await fetch(`${apiUrl}/api/v1/scanner/scans/${scanId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setDetail(await res.json() as ScanDetail);
    setLoadingDetail(false);
  }

  const riskColor = (score: number, status: string) => {
    if (status === "failed") return "text-red-500";
    if (score >= 70) return "text-red-400";
    if (score >= 40) return "text-yellow-400";
    if (score > 0) return "text-blue-400";
    return "text-green-400";
  };

  const hasActive = scans.some((s) => s.status === "pending" || s.status === "running");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="text-blue-400 w-7 h-7" />
          <h1 className="text-2xl font-bold text-white">Scanner de Vulnerabilidades</h1>
        </div>
        <p className="text-gray-400 mb-8 text-sm">Lanza escaneos sobre dominios y revisa vulnerabilidades con análisis de IA</p>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Nuevo escaneo</h2>
          <div className="flex gap-3">
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && launchScan()}
              placeholder="https://ejemplo.com"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={launchScan}
              disabled={launching || !targetUrl.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {launching ? <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando...</> : "Lanzar escaneo"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Historial de escaneos</h2>
          <div className="flex items-center gap-2">
            {hasActive && (
              <span className="flex items-center gap-1.5 text-yellow-400 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                Escaneo en curso — actualizando automáticamente
              </span>
            )}
            <button
              onClick={() => loadScans()}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Actualizar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {scans.length === 0 && (
            <p className="text-center text-gray-500 py-12">No hay escaneos aún. Lanza el primero.</p>
          )}
          {scans.map((scan) => {
            const cfg = statusConfig[scan.status] ?? statusConfig.pending;
            return (
              <div
                key={scan.id}
                className={`bg-gray-900 rounded-xl border overflow-hidden transition-colors ${
                  scan.status === "failed" ? "border-red-900/50" : "border-gray-800"
                }`}
              >
                <button
                  onClick={() => toggleExpand(scan.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4 text-left">
                    {/* Risk score or status icon */}
                    {scan.status === "running" || scan.status === "pending" ? (
                      <Loader2 className="w-8 h-8 text-yellow-400 animate-spin shrink-0" />
                    ) : scan.status === "failed" ? (
                      <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                    ) : (
                      <span className={`text-2xl font-bold w-8 shrink-0 ${riskColor(scan.risk_score, scan.status)}`}>
                        {scan.risk_score}
                      </span>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{scan.target_url}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-500 text-xs">{new Date(scan.created_at).toLocaleString("es-PE")}</span>
                      </div>
                    </div>
                  </div>
                  {expanded === scan.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>

                {expanded === scan.id && (
                  <div className="border-t border-gray-800 px-5 py-4">
                    {loadingDetail && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando detalle...
                      </div>
                    )}

                    {detail && detail.id === scan.id && (
                      <>
                        {/* Running state */}
                        {(detail.status === "pending" || detail.status === "running") && (
                          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4 bg-yellow-950 border border-yellow-800 rounded-lg px-4 py-3">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Escaneo en progreso — los resultados aparecerán automáticamente al completarse.
                            {detail.progress > 0 && (
                              <span className="ml-auto text-xs text-yellow-300">{detail.progress}%</span>
                            )}
                          </div>
                        )}

                        {/* Failed state with reason */}
                        {detail.status === "failed" && (
                          <div className="flex items-start gap-2 text-red-300 text-sm mb-4 bg-red-950 border border-red-800 rounded-lg px-4 py-3">
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold mb-0.5">El escaneo falló</p>
                              <p className="text-xs text-red-400 font-mono">
                                {detail.error_message ?? "Error desconocido"}
                              </p>
                              <p className="text-xs text-red-500 mt-1 opacity-70">
                                Posibles causas: sitio caído, bloqueando el scanner, o sin acceso desde este servidor.
                              </p>
                            </div>
                          </div>
                        )}

                        {detail.ai_summary && (
                          <div className="bg-blue-950 border border-blue-800 rounded-lg p-4 mb-4 text-sm text-blue-200">
                            <p className="font-semibold mb-2">Resumen IA</p>
                            <p className="text-xs leading-relaxed">{detail.ai_summary}</p>
                          </div>
                        )}

                        {detail.status === "completed" && detail.vulnerabilities.length === 0 && (
                          <p className="text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            No se encontraron vulnerabilidades.
                          </p>
                        )}

                        <div className="space-y-2 mt-2">
                          {detail.vulnerabilities.map((vuln) => (
                            <div key={vuln.id} className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${severityColor[vuln.severity] ?? severityColor.info}`}>
                                  {vuln.severity.toUpperCase()}
                                </span>
                                <span className="text-white text-sm font-medium">{vuln.title}</span>
                              </div>
                              <p className="text-gray-400 text-xs mb-2">{vuln.description}</p>
                              <p className="text-blue-300 text-xs"><strong>Remediación:</strong> {vuln.remediation}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
