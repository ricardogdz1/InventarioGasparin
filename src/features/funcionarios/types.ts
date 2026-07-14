/** Funcionário da empresa — espelha a tabela `public.funcionarios`. */
export interface Funcionario {
  id: string;
  empresa_id: string;
  nome: string;
  cargo: string | null;
  setor: string | null;
  foto_path: string | null;
  criado_em: string;
}
