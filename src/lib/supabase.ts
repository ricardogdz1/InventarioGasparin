import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha cedo e com mensagem clara: sem essas variáveis nada funciona.
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas. Copie .env.example para .env.",
  );
}

/**
 * Cliente único do Supabase compartilhado por toda a aplicação.
 * A sessão é persistida em localStorage para sobreviver a reinícios do app.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
