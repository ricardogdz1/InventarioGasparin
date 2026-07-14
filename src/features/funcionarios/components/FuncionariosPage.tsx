import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { PhotoUpload } from "../../../components/PhotoUpload";
import { FotoThumb } from "../../../components/FotoThumb";
import { useAuthStore } from "../../../stores/authStore";
import { useFuncionarioMutations, useFuncionarios } from "../hooks/useFuncionarios";
import type { Funcionario } from "../types";

/**
 * Cadastro de funcionários (Fase 2). Escrita restrita ao administrador
 * (regra aplicada no RLS; a interface apenas esconde os botões).
 */
export function FuncionariosPage() {
  const perfil = useAuthStore((s) => s.perfil);
  const isAdmin = perfil?.acesso === "administrador";

  const funcionarios = useFuncionarios();
  const mutations = useFuncionarioMutations();
  const [modal, setModal] = useState<{ open: boolean; editing: Funcionario | null }>({
    open: false,
    editing: null,
  });

  async function handleDelete(funcionario: Funcionario) {
    const ok = window.confirm(
      `Excluir o funcionário "${funcionario.nome}"? Itens vinculados a ele ficarão sem vínculo.`,
    );
    if (!ok) return;
    await mutations.remove.mutateAsync(funcionario.id);
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Funcionários</h1>
          <p className="text-sm text-slate-400">Pessoas que podem receber itens designados</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setModal({ open: true, editing: null })}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={15} /> Novo funcionário
          </button>
        )}
      </div>

      {funcionarios.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
      {funcionarios.data?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
          <Users size={32} />
          <p className="text-sm">Nenhum funcionário cadastrado.</p>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {funcionarios.data?.map((funcionario) => (
          <li
            key={funcionario.id}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <FotoThumb
              path={funcionario.foto_path}
              alt={funcionario.nome}
              className="h-12 w-12 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{funcionario.nome}</p>
              <p className="truncate text-xs text-slate-400">
                {[funcionario.cargo, funcionario.setor].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            {isAdmin && (
              <span className="hidden items-center gap-1 group-hover:flex">
                <button
                  type="button"
                  onClick={() => setModal({ open: true, editing: funcionario })}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  aria-label={`Editar ${funcionario.nome}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(funcionario)}
                  className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
                  aria-label={`Excluir ${funcionario.nome}`}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>

      <FuncionarioFormModal
        state={modal}
        onClose={() => setModal({ open: false, editing: null })}
        onSave={async (values) => {
          if (modal.editing) {
            await mutations.update.mutateAsync({ id: modal.editing.id, ...values });
          } else {
            await mutations.create.mutateAsync(values);
          }
          setModal({ open: false, editing: null });
        }}
      />
    </div>
  );
}

interface FuncionarioFormModalProps {
  state: { open: boolean; editing: Funcionario | null };
  onClose: () => void;
  onSave: (values: {
    nome: string;
    cargo: string | null;
    setor: string | null;
    foto_path: string | null;
  }) => Promise<void>;
}

function FuncionarioFormModal({ state, onClose, onSave }: FuncionarioFormModalProps) {
  return (
    <Modal
      title={state.editing ? "Editar funcionário" : "Novo funcionário"}
      open={state.open}
      onClose={onClose}
    >
      <FuncionarioForm key={state.editing?.id ?? "novo"} editing={state.editing} onSave={onSave} />
    </Modal>
  );
}

function FuncionarioForm({
  editing,
  onSave,
}: {
  editing: Funcionario | null;
  onSave: FuncionarioFormModalProps["onSave"];
}) {
  const [nome, setNome] = useState(editing?.nome ?? "");
  const [cargo, setCargo] = useState(editing?.cargo ?? "");
  const [setor, setSetor] = useState(editing?.setor ?? "");
  const [fotoPath, setFotoPath] = useState<string | null>(editing?.foto_path ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave({
        nome: nome.trim(),
        cargo: cargo.trim() || null,
        setor: setor.trim() || null,
        foto_path: fotoPath,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="nome">
          Nome
        </label>
        <input
          id="nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="cargo">
            Cargo
          </label>
          <input
            id="cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="setor">
            Setor
          </label>
          <input
            id="setor"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <PhotoUpload pasta="funcionarios" value={fotoPath} onChange={setFotoPath} />

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {busy ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
