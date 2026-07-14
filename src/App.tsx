import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { LoginPage } from "./features/autenticacao/components/LoginPage";
import { OnboardingPage } from "./features/autenticacao/components/OnboardingPage";
import { EstruturasPage } from "./features/estruturas/components/EstruturasPage";
import { FuncionariosPage } from "./features/funcionarios/components/FuncionariosPage";
import { ProdutosPage } from "./features/inventario/components/ProdutosPage";
import { PlantasPage } from "./features/plantas/components/PlantasPage";
import { AppLayout } from "./components/AppLayout";
import { useAuthStore } from "./stores/authStore";

/**
 * Guarda de rota: exige sessão ativa e perfil vinculado a uma empresa.
 * - Sem sessão → tela de login.
 * - Com sessão mas sem perfil → onboarding (registrar a empresa).
 */
function RequireAuth() {
  const { session, perfil, initializing } = useAuthStore();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-400">
        Carregando…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!perfil) return <OnboardingPage />;
  return <Outlet />;
}

function App() {
  const init = useAuthStore((s) => s.init);

  // Restaura a sessão persistida uma única vez na inicialização do app.
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/inventario" replace />} />
          <Route path="/inventario" element={<ProdutosPage />} />
          <Route path="/funcionarios" element={<FuncionariosPage />} />
          <Route path="/estruturas" element={<EstruturasPage />} />
          <Route path="/plantas" element={<PlantasPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
