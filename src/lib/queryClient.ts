import { QueryClient } from "@tanstack/react-query";

/**
 * Cliente do TanStack Query com configuração pensada para internet instável:
 * - networkMode "offlineFirst": exibe o cache imediatamente e busca em segundo
 *   plano; sem conexão, o usuário continua vendo os últimos dados carregados.
 * - staleTime de 1 minuto: reduz chamadas repetidas ao banco (requisito de
 *   performance em máquinas modestas e internet lenta).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "offlineFirst",
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});
