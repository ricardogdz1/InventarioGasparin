import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/funcionariosService";

export function useFuncionarios() {
  return useQuery({ queryKey: ["funcionarios"], queryFn: service.listFuncionarios });
}

export function useFuncionarioMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["funcionarios"] });

  const create = useMutation({ mutationFn: service.createFuncionario, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: string;
      nome?: string;
      cargo?: string | null;
      setor?: string | null;
      foto_path?: string | null;
    }) => service.updateFuncionario(id, patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: service.deleteFuncionario, onSuccess: invalidate });

  return { create, update, remove };
}
