"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_GROUPS = [
  {
    title: "Administración",
    items: [
      { label: "Panel de Control", href: "/dashboard", icon: "📊" },
      { label: "Gestión de Calidad", href: "/admin/evaluaciones", icon: "⭐" },
      { label: "Mi Edificio", href: "/admin/edificio", icon: "🏢" },
      { label: "Configuración", href: "/admin/config", icon: "⚙️" },
    ]
  },
  {
    title: "Módulos del Edificio",
    items: [
      { label: "Incidencias", href: "/admin/incidencias", icon: "🛠️" },
      { label: "Proveedores", href: "/admin/proveedores", icon: "👥" },
      { label: "Cronograma de Servicios", href: "/admin/proveedores/reporte-recurrentes", icon: "📅" },
      { label: "Control de Gastos", href: "/admin/gastos", icon: "💸" },
      { label: "Inventario / Almacén", href: "/admin/inventario", icon: "📦" },
      { label: "Caja Chica", href: "/admin/caja-chica", icon: "💰" },
      { label: "Salón de Fiestas", href: "/admin/salon", icon: "🎉" },
    ]
  },
  {
    title: "Acciones de Usuario",
    items: [
      { label: "Reportar Incidencia", href: "/incidencias", icon: "📝" },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-neutral-800 border-r border-neutral-700 min-h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-neutral-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold">🏢</span>
          </div>
          <span className="text-xl font-semibold text-white">GestiónCondo</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-6 mt-4 overflow-y-auto">
        {MENU_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-900/20"
                        : "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-700">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:bg-neutral-700 hover:text-white rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </Link>
      </div>
    </aside>
  );
}
