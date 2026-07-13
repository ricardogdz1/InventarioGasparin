import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { fetchOwnPerfil } from "../features/autenticacao/services/authService";
import type { Perfil } from "../features/autenticacao/types";

interface AuthState {
  /** Sessão atual do Supabase Auth (null = deslogado). */
  session: Session | null;
  /** Perfil na tabela `perfis` (null = logado mas ainda sem empresa registrada). */
  perfil: Perfil | null;
  /** true enquanto a sessão inicial ainda não foi restaurada do storage. */
  initializing: boolean;
  /** Restaura a sessão persistida e assina mudanças de autenticação. */
  init: () => void;
  /** Recarrega o perfil (usado após registrar a empresa). */
  refreshPerfil: () => Promise<void>;
}

/**
 * Estado global de autenticação (Zustand).
 * Por quê aqui e não no React Query: sessão/perfil são estado de aplicação
 * usados por guardas de rota e serviços, não dados de servidor cacheáveis.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  perfil: null,
  initializing: true,

  init: () => {
    // Restaura a sessão salva (persistida em localStorage pelo supabase-js).
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        set({ session: data.session });
        if (data.session) {
          const perfil = await fetchOwnPerfil().catch(() => null);
          set({ perfil });
        }
      })
      .finally(() => set({ initializing: false }));

    // Mantém o estado sincronizado com login/logout/expiração de token.
    supabase.auth.onAuthStateChange((_event, session) => {
      const hadSession = !!get().session;
      set({ session });
      if (!session) {
        set({ perfil: null });
      } else if (!hadSession) {
        // Login novo: carrega o perfil fora do callback (evita deadlock do SDK).
        setTimeout(() => {
          fetchOwnPerfil()
            .then((perfil) => set({ perfil }))
            .catch(() => set({ perfil: null }));
        }, 0);
      }
    });
  },

  refreshPerfil: async () => {
    const perfil = await fetchOwnPerfil().catch(() => null);
    set({ perfil });
  },
}));
