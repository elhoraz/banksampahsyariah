'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '@/lib/audio';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface AlertDialogOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
  showAlert: (message: string, options?: AlertDialogOptions | string) => Promise<boolean>;
  showConfirm: (message: string, options?: AlertDialogOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeDialog, setActiveDialog] = useState<{
    isOpen: boolean;
    message: string;
    options: AlertDialogOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      
      if (type === 'success') {
        soundManager.playSuccessTone();
      } else {
        soundManager.playClickTone();
      }

      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: useCallback((message: string, title?: string) => addToast('success', message, title), [addToast]),
    error: useCallback((message: string, title?: string) => addToast('error', message, title), [addToast]),
    info: useCallback((message: string, title?: string) => addToast('info', message, title), [addToast]),
    warning: useCallback((message: string, title?: string) => addToast('warning', message, title), [addToast]),
  };

  const showAlert = useCallback(
    (message: string, options?: AlertDialogOptions | string): Promise<boolean> => {
      soundManager.playClickTone();
      return new Promise<boolean>((resolve) => {
        const opts: AlertDialogOptions =
          typeof options === 'string'
            ? { title: options, confirmText: 'Mengerti' }
            : {
                title: options?.title || 'Pemberitahuan Sistem Syariah',
                confirmText: options?.confirmText || 'Mengerti',
                type: options?.type || 'info',
                ...options,
              };

        setActiveDialog({
          isOpen: true,
          message,
          options: opts,
          resolve,
        });
      });
    },
    []
  );

  const showConfirm = useCallback(
    (message: string, options?: AlertDialogOptions): Promise<boolean> => {
      soundManager.playClickTone();
      return new Promise<boolean>((resolve) => {
        const opts: AlertDialogOptions = {
          title: options?.title || 'Konfirmasi Tindakan',
          confirmText: options?.confirmText || 'Ya, Lanjutkan',
          cancelText: options?.cancelText || 'Batal',
          type: options?.type || 'warning',
          ...options,
        };

        setActiveDialog({
          isOpen: true,
          message,
          options: opts,
          resolve,
        });
      });
    },
    []
  );

  const handleDialogConfirm = () => {
    soundManager.playClickTone();
    if (activeDialog) {
      activeDialog.options.onConfirm?.();
      activeDialog.resolve(true);
      setActiveDialog(null);
    }
  };

  const handleDialogCancel = () => {
    soundManager.playClickTone();
    if (activeDialog) {
      activeDialog.options.onCancel?.();
      activeDialog.resolve(false);
      setActiveDialog(null);
    }
  };

  return (
    <ToastContext.Provider value={{ toast, showAlert, showConfirm }}>
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="assertive"
        className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 z-50 flex flex-col gap-2.5 pointer-events-none sm:max-w-md w-full"
      >
        {toasts.map((item) => {
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
          let borderClass = 'border-emerald-500/40';
          let bgClass = 'bg-white/95';

          if (item.type === 'error') {
            icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
            borderClass = 'border-rose-500/40';
          } else if (item.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
            borderClass = 'border-[#D4AF37]/60';
          } else if (item.type === 'info') {
            icon = <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />;
            borderClass = 'border-sky-500/40';
          }

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-xl border ${borderClass} ${bgClass} text-stone-900 transition-all animate-in fade-in slide-in-from-top-3 duration-200`}
            >
              {icon}
              <div className="flex-1 min-w-0 pr-1">
                {item.title && (
                  <div className="font-extrabold text-xs text-stone-900 mb-0.5">
                    {item.title}
                  </div>
                )}
                <div className="text-xs text-stone-700 leading-relaxed font-medium">
                  {item.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Luxury Syariah Alert/Confirm Modal Dialog */}
      {activeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="card-luxury w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-[#D4AF37]/40 space-y-5 bg-[#FAF8F5] relative animate-in zoom-in-95 duration-150">
            {/* Header Accent */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#064E3B] to-[#043327] text-[#D4AF37] flex items-center justify-center border border-amber-300/40 shadow-sm shrink-0">
                {activeDialog.options.type === 'danger' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-300" />
                ) : activeDialog.options.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-[#FCE999]" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#FCE999]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-base text-stone-900 tracking-tight leading-tight">
                  {activeDialog.options.title || 'Pemberitahuan Sistem'}
                </h3>
                <span className="text-[10px] text-[#78581A] font-bold uppercase tracking-wider">
                  Bank Sampah Syariah UINSA
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 text-xs sm:text-sm text-stone-700 leading-relaxed">
              {activeDialog.message}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              {activeDialog.options.cancelText && (
                <button
                  type="button"
                  onClick={handleDialogCancel}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all shadow-2xs active:scale-95"
                >
                  {activeDialog.options.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleDialogConfirm}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#064E3B] to-[#0B5E47] hover:from-[#053F30] hover:to-[#084D3A] text-[#F7F1E1] text-xs font-bold border border-amber-300/40 shadow-sm transition-all active:scale-95"
              >
                {activeDialog.options.confirmText || 'Mengerti'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
