import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  variant?: "default" | "card" | "inline";
  size?: "sm" | "md" | "lg";
}

export default function LoadingState({
  message = "Cargando...",
  fullScreen = false,
  variant = "default",
  size = "md",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const LoadingContent = () => (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Spinner con animación */}
      <div className="relative">
        <Loader2
          className={`${sizeClasses[size]} text-blue-600 animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-4 border-blue-100 animate-pulse`}
        ></div>
      </div>

      {/* Mensaje con shimmer effect */}
      <div className="text-center space-y-2">
        <p
          className={`${textSizeClasses[size]} font-medium text-gray-700 animate-pulse`}
        >
          {message}
        </p>
        <div className="flex gap-1 justify-center">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );

  // Variante Full Screen
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingContent />
      </div>
    );
  }

  // Variante Card
  if (variant === "card") {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-16">
          <LoadingContent />
        </CardContent>
      </Card>
    );
  }

  // Variante Inline
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className={`${sizeClasses[size]} animate-spin`} />
        <span className={textSizeClasses[size]}>{message}</span>
      </div>
    );
  }

  // Variante Default (container)
  return (
    <div className="py-12">
      <LoadingContent />
    </div>
  );
}

// Skeleton Loader para listas
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton para Stats Cards
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-0 shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-gray-300 to-gray-400 p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/40 rounded w-20"></div>
                  <div className="h-8 bg-white/40 rounded w-16"></div>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl">
                  <div className="h-7 w-7 bg-white/40 rounded"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
