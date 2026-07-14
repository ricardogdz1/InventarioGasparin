/** Estado de conservação — espelha o enum `estado_conservacao` do banco. */
export type EstadoConservacao = "novo" | "otimo" | "bom" | "regular" | "ruim";

export const ESTADOS: { value: EstadoConservacao; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "otimo", label: "Ótimo" },
  { value: "bom", label: "Bom" },
  { value: "regular", label: "Regular" },
  { value: "ruim", label: "Ruim" },
];

/** Produto/ativo — espelha a tabela `public.produtos`. */
export interface Produto {
  id: string;
  empresa_id: string;
  nome: string;
  codigo: string | null;
  categoria: string | null;
  numero_serie: string | null;
  data_aquisicao: string | null;
  valor: number | null;
  estado: EstadoConservacao;
  quantidade: number;
  foto_path: string | null;
  funcionario_id: string | null;
  sala_id: string | null;
  criado_em: string;
}

/** Produto com os vínculos expandidos para exibição nas listagens. */
export interface ProdutoDetalhado extends Produto {
  funcionario: { id: string; nome: string } | null;
  sala: { id: string; nome: string; unidade: { id: string; nome: string } | null } | null;
}

/** Filtros da listagem/busca de produtos. */
export interface FiltrosProduto {
  busca: string;
  categoria: string | null;
  funcionarioId: string | null;
  salaId: string | null;
  estado: EstadoConservacao | null;
}
