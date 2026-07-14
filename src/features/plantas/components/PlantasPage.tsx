import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon, Wand2, PackageSearch } from "lucide-react";
import { useAuthStore } from "../../../stores/authStore";
import { useAllSalas } from "../../estruturas/hooks/useEstruturas";
import { useFuncionarios } from "../../funcionarios/hooks/useFuncionarios";
import { useProdutos } from "../../inventario/hooks/useProdutos";
import { getProduto } from "../../inventario/services/produtosService";
import type { ProdutoDetalhado } from "../../inventario/types";
import { usePlantaBySala, usePlantaMutations, usePlantas } from "../hooks/usePlantas";
import { gerarPlantaExemplo } from "../services/plantasService";
import { PainelItem } from "./PainelItem";
import { PlantaViewer } from "./PlantaViewer";

const SEM_FILTROS = { busca: "", categoria: null, funcionarioId: null, salaId: null, estado: null };

/**
 * Página de plantas 2D (Fase 3): seleção de sala, visualizador com destaque
 * do item vindo da busca global (?produto=id) e painel lateral de detalhes.
 */
export function PlantasPage() {
  const perfil = useAuthStore((s) => s.perfil);
  const isAdmin = perfil?.acesso === "administrador";

  const [searchParams, setSearchParams] = useSearchParams();
  const produtoParam = searchParams.get("produto");

  const [salaId, setSalaId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [painelProduto, setPainelProduto] = useState<ProdutoDetalhado | null>(null);
  const [avisoLocalizacao, setAvisoLocalizacao] = useState<string | null>(null);

  const salas = useAllSalas();
  const funcionarios = useFuncionarios();
  const plantas = usePlantas();
  const planta = usePlantaBySala(salaId);
  const mutations = usePlantaMutations(salaId);
  // Todos os itens da empresa: agrupados por posição e por funcionário.
  const produtos = useProdutos(SEM_FILTROS);

  const produtoBuscado = useQuery({
    queryKey: ["produto", produtoParam],
    queryFn: () => getProduto(produtoParam!),
    enabled: !!produtoParam,
  });

  // Resolve a localização do item buscado: sala+posição diretas, ou a mesa
  // do funcionário responsável (varre as plantas da empresa).
  useEffect(() => {
    const produto = produtoBuscado.data;
    if (!produto || !plantas.data) return;
    setAvisoLocalizacao(null);

    if (produto.sala_id) {
      setSalaId(produto.sala_id);
      setHighlightId(produto.posicao_id);
      if (!produto.posicao_id) {
        setAvisoLocalizacao(
          `"${produto.nome}" está nesta sala, mas sem posição definida na planta.`,
        );
      }
      return;
    }
    if (produto.funcionario_id) {
      for (const p of plantas.data) {
        const mesa = p.dados.elementos.find((el) => el.funcionario_id === produto.funcionario_id);
        if (mesa) {
          setSalaId(p.sala_id);
          setHighlightId(mesa.id);
          return;
        }
      }
      setAvisoLocalizacao(
        `"${produto.nome}" está com ${produto.funcionario?.nome ?? "um funcionário"}, mas a mesa dele ainda não foi marcada em nenhuma planta.`,
      );
      return;
    }
    setAvisoLocalizacao(`"${produto.nome}" não tem vínculo de localização.`);
  }, [produtoBuscado.data, plantas.data]);

  // Agrupamentos para os cartões flutuantes.
  const { porElemento, porFuncionario } = useMemo(() => {
    const porElemento = new Map<string, ProdutoDetalhado[]>();
    const porFuncionario = new Map<string, ProdutoDetalhado[]>();
    for (const produto of produtos.data ?? []) {
      if (produto.posicao_id) {
        porElemento.set(produto.posicao_id, [
          ...(porElemento.get(produto.posicao_id) ?? []),
          produto,
        ]);
      }
      if (produto.funcionario_id) {
        porFuncionario.set(produto.funcionario_id, [
          ...(porFuncionario.get(produto.funcionario_id) ?? []),
          produto,
        ]);
      }
    }
    return { porElemento, porFuncionario };
  }, [produtos.data]);

  const mapaFuncionarios = useMemo(
    () => new Map((funcionarios.data ?? []).map((f) => [f.id, f])),
    [funcionarios.data],
  );

  const semPosicao = useMemo(
    () =>
      (produtos.data ?? []).filter((p) => p.sala_id === salaId && !p.posicao_id && salaId != null),
    [produtos.data, salaId],
  );

  function trocarSala(novaSalaId: string | null) {
    setSalaId(novaSalaId);
    setHighlightId(null);
    setPainelProduto(null);
    setAvisoLocalizacao(null);
    if (produtoParam) setSearchParams({}, { replace: true });
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Barra superior: seleção de sala */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <MapIcon size={18} className="text-slate-400" />
        <h1 className="text-lg font-semibold text-slate-800">Plantas 2D</h1>
        <select
          value={salaId ?? ""}
          onChange={(e) => trocarSala(e.target.value || null)}
          className="ml-4 min-w-64 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Selecione a sala…</option>
          {salas.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.unidade ? `${s.unidade.nome} · ${s.nome}` : s.nome}
            </option>
          ))}
        </select>
        {isAdmin && planta.data && (
          <button
            type="button"
            onClick={() => {
              const ok = window.confirm(
                "Regerar a planta de exemplo? O desenho atual desta sala será substituído (posições de itens apontando para móveis antigos ficarão sem posição).",
              );
              if (ok) mutations.salvar.mutate(gerarPlantaExemplo());
            }}
            disabled={mutations.salvar.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-60"
          >
            <Wand2 size={13} /> Regerar exemplo
          </button>
        )}
        {semPosicao.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <PackageSearch size={13} />
            {semPosicao.length} item(ns) nesta sala sem posição na planta
          </span>
        )}
      </div>

      {avisoLocalizacao && (
        <div className="border-b border-amber-100 bg-amber-50 px-6 py-2 text-sm text-amber-800">
          {avisoLocalizacao}
        </div>
      )}

      {/* Conteúdo */}
      <div className="relative min-h-0 flex-1">
        {!salaId ? (
          <EstadoVazio mensagem="Selecione uma sala para ver a planta — ou busque um item na barra superior." />
        ) : planta.isLoading ? (
          <EstadoVazio mensagem="Carregando planta…" />
        ) : !planta.data ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
            <MapIcon size={40} />
            <p className="text-sm">Esta sala ainda não tem planta desenhada.</p>
            <p className="max-w-sm text-center text-xs">
              O editor completo (arrastar móveis, paredes, desfazer/refazer) chega na Fase 4.
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => mutations.salvar.mutate(gerarPlantaExemplo())}
                disabled={mutations.salvar.isPending}
                className="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Wand2 size={15} />
                {mutations.salvar.isPending ? "Gerando…" : "Gerar planta de exemplo"}
              </button>
            )}
          </div>
        ) : (
          <PlantaViewer
            planta={planta.data.dados}
            funcionarios={mapaFuncionarios}
            produtosPorElemento={porElemento}
            produtosPorFuncionario={porFuncionario}
            highlightId={highlightId}
            onProdutoClick={setPainelProduto}
            isAdmin={!!isAdmin}
            listaFuncionarios={funcionarios.data ?? []}
            onDesignarFuncionario={(elementoId, funcionarioId) =>
              mutations.atualizarElemento.mutate({
                planta: planta.data!,
                elementoId,
                patch: { funcionario_id: funcionarioId },
              })
            }
          />
        )}

        <PainelItem produto={painelProduto} onClose={() => setPainelProduto(null)} />
      </div>
    </div>
  );
}

function EstadoVazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-sm text-slate-400">
      {mensagem}
    </div>
  );
}
