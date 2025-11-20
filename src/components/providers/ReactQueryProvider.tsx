"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración optimizada para actualizaciones en tiempo real
            staleTime: 10000, // 10 segundos - datos más frescos
            gcTime: 300000, // 5 minutos - tiempo de caché
            retry: 1, // Solo 1 reintento en caso de error
            refetchOnWindowFocus: true, // HABILITADO: Actualizar al volver a la ventana
            refetchOnMount: true, // HABILITADO: Actualizar al montar componente
            refetchOnReconnect: true, // Actualizar al recuperar conexión
          },
          mutations: {
            // Configuración para mutaciones
            retry: 1, // Reintentar una vez si falla
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Dev tools solo en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
