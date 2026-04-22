"use client";

import Link from "next/link";

const MODULES = [
  {
    title: "Incidencias",
    description: "Gestión de averías y reparaciones del edificio.",
    href: "/admin/incidencias",
    icon: "🛠️",
    color: "border-red-500/50"
  },
  {
    title: "Proveedores",
    description: "Directorio y registro de empresas de servicios.",
    href: "/admin/proveedores",
    icon: "👥",
    color: "border-blue-500/50"
  },
  {
    title: "Configuración",
    description: "Ajustes de correo, WhatsApp y técnicos.",
    href: "/admin/config",
    icon: "⚙️",
    color: "border-emerald-500/50"
  }
];

export default function EdificioPage() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Administración del Edificio</h1>
          <p className="text-neutral-400">Seleccione el módulo que desea gestionar.</p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((mod) => (
            <Link 
              key={mod.href} 
              href={mod.href}
              className={`bg-neutral-800 border-2 ${mod.color} rounded-2xl p-6 hover:scale-[1.02] transition-all group`}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">
                {mod.icon}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{mod.title}</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                {mod.description}
              </p>
              <div className="mt-6 flex items-center text-sm font-medium text-emerald-500">
                Acceder módulo 
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-12 bg-neutral-800/50 border border-neutral-700 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-semibold text-white">Próximamente</h3>
          </div>
          <p className="text-neutral-400 text-sm">
            Estamos trabajando en nuevos módulos para la gestión de Cartelera Digital, 
            Reservas de Áreas Comunes y Control de Gastos.
          </p>
        </section>
      </div>
    </div>
  );
}
