import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, LogIn, UserPlus } from "lucide-react";
import { signIn, signUp } from "../services/authService";

type Mode = "entrar" | "cadastrar";

// Chaves do armazenamento local para lembrar as credenciais entre aberturas.
// Atenção: a senha fica em texto simples no dispositivo — conveniência
// solicitada para o app desktop; o risco se limita a quem usa a máquina.
const STORAGE_EMAIL = "login.emailSalvo";
const STORAGE_SENHA = "login.senhaSalva";

/**
 * Tela de login e criação de conta.
 * Após criar a conta (ou entrar pela primeira vez sem perfil), o fluxo segue
 * para o registro da empresa em OnboardingPage.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("entrar");
  // Pré-preenche com o que foi salvo na última entrada (se o usuário marcou salvar).
  const [email, setEmail] = useState(() => localStorage.getItem(STORAGE_EMAIL) ?? "");
  const [password, setPassword] = useState(() => localStorage.getItem(STORAGE_SENHA) ?? "");
  const [saveEmail, setSaveEmail] = useState(() => localStorage.getItem(STORAGE_EMAIL) !== null);
  const [savePassword, setSavePassword] = useState(
    () => localStorage.getItem(STORAGE_SENHA) !== null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  /** Grava ou limpa as credenciais conforme as marcações, após um login bem-sucedido. */
  function persistCredentials() {
    if (saveEmail) localStorage.setItem(STORAGE_EMAIL, email);
    else localStorage.removeItem(STORAGE_EMAIL);
    if (savePassword) localStorage.setItem(STORAGE_SENHA, password);
    else localStorage.removeItem(STORAGE_SENHA);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "entrar") {
        await signIn(email, password);
        persistCredentials();
        navigate("/", { replace: true });
      } else {
        const { session } = await signUp(email, password);
        if (session) {
          persistCredentials();
          navigate("/", { replace: true });
        } else {
          // Confirmação de e-mail ativa no Supabase: sessão só após confirmar.
          setInfo("Conta criada! Verifique seu e-mail para confirmar o cadastro e depois entre.");
          setMode("entrar");
        }
      }
    } catch (err) {
      setError(traduzirErro(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Package size={26} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Inventário Gasparin</h1>
          <p className="text-sm text-slate-500">Controle de inventário com localização visual</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode("entrar")}
            className={`rounded-md py-2 transition ${
              mode === "entrar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("cadastrar")}
            className={`rounded-md py-2 transition ${
              mode === "cadastrar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                E-mail
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={saveEmail}
                  onChange={(e) => {
                    setSaveEmail(e.target.checked);
                    // Desmarcar limpa imediatamente o valor salvo no dispositivo.
                    if (!e.target.checked) localStorage.removeItem(STORAGE_EMAIL);
                  }}
                  className="accent-blue-600"
                />
                Salvar e-mail
              </label>
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="voce@empresa.com.br"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                Senha
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={savePassword}
                  onChange={(e) => {
                    setSavePassword(e.target.checked);
                    if (!e.target.checked) localStorage.removeItem(STORAGE_SENHA);
                  }}
                  className="accent-blue-600"
                />
                Salvar senha
              </label>
            </div>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Mínimo de 6 caracteres"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {info && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {mode === "entrar" ? <LogIn size={16} /> : <UserPlus size={16} />}
            {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Converte os erros mais comuns do Supabase Auth para mensagens em português. */
function traduzirErro(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("already registered")) return "Este e-mail já possui uma conta.";
  if (message.includes("Email not confirmed"))
    return "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
  return message;
}
