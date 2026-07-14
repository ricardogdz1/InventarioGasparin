import { X, User, DoorOpen } from "lucide-react";
import { FotoThumb } from "../../../components/FotoThumb";
import { ESTADOS, type ProdutoDetalhado } from "../../inventario/types";

interface PainelItemProps {
  produto: ProdutoDetalhado | null;
  onClose: () => void;
}

/** Formata data "aaaa-mm-dd" como dd/mm/aaaa sem sofrer com fuso horário. */
function formatarData(data: string | null): string {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

const REAL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Painel lateral com a ficha completa do item (abre ao clicar num item do cartão). */
export function PainelItem({ produto, onClose }: PainelItemProps) {
  if (!produto) return null;

  const linhas: [string, string][] = [
    ["Código / patrimônio", produto.codigo ?? "—"],
    ["Categoria", produto.categoria ?? "—"],
    ["Nº de série", produto.numero_serie ?? "—"],
    ["Data de aquisição", formatarData(produto.data_aquisicao)],
    ["Valor", produto.valor != null ? REAL.format(produto.valor) : "—"],
    ["Estado", ESTADOS.find((e) => e.value === produto.estado)?.label ?? produto.estado],
    ["Quantidade", String(produto.quantidade)],
  ];

  return (
    <aside className="absolute top-0 right-0 z-20 flex h-full w-80 flex-col border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Ficha do item</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fechar painel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex justify-center">
          <FotoThumb path={produto.foto_path} alt={produto.nome} className="h-36 w-36 rounded-xl" />
        </div>
        <h3 className="mb-4 text-center text-base font-semibold text-slate-800">{produto.nome}</h3>

        <dl className="space-y-2.5">
          {linhas.map(([rotulo, valor]) => (
            <div key={rotulo} className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-xs text-slate-400">{rotulo}</dt>
              <dd className="text-right text-sm text-slate-700">{valor}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <p className="mb-1 text-xs font-medium text-slate-400 uppercase">Localização</p>
          {produto.funcionario ? (
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <User size={14} className="text-slate-400" /> Com {produto.funcionario.nome}
            </p>
          ) : produto.sala ? (
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <DoorOpen size={14} className="text-slate-400" />
              {produto.sala.unidade
                ? `${produto.sala.unidade.nome} · ${produto.sala.nome}`
                : produto.sala.nome}
            </p>
          ) : (
            <p className="text-sm text-slate-400">Sem vínculo de localização</p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-300">
          Histórico de movimentações chega na Fase 5.
        </p>
      </div>
    </aside>
  );
}
