"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { Shield, LayoutDashboard, AlertTriangle, Filter, Search, Key, LogOut, Users } from "lucide-react";

const clientNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/ids", icon: AlertTriangle, label: "IDS / Red" },
  { href: "/antispam", icon: Filter, label: "Antispam" },
  { href: "/scanner", icon: Search, label: "Scanner" },
  { href: "/api-keys", icon: Key, label: "API Keys" },
];

const adminNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/ids", icon: AlertTriangle, label: "IDS / Red" },
  { href: "/antispam", icon: Filter, label: "Antispam" },
  { href: "/scanner", icon: Search, label: "Scanner" },
  { href: "/admin/users", icon: Users, label: "Usuarios" },
  { href: "/api-keys", icon: Key, label: "API Keys" },
];

export function Sidebar() {
  const path = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as unknown as Record<string, unknown>)?.isAdmin as boolean | undefined;
  const nav = isAdmin ? adminNav : clientNav;

  return (
    <aside className="w-60 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
        <Shield className="text-blue-500 w-7 h-7" />
        <span className="font-bold text-lg text-white">Aegis</span>
        {isAdmin && (
          <span className="ml-auto text-xs bg-blue-700 text-blue-100 px-1.5 py-0.5 rounded font-medium">
            Admin
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              path === href
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
