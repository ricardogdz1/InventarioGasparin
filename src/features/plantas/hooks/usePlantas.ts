import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/plantasService";
import type { ElementoPlanta, Planta, PlantaDados } from "../types";

export function usePlantaBySala(salaId: string | null) {
  return useQuery({
    queryKey: ["planta", salaId],
    queryFn: () => service.getPlantaBySala(salaId!),
    enabled: !!salaId,
  });
}

/** Todas as plantas da empresa (localização da mesa de funcionários). */
export function usePlantas() {
  return useQuery({ queryKey: ["plantas"], queryFn: service.listPlantas });
}

export function usePlantaMutations(salaId: string | null) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["planta", salaId] });
    queryClient.invalidateQueries({ queryKey: ["plantas"] });
  };

  const salvar = useMutation({
    mutationFn: (dados: PlantaDados) => service.upsertPlanta(salaId!, dados),
    onSuccess: invalidate,
  });

  const atualizarElemento = useMutation({
    mutationFn: ({
      planta,
      elementoId,
      patch,
    }: {
      planta: Planta;
      elementoId: string;
      patch: Partial<ElementoPlanta>;
    }) => service.updateElementoPlanta(planta, elementoId, patch),
    onSuccess: invalidate,
  });

  return { salvar, atualizarElemento };
}
