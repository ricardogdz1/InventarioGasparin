import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../stores/authStore";
import type { ElementoPlanta, Planta, PlantaDados } from "../types";

/** Camada de serviço das plantas 2D (escrita restrita ao administrador pelo RLS). */

function requireEmpresaId(): string {
  const perfil = useAuthStore.getState().perfil;
  if (!perfil) throw new Error("Usuário sem empresa registrada.");
  return perfil.empresa_id;
}

export async function getPlantaBySala(salaId: string): Promise<Planta | null> {
  const { data, error } = await supabase
    .from("plantas")
    .select("*")
    .eq("sala_id", salaId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Todas as plantas da empresa (para localizar a mesa de um funcionário). */
export async function listPlantas(): Promise<Planta[]> {
  const { data, error } = await supabase.from("plantas").select("*");
  if (error) throw error;
  return data;
}

export async function upsertPlanta(salaId: string, dados: PlantaDados): Promise<Planta> {
  const { data, error } = await supabase
    .from("plantas")
    .upsert(
      {
        sala_id: salaId,
        empresa_id: requireEmpresaId(),
        dados,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "sala_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Atualiza um único elemento da planta (ex.: designar funcionário a uma mesa). */
export async function updateElementoPlanta(
  planta: Planta,
  elementoId: string,
  patch: Partial<ElementoPlanta>,
): Promise<Planta> {
  const dados: PlantaDados = {
    ...planta.dados,
    elementos: planta.dados.elementos.map((elemento) =>
      elemento.id === elementoId ? { ...elemento, ...patch } : elemento,
    ),
  };
  return upsertPlanta(planta.sala_id, dados);
}

/**
 * Gera uma planta de demonstração para a sala (até o editor da Fase 4 existir,
 * é a forma de ter algo para visualizar): escritório com divisória, ilha de
 * mesas, estantes e área de expedição.
 */
export function gerarPlantaExemplo(): PlantaDados {
  const uid = () => crypto.randomUUID();
  const elementos: ElementoPlanta[] = [
    // Divisória separando o escritório da expedição
    {
      id: uid(),
      tipo: "divisoria",
      x: 520,
      y: 40,
      largura: 8,
      altura: 380,
      rotacao: 0,
      rotulo: null,
      funcionario_id: null,
    },
    // Áreas nomeadas
    {
      id: uid(),
      tipo: "area",
      x: 60,
      y: 40,
      largura: 420,
      altura: 520,
      rotacao: 0,
      rotulo: "Escritório",
      funcionario_id: null,
    },
    {
      id: uid(),
      tipo: "area",
      x: 560,
      y: 40,
      largura: 320,
      altura: 520,
      rotacao: 0,
      rotulo: "Expedição",
      funcionario_id: null,
    },
    // Ilha 2x2: mesas frente a frente, cadeiras para fora (como nas referências)
    {
      id: uid(),
      tipo: "mesa",
      x: 115,
      y: 96,
      largura: 130,
      altura: 98,
      rotacao: 180,
      rotulo: "Mesa 1",
      funcionario_id: null,
    },
    {
      id: uid(),
      tipo: "mesa",
      x: 255,
      y: 96,
      largura: 130,
      altura: 98,
      rotacao: 180,
      rotulo: "Mesa 2",
      funcionario_id: null,
    },
    {
      id: uid(),
      tipo: "mesa",
      x: 115,
      y: 200,
      largura: 130,
      altura: 98,
      rotacao: 0,
      rotulo: "Mesa 3",
      funcionario_id: null,
    },
    {
      id: uid(),
      tipo: "mesa",
      x: 255,
      y: 200,
      largura: 130,
      altura: 98,
      rotacao: 0,
      rotulo: "Mesa 4",
      funcionario_id: null,
    },
    // Mesa avulsa perto da divisória
    {
      id: uid(),
      tipo: "mesa",
      x: 130,
      y: 410,
      largura: 130,
      altura: 98,
      rotacao: 0,
      rotulo: "Mesa 5",
      funcionario_id: null,
    },
    // Impressora compartilhada
    {
      id: uid(),
      tipo: "impressora",
      x: 420,
      y: 460,
      largura: 56,
      altura: 44,
      rotacao: 0,
      rotulo: "Impressora",
      funcionario_id: null,
    },
    // Estantes na expedição
    {
      id: uid(),
      tipo: "estante",
      x: 590,
      y: 80,
      largura: 60,
      altura: 200,
      rotacao: 0,
      rotulo: "Estante A",
      funcionario_id: null,
    },
    {
      id: uid(),
      tipo: "estante",
      x: 700,
      y: 80,
      largura: 60,
      altura: 200,
      rotacao: 0,
      rotulo: "Estante B",
      funcionario_id: null,
    },
    {
      id: uid(),
      tipo: "prateleira",
      x: 590,
      y: 340,
      largura: 170,
      altura: 40,
      rotacao: 0,
      rotulo: "Prateleira B3",
      funcionario_id: null,
    },
    // Caixas soltas
    {
      id: uid(),
      tipo: "caixa",
      x: 800,
      y: 420,
      largura: 48,
      altura: 48,
      rotacao: 0,
      rotulo: "Caixas",
      funcionario_id: null,
    },
  ];
  return { largura: 940, altura: 640, elementos };
}
