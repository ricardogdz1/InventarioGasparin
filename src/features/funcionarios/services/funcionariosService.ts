import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../stores/authStore";
import type { Funcionario } from "../types";

/** Camada de serviço de funcionários (escrita restrita ao administrador pelo RLS). */

function requireEmpresaId(): string {
  const perfil = useAuthStore.getState().perfil;
  if (!perfil) throw new Error("Usuário sem empresa registrada.");
  return perfil.empresa_id;
}

export async function listFuncionarios(): Promise<Funcionario[]> {
  const { data, error } = await supabase.from("funcionarios").select("*").order("nome");
  if (error) throw error;
  return data;
}

export async function createFuncionario(input: {
  nome: string;
  cargo?: string | null;
  setor?: string | null;
  foto_path?: string | null;
}): Promise<Funcionario> {
  const { data, error } = await supabase
    .from("funcionarios")
    .insert({ ...input, empresa_id: requireEmpresaId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFuncionario(
  id: string,
  patch: { nome?: string; cargo?: string | null; setor?: string | null; foto_path?: string | null },
): Promise<Funcionario> {
  const { data, error } = await supabase
    .from("funcionarios")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFuncionario(id: string): Promise<void> {
  const { error } = await supabase.from("funcionarios").delete().eq("id", id);
  if (error) throw error;
}
