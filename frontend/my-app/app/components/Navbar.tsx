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
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-white font-bold text-lg">IFACI</Link>
        <div className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-400 text-sm">{user.name}</span>
        <button
          onClick={logout}
          className="text-red-400 hover:text-red-300 text-sm transition"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
