"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Email o contraseña incorrectos");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

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
            <Link href="/" className="text-neutral-400 hover:text-white transition-colors">Inicio</Link>
          </div>
        </nav>
      </header>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Ingresar al Sistema</h1>
              <p className="text-neutral-400">GestiónCondo</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required 
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" 
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">Contraseña *</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  required 
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-emerald-500 focus:outline-none" 
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Ingresando..." : "Iniciar Sesión"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-neutral-500 text-sm">
                ¿No tienes edificio registrado? <Link href="/register" className="text-emerald-400 hover:underline">Registrar Edificio</Link>
              </p>
            </div>
          </div>

            <div className="mt-8 bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 text-center space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Acceso Rápido</h3>
              <button 
                type="button"
                onClick={() => {
                  const emailInput = document.getElementById("email") as HTMLInputElement;
                  const passInput = document.getElementById("password") as HTMLInputElement;
                  if (emailInput && passInput) {
                    emailInput.value = "correojago@gmail.com";
                    passInput.value = "Aitana1999";
                  }
                }}
                className="w-full py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm"
              >
                Ingresar como JAGO →
              </button>
            </div>

            <div className="pt-4 border-t border-neutral-700/50">
              <h3 className="font-semibold mb-2 text-sm text-neutral-400">¿Quieres ver una demostración?</h3>
              <button 
                type="button"
                onClick={() => {
                  const emailInput = document.getElementById("email") as HTMLInputElement;
                  const passInput = document.getElementById("password") as HTMLInputElement;
                  if (emailInput && passInput) {
                    emailInput.value = "demo@gestioncondo.com";
                    passInput.value = "demo123";
                  }
                }}
                className="text-emerald-400 hover:underline text-xs"
              >
                Usar datos de demo →
              </button>
            </div>
          </div>
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