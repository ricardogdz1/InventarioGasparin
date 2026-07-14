/** Tipos de elemento desenháveis na planta (biblioteca da especificação). */
export type TipoElemento =
  | "mesa"
  | "cadeira"
  | "estante"
  | "prateleira"
  | "porta"
  | "parede"
  | "divisoria"
  | "computador"
  | "impressora"
  | "caixa"
  | "area";

/** Tipos que podem receber itens (posições válidas para `produtos.posicao_id`). */
export const TIPOS_POSICIONAVEIS: TipoElemento[] = [
  "mesa",
  "estante",
  "prateleira",
  "caixa",
  "area",
];

/** Um elemento da planta (coordenadas no espaço da planta, em "pixels de mundo"). */
export interface ElementoPlanta {
  id: string;
  tipo: TipoElemento;
  x: number;
  y: number;
  largura: number;
  altura: number;
  /** Rotação em graus, em torno do centro do elemento. */
  rotacao: number;
  rotulo: string | null;
  /** Mesa designada a um funcionário (itens dele aparecem aqui). */
  funcionario_id: string | null;
}

/** Conteúdo do campo JSONB `plantas.dados`. */
export interface PlantaDados {
  largura: number;
  altura: number;
  elementos: ElementoPlanta[];
}

/** Registro da tabela `public.plantas`. */
export interface Planta {
  id: string;
  empresa_id: string;
  sala_id: string;
  dados: PlantaDados;
  criado_em: string;
  atualizado_em: string;
}
