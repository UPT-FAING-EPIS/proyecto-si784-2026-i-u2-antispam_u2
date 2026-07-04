"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Key, Plus, Trash2, Copy, CheckCheck } from "lucide-react";

type ApiKey = {
  id: number;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
};

type ApiKeyCreated = ApiKey & { raw_key: string };

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    if (!session) return;
    const token = (session as unknown as Record<string, unknown>).accessToken as string;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/v1/api-keys`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setKeys(await res.json() as ApiKey[]);
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  async function createKey() {
    if (!session || !name.trim()) return;
    setCreating(true);
    const token = (session as unknown as Record<string, unknown>).accessToken as string;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/v1/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setNewKey(await res.json() as ApiKeyCreated);
      setName("");
      loadKeys();
    }
    setCreating(false);
  }

  async function revokeKey(id: number) {
    if (!session) return;
    const token = (session as unknown as Record<string, unknown>).accessToken as string;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    await fetch(`${apiUrl}/api/v1/api-keys/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadKeys();
  }

  function copyKey(raw: string) {
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-2">
          <Key className="text-purple-400 w-7 h-7" />
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
        </div>
        <p className="text-gray-400 mb-8 text-sm">Gestiona las claves de integración para servicios externos (ej: Furyum)</p>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Crear nueva API key</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre descriptivo (ej: furyum-production)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={createKey}
              disabled={creating || !name.trim()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Crear
            </button>
          </div>

          {newKey && (
            <div className="mt-4 bg-green-950 border border-green-800 rounded-lg p-4">
              <p className="text-green-300 text-sm font-semibold mb-2">API key creada — guárdala ahora, no se mostrará de nuevo</p>
              <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
                <code className="text-green-400 text-xs flex-1 break-all">{newKey.raw_key}</code>
                <button onClick={() => copyKey(newKey.raw_key)} className="text-gray-400 hover:text-white transition-colors">
                  {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {keys.length === 0 && <p className="text-center text-gray-500 py-12">No tienes API keys aún.</p>}
          {keys.map((k) => (
            <div key={k.id} className={`bg-gray-900 rounded-xl border p-5 flex items-center justify-between ${k.is_active ? "border-gray-800" : "border-gray-800 opacity-50"}`}>
              <div>
                <p className="text-white font-medium">{k.name}</p>
                <p className="text-gray-500 text-xs font-mono mt-1">{k.key_prefix}...</p>
                <p className="text-gray-500 text-xs mt-1">
                  Creada: {new Date(k.created_at).toLocaleDateString("es-PE")}
                  {k.last_used_at && ` · Último uso: ${new Date(k.last_used_at).toLocaleDateString("es-PE")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-500"}`}>
                  {k.is_active ? "Activa" : "Revocada"}
                </span>
                {k.is_active && (
                  <button
                    onClick={() => revokeKey(k.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Revocar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
