import { useState } from "react";
import { Modal } from "../../../components/Modal";
import { PhotoUpload } from "../../../components/PhotoUpload";
import { useAllSalas } from "../../estruturas/hooks/useEstruturas";
import { useFuncionarios } from "../../funcionarios/hooks/useFuncionarios";
import type { ProdutoInput } from "../services/produtosService";
import { ESTADOS, type EstadoConservacao, type ProdutoDetalhado } from "../types";

type TipoVinculo = "nenhum" | "funcionario" | "sala";

interface ProdutoFormModalProps {
  state: { open: boolean; editing: ProdutoDetalhado | null };
  onClose: () => void;
  onSave: (values: ProdutoInput) => Promise<void>;
}

/** Formulário de cadastro/edição de item do inventário. */
export function ProdutoFormModal({ state, onClose, onSave }: ProdutoFormModalProps) {
  return (
    <Modal title={state.editing ? "Editar item" : "Novo item"} open={state.open} onClose={onClose}>
      <ProdutoForm key={state.editing?.id ?? "novo"} editing={state.editing} onSave={onSave} />
    </Modal>
  );
}

function ProdutoForm({
  editing,
  onSave,
}: {
  editing: ProdutoDetalhado | null;
  onSave: (values: ProdutoInput) => Promise<void>;
}) {
  const funcionarios = useFuncionarios();
  const salas = useAllSalas();

  const [nome, setNome] = useState(editing?.nome ?? "");
  const [codigo, setCodigo] = useState(editing?.codigo ?? "");
  const [categoria, setCategoria] = useState(editing?.categoria ?? "");
  const [numeroSerie, setNumeroSerie] = useState(editing?.numero_serie ?? "");
  const [dataAquisicao, setDataAquisicao] = useState(editing?.data_aquisicao ?? "");
  const [valor, setValor] = useState(editing?.valor?.toString() ?? "");
  const [estado, setEstado] = useState<EstadoConservacao>(editing?.estado ?? "bom");
  const [quantidade, setQuantidade] = useState(editing?.quantidade?.toString() ?? "1");
  const [fotoPath, setFotoPath] = useState<string | null>(editing?.foto_path ?? null);
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculo>(
    editing?.funcionario_id ? "funcionario" : editing?.sala_id ? "sala" : "nenhum",
  );
  const [funcionarioId, setFuncionarioId] = useState(editing?.funcionario_id ?? "");
  const [salaId, setSalaId] = useState(editing?.sala_id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave({
        nome: nome.trim(),
        codigo: codigo.trim() || null,
        categoria: categoria.trim() || null,
        numero_serie: numeroSerie.trim() || null,
        data_aquisicao: dataAquisicao || null,
        valor: valor ? Number(valor) : null,
        estado,
        quantidade: Math.max(0, Number(quantidade) || 0),
        foto_path: fotoPath,
        funcionario_id: tipoVinculo === "funcionario" ? funcionarioId || null : null,
        sala_id: tipoVinculo === "sala" ? salaId || null : null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message.includes("idx_produtos_codigo_unico")
          ? "Já existe um item com este código/patrimônio."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      <div>
        <label className={labelClass} htmlFor="nome">
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
          <label className={labelClass} htmlFor="codigo">
            Código / patrimônio
          </label>
          <input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="categoria">
            Categoria
          </label>
          <input
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={inputClass}
            placeholder="Ex.: Informática"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="numeroSerie">
            Nº de série
          </label>
          <input
            id="numeroSerie"
            value={numeroSerie}
            onChange={(e) => setNumeroSerie(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="dataAquisicao">
            Data de aquisição
          </label>
          <input
            id="dataAquisicao"
            type="date"
            value={dataAquisicao}
            onChange={(e) => setDataAquisicao(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="valor">
            Valor (R$)
          </label>
          <input
            id="valor"
            type="number"
            min="0"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="quantidade">
            Quantidade
          </label>
          <input
            id="quantidade"
            type="number"
            min="0"
            required
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="col-span-2">
          <label className={labelClass} htmlFor="estado">
            Estado de conservação
          </label>
          <select
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoConservacao)}
            className={inputClass}
          >
            {ESTADOS.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PhotoUpload pasta="produtos" value={fotoPath} onChange={setFotoPath} />

      {/* Vínculo: com um funcionário OU numa sala (regra vinculo_unico do banco) */}
      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-sm font-medium text-slate-700">Vínculo do item</legend>
        <div className="mb-2 flex gap-4 text-sm text-slate-600">
          {(
            [
              ["nenhum", "Sem vínculo"],
              ["funcionario", "Com funcionário"],
              ["sala", "Em uma sala"],
            ] as [TipoVinculo, string][]
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="tipoVinculo"
                checked={tipoVinculo === value}
                onChange={() => setTipoVinculo(value)}
                className="accent-blue-600"
              />
              {label}
            </label>
          ))}
        </div>
        {tipoVinculo === "funcionario" && (
          <select
            required
            value={funcionarioId}
            onChange={(e) => setFuncionarioId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione o funcionário…</option>
            {funcionarios.data?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        )}
        {tipoVinculo === "sala" && (
          <select
            required
            value={salaId}
            onChange={(e) => setSalaId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione a sala…</option>
            {salas.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.unidade ? `${s.unidade.nome} · ${s.nome}` : s.nome}
              </option>
            ))}
          </select>
        )}
      </fieldset>

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
