import { NavLink, Outlet } from "react-router-dom";
import { Building2, LogOut, Map, Package, Users } from "lucide-react";
import { signOut } from "../features/autenticacao/services/authService";
import { useAuthStore } from "../stores/authStore";
import { GlobalSearch } from "./GlobalSearch";
import { SyncIndicator } from "./SyncIndicator";

/** Rótulos dos níveis de acesso exibidos na interface. */
const ROTULO_ACESSO: Record<string, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  consulta: "Consulta",
};

/**
 * Layout principal: barra lateral de navegação + área de conteúdo.
 * Itens ainda não implementados (fases futuras) aparecem desabilitados.
 */
export function AppLayout() {
  const perfil = useAuthStore((s) => s.perfil);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white p-4">
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Package size={20} />
          </div>
          <span className="font-semibold text-slate-800">Inventário</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/inventario" className={linkClass}>
            <Package size={17} /> Inventário
          </NavLink>
          <NavLink to="/funcionarios" className={linkClass}>
            <Users size={17} /> Funcionários
          </NavLink>
          <NavLink to="/estruturas" className={linkClass}>
            <Building2 size={17} /> Estruturas
          </NavLink>
          <NavLink to="/plantas" className={linkClass}>
            <Map size={17} /> Plantas 2D
          </NavLink>
        </nav>

        <div className="border-t border-slate-200 pt-3">
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium text-slate-700">{perfil?.nome}</p>
            <p className="text-xs text-slate-400">{perfil ? ROTULO_ACESSO[perfil.acesso] : ""}</p>
          </div>
          <div className="mb-3 px-1">
            <SyncIndicator />
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior com a busca global sempre visível */}
        <header className="flex h-14 shrink-0 items-center justify-center border-b border-slate-200 bg-white px-6">
          <GlobalSearch />
        </header>
        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
