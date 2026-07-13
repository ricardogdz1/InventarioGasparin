import { supabase } from "../../../lib/supabase";
import type { Perfil } from "../types";

/**
 * Camada de serviço de autenticação.
 * Por quê: componentes de tela nunca acessam o Supabase diretamente
 * (regra de arquitetura do projeto) — toda chamada passa por aqui.
 */

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Cria a conta de login. Se a confirmação de e-mail estiver ativa no Supabase,
 * `session` retorna nula e o usuário precisa confirmar antes de entrar.
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Busca o perfil do usuário logado; retorna null se ele ainda não registrou empresa. */
export async function fetchOwnPerfil(): Promise<Perfil | null> {
  const { data, error } = await supabase.from("perfis").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Bootstrap do tenant: cria a empresa e torna o usuário logado o administrador.
 * Executado via RPC `registrar_empresa` (security definer) porque, sem perfil,
 * o RLS impediria os inserts diretos.
 */
export async function registerEmpresa(nomeEmpresa: string, nomeUsuario: string): Promise<string> {
  const { data, error } = await supabase.rpc("registrar_empresa", {
    nome_empresa: nomeEmpresa,
    nome_usuario: nomeUsuario,
  });
  if (error) throw error;
  return data as string;
}
