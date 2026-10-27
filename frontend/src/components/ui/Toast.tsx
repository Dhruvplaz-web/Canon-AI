"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ToastMessage {
  id: string;
  type?: "success" | "error" | "info";
  title?: string;
  message: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export interface ToastOptions {
  title?: string;
  description?: string;
  message?: string;
  variant?: "default" | "destructive" | "success" | "info";
  type?: "success" | "error" | "info";
}

type ToastListener = (toast: Omit<ToastMessage, "id">) => void;
const toastListeners = new Set<ToastListener>();

export function toast(options: ToastOptions | string) {
  if (typeof options === "string") {
    toastListeners.forEach((fn) => fn({ message: options, type: "info" }));
    return;
  }
  const type =
    options.type ||
    (options.variant === "destructive" ? "error" : options.variant === "success" ? "success" : "info");
  const message = options.description || options.message || options.title || "";
  const title = options.description || options.message ? options.title : undefined;

  toastListeners.forEach((fn) => fn({ title, message, type }));
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toastItem: Omit<ToastMessage, "id">) => {
      const id = "toast-" + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { ...toastItem, id }]);
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  React.useEffect(() => {
    toastListeners.add(addToast);
    return () => {
      toastListeners.delete(addToast);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";

        return (
          <div
            key={t.id}
            role="status"
            className={twMerge(
              clsx(
                "pointer-events-auto flex items-start gap-3 p-3.5 rounded-[var(--radius-button)] border shadow-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-all animate-in fade-in slide-in-from-bottom-2",
                isSuccess && "border-[var(--status-pass-border)] bg-[var(--status-pass-bg)]",
                isError && "border-[var(--status-critical-border)] bg-[var(--status-critical-bg)]",
                !isSuccess && !isError && "border-[var(--color-border-subtle)]"
              )
            )}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-[var(--status-pass-accent)]" />}
              {isError && <AlertCircle className="w-4 h-4 text-[var(--status-critical-accent)]" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-[var(--color-primary)]" />}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <h4 className="text-xs font-semibold leading-tight">{t.title}</h4>}
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-0.5">
                {t.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[var(--color-text-muted)] cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </aside>
  );
}
