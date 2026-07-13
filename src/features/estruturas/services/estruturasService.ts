import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../stores/authStore";
import type { Sala, Unidade } from "../types";

/**
 * Camada de serviço de estruturas físicas (unidades e salas).
 * O empresa_id é sempre injetado aqui a partir do perfil logado; o RLS do
 * banco valida de novo no servidor — a checagem local só melhora a mensagem
 * de erro, nunca substitui a segurança do banco.
 */

function requireEmpresaId(): string {
  const perfil = useAuthStore.getState().perfil;
  if (!perfil) throw new Error("Usuário sem empresa registrada.");
  return perfil.empresa_id;
}

// ---------------------------------------------------------------------------
// Unidades
// ---------------------------------------------------------------------------

export async function listUnidades(): Promise<Unidade[]> {
  const { data, error } = await supabase.from("unidades").select("*").order("nome");
  if (error) throw error;
  return data;
}

export async function createUnidade(input: {
  nome: string;
  endereco?: string | null;
}): Promise<Unidade> {
  const { data, error } = await supabase
    .from("unidades")
    .insert({ ...input, empresa_id: requireEmpresaId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUnidade(
  id: string,
  patch: { nome?: string; endereco?: string | null },
): Promise<Unidade> {
  const { data, error } = await supabase
    .from("unidades")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUnidade(id: string): Promise<void> {
  const { error } = await supabase.from("unidades").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Salas
// ---------------------------------------------------------------------------

export async function listSalas(unidadeId: string): Promise<Sala[]> {
  const { data, error } = await supabase
    .from("salas")
    .select("*")
    .eq("unidade_id", unidadeId)
    .order("nome");
  if (error) throw error;
  return data;
}

export async function createSala(input: {
  unidade_id: string;
  nome: string;
  descricao?: string | null;
}): Promise<Sala> {
  const { data, error } = await supabase
    .from("salas")
    .insert({ ...input, empresa_id: requireEmpresaId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSala(
  id: string,
  patch: { nome?: string; descricao?: string | null },
): Promise<Sala> {
  const { data, error } = await supabase.from("salas").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSala(id: string): Promise<void> {
  const { error } = await supabase.from("salas").delete().eq("id", id);
  if (error) throw error;
}
