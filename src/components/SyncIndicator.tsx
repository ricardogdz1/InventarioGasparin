import { useSyncExternalStore } from "react";
import { onlineManager, useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

/**
 * Indicador de status de sincronização (requisito da especificação:
 * internet instável é o cenário esperado nas fábricas).
 * - Offline: mostra que os dados exibidos vêm do cache.
 * - Sincronizando: há buscas/mutações em andamento.
 * - Sincronizado: tudo em dia.
 */
export function SyncIndicator() {
  const online = useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
  );
  const fetching = useIsFetching();
  const mutating = useIsMutating();

  if (!online) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
        <CloudOff size={14} /> Offline — exibindo dados salvos
      </span>
    );
  }

  if (fetching + mutating > 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
        <RefreshCw size={14} className="animate-spin" /> Sincronizando…
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
      <Cloud size={14} /> Sincronizado
    </span>
  );
}
