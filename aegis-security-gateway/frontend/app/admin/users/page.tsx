"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Users, ShieldCheck, User, RefreshCw } from "lucide-react";

type UserRecord = {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
  created_at: string;
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = (session?.user as unknown as Record<string, unknown>)?.isAdmin as boolean | undefined;
  const token = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch(`${apiUrl}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setUsers(await res.json() as UserRecord[]);
    setLoading(false);
  }, [token, apiUrl]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated" && !isAdmin) redirect("/dashboard");
  }, [status, isAdmin]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Users className="text-purple-400 w-7 h-7" />
            <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
          </div>
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
        <p className="text-gray-400 mb-8 text-sm">
          {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""} en el sistema
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total usuarios"
            value={users.length}
            color="border-purple-800"
            icon={<Users className="w-5 h-5 text-purple-400" />}
          />
          <StatCard
            label="Administradores"
            value={users.filter((u) => u.is_admin).length}
            color="border-blue-800"
            icon={<ShieldCheck className="w-5 h-5 text-blue-400" />}
          />
          <StatCard
            label="Clientes"
            value={users.filter((u) => !u.is_admin).length}
            color="border-green-800"
            icon={<User className="w-5 h-5 text-green-400" />}
          />
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Usuario</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Rol</th>
                <th className="text-left px-4 py-3">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    {loading ? "Cargando usuarios..." : "Sin usuarios registrados"}
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{user.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                        {user.username[0].toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-900 text-blue-300 border border-blue-700">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-900 text-green-300 border border-green-700">
                        <User className="w-3 h-3" /> Cliente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(user.created_at).toLocaleString("es-PE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label, value, color, icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`bg-gray-900 rounded-2xl border ${color} p-5`}>
      <div className="flex items-center gap-2 mb-3 text-gray-400 text-sm">{icon}{label}</div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
