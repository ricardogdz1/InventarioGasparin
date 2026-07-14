import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Package, Pencil, Plus, Search, Trash2, User, DoorOpen } from "lucide-react";
import { FotoThumb } from "../../../components/FotoThumb";
import { useAuthStore } from "../../../stores/authStore";
import { useAllSalas } from "../../estruturas/hooks/useEstruturas";
import { useFuncionarios } from "../../funcionarios/hooks/useFuncionarios";
import { useCategorias, useProdutoMutations, useProdutos } from "../hooks/useProdutos";
import {
  ESTADOS,
  type EstadoConservacao,
  type FiltrosProduto,
  type ProdutoDetalhado,
} from "../types";
import { ProdutoFormModal } from "./ProdutoFormModal";

const ALTURA_LINHA = 56;

/** Cores dos selos de estado de conservação. */
const COR_ESTADO: Record<EstadoConservacao, string> = {
  novo: "bg-emerald-50 text-emerald-700",
  otimo: "bg-teal-50 text-teal-700",
  bom: "bg-blue-50 text-blue-700",
  regular: "bg-amber-50 text-amber-700",
  ruim: "bg-red-50 text-red-700",
};

/**
 * Inventário (Fase 2): busca com resultados instantâneos, filtros e CRUD.
 * A lista usa virtualização (só as linhas visíveis são renderizadas) —
 * requisito de performance para máquinas modestas.
 */
export function ProdutosPage() {
  const perfil = useAuthStore((s) => s.perfil);
  const canWrite = perfil?.acesso === "administrador" || perfil?.acesso === "gestor";

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [funcionarioId, setFuncionarioId] = useState<string | null>(null);
  const [salaId, setSalaId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoConservacao | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing: ProdutoDetalhado | null }>({
    open: false,
    editing: null,
  });

  // Espera 300 ms de pausa na digitação antes de consultar o servidor.
  const buscaAtrasada = useDebouncedValue(busca, 300);
  const filtros: FiltrosProduto = useMemo(
    () => ({ busca: buscaAtrasada, categoria, funcionarioId, salaId, estado }),
    [buscaAtrasada, categoria, funcionarioId, salaId, estado],
  );

  const produtos = useProdutos(filtros);
  const categorias = useCategorias();
  const funcionarios = useFuncionarios();
  const salas = useAllSalas();
  const mutations = useProdutoMutations();

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: produtos.data?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ALTURA_LINHA,
    overscan: 10,
  });

  async function handleDelete(produto: ProdutoDetalhado) {
    if (!window.confirm(`Excluir o item "${produto.nome}"?`)) return;
    await mutations.remove.mutateAsync(produto.id);
  }

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-600 focus:border-blue-500 focus:outline-none";

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Inventário</h1>
          <p className="text-sm text-slate-400">
            {produtos.data ? `${produtos.data.length} item(ns)` : "Carregando…"}
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setModal({ open: true, editing: null })}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={15} /> Novo item
          </button>
        )}
      </div>

      {/* Busca e filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, código, nº de série ou categoria…"
            className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={categoria ?? ""}
          onChange={(e) => setCategoria(e.target.value || null)}
          className={selectClass}
        >
          <option value="">Categoria: todas</option>
          {categorias.data?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={funcionarioId ?? ""}
          onChange={(e) => setFuncionarioId(e.target.value || null)}
          className={selectClass}
        >
          <option value="">Funcionário: todos</option>
          {funcionarios.data?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <select
          value={salaId ?? ""}
          onChange={(e) => setSalaId(e.target.value || null)}
          className={selectClass}
        >
          <option value="">Sala: todas</option>
          {salas.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.unidade ? `${s.unidade.nome} · ${s.nome}` : s.nome}
            </option>
          ))}
        </select>
        <select
          value={estado ?? ""}
          onChange={(e) => setEstado((e.target.value || null) as EstadoConservacao | null)}
          className={selectClass}
        >
          <option value="">Estado: todos</option>
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      {/* Cabeçalho da tabela */}
      <div className="grid grid-cols-[3rem_2fr_1fr_1fr_4rem_6rem_2fr_5rem] items-center gap-3 border-b border-slate-200 px-3 pb-2 text-xs font-medium tracking-wide text-slate-400 uppercase">
        <span>Foto</span>
        <span>Nome</span>
        <span>Código</span>
        <span>Categoria</span>
        <span>Qtd.</span>
        <span>Estado</span>
        <span>Vínculo</span>
        <span></span>
      </div>

      {/* Lista virtualizada */}
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        {produtos.data?.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <Package size={32} />
            <p className="text-sm">
              {busca || categoria || funcionarioId || salaId || estado
                ? "Nenhum item encontrado com esses filtros."
                : "Nenhum item cadastrado ainda."}
            </p>
          </div>
        )}
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((row) => {
            const produto = produtos.data![row.index];
            return (
              <div
                key={produto.id}
                className="group absolute top-0 left-0 grid w-full grid-cols-[3rem_2fr_1fr_1fr_4rem_6rem_2fr_5rem] items-center gap-3 border-b border-slate-100 bg-white px-3 hover:bg-slate-50"
                style={{ height: ALTURA_LINHA, transform: `translateY(${row.start}px)` }}
              >
                <FotoThumb path={produto.foto_path} alt={produto.nome} />
                <span className="truncate text-sm font-medium text-slate-800">{produto.nome}</span>
                <span className="truncate text-sm text-slate-500">{produto.codigo ?? "—"}</span>
                <span className="truncate text-sm text-slate-500">{produto.categoria ?? "—"}</span>
                <span className="text-sm text-slate-500">{produto.quantidade}</span>
                <span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${COR_ESTADO[produto.estado]}`}
                  >
                    {ESTADOS.find((e) => e.value === produto.estado)?.label}
                  </span>
                </span>
                <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
                  {produto.funcionario ? (
                    <>
                      <User size={14} className="shrink-0 text-slate-400" />
                      <span className="truncate">{produto.funcionario.nome}</span>
                    </>
                  ) : produto.sala ? (
                    <>
                      <DoorOpen size={14} className="shrink-0 text-slate-400" />
                      <span className="truncate">
                        {produto.sala.unidade
                          ? `${produto.sala.unidade.nome} · ${produto.sala.nome}`
                          : produto.sala.nome}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </span>
                <span className="hidden items-center justify-end gap-1 group-hover:flex">
                  {canWrite && (
                    <>
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, editing: produto })}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        aria-label={`Editar ${produto.nome}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(produto)}
                        className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600"
                        aria-label={`Excluir ${produto.nome}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ProdutoFormModal
        state={modal}
        onClose={() => setModal({ open: false, editing: null })}
        onSave={async (values) => {
          if (modal.editing) {
            await mutations.update.mutateAsync({ id: modal.editing.id, patch: values });
          } else {
            await mutations.create.mutateAsync(values);
          }
          setModal({ open: false, editing: null });
        }}
      />
    </div>
  );
}

/** Devolve o valor somente após uma pausa na digitação (busca instantânea sem sobrecarregar o banco). */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastValue = useRef(value);

  if (lastValue.current !== value) {
    lastValue.current = value;
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setDebounced(value), delayMs);
  }

  return debounced;
}
