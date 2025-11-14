import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  variant?: "default" | "card" | "fullScreen";
  type?: "error" | "warning" | "info";
  showActions?: boolean;
}

export default function ErrorState({
  title = "¡Oops! Algo salió mal",
  message = "Ha ocurrido un error inesperado. Por favor, intenta nuevamente.",
  onRetry,
  onGoBack,
  onGoHome,
  variant = "default",
  type = "error",
  showActions = true,
}: ErrorStateProps) {
  const typeConfig = {
    error: {
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      borderColor: "border-red-200",
      gradient: "from-red-100 to-red-50",
    },
    warning: {
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-500",
      borderColor: "border-yellow-200",
      gradient: "from-yellow-100 to-yellow-50",
    },
    info: {
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      borderColor: "border-blue-200",
      gradient: "from-blue-100 to-blue-50",
    },
  };

  const config = typeConfig[type];

  const ErrorContent = () => (
    <div className="flex flex-col items-center justify-center text-center space-y-6 p-6">
      {/* Icono animado */}
      <div className="relative">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full blur-xl opacity-70 animate-pulse`}
        ></div>
        <div
          className={`relative ${config.bgColor} p-6 rounded-full ${config.borderColor} border-4`}
        >
          <AlertCircle className={`h-16 w-16 ${config.iconColor}`} />
        </div>
      </div>

      {/* Texto */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>

      {/* Acciones */}
      {showActions && (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1"
              variant="default"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          )}
          {onGoBack && (
            <Button
              onClick={onGoBack}
              className="flex-1"
              variant="outline"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
          {onGoHome && (
            <Button
              onClick={onGoHome}
              className="flex-1"
              variant="outline"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // Variante Full Screen
  if (variant === "fullScreen") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <ErrorContent />
      </div>
    );
  }

  // Variante Card
  if (variant === "card") {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-8">
          <ErrorContent />
        </CardContent>
      </Card>
    );
  }

  // Variante Default
  return (
    <div className="py-8">
      <ErrorContent />
    </div>
  );
}

// Error específico para Network/API
export function NetworkErrorState({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <ErrorState
      title="Error de conexión"
      message="No pudimos conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente."
      onRetry={onRetry}
      type="warning"
    />
  );
}

// Error específico para permisos
export function PermissionErrorState({
  onGoHome,
}: {
  onGoHome?: () => void;
}) {
  return (
    <ErrorState
      title="Acceso denegado"
      message="No tienes permisos para acceder a este recurso. Contacta al administrador si crees que esto es un error."
      onGoHome={onGoHome}
      type="error"
      showActions={false}
    />
  );
}

// Error 404
export function NotFoundErrorState({
  resource = "página",
  onGoHome,
}: {
  resource?: string;
  onGoHome?: () => void;
}) {
  return (
    <ErrorState
      title="No encontrado"
      message={`La ${resource} que buscas no existe o fue eliminada.`}
      onGoHome={onGoHome}
      type="info"
    />
  );
}
