"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastContainer, ToastProps } from "@/components/ui/toast";

interface ToastContextValue {
  showToast: (toast: Omit<ToastProps, "id" | "onClose">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastProps, "id" | "onClose">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: ToastProps = {
        ...toast,
        id,
        onClose: () => removeToast(id),
      };
      setToasts((prev) => [...prev, newToast]);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "success" });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "error", duration: 7000 });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "warning", duration: 6000 });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "info" });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
}
