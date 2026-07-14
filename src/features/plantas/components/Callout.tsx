import { useLayoutEffect, useRef, useState } from "react";
import { Package, X } from "lucide-react";
import { FotoThumb } from "../../../components/FotoThumb";
import type { Funcionario } from "../../funcionarios/types";
import type { ProdutoDetalhado } from "../../inventario/types";
import type { ElementoPlanta } from "../types";

const LARGURA_CARTAO = 260;

const NOME_TIPO: Record<string, string> = {
  mesa: "Mesa",
  cadeira: "Cadeira",
  estante: "Estante",
  prateleira: "Prateleira",
  porta: "Porta",
  computador: "Computador",
  impressora: "Impressora",
  caixa: "Caixa",
  area: "Área",
};

interface CalloutProps {
  elemento: ElementoPlanta;
  /** Posição do ponto ancorado, em coordenadas de tela do contêiner. */
  ancora: { x: number; y: number };
  /** Índice do cartão aberto (usado para escalonar e evitar sobreposição). */
  indice: number;
  container: { width: number; height: number };
  destaque: boolean;
  funcionario: Funcionario | null;
  itens: ProdutoDetalhado[];
  onProdutoClick: (produto: ProdutoDetalhado) => void;
  isAdmin: boolean;
  listaFuncionarios: Funcionario[];
  onDesignarFuncionario: (elementoId: string, funcionarioId: string | null) => void;
  onClose: () => void;
}

/**
 * Cartão flutuante ancorado ao elemento por uma linha indicadora (estilo
 * balão de anotação da especificação). Reposiciona-se para não sair da tela
 * nem cobrir o ponto que indica; vários podem ficar abertos ao mesmo tempo.
 */
export function Callout({
  elemento,
  ancora,
  indice,
  container,
  destaque,
  funcionario,
  itens,
  onProdutoClick,
  isAdmin,
  listaFuncionarios,
  onDesignarFuncionario,
  onClose,
}: CalloutProps) {
  // Mede o tamanho REAL do cartão: a linha indicadora encosta na borda exata,
  // sem depender de altura estimada (era a causa da dessincronização).
  const cartaoRef = useRef<HTMLDivElement>(null);
  const [tamanho, setTamanho] = useState({ w: LARGURA_CARTAO, h: 180 });
  useLayoutEffect(() => {
    const el = cartaoRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setTamanho({ w: el.offsetWidth, h: el.offsetHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Preferência: à direita da âncora, centrado verticalmente; vira para a
  // esquerda quando não há espaço. O escalonamento por índice evita que
  // vários cartões abertos se cubram.
  const desloc = 26 + indice * 16;
  let left = ancora.x + desloc;
  if (left + tamanho.w > container.width - 8) left = ancora.x - tamanho.w - desloc;
  left = Math.max(8, Math.min(left, container.width - tamanho.w - 8));
  let top = ancora.y - tamanho.h / 2 + indice * 24;
  top = Math.max(8, Math.min(top, container.height - tamanho.h - 8));

  // Ponto da borda do cartão mais próximo da âncora (encosto real da linha).
  const cantoX = Math.max(left, Math.min(ancora.x, left + tamanho.w));
  const cantoY = Math.max(top, Math.min(ancora.y, top + tamanho.h));
  const ancoraDentroDoCartao =
    ancora.x >= left &&
    ancora.x <= left + tamanho.w &&
    ancora.y >= top &&
    ancora.y <= top + tamanho.h;
  const corLinha = destaque ? "#f97316" : "#94a3b8";

  const titulo = elemento.rotulo ?? NOME_TIPO[elemento.tipo] ?? "Posição";

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {!ancoraDentroDoCartao && (
          <line
            x1={ancora.x}
            y1={ancora.y}
            x2={cantoX}
            y2={cantoY}
            stroke={corLinha}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}
        <circle cx={ancora.x} cy={ancora.y} r={4} fill={corLinha} />
      </svg>

      <div
        ref={cartaoRef}
        className={`absolute rounded-xl bg-white shadow-lg ring-1 ${destaque ? "ring-orange-300" : "ring-slate-200"}`}
        style={{ left, top, width: LARGURA_CARTAO }}
      >
        <div className="flex items-center justify-between rounded-t-xl border-b border-slate-100 px-3 py-2">
          <span className="text-sm font-semibold text-slate-700">{titulo}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar cartão"
          >
            <X size={14} />
          </button>
        </div>

        {/* Responsável pela mesa */}
        {elemento.tipo === "mesa" && (
          <div className="border-b border-slate-100 px-3 py-2">
            {funcionario ? (
              <div className="flex items-center gap-2">
                <FotoThumb
                  path={funcionario.foto_path}
                  alt={funcionario.nome}
                  className="h-8 w-8 rounded-full"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{funcionario.nome}</p>
                  {funcionario.cargo && (
                    <p className="truncate text-xs text-slate-400">{funcionario.cargo}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Mesa sem funcionário designado</p>
            )}
            {isAdmin && (
              <select
                value={elemento.funcionario_id ?? ""}
                onChange={(e) => onDesignarFuncionario(elemento.id, e.target.value || null)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Designar funcionário…</option>
                {listaFuncionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Itens nesta posição */}
        <div className="max-h-44 overflow-y-auto p-2">
          {itens.length === 0 ? (
            <p className="px-1 py-2 text-xs text-slate-400">Nenhum item nesta posição.</p>
          ) : (
            itens.map((produto) => (
              <button
                key={produto.id}
                type="button"
                onClick={() => onProdutoClick(produto)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
              >
                <Package size={14} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-slate-700">
                    {produto.nome}
                  </span>
                  {produto.codigo && (
                    <span className="block truncate text-[11px] text-slate-400">
                      {produto.codigo}
                    </span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
