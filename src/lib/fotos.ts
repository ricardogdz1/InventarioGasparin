import { supabase } from "./supabase";
import { useAuthStore } from "../stores/authStore";

/**
 * Serviço de fotos (bucket privado "fotos" no Supabase Storage).
 * Convenção de caminho: {empresa_id}/{pasta}/{uuid}.{ext} — o primeiro
 * segmento é exigido pelas políticas de RLS do bucket, garantindo que
 * cada empresa só acesse seus próprios arquivos.
 */

export async function uploadFoto(pasta: "produtos" | "funcionarios", file: File): Promise<string> {
  const perfil = useAuthStore.getState().perfil;
  if (!perfil) throw new Error("Usuário sem empresa registrada.");

  const extensao = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${perfil.empresa_id}/${pasta}/${crypto.randomUUID()}.${extensao}`;

  const { error } = await supabase.storage.from("fotos").upload(path, file);
  if (error) throw error;
  return path;
}

/** Gera uma URL temporária (1h) para exibir uma foto do bucket privado. */
export async function getFotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("fotos").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from("fotos").remove([path]);
  if (error) throw error;
}
