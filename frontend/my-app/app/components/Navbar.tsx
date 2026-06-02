"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/historico", label: "Histórico" },
  { href: "/alarmes", label: "Alarmes" },
  { href: "/devices", label: "Dispositivos" },
  { href: "/users", label: "Usuários" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-slate-100 font-bold text-lg tracking-wide">IFACI</Link>
        <div className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                pathname === item.href
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-400 text-sm">{user.name}</span>
        <button
          onClick={logout}
          className="text-rose-400 hover:text-rose-300 text-sm transition"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
