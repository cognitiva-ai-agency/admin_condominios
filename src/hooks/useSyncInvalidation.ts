"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys, invalidationGroups } from "@/lib/queryKeys";

type InvalidationGroup = keyof typeof invalidationGroups;

/**
 * Hook centralizado para invalidación de queries con sincronización forzada
 *
 * Este hook resuelve el problema de desfase en la UI al:
 * 1. Invalidar todas las queries relacionadas
 * 2. Forzar refetch inmediato (no esperar al polling)
 * 3. Esperar a que todas las invalidaciones terminen
 */
export function useSyncInvalidation() {
  const queryClient = useQueryClient();

  /**
   * Invalida un grupo predefinido de queries y fuerza refetch inmediato
   */
  const invalidateGroup = useCallback(
    async (group: InvalidationGroup) => {
      const keysToInvalidate = invalidationGroups[group];

      // Invalidar todas las queries del grupo en paralelo y esperar
      await Promise.all(
        keysToInvalidate.map((queryKey) =>
          queryClient.invalidateQueries({
            queryKey: queryKey as unknown as string[],
            refetchType: "active", // Solo refetch de queries activas
          })
        )
      );
    },
    [queryClient]
  );

  /**
   * Invalida queries específicas y fuerza refetch inmediato
   */
  const invalidateKeys = useCallback(
    async (keys: readonly (readonly string[])[]) => {
      await Promise.all(
        keys.map((queryKey) =>
          queryClient.invalidateQueries({
            queryKey: queryKey as string[],
            refetchType: "active",
          })
        )
      );
    },
    [queryClient]
  );

  /**
   * Invalida una query específica de detalle de tarea
   */
  const invalidateTaskDetail = useCallback(
    async (taskId: string) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.detail(taskId),
        refetchType: "active",
      });
    },
    [queryClient]
  );

  /**
   * Fuerza refetch inmediato de queries específicas
   * Usar cuando necesitas que los datos se actualicen al instante
   */
  const forceRefetch = useCallback(
    async (keys: readonly (readonly string[])[]) => {
      await Promise.all(
        keys.map((queryKey) =>
          queryClient.refetchQueries({
            queryKey: queryKey as string[],
            type: "active",
          })
        )
      );
    },
    [queryClient]
  );

  /**
   * Actualiza el caché de una query de lista de tareas (para useInfiniteQuery)
   * Maneja correctamente la estructura de páginas
   */
  const updateTaskInCache = useCallback(
    (taskId: string, updater: (task: any) => any) => {
      // Actualizar en worker-tasks (useInfiniteQuery)
      queryClient.setQueryData(queryKeys.tasks.worker, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            tasks: page.tasks.map((task: any) =>
              task.id === taskId ? updater(task) : task
            ),
          })),
        };
      });

      // Actualizar en admin-tasks (useQuery normal)
      queryClient.setQueryData(queryKeys.tasks.admin, (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((task) => (task.id === taskId ? updater(task) : task));
      });
    },
    [queryClient]
  );

  /**
   * Sincronización completa después de completar subtarea
   * Esta es la función principal para resolver el problema de desfase
   */
  const syncAfterSubtaskComplete = useCallback(
    async (taskId: string, updatedTask?: any) => {
      // 1. Actualizar el caché del detalle de la tarea si tenemos los datos
      if (updatedTask) {
        queryClient.setQueryData(queryKeys.tasks.detail(taskId), updatedTask);

        // 2. Actualizar también en las listas
        updateTaskInCache(taskId, () => updatedTask);
      }

      // 3. Invalidar y refetch todas las queries relacionadas
      await invalidateGroup("taskUpdate");

      // 4. Forzar refetch de las queries más importantes
      await forceRefetch([
        queryKeys.tasks.worker,
        queryKeys.dashboard.stats,
      ]);
    },
    [queryClient, updateTaskInCache, invalidateGroup, forceRefetch]
  );

  /**
   * Sincronización después de cambio de asistencia
   */
  const syncAfterAttendanceChange = useCallback(
    async (attendance?: any) => {
      // 1. Actualizar caché de asistencia si tenemos los datos
      if (attendance) {
        queryClient.setQueryData(queryKeys.attendance.today, attendance);
      }

      // 2. Invalidar queries relacionadas
      await invalidateGroup("attendanceUpdate");
    },
    [queryClient, invalidateGroup]
  );

  return {
    invalidateGroup,
    invalidateKeys,
    invalidateTaskDetail,
    forceRefetch,
    updateTaskInCache,
    syncAfterSubtaskComplete,
    syncAfterAttendanceChange,
    queryKeys,
  };
}
