import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../stores/authStore";
import type { FiltrosProduto, Produto, ProdutoDetalhado } from "../types";

/**
 * Camada de serviço de produtos.
 * A busca e os filtros são aplicados no servidor (menos dados trafegados —
 * requisito de performance para internet lenta).
 */

const SELECT_DETALHADO =
  "*, funcionario:funcionarios(id, nome), sala:salas(id, nome, unidade:unidades(id, nome))";

function requireEmpresaId(): string {
  const perfil = useAuthStore.getState().perfil;
  if (!perfil) throw new Error("Usuário sem empresa registrada.");
  return perfil.empresa_id;
}

export async function listProdutos(filtros: FiltrosProduto): Promise<ProdutoDetalhado[]> {
  let query = supabase.from("produtos").select(SELECT_DETALHADO).order("nome");

  const busca = filtros.busca.trim();
  if (busca) {
    // Busca por nome, código/patrimônio, número de série ou categoria.
    const termo = `%${busca}%`;
    query = query.or(
      `nome.ilike.${termo},codigo.ilike.${termo},numero_serie.ilike.${termo},categoria.ilike.${termo}`,
    );
  }
  if (filtros.categoria) query = query.eq("categoria", filtros.categoria);
  if (filtros.funcionarioId) query = query.eq("funcionario_id", filtros.funcionarioId);
  if (filtros.salaId) query = query.eq("sala_id", filtros.salaId);
  if (filtros.estado) query = query.eq("estado", filtros.estado);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as ProdutoDetalhado[];
}

/** Lista as categorias já usadas pela empresa (para o filtro e sugestões). */
export async function listCategorias(): Promise<string[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("categoria")
    .not("categoria", "is", null)
    .order("categoria");
  if (error) throw error;
  return [...new Set(data.map((r) => r.categoria as string))];
}

/** Busca um item pelo id, com os vínculos expandidos (usado pela busca global). */
export async function getProduto(id: string): Promise<ProdutoDetalhado | null> {
  const { data, error } = await supabase
    .from("produtos")
    .select(SELECT_DETALHADO)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ProdutoDetalhado | null;
}

export interface ProdutoInput {
  nome: string;
  codigo: string | null;
  categoria: string | null;
  numero_serie: string | null;
  data_aquisicao: string | null;
  valor: number | null;
  estado: Produto["estado"];
  quantidade: number;
  foto_path: string | null;
  funcionario_id: string | null;
  sala_id: string | null;
  /** Elemento da planta da sala onde o item está (mesa, estante…). */
  posicao_id: string | null;
}

export async function createProduto(input: ProdutoInput): Promise<Produto> {
  const { data, error } = await supabase
    .from("produtos")
    .insert({ ...input, empresa_id: requireEmpresaId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduto(id: string, patch: Partial<ProdutoInput>): Promise<Produto> {
  const { data, error } = await supabase
    .from("produtos")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduto(id: string): Promise<void> {
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) throw error;
}
