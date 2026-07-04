"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Filter, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp, ThumbsUp } from "lucide-react";

type SpamLog = {
  id: number;
  user_email: string | null;
  author: string;
  content: string;
  is_spam: boolean;
  reason: string | null;
  score: number;
  client_ip: string | null;
  created_at: string;
};

type TestResult = {
  is_spam: boolean;
  reason: string | null;
  score: number;
  detail: string;
};

const reasonLabel: Record<string, string> = {
  blacklisted_word: "Palabra prohibida",
  too_many_urls: "Demasiadas URLs",
  approved_by_user: "Aprobado manualmente",
};

export default function AntispamPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<SpamLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [approving, setApproving] = useState<number | null>(null);
  const [testContent, setTestContent] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const token = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const loadLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch(`${apiUrl}/api/v1/antispam/logs?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setLogs(await res.json() as SpamLog[]);
    setLoading(false);
  }, [token, apiUrl]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  async function handleTest() {
    if (!token || !testContent.trim()) return;
    setTesting(true);
    const res = await fetch(`${apiUrl}/api/v1/antispam/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ author: "test-manual", content: testContent }),
    });
    if (res.ok) {
      setTestResult(await res.json() as TestResult);
      loadLogs();
    }
    setTesting(false);
  }

  async function handleApprove(logId: number) {
    if (!token) return;
    setApproving(logId);
    const res = await fetch(`${apiUrl}/api/v1/antispam/logs/${logId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setLogs((prev) => prev.map((l) =>
        l.id === logId ? { ...l, is_spam: false, reason: "approved_by_user" } : l
      ));
    }
    setApproving(null);
  }

  const spamCount = logs.filter((l) => l.is_spam).length;
  const cleanCount = logs.filter((l) => !l.is_spam).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-2">
          <Filter className="text-yellow-400 w-7 h-7" />
          <h1 className="text-2xl font-bold text-white">Panel Antispam</h1>
        </div>
        <p className="text-gray-400 mb-8 text-sm">Historial de mensajes analizados desde tu aplicación</p>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{logs.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total revisiones</p>
          </div>
          <div className="bg-gray-900 border border-red-900 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{spamCount}</p>
            <p className="text-xs text-gray-500 mt-1">Spam detectado</p>
          </div>
          <div className="bg-gray-900 border border-green-900 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{cleanCount}</p>
            <p className="text-xs text-gray-500 mt-1">Contenido limpio</p>
          </div>
        </div>

        {/* Test tool */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Probar contenido manualmente</h2>
          <textarea
            rows={3}
            value={testContent}
            onChange={(e) => setTestContent(e.target.value)}
            placeholder="Escribe un mensaje para verificar si es spam..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-yellow-500 mb-3"
          />
          <button
            onClick={handleTest}
            disabled={testing || !testContent.trim()}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {testing ? "Analizando..." : "Analizar mensaje"}
          </button>

          {testResult && (
            <div className={`mt-4 rounded-lg border p-4 text-sm ${testResult.is_spam ? "bg-red-950 border-red-800 text-red-300" : "bg-green-950 border-green-800 text-green-300"}`}>
              <div className="flex items-center gap-2 font-semibold mb-1">
                {testResult.is_spam
                  ? <><XCircle className="w-4 h-4" /> SPAM detectado</>
                  : <><CheckCircle className="w-4 h-4" /> Mensaje limpio</>
                }
              </div>
              <p className="text-xs opacity-80">{testResult.detail}</p>
              {testResult.reason && (
                <p className="text-xs mt-1 opacity-60">
                  Razón: {reasonLabel[testResult.reason] ?? testResult.reason} · Score: {testResult.score}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Log table */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Registros de análisis</h2>
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        <div className="space-y-2">
          {logs.length === 0 && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 py-14 text-center text-gray-500 text-sm">
              {loading ? "Cargando registros..." : "Sin registros aún. Los mensajes del foro aparecerán aquí."}
            </div>
          )}

          {logs.map((log) => (
            <div key={log.id} className={`bg-gray-900 rounded-xl border transition-colors ${log.is_spam ? "border-red-900" : "border-gray-800"}`}>
              {/* Row header — always visible */}
              <button
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-800/40 rounded-xl transition-colors"
              >
                {/* Status badge */}
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${log.is_spam ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"}`}>
                  {log.is_spam ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  {log.is_spam ? "Spam" : "Limpio"}
                </span>

                {/* Author + email */}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{log.author}</p>
                  {log.user_email && (
                    <p className="text-gray-500 text-xs truncate">{log.user_email}</p>
                  )}
                </div>

                {/* Content preview */}
                <p className="hidden md:block flex-1 text-gray-400 text-xs truncate max-w-xs">{log.content}</p>

                {/* Score */}
                <span className={`shrink-0 text-sm font-bold ${log.score >= 70 ? "text-red-400" : log.score >= 30 ? "text-yellow-400" : "text-green-400"}`}>
                  {log.score}
                </span>

                {/* Date */}
                <span className="shrink-0 text-gray-500 text-xs whitespace-nowrap hidden lg:block">
                  {new Date(log.created_at).toLocaleString("es-PE")}
                </span>

                {expanded === log.id ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
              </button>

              {/* Expanded detail */}
              {expanded === log.id && (
                <div className="border-t border-gray-800 px-4 py-4 space-y-4">
                  {/* User info row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 mb-0.5">Usuario del foro</p>
                      <p className="text-white font-medium">{log.author}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Email</p>
                      <p className="text-white font-mono">{log.user_email ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">IP</p>
                      <p className="text-white font-mono">{log.client_ip ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Fecha</p>
                      <p className="text-white">{new Date(log.created_at).toLocaleString("es-PE")}</p>
                    </div>
                  </div>

                  {/* Detection info */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 mb-0.5">Razón de detección</p>
                      <p className={`font-medium ${log.is_spam ? "text-red-300" : "text-green-300"}`}>
                        {reasonLabel[log.reason ?? ""] ?? log.reason ?? "Ninguna"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Score de spam</p>
                      <p className={`font-bold text-lg ${log.score >= 70 ? "text-red-400" : log.score >= 30 ? "text-yellow-400" : "text-green-400"}`}>
                        {log.score}/100
                      </p>
                    </div>
                  </div>

                  {/* Full content */}
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Contenido completo</p>
                    <div className="bg-gray-800 rounded-lg p-3 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {log.content}
                    </div>
                  </div>

                  {/* Approve button */}
                  {log.is_spam && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => handleApprove(log.id)}
                        disabled={approving === log.id}
                        className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {approving === log.id ? "Aprobando..." : "Aprobar — no es spam"}
                      </button>
                      <p className="text-gray-500 text-xs">
                        Marca este mensaje como contenido legítimo
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
