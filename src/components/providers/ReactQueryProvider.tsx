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
            // Configuración optimizada para performance
            staleTime: 30000, // 30 segundos - datos se consideran frescos
            gcTime: 300000, // 5 minutos - tiempo de caché
            retry: 1, // Solo 1 reintento en caso de error
            refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
            refetchOnMount: false, // No refetch automático al montar
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
