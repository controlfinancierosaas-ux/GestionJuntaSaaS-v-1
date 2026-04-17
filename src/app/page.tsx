import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-800">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">🏢</span>
            </div>
            <span className="text-xl font-semibold">GestiónCondo</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#modulos" className="text-neutral-400 hover:text-white transition-colors">Módulos</Link>
            <Link href="#beneficios" className="text-neutral-400 hover:text-white transition-colors">Beneficios</Link>
            <Link href="/login" className="text-neutral-400 hover:text-white transition-colors">Ingresar</Link>
            <Link href="/login" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors">
              Ir al Sistema
            </Link>
          </div>
        </nav>
      </header>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Sistema de Gestión Operativa<br />
            <span className="text-emerald-400">Control total para tu Junta de Condominio</span>
          </h1>
          <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
            Incidencias, gastos, mantenimientos, reservas, caja chica e inventario — todo integrado con notificaciones automáticas por email y acceso desde cualquier dispositivo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors">
              Registrar Edificio
            </Link>
            <Link href="/login?demo=true" className="px-8 py-4 border border-neutral-700 hover:border-neutral-600 text-white font-semibold rounded-lg transition-colors">
              Ver Demo
            </Link>
            <Link href="/login" className="px-8 py-4 border border-neutral-700 hover:border-neutral-600 text-white font-semibold rounded-lg transition-colors">
              Ingresar
            </Link>
          </div>
          <p className="mt-6 text-neutral-500 text-sm">
            Plataforma gratuita · Powered by Supabase + Vercel
          </p>
        </div>
      </section>

      <section className="py-12 px-6 bg-neutral-800/50">
        <div className="max-w-4xl mx-auto flex justify-center gap-16 text-center">
          <div>
            <div className="text-4xl font-bold text-emerald-400">8+</div>
            <div className="text-neutral-400 text-sm mt-1">Módulos integrados</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-emerald-400">100%</div>
            <div className="text-neutral-400 text-sm mt-1">Acceso desde móvil</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-emerald-400">$0</div>
            <div className="text-neutral-400 text-sm mt-1">Para comenzar</div>
          </div>
        </div>
      </section>

      <section id="modulos" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Módulos del sistema</h2>
          <p className="text-center text-neutral-400 mb-16">Todo lo que tu junta necesita</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Reportes de Incidencias</h3>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">Disponible</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Recibe, crea y gestiona incidencias con fotos adjuntas y notificación inmediata a toda la junta por email.
              </p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Control de Gastos</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">En desarrollo</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Registra facturas y notas de entrega en Bs. y USD con tasa BCV. Historial de pagos y estado por factura.
              </p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Mantenimientos</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">En desarrollo</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Preventivos y correctivos por área: ascensores, bombas, cámaras, jardinería. Próximas fechas y hallazgos.
              </p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Directorio de Proveedores</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">En desarrollo</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Búsqueda por RIF o Cédula con autocompletado en formularios. Contratos, vigencias y categorías.
              </p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Reservas de Salón de Fiestas</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">En desarrollo</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Solicitudes, aprobaciones, pagos e historial. Estado de solvencia y condiciones post-evento.
              </p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Inventario + Caja Chica</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">En desarrollo</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Entradas y salidas de insumos con alertas de stock mínimo. Movimientos de caja con saldo en tiempo real.
              </p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Claves y Documentación</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">En desarrollo</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Bóveda de credenciales de sistemas (CCTV, DVR, accesos) y repositorio de documentos del edificio.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="py-20 px-6 bg-neutral-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Por qué GestiónCondo</h2>
          <p className="text-xl text-neutral-400 mb-12">Gestión profesional, sin complicaciones</p>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="flex gap-4">
              <div className="text-2xl">📧</div>
              <div>
                <h4 className="font-semibold mb-2">Notificaciones automáticas por email</h4>
                <p className="text-neutral-400 text-sm">Cada módulo notifica automáticamente a los miembros de la junta por email al registrar cualquier evento.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">💵</div>
              <div>
                <h4 className="font-semibold mb-2">Doble moneda: Bolívares y dólares</h4>
                <p className="text-neutral-400 text-sm">Con tasa BCV integrada para precios en Bs. y USD.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">📎</div>
              <div>
                <h4 className="font-semibold mb-2">Hasta 10 archivos adjuntos por registro</h4>
                <p className="text-neutral-400 text-sm">Fotos, facturas, contratos y más.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">📋</div>
              <div>
                <h4 className="font-semibold mb-2">Historial completo y trazabilidad</h4>
                <p className="text-neutral-400 text-sm">Incidencias, gastos y reservas con registro completo.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">👥</div>
              <div>
                <h4 className="font-semibold mb-2">Directorio de proveedores</h4>
                <p className="text-neutral-400 text-sm">Autocompletado por RIF o Cédula.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">📱</div>
              <div>
                <h4 className="font-semibold mb-2">Funciona en celular, tablet y computadora</h4>
                <p className="text-neutral-400 text-sm">Sin instalación, acceso desde cualquier dispositivo.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">🏢</div>
              <div>
                <h4 className="font-semibold mb-2">Compatible con residenciales, comerciales y mixtos</h4>
                <p className="text-neutral-400 text-sm">Adaptable a cualquier tipo de condominio.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">☁️</div>
              <div>
                <h4 className="font-semibold mb-2">Datos almacenados en Supabase</h4>
                <p className="text-neutral-400 text-sm">Con respaldo automático.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Comienza en menos de 10 minutos</h2>
          <p className="text-neutral-400 mb-8">
            Configura tu condominio, registra los miembros de la junta y empieza a gestionar hoy mismo.
          </p>
          <Link href="/register" className="inline-block px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors">
            Ir al Sistema
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏢</span>
            <span className="text-neutral-500">GestiónCondo © 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-neutral-500">
            <span>Residenciales</span>
            <span>Centros Comerciales</span>
            <span>Mixtos</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
