/** Unidade física (prédio/filial) — espelha a tabela `public.unidades`. */
export interface Unidade {
  id: string;
  empresa_id: string;
  nome: string;
  endereco: string | null;
  criado_em: string;
}

/** Sala ou armazém dentro de uma unidade — espelha a tabela `public.salas`. */
export interface Sala {
  id: string;
  empresa_id: string;
  unidade_id: string;
  nome: string;
  descricao: string | null;
  criado_em: string;
}
