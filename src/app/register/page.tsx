"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Error al registrar");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/login?registered=${result.buildingId}`);
      }, 2000);
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-2">¡Registro Exitoso!</h1>
          <p className="text-neutral-400 mb-4">Tu edificio ha sido registrado correctamente.</p>
          <p className="text-neutral-500">Redirigiendo al login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-800">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">🏢</span>
            </div>
            <span className="text-xl font-semibold">GestiónCondo</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-neutral-400 hover:text-white transition-colors">Ingresar</Link>
            <Link href="/login" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors">
              Ir al Sistema
            </Link>
          </div>
        </nav>
      </header>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Registrar tu Edificio</h1>
            <p className="text-neutral-400">Configura tu condominio en menos de 10 minutos</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Datos del Edificio</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="buildingName" className="block text-sm font-medium mb-2">Nombre del Edificio *</label>
                  <input type="text" id="buildingName" name="buildingName" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="Torre Residencial Los Parques" />
                </div>
                <div>
                  <label htmlFor="rif" className="block text-sm font-medium mb-2">RIF del Edificio</label>
                  <input type="text" id="rif" name="rif" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="J-12345678-1" />
                </div>
                <div>
                  <label htmlFor="buildingType" className="block text-sm font-medium mb-2">Tipo de Edificio *</label>
                  <select id="buildingType" name="buildingType" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none">
                    <option value="">Selecciona el tipo</option>
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="mixto">Mixto</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="units" className="block text-sm font-medium mb-2">Número de Unidades *</label>
                  <input type="number" id="units" name="units" required min="1" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="24" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium mb-2">Dirección *</label>
                  <input type="text" id="address" name="address" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="Av. Principal, Edificio Torre, Ciudad" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Datos del Administrador</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adminName" className="block text-sm font-medium mb-2">Nombre y Apellido *</label>
                  <input type="text" id="adminName" name="adminName" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="Juan Pérez" />
                </div>
                <div>
                  <label htmlFor="adminDocType" className="block text-sm font-medium mb-2">Tipo de Documento *</label>
                  <select id="adminDocType" name="adminDocType" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none">
                    <option value="v">Venezolano (V)</option>
                    <option value="e">Extranjero (E)</option>
                    <option value="j">Jurídico (J)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="adminDocNumber" className="block text-sm font-medium mb-2">Número de Documento *</label>
                  <input type="text" id="adminDocNumber" name="adminDocNumber" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="12345678" />
                </div>
                <div>
                  <label htmlFor="adminPhone" className="block text-sm font-medium mb-2">Teléfono *</label>
                  <input type="tel" id="adminPhone" name="adminPhone" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="0412-1234567" />
                </div>
                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium mb-2">Email *</label>
                  <input type="email" id="adminEmail" name="adminEmail" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="juan@edificio.com" />
                </div>
                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-medium mb-2">Crear Contraseña *</label>
                  <input type="password" id="adminPassword" name="adminPassword" required minLength={6} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="Mínimo 6 caracteres" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Datos de la Junta Directa</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="presidentName" className="block text-sm font-medium mb-2">Presidente de Junta</label>
                  <input type="text" id="presidentName" name="presidentName" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="María Gómez" />
                </div>
                <div>
                  <label htmlFor="presidentDoc" className="block text-sm font-medium mb-2">Cédula</label>
                  <input type="text" id="presidentDoc" name="presidentDoc" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="V-98765432" />
                </div>
                <div>
                  <label htmlFor="treasurerName" className="block text-sm font-medium mb-2">Tesorero</label>
                  <input type="text" id="treasurerName" name="treasurerName" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="Carlos Mendoza" />
                </div>
                <div>
                  <label htmlFor="treasurerDoc" className="block text-sm font-medium mb-2">Cédula</label>
                  <input type="text" id="treasurerDoc" name="treasurerDoc" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="V-87654321" />
                </div>
                <div>
                  <label htmlFor="secretaryName" className="block text-sm font-medium mb-2">Secretario</label>
                  <input type="text" id="secretaryName" name="secretaryName" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="Ana López" />
                </div>
                <div>
                  <label htmlFor="secretaryDoc" className="block text-sm font-medium mb-2">Cédula</label>
                  <input type="text" id="secretaryDoc" name="secretaryDoc" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" placeholder="V-76543210" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="terms" name="terms" required className="w-5 h-5 bg-neutral-900 border-neutral-700 rounded focus:ring-emerald-500" />
              <label htmlFor="terms" className="text-neutral-400 text-sm">
                Acepto los términos y condiciones y la política de privacidad
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Registrando..." : "Registrar Edificio"}
            </button>

            <p className="text-center text-neutral-500 text-sm">
              ¿Ya tienes un edificio registrado? <Link href="/login" className="text-emerald-400 hover:underline">Ingresa aquí</Link>
            </p>
          </form>
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