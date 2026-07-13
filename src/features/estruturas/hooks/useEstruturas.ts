import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/estruturasService";

/**
 * Hooks de dados das estruturas físicas.
 * Por quê TanStack Query: cache automático (o app continua exibindo dados
 * offline) e invalidação centralizada após cada mutação.
 */

export function useUnidades() {
  return useQuery({ queryKey: ["unidades"], queryFn: service.listUnidades });
}

export function useSalas(unidadeId: string | null) {
  return useQuery({
    queryKey: ["salas", unidadeId],
    queryFn: () => service.listSalas(unidadeId!),
    enabled: !!unidadeId,
  });
}

export function useUnidadeMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["unidades"] });

  const create = useMutation({ mutationFn: service.createUnidade, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, ...patch }: { id: string; nome?: string; endereco?: string | null }) =>
      service.updateUnidade(id, patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: service.deleteUnidade, onSuccess: invalidate });

  return { create, update, remove };
}

export function useSalaMutations(unidadeId: string | null) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["salas", unidadeId] });

  const create = useMutation({ mutationFn: service.createSala, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, ...patch }: { id: string; nome?: string; descricao?: string | null }) =>
      service.updateSala(id, patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: service.deleteSala, onSuccess: invalidate });

  return { create, update, remove };
}
