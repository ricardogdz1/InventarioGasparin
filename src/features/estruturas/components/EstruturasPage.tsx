import { useState } from "react";
import { Building2, DoorOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../../components/Modal";
import { useAuthStore } from "../../../stores/authStore";
import {
  useSalaMutations,
  useSalas,
  useUnidadeMutations,
  useUnidades,
} from "../hooks/useEstruturas";
import type { Sala, Unidade } from "../types";

/**
 * Cadastro de estruturas físicas (Fase 1): Unidades → Salas/Armazéns.
 * Layout mestre-detalhe: unidades à esquerda, salas da unidade selecionada
 * à direita. Botões de escrita só aparecem para administradores — o RLS do
 * banco garante a regra de verdade; a interface apenas a reflete.
 */
export function EstruturasPage() {
  const perfil = useAuthStore((s) => s.perfil);
  const isAdmin = perfil?.acesso === "administrador";

  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [unidadeModal, setUnidadeModal] = useState<{ open: boolean; editing: Unidade | null }>({
    open: false,
    editing: null,
  });
  const [salaModal, setSalaModal] = useState<{ open: boolean; editing: Sala | null }>({
    open: false,
    editing: null,
  });

  const unidades = useUnidades();
  const salas = useSalas(selectedUnidade?.id ?? null);
  const unidadeMut = useUnidadeMutations();
  const salaMut = useSalaMutations(selectedUnidade?.id ?? null);

  async function handleDeleteUnidade(unidade: Unidade) {
    const ok = window.confirm(
      `Excluir a unidade "${unidade.nome}"? Todas as salas dela também serão excluídas.`,
    );
    if (!ok) return;
    await unidadeMut.remove.mutateAsync(unidade.id);
    if (selectedUnidade?.id === unidade.id) setSelectedUnidade(null);
  }

  async function handleDeleteSala(sala: Sala) {
    if (!window.confirm(`Excluir a sala "${sala.nome}"?`)) return;
    await salaMut.remove.mutateAsync(sala.id);
  }

  return (
    <div className="grid h-full grid-cols-[minmax(280px,1fr)_2fr]">
      {/* Coluna de unidades */}
      <section className="border-r border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">Unidades</h1>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setUnidadeModal({ open: true, editing: null })}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={15} /> Nova
            </button>
          )}
        </div>

        {unidades.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
        {unidades.error && (
          <p className="text-sm text-red-600">Erro ao carregar unidades. Tente novamente.</p>
        )}
        {unidades.data?.length === 0 && (
          <p className="text-sm text-slate-400">
            Nenhuma unidade cadastrada. {isAdmin ? 'Clique em "Nova" para criar a primeira.' : ""}
          </p>
        )}

        <ul className="space-y-1">
          {unidades.data?.map((unidade) => (
            <li key={unidade.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedUnidade(unidade)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedUnidade(unidade)}
                className={`group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                  selectedUnidade?.id === unidade.id
                    ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Building2 size={17} className="shrink-0 text-slate-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{unidade.nome}</span>
                    {unidade.endereco && (
                      <span className="block truncate text-xs text-slate-400">
                        {unidade.endereco}
                      </span>
                    )}
                  </span>
                </span>
                {isAdmin && (
                  <span className="hidden shrink-0 items-center gap-1 group-hover:flex">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnidadeModal({ open: true, editing: unidade });
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      aria-label={`Editar ${unidade.nome}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUnidade(unidade);
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
                      aria-label={`Excluir ${unidade.nome}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Coluna de salas */}
      <section className="p-6">
        {!selectedUnidade ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Selecione uma unidade para ver as salas.
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Salas — {selectedUnidade.nome}
                </h2>
                <p className="text-sm text-slate-400">Salas e armazéns desta unidade</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setSalaModal({ open: true, editing: null })}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={15} /> Nova sala
                </button>
              )}
            </div>

            {salas.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
            {salas.data?.length === 0 && (
              <p className="text-sm text-slate-400">Nenhuma sala cadastrada nesta unidade.</p>
            )}

            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {salas.data?.map((sala) => (
                <li
                  key={sala.id}
                  className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex items-center gap-2.5">
                      <DoorOpen size={18} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-800">{sala.nome}</span>
                    </span>
                    {isAdmin && (
                      <span className="hidden items-center gap-1 group-hover:flex">
                        <button
                          type="button"
                          onClick={() => setSalaModal({ open: true, editing: sala })}
                          className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                          aria-label={`Editar ${sala.nome}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSala(sala)}
                          className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
                          aria-label={`Excluir ${sala.nome}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                  {sala.descricao && (
                    <p className="mt-2 text-xs text-slate-500">{sala.descricao}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Modais de cadastro/edição */}
      <UnidadeFormModal
        state={unidadeModal}
        onClose={() => setUnidadeModal({ open: false, editing: null })}
        onSave={async (values) => {
          if (unidadeModal.editing) {
            await unidadeMut.update.mutateAsync({ id: unidadeModal.editing.id, ...values });
          } else {
            await unidadeMut.create.mutateAsync(values);
          }
          setUnidadeModal({ open: false, editing: null });
        }}
      />
      <SalaFormModal
        state={salaModal}
        onClose={() => setSalaModal({ open: false, editing: null })}
        onSave={async (values) => {
          if (salaModal.editing) {
            await salaMut.update.mutateAsync({ id: salaModal.editing.id, ...values });
          } else if (selectedUnidade) {
            await salaMut.create.mutateAsync({ unidade_id: selectedUnidade.id, ...values });
          }
          setSalaModal({ open: false, editing: null });
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulários
// ---------------------------------------------------------------------------

interface UnidadeFormModalProps {
  state: { open: boolean; editing: Unidade | null };
  onClose: () => void;
  onSave: (values: { nome: string; endereco: string | null }) => Promise<void>;
}

function UnidadeFormModal({ state, onClose, onSave }: UnidadeFormModalProps) {
  return (
    <Modal
      title={state.editing ? "Editar unidade" : "Nova unidade"}
      open={state.open}
      onClose={onClose}
    >
      <EntityForm
        key={state.editing?.id ?? "nova"}
        fields={[
          { name: "nome", label: "Nome", required: true, initial: state.editing?.nome ?? "" },
          {
            name: "endereco",
            label: "Endereço (opcional)",
            required: false,
            initial: state.editing?.endereco ?? "",
          },
        ]}
        onSubmit={(v) => onSave({ nome: v.nome, endereco: v.endereco || null })}
      />
    </Modal>
  );
}

interface SalaFormModalProps {
  state: { open: boolean; editing: Sala | null };
  onClose: () => void;
  onSave: (values: { nome: string; descricao: string | null }) => Promise<void>;
}

function SalaFormModal({ state, onClose, onSave }: SalaFormModalProps) {
  return (
    <Modal title={state.editing ? "Editar sala" : "Nova sala"} open={state.open} onClose={onClose}>
      <EntityForm
        key={state.editing?.id ?? "nova"}
        fields={[
          { name: "nome", label: "Nome", required: true, initial: state.editing?.nome ?? "" },
          {
            name: "descricao",
            label: "Descrição (opcional)",
            required: false,
            initial: state.editing?.descricao ?? "",
          },
        ]}
        onSubmit={(v) => onSave({ nome: v.nome, descricao: v.descricao || null })}
      />
    </Modal>
  );
}

interface EntityFormField {
  name: string;
  label: string;
  required: boolean;
  initial: string;
}

/** Formulário genérico de campos de texto usado pelos modais de cadastro. */
function EntityForm({
  fields,
  onSubmit,
}: {
  fields: EntityFormField[];
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, f.initial])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor={field.name}>
            {field.label}
          </label>
          <input
            id={field.name}
            required={field.required}
            value={values[field.name]}
            onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      ))}

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
