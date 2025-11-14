import * as React from "react"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  type?: "success" | "error" | "warning" | "info"
  duration?: number
  onClose?: () => void
}

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastStyles = {
  success: "bg-green-50 border-green-200 text-green-900",
  error: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
}

const iconStyles = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
}

export function Toast({
  id,
  title,
  description,
  type = "info",
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  const [isExiting, setIsExiting] = React.useState(false)

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300) // Duración de la animación
  }

  if (!isVisible) return null

  const Icon = toastIcons[type]

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border-2 shadow-lg transition-all duration-300",
        toastStyles[type],
        isExiting
          ? "animate-out slide-out-to-right-full"
          : "animate-in slide-in-from-right-full"
      )}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className={cn("flex-shrink-0", iconStyles[type])}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-sm font-semibold leading-tight">{title}</p>
            )}
            {description && (
              <p className={cn("text-sm leading-tight", title && "mt-1")}>
                {description}
              </p>
            )}
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-auto sm:bottom-0 sm:right-0 sm:flex-col md:max-w-[420px]">
      {children}
    </div>
  )
}
