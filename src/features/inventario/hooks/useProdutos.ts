import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/produtosService";
import type { FiltrosProduto } from "../types";

/**
 * Hooks de dados do inventário. A chave da query inclui os filtros: cada
 * combinação é cacheada separadamente e revalidada em segundo plano.
 */

export function useProdutos(filtros: FiltrosProduto) {
  return useQuery({
    queryKey: ["produtos", filtros],
    queryFn: () => service.listProdutos(filtros),
    placeholderData: (previous) => previous,
  });
}

export function useCategorias() {
  return useQuery({ queryKey: ["categorias"], queryFn: service.listCategorias });
}

export function useProdutoMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["produtos"] });
    queryClient.invalidateQueries({ queryKey: ["categorias"] });
  };

  const create = useMutation({ mutationFn: service.createProduto, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<service.ProdutoInput> }) =>
      service.updateProduto(id, patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: service.deleteProduto, onSuccess: invalidate });

  return { create, update, remove };
}
