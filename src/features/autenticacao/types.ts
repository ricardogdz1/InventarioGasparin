/** Níveis de acesso do sistema — espelham o enum `perfil_acesso` do banco. */
export type PerfilAcesso = "administrador" | "gestor" | "consulta";

/** Perfil do usuário logado — espelha a tabela `public.perfis`. */
export interface Perfil {
  id: string;
  empresa_id: string;
  nome: string;
  acesso: PerfilAcesso;
  criado_em: string;
}
