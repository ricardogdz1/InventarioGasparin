import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Package, Search, User } from "lucide-react";
import { listProdutos } from "../features/inventario/services/produtosService";

/**
 * Busca global sempre visível (funcionalidade principal da especificação):
 * digite e veja resultados instantâneos; selecionar um item abre a planta 2D
 * com o destaque animado no local exato.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  const termoLimpo = termo.trim();
  const resultados = useQuery({
    queryKey: ["busca-global", termoLimpo],
    queryFn: () =>
      listProdutos({
        busca: termoLimpo,
        categoria: null,
        funcionarioId: null,
        salaId: null,
        estado: null,
      }),
    enabled: termoLimpo.length >= 2,
    staleTime: 15_000,
  });

  // Fecha o dropdown ao clicar fora.
  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onClickFora);
    return () => document.removeEventListener("mousedown", onClickFora);
  }, []);

  function selecionar(produtoId: string) {
    setAberto(false);
    setTermo("");
    navigate(`/plantas?produto=${produtoId}`);
  }

  const lista = resultados.data?.slice(0, 8) ?? [];

  return (
    <div ref={raiz} className="relative w-full max-w-md">
      <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
      <input
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAberto(false);
          if (e.key === "Enter" && lista.length > 0) selecionar(lista[0].id);
        }}
        placeholder="Onde está…? Busque um item para localizar na planta"
        className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pr-3 pl-9 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
      />

      {aberto && termoLimpo.length >= 2 && (
        <div className="absolute top-full right-0 left-0 z-30 mt-1 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
          {resultados.isLoading ? (
            <p className="px-4 py-3 text-sm text-slate-400">Buscando…</p>
          ) : lista.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Nenhum item encontrado.</p>
          ) : (
            lista.map((produto) => (
              <button
                key={produto.id}
                type="button"
                onClick={() => selecionar(produto.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
              >
                <Package size={15} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-700">
                    {produto.nome}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {[produto.codigo, produto.categoria].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                  {produto.funcionario ? (
                    <>
                      <User size={12} /> {produto.funcionario.nome}
                    </>
                  ) : produto.sala ? (
                    <>
                      <MapPin size={12} /> {produto.sala.nome}
                    </>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
