import { useState } from "react";
import { Building2, LogOut } from "lucide-react";
import { registerEmpresa, signOut } from "../services/authService";
import { useAuthStore } from "../../../stores/authStore";

/**
 * Primeiro acesso: o usuário logado ainda não pertence a nenhuma empresa.
 * Aqui ele registra a empresa e se torna o administrador dela
 * (RPC `registrar_empresa` no banco).
 */
export function OnboardingPage() {
  const refreshPerfil = useAuthStore((s) => s.refreshPerfil);
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await registerEmpresa(nomeEmpresa.trim(), nomeUsuario.trim());
      await refreshPerfil();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 size={26} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Cadastre sua empresa</h1>
          <p className="text-sm text-slate-500">
            Você será o administrador e poderá convidar outros usuários depois.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="empresa">
              Nome da empresa
            </label>
            <input
              id="empresa"
              required
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Ex.: Gasparin Ltda."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="nome">
              Seu nome
            </label>
            <input
              id="nome"
              required
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Ex.: Ricardo"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Registrando…" : "Registrar empresa"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => signOut()}
          className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    </div>
  );
}
